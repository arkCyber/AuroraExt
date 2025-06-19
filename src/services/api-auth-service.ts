/**
 * API Authentication Service
 * 
 * Enhanced API authentication service with comprehensive error handling,
 * Chrome storage integration, and automatic retry mechanisms.
 * Features:
 * - Secure API key storage in Chrome extension storage
 * - 401 authentication error handling with automatic retry
 * - Request/response logging with timestamps
 * - Multiple authentication methods support
 * - Chrome storage sync and backup
 */

import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

// API Configuration Constants
const API_CONFIG_KEY = "api_config"
const API_HISTORY_KEY = "api_request_history"
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_TIMEOUT = 10000
const DEFAULT_BASE_URL = "http://localhost/api/v1"

// Enhanced API configuration interface
export interface APIConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  headers?: Array<{ key: string; value: string }>
  timeout?: number
  retryAttempts?: number
  provider?: string
  createdAt: number
  updatedAt: number
  isActive: boolean
}

// Request/Response history interface
export interface APIRequestHistory {
  id: string
  timestamp: number
  method: string
  url: string
  status: number
  statusText: string
  duration: number
  error?: string
  retryCount: number
}

export class APIAuthService {
  private static instance: APIAuthService
  private activeConfig: APIConfig | null = null

  private constructor() {}

  public static getInstance(): APIAuthService {
    if (!APIAuthService.instance) {
      APIAuthService.instance = new APIAuthService()
    }
    return APIAuthService.instance
  }

  /**
   * Initialize the service with default configuration
   */
  public async initialize(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Initializing API Auth Service...`)
      
      // Load existing configuration
      const existingConfig = await this.getActiveConfig()
      if (!existingConfig) {
        // Create default configuration if none exists
        const defaultConfig = await this.createDefaultConfig()
        await this.setActiveConfig(defaultConfig)
        console.log(`[${new Date().toISOString()}] Created default API configuration`)
      } else {
        this.activeConfig = existingConfig
        console.log(`[${new Date().toISOString()}] Loaded existing API configuration: ${existingConfig.name}`)
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to initialize API Auth Service:`, error)
      throw error
    }
  }

  /**
   * Create default API configuration
   */
  private async createDefaultConfig(): Promise<APIConfig> {
    const defaultConfig: APIConfig = {
      id: this.generateId(),
      name: "Default API",
      baseUrl: DEFAULT_BASE_URL,
      apiKey: "sk-8d6804b011614dba7bd065f8644514b", // Default API key from user
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" }
      ],
      timeout: DEFAULT_TIMEOUT,
      retryAttempts: MAX_RETRY_ATTEMPTS,
      provider: "localhost",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true
    }

    await this.saveAPIConfig(defaultConfig)
    return defaultConfig
  }

  /**
   * Save API configuration to Chrome storage
   */
  public async saveAPIConfig(config: APIConfig): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Saving API configuration: ${config.name}`)
      
      // Update timestamp
      config.updatedAt = Date.now()
      
      // Get existing configurations
      const existingConfigs = await this.getAllConfigs()
      const updatedConfigs = existingConfigs.filter(c => c.id !== config.id)
      updatedConfigs.push(config)
      
      // Save to Chrome storage
      await storage.set(API_CONFIG_KEY, updatedConfigs)
      
      // Also backup to Chrome sync storage if available
      try {
        const syncStorage = new Storage({ area: "sync" })
        await syncStorage.set(API_CONFIG_KEY + "_backup", updatedConfigs.slice(-5)) // Keep last 5 configs
      } catch (syncError) {
        console.warn(`[${new Date().toISOString()}] Failed to backup to sync storage:`, syncError)
      }
      
      console.log(`[${new Date().toISOString()}] API configuration saved successfully`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to save API configuration:`, error)
      throw error
    }
  }

  /**
   * Get all API configurations
   */
  public async getAllConfigs(): Promise<APIConfig[]> {
    try {
      const configs = await storage.get<APIConfig[]>(API_CONFIG_KEY)
      return configs || []
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to get API configurations:`, error)
      return []
    }
  }

  /**
   * Get active API configuration
   */
  public async getActiveConfig(): Promise<APIConfig | null> {
    try {
      const configs = await this.getAllConfigs()
      const activeConfig = configs.find(c => c.isActive)
      return activeConfig || null
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to get active configuration:`, error)
      return null
    }
  }

  /**
   * Set active API configuration
   */
  public async setActiveConfig(config: APIConfig): Promise<void> {
    try {
      // Deactivate all other configurations
      const allConfigs = await this.getAllConfigs()
      allConfigs.forEach(c => c.isActive = false)
      
      // Activate the selected configuration
      config.isActive = true
      
      // Save all configurations
      await storage.set(API_CONFIG_KEY, allConfigs)
      this.activeConfig = config
      
      console.log(`[${new Date().toISOString()}] Set active API configuration: ${config.name}`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to set active configuration:`, error)
      throw error
    }
  }

  /**
   * Make authenticated API request with automatic retry
   */
  public async makeAuthenticatedRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    customConfig?: Partial<APIConfig>
  ): Promise<T> {
    const startTime = Date.now()
    const requestId = this.generateId()
    
    // Get configuration
    const config = customConfig 
      ? { ...this.activeConfig, ...customConfig } as APIConfig
      : this.activeConfig || await this.getActiveConfig()
    
    if (!config) {
      throw new Error('No API configuration available')
    }

    const url = `${config.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
    const maxRetries = config.retryAttempts || MAX_RETRY_ATTEMPTS
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${new Date().toISOString()}] Making API request (attempt ${attempt + 1}/${maxRetries + 1}): ${options.method || 'GET'} ${url}`)
        
        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers as Record<string, string>
        }
        
        // Add API key authentication
        if (config.apiKey) {
          headers.Authorization = `Bearer ${config.apiKey}`
        }
        
        // Add custom headers
        if (config.headers) {
          config.headers.forEach(header => {
            headers[header.key] = header.value
          })
        }
        
        // Setup request with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || DEFAULT_TIMEOUT)
        
        console.log(`[${new Date().toISOString()}] Request headers:`, {
          ...headers,
          Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'Not set'
        })
        
        // Make the request
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const duration = Date.now() - startTime
        
        console.log(`[${new Date().toISOString()}] Response received: ${response.status} ${response.statusText} (${duration}ms)`)
        
        // Log request history
        await this.logRequestHistory({
          id: requestId,
          timestamp: startTime,
          method: options.method || 'GET',
          url,
          status: response.status,
          statusText: response.statusText,
          duration,
          retryCount: attempt
        })
        
        // Handle successful responses
        if (response.ok) {
          const data = await response.json()
          console.log(`[${new Date().toISOString()}] Request completed successfully`)
          return data
        }
        
        // Handle 401 authentication errors
        if (response.status === 401) {
          const errorMsg = `Authentication failed (401): Invalid API key or expired token`
          console.error(`[${new Date().toISOString()}] ${errorMsg}`)
          
          // Try to refresh configuration if this is not the last attempt
          if (attempt < maxRetries) {
            console.log(`[${new Date().toISOString()}] Attempting to refresh API configuration...`)
            await this.refreshConfiguration()
            continue
          }
          
          lastError = new Error(errorMsg)
          break
        }
        
        // Handle other HTTP errors
        const errorText = await response.text()
        const errorMsg = `HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`
        console.error(`[${new Date().toISOString()}] ${errorMsg}`)
        
        if (attempt < maxRetries) {
          const retryDelay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`[${new Date().toISOString()}] Retrying in ${retryDelay}ms...`)
          await this.delay(retryDelay)
          continue
        }
        
        lastError = new Error(errorMsg)
        break
        
      } catch (error) {
        const duration = Date.now() - startTime
        
        if (error.name === 'AbortError') {
          const errorMsg = `Request timeout after ${config.timeout || DEFAULT_TIMEOUT}ms`
          console.error(`[${new Date().toISOString()}] ${errorMsg}`)
          lastError = new Error(errorMsg)
        } else {
          console.error(`[${new Date().toISOString()}] Request failed:`, error)
          lastError = error as Error
        }
        
        // Log failed request
        await this.logRequestHistory({
          id: requestId,
          timestamp: startTime,
          method: options.method || 'GET',
          url,
          status: 0,
          statusText: 'Failed',
          duration,
          error: lastError.message,
          retryCount: attempt
        })
        
        if (attempt < maxRetries) {
          const retryDelay = Math.pow(2, attempt) * 1000
          console.log(`[${new Date().toISOString()}] Retrying in ${retryDelay}ms...`)
          await this.delay(retryDelay)
          continue
        }
        
        break
      }
    }
    
    throw lastError || new Error('Request failed after all retry attempts')
  }

  /**
   * Refresh API configuration (attempt to validate and update)
   */
  private async refreshConfiguration(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Refreshing API configuration...`)
      
      // Reload configuration from storage
      const config = await this.getActiveConfig()
      if (config) {
        this.activeConfig = config
        console.log(`[${new Date().toISOString()}] Configuration refreshed`)
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to refresh configuration:`, error)
    }
  }

  /**
   * Test API connection and authentication
   */
  public async testConnection(config?: APIConfig): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const testConfig = config || this.activeConfig || await this.getActiveConfig()
      if (!testConfig) {
        return { success: false, message: 'No API configuration available' }
      }
      
      console.log(`[${new Date().toISOString()}] Testing API connection to: ${testConfig.baseUrl}`)
      
      // Test with models endpoint
      const response = await this.makeAuthenticatedRequest('/models', { method: 'GET' }, testConfig)
      
      return {
        success: true,
        message: 'Connection successful',
        details: {
          baseUrl: testConfig.baseUrl,
          modelsCount: response?.data?.length || response?.length || 0,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Connection test failed:`, error)
      return {
        success: false,
        message: error.message,
        details: { error: error.message }
      }
    }
  }

  /**
   * Log request history
   */
  private async logRequestHistory(history: APIRequestHistory): Promise<void> {
    try {
      const existingHistory = await storage.get<APIRequestHistory[]>(API_HISTORY_KEY) || []
      existingHistory.push(history)
      
      // Keep only last 100 requests
      if (existingHistory.length > 100) {
        existingHistory.splice(0, existingHistory.length - 100)
      }
      
      await storage.set(API_HISTORY_KEY, existingHistory)
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Failed to log request history:`, error)
    }
  }

  /**
   * Get request history
   */
  public async getRequestHistory(): Promise<APIRequestHistory[]> {
    try {
      return await storage.get<APIRequestHistory[]>(API_HISTORY_KEY) || []
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to get request history:`, error)
      return []
    }
  }

  /**
   * Clear request history
   */
  public async clearRequestHistory(): Promise<void> {
    try {
      await storage.remove(API_HISTORY_KEY)
      console.log(`[${new Date().toISOString()}] Request history cleared`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to clear request history:`, error)
    }
  }

  /**
   * Update API key for active configuration
   */
  public async updateAPIKey(newApiKey: string): Promise<void> {
    try {
      const config = this.activeConfig || await this.getActiveConfig()
      if (!config) {
        throw new Error('No active configuration found')
      }
      
      config.apiKey = newApiKey
      config.updatedAt = Date.now()
      
      await this.saveAPIConfig(config)
      this.activeConfig = config
      
      console.log(`[${new Date().toISOString()}] API key updated successfully`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to update API key:`, error)
      throw error
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `api-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Export configuration for backup
   */
  public async exportConfiguration(): Promise<string> {
    try {
      const configs = await this.getAllConfigs()
      const history = await this.getRequestHistory()
      
      const exportData = {
        configs,
        history: history.slice(-10), // Last 10 requests only
        exportedAt: Date.now(),
        version: "1.0.0"
      }
      
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to export configuration:`, error)
      throw error
    }
  }

  /**
   * Import configuration from backup
   */
  public async importConfiguration(importData: string): Promise<void> {
    try {
      const data = JSON.parse(importData)
      
      if (data.configs && Array.isArray(data.configs)) {
        await storage.set(API_CONFIG_KEY, data.configs)
        console.log(`[${new Date().toISOString()}] Configuration imported successfully`)
        
        // Reload active configuration
        await this.initialize()
      } else {
        throw new Error('Invalid import data format')
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to import configuration:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const apiAuthService = APIAuthService.getInstance()

// Auto-initialize on import
apiAuthService.initialize().catch(error => {
  console.error('Failed to auto-initialize API Auth Service:', error)
}) 