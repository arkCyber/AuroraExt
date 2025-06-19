/**
 * PlaygroundChat Component
 * Main component responsible for rendering the chat interface including messages,
 * empty states, and source popups.
 */

import React, { useEffect } from "react"
import { useMessageOption } from "~/hooks/useMessageOption"
import { PlaygroundEmpty } from "./PlaygroundEmpty"
import { PlaygroundMessage } from "@/components/Common/Playground/Message"
import { MessageSourcePopup } from "@/components/Common/Playground/MessageSourcePopup"
import { useStorage } from "@plasmohq/storage/hook"

export const PlaygroundChat = () => {
  // Get chat-related state and functions from the message option hook
  const {
    messages,          // Array of chat messages
    streaming,         // Boolean indicating if a message is currently streaming
    regenerateLastMessage,  // Function to regenerate the last message
    isSearchingInternet,    // Boolean indicating if web search is in progress
    editMessage,      // Function to edit existing messages
    ttsEnabled       // Boolean indicating if text-to-speech is enabled
  } = useMessageOption()

  // State for managing source popup visibility and content
  const [isSourceOpen, setIsSourceOpen] = React.useState(false)
  const [source, setSource] = React.useState<any>(null)

  // Get reasoning display preference from storage
  const [openReasoning] = useStorage("openReasoning", false)

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Chat state changed:', {
      messagesLength: messages.length,
      streaming,
      lastMessage: messages[messages.length - 1],
      messages
    })
  }, [messages, streaming])

  // Helper function to determine if a message should show thinking state
  const shouldShowThinking = (message: any, index: number) => {
    const isLastMessage = index === messages.length - 1
    const isBotMessage = message.isBot
    const hasNoContent = !message.message || message.message.trim() === '' || message.message === '▋'

    const shouldShow = streaming && isLastMessage && isBotMessage && hasNoContent

    console.log('Thinking state check:', {
      streaming,
      isLastMessage,
      isBotMessage,
      hasNoContent,
      messageContent: message.message,
      shouldShow
    })

    return shouldShow
  }

  // Ensure we have a bot message when streaming starts
  const getMessageToRender = (message: any, index: number) => {
    if (streaming && index === messages.length - 1 && !message) {
      return {
        isBot: true,
        message: '',
        name: 'Assistant',
        images: [],
        sources: []
      }
    }
    return message
  }

  return (
    <>
      {/* Main chat container with message list */}
      <div className="relative flex flex-col items-center w-full pt-16 pb-4">
        {/* Show empty state when no messages exist */}
        {messages.length === 0 && (
          <div className="w-full mt-32">
            <PlaygroundEmpty />
          </div>
        )}

        {/* Render message list */}
        {messages.map((message, index) => {
          const messageToRender = getMessageToRender(message, index)
          const isThinking = shouldShowThinking(messageToRender, index)

          return (
            <PlaygroundMessage
              key={index}
              isBot={messageToRender.isBot}
              message={messageToRender.message || ''}
              name={messageToRender.name}
              images={messageToRender.images || []}
              currentMessageIndex={index}
              totalMessages={messages.length}
              onRengerate={regenerateLastMessage}
              isProcessing={streaming}
              isSearchingInternet={isSearchingInternet}
              sources={messageToRender.sources}
              onEditFormSubmit={(value, isSend) => {
                editMessage(index, value, !messageToRender.isBot, isSend)
              }}
              onSourceClick={(data) => {
                setSource(data)
                setIsSourceOpen(true)
              }}
              isTTSEnabled={ttsEnabled}
              generationInfo={messageToRender?.generationInfo}
              isStreaming={streaming}
              reasoningTimeTaken={messageToRender?.reasoning_time_taken}
              openReasoning={openReasoning}
              isThinking={isThinking}
              modelImage={messageToRender?.modelImage}
              modelName={messageToRender?.modelName}
            />
          )
        })}
      </div>

      {/* Bottom padding to ensure messages don't get hidden behind input */}
      <div className="w-full pb-[157px]"></div>

      {/* Source popup for displaying reference information */}
      <MessageSourcePopup
        open={isSourceOpen}
        setOpen={setIsSourceOpen}
        source={source}
      />
    </>
  )
}
