import PreviewIframe from "./PreviewIframe";
import { useState } from "react";
import { useFileStore } from "./WeIde/stores/fileStore";
import WeIde from "./WeIde";
import { useTranslation } from "react-i18next";
import useTerminalStore from "@/stores/terminalSlice";

const ipcRenderer = window?.electron?.ipcRenderer;


// 查找微信开发者工具路径
export async function findWeChatDevToolsPath() {
  try {
    // 通过 IPC 调用主进程方法获取操作系统类型
    const platform = await ipcRenderer.invoke("node-container:platform");
    console.log(platform, "platform");
    if (platform === "win32") {
      // Windows 平台
      const defaultPath =
        process.env.Path.split(";")
          .find((value) => {
            value.includes("微信web开发者工具");
          })
          .split("微信web开发者工具")[0] + "微信web开发者工具/cli.bat";

      try {
        // 检查文件是否存在
        await ipcRenderer.invoke(
          "node-container:check-file-exists",
          defaultPath
        );
        return defaultPath;
      } catch {
        // 如果默认路径不存在，使用 where 命令查找
        const result = await ipcRenderer.invoke(
          "node-container:exec-command",
          "where cli.bat"
        );
        if (!result.trim()) {
          throw new Error("未找到微信开发者工具路径");
        }
        return result.trim();
      }
    } else if (platform === "darwin") {
      // macOS 平台
      const defaultPath =
        "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";

      try {
        // 检查文件是否存在
        await ipcRenderer.invoke(
          "node-container:check-file-exists",
          defaultPath
        );
        return defaultPath;
      } catch {
        // 如果默认路径不存在，使用 find 命令全局搜索
        const result = await ipcRenderer.invoke(
          "node-container:exec-command",
          'find / -name "cli" -type f 2>/dev/null'
        );

        const paths = result
          .split("\n")
          .filter((path) => path.includes("wechatwebdevtools.app"));
        if (paths.length > 0) {
          return paths[0];
        }
        throw new Error("未找到微信开发者工具路径");
      }
    } else {
      throw new Error("不支持的操作系统");
    }
  } catch (error) {
    throw new Error(`查找微信开发者工具失败: ${error.message}`);
  }
}
const EditorPreviewTabs: React.FC = () => {
  const { getFiles, projectRoot } = useFileStore();
  const [showIframe, setShowIframe] = useState<boolean>(false);
  const { t } = useTranslation();

  const {getTerminal} = useTerminalStore();


  const isMinPrograme = getFiles().includes("app.json")

  const openWeChatEditor = async () => {
    if (!window.electron) {
      console.error("Electron not available");
      return;
    }

    try {
      const cliPath = await findWeChatDevToolsPath();   
      if (getFiles().includes("app.json") || getFiles().includes("miniprogram/app.json")) {
        const defaultRoot = await ipcRenderer.invoke(
          "node-container:get-project-root"
        );
        const command = `"${cliPath}" -o "${projectRoot || defaultRoot}" --auto-port`;
        await ipcRenderer.invoke("node-container:exec-command", command);
      }
    } catch (error) {
      console.error("Failed to open WeChat editor:", error);
    }
  };

  const onToggle = () => {
    setShowIframe(!showIframe);
  };

  return (
    <div className="m-1.5 flex-1 relative flex flex-col">
        {/* <TeamExample ></TeamExample> */}
      <div className="flex h-10 gap-0.5 bg-[#f6f6f6] dark:bg-[#1a1a1c] pl-0 pt-1 rounded-t-lg justify-between border-b border-[#e4e4e4] dark:border-[#333]">
        <div className="flex-1 flex">
          <TabButton
            active={!showIframe}
            onClick={onToggle}
            icon={<EditorIcon />}
            label={t("editor.editor")}
          />
          <TabButton
            active={showIframe}
            onClick={() => {
              onToggle();
              openWeChatEditor();
            }}
            icon={<PreviewIcon />}
            label={t("editor.preview")}
          />
        </div>
      </div>


      <div className="flex-1 relative overflow-hidden">
  
        <div
          className={`
          absolute inset-0
          transform transition-all duration-500 ease-in-out
          ${showIframe ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"}
        `}
        >
          <WeIde />
        </div>
        <div
          className={`
          absolute inset-0
          transform transition-all duration-500 ease-in-out
          ${showIframe ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        `}
        >
          <PreviewIframe isMinPrograme={isMinPrograme} setShowIframe={setShowIframe} />
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <div
    onClick={onClick}
    className={`
      px-4 cursor-pointer flex items-center gap-2 text-[13px] rounded-t-md
      transition-all duration-400 ease-in-out min-w-[100px] h-9
      hover:bg-[#e8e8e8] dark:hover:bg-[#2c2c2c] hover:text-[#333] dark:hover:text-white
      ${
        active
          ? "bg-white dark:bg-[#333333] text-[#333] dark:text-white font-medium border-t border-x border-[#e4e4e4] dark:border-[#333] shadow-sm"
          : "bg-transparent text-[#616161] dark:text-[#888]"
      }
    `}
  >
    {icon}
    <span className="translate">{label}</span>
  </div>
);

const EditorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 3L21 3V21H3L3 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 7L17 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 12L17 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PreviewIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 7L12 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 12L17 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default EditorPreviewTabs;
