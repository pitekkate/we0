import { FileAction, StreamingMessageParser } from "./messae";


import { createFileWithContent } from "../WeIde/components/IDEContent/FileExplorer/utils/fileSystem";
import useTerminalStore from "@/stores/terminalSlice";
import { Message } from "ai/react";

class List {
  private queue: string[] = [];
  private processing: boolean = false;

  // 添加命令到队列
  push(command: string) {
    this.queue.push(command);
    this.process();
  }

  // 获取队列中的下一个命令
  private getNext(): string | undefined {
    return this.queue.shift();
  }

  // 处理队列
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const command = this.getNext();
        if (command) {
          console.log("执行命令", command);
          await useTerminalStore.getState().getTerminal(0).executeCommand(command);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // 清空队列
  clear() {
    this.queue = [];
    this.processing = false;
  }
}

const execList = new List();

const messageParser = new StreamingMessageParser({
  callbacks: {
    onActionClose: async (data) => {
      if (data.action.type === "shell") {
        const command = data.action.content.replace(/\n/g, "").trim();
        execList.push(command);
        if(messageParser.isUseStartCommand){
          messageParser.isUseStartCommand = false
        }
      } 
      if (data.action.type === "start") {
        const command = data.action.content.replace(/\n/g, "").trim();
        execList.push(command);
        messageParser.isUseStartCommand = true;
      }
    },
    onActionStream: async (data) => {
       createFileWithContent((data.action as FileAction).filePath, data.action.content, true);
      //   workbenchStore.runAction(data, true);
    },
  },
});


export const parseMessages = async (messages: Message[]) => {
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role === "assistant") {
      messageParser.parse(message.id, message.content);
    }
  }
}