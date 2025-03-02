import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./utils/auth"
import { Messages } from "./app/api/chat/action"
import { createI18nMiddleware } from "fumadocs-core/i18n"
import { i18n } from "lib/i18n"
import acceptLanguage from "accept-language"
import { locales, Language } from "./utils/lang"

// 配置 accept-language
acceptLanguage.languages(locales)

// 常量定义
const DEFAULT_LANG = Language.English
const DYNAMIC_LANG_COOKIE = "lang"

// 公开路径配置
const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/model",
  "/api/d2c",
  "/api/upload",
  "/api/chat",
  "/api/payment/callback",
  "/api/appInfo",
  "/api/enhancedPrompt"
] as const

const PUBLIC_PAGES = ["/login", "/register"] as const

// 需要验证的路径
const PROTECTED_PATHS = ["/user", "/dashboard", "/settings"] as const

// CORS 配置
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  "Access-Control-Allow-Credentials": "true",
} as const

// 工具函数
const addCorsHeaders = (response: NextResponse): NextResponse => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

const createErrorResponse = (message: string, status: number): NextResponse => {
  return addCorsHeaders(
    new NextResponse(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  )
}

const getLocaleFromRequest = (request: NextRequest, pathname: string) => {
  let locale = pathname.split("/")[1]
  const isDynamicLocale = !locales.includes(locale as Language)

  if (isDynamicLocale) {
    const cookieLang = request.cookies
      .get(DYNAMIC_LANG_COOKIE)
      ?.value?.replace("_", "-") as Language
    locale = cookieLang || DEFAULT_LANG
  }

  return {
    locale,
    isDynamicLocale,
    // 如果是动态语言路由，返回完整路径；否则移除语言前缀
    pathWithoutLocale: isDynamicLocale
      ? pathname
      : pathname.slice(locale.length + 1),
  }
}

const handleWedevRoute = (request: NextRequest) => {
  const response = NextResponse.rewrite(
    new URL("/wedev_public/index.html", request.url)
  )
  addCorsHeaders(response)
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  return response
}

export default createI18nMiddleware(i18n)

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 处理 CORS 预检请求
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
  }

  // 优先处理 wedev 路由
  if (pathname.startsWith("/wedev")) {
    return handleWedevRoute(request)
  }

  // 获取 token
  const token =
    request.headers.get("Authorization")?.split(" ")[1] ||
    request.cookies.get("token")?.value

  // 获取语言设置和处理后的路径
  const { locale, isDynamicLocale, pathWithoutLocale } = getLocaleFromRequest(
    request,
    pathname
  )

  // 检查路径类型
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathWithoutLocale.startsWith(path)
  )
  const isPublicPage = PUBLIC_PAGES.some((path) =>
    pathWithoutLocale.startsWith(path)
  )
  const isApiPath = pathname.startsWith("/api/")

  // 处理需要保护的路径
  if (isProtectedPath) {
    if (!token) {
      // 构建登录URL，保留原始路径用于重定向
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const decoded = await verifyToken(token)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("userId", decoded.userId)
      // 如果是动态语言路由，需要重写URL
      if (isDynamicLocale) {
        const rewriteUrl = new URL(`/${locale}${pathname}`, request.url)
        const response = NextResponse.rewrite(rewriteUrl)
        response.headers.set("X-NEXT-INTL-LOCALE", locale)
        response.headers.set("userId", decoded.userId)
        return response
      }

      return NextResponse.next({ headers: requestHeaders })
    } catch (error) {
      console.error("Token verification failed:", error)
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 处理公开页面
  if (isPublicPage) {
    if (token) {
      try {
        const decoded = await verifyToken(token)
        if (decoded) {
          return NextResponse.redirect(new URL(`/${locale}/`, request.url))
        }
      } catch (error) {
        console.error("Token verification failed:", error)
      }
    }
  }

  // 处理 API 请求
  if (isApiPath) {
    const isPublicApi = PUBLIC_API_PATHS.some((path) =>
      pathname.startsWith(path)
    )
    if (isPublicApi) {
      if (pathname.startsWith("/api/chat")) {
        const { messages } = (await request.json()) as { messages: Messages }
        if (messages.length <= 10000 && !token) {
          return addCorsHeaders(NextResponse.next())
        }
      } else {
        return NextResponse.next()
      }
    }

    if (!token) {
      return createErrorResponse("Authentication required", 401)
    }

    try {
      const decoded = await verifyToken(token)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("userId", decoded.userId)
      return addCorsHeaders(NextResponse.next({ headers: requestHeaders }))
    } catch (error) {
      return createErrorResponse("Invalid token", 401)
    }
  }

  // 处理动态语言路由
  if (isDynamicLocale) {
    const rewriteUrl = new URL(`/${locale}${pathname}`, request.url)
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set("X-NEXT-INTL-LOCALE", locale)
    response.cookies.set("NEXT_LOCALE", locale)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|wedev).*)",
    "/api/:path*",
    "/wedev/:path*",
  ],
  runtime: "nodejs",
}
