import { SidepanelMessage } from "./SideMessage"
import { SidepanelForm } from "./form"
import { SidepanelHeader } from "./header"
import { useMessage } from "~/hooks/useMessage"
import { useWebUI } from "~/store/webui"
import type { Message } from "~/store/option"

export const Chat = () => {
    const {
        messages,
        streaming,
        isProcessing,
        regenerateLastMessage,
        editMessage,
        selectedModel,
        webSearch,
        isSearchingInternet,
    } = useMessage()
    const { ttsEnabled } = useWebUI()

    return (
        <div className="flex flex-col h-full">
            <SidepanelHeader />
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-14">
                <div className="flex flex-col items-center justify-center w-full h-full">
                    {messages.map((message: Message, index) => (
                        <SidepanelMessage
                            key={index}
                            message={message.message}
                            message_type={message.messageType}
                            isBot={message.isBot}
                            name={message.name}
                            images={message.images}
                            currentMessageIndex={index}
                            totalMessages={messages.length}
                            onRengerate={regenerateLastMessage}
                            onEditFormSubmit={(value, isSend) => editMessage(index, value, isSend)}
                            isProcessing={isProcessing}
                            webSearch={webSearch}
                            isSearchingInternet={isSearchingInternet}
                            sources={message.sources}
                            onSourceClick={(source) => window.open(source.url, '_blank')}
                            isTTSEnabled={ttsEnabled}
                            generationInfo={null}
                            isStreaming={streaming}
                            reasoningTimeTaken={message.reasoning_time_taken}
                        />
                    ))}
                </div>
            </div>
            <SidepanelForm dropedFile={undefined} />
        </div>
    )
} 