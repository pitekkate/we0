
import { useFileStore } from "../WeIde/stores/fileStore";
import JSZip from "jszip";
import { OpenDirectoryButton } from "../OpenDirectoryButton";
import { useTranslation } from "react-i18next";
import useChatModeStore from "@/stores/chatModeSlice";
import { ChatMode } from "@/types/chat";

export function HeaderActions() {
  const { files } = useFileStore();
  const { t } = useTranslation();
  const { mode } = useChatModeStore();
  const handleDownload = async () => {
    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content as string);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("下载失败:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {mode === ChatMode.Builder && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{t("header.download")}</span>
          </button>
          {window.electron && <OpenDirectoryButton />}
        </div>
      )}
      {}
    </div>
  );
}
