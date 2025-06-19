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
    modelImage?: string          // Image URL for the model
    modelName?: string          // Name of the model
}

export const SidepanelMessage = (props: Props) => {
    // State for managing UI interactions
    const [isBtnPressed, setIsBtnPressed] = React.useState(false)
    const [editMode, setEditMode] = React.useState(false)

    // Hooks for translations and text-to-speech
    const { t } = useTranslation("common")
    const { cancel, isSpeaking, speak } = useTTS()

    return (
        <div className="relative flex flex-col w-full max-w-4xl pb-0.5 text-gray-800 group md:px-2 lg:w-4/5 dark:text-violet-300">
            {/* Message container with avatar and content */}
            <div className="flex flex-col w-full gap-1.5 px-2 m-auto mt-0 mb-1.5 md:gap-2">
                {/* Bot header with avatar and name */}
                {props.isBot ? (
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center w-3 h-3 text-gray-100 rounded-sm opacity-90">
                            {!props.botAvatar ? (
                                <div className="flex items-center justify-center bg-gray-200 border border-gray-400 rounded-full dark:border-gray-400 group hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-500">
                                    <Brain className="w-4 h-4 text-gray-600 group-hover:text-indigo-700 dark:text-stone-200 dark:group-hover:text-gray-300" />
                                </div>
                            ) : (
                                props.botAvatar
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 rounded-full dark:text-gray-100 dark:bg-gray-800 w-fit">
                                {props.name === "chrome::gemini-nano::aurora"
                                    ? "Gemini Nano"
                                    : removeModelSuffix(
                                        props.name?.replaceAll(/accounts\/[^\/]+\/models\//g, "")
                                    )
                                }
                            </span>
                            {props?.message_type && (
                                <Tag color={tagColors[props?.message_type] || "default"} className="w-fit">
                                    {t(`copilot.${props?.message_type}`)}
                                </Tag>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Web search indicator for bot messages */}
                {props.isBot &&
                    props.isSearchingInternet &&
                    props.currentMessageIndex === props.totalMessages - 1 ? (
                    <WebSearch />
                ) : null}

                {/* Message content container */}
                <div className="flex flex-col">
                    {/* Main message content with markdown support */}
                    <div className={`flex flex-col flex-grow py-1 font-normal text-base text-gray-700 bg-gray-100 border border-indigo-400 shadow-lg drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.3)] opacity-90 dark:bg-gray-800 dark:border-stone-500 ${props.isBot
                        ? 'w-full rounded-2xl rounded-tl-sm px-2'
                        : editMode
                            ? 'w-full rounded-2xl rounded-tr-sm ml-auto px-8'
                            : 'max-w-fit rounded-2xl rounded-tr-sm ml-auto px-8'
                        }`}>
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
                                <p className={`prose text-[15px] dark:prose-invert px-2 whitespace-pre-line prose-p:leading-relaxed prose-pre:p-0 dark:prose-dark ${props.message_type && "italic text-gray-700 dark:text-stone-400 text-[15px]"}`} style={{ maxWidth: "100ch" }}>
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
                                    placeholderStyle={{ fontSize: '15px' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Message actions toolbar */}
                    {!props.isProcessing && !editMode ? (
                        <div className={`space-x-1.5 gap-1.5 px-2 flex justify-end mt-1 ${props.currentMessageIndex !== props.totalMessages - 1 ? "invisible group-hover:visible" : ""}`}>
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
                                        className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        {!isSpeaking ? (
                                            <Volume2 className="w-4 h-4 text-gray-400 dark:group-hover:text-violet-300 group-hover:text-indigo-700" />
                                        ) : (
                                            <Square className="w-3.5 h-3.5 text-red-400 dark:group-hover:text-red-100 group-hover:text-red-500 animate-pulse" />
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
                                                className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                {!isBtnPressed ? (
                                                    <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
                                                ) : (
                                                    <CheckIcon className="w-3.5 h-3.5 text-green-400 group-hover:text-green-600" />
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
                                                className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                <BookType className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
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
                                                    className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
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
                                            className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            <NotebookPen className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-violet-300" />
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
                            <div className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"></div>
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
                                        width={150}
                                        className="relative rounded-md"
                                    />
                                ))}
                        </div>
                    )}

                {/* Sources/Citations section */}
                {props.isBot && props?.sources && props?.sources.length > 0 && (
                    <Collapse
                        className="mt-1.5"
                        ghost
                        items={[
                            {
                                key: "1",
                                label: (
                                    <div className="italic text-gray-500 dark:text-stone-400 text-[15px]">
                                        {t("citations")}
                                    </div>
                                ),
                                children: (
                                    <div className="flex flex-wrap gap-1.5 mb-0.5">
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
            </div>
        </div>
    )
}