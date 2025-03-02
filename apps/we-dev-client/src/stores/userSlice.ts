import { authService } from "@/api/auth"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export enum TierType {
  FREE = "free",
  PRO = "pro",
  PROMAX = "promax",
}
export interface TierMessage {
  startTime: Date
  tier: TierType
  resetTime: Date
}

export interface User {
  id: string
  username: string
  email: string
  githubId: string
  wechatId: string
  avatar?: string
  userQuota: {
    // 用户当前拥有的配额
    quota: number
    resetTime: Date
    tierType: TierType
    // 加油包的配额
    refillQuota: number
    // 该周期的额度
    usedQuota: number
    quotaTotal: number
    tierMessage: TierMessage
  }
}

interface UserState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  rememberMe: boolean
  isLoginModalOpen: boolean
  setRememberMe: (remember: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  openLoginModal: () => void
  closeLoginModal: () => void
  fetchUser: () => Promise<User>
  isLoading: boolean
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      rememberMe: false,
      isLoginModalOpen: false,
      isLoading: false,

      setRememberMe: (remember) => {
        localStorage.setItem("rememberMe", remember.toString())
        set({ rememberMe: remember })
      },

      setUser: (user) => {
        if (user) {
          localStorage.setItem("user", JSON.stringify(user))
        } else {
          localStorage.removeItem("user")
        }

        set(() => ({
          user,
          isAuthenticated: !!user,
        }))
      },

      setToken: (token) => {
        if (token) {
          localStorage.setItem("token", token)
        } else {
          localStorage.removeItem("token")
        }
        set(() => ({ token }))
      },

      fetchUser: async () => {
        set(() => ({ isLoading: true }))
        try {
          const token = localStorage.getItem("token")
          if (token) {
            const user = await authService.getUserInfo(token)
            get().setUser(user)
            return user
          }
        } catch (error) {
          console.error(error)
        } finally {
          set(() => ({ isLoading: false }))
        }
      },

      login: (user, token) => {
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("token", token)

        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoginModalOpen: false,
        }))
      },

      logout: () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("rememberMe")
        if (!window.electron) {
          document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
          if (process.env.NODE_ENV === "production") {
            document.cookie =
              "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure=true;"
          }
          fetch('/api/logout')
        }
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          rememberMe: false,
        }))
      },

      updateUser: (userData) =>
        set((state) => {
          const newUser = state.user ? { ...state.user, ...userData } : null
          localStorage.setItem("user", JSON.stringify(newUser))

          return { user: newUser }
        }),

      openLoginModal: () =>
        set(() => ({
          isLoginModalOpen: true,
        })),

      closeLoginModal: () =>
        set(() => ({
          isLoginModalOpen: false,
        })),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      // 添加存储版本号，方便后续升级迁移
      version: 1,
      // 初始化时从 localStorage 恢复状态
      onRehydrateStorage: () => (state) => {
        const rememberMe = localStorage.getItem("rememberMe") === "true"
        if (rememberMe) {
          const storedUser = localStorage.getItem("user")
          const storedToken = localStorage.getItem("token")
          if (storedUser && storedToken) {
            state?.setUser(JSON.parse(storedUser))
            state?.setToken(storedToken)
            state?.setRememberMe(true)
          }
        }
      },
    }
  )
)

export default useUserStore
