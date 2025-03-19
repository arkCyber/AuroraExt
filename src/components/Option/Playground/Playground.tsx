import React, { useState, useEffect, useRef } from "react";
import { PlaygroundForm } from "./PlaygroundForm";
import { PlaygroundChat } from "./PlaygroundChat";
import { useMessageOption } from "@/hooks/useMessageOption";
import { webUIResumeLastChat } from "@/services/app";
import darkBackground from "./dark_background.jpg";
import lightBackground from "./light_background.jpg";
import {
  formatToChatHistory,
  formatToMessage,
  getPromptById,
  getRecentChatFromWebUI,
} from "@/db";
import { getLastUsedChatSystemPrompt } from "@/services/model-settings";
import { useStoreChatModelSettings } from "@/store/model";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import { ChevronDown } from "lucide-react";

export const Playground = () => {
  const drop = useRef<HTMLDivElement>(null);
  const [dropedFile, setDropedFile] = useState<File | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [dropState, setDropState] = useState<"idle" | "dragging" | "error">("idle");

  const {
    selectedKnowledge,
    messages,
    setHistoryId,
    setHistory,
    setMessages,
    setSelectedSystemPrompt,
    streaming,
  } = useMessageOption();
  const { setSystemPrompt } = useStoreChatModelSettings();
  const { containerRef, isAtBottom, scrollToBottom } = useSmartScroll(messages, streaming);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const darkModeBackground = {
    backgroundImage: `url('${darkBackground}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay',
  };

  const lightModeBackground = {
    backgroundImage: `url('${lightBackground}')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay',
  };

  const backgroundStyle = React.useMemo(() => ({
    ...(isDarkMode ? darkModeBackground : lightModeBackground)
  }), [isDarkMode]);

  const getDropBackgroundColor = () => {
    if (dropState === "dragging") {
      return isDarkMode ? "bg-gray-800" : "bg-gray-100";
    }
    return "";
  };

  const containerStyle = {
    ...backgroundStyle,
    ...(dropState === "dragging" && { opacity: 0.8 }),
  };

  return (
    <div
      ref={drop}
      className={`relative flex h-full flex-col items-center ${getDropBackgroundColor()}`}
    >
      <div
        ref={containerRef}
        className="flex flex-col items-center w-full h-full px-5 overflow-x-hidden overflow-y-auto border-4 border-red-500 custom-scrollbar bg-bottom-mask-light dark:bg-bottom-mask-dark mask-bottom-fade will-change-mask"
        style={containerStyle}
      >
        <PlaygroundChat />
      </div>
      <div className="absolute bottom-0 w-full">
        {!isAtBottom && (
          <div className="fixed left-0 right-0 z-20 flex justify-center bottom-36">
            <button
              onClick={scrollToBottom}
              className="bg-indigo-200 shadow border border-indigo-500 dark:border-none dark:bg-indigo-500 p-1.5 rounded-full pointer-events-auto animate-bounce"
            >
              <ChevronDown className="text-gray-600 size-4 dark:text-gray-300" />
            </button>
          </div>
        )}
        <PlaygroundForm dropedFile={dropedFile} />
      </div>
    </div>
  );
};