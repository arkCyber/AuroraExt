/**
 * SidePanelBody Component
 * 
 * This component serves as the main chat interface container, handling:
 * 1. Message display and management
 * 2. Empty state rendering
 * 3. Message source popup functionality
 * 4. Smart scrolling behavior
 * 5. Text-to-speech integration
 * 6. Keyboard shortcuts (CTRL+Shift+2 to close)
 * 
 * The component uses custom hooks for message management and scroll behavior,
 * and integrates with the WebUI store for global UI state.
 */

import React, { useEffect } from "react"
import { SidepanelMessage } from "./SideMessage"
import { useMessage } from "~/hooks/useMessage"
import { EmptySidePanel } from "../Chat/empty"
import { useWebUI } from "@/store/webui"
import { MessageSourcePopup } from "@/components/Common/Playground/MessageSourcePopup"
import { ChevronDown } from "lucide-react"
import { useSmartScroll } from "@/hooks/useSmartScroll"

export const SidePanelBody = () => {
  // Get message-related functionality from custom hook
  const {
    messages,
    streaming,
    regenerateLastMessage,
    editMessage,
    isSearchingInternet
  } = useMessage()

  // State for managing message source popup
  const [isSourceOpen, setIsSourceOpen] = React.useState(false)
  const [source, setSource] = React.useState<any>(null)

  // Get text-to-speech preference from WebUI store
  const { ttsEnabled } = useWebUI()

  // Custom hook for managing scroll behavior
  const { containerRef, isAtBottom, scrollToBottom } = useSmartScroll(messages, streaming)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for CTRL+Shift+2
      if (event.ctrlKey && event.shiftKey && event.key === "2") {
        // Close the sidepanel by sending a message to the extension
        chrome.runtime.sendMessage({ type: "TOGGLE_SIDEPANEL" })
      }
    }

    // Add event listener
    window.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <>
      {/* Main message container with smart scrolling */}
      <div ref={containerRef} className="relative flex flex-col items-center w-full pt-16 pb-4 overflow-y-auto">
        {/* Show empty state when no messages exist */}
        {messages.length === 0 && <EmptySidePanel />}

        {/* Render message list with individual message components */}
        {messages.map((message, index) => (
          <SidepanelMessage
            key={index}
            isBot={message.isBot}
            message={message.message}
            name={message.name}
            images={message.images || []}
            currentMessageIndex={index}
            totalMessages={messages.length}
            onRengerate={regenerateLastMessage}
            message_type={message.messageType}
            isProcessing={streaming}
            isSearchingInternet={isSearchingInternet}
            sources={message.sources}
            onEditFormSubmit={(value) => {
              editMessage(index, value, !message.isBot)
            }}
            onSourceClick={(data) => {
              setSource(data)
              setIsSourceOpen(true)
            }}
            isTTSEnabled={ttsEnabled}
            generationInfo={message?.generationInfo}
            isStreaming={streaming}
            reasoningTimeTaken={message?.reasoning_time_taken}
            modelImage={message?.modelImage}
            modelName={message?.modelName}
          />
        ))}
      </div>

      {/* Spacer to prevent content from being hidden behind the input area */}
      <div className="w-full pb-[157px]"></div>

      {/* Scroll to bottom button - only shown when not at bottom */}
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

      {/* Message source popup modal */}
      <MessageSourcePopup
        open={isSourceOpen}
        setOpen={setIsSourceOpen}
        source={source}
      />
    </>
  )
}