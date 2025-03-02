import { PostHog } from "posthog-js";

declare global {
  interface Window {
    isLoading: boolean;
    getCurrentDir: () => string;
    Posthog: PostHog
    fileHashMap: Map<string, string>;
    electron: {
      ipcRenderer: IpcRenderer;
    }
    myAPI: {
      dialog: {
        showOpenDialog: (options: { properties: string[] }) => Promise<{ canceled: boolean; filePaths: string[] }>;
      };
    };
  }

  // IPC 相关类型定义
  interface IpcRenderer {
    invoke(channel: IpcChannel, ...args: any[]): Promise<any>;
    on(channel: string, listener: (...args: any[]) => void): void;
    removeListener(channel: string, listener: (...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
  }

  // IPC 通道名称类型
  type IpcChannel = 
    | 'node-container:init'
    | 'node-container:mkdir'
    | 'node-container:writeFile'
    | 'node-container:readFile'
    | 'node-container:readdir'
    | 'node-container:platform'
    | 'node-container:set-now-path'
    | 'node-container:get-project-root'
    | 'node-container:spawn'
    | 'node-container:wait-exit'
    | 'node-container:kill-process'
    | 'node-container:stop-server'
    | 'node-container:stat'
    | 'node-container:sync-filesystem'
    | 'node-container:check-file-exists'
    | 'node-container:get-parent-paths'
    | 'node-container:exec-command'
    | 'terminal:create'
    | 'terminal:write'
    | 'terminal:resize'
    | 'terminal:dispose'
    | 'open:external:url';

  // 文件系统相关类型
  interface FileStats {
    isDirectory: boolean;
    isFile: boolean;
    size: number;
    mtime: Date;
  }

  // 进程相关类型
  interface SpawnOptions {
    cwd?: string;
    processId?: string;
  }

  interface TerminalOptions {
    cols?: number;
    rows?: number;
    processId?: string;
  }

  interface ProcessResult {
    processId: string;
  }

  // 父路径返回类型
  interface ParentPaths {
    parentPath: string;
    grandParentPath: string;
    lastGrandParentPath: string;
  }

  // PTY 进程类型
  interface PtyProcess {
    write(data: string): void;
    resize(cols: number, rows: number): void;
    kill(): void;
    onData(callback: (data: string) => void): void;
  }
}

export {};

