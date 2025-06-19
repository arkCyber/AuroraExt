import { useForm } from "@mantine/form"
import { useMutation } from "@tanstack/react-query"
import React from "react"
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize"
import { useMessage } from "~/hooks/useMessage"
import { toBase64 } from "~/libs/to-base64"
import { Checkbox, Dropdown, Image, Switch, Tooltip } from "antd"
import { useWebUI } from "~/store/webui"
import { defaultEmbeddingModelForRag } from "~/services/ollama"
import {
  ImageIcon,
  MicIcon,
  StopCircleIcon,
  X,
  EyeIcon,
  EyeOffIcon,
  HelpCircle,
  Mail
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { ModelSelect } from "@/components/Common/ModelSelect"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { PiGlobeX, PiGlobe } from "react-icons/pi"
import { handleChatInputKeyDown } from "@/utils/key-down"
import { getIsSimpleInternetSearch } from "@/services/search"
import { useStorage } from "@plasmohq/storage/hook"

type Props = {
  dropedFile: File | undefined
}

export const SidepanelForm = ({ dropedFile }: Props) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { sendWhenEnter, setSendWhenEnter } = useWebUI()
  const [typing, setTyping] = React.useState<boolean>(false)
  const [hasInput, setHasInput] = React.useState<boolean>(false)
  const { t } = useTranslation(["playground", "common"])
  const [chatWithWebsiteEmbedding] = useStorage(
    "chatWithWebsiteEmbedding",
    true
  )
  const form = useForm({
    initialValues: {
      message: "",
      image: ""
    }
  })
  const {
    transcript,
    isListening,
    resetTranscript,
    start: startListening,
    stop: stopSpeechRecognition,
    supported: browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  const stopListening = async () => {
    if (isListening) {
      stopSpeechRecognition()
    }
  }

  const onInputChange = async (
    e: React.ChangeEvent<HTMLInputElement> | File
  ) => {
    if (e instanceof File) {
      const base64 = await toBase64(e)
      form.setFieldValue("image", base64)
    } else {
      if (e.target.files) {
        const base64 = await toBase64(e.target.files[0])
        form.setFieldValue("image", base64)
      }
    }
  }
  const textAreaFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add CTRL+Shift+3 shortcut to start voice command
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "3") {
      e.preventDefault()
      if (!isListening) {
        resetTranscript()
        startListening({
          continuous: true,
          lang: speechToTextLanguage
        })
      }
    }

    // Add CTRL+Shift+4 shortcut to stop voice command
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "4") {
      e.preventDefault()
      stopListening()
    }

    // Add CTRL+C shortcut to stop streaming
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      stopStreamingRequest()
    }

    // Add CTRL+H shortcut for help
    if (e.ctrlKey && (e.key === "h" || e.key === "H")) {
      e.preventDefault()
      // Show help modal or tooltip
    }

    if (e.key === "Process" || e.key === "229") return
    if (
      handleChatInputKeyDown({
        e,
        sendWhenEnter,
        typing,
        isSending
      })
    ) {
      e.preventDefault()
      form.onSubmit(async (value) => {
        if (value.message.trim().length === 0 && value.image.length === 0) {
          return
        }
        await stopListening()
        if (!selectedModel || selectedModel.length === 0) {
          form.setFieldError("message", t("formError.noModel"))
          return
        }
        if (chatMode === "rag") {
          const defaultEM = await defaultEmbeddingModelForRag()
          if (!defaultEM && chatWithWebsiteEmbedding) {
            form.setFieldError("message", t("formError.noEmbeddingModel"))
            return
          }
        }
        if (webSearch) {
          const defaultEM = await defaultEmbeddingModelForRag()
          const simpleSearch = await getIsSimpleInternetSearch()
          if (!defaultEM && !simpleSearch) {
            form.setFieldError("message", t("formError.noEmbeddingModel"))
            return
          }
        }
        form.reset()
        textAreaFocus()
        await sendMessage({
          image: value.image,
          message: value.message.trim()
        })
      })()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      onInputChange(e.clipboardData.files[0])
    }
  }

  const {
    onSubmit,
    selectedModel,
    chatMode,
    stopStreamingRequest,
    streaming,
    setChatMode,
    webSearch,
    setWebSearch,
    selectedQuickPrompt,
    setSelectedQuickPrompt,
    speechToTextLanguage,
    useOCR,
    setUseOCR,
    defaultInternetSearchOn,
    defaultChatWithWebsite
  } = useMessage()

  React.useEffect(() => {
    if (dropedFile) {
      onInputChange(dropedFile)
    }
  }, [dropedFile])

  useDynamicTextareaSize(textareaRef, form.values.message, 120)

  React.useEffect(() => {
    if (isListening) {
      form.setFieldValue("message", transcript)
    }
  }, [transcript])

  React.useEffect(() => {
    if (selectedQuickPrompt) {
      const word = getVariable(selectedQuickPrompt)
      form.setFieldValue("message", selectedQuickPrompt)
      if (word) {
        textareaRef.current?.focus()
        const interval = setTimeout(() => {
          textareaRef.current?.setSelectionRange(word.start, word.end)
          setSelectedQuickPrompt(null)
        }, 100)
        return () => {
          clearInterval(interval)
        }
      }
    }
  }, [selectedQuickPrompt])

  const { mutateAsync: sendMessage, isPending: isSending } = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      textAreaFocus()
    },
    onError: (error) => {
      textAreaFocus()
    }
  })

  // Handle textarea content changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.getInputProps("message").onChange(e)
    setHasInput(e.target.value.trim().length > 0)
  }

  React.useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].type === "text/plain") {
            e.dataTransfer.items[i].getAsString((text) => {
              form.setFieldValue("message", text)
            })
          }
        }
      }
    }
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    textareaRef.current?.addEventListener("drop", handleDrop)
    textareaRef.current?.addEventListener("dragover", handleDragOver)

    if (defaultInternetSearchOn) {
      setWebSearch(true)
    }

    if (defaultChatWithWebsite) {
      setChatMode("rag")
    }

    return () => {
      textareaRef.current?.removeEventListener("drop", handleDrop)
      textareaRef.current?.removeEventListener("dragover", handleDragOver)
    }
  }, [])

  React.useEffect(() => {
    if (defaultInternetSearchOn) {
      setWebSearch(true)
    }
  }, [defaultInternetSearchOn])

  return (
    <div className="flex flex-col items-center w-full p-2 pt-1 pb-7 dark:hover:!border-indigo-400 text-thin dark:drop-shadow-[12px_12px_16px_rgba(100,149,237,0.5)] drop-shadow-[6px_4px_4px_rgba(0,0,0,0.1)]">
      {/* Main chat interface container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full gap-0.5 text-base font-light dark:focus:!border-violet-400">
        {/* Help text for keyboard shortcuts */}
        <div className="flex items-start justify-start mt-0.5 text-sm text-gray-500 dark:text-stone-400" style={{ fontStyle: 'italic' }}>
          <span>{t("Ctrl+ Enter --Submit.  Ctrl+ H --Help")}</span>
        </div>

        <div className="relative flex flex-row justify-center w-full gap-2 lg:w-4/5">
          <div
            className={`bg-neutral-100 dark:bg-[#262626] relative w-full max-w-[48rem] p-1 backdrop-blur-lg 
              duration-100 border border-gray-600 rounded-xl  
              dark:border-gray-600 active:border-violet-300 dark:active:border-violet-400 
              hover:border-violet-300 dark:hover:border-violet-400
              ${hasInput ? "dark:border-violet-400" : ""}`}>
            <div
              className={`border-b border-gray-200 dark:border-gray-600 relative ${form.values.image.length === 0 ? "hidden" : "block"
                }`}>
              <button
                type="button"
                onClick={() => {
                  form.setFieldValue("image", "")
                }}
                className="absolute top-1 left-1 flex items-center justify-center z-10 bg-white dark:bg-[#262626] p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-gray-100">
                <X className="w-4 h-4" />
              </button>{" "}
              <Image
                src={form.values.image}
                alt="Uploaded Image"
                preview={false}
                className="rounded-md max-h-32"
              />
            </div>
            <div>
              <div className="flex">
                <form
                  onSubmit={form.onSubmit(async (value) => {
                    if (!selectedModel || selectedModel.length === 0) {
                      form.setFieldError("message", t("formError.noModel"))
                      return
                    }
                    if (webSearch) {
                      const defaultEM = await defaultEmbeddingModelForRag()
                      const simpleSearch = await getIsSimpleInternetSearch()
                      if (!defaultEM && !simpleSearch) {
                        form.setFieldError(
                          "message",
                          t("formError.noEmbeddingModel")
                        )
                        return
                      }
                    }
                    if (
                      value.message.trim().length === 0 &&
                      value.image.length === 0
                    ) {
                      return
                    }
                    form.reset()
                    textAreaFocus()
                    await sendMessage({
                      image: value.image,
                      message: value.message.trim()
                    })
                  })}
                  className="flex flex-col items-center flex-grow shrink-0 ">
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    ref={inputRef}
                    accept="image/*"
                    multiple={false}
                    onChange={onInputChange}
                  />
                  <div className="flex flex-col w-full px-1">
                    <textarea
                      onKeyDown={(e) => handleKeyDown(e)}
                      ref={textareaRef}
                      className={`w-full px-2 py-2 bg-transparent border-0 resize-none focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 dark:text-gray-100 text-[15px] font-normal
                        ${isSending ? "placeholder-violet-950 dark:placeholder-orange-400 placeholder-opacity-80" : "placeholder-gray-600 dark:placeholder-stone-300"}`}
                      onPaste={handlePaste}
                      rows={1}
                      style={{ minHeight: "60px" }}
                      tabIndex={0}
                      onCompositionStart={() => {
                        if (import.meta.env.BROWSER !== "firefox") {
                          setTyping(true)
                        }
                      }}
                      onCompositionEnd={() => {
                        if (import.meta.env.BROWSER !== "firefox") {
                          setTyping(false)
                        }
                      }}
                      placeholder={
                        isSending
                          ? [
                            "CTRL+ C : Stop Streaming ...",
                            "Click Red Button to Stop",
                            "Press CTRL+C to Stop ...",
                            "AI Streaming in progress ..."
                          ][Math.floor((Date.now() / 1000) % 4)]
                          : hasInput ? t("form.textarea.placeholder") : [
                            "Ask me anything ...",
                            "I'm here to help ...",
                            "What's on your mind?",
                            "How can I assist you?"
                          ][Math.floor((Date.now() / 1000) % 4)]
                      }
                      onChange={handleTextareaChange}
                      value={form.values.message}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      {chatMode !== "vision" && (
                        <Tooltip title={t("tooltip.searchInternet")}>
                          <button
                            type="button"
                            onClick={() => setWebSearch(!webSearch)}
                            className={`inline-flex items-center gap-2 ${chatMode === "rag" ? "hidden" : "block"
                              }`}>
                            {webSearch ? (
                              <PiGlobe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <PiGlobeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </Tooltip>
                      )}
                      <ModelSelect />
                      {browserSupportsSpeechRecognition && (
                        <Tooltip title={t("tooltip.speechToText")}>
                          <button
                            type="button"
                            onClick={async () => {
                              if (isListening) {
                                stopListening()
                              } else {
                                resetTranscript()
                                startListening({
                                  continuous: true,
                                  lang: speechToTextLanguage
                                })
                              }
                            }}
                            className={`flex items-center justify-center dark:text-gray-300`}>
                            {!isListening ? (
                              <MicIcon className="w-5 h-5" />
                            ) : (
                              <div className="relative">
                                <span className="absolute inline-flex w-3 h-3 bg-red-400 rounded-full opacity-75 animate-ping"></span>
                                <MicIcon className="w-5 h-5" />
                              </div>
                            )}
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip title={t("tooltip.vision")}>
                        <button
                          type="button"
                          onClick={() => {
                            if (chatMode === "vision") {
                              setChatMode("normal")
                            } else {
                              setChatMode("vision")
                            }
                          }}
                          disabled={chatMode === "rag"}
                          className={`flex items-center justify-center dark:text-gray-300 ${chatMode === "rag" ? "hidden" : "block"
                            } disabled:opacity-50`}>
                          {chatMode === "vision" ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeOffIcon className="w-5 h-5" />
                          )}
                        </button>
                      </Tooltip>
                      <Tooltip title={t("tooltip.uploadImage")}>
                        <button
                          type="button"
                          onClick={() => {
                            inputRef.current?.click()
                          }}
                          disabled={chatMode === "vision"}
                          className={`flex items-center justify-center disabled:opacity-50 dark:text-gray-300 ${chatMode === "rag" ? "hidden" : "block"
                            }`}>
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </Tooltip>
                      {!streaming ? (
                        <Dropdown.Button
                          htmlType="submit"
                          disabled={isSending}
                          className="!justify-end !w-auto"
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          }
                          menu={{
                            items: [
                              {
                                key: 1,
                                label: (
                                  <Checkbox
                                    checked={sendWhenEnter}
                                    onChange={(e) =>
                                      setSendWhenEnter(e.target.checked)
                                    }>
                                    {t("sendWhenEnter")}
                                  </Checkbox>
                                )
                              },
                              {
                                key: 2,
                                label: (
                                  <Checkbox
                                    checked={chatMode === "rag"}
                                    onChange={(e) => {
                                      setChatMode(
                                        e.target.checked ? "rag" : "normal"
                                      )
                                    }}>
                                    {t("common:chatWithCurrentPage")}
                                  </Checkbox>
                                )
                              },
                              {
                                key: 3,
                                label: (
                                  <Checkbox
                                    checked={useOCR}
                                    onChange={(e) =>
                                      setUseOCR(e.target.checked)
                                    }>
                                    {t("useOCR")}
                                  </Checkbox>
                                )
                              }
                            ]
                          }}>
                          <div className="inline-flex gap-2">
                            {sendWhenEnter ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="w-5 h-5"
                                viewBox="0 0 24 24">
                                <path d="M9 10L4 15 9 20"></path>
                                <path d="M20 4v7a4 4 0 01-4 4H4"></path>
                              </svg>
                            ) : null}
                            {t("common:submit")}
                          </div>
                        </Dropdown.Button>
                      ) : (
                        <Tooltip title={t("tooltip.stopStreaming")}>
                          <button
                            type="button"
                            onClick={stopStreamingRequest}
                            className="flex items-center space-x-2">
                            <div className="text-red-700 dark:text-red-400 dark:bg-gray-600 animate-pulse">
                              <StopCircleIcon className="w-6 h-6" />
                            </div>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </form>
              </div>
              {form.errors.message && (
                <div className="mt-1 text-[15px] text-center text-red-500">
                  {form.errors.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Message - Fixed position footer */}
      <div className="fixed bottom-0 w-full p-2 mt-3 text-xs text-center text-gray-500 dark:text-stone-400 shadow-lg bg-white dark:bg-[#262626]">
        <div className="flex items-center justify-center gap-4">
          <span>{t("@Aurora")}</span>
          <div className="flex items-center gap-4">
            <Tooltip title="Any Suggestion can send back to author">
              <a
                href="mailto:feedback@aurora.com"
                className="flex items-center gap-1 transition-colors duration-200 hover:text-violet-500 dark:hover:text-violet-400"
              >
                <Mail className="w-4 h-4 text-gray-600 dark:text-indigo-400" />
                MessageFeedback
              </a>
            </Tooltip>
            <Tooltip title="Frequently Asked Questions">
              <a
                href="#"
                className="flex items-center gap-1 transition-colors duration-200 hover:text-violet-500 dark:hover:text-violet-400"
              >
                <HelpCircle className="w-4 h-4 text-gray-600 dark:text-indigo-400" />
                QA
              </a>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}