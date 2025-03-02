import { authService } from "@/api/auth";
import useThemeStore from "@/stores/themeSlice";
import useUserStore from "@/stores/userSlice";
import i18n from "@/utils/i18";
import track from "@/utils/track";
import { useEffect } from "react"

const useInit = (): { isDarkMode: boolean } => {
    const { isDarkMode, setTheme } = useThemeStore()
    const { setUser } = useUserStore()

    // Copy optimization
    useEffect(() => {
        // Add page view tracking
        track.event('we0_page_view', {
            page: 'home'
        });

        const savedTheme = localStorage.getItem("theme") || "dark"
        if (savedTheme) {
            setTheme(savedTheme === "dark")
        } else {
            // If no saved theme setting, use system theme
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
            setTheme(prefersDark)
            localStorage.setItem("theme", prefersDark ? "dark" : "light")
        }

        window?.electron?.ipcRenderer.invoke(
            "node-container:set-now-path",
            ""
        )

        const settingsConfig = JSON.parse(
            localStorage.getItem("settingsConfig") || "{}"
        )
        if (settingsConfig.language) {
            i18n.changeLanguage(settingsConfig.language)
        } else {
            // Get browser language settings
            const browserLang = navigator.language.toLowerCase()
            // If Chinese environment (including simplified and traditional), set to Chinese, otherwise set to English
            const defaultLang = browserLang.startsWith("zh") ? "zh" : "en"

            i18n.changeLanguage(defaultLang)
            // Save to local settings
        }

        // Initialize user info to ensure user-related tables are created
        const fetchUserInfo = async () => {
            const token = localStorage.getItem("token")
            if (token) {
                const user = await authService.getUserInfo(token)
                setUser(user)
            }
        }
        fetchUserInfo()

        const callback = (event: ClipboardEvent) => {
            try {
                navigator.clipboard
                    .writeText(window.getSelection().toString().trim())
                    .then(() => { })
                event.preventDefault()
            } catch (e) { }
        }
        document.addEventListener("copy", callback)

        return () => document.removeEventListener("copy", callback)
    }, [])

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDarkMode])

    return { isDarkMode }

}

export default useInit