/**
 * PlaygroundForm Component
 * A sophisticated chat interface component that supports:
 * - Text input with dynamic sizing
 * - Image upload and preview
 * - Speech-to-text functionality
 * - Web search integration
 * - Multiple keyboard shortcuts
 * - Dark/Light mode theming
 */

import { useForm } from "@mantine/form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import React from "react"
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize"
import { toBase64 } from "~/libs/to-base64"
import { useMessageOption } from "~/hooks/useMessageOption"
import { Checkbox, Dropdown, Switch, Tooltip } from "antd"
import { Image } from "antd"
import { useWebUI } from "~/store/webui"
import { defaultEmbeddingModelForRag } from "~/services/ollama"


const darkModeBackground = {
  backgroundImage: `url('/assets/dark-background.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundBlendMode: 'overlay'
}

const lightModeBackground = {
  backgroundImage: `url('/assets/light-background.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundBlendMode: 'overlay'
}

const backgroundStyle = {
  ...(document.documentElement.classList.contains('dark') ? darkModeBackground : lightModeBackground)
}
const coverStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
  zIndex: -1
}


/*
useEffect(() => {
  // Initialize audio
  audioRef.current = new Audio(powerUpSound);

  // Set reasonable volume
  if (audioRef.current) {
    audioRef.current.volume = 0.5;
  }

  // Basic error handling
  audioRef.current?.addEventListener('error', (e) => {
    console.warn('Audio error:', e);
    notification.warning({
      message: 'Sound Effect Error',
      description: 'Unable to load sound effect'
    });
  });

  // Cleanup
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);

const playPowerUpSound = () => {
  try {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn('Error playing sound:', err);
      });
    }
  } catch (err) {
    console.warn('Error in playPowerUpSound:', err);
  }
};
*/

import {
  ImageIcon,
  MicIcon,
  StopCircleIcon,
  X,
  Mail,
  HelpCircle
} from "lucide-react"

import { getVariable } from "@/utils/select-variable"
import { useTranslation } from "react-i18next"
import { KnowledgeSelect } from "../Knowledge/KnowledgeSelect"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { PiGlobe } from "react-icons/pi"
import { handleChatInputKeyDown } from "@/utils/key-down"
import { getIsSimpleInternetSearch } from "@/services/search"

// const textareaRef = React.useRef<HTMLTextAreaElement>(null);

type Props = {
  dropedFile: File | undefined
}



export const PlaygroundForm = ({ dropedFile }: Props) => {
  // Translation hook for internationalization
  const { t } = useTranslation(["playground", "common"])

  // Refs for DOM elements
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Local state management
  const [typing, setTyping] = React.useState<boolean>(false)
  const [hasInput, setHasInput] = React.useState<boolean>(false) // Tracks input presence

  /**
   * Custom hook providing core chat functionality including:
   * - Message submission
   * - Model selection
   * - Speech-to-text settings
   * - Web search integration
   * - Knowledge base integration
   */
  const {
    onSubmit,
    selectedModel,
    chatMode,
    speechToTextLanguage,
    stopStreamingRequest,
    streaming: isSending,
    webSearch,
    setWebSearch,
    selectedQuickPrompt,
    textareaRef,
    setSelectedQuickPrompt,
    selectedKnowledge,
    temporaryChat,
    useOCR,
    setUseOCR,
    defaultInternetSearchOn
  } = useMessageOption()

  /**
   * Detects if the current device is mobile
   * Used to adjust focus behavior for better UX on mobile devices
   */
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  /**
   * Manages textarea focus behavior
   * - Focuses on desktop
   * - Blurs on mobile to prevent keyboard popup
   */
  const textAreaFocus = () => {
    if (textareaRef.current) {
      if (textareaRef.current.selectionStart === textareaRef.current.selectionEnd) {
        if (!isMobile()) {
          textareaRef.current.focus()
        } else {
          textareaRef.current.blur()
        }
      }
    }
  }

  // Initialize form state using Mantine's useForm
  const form = useForm({
    initialValues: {
      message: "",
      image: ""
    }
  })

  /**
   * Effect hook for initial setup
   * - Sets focus on textarea
   * - Enables web search if default is on
   */
  React.useEffect(() => {
    textAreaFocus()
    if (defaultInternetSearchOn) {
      setWebSearch(true)
    }
  }, [])

  React.useEffect(() => {
    if (defaultInternetSearchOn) {
      setWebSearch(true)
    }
  }, [defaultInternetSearchOn])

  /**
   * Handles file input changes for image uploads
   * Converts uploaded files to base64 for preview and submission
   */
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

  /**
   * Handles image paste events
   * Allows users to paste images directly into the chat
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      onInputChange(e.clipboardData.files[0])
    }
  }

  React.useEffect(() => {
    if (dropedFile) {
      onInputChange(dropedFile)
    }
  }, [dropedFile])

  useDynamicTextareaSize(textareaRef, form.values.message, 300)

  // Speech recognition configuration and state management
  const {
    transcript,
    isListening,
    resetTranscript,
    start: startListening,
    stop: stopSpeechRecognition,
    supported: browserSupportsSpeechRecognition
  } = useSpeechRecognition()
  const { sendWhenEnter, setSendWhenEnter } = useWebUI()

  /**
   * Updates form with speech recognition transcript
   * Only updates when actively listening
   */
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

  const queryClient = useQueryClient()

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      textAreaFocus()
      queryClient.invalidateQueries({
        queryKey: ["fetchChatHistory"]
      })
    },
    onError: (error) => {
      textAreaFocus()
    }
  })

  /**
   * Handles keyboard shortcuts and message submission
   * Supports:
   * - Ctrl+Enter for submission
   * - Ctrl+Shift+3 for voice command start
   * - Ctrl+Shift+4 for voice command stop
   * - Ctrl+C for stopping message streaming
   */
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault(); // 阻止默认行为
        if (isSending) {
          stopStreamingRequest();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isSending, stopStreamingRequest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add CTRL+Shift+3 shortcut to start voice command
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "3") {
      e.preventDefault(); // Prevent default behavior
      if (!isListening) {
        resetTranscript();
        startListening({
          continuous: true,
          lang: speechToTextLanguage,
        }); // Start listening
      }
    }

    // Add CTRL+Shift+4 shortcut to stop voice command
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "4") {
      e.preventDefault(); // Prevent default behavior
      if (isListening) {
        stopSpeechRecognition(); // Stop listening
      }
    }

    // message sending processing

    if (import.meta.env.BROWSER !== "firefox") {
      if (e.key === "Process" || e.key === "229") return
    }

    if (
      handleChatInputKeyDown({
        e,
        sendWhenEnter,
        typing,
        isSending
      })
    ) {
      e.preventDefault()
      stopListening()
      form.onSubmit(async (value) => {
        if (value.message.trim().length === 0 && value.image.length === 0) {
          return
        }
        if (!selectedModel || selectedModel.length === 0) {
          form.setFieldError("message", t("formError.noModel"))
          return
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

  const stopListening = async () => {
    if (isListening) {
      stopSpeechRecognition()
    }
  }

  /**
   * Monitors textarea content changes
   * Updates hasInput state for UI feedback
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.getInputProps("message").onChange(e)
    setHasInput(e.target.value.trim().length > 0)
  }

  return (
    <div className="flex flex-col items-center w-full p-2 pt-1 pb-7 dark:hover:!border-indigo-400 text-thin dark:drop-shadow-[12px_12px_16px_rgba(100,149,237,0.5)] drop-shadow-[6px_4px_4px_rgba(0,0,0,0.1)]">

      {/* Help Message - Fixed position footer with feedback and help links */}
      <div className="fixed bottom-0 w-full p-2 mt-3 text-xs text-center text-gray-500 dark:text-stone-400 shadow-lg bg-white dark:bg-[#262626]">
        <div className="flex items-center justify-center gap-4">
          <span>{t("@Aurora: AI can make mistakes,check before you use.")}</span>
          <div className="flex items-center gap-4">
            <Tooltip title="Any Suggestion can send back to author">
              <a
                href="mailto:arksong2025@gmail.com"
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

      {/* Main chat interface container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full gap-0.5 text-base font-light dark:focus:!border-violet-400">
        {/* Help text for keyboard shortcuts */}
        <div className="flex items-start justify-start mt-0.5">
          <div className="flex gap-2 px-3 py-1 text-sm bg-gray-100 rounded-full dark:bg-gray-800" >
            <span className="font-semibold text-gray-500 dark:text-stone-400">  CTRL + Enter</span>
            <span className="font-normal text-gray-500 dark:text-stone-500">: Submit</span>
            <span className="text-gray-500 dark:text-stone-400">  |  </span>
            <span className="font-semibold text-gray-500 dark:text-stone-400">  CTRL + C</span>
            <span className="font-normal text-gray-500 dark:text-stone-500">: Stop Streaming</span>
            <span className="text-gray-500 dark:text-stone-400">  |  </span>
            <span className="font-semibold text-gray-500 dark:text-stone-400">  CTRL + Shift + 2</span>
            <span className="font-normal text-gray-500 dark:text-stone-500">: Sidepannel</span>
          </div>
        </div>

        {/* Chat input container */}
        <div className="relative flex flex-row justify-center w-full gap-2 lg:w-4/5">
          <div className={`bg-neutral-100 dark:bg-[#262626] relative w-full max-w-[48rem] p-1 backdrop-blur-lg 
             duration-100 border border-gray-600 rounded-xl  
             dark:border-gray-600 active:border-violet-300 dark:active:border-violet-400 
             hover:border-violet-300 dark:hover:border-violet-400
             ${temporaryChat ? "!bg-gray-200 dark:!bg-black " : ""}
             ${hasInput ? "dark:border-violet-400" : ""}`}>

            {/* Image preview section */}
            <div className={`border-b border-gray-200 dark:border-gray-600  
              dark:hover:border-violet-400 relative ${form.values.image.length === 0 ? "hidden" : "block"}`}>
              {/* Image remove button */}
              <button
                type="button"
                onClick={() => form.setFieldValue("image", "")}
                className="absolute top-1 left-1 flex items-center justify-center z-10 bg-white 
                    dark:bg-[#262626] p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 
                    text-black dark:text-gray-100">
                <X className="w-4 h-4" />
              </button>
              {/* Image preview */}
              <Image
                src={form.values.image}
                alt="Uploaded Image"
                preview={false}
                className="rounded-md max-h-32"
              />
            </div>

            {/* Chat form container */}
            <div>
              <div className={`flex bg-transparent`}>
                <form
                  onSubmit={form.onSubmit(async (value) => {
                    stopListening()
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
                  className="flex flex-col items-center flex-grow shrink-0">

                  {/* Hidden file input for image upload */}
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

                  {/* Main input area container */}
                  <div className="flex flex-col w-full p-2 dark:border-gray-600">
                    {/* Dynamic textarea for chat input */}
                    <textarea
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
                      onKeyDown={handleKeyDown}
                      ref={textareaRef}
                      className={`w-full px-2 py-4 font-normal dark:font-normal bg-transparent border-0 resize-none 
                        focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 
                        dark:text-gray-200 dark:focus:!border-violet-400 
                        ${isSending ? "placeholder-violet-950 dark:placeholder-orange-400 placeholder-opacity-80"
                          : "placeholder-gray-600 dark:placeholder-stone-300"}`}
                      onPaste={handlePaste}
                      rows={1}
                      style={{ minHeight: "35px" }}
                      tabIndex={0}
                      placeholder={
                        isSending
                          ? [
                            "CTRL+ C : Stop AI Message Streaming ...",
                            "Stop AI Message Streaming by Click Red Button ...",
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

                    {/* Control buttons and options container */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Web search toggle */}
                      <div className="flex">
                        {!selectedKnowledge && (
                          <Tooltip title={t("tooltip.searchInternet")}>
                            <div className="inline-flex items-center gap-2">
                              <PiGlobe className={`h-5 w-5 dark:text-gray-300`} />
                              <Switch
                                value={webSearch}
                                size="small"
                                className="!bg-indigo-400"
                                onChange={(e) => setWebSearch(e)}
                                checkedChildren={t("form.webSearch.on")}
                                unCheckedChildren={t("form.webSearch.off")}
                              />
                            </div>
                          </Tooltip>
                        )}
                      </div>

                      {/* Action buttons container */}
                      <div className="flex !justify-end gap-3">
                        {/* Image upload button */}
                        {!selectedKnowledge && (
                          <Tooltip title={t("tooltip.uploadImage")}>
                            <button
                              type="button"
                              onClick={() => inputRef.current?.click()}
                              className={`flex items-center justify-center text-gray-400 
                                dark:text-stone-200 dark:hover:text-violet-400 
                                ${chatMode === "rag" ? "hidden" : "block"}`}>
                              <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 dark:hover:text-violet-300" />
                            </button>
                          </Tooltip>
                        )}

                        {/* Speech-to-text button */}
                        {browserSupportsSpeechRecognition && (
                          <Tooltip title={t("tooltip.speechToText")}>
                            <button
                              type="button"
                              onClick={async () => {
                                if (isListening) {
                                  stopSpeechRecognition()
                                } else {
                                  resetTranscript()
                                  startListening({
                                    continuous: true,
                                    lang: speechToTextLanguage
                                  })
                                }
                              }}
                              className={`flex items-center justify-center dark:text-gray-300 dark:hover:text-violet-400`}>
                              {!isListening ? (
                                <MicIcon className="w-5 h-5" />
                              ) : (
                                <div className="relative">
                                  <span className="absolute inline-flex w-3 h-3 bg-red-600 rounded-full opacity-75 animate-ping"
                                    style={{ animationDuration: '0.2s' }}></span>
                                  <MicIcon className="w-5 h-5" />
                                </div>
                              )}
                            </button>
                          </Tooltip>
                        )}

                        {/* Knowledge base selector */}
                        <KnowledgeSelect />

                        {/* Submit button with options dropdown */}
                        {!isSending ? (
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
                              {sendWhenEnter && (
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
                              )}
                              {t("common:submit")}
                            </div>
                          </Dropdown.Button>
                        ) : (
                          /* Stop streaming button */
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
                  </div>
                </form>
              </div>

              {/* Error message display */}
              {form.errors.message && (
                <div className="mt-1 text-sm text-center text-red-500">
                  {form.errors.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}