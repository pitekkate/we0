import React, { useState, useRef, useEffect } from "react"
import classNames from "classnames"
import { Tooltip } from "antd"
import { Image, ChevronDown } from "lucide-react"
import type { UploadButtonsProps } from "./types"

import { useTranslation } from "react-i18next"
import { IModelOption } from "../.."
import useChatStore from "@/stores/chatSlice"
import { aiProvierIcon } from "./config"

export const UploadButtons: React.FC<UploadButtonsProps> = ({
  isLoading,
  isUploading,
  onImageClick,
  baseModal,
  setBaseModal,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { modelOptions, clearImages } = useChatStore()
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleModelSelect = (model: IModelOption) => {
    setBaseModal(model)
    setIsOpen(false)
    console.log("Selected model:", model.value)
  }

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2">
        <Tooltip
          title={
            <div className="text-xs">
              <div className="font-medium mb-1">
                {isLoading || isUploading || !baseModal.useImage
                  ? t("chat.buttons.upload_disabled")
                  : t("chat.buttons.upload_image")}
              </div>
              <div className="text-gray-300">
                {isLoading || isUploading
                  ? t("chat.buttons.waiting")
                  : !baseModal.useImage
                    ? t("chat.buttons.not_support_image")
                    : t("chat.buttons.click_to_upload")}
              </div>
            </div>
          }
          placement="bottom"
        >
          <button
            type="button"
            onClick={onImageClick}
            disabled={isLoading || isUploading || !baseModal.useImage}
            className={classNames(
              "p-2 text-gray-600 dark:text-gray-500 flex hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500/20 rounded-lg transition-all duration-200",
              (isLoading || isUploading || !baseModal.useImage) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            <Image className="w-4 h-4" />
          </button>
        </Tooltip>


      </div>

      <div className="relative ml-2" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            "flex items-center justify-between w-[150px] px-2 py-1 text-[11px] text-gray-700 dark:text-gray-300 bg-transparent dark:bg-[#252525] rounded-md transition-colors duration-200",
            isOpen
              ? "bg-gray-100 dark:bg-[#252525]"
              : "hover:bg-gray-100 dark:hover:bg-[#252525]"
          )}
        >
          <span>{baseModal.label}</span>
          <ChevronDown
            className={classNames(
              "w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200",
              isOpen ? "-rotate-180" : "rotate-0"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-1 w-[160px] bg-white dark:bg-[#18181a] border border-gray-200 dark:border-gray-600/30 rounded-lg shadow-lg overflow-hidden z-50">
            <div className="flex flex-col w-full">
              {modelOptions.map((model) => (
                <button
                  key={model.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleModelSelect(model as IModelOption)
                    clearImages()
                  }}
                  className={classNames(
                    "w-full px-3 py-1.5 flex justify-between text-left text-[11px] transition-colors duration-200",
                    "hover:bg-gray-100 dark:hover:bg-[#252525]",
                    baseModal.value === model.value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {model.provider &&
                      aiProvierIcon[model.provider] &&
                      React.createElement(aiProvierIcon[model.provider])}
                    {model.label}
                  </div>
                  {/* TODO 最好之后可以是 tooltip ，不想用 antd，这里不想动了 */}
                  <div className="flex">
                    {model.quota}
                    {/* {Array.from(
                      { length: Math.floor(model.quota) },
                      (_, index) => (
                        <div key={index} className="flex">
                          <span className="icon-[line-md--star-filled] text-primary"></span>
                        </div>
                      )
                    )}
                    {model.quota % 1 !== 0 && (
                      <span className="icon-[line-md--star-filled-half] text-primary"></span>
                    )} */}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
