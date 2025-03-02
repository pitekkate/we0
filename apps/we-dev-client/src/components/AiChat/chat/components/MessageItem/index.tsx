import React, { useState, useCallback, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ArtifactView } from "../ArtifactView";
import { ImageGrid } from "../ImageGrid";
import { Message } from "ai";
import { memo } from "react";

import classNames from "classnames";
import useUserStore from "../../../../../stores/userSlice";
import useThemeStore from "@/stores/themeSlice";
import hljs from "highlight.js";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github.css"; // 亮色主题
import "highlight.js/styles/github-dark.css"; // 暗色主题
import { message } from "antd";

// 添加处理流式parts的函数
export const processStreamParts = (parts: Message["parts"]): string => {
  let result = "";
  let thinkContent = "";

  // 首先处理所有reasoning类型的内容
  parts?.forEach((part) => {
    if (part.type === "reasoning") {
      thinkContent += part.reasoning;
    }
  });

  // 如果有reasoning内容，将其转换为markdown引用格式
  if (thinkContent) {
    result +=
      thinkContent
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n") + "\n\n";
  }

  // 添加其他类型的内容
  parts?.forEach((part) => {
    if (part.type === "text") {
      // 检查是否包含think标签，如果有则进行处理
      if (isThinkContent(part.text)) {
        result += processThinkContent(part.text);
      } else {
        result += part.text;
      }
    }
  });

  const artifactIndex = result.indexOf("<boltArtifact");
  const preContent =
    artifactIndex > 0 ? result.substring(0, artifactIndex) : result;
  return preContent.trim();
};

interface MessageItemProps {
  message: Message & {
    experimental_attachments?: Array<{
      id: string;
      name: string;
      type: string;
      localUrl: string;
      contentType: string;
      url: string;
    }>;
  };
  isLoading: boolean;
  isEndMessage: boolean;
  handleRetry: () => void;
}

const isArtifactContent = (content: string) => {
  return content.includes("<boltArtifact");
};

const getArtifactTitle = (content: string) => {
  const match = content.match(/title="([^"]+)"/);
  return match ? match[1] : "Task";
};

// 如果生成结束了，user在最后，就要展示重试
const isShowRetry = (isUser: boolean, isLoading: boolean, isEndMessage:boolean) => {
  return isUser && !isLoading && isEndMessage; 
};

// 添加图片预览组件
const ImagePreview = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <img
          src={src}
          alt="Preview"
          className="object-contain max-w-full max-h-[90vh]"
        />
        <button
          className="absolute text-white top-4 right-4 hover:text-gray-300"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
    </div>
  );
};

// 添加获取首字母的辅助函数
const getInitial = (name: string | null | undefined): string => {
  if (!name) return "U";

  // 尝试获取第一个英文字母
  const englishMatch = name.match(/[a-zA-Z]/);
  if (englishMatch) {
    return englishMatch[0].toUpperCase();
  }

  // 如果没有英文字母，返回第一个字符
  return name.charAt(0).toUpperCase();
};

// 添加自定义样式处理
const customHighlight = (code: string, language: string) => {
  try {
    const highlighted = hljs.highlight(code.trim(), {
      language: language || "plaintext",
      ignoreIllegals: true,
    }).value;
    return highlighted;
  } catch (e) {
    return code;
  }
};

// 使用 memo 包裹 CodeBlock 组件以避免不必要的重渲染
export const CodeBlock = memo(
  ({
    language,
    filePath,
    children,
  }: {
    language: string;
    filePath?: string;
    children: string;
  }) => {
    const [copied, setCopied] = useState(false);
    const { isDarkMode } = useThemeStore();

    const highlightedCode = useMemo(() => {
      return customHighlight(children, language);
    }, [children, language]);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [children]);

    return (
      <div className="my-1">
        <div className="rounded-lg overflow-hidden group border dark:border-[#333] shadow-sm">
          <div className="flex items-center justify-between px-2 py-0.5 border-b dark:border-[#333] bg-gray-50 dark:bg-[#2d2d2d]">
            <div className="flex items-center gap-2.5">
              {filePath ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#6e7681] dark:text-gray-400"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {filePath}
                  </span>
                </div>
              ) : language ? (
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {language}
                </div>
              ) : null}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center w-6 h-6 p-1 text-gray-500 transition-opacity opacity-0 group-hover:opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {copied ? (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
          <div className="overflow-hidden bg-white dark:bg-[#18181a]">
            <div
              className={`overflow-x-auto scrollbar-none px-3 py-1 ${isDarkMode ? "hljs-dark" : "hljs-light"}`}
            >
              <pre className="!m-0 leading-[1.2]">
                <code
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  className={`language-${language || "plaintext"} text-xs`}
                />
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.language === nextProps.language &&
      prevProps.filePath === nextProps.filePath &&
      prevProps.children === nextProps.children
    );
  }
);

CodeBlock.displayName = "CodeBlock";

// 添加检查是否是 think 内容的函数
export const isThinkContent = (content: string) => {
  return content.includes("<think>") || content.includes("</think>");
};

// 修改 processThinkContent 函数
export const processThinkContent = (content: string) => {
  let isInThinkBlock = false;
  let result = "";

  // 按行处理内容
  const lines = content.split("\n");
  for (let line of lines) {
    if (line.includes("<think>")) {
      isInThinkBlock = true;
      line = line.replace(/<think>/g, "").trim();
      if (line) {
        result += `> ${line}\n`;
      }
      continue;
    }

    if (line.includes("</think>")) {
      isInThinkBlock = false;
      line = line.replace(/<\/think>/g, "").trim();
      if (line) {
        result += `> ${line}\n`;
      }
      result += "\n"; // 在think块结束后添加空行
      continue;
    }

    if (isInThinkBlock) {
      result += line.trim() ? `> ${line}\n` : ">\n";
    } else {
      result += `${line}\n`;
    }
  }

  return result.trim();
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLoading,
  isEndMessage,
  handleRetry
}) => {
  const { user } = useUserStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const handleCopyMessage = useCallback(async () => {
    try {
      const textContent = processStreamParts(message.parts);
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  }, [message.parts]);

  const initial = isUser ? getInitial(user?.username) : "AI";
  const avatarColor = isUser
    ? "bg-purple-500 dark:bg-purple-600"
    : "bg-gray-100 dark:bg-[rgba(45,45,45)]";
  return (
    <div className="group relative">
      <div className="flex flex-col gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start gap-2">
          <div
            className={classNames(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs border border-gray-200 dark:border-gray-700/50 overflow-hidden",
              avatarColor,
              isUser ? "text-white" : "text-gray-700 dark:text-gray-300"
            )}
          >
            {isUser ? (
              user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username || "User"}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-medium">{initial}</span>
              )
            ) : (
              <span className="font-medium">AI</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isArtifactContent(message.content) ? (
              <ArtifactView
                isUser={isUser}
                title={getArtifactTitle(message.content)}
                message={message}
                isComplete={!isLoading}
              />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="leading-relaxed prose-sm prose text-gray-900 dark:text-gray-100 dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)(?::(.+))?/.exec(
                          className || ""
                        );
                        const isInline = !match;

                        if (isInline) {
                          return (
                            <code
                              className="font-mono text-sm px-1.5 py-0.5 rounded bg-gray-50 dark:bg-[#282828] text-gray-800 dark:text-gray-300"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }

                        const language = match?.[1] || "";
                        const filePath = match?.[2];
                        // 确保 children 是字符串类型
                        const content = Array.isArray(children)
                          ? children.join("")
                          : String(children).replace(/\n$/, "");

                        return (
                          <CodeBlock language={language} filePath={filePath}>
                            {content}
                          </CodeBlock>
                        );
                      },
                      pre({ children }) {
                        // 直接返回子元素，不需要额外的包装
                        return children;
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return (
                          <ul className="pl-4 mb-2 space-y-1 list-disc">
                            {children}
                          </ul>
                        );
                      },
                      ol({ children }) {
                        return (
                          <ol className="pl-4 mb-2 space-y-1 list-decimal">
                            {children}
                          </ol>
                        );
                      },
                      li({ children }) {
                        return (
                          <li className="text-gray-700 dark:text-gray-300">
                            {children}
                          </li>
                        );
                      },
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        );
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="relative py-2 pl-4 my-2 text-sm text-gray-600 border-l-4 border-purple-200 rounded dark:border-purple-800 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/10 group">
                            <div
                              className={`overflow-hidden transition-all duration-200 ${
                                isCollapsed ? "h-4" : "max-h-none"
                              }`}
                            >
                              {children}
                            </div>
                            {/* 渐变遮罩 */}
                            {isCollapsed && (
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-purple-50 dark:from-[rgba(88,28,135,0.1)] to-transparent" />
                            )}
                            {/* 折叠/展开按钮 */}
                            <button
                              onClick={() => setIsCollapsed(!isCollapsed)}
                              className="absolute p-1 text-purple-600 rounded-full bottom-1 right-2 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                {isCollapsed ? (
                                  <path
                                    d="M12 5v14M5 12h14"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                ) : (
                                  <path
                                    d="M5 12h14"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                )}
                              </svg>
                            </button>
                          </blockquote>
                        );
                      },
                      strong({ children }) {
                        return <strong>{children}</strong>;
                      },
                      em({ children }) {
                        return <em>{children}</em>;
                      },
                      table({ children }) {
                        return (
                          <div className="my-4 overflow-x-auto">
                            <table className="min-w-full border-collapse border dark:border-gray-700">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return (
                          <thead className="bg-purple-50 dark:bg-purple-900/20">
                            {children}
                          </thead>
                        );
                      },
                      tbody({ children }) {
                        return (
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {children}
                          </tbody>
                        );
                      },
                      tr({ children }) {
                        return (
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            {children}
                          </tr>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="px-4 py-2 text-sm font-medium text-left text-purple-700 dark:text-purple-200 border dark:border-gray-700">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border dark:border-gray-700">
                            {children}
                          </td>
                        );
                      },
                    }}
                  >
                    {(() => {
                      return processStreamParts(message.parts);
                    })()}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div className="mt-2">
                  <ImageGrid
                    images={message.experimental_attachments}
                    onImageClick={(url) => setPreviewImage(url)}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
      {previewImage && (
        <ImagePreview
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
      <>
        {!isArtifactContent(message.content) ? (
          <div className="flex items-center justify-end ">
            <button
              onClick={handleCopyMessage}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {copied ? (
                <svg
                  className="w-4 h-4 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
            {isShowRetry(isUser, isLoading, isEndMessage) ? (
              <button
                onClick={() => {
                  handleRetry?.()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="重试"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}
      </>
    </div>
  );
};
