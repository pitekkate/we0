import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { GeneralSettings } from "./GeneralSettings"
import { QuotaSettings } from "./QuotaSettings"
import { useTranslation } from "react-i18next"

export type SettingsTab = "General" | "Quota"

export const TAB_KEYS = {
  GENERAL: "General" as const,
  Quota: "Quota" as const,
} as const

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsTab
}

export function Settings({
  isOpen,
  onClose,
  initialTab = TAB_KEYS.GENERAL,
}: SettingsProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const { t } = useTranslation()

  useEffect(() => {
    console.log("Initial Tab:", initialTab)
    console.log("Active Tab:", activeTab)
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    console.log("Active Tab Changed:", activeTab)
  }, [activeTab])

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setMounted(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!mounted) return null

  const tabs = [
    {
      id: TAB_KEYS.GENERAL,
      label: t("settings.general"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: TAB_KEYS.Quota,
      label: t("settings.Quota"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
  ]

  return createPortal(
    <div
      className={`
        fixed inset-0 z-40 flex items-center justify-center
        transition-all duration-300 ease-out
        ${isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div
        className={`
          fixed inset-0 bg-black/50 dark:bg-black/60
          transition-opacity duration-300 ease-out
          ${isAnimating ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
      />

      <div
        className={`
          relative flex bg-white dark:bg-[#18181a] w-[800px] h-[600px] rounded-lg shadow-xl
          transition-all duration-300 ease-out
          ${
            isAnimating
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95"
          }
        `}
      >
        {/* Sidebar */}
        <div className="w-56 border-r border-gray-200 dark:border-[#333333] p-3">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 rounded-lg
                  transition-colors text-[14px]
                  ${
                    activeTab === tab.id
                      ? "bg-gray-100 dark:bg-[#333333] text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-white"
                  }
                `}
              >
                {tab.icon}
                <span className="translate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === TAB_KEYS.GENERAL && <GeneralSettings />}
          {activeTab === TAB_KEYS.Quota && <QuotaSettings />}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 transition-colors top-3 right-3 hover:text-gray-900 dark:hover:text-white"
          aria-label={t("common.close")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}
