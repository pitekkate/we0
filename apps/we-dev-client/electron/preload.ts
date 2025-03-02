import { contextBridge, ipcRenderer } from "electron";
import { dialog } from "@electron/remote";
import type { OpenDialogOptions } from 'electron';
import type { IpcRendererEvent } from 'electron';

type ListenerFunction = (...args: unknown[]) => void;
const listeners = new Map<string, ListenerFunction[]>();

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: ListenerFunction) => {
      if (!listeners.has(channel)) {
        listeners.set(channel, []);
      }
      const wrappedFunc = (_: IpcRendererEvent, ...args: unknown[]) => func(...args);
      listeners.get(channel)?.push(wrappedFunc);
      ipcRenderer.on(channel, wrappedFunc);
    },
    removeListener: (channel: string, func: ListenerFunction) => {
      const wrappedFuncs = listeners.get(channel) || [];
      const index = wrappedFuncs.indexOf(func);
      if (index > -1) {
        const wrappedFunc = wrappedFuncs[index];
        ipcRenderer.removeListener(channel, wrappedFunc);
        wrappedFuncs.splice(index, 1);
      }
    },
    send: (channel: string, ...args: unknown[]) => {
      ipcRenderer.send(channel, ...args);
    },
    "terminal:create": (options: TerminalOptions) =>
      ipcRenderer.invoke("terminal:create", options),
    "terminal:write": (processId: string, data: string) =>
      ipcRenderer.invoke("terminal:write", processId, data),
    "terminal:resize": (processId: string, cols: number, rows: number) =>
      ipcRenderer.invoke("terminal:resize", processId, cols, rows),
    "terminal:dispose": (processId: string) =>
      ipcRenderer.invoke("terminal:dispose", processId),
  },
});

// Cleanup function
window.addEventListener("unload", () => {
  listeners.forEach((funcs, channel) => {
    funcs.forEach(func => {
      ipcRenderer.removeListener(channel, func);
    });
  });
  listeners.clear();
});

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type] as string);
  }
});

// Safely expose API to renderer process
contextBridge.exposeInMainWorld("myAPI", {
  dialog: {
    showOpenDialog: (options: OpenDialogOptions) => dialog.showOpenDialog(options),
  },
});
