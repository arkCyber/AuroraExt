/**
 * Enhanced OpenAI API Library
 * 
 * Enhanced OpenAI-compatible API client with integrated authentication service,
 * comprehensive error handling, and Chrome storage support.
 * Features:
 * - Integration with API Authentication Service
 * - 401 error handling with automatic retry
 * - Chrome storage for configuration persistence
 * - Request/response logging with timestamps
 * - Multiple API provider support
 * - Connection testing and validation
 */

import { apiAuthService, type APIConfig } from "@/services/api-auth-service"
import { chromeStorageService } from "@/services/chrome-storage-service"

type Model = {
  id: string
  name?: string
  display_name?: string
  type: string
}

// Enhanced configuration interface
export interface EnhancedAPIConfig extends APIConfig {
  description?: string
  testEndpoint?: string
  supportedFeatures?: string[]
}

// API response interface
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
  headers?: Record<string, string>
  timestamp: number
  duration: number
}

/**
 * Enhanced OpenAI API client with authentication service integration
 */
export class EnhancedOpenAIClient {
  private static instance: EnhancedOpenAIClient
  private initialized = false

  private constructor() {}

  public static getInstance(): EnhancedOpenAIClient {
    if (!EnhancedOpenAIClient.instance) {
      EnhancedOpenAIClient.instance = new EnhancedOpenAIClient()
    }
    return EnhancedOpenAIClient.instance
  }

  /**
   * Initialize the enhanced client
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      console.log(`[${new Date().toISOString()}] Initializing Enhanced OpenAI Client...`)
      
      // Ensure auth service is initialized
      await apiAuthService.initialize()
      
      // Ensure storage service is initialized
      await chromeStorageService.initialize()
      
      this.initialized = true
      console.log(`[${new Date().toISOString()}] Enhanced OpenAI Client initialized successfully`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to initialize Enhanced OpenAI Client:`, error)
      throw error
    }
  }

  /**
   * Get all available models from OpenAI-compatible API
   * Enhanced version with authentication service integration
   */
  public async getAllModels(
    baseUrl?: string, 
    apiKey?: string, 
    customHeaders?: Array<{ key: string; value: string }>
  ): Promise<APIResponse<Model[]>> {
    const startTime = Date.now()
    
    try {
      await this.initialize()
      
      console.log(`[${new Date().toISOString()}] 🔍 [ENHANCED] Fetching models from API...`)
      
      // If parameters provided, create temporary config
      let config: Partial<APIConfig> | undefined
      if (baseUrl || apiKey || customHeaders) {
        config = {
          baseUrl: baseUrl || "http://localhost/api/v1",
          apiKey: apiKey || "sk-8d6804b011614dba7bd065f8644514b",
          headers: customHeaders
        }
      }
      
      // Use authentication service for the request
      const modelsData = await apiAuthService.makeAuthenticatedRequest<any>(
        '/models',
        { method: 'GET' },
        config
      )
      
      const duration = Date.now() - startTime
      
      // Process response data based on different API formats
      let models: Model[] = []
      
      if (modelsData?.data && Array.isArray(modelsData.data)) {
        console.log('✅ [ENHANCED] Standard OpenAI format detected')
        models = modelsData.data
      } else if (Array.isArray(modelsData)) {
        console.log('✅ [ENHANCED] Direct array format detected')
        models = modelsData
      } else if (modelsData?.models && Array.isArray(modelsData.models)) {
        console.log('✅ [ENHANCED] Custom models format detected')
        models = modelsData.models
      } else {
        console.warn('⚠️ [ENHANCED] Unknown response format, attempting to extract models')
        models = []
      }
      
      console.log(`✅ [ENHANCED] Successfully retrieved ${models.length} models in ${duration}ms`)
      
      // Store successful configuration for future use
      if (config && models.length > 0) {
        await this.storeWorkingConfiguration(config, models.length)
      }
      
      return {
        success: true,
        data: models,
        statusCode: 200,
        timestamp: Date.now(),
        duration
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ [ENHANCED] Failed to fetch models:`, error)
      
      // Try to provide helpful error messages
      let errorMessage = error.message
      if (error.message.includes('401')) {
        errorMessage = `Authentication failed: Invalid API key '${apiKey ? apiKey.substring(0, 10) + '...' : 'not provided'}'. Please check your API key and try again.`
      } else if (error.message.includes('timeout')) {
        errorMessage = `Request timeout: The API server at '${baseUrl || 'localhost'}' did not respond in time. Please check if the server is running.`
      } else if (error.message.includes('fetch')) {
        errorMessage = `Connection failed: Could not connect to API server at '${baseUrl || 'localhost'}'. Please verify the server is running and accessible.`
      }
      
      return {
        success: false,
        error: errorMessage,
        statusCode: 0,
        timestamp: Date.now(),
        duration
      }
    }
  }

  /**
   * Test API connection with enhanced diagnostics
   */
  public async testConnection(
    baseUrl?: string,
    apiKey?: string,
    customHeaders?: Array<{ key: string; value: string }>
  ): Promise<APIResponse<{
    connected: boolean
    modelsCount: number
    serverInfo?: any
    latency: number
  }>> {
    const startTime = Date.now()
    
    try {
      await this.initialize()
      
      console.log(`[${new Date().toISOString()}] 🧪 [ENHANCED] Testing API connection...`)
      
      // Test models endpoint
      const modelsResponse = await this.getAllModels(baseUrl, apiKey, customHeaders)
      
      if (!modelsResponse.success) {
        throw new Error(modelsResponse.error || 'Connection test failed')
      }
      
      const latency = Date.now() - startTime
      const modelsCount = modelsResponse.data?.length || 0
      
      console.log(`✅ [ENHANCED] Connection test successful - ${modelsCount} models, ${latency}ms latency`)
      
      // Try to get additional server info if available
      let serverInfo: any = {}
      try {
        const config = baseUrl || apiKey || customHeaders ? {
          baseUrl: baseUrl || "http://localhost/api/v1",
          apiKey: apiKey || "sk-8d6804b011614dba7bd065f8644514b",
          headers: customHeaders
        } : undefined
        
        serverInfo = await apiAuthService.makeAuthenticatedRequest<any>(
          '/version',
          { method: 'GET' },
          config
        ).catch(() => ({}))
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] Could not retrieve server info:`, error)
      }
      
      return {
        success: true,
        data: {
          connected: true,
          modelsCount,
          serverInfo,
          latency
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: latency
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ [ENHANCED] Connection test failed:`, error)
      
      return {
        success: false,
        error: error.message,
        data: {
          connected: false,
          modelsCount: 0,
          latency: duration
        },
        statusCode: 0,
        timestamp: Date.now(),
        duration
      }
    }
  }

  /**
   * Store working configuration for future reference
   */
  private async storeWorkingConfiguration(
    config: Partial<APIConfig>,
    modelsCount: number
  ): Promise<void> {
    try {
      const workingConfig = {
        ...config,
        lastTested: Date.now(),
        modelsCount,
        status: 'working'
      }
      
      const result = await chromeStorageService.set(
        'last_working_api_config',
        workingConfig,
        'local'
      )
      
      if (result.success) {
        console.log(`[${new Date().toISOString()}] ✅ [ENHANCED] Stored working configuration`)
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Failed to store working configuration:`, error)
    }
  }

  /**
   * Get last working configuration
   */
  public async getLastWorkingConfiguration(): Promise<APIResponse<Partial<APIConfig> | null>> {
    try {
      await this.initialize()
      
      const result = await chromeStorageService.get<any>(
        'last_working_api_config',
        'local'
      )
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          timestamp: Date.now(),
          duration: 0
        }
      }
      
      return {
        success: true,
        data: null,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to get last working configuration:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }

  /**
   * Update API key for current configuration
   */
  public async updateAPIKey(newApiKey: string): Promise<APIResponse<void>> {
    try {
      await this.initialize()
      
      console.log(`[${new Date().toISOString()}] 🔑 [ENHANCED] Updating API key...`)
      
      await apiAuthService.updateAPIKey(newApiKey)
      
      // Test the new configuration
      const testResult = await this.testConnection()
      
      if (!testResult.success) {
        throw new Error(`New API key test failed: ${testResult.error}`)
      }
      
      console.log(`✅ [ENHANCED] API key updated and tested successfully`)
      
      return {
        success: true,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`❌ [ENHANCED] Failed to update API key:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }

  /**
   * Get API request history
   */
  public async getRequestHistory(): Promise<APIResponse<any[]>> {
    try {
      await this.initialize()
      
      const history = await apiAuthService.getRequestHistory()
      
      return {
        success: true,
        data: history,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to get request history:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }

  /**
   * Clear API request history
   */
  public async clearRequestHistory(): Promise<APIResponse<void>> {
    try {
      await this.initialize()
      
      await apiAuthService.clearRequestHistory()
      
      return {
        success: true,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to clear request history:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }

  /**
   * Export all configurations and data
   */
  public async exportData(): Promise<APIResponse<string>> {
    try {
      await this.initialize()
      
      console.log(`[${new Date().toISOString()}] 📤 [ENHANCED] Exporting configuration data...`)
      
      const configData = await apiAuthService.exportConfiguration()
      const workingConfig = await this.getLastWorkingConfiguration()
      const requestHistory = await this.getRequestHistory()
      
      const exportData = {
        version: "1.0.0",
        exportedAt: Date.now(),
        apiConfigurations: JSON.parse(configData),
        lastWorkingConfiguration: workingConfig.data,
        requestHistory: requestHistory.data?.slice(-20) || [], // Last 20 requests
        metadata: {
          totalConfigs: JSON.parse(configData).configs?.length || 0,
          totalRequests: requestHistory.data?.length || 0
        }
      }
      
      const exportString = JSON.stringify(exportData, null, 2)
      
      console.log(`✅ [ENHANCED] Data exported successfully`)
      
      return {
        success: true,
        data: exportString,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`❌ [ENHANCED] Failed to export data:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }

  /**
   * Import configurations and data
   */
  public async importData(importData: string): Promise<APIResponse<void>> {
    try {
      await this.initialize()
      
      console.log(`[${new Date().toISOString()}] 📥 [ENHANCED] Importing configuration data...`)
      
      const data = JSON.parse(importData)
      
      // Validate import data
      if (!data.version || !data.apiConfigurations) {
        throw new Error('Invalid import data format')
      }
      
      // Import API configurations
      if (data.apiConfigurations.configs) {
        await apiAuthService.importConfiguration(JSON.stringify(data.apiConfigurations))
      }
      
      // Import last working configuration
      if (data.lastWorkingConfiguration) {
        await chromeStorageService.set(
          'last_working_api_config',
          data.lastWorkingConfiguration,
          'local'
        )
      }
      
      console.log(`✅ [ENHANCED] Data imported successfully`)
      
      return {
        success: true,
        timestamp: Date.now(),
        duration: 0
      }
    } catch (error) {
      console.error(`❌ [ENHANCED] Failed to import data:`, error)
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration: 0
      }
    }
  }
}

// Export singleton instance
export const enhancedOpenAIClient = EnhancedOpenAIClient.getInstance()

// Legacy compatibility function
export const getAllOpenAIModels = async (
  baseUrl: string,
  apiKey?: string,
  customHeaders?: Array<{ key: string; value: string }>
): Promise<Model[]> => {
  try {
    const response = await enhancedOpenAIClient.getAllModels(baseUrl, apiKey, customHeaders)
    return response.success ? (response.data || []) : []
  } catch (error) {
    console.error('Legacy getAllOpenAIModels failed:', error)
    return []
  }
}

// Auto-initialize on import
enhancedOpenAIClient.initialize().catch(error => {
  console.error('Failed to auto-initialize Enhanced OpenAI Client:', error)
}) 