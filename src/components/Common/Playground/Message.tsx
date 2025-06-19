/**
 * PlaygroundMessage Component
 * 
 * A comprehensive message component that displays individual chat messages with various
 * interactive features and styling options. Supports both bot and user messages.
 * 
 * Features:
 * - Markdown rendering for bot messages
 * - Text-to-speech functionality
 * - Message editing
 * - Image attachments
 * - Source citations
 * - Generation info display
 */

import Markdown from "../Markdown"
import React from "react"
import { Tag, Image, Tooltip, Collapse, Popover } from "antd"
import { WebSearch } from "./WebSearch"
import { MoreOptions } from "../../Layouts/MoreOptions"

import {
  CheckIcon,
  ClipboardIcon,
  RotateCcw,
  Square,
  BookType,
  NotebookPen,
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

/**
 * Props interface for the PlaygroundMessage component
 */
type Props = {
  message: string                    // The actual message content
  message_type?: string             // Type of message (e.g., system, user, assistant)
  hideCopy?: boolean               // Whether to hide the copy button
  botAvatar?: JSX.Element          // Custom avatar for bot messages
  userAvatar?: JSX.Element         // Custom avatar for user messages
  isBot: boolean                   // Whether the message is from a bot
  name: string                     // Name of the message sender
  images?: string[]                // Array of image URLs to display
  currentMessageIndex: number      // Current index in the message list
  totalMessages: number           // Total number of messages
  onRengerate: () => void         // Callback to regenerate the message
  onEditFormSubmit: (value: string, isSend: boolean) => void  // Callback when editing message
  isProcessing: boolean           // Whether the message is being processed
  webSearch?: {}                  // Web search data
  isSearchingInternet?: boolean   // Whether currently searching the internet
  sources?: any[]                 // Sources/citations for the message
  hideEditAndRegenerate?: boolean // Whether to hide edit and regenerate options
  onSourceClick?: (source: any) => void  // Callback when clicking a source
  isTTSEnabled?: boolean         // Whether text-to-speech is enabled
  generationInfo?: any          // Information about message generation
  isStreaming: boolean          // Whether the message is currently streaming
  reasoningTimeTaken?: number   // Time taken for reasoning/processing
  openReasoning?: boolean       // Whether the reasoning is open
  isThinking?: boolean         // Whether the bot is currently thinking
  modelImage?: string          // Image URL for the model avatar
  modelName?: string          // Name of the model being used
}

export const PlaygroundMessage = (props: Props) => {
  // State for managing UI interactions
  const [isBtnPressed, setIsBtnPressed] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)

  // Hooks for translations and text-to-speech
  const { t } = useTranslation("common")
  const { cancel, isSpeaking, speak } = useTTS()

  return (
    <div className={`relative flex flex-col ${props.isBot ? 'items-start' : 'items-start'} justify-center w-full max-w-4xl pb-1 text-gray-800 group md:px-3 lg:w-4/5 dark:text-violet-300`}>
      {/* Message container with avatar and content */}
      <div className={`flex flex-row w-full gap-2 px-3 m-auto mt-0 mb-2 md:gap-3 ${props.isBot ? '' : 'flex-row-reverse'}`}>
        {/* Avatar section */}
        <div className={`relative flex flex-col items-end w-8 ${props.isBot ? '' : '-mr-12'}`}>
          <div className="relative flex items-center justify-center p-1 text-white rounded-sm opacity-90 h-7 w-7">
            {props.isBot ? (
              !props.botAvatar ? (
                // Default bot avatar
                <div className="flex border border-gray-400 dark:border-gray-400 items-center justify-center p-1.5 bg-gray-200 rounded-full group hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-500  drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.4)] ">
                  <Brain className="w-5 h-5 text-gray-600 group-hover:text-indigo-700 dark:text-stone-200 dark:group-hover:text-gray-300" />
                </div>
              ) : (
                props.botAvatar
              )
            ) : (
              !props.userAvatar ? (
                <div className="flex border border-gray-400 dark:border-gray-400 items-center justify-center p-1.5 bg-gray-200 rounded-full group hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-500 drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.4)]">
                  <UserPlus className="w-4 h-4 text-gray-600 group-hover:text-indigo-700 dark:text-stone-100 dark:group-hover:text-gray-300" />
                </div>
              ) : (
                props.userAvatar
              )
            )}
          </div>
        </div>

        {/* Message content section */}
        <div className={`flex w-[calc(100%-50px)] flex-col gap-1 lg:w-[calc(100%-115px)] ${props.isBot ? '' : 'items-end'}`}>
          {/* Sender name display */}
          <span className={`text-sm font-semibold text-gray-800 dark:text-white px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 inline-block w-fit ${props.isBot ? '' : 'text-right mr-1'}`}>
            {props.isBot
              ? props.name === "chrome::gemini-nano::aurora"
                ? "Gemini Nano"
                : removeModelSuffix(
                  props.name?.replaceAll(/accounts\/[^\/]+\/models\//g, "")
                )
              : "@Human"}
          </span>

          {/* Web search indicator for bot messages */}
          {props.isBot &&
            props.isSearchingInternet &&
            props.currentMessageIndex === props.totalMessages - 1 ? (
            <WebSearch />
          ) : null}

          {/* Message type tag (if present) */}
          <div className={`${props.isBot ? '' : 'text-right'} w-fit`}>
            {props?.message_type && (
              <Tag color={tagColors[props?.message_type] || "default"} className="w-fit">
                {t(`copilot.${props?.message_type}`)}
              </Tag>
            )}
          </div>

          {/* Main message content with markdown support */}
          <div className={`flex flex-col flex-grow ${props.isBot ? 'py-3' : 'py-1'} mx-2 font-normal text-base text-gray-700 bg-gray-200 border border-indigo-400 shadow-lg drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.3)] px-8 opacity-90 dark:bg-gray-800 dark:border-stone-500 inline-block w-fit max-w-full ${props.isBot
            ? 'rounded-2xl rounded-tl-sm'
            : editMode
              ? 'rounded-2xl rounded-tr-sm'
              : 'rounded-2xl rounded-tr-sm'
            }`}>
            {!editMode ? (
              props.isBot ? (
                <>
                  {props.isThinking ? (
                    <div className="flex items-center gap-2 italic text-gray-500 dark:text-white">
                      {/* Loading spinner animation for thinking state
                       * Uses SVG with two parts:
                       * 1. A circle with 25% opacity for the track
                       * 2. A path with 75% opacity for the spinning indicator
                       * The animation is applied via animate-spin class
                       */}
                      <svg className="w-4 h-4 text-orange-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse">Thinking</span>
                      <span className="animate-[ellipsis_1s_ease-in-out_infinite]">...</span>
                    </div>
                  ) : props.message ? (
                    parseReasoning(props.message).map((e, i) => {
                      if (e.type === "reasoning") {
                        return (
                          <Collapse
                            key={i}
                            className="border-none !mb-3"
                            defaultActiveKey={props?.openReasoning ? "reasoning" : undefined}
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
                    })
                  ) : null}
                </>
              ) : (
                <p className={`prose text-base dark:prose-invert px-2 whitespace-pre-line prose-p:leading-relaxed prose-pre:p-0 dark:prose-dark ${props.message_type && "italic text-gray-700 dark:text-stone-400 text-base"}`} style={{ maxWidth: "100ch" }}>
                  {props.message}
                </p>
              )
            ) : (
              <div className="w-full">
                <EditMessageForm
                  value={props.message}
                  onSumbit={props.onEditFormSubmit}
                  onClose={() => setEditMode(false)}
                  isBot={props.isBot}
                />
              </div>
            )}
          </div>

          {/* Image attachments section */}
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

          {/* Sources/Citations section */}
          {props.isBot && props?.sources && props?.sources.length > 0 && (
            <Collapse
              className="mt-2"
              ghost
              items={[
                {
                  key: "1",
                  label: (
                    <div className="inline-block px-3 py-1 text-sm italic text-gray-500 bg-gray-100 rounded-full dark:text-stone-400 dark:bg-gray-800 w-fit">
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

          {/* Message actions toolbar */}
          {!props.isProcessing && !editMode ? (
            <div className={`space-x-2 gap-2 px-3 flex ${props.currentMessageIndex !== props.totalMessages - 1 ? "invisible group-hover:visible" : ""}`}>
              {/* Text-to-speech button */}
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

              {/* Bot-specific actions */}
              {props.isBot && (
                <>
                  {/* Copy button */}
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

                  {/* Generation info button */}
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

                  {/* Regenerate button */}
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

              {/* Edit and more options buttons */}
              {!props.hideEditAndRegenerate && (
                <>
                  <Tooltip title={t("edit")}>
                    <button
                      onClick={() => setEditMode(true)}
                      aria-label={t("edit")}
                      className="flex items-center justify-center w-6 h-6 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <NotebookPen className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                    </button>
                  </Tooltip>

                  <MoreOptions
                    messages={[{
                      message: props.message,
                      isBot: props.isBot,
                      name: props.name,
                      images: props.images || [],
                      sources: props.sources || []
                    }]}
                    historyId={props.currentMessageIndex.toString()}
                    shareModeEnabled={true}
                  />
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