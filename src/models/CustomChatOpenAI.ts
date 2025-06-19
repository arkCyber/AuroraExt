import { type ClientOptions, OpenAI as OpenAIClient } from "openai"
import {
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    ChatMessage,
    ChatMessageChunk,
    FunctionMessageChunk,
    HumanMessageChunk,
    SystemMessageChunk,
    ToolMessageChunk
} from "@langchain/core/messages"
import { ChatGenerationChunk, ChatResult } from "@langchain/core/outputs"
import { getEnvironmentVariable } from "@langchain/core/utils/env"
import {
    BaseChatModel,
    BaseChatModelParams
} from "@langchain/core/language_models/chat_models"
import { convertToOpenAITool } from "@langchain/core/utils/function_calling"
import {
    RunnablePassthrough,
    RunnableSequence
} from "@langchain/core/runnables"
import {
    JsonOutputParser,
    StructuredOutputParser
} from "@langchain/core/output_parsers"
import { JsonOutputKeyToolsParser } from "@langchain/core/output_parsers/openai_tools"
import { wrapOpenAIClientError } from "./utils/openai.js"
import {
    ChatOpenAICallOptions,
    getEndpoint,
    OpenAIChatInput,
    OpenAICoreRequestOptions
} from "@langchain/openai"
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager"
import { TokenUsage } from "@langchain/core/language_models/base"
import { LegacyOpenAIInput } from "./types.js"
import { CustomAIMessageChunk } from "./CustomAIMessageChunk.js"

type OpenAIRoleEnum = "system" | "assistant" | "user" | "function" | "tool"

function extractGenericMessageCustomRole(message: ChatMessage) {
    if (
        message.role !== "system" &&
        message.role !== "assistant" &&
        message.role !== "user" &&
        message.role !== "function" &&
        message.role !== "tool"
    ) {
        console.warn(`Unknown message role: ${message.role}`)
    }
    return message.role
}
export function messageToOpenAIRole(message: BaseMessage): OpenAIRoleEnum {
    const type = message._getType()
    switch (type) {
        case "system":
            return "system"
        case "ai":
            return "assistant"
        case "human":
            return "user"
        case "function":
            return "function"
        case "tool":
            return "tool"
        case "generic": {
            if (!ChatMessage.isInstance(message))
                throw new Error("Invalid generic chat message")
            return extractGenericMessageCustomRole(message) as OpenAIRoleEnum
        }
        default:
            return type
    }
}
function openAIResponseToChatMessage(
    message: OpenAIClient.Chat.Completions.ChatCompletionMessage
) {
    switch (message.role) {
        case "assistant":
            return new AIMessage(message.content || "", {
                // function_call: message.function_call,
                // tool_calls: message.tool_calls
                // reasoning_content: message?.reasoning_content || null
            })
        default:
            return new ChatMessage(message.content || "", message.role ?? "unknown")
    }
}
function _convertDeltaToMessageChunk(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delta: Record<string, any>,
    defaultRole?: OpenAIRoleEnum
) {
    const role = delta.role ?? defaultRole
    const content = delta.content ?? ""
    const reasoning_content: string | undefined | null =
        delta?.reasoning_content ?? undefined
    let additional_kwargs
    if (delta.function_call) {
        additional_kwargs = {
            function_call: delta.function_call
        }
    } else if (delta.tool_calls) {
        additional_kwargs = {
            tool_calls: delta.tool_calls
        }
    } else {
        additional_kwargs = {}
    }
    if (role === "user") {
        return new HumanMessageChunk({ content })
    } else if (role === "assistant") {
        return new CustomAIMessageChunk({
            content,
            additional_kwargs: {
                ...additional_kwargs,
                reasoning_content
            }
        }) as any
    } else if (role === "system") {
        return new SystemMessageChunk({ content })
    } else if (role === "function") {
        return new FunctionMessageChunk({
            content,
            additional_kwargs,
            name: delta.name
        })
    } else if (role === "tool") {
        return new ToolMessageChunk({
            content,
            additional_kwargs,
            tool_call_id: delta.tool_call_id
        })
    } else {
        return new ChatMessageChunk({ content, role })
    }
}
function convertMessagesToOpenAIParams(messages: any[]) {
    // TODO: Function messages do not support array content, fix cast
    return messages.map((message) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completionParam: { role: string; content: string; name?: string } = {
            role: messageToOpenAIRole(message),
            content: message.content
        }
        if (message.name != null) {
            completionParam.name = message.name
        }

        return completionParam
    })
}
export class CustomChatOpenAI<
    CallOptions extends ChatOpenAICallOptions = ChatOpenAICallOptions
>
    extends BaseChatModel<CallOptions>
    implements OpenAIChatInput {
    temperature = 1

    topP = 1

    frequencyPenalty = 0

    presencePenalty = 0

    n = 1

    logitBias?: Record<string, number>

    modelName = "gpt-3.5-turbo"

    model = "gpt-3.5-turbo"

    modelKwargs?: OpenAIChatInput["modelKwargs"]

    stop?: string[]

    stopSequences?: string[]

    user?: string

    timeout?: number

    streaming = false

    streamUsage = true

    maxTokens?: number

    logprobs?: boolean

    topLogprobs?: number

    openAIApiKey?: string

    apiKey?: string

    azureOpenAIApiVersion?: string

    azureOpenAIApiKey?: string

    azureADTokenProvider?: () => Promise<string>

    azureOpenAIApiInstanceName?: string

    azureOpenAIApiDeploymentName?: string

    azureOpenAIBasePath?: string

    organization?: string

    protected client: OpenAIClient

    protected clientConfig: ClientOptions
    static lc_name() {
        return "ChatOpenAI"
    }
    get callKeys() {
        return [
            ...super.callKeys,
            "options",
            "function_call",
            "functions",
            "tools",
            "tool_choice",
            "promptIndex",
            "response_format",
            "seed"
        ]
    }
    get lc_secrets() {
        return {
            openAIApiKey: "OPENAI_API_KEY",
            azureOpenAIApiKey: "AZURE_OPENAI_API_KEY",
            organization: "OPENAI_ORGANIZATION"
        }
    }
    get lc_aliases() {
        return {
            modelName: "model",
            openAIApiKey: "openai_api_key",
            azureOpenAIApiVersion: "azure_openai_api_version",
            azureOpenAIApiKey: "azure_openai_api_key",
            azureOpenAIApiInstanceName: "azure_openai_api_instance_name",
            azureOpenAIApiDeploymentName: "azure_openai_api_deployment_name"
        }
    }
    constructor(
        fields?: Partial<OpenAIChatInput> &
            BaseChatModelParams & {
                configuration?: ClientOptions & LegacyOpenAIInput
            },
        /** @deprecated */
        configuration?: ClientOptions & LegacyOpenAIInput
    ) {
        super(fields ?? {})
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        })
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        })
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        })
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        })
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        })
        Object.defineProperty(this, "logitBias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt-3.5-turbo"
        })
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        })
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "logprobs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "topLogprobs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "openAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "azureOpenAIApiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "azureOpenAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "azureOpenAIApiInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "azureOpenAIApiDeploymentName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "azureOpenAIBasePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "organization", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        Object.defineProperty(this, "clientConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        })
        this.openAIApiKey =
            fields?.openAIApiKey ?? getEnvironmentVariable("OPENAI_API_KEY")

        this.modelName = fields?.modelName ?? this.modelName
        this.modelKwargs = fields?.modelKwargs ?? {}
        this.timeout = fields?.timeout
        this.temperature = fields?.temperature ?? this.temperature
        this.topP = fields?.topP ?? this.topP
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty
        this.maxTokens = fields?.maxTokens
        this.logprobs = fields?.logprobs
        this.topLogprobs = fields?.topLogprobs
        this.n = fields?.n ?? this.n
        this.logitBias = fields?.logitBias
        this.stop = fields?.stop
        this.user = fields?.user
        this.streaming = fields?.streaming ?? false
        this.clientConfig = {
            apiKey: this.openAIApiKey,
            organization: this.organization,
            baseURL: configuration?.basePath ?? fields?.configuration?.basePath,
            dangerouslyAllowBrowser: true,
            defaultHeaders:
                configuration?.baseOptions?.headers ??
                fields?.configuration?.baseOptions?.headers,
            defaultQuery:
                configuration?.baseOptions?.params ??
                fields?.configuration?.baseOptions?.params,
            ...configuration,
            ...fields?.configuration
        }
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options) {
        function isStructuredToolArray(tools) {
            return (
                tools !== undefined &&
                tools.every((tool) => Array.isArray(tool.lc_namespace))
            )
        }
        const params = {
            model: this.modelName,
            temperature: this.temperature,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            max_tokens: this.maxTokens === -1 ? undefined : this.maxTokens,
            logprobs: this.logprobs,
            top_logprobs: this.topLogprobs,
            n: this.n,
            logit_bias: this.logitBias,
            stop: options?.stop ?? this.stop,
            user: this.user,
            stream: this.streaming,
            functions: options?.functions,
            function_call: options?.function_call,
            tools: isStructuredToolArray(options?.tools)
                ? options?.tools.map(convertToOpenAITool)
                : options?.tools,
            tool_choice: options?.tool_choice,
            response_format: options?.response_format,
            seed: options?.seed,
            ...this.modelKwargs
        }
        return params
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            //@ts-ignore
            ...this?.invocationParams(),
            ...this.clientConfig
        }
    }
    async *_streamResponseChunks(
        messages: BaseMessage[],
        options: this["ParsedCallOptions"],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk> {
        const messagesMapped = convertMessagesToOpenAIParams(messages)
        const params = {
            ...this.invocationParams(options),
            messages: messagesMapped,
            stream: true
        }
        let defaultRole
        
        try {
            //@ts-ignore
            const streamIterable = await this.completionWithRetry(params, options)
            
            // Check if this might be a MouseChat-style complete response instead of SSE
            const isMouseChatResponse = async (iterable: any) => {
                // Try to read first chunk to determine format
                const iterator = iterable[Symbol.asyncIterator]()
                const firstChunk = await iterator.next()
                
                if (firstChunk.done) return { isMouseChat: false, iterator: null, firstData: null }
                
                const data = firstChunk.value
                // MouseChat returns complete JSON objects instead of SSE deltas
                const hasCompleteMessage = data?.choices?.[0]?.message?.content
                const lacksSSEDelta = !data?.choices?.[0]?.delta
                
                return { 
                    isMouseChat: hasCompleteMessage && lacksSSEDelta, 
                    iterator, 
                    firstData: data 
                }
            }
            
            const { isMouseChat, iterator, firstData } = await isMouseChatResponse(streamIterable)
            
            if (isMouseChat && firstData) {
                console.log('🐭 MouseChat response format detected - converting to streaming chunks')
                
                // Convert complete MouseChat response to streaming chunks
                const choice = firstData?.choices?.[0]
                if (choice?.message?.content) {
                    const content = choice.message.content
                    const chunks = content.split(' ') // Split by words for streaming effect
                    
                    // Yield each word as a separate chunk
                    for (let i = 0; i < chunks.length; i++) {
                        const chunkContent = i === 0 ? chunks[i] : ' ' + chunks[i]
                        
                        const chunk = _convertDeltaToMessageChunk({
                            role: 'assistant',
                            content: chunkContent
                        }, defaultRole)
                        
                        defaultRole = 'assistant'
                        
                        const newTokenIndices = {
                            //@ts-ignore
                            prompt: options?.promptIndex ?? 0,
                            completion: choice.index ?? 0
                        }
                        
                        const generationInfo = { ...newTokenIndices } as any
                        if (i === chunks.length - 1) {
                            generationInfo.finish_reason = choice.finish_reason || 'stop'
                        }
                        
                        const generationChunk = new ChatGenerationChunk({
                            message: chunk,
                            text: chunk.content,
                            generationInfo
                        })
                        
                        yield generationChunk
                        
                        // eslint-disable-next-line no-void
                        void runManager?.handleLLMNewToken(
                            generationChunk.text ?? "",
                            newTokenIndices,
                            undefined,
                            undefined,
                            undefined,
                            { chunk: generationChunk }
                        )
                        
                        // Add small delay for streaming effect
                        await new Promise(resolve => setTimeout(resolve, 50))
                    }
                }
            } else {
                // Standard SSE processing for OpenAI-compatible providers
                console.log('🌊 Standard SSE streaming format detected')
                
                // Process first chunk if available
                if (firstData && !isMouseChat) {
                    const choice = firstData?.choices?.[0]
                    if (choice) {
                        const { delta } = choice
                        if (delta) {
                            const chunk = _convertDeltaToMessageChunk(delta, defaultRole)
                            defaultRole = delta.role ?? defaultRole
                            const newTokenIndices = {
                                //@ts-ignore
                                prompt: options?.promptIndex ?? 0,
                                completion: choice.index ?? 0
                            }
                            
                            if (typeof chunk.content === "string") {
                                const generationInfo = { ...newTokenIndices } as any
                                if (choice.finish_reason !== undefined) {
                                    generationInfo.finish_reason = choice.finish_reason
                                }
                                if (this.logprobs) {
                                    generationInfo.logprobs = choice.logprobs
                                }
                                const generationChunk = new ChatGenerationChunk({
                                    message: chunk,
                                    text: chunk.content,
                                    generationInfo
                                })
                                yield generationChunk
                                
                                // eslint-disable-next-line no-void
                                void runManager?.handleLLMNewToken(
                                    generationChunk.text ?? "",
                                    newTokenIndices,
                                    undefined,
                                    undefined,
                                    undefined,
                                    { chunk: generationChunk }
                                )
                            }
                        }
                    }
                }
                
                // Continue processing remaining chunks
                for await (const data of iterator || streamIterable) {
                    const choice = data?.choices[0]
                    if (!choice) {
                        continue
                    }
                    const { delta } = choice
                    if (!delta) {
                        continue
                    }
                    const chunk = _convertDeltaToMessageChunk(delta, defaultRole)
                    defaultRole = delta.role ?? defaultRole
                    const newTokenIndices = {
                        //@ts-ignore
                        prompt: options?.promptIndex ?? 0,
                        completion: choice.index ?? 0
                    }
                    if (typeof chunk.content !== "string") {
                        console.log(
                            "[WARNING]: Received non-string content from OpenAI. This is currently not supported."
                        )
                        continue
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const generationInfo = { ...newTokenIndices } as any
                    if (choice.finish_reason !== undefined) {
                        generationInfo.finish_reason = choice.finish_reason
                    }
                    if (this.logprobs) {
                        generationInfo.logprobs = choice.logprobs
                    }
                    const generationChunk = new ChatGenerationChunk({
                        message: chunk,
                        text: chunk.content,
                        generationInfo
                    })
                    yield generationChunk
                    // eslint-disable-next-line no-void
                    void runManager?.handleLLMNewToken(
                        generationChunk.text ?? "",
                        newTokenIndices,
                        undefined,
                        undefined,
                        undefined,
                        { chunk: generationChunk }
                    )
                }
            }
        } catch (streamError) {
            // Check if this is a MouseChat streaming error
            const isMouseChatStreamError = streamError?.message?.includes('Stream interrupted') || 
                                         streamError?.message?.includes('stream has been closed')
            
            if (isMouseChatStreamError) {
                console.log('🚨 MouseChat streaming error detected, falling back to non-streaming mode')
                
                // Fallback to non-streaming mode for MouseChat
                const nonStreamParams = {
                    ...this.invocationParams(options),
                    messages: messagesMapped,
                    stream: false
                }
                
                try {
                    //@ts-ignore
                    const nonStreamResponse = await this.completionWithRetry(nonStreamParams, options)
                    
                    console.log('✅ MouseChat non-streaming fallback successful')
                    
                    // Convert non-streaming response to streaming chunks
                    const choice = (nonStreamResponse as any)?.choices?.[0]
                    if (choice?.message?.content) {
                        const content = choice.message.content
                        const chunks = content.split(' ') // Split by words for streaming effect
                        
                        // Yield each word as a separate chunk
                        for (let i = 0; i < chunks.length; i++) {
                            const chunkContent = i === 0 ? chunks[i] : ' ' + chunks[i]
                            
                            const chunk = _convertDeltaToMessageChunk({
                                role: 'assistant',
                                content: chunkContent
                            }, defaultRole)
                            
                            defaultRole = 'assistant'
                            
                            const newTokenIndices = {
                                //@ts-ignore
                                prompt: options?.promptIndex ?? 0,
                                completion: choice.index ?? 0
                            }
                            
                            const generationInfo = { ...newTokenIndices } as any
                            if (i === chunks.length - 1) {
                                generationInfo.finish_reason = choice.finish_reason || 'stop'
                            }
                            
                            const generationChunk = new ChatGenerationChunk({
                                message: chunk,
                                text: chunk.content,
                                generationInfo
                            })
                            
                            yield generationChunk
                            
                            // eslint-disable-next-line no-void
                            void runManager?.handleLLMNewToken(
                                generationChunk.text ?? "",
                                newTokenIndices,
                                undefined,
                                undefined,
                                undefined,
                                { chunk: generationChunk }
                            )
                            
                            // Add small delay for streaming effect
                            await new Promise(resolve => setTimeout(resolve, 50))
                        }
                    }
                } catch (fallbackError) {
                    console.error('❌ MouseChat non-streaming fallback also failed:', fallbackError)
                    throw new Error(`MouseChat API failed: ${fallbackError.message}`)
                }
            } else {
                // Re-throw non-MouseChat streaming errors
                throw streamError
            }
        }
        
        if (options.signal?.aborted) {
            throw new Error("AbortError")
        }
    }
    /**
     * Get the identifying parameters for the model
     *
     */
    identifyingParams() {
        return this._identifyingParams()
    }
    /** @ignore */
    async _generate(
        messages: BaseMessage[],
        options: this["ParsedCallOptions"],
        runManager?: CallbackManagerForLLMRun
    ): Promise<ChatResult> {
        const tokenUsage: TokenUsage = {}
        const params = this.invocationParams(options)
        const messagesMapped: any[] = convertMessagesToOpenAIParams(messages)
        if (params.stream) {
            const stream = this._streamResponseChunks(messages, options, runManager)
            const finalChunks: Record<number, ChatGenerationChunk> = {}
            for await (const chunk of stream) {
                //@ts-ignore
                chunk.message.response_metadata = {
                    ...chunk.generationInfo,
                    //@ts-ignore
                    ...chunk.message.response_metadata
                }
                const index = chunk.generationInfo?.completion ?? 0
                if (finalChunks[index] === undefined) {
                    finalChunks[index] = chunk
                } else {
                    finalChunks[index] = finalChunks[index].concat(chunk)
                }
            }
            const generations = Object.entries(finalChunks)
                .sort(([aKey], [bKey]) => parseInt(aKey, 10) - parseInt(bKey, 10))
                .map(([_, value]) => value)
            const { functions, function_call } = this.invocationParams(options)
            // OpenAI does not support token usage report under stream mode,
            // fallback to estimation.
            const promptTokenUsage = await this.getEstimatedTokenCountFromPrompt(
                messages,
                functions,
                function_call
            )
            const completionTokenUsage =
                await this.getNumTokensFromGenerations(generations)
            tokenUsage.promptTokens = promptTokenUsage
            tokenUsage.completionTokens = completionTokenUsage
            tokenUsage.totalTokens = promptTokenUsage + completionTokenUsage
            return { generations, llmOutput: { estimatedTokenUsage: tokenUsage } }
        } else {
            const data = await this.completionWithRetry(
                {
                    ...params,
                    //@ts-ignore
                    stream: false,
                    messages: messagesMapped
                },
                {
                    signal: options?.signal,
                    //@ts-ignore
                    ...options?.options
                }
            )
            const {
                completion_tokens: completionTokens,
                prompt_tokens: promptTokens,
                total_tokens: totalTokens
                //@ts-ignore
            } = data?.usage ?? {}
            if (completionTokens) {
                tokenUsage.completionTokens =
                    (tokenUsage.completionTokens ?? 0) + completionTokens
            }
            if (promptTokens) {
                tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens
            }
            if (totalTokens) {
                tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens
            }
            const generations = []
            //@ts-ignore
            for (const part of data?.choices ?? []) {
                const text = part.message?.content ?? ""
                const generation = {
                    text,
                    message: openAIResponseToChatMessage(
                        part.message ?? { role: "assistant" }
                    )
                }
                //@ts-ignore
                generation.generationInfo = {
                    ...(part.finish_reason ? { finish_reason: part.finish_reason } : {}),
                    ...(part.logprobs ? { logprobs: part.logprobs } : {})
                }
                generations.push(generation)
            }
            return {
                generations,
                llmOutput: { tokenUsage }
            }
        }
    }
    /**
     * Estimate the number of tokens a prompt will use.
     * Modified from: https://github.com/hmarr/openai-chat-tokens/blob/main/src/index.ts
     */
    async getEstimatedTokenCountFromPrompt(messages, functions, function_call) {
        let tokens = (await this.getNumTokensFromMessages(messages)).totalCount
        if (functions && messages.find((m) => m._getType() === "system")) {
            tokens -= 4
        }
        if (function_call === "none") {
            tokens += 1
        } else if (typeof function_call === "object") {
            tokens += (await this.getNumTokens(function_call.name)) + 4
        }
        return tokens
    }
    /**
     * Estimate the number of tokens an array of generations have used.
     */
    async getNumTokensFromGenerations(generations) {
        const generationUsages = await Promise.all(
            generations.map(async (generation) => {
                if (generation.message.additional_kwargs?.function_call) {
                    return (await this.getNumTokensFromMessages([generation.message]))
                        .countPerMessage[0]
                } else {
                    return await this.getNumTokens(generation.message.content)
                }
            })
        )
        return generationUsages.reduce((a, b) => a + b, 0)
    }
    async getNumTokensFromMessages(messages) {
        let totalCount = 0
        let tokensPerMessage = 0
        let tokensPerName = 0
        // From: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb
        if (this.modelName === "gpt-3.5-turbo-0301") {
            tokensPerMessage = 4
            tokensPerName = -1
        } else {
            tokensPerMessage = 3
            tokensPerName = 1
        }
        const countPerMessage = await Promise.all(
            messages.map(async (message) => {
                const textCount = await this.getNumTokens(message.content)
                const roleCount = await this.getNumTokens(messageToOpenAIRole(message))
                const nameCount =
                    message.name !== undefined
                        ? tokensPerName + (await this.getNumTokens(message.name))
                        : 0
                let count = textCount + tokensPerMessage + roleCount + nameCount
                // From: https://github.com/hmarr/openai-chat-tokens/blob/main/src/index.ts messageTokenEstimate
                const openAIMessage = message
                if (openAIMessage._getType() === "function") {
                    count -= 2
                }
                if (openAIMessage.additional_kwargs?.function_call) {
                    count += 3
                }
                if (openAIMessage?.additional_kwargs.function_call?.name) {
                    count += await this.getNumTokens(
                        openAIMessage.additional_kwargs.function_call?.name
                    )
                }
                if (openAIMessage.additional_kwargs.function_call?.arguments) {
                    try {
                        count += await this.getNumTokens(
                            // Remove newlines and spaces
                            JSON.stringify(
                                JSON.parse(
                                    openAIMessage.additional_kwargs.function_call?.arguments
                                )
                            )
                        )
                    } catch (error) {
                        console.error(
                            "Error parsing function arguments",
                            error,
                            JSON.stringify(openAIMessage.additional_kwargs.function_call)
                        )
                        count += await this.getNumTokens(
                            openAIMessage.additional_kwargs.function_call?.arguments
                        )
                    }
                }
                totalCount += count
                return count
            })
        )
        totalCount += 3 // every reply is primed with <|start|>assistant<|message|>
        return { totalCount, countPerMessage }
    }
    async completionWithRetry(
        request: OpenAIClient.Chat.ChatCompletionCreateParamsStreaming,
        options?: OpenAICoreRequestOptions
    ) {
        const requestOptions = this._getClientOptions(options)
        
        // Add detailed logging for API calls
        console.log('🌐 Making API call:', {
            modelName: this.modelName,
            baseURL: this.clientConfig?.baseURL,
            requestModel: request.model,
            messageCount: request.messages?.length,
            stream: request.stream,
            timestamp: new Date().toISOString()
        })
        
        // Add detailed authentication debugging
        console.log('🔑 [DEBUG] Authentication details:')
        console.log('  - openAIApiKey:', this.openAIApiKey ? `${this.openAIApiKey.substring(0, 10)}...` : 'NOT SET')
        console.log('  - clientConfigApiKey:', this.clientConfig?.apiKey ? `${this.clientConfig.apiKey.substring(0, 10)}...` : 'NOT SET')
        console.log('  - hasDefaultHeaders:', !!this.clientConfig?.defaultHeaders)
        console.log('  - defaultHeaders:', this.clientConfig?.defaultHeaders)
        console.log('  - baseURL:', this.clientConfig?.baseURL)
        
        return this.caller.call(async () => {
            try {
                console.log('🔄 Executing API request to:', this.clientConfig?.baseURL)
                console.log('🛠️ [DEBUG] Request options:')
                console.log('  - hasHeaders:', !!requestOptions?.headers)
                console.log('  - headers keys:', requestOptions?.headers ? Object.keys(requestOptions.headers) : [])
                console.log('  - headers values:', requestOptions?.headers)
                console.log('  - baseURL:', requestOptions?.baseURL)
                
                const res = await this.client.chat.completions.create(
                    request,
                    requestOptions
                )
                
                // Handle both streaming and non-streaming responses
                if (request.stream) {
                    console.log('✅ Streaming API response received')
                } else {
                    console.log('✅ API response received:', {
                        hasChoices: !!(res as any).choices,
                        choicesLength: (res as any).choices?.length,
                        firstChoice: (res as any).choices?.[0] ? {
                            role: (res as any).choices[0].message?.role,
                            hasContent: !!(res as any).choices[0].message?.content,
                            contentLength: (res as any).choices[0].message?.content?.length
                        } : null
                    })
                }
                return res
            } catch (error) {
                console.error('❌ API call failed:', {
                    error: error.message,
                    status: error.status,
                    type: error.type,
                    code: error.code
                })
                throw wrapOpenAIClientError(error)
            }
        })
    }
    _getClientOptions(options) {
        if (!this.client) {
            const openAIEndpointConfig = {
                azureOpenAIApiDeploymentName: this.azureOpenAIApiDeploymentName,
                azureOpenAIApiInstanceName: this.azureOpenAIApiInstanceName,
                azureOpenAIApiKey: this.azureOpenAIApiKey,
                azureOpenAIBasePath: this.azureOpenAIBasePath,
                baseURL: this.clientConfig.baseURL
            }
            const endpoint = getEndpoint(openAIEndpointConfig)
            const params = {
                ...this.clientConfig,
                baseURL: endpoint,
                timeout: this.timeout,
                maxRetries: 0
            }
            if (!params.baseURL) {
                delete params.baseURL
            }
            
            console.log('🔧 [DEBUG] Creating OpenAI client with params:')
            console.log('  - apiKey:', params.apiKey ? `${params.apiKey.substring(0, 10)}...` : 'NOT SET')
            console.log('  - baseURL:', params.baseURL)
            console.log('  - defaultHeaders:', params.defaultHeaders)
            
            this.client = new OpenAIClient(params)
        }
        const requestOptions = {
            ...this.clientConfig,
            ...options
        }
        if (this.azureOpenAIApiKey) {
            requestOptions.headers = {
                "api-key": this.azureOpenAIApiKey,
                ...requestOptions.headers
            }
            requestOptions.query = {
                "api-version": this.azureOpenAIApiVersion,
                ...requestOptions.query
            }
        }
        return requestOptions
    }
    _llmType() {
        return "openai"
    }
    /** @ignore */
    _combineLLMOutput(...llmOutputs) {
        return llmOutputs.reduce(
            (acc, llmOutput) => {
                if (llmOutput && llmOutput.tokenUsage) {
                    acc.tokenUsage.completionTokens +=
                        llmOutput.tokenUsage.completionTokens ?? 0
                    acc.tokenUsage.promptTokens += llmOutput.tokenUsage.promptTokens ?? 0
                    acc.tokenUsage.totalTokens += llmOutput.tokenUsage.totalTokens ?? 0
                }
                return acc
            },
            {
                tokenUsage: {
                    completionTokens: 0,
                    promptTokens: 0,
                    totalTokens: 0
                }
            }
        )
    }
    withStructuredOutput(outputSchema, config) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let schema
        let name
        let method
        let includeRaw
        if (isStructuredOutputMethodParams(outputSchema)) {
            schema = outputSchema.schema
            name = outputSchema.name
            method = outputSchema.method
            includeRaw = outputSchema.includeRaw
        } else {
            schema = outputSchema
            name = config?.name
            method = config?.method
            includeRaw = config?.includeRaw
        }
        let llm
        let outputParser
        if (method === "jsonMode") {
            llm = this.bind({})
            if (isZodSchema(schema)) {
                outputParser = StructuredOutputParser.fromZodSchema(schema)
            } else {
                outputParser = new JsonOutputParser()
            }
        } else {
            let functionName = name ?? "extract"
            // Is function calling

            let openAIFunctionDefinition
            if (
                typeof schema.name === "string" &&
                typeof schema.parameters === "object" &&
                schema.parameters != null
            ) {
                openAIFunctionDefinition = schema
                functionName = schema.name
            } else {
                openAIFunctionDefinition = {
                    name: schema.title ?? functionName,
                    description: schema.description ?? "",
                    parameters: schema
                }
            }
            llm = this.bind({})
            outputParser = new JsonOutputKeyToolsParser({
                returnSingle: true,
                keyName: functionName
            })
        }
        if (!includeRaw) {
            return llm.pipe(outputParser)
        }
        const parserAssign = RunnablePassthrough.assign({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsed: (input, config) => outputParser.invoke(input.raw, config)
        })
        const parserNone = RunnablePassthrough.assign({
            parsed: () => null
        })
        const parsedWithFallback = parserAssign.withFallbacks({
            fallbacks: [parserNone]
        })
        return RunnableSequence.from([
            {
                raw: llm
            },
            parsedWithFallback
        ] as any)
    }
}
function isZodSchema(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input
) {
    // Check for a characteristic method of Zod schemas
    return typeof input?.parse === "function"
}
function isStructuredOutputMethodParams(
    x
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
) {
    return (
        x !== undefined &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof x.schema === "object"
    )
}

