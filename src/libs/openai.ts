type Model = {
  id: string
  name?: string
  display_name?: string
  type: string
}

/**
 * Get all available models from OpenAI-compatible API
 * @param baseUrl - The base URL of the API
 * @param apiKey - Optional API key for authentication
 * @param customHeaders - Optional custom headers
 * @returns Array of available models
 */
export const getAllOpenAIModels = async (
  baseUrl: string, 
  apiKey?: string, 
  customHeaders?: Array<{ key: string; value: string }>
) => {
  try {
    const url = `${baseUrl}/models`
    
    // Build headers object
    const headers: Record<string, string> = {}
    
    // Add Authorization header if API key is provided
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }
    
    // Add custom headers if provided
    if (customHeaders && Array.isArray(customHeaders)) {
      customHeaders.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    console.log(`🔍 [DEBUG] Fetching models from ${url}`)
    console.log('📋 [DEBUG] Request headers:', headers)
    console.log('🔑 [DEBUG] API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'No API key')
    console.log('🌐 [DEBUG] Base URL:', baseUrl)

    const res = await fetch(url, {
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log(`📊 [DEBUG] Response status: ${res.status} ${res.statusText}`)
    console.log(`🔗 [DEBUG] Response URL: ${res.url}`)

    // if Google API fails to return models, try another approach
    if (res.url == 'https://generativelanguage.googleapis.com/v1beta/openai/models') {
      const urlGoogle = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      const resGoogle = await fetch(urlGoogle, {
        signal: controller.signal
      })

      const data = await resGoogle.json()
      return data.models.map(model => ({
        id: model.name.replace(/^models\//, ""),
        name: model.name.replace(/^models\//, ""),
      })) as Model[]
    }

    if (!res.ok) {
      console.error(`❌ [ERROR] Failed to fetch models from ${baseUrl}: ${res.status} ${res.statusText}`)
      const responseText = await res.text()
      console.error('📄 [ERROR] Response body:', responseText)
      console.error('🔧 [ERROR] Headers sent:', headers)
      return []
    }

    if (baseUrl === "https://api.together.xyz/v1") {
      const data = (await res.json()) as Model[]
      return data.map(model => ({
        id: model.id,
        name: model.display_name,
      })) as Model[]
    }

    const responseText = await res.text()
    console.log('📄 [DEBUG] Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''))
    
    let data
    try {
      data = JSON.parse(responseText) as { data: Model[] }
      console.log('✅ [DEBUG] Parsed JSON successfully')
      console.log('📊 [DEBUG] Models count:', data.data?.length || 0)
      
      if (data.data && Array.isArray(data.data)) {
        console.log('🎯 [DEBUG] First few models:', data.data.slice(0, 3))
        return data.data
      } else {
        console.warn('⚠️ [WARNING] Response does not have expected data.data structure')
        console.log('🔍 [DEBUG] Actual structure:', Object.keys(data))
        
        // Try to handle different response formats
        if (Array.isArray(data)) {
          console.log('📋 [DEBUG] Response is array, returning as-is')
          return data
        } else if (data.models && Array.isArray(data.models)) {
          console.log('📋 [DEBUG] Found models array in response')
          return data.models
        } else {
          console.error('❌ [ERROR] Unknown response format')
          return []
        }
      }
    } catch (parseError) {
      console.error('❌ [ERROR] Failed to parse JSON response:', parseError)
      console.error('📄 [ERROR] Raw response that failed to parse:', responseText)
      return []
    }

  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      console.error('⏱️ [ERROR] Request timed out after 10 seconds')
    } else {
      console.error(`💥 [ERROR] Exception while fetching models from ${baseUrl}:`, e)
      console.error('🔍 [ERROR] Error details:', {
        name: e.name,
        message: e.message,
        stack: e.stack
      })
    }
    return []
  }
}
