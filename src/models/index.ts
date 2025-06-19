import { getModelInfo, isCustomModel, isOllamaModel } from "@/db/models"
import { ChatChromeAI } from "./ChatChromeAi"
import { ChatOllama } from "./ChatOllama"
import { getOpenAIConfigById } from "@/db/openai"
import { urlRewriteRuntime } from "@/libs/runtime"
import { ChatGoogleAI } from "./ChatGoogleAI"
import { CustomChatOpenAI } from "./CustomChatOpenAI"

export const pageAssistModel = async ({
  model,
  baseUrl,
  keepAlive,
  temperature,
  topK,
  topP,
  numCtx,
  seed,
  numGpu,
  numPredict,
  useMMap,
  minP,
  repeatLastN,
  repeatPenalty,
  tfsZ,
  numKeep,
  numThread,
  useMlock
}: {
  model: string
  baseUrl: string
  keepAlive?: string
  temperature?: number
  topK?: number
  topP?: number
  numCtx?: number
  seed?: number
  numGpu?: number
  numPredict?: number
  useMMap?: boolean
  minP?: number
  repeatPenalty?: number
  repeatLastN?: number
  tfsZ?: number
  numKeep?: number
  numThread?: number
  useMlock?: boolean
}) => {
  // Add detailed logging for model initialization
  console.log('🚀 Initializing model:', {
    modelName: model,
    isCustom: isCustomModel(model),
    baseUrl,
    timestamp: new Date().toISOString()
  })

  if (model === "chrome::gemini-nano::page-assist") {
    return new ChatChromeAI({
      temperature,
      topK
    })
  }

  const isCustom = isCustomModel(model)

  if (isCustom) {
    console.log('🔧 Processing custom model:', model)
    
    try {
      const modelInfo = await getModelInfo(model)
      console.log('📊 Model info retrieved:', {
        modelId: modelInfo?.model_id,
        providerId: modelInfo?.provider_id,
        name: modelInfo?.name
      })
      
      const providerInfo = await getOpenAIConfigById(modelInfo.provider_id)
      console.log('🔌 Provider info retrieved:', {
        provider: providerInfo?.provider,
        baseUrl: providerInfo?.baseUrl,
        hasApiKey: !!providerInfo?.apiKey
      })

      if (isOllamaModel(model)) {
        await urlRewriteRuntime(providerInfo.baseUrl || "")
      }

      if (providerInfo.provider === "gemini") {
        console.log('🤖 Creating Gemini model')
        return new ChatGoogleAI({
          modelName: modelInfo.model_id,
          openAIApiKey: providerInfo.apiKey || "temp",
          temperature,
          topP,
          maxTokens: numPredict,
          configuration: {
            apiKey: providerInfo.apiKey || "temp",
            baseURL: providerInfo.baseUrl || ""
          }
        }) as any
      }

      if (providerInfo.provider === "openrouter") {
        console.log('🌐 Creating OpenRouter model')
        return new CustomChatOpenAI({
          modelName: modelInfo.model_id,
          openAIApiKey: providerInfo.apiKey,
          temperature,
          topP,
          maxTokens: numPredict,
          configuration: {
            apiKey: providerInfo.apiKey,
            baseURL: providerInfo.baseUrl,
            dangerouslyAllowBrowser: true,
            defaultHeaders: {
              'Authorization': `Bearer ${providerInfo.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://pageassist.xyz/',
              'X-Title': 'Aurora'
            }
          },

        }) as any
      }

      console.log('🔥 Creating CustomChatOpenAI model for provider:', providerInfo.provider)
      console.log('🔑 [DEBUG] API Key info:', {
        hasApiKey: !!providerInfo.apiKey,
        apiKeyPrefix: providerInfo.apiKey ? providerInfo.apiKey.substring(0, 10) + '...' : 'None',
        baseUrl: providerInfo.baseUrl
      })
      
      const customModel = new CustomChatOpenAI({
        modelName: modelInfo.model_id,
        openAIApiKey: providerInfo.apiKey,
        temperature,
        topP,
        maxTokens: numPredict,
        configuration: {
          apiKey: providerInfo.apiKey,
          baseURL: providerInfo.baseUrl,
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'Authorization': `Bearer ${providerInfo.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      }) as any
      
      console.log('✅ CustomChatOpenAI model created successfully')
      return customModel
      
    } catch (error) {
      console.error('❌ Error creating custom model:', {
        model,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }
  
  console.log('🦙 Creating Ollama model for:', model)
  return new ChatOllama({
    baseUrl,
    keepAlive,
    temperature,
    topK,
    topP,
    numCtx,
    seed,
    model,
    numGpu,
    numPredict,
    useMMap,
    minP: minP,
    repeatPenalty: repeatPenalty,
    repeatLastN: repeatLastN,
    tfsZ,
    numKeep,
    numThread,
    useMlock
  })
}
