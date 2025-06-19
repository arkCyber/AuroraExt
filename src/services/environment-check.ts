/**
 * Environment Check Service
 * 
 * This service performs comprehensive environment checks when Aurora starts up
 * to detect potential issues before they cause runtime errors.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import { getAllOpenAIConfig } from "@/db/openai"
import { PageAssitDatabase } from "@/db/index"

// Environment check result types
export interface EnvironmentCheckResult {
  passed: boolean
  message: string
  severity: 'info' | 'warning' | 'error'
  category: string
  details?: any
}

export interface EnvironmentReport {
  overallStatus: 'healthy' | 'warning' | 'critical'
  timestamp: number
  checks: EnvironmentCheckResult[]
  summary: {
    passed: number
    warnings: number
    errors: number
  }
}

/**
 * Environment Check Service Class
 * Performs various system checks and returns detailed reports
 */
export class EnvironmentCheckService {
  private static instance: EnvironmentCheckService
  private lastCheck: EnvironmentReport | null = null
  private db: PageAssitDatabase

  constructor() {
    this.db = new PageAssitDatabase()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentCheckService {
    if (!EnvironmentCheckService.instance) {
      EnvironmentCheckService.instance = new EnvironmentCheckService()
    }
    return EnvironmentCheckService.instance
  }

  /**
   * Run comprehensive environment check
   */
  async runEnvironmentCheck(): Promise<EnvironmentReport> {
    console.log('🔍 [ENV-CHECK] Starting environment diagnostics...')
    
    const checks: EnvironmentCheckResult[] = []
    const startTime = Date.now()

    try {
      // 1. Chrome APIs availability
      checks.push(await this.checkChromeAPIs())
      
      // 2. Storage system health
      checks.push(await this.checkStorageHealth())
      
      // 3. Provider configurations
      checks.push(await this.checkProviderConfigurations())
      
      // 4. Network connectivity
      checks.push(await this.checkNetworkConnectivity())
      
      // 5. Extension permissions
      checks.push(await this.checkExtensionPermissions())
      
      // 6. Database integrity
      checks.push(await this.checkDatabaseIntegrity())
      
      // 7. Local server availability
      checks.push(await this.checkLocalServerAvailability())

    } catch (error) {
      console.error('❌ [ENV-CHECK] Critical error during environment check:', error)
      checks.push({
        passed: false,
        message: `Environment check failed: ${error.message}`,
        severity: 'error',
        category: 'system',
        details: { error: error.message, stack: error.stack }
      })
    }

    // Generate summary
    const summary = {
      passed: checks.filter(c => c.passed).length,
      warnings: checks.filter(c => !c.passed && c.severity === 'warning').length,
      errors: checks.filter(c => !c.passed && c.severity === 'error').length
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (summary.errors > 0) {
      overallStatus = 'critical'
    } else if (summary.warnings > 0) {
      overallStatus = 'warning'
    }

    const report: EnvironmentReport = {
      overallStatus,
      timestamp: startTime,
      checks,
      summary
    }

    this.lastCheck = report
    
    console.log(`🎯 [ENV-CHECK] Environment check completed in ${Date.now() - startTime}ms`)
    console.log(`📊 [ENV-CHECK] Status: ${overallStatus} | Passed: ${summary.passed} | Warnings: ${summary.warnings} | Errors: ${summary.errors}`)
    
    return report
  }

  /**
   * Check Chrome extension APIs availability
   */
  private async checkChromeAPIs(): Promise<EnvironmentCheckResult> {
    try {
      if (typeof chrome === 'undefined') {
        return {
          passed: false,
          message: 'Chrome extension APIs not available',
          severity: 'error',
          category: 'chrome-api'
        }
      }

      const missingAPIs = []
      if (!chrome.storage) missingAPIs.push('storage')
      if (!chrome.runtime) missingAPIs.push('runtime')
      if (!chrome.tabs) missingAPIs.push('tabs')

      if (missingAPIs.length > 0) {
        return {
          passed: false,
          message: `Missing Chrome APIs: ${missingAPIs.join(', ')}`,
          severity: 'error',
          category: 'chrome-api',
          details: { missingAPIs }
        }
      }

      return {
        passed: true,
        message: 'Chrome extension APIs available',
        severity: 'info',
        category: 'chrome-api'
      }
    } catch (error) {
      return {
        passed: false,
        message: `Chrome API check failed: ${error.message}`,
        severity: 'error',
        category: 'chrome-api',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check storage system health
   */
  private async checkStorageHealth(): Promise<EnvironmentCheckResult> {
    try {
      // Test storage read/write
      const testKey = '__aurora_storage_test__'
      const testValue = { timestamp: Date.now(), test: true }
      
      await chrome.storage.local.set({ [testKey]: testValue })
      const result = await chrome.storage.local.get(testKey)
      await chrome.storage.local.remove(testKey)

      if (!result[testKey] || result[testKey].timestamp !== testValue.timestamp) {
        return {
          passed: false,
          message: 'Storage read/write test failed',
          severity: 'error',
          category: 'storage'
        }
      }

      // Check storage usage
      const storageSize = await this.getStorageSize()
      const quota = await this.getStorageQuota()
      const usagePercent = (storageSize / quota) * 100

      if (usagePercent > 90) {
        return {
          passed: false,
          message: `Storage usage critical: ${usagePercent.toFixed(1)}%`,
          severity: 'error',
          category: 'storage',
          details: { storageSize, quota, usagePercent }
        }
      } else if (usagePercent > 75) {
        return {
          passed: true,
          message: `Storage usage high: ${usagePercent.toFixed(1)}%`,
          severity: 'warning',
          category: 'storage',
          details: { storageSize, quota, usagePercent }
        }
      }

      return {
        passed: true,
        message: `Storage healthy (${usagePercent.toFixed(1)}% used)`,
        severity: 'info',
        category: 'storage',
        details: { storageSize, quota, usagePercent }
      }
    } catch (error) {
      return {
        passed: false,
        message: `Storage health check failed: ${error.message}`,
        severity: 'error',
        category: 'storage',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check provider configurations
   */
  private async checkProviderConfigurations(): Promise<EnvironmentCheckResult> {
    try {
      const providers = await getAllOpenAIConfig()
      
      if (!providers || providers.length === 0) {
        return {
          passed: false,
          message: 'No AI providers configured',
          severity: 'warning',
          category: 'providers',
          details: { providerCount: 0 }
        }
      }

      const issues = []
      for (const provider of providers) {
        if (!provider.baseUrl) {
          issues.push(`Provider "${provider.name}" missing baseUrl`)
        }
        if (!provider.apiKey) {
          issues.push(`Provider "${provider.name}" missing API key`)
        }
        if (provider.baseUrl && !this.isValidUrl(provider.baseUrl)) {
          issues.push(`Provider "${provider.name}" has invalid baseUrl`)
        }
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Provider configuration issues: ${issues.length}`,
          severity: 'warning',
          category: 'providers',
          details: { issues, providerCount: providers.length }
        }
      }

      return {
        passed: true,
        message: `${providers.length} provider(s) configured correctly`,
        severity: 'info',
        category: 'providers',
        details: { providerCount: providers.length }
      }
    } catch (error) {
      return {
        passed: false,
        message: `Provider check failed: ${error.message}`,
        severity: 'error',
        category: 'providers',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<EnvironmentCheckResult> {
    try {
      if (!navigator.onLine) {
        return {
          passed: false,
          message: 'No internet connection detected',
          severity: 'warning',
          category: 'network'
        }
      }

      // Test connectivity to a reliable endpoint
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200'
      ]

      let connected = false
      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache'
          })
          connected = true
          break
        } catch (error) {
          console.warn(`[ENV-CHECK] Failed to connect to ${url}:`, error.message)
        }
      }

      if (!connected) {
        return {
          passed: false,
          message: 'Internet connectivity test failed',
          severity: 'warning',
          category: 'network'
        }
      }

      return {
        passed: true,
        message: 'Internet connectivity confirmed',
        severity: 'info',
        category: 'network'
      }
    } catch (error) {
      return {
        passed: false,
        message: `Network check failed: ${error.message}`,
        severity: 'warning',
        category: 'network',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check extension permissions
   */
  private async checkExtensionPermissions(): Promise<EnvironmentCheckResult> {
    try {
      const requiredPermissions = ['storage', 'tabs', 'activeTab', 'scripting']
      const missingPermissions = []

      for (const permission of requiredPermissions) {
        const hasPermission = await chrome.permissions.contains({
          permissions: [permission]
        })
        if (!hasPermission) {
          missingPermissions.push(permission)
        }
      }

      if (missingPermissions.length > 0) {
        return {
          passed: false,
          message: `Missing permissions: ${missingPermissions.join(', ')}`,
          severity: 'error',
          category: 'permissions',
          details: { missingPermissions }
        }
      }

      return {
        passed: true,
        message: 'All required permissions granted',
        severity: 'info',
        category: 'permissions'
      }
    } catch (error) {
      return {
        passed: false,
        message: `Permission check failed: ${error.message}`,
        severity: 'warning',
        category: 'permissions',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check database integrity
   */
  private async checkDatabaseIntegrity(): Promise<EnvironmentCheckResult> {
    try {
      // Check if core data structures exist
      const chatHistories = await this.db.getChatHistories()
      const prompts = await this.db.getAllPrompts()

      const issues = []
      
      // Check for data corruption
      if (chatHistories && !Array.isArray(chatHistories)) {
        issues.push('Chat histories data corrupted')
      }
      
      if (prompts && !Array.isArray(prompts)) {
        issues.push('Prompts data corrupted')
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Database integrity issues: ${issues.join(', ')}`,
          severity: 'error',
          category: 'database',
          details: { issues }
        }
      }

      return {
        passed: true,
        message: `Database integrity verified (${chatHistories?.length || 0} chats, ${prompts?.length || 0} prompts)`,
        severity: 'info',
        category: 'database',
        details: { 
          chatCount: chatHistories?.length || 0, 
          promptCount: prompts?.length || 0 
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: `Database integrity check failed: ${error.message}`,
        severity: 'error',
        category: 'database',
        details: { error: error.message }
      }
    }
  }

  /**
   * Check local server availability
   */
  private async checkLocalServerAvailability(): Promise<EnvironmentCheckResult> {
    const commonLocalServers = [
      { name: 'Ollama', url: 'http://localhost:11434/api/tags' },
      { name: 'LM Studio', url: 'http://localhost:1234/v1/models' },
      { name: 'llamacpp', url: 'http://localhost:8080/v1/models' },
      { name: 'MockRemote', url: 'http://localhost/api/v1/models' },
      { name: 'MouseChat', url: 'http://localhost:9000/v1/models' }
    ]

    const availableServers = []
    const unavailableServers = []

    for (const server of commonLocalServers) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(server.url, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        if (response.ok || response.status === 401) { // 401 means server is running but needs auth
          availableServers.push(server.name)
        } else {
          unavailableServers.push(server.name)
        }
      } catch (error) {
        unavailableServers.push(server.name)
      }
    }

    if (availableServers.length === 0) {
      return {
        passed: true,
        message: 'No local AI servers detected (this is normal)',
        severity: 'info',
        category: 'local-servers',
        details: { availableServers, unavailableServers }
      }
    }

    return {
      passed: true,
      message: `Local servers available: ${availableServers.join(', ')}`,
      severity: 'info',
      category: 'local-servers',
      details: { availableServers, unavailableServers }
    }
  }

  /**
   * Get last environment check result
   */
  getLastCheck(): EnvironmentReport | null {
    return this.lastCheck
  }

  /**
   * Utility: Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Utility: Get storage size
   */
  private async getStorageSize(): Promise<number> {
    try {
      const data = await chrome.storage.local.get(null)
      return JSON.stringify(data).length
    } catch {
      return 0
    }
  }

  /**
   * Utility: Get storage quota
   */
  private async getStorageQuota(): Promise<number> {
    try {
      return chrome.storage.local.QUOTA_BYTES || 5242880 // 5MB default
    } catch {
      return 5242880
    }
  }
}

/**
 * Quick environment check function for easy import
 */
export const runEnvironmentCheck = async (): Promise<EnvironmentReport> => {
  const service = EnvironmentCheckService.getInstance()
  return await service.runEnvironmentCheck()
}

/**
 * Get last environment check result
 */
export const getLastEnvironmentCheck = (): EnvironmentReport | null => {
  const service = EnvironmentCheckService.getInstance()
  return service.getLastCheck()
} 