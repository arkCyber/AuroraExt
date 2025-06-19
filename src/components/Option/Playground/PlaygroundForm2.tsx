import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize";
import { toBase64 } from "~/libs/to-base64";
import { useMessageOption } from "~/hooks/useMessageOption";
import { Checkbox, Dropdown, Switch, Tooltip } from "antd";
import { Image } from "antd";
import { useWebUI } from "~/store/webui";
import { defaultEmbeddingModelForRag } from "~/services/ollama";
import {
  ImageIcon,
  MicIcon,
  StopCircleIcon,
  X,
} from "lucide-react";
import { getVariable } from "@/utils/select-variable";
import { useTranslation } from "react-i18next";
import { KnowledgeSelect } from "../Knowledge/KnowledgeSelect";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { PiGlobe } from "react-icons/pi";
import { handleChatInputKeyDown } from "@/utils/key-down";
import { getIsSimpleInternetSearch } from "@/services/search";

type Props = {
  dropedFile: File | undefined;
};

export const PlaygroundForm = ({ dropedFile }: Props) => {
  const { t } = useTranslation(["playground", "common"]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [typing, setTyping] = React.useState<boolean>(false);
  const [hasInput, setHasInput] = React.useState<boolean>(false);

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
  } = useMessageOption();

  const form = useForm({
    initialValues: {
      message: "",
      image: ""
    }
  });

  // 动态调整 textarea 高度
  useDynamicTextareaSize(textareaRef, form.values.message, 300);

  const {
    transcript,
    isListening,
    resetTranscript,
    start: startListening,
    stop: stopSpeechRecognition,
    supported: browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const { sendWhenEnter, setSendWhenEnter } = useWebUI();

  const queryClient = useQueryClient();

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      textAreaFocus();
      queryClient.invalidateQueries({
        queryKey: ["fetchChatHistory"]
      });
    },
    onError: (error) => {
      textAreaFocus();
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 快捷键处理逻辑
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "3") {
      e.preventDefault();
      if (!isListening) {
        resetTranscript();
        startListening({
          continuous: true,
          lang: speechToTextLanguage,
        });
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "4") {
      e.preventDefault();
      if (isListening) {
        stopSpeechRecognition();
      }
    }

    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      stopStreamingRequest();
    }

    // 消息发送处理逻辑
    if (import.meta.env.BROWSER !== "firefox") {
      if (e.key === "Process" || e.key === "229") return;
    }

    if (
      handleChatInputKeyDown({
        e,
        sendWhenEnter,
        typing,
        isSending
      })
    ) {
      e.preventDefault();
      stopListening();
      form.onSubmit(async (value) => {
        if (value.message.trim().length === 0 && value.image.length === 0) {
          return;
        }
        if (!selectedModel || selectedModel.length === 0) {
          form.setFieldError("message", t("formError.noModel"));
          return;
        }
        if (webSearch) {
          const defaultEM = await defaultEmbeddingModelForRag();
          const simpleSearch = await getIsSimpleInternetSearch();
          if (!defaultEM && !simpleSearch) {
            form.setFieldError("message", t("formError.noEmbeddingModel"));
            return;
          }
        }
        form.reset();
        textAreaFocus();
        await sendMessage({
          image: value.image,
          message: value.message.trim()
        });
      })();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.getInputProps("message").onChange(e);
    setHasInput(e.target.value.trim().length > 0);
  };

  // 动态注入 CSS
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes placeholderColorChange {
        0% { color: #6b7280; }
        50% { color: #d1d5db; }
        100% { color: #6b7280; }
      }
      .animate-placeholder::placeholder {
        animation: placeholderColorChange 2s infinite;
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full p-2 pt-1 pb-7 dark:hover:!border-indigo-400 text-thin drop-shadow-[6px_4px_4px_rgba(0,0,0,0.1)]">
      {/* 帮助信息 */}
      <div className="fixed bottom-0 w-full p-2 mt-3 text-xs text-center text-gray-500 dark:text-stone-400 shadow-lg bg-white dark:bg-[#262626]">
        <span>{t("Aurora AI can make mistakes. Check important info. before you use")}</span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full gap-2 text-base font-light dark:focus:!border-violet-400">
        <div className="flex items-start justify-start mt-1 text-sm italic text-gray-500 dark:text-stone-400" style={{ fontStyle: 'italic' }}>
          <span>{t("Ask me anything and Ctrl+ Enter key to submit. ctrl+ h for help")}</span>
        </div>

        <div className="relative flex flex-row justify-center w-full gap-2 lg:w-4/5">
          <div
            className={`bg-neutral-100 dark:bg-[#262626] relative w-full max-w-[48rem] p-1 backdrop-blur-lg 
             duration-100 border border-gray-600 rounded-xl  
             dark:border-gray-600 active:border-violet-300 dark:active:border-violet-400 
             ${temporaryChat ? "!bg-gray-200 dark:!bg-black " : ""}
             ${hasInput ? "dark:border-violet-400" : ""}`}
          >
            <div
              className={`border-b border-gray-200 dark:border-gray-600  
              dark:hover:border-violet-400 relative ${form.values.image.length === 0 ? "hidden" : "block"
                }`}>
              <button
                type="button"
                onClick={() => {
                  form.setFieldValue("image", "")
                }}
                className="absolute top-1 left-1 flex items-center justify-center z-10 bg-white 
                    dark:bg-[#262626] p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 
                    text-black dark:text-gray-100">
                <X className="w-4 h-4" />
              </button>
              <Image
                src={form.values.image}
                alt="Uploaded Image"
                preview={false}
                className="rounded-md max-h-32"
              />
            </div>
            <div>
              <div className={`flex bg-transparent`}>
                <form
                  onSubmit={form.onSubmit(async (value) => {
                    stopListening();
                    if (!selectedModel || selectedModel.length === 0) {
                      form.setFieldError("message", t("formError.noModel"));
                      return;
                    }
                    if (webSearch) {
                      const defaultEM = await defaultEmbeddingModelForRag();
                      const simpleSearch = await getIsSimpleInternetSearch();
                      if (!defaultEM && !simpleSearch) {
                        form.setFieldError(
                          "message",
                          t("formError.noEmbeddingModel")
                        );
                        return;
                      }
                    }
                    if (
                      value.message.trim().length === 0 &&
                      value.image.length === 0
                    ) {
                      return;
                    }
                    form.reset();
                    textAreaFocus();
                    await sendMessage({
                      image: value.image,
                      message: value.message.trim()
                    });
                  })}
                  className="flex flex-col items-center flex-grow shrink-0"
                >
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    ref={inputRef}
                    accept="image/*"
                    multiple={false}
                    onChange={(e) => onInputChange(e)}
                  />

                  <div className="flex flex-col w-full p-2 dark:border-gray-600">
                    <textarea
                      onCompositionStart={() => {
                        if (import.meta.env.BROWSER !== "firefox") {
                          setTyping(true);
                        }
                      }}
                      onCompositionEnd={() => {
                        if (import.meta.env.BROWSER !== "firefox") {
                          setTyping(false);
                        }
                      }}
                      onKeyDown={(e) => handleKeyDown(e)}
                      ref={textareaRef}
                      className={`w-full px-2 py-4 font-normal dark:font-normal bg-transparent border-0 resize-none focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 dark:text-gray-200 dark:focus:!border-violet-400 ${isSending
                        ? "placeholder-violet-950 dark:placeholder-orange-400 placeholder-opacity-80"
                        : "placeholder-gray-600 dark:placeholder-stone-300 animate-placeholder"
                        }`}
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
                            "AI Streaming in progress ...",
                          ][Math.floor((Date.now() / 1000) % 4)]
                          : hasInput
                            ? t("form.textarea.placeholder")
                            : [
                              "Ask me anything ...",
                              "I'm here to help ...",
                              "What's on your mind?",
                              "How can I assist you?",
                            ][Math.floor((Date.now() / 1000) % 4)]
                      }
                      onChange={handleTextareaChange}
                      value={form.values.message}
                    />

                    {/* 其他 UI 组件（如按钮、开关等） */}
                    <div className="flex items-center justify-between mt-2">
                      {/* ... 你的其他 UI 代码 ... */}
                    </div>
                  </div>
                </form>
              </div>
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
  );
};