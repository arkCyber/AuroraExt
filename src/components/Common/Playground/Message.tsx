import Markdown from "../Markdown"
import React from "react"
import { Tag, Image, Tooltip, Collapse, Popover } from "antd"
import { WebSearch } from "./WebSearch"

import {
  CheckIcon,
  ClipboardIcon,
  RotateCcw,
  Square,
  BookType,
  NotebookPen,
  MoreVertical,
  Volume2,
  Copy,
  Brain,
  UserPlus,
} from "lucide-react"

import { EditMessageForm } from "./EditMessageForm"
import { useTranslation } from "react-i18next"
import { MessageSource } from "./MessageSource"
import { useTTS } from "@/hooks/useTTS"
import { tagColors } from "@/utils/color"
import { removeModelSuffix } from "@/db/models"
import { GenerationInfo } from "./GenerationInfo"
import { parseReasoning } from "@/libs/reasoning"
import { humanizeMilliseconds } from "@/utils/humanize-milliseconds"

type Props = {
  message: string
  message_type?: string
  hideCopy?: boolean
  botAvatar?: JSX.Element
  userAvatar?: JSX.Element
  isBot: boolean
  name: string
  images?: string[]
  currentMessageIndex: number
  totalMessages: number
  onRengerate: () => void
  onEditFormSubmit: (value: string, isSend: boolean) => void
  isProcessing: boolean
  webSearch?: {}
  isSearchingInternet?: boolean
  sources?: any[]
  hideEditAndRegenerate?: boolean
  onSourceClick?: (source: any) => void
  isTTSEnabled?: boolean
  generationInfo?: any
  isStreaming: boolean
  reasoningTimeTaken?: number
}

export const PlaygroundMessage = (props: Props) => {
  const [isBtnPressed, setIsBtnPressed] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)

  const { t } = useTranslation("common")
  const { cancel, isSpeaking, speak } = useTTS()

  return (
    <div className="relative flex flex-col items-end justify-center w-full max-w-4xl pb-1 text-gray-800 group md:px-3 lg:w-4/5 dark:text-violet-300">
      <div className="flex flex-row w-full gap-4 px-3 m-auto my-2 md:gap-6">
        <div className="relative flex flex-col items-end w-8">
          <div className="relative flex items-center justify-center p-1 text-white rounded-sm opacity-90 h-7 w-7">
            {props.isBot ? (
              !props.botAvatar ? (
                <div className="flex border border-gray-400 dark:border-gray-400 items-center justify-center p-1.5 bg-gray-200 rounded-full group hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-500  drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.4)] ">
                  <Brain className="w-5 h-5 text-gray-600 group-hover:text-indigo-700 dark:text-stone-200 dark:group-hover:text-gray-300" />
                </div>
              ) : (
                props.botAvatar
              )
            ) : !props.userAvatar ? (
              <div className="flex border border-gray-400 dark:border-gray-400 items-center justify-center p-1.5 bg-gray-200 rounded-full drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.4)] group hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-500 ">
                <UserPlus className="w-4 h-4 text-gray-600 group-hover:text-indigo-700 dark:text-stone-100 dark:group-hover:text-gray-300" />
              </div>
            ) : (
              props.userAvatar
            )}
          </div>
        </div>
        <div className="flex w-[calc(100%-50px)] flex-col gap-2 lg:w-[calc(100%-115px)]">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {props.isBot
              ? props.name === "chrome::gemini-nano::aurora"
                ? "Gemini Nano"
                : removeModelSuffix(
                  props.name?.replaceAll(/accounts\/[^\/]+\/models\//g, "")
                )
              : "@Human"}
          </span>

          {props.isBot &&
            props.isSearchingInternet &&
            props.currentMessageIndex === props.totalMessages - 1 ? (
            <WebSearch />
          ) : null}
          <div>
            {props?.message_type && (
              <Tag color={tagColors[props?.message_type] || "default"}>
                {t(`copilot.${props?.message_type}`)}
              </Tag>
            )}
          </div>
          <div className="flex flex-col flex-grow w-full py-3 mx-2 font-normal text-gray-700 bg-gray-100 border border-indigo-400 rounded-lg shadow-lg drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.3)]  px-11 opacity-90 dark:bg-gray-800 dark:border-stone-500">
            {!editMode ? (
              props.isBot ? (
                <>
                  {parseReasoning(props.message).map((e, i) => {
                    if (e.type === "reasoning") {
                      return (
                        <Collapse
                          key={i}
                          className="border-none !mb-3"
                          items={[
                            {
                              key: "reasoning",
                              label:
                                props.isStreaming && e?.reasoning_running ? (
                                  <div className="flex items-center gap-2 dark:text-stone-400">
                                    <span className="italic">
                                      {t("reasoning.thinking")}
                                    </span>
                                  </div>
                                ) : (
                                  t("reasoning.thought", {
                                    time: humanizeMilliseconds(
                                      props.reasoningTimeTaken
                                    )
                                  })
                                ),
                              children: <Markdown message={e.content} />
                            }
                          ]}
                        />
                      )
                    }

                    return <Markdown key={i} message={e.content} />
                  })}
                </>
              ) : (
                <p
                  className={`prose dark:prose-invert px-2 whitespace-pre-line prose-p:leading-relaxed prose-pre:p-0 dark:prose-dark ${props.message_type &&
                    "italic text-gray-700 dark:text-stone-400 text-sm"
                    }`}
                  style={{ maxWidth: "100ch" }} // 设置每行显示 100 个字符
                >
                  {props.message}
                </p>
              )
            ) : (
              <EditMessageForm
                value={props.message}
                onSumbit={props.onEditFormSubmit}
                onClose={() => setEditMode(false)}
                isBot={props.isBot}
              />
            )}
          </div>

          {props.images &&
            props.images.filter((img) => img.length > 0).length > 0 && (
              <div>
                {props.images
                  .filter((image) => image.length > 0)
                  .map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt="Uploaded Image"
                      width={180}
                      className="relative rounded-md"
                    />
                  ))}
              </div>
            )}

          {props.isBot && props?.sources && props?.sources.length > 0 && (
            <Collapse
              className="mt-3"
              ghost
              items={[
                {
                  key: "1",
                  label: (
                    <div className="italic text-gray-500 dark:text-stone-400">
                      {t("citations")}
                    </div>
                  ),
                  children: (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {props?.sources?.map((source, index) => (
                        <MessageSource
                          onSourceClick={props.onSourceClick}
                          key={index}
                          source={source}
                        />
                      ))}
                    </div>
                  )
                }
              ]}
            />
          )}

          {!props.isProcessing && !editMode ? (
            <div
              className={`space-x-2 gap-2 px-3 flex ${props.currentMessageIndex !== props.totalMessages - 1
                ? "invisible group-hover:visible"
                : ""
                }`}
            >
              {props.isTTSEnabled && (
                <Tooltip title={t("tts")}>
                  <button
                    aria-label={t("tts")}
                    onClick={() => {
                      if (isSpeaking) {
                        cancel()
                      } else {
                        speak({
                          utterance: props.message
                        })
                      }
                    }}
                    className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    {!isSpeaking ? (
                      <Volume2 className="w-5 h-5 text-gray-400 dark:group-hover:text-violet-300 group-hover:text-indigo-700" />
                    ) : (
                      <Square className="w-4 h-4 text-red-400 dark:group-hover:text-red-100 group-hover:text-red-500 animate-pulse" />
                    )}
                  </button>
                </Tooltip>
              )}
              {props.isBot && (
                <>
                  {!props.hideCopy && (
                    <Tooltip title={t("copyToClipboard")}>
                      <button
                        aria-label={t("copyToClipboard")}
                        onClick={() => {
                          navigator.clipboard.writeText(props.message)
                          setIsBtnPressed(true)
                          setTimeout(() => {
                            setIsBtnPressed(false)
                          }, 2000)
                        }}
                        className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        {!isBtnPressed ? (
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                        ) : (
                          <CheckIcon className="w-4 h-4 text-green-400 group-hover:text-green-600" />
                        )}
                      </button>
                    </Tooltip>
                  )}

                  {props.generationInfo && (
                    <Popover
                      content={
                        <GenerationInfo generationInfo={props.generationInfo} />
                      }
                      title={t("generationInfo")}
                    >
                      <button
                        aria-label={t("generationInfo")}
                        className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <BookType className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                      </button>
                    </Popover>
                  )}

                  {!props.hideEditAndRegenerate &&
                    props.currentMessageIndex === props.totalMessages - 1 && (
                      <Tooltip title={t("regenerate")}>
                        <button
                          aria-label={t("regenerate")}
                          onClick={props.onRengerate}
                          className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                        </button>
                      </Tooltip>
                    )}
                </>
              )}

              {!props.hideEditAndRegenerate && (
                <>
                  {/* NotebookPen 按钮 */}
                  <Tooltip title={t("edit")}>
                    <button
                      onClick={() => setEditMode(true)}
                      aria-label={t("edit")}
                      className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <NotebookPen className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                    </button>
                  </Tooltip>

                  {/* Ellipsis Vertical 按钮 */}
                  <Tooltip title={t("moreOptions")}>
                    <button
                      aria-label={t("moreOptions")}
                      onClick={() => { }} // 添加一个空函数避免警告
                      className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          ) : (
            <div className="invisible">
              <div className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}