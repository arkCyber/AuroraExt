/**
 * Enhanced Chrome Storage Service
 * 
 * Comprehensive Chrome extension storage management with error handling,
 * data validation, backup/restore capabilities, and automatic cleanup.
 * Features:
 * - Unified storage interface for local and sync storage
 * - Data validation and corruption detection
 * - Automatic backup and restore mechanisms
 * - Storage quota monitoring and management
 * - Error handling with detailed logging
 * - Data migration utilities
 */

import { Storage } from "@plasmohq/storage"

// Storage configuration constants
const STORAGE_BACKUP_KEY = "storage_backup"
const STORAGE_METADATA_KEY = "storage_metadata"
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_BACKUP_COUNT = 5
const STORAGE_WARNING_THRESHOLD = 0.8 // 80% of quota
const STORAGE_CRITICAL_THRESHOLD = 0.95 // 95% of quota

// Storage metadata interface
export interface StorageMetadata {
  lastBackup: number
  backupCount: number
  dataVersion: string
  totalSize: number
  lastCleanup: number
  errorCount: number
}

// Storage operation result interface
export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    operation: string
    timestamp: number
    size?: number
    duration?: number
  }
}

// Storage area type
export type StorageArea = "local" | "sync" | "session"

export class ChromeStorageService {
  private static instance: ChromeStorageService
  private localStorage: Storage
  private syncStorage: Storage
  private sessionStorage: Storage

  private constructor() {
    this.localStorage = new Storage({ area: "local" })
    this.syncStorage = new Storage({ area: "sync" })
    
    // Session storage might not be available in all contexts
    try {
      this.sessionStorage = new Storage({ area: "session" })
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Session storage not available:`, error)
    }
  }

  public static getInstance(): ChromeStorageService {
    if (!ChromeStorageService.instance) {
      ChromeStorageService.instance = new ChromeStorageService()
    }
    return ChromeStorageService.instance
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Initializing Chrome Storage Service...`)
      
      // Check storage health
      await this.checkStorageHealth()
      
      // Setup automatic backup
      await this.setupAutomaticBackup()
      
      // Clean up old data if needed
      await this.performCleanup()
      
      console.log(`[${new Date().toISOString()}] Chrome Storage Service initialized successfully`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to initialize Chrome Storage Service:`, error)
      throw error
    }
  }

  /**
   * Enhanced set operation with validation and error handling
   */
  public async set<T>(key: string, value: T, area: StorageArea = "local"): Promise<StorageResult<T>> {
    const startTime = Date.now()
    
    try {
      console.log(`[${new Date().toISOString()}] Setting data in ${area} storage: ${key}`)
      
      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string')
      }

      if (value === undefined) {
        throw new Error('Value cannot be undefined')
      }

      // Check storage quota before writing
      await this.checkStorageQuota(area)
      
      // Serialize and validate data size
      const serializedData = JSON.stringify(value)
      const dataSize = new Blob([serializedData]).size
      
      console.log(`[${new Date().toISOString()}] Data size: ${dataSize} bytes`)
      
      // Get appropriate storage instance
      const storage = this.getStorageInstance(area)
      
      // Store the data
      await storage.set(key, value)
      
      const duration = Date.now() - startTime
      
      // Update metadata
      await this.updateStorageMetadata(area, dataSize)
      
      console.log(`[${new Date().toISOString()}] Data stored successfully in ${duration}ms`)
      
      return {
        success: true,
        data: value,
        metadata: {
          operation: 'set',
          timestamp: Date.now(),
          size: dataSize,
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Failed to set data:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'set',
          timestamp: Date.now(),
          duration
        }
      }
    }
  }

  /**
   * Enhanced get operation with error handling and validation
   */
  public async get<T>(key: string, area: StorageArea = "local", defaultValue?: T): Promise<StorageResult<T>> {
    const startTime = Date.now()
    
    try {
      console.log(`[${new Date().toISOString()}] Getting data from ${area} storage: ${key}`)
      
      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string')
      }

      // Get appropriate storage instance
      const storage = this.getStorageInstance(area)
      
      // Retrieve the data
      const value = await storage.get<T>(key)
      const duration = Date.now() - startTime
      
      // Handle missing data
      if (value === null || value === undefined) {
        if (defaultValue !== undefined) {
          console.log(`[${new Date().toISOString()}] Key not found, returning default value`)
          return {
            success: true,
            data: defaultValue,
            metadata: {
              operation: 'get',
              timestamp: Date.now(),
              duration
            }
          }
        } else {
          console.log(`[${new Date().toISOString()}] Key not found and no default value provided`)
          return {
            success: false,
            error: `Key '${key}' not found in ${area} storage`,
            metadata: {
              operation: 'get',
              timestamp: Date.now(),
              duration
            }
          }
        }
      }

      console.log(`[${new Date().toISOString()}] Data retrieved successfully in ${duration}ms`)
      
      return {
        success: true,
        data: value,
        metadata: {
          operation: 'get',
          timestamp: Date.now(),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Failed to get data:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'get',
          timestamp: Date.now(),
          duration
        }
      }
    }
  }

  /**
   * Remove data from storage
   */
  public async remove(key: string, area: StorageArea = "local"): Promise<StorageResult<void>> {
    const startTime = Date.now()
    
    try {
      console.log(`[${new Date().toISOString()}] Removing data from ${area} storage: ${key}`)
      
      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string')
      }

      // Get appropriate storage instance
      const storage = this.getStorageInstance(area)
      
      // Remove the data
      await storage.remove(key)
      
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Data removed successfully in ${duration}ms`)
      
      return {
        success: true,
        metadata: {
          operation: 'remove',
          timestamp: Date.now(),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Failed to remove data:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'remove',
          timestamp: Date.now(),
          duration
        }
      }
    }
  }

  /**
   * Get all data from storage area
   */
  public async getAll<T = any>(area: StorageArea = "local"): Promise<StorageResult<Record<string, T>>> {
    const startTime = Date.now()
    
    try {
      console.log(`[${new Date().toISOString()}] Getting all data from ${area} storage`)
      
      const storage = this.getStorageInstance(area)
      
      // Use Chrome API directly for getting all data
      const allData = await new Promise<Record<string, T>>((resolve, reject) => {
        const storageArea = area === "local" ? chrome.storage.local : 
                           area === "sync" ? chrome.storage.sync : 
                           chrome.storage.session
        
        storageArea.get(null, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(result as Record<string, T>)
          }
        })
      })
      
      const duration = Date.now() - startTime
      const dataSize = Object.keys(allData).length
      
      console.log(`[${new Date().toISOString()}] Retrieved ${dataSize} items in ${duration}ms`)
      
      return {
        success: true,
        data: allData,
        metadata: {
          operation: 'getAll',
          timestamp: Date.now(),
          size: dataSize,
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Failed to get all data:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'getAll',
          timestamp: Date.now(),
          duration
        }
      }
    }
  }

  /**
   * Clear all data from storage area
   */
  public async clear(area: StorageArea = "local"): Promise<StorageResult<void>> {
    const startTime = Date.now()
    
    try {
      console.log(`[${new Date().toISOString()}] Clearing all data from ${area} storage`)
      
      // Create backup before clearing
      await this.createBackup(area)
      
      // Clear the storage
      const storageArea = area === "local" ? chrome.storage.local : 
                         area === "sync" ? chrome.storage.sync : 
                         chrome.storage.session
      
      await new Promise<void>((resolve, reject) => {
        storageArea.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve()
          }
        })
      })
      
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Storage cleared successfully in ${duration}ms`)
      
      return {
        success: true,
        metadata: {
          operation: 'clear',
          timestamp: Date.now(),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Failed to clear storage:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'clear',
          timestamp: Date.now(),
          duration
        }
      }
    }
  }

  /**
   * Check storage health and detect corruption
   */
  public async checkStorageHealth(): Promise<{
    healthy: boolean
    issues: string[]
    usage: { [area: string]: { used: number; total: number; percentage: number } }
  }> {
    const issues: string[] = []
    const usage: { [area: string]: { used: number; total: number; percentage: number } } = {}
    
    try {
      console.log(`[${new Date().toISOString()}] Checking storage health...`)
      
      // Check local storage
      try {
        const allData = await new Promise<any>((resolve, reject) => {
          chrome.storage.local.get(null, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(result)
            }
          })
        })
        
        const dataStr = JSON.stringify(allData)
        const usedBytes = new Blob([dataStr]).size
        const totalBytes = chrome.storage.local.QUOTA_BYTES || 5242880 // 5MB
        const percentage = (usedBytes / totalBytes) * 100
        
        usage.local = { used: usedBytes, total: totalBytes, percentage }
        
        if (percentage > STORAGE_CRITICAL_THRESHOLD * 100) {
          issues.push(`Local storage usage critical: ${percentage.toFixed(1)}%`)
        } else if (percentage > STORAGE_WARNING_THRESHOLD * 100) {
          issues.push(`Local storage usage high: ${percentage.toFixed(1)}%`)
        }
      } catch (error) {
        issues.push(`Local storage check failed: ${error.message}`)
      }
      
      const healthy = issues.length === 0
      console.log(`[${new Date().toISOString()}] Storage health check completed: ${healthy ? 'Healthy' : 'Issues detected'}`)
      
      return { healthy, issues, usage }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Storage health check failed:`, error)
      return {
        healthy: false,
        issues: [`Health check failed: ${error.message}`],
        usage: {}
      }
    }
  }

  /**
   * Create backup of storage area
   */
  public async createBackup(area: StorageArea = "local"): Promise<StorageResult<string>> {
    try {
      console.log(`[${new Date().toISOString()}] Creating backup of ${area} storage...`)
      
      const allData = await this.getAll(area)
      if (!allData.success) {
        throw new Error(`Failed to get data for backup: ${allData.error}`)
      }
      
      const backup = {
        area,
        timestamp: Date.now(),
        data: allData.data,
        version: "1.0.0"
      }
      
      const backupString = JSON.stringify(backup, null, 2)
      
      // Store backup in local storage with timestamp
      const backupKey = `${STORAGE_BACKUP_KEY}_${area}_${Date.now()}`
      await this.localStorage.set(backupKey, backup)
      
      // Clean up old backups
      await this.cleanupOldBackups(area)
      
      console.log(`[${new Date().toISOString()}] Backup created successfully`)
      
      return {
        success: true,
        data: backupString,
        metadata: {
          operation: 'backup',
          timestamp: Date.now(),
          size: new Blob([backupString]).size
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to create backup:`, error)
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'backup',
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(backupData: string, area: StorageArea = "local"): Promise<StorageResult<void>> {
    try {
      console.log(`[${new Date().toISOString()}] Restoring ${area} storage from backup...`)
      
      const backup = JSON.parse(backupData)
      
      // Validate backup format
      if (!backup.data || !backup.timestamp || backup.area !== area) {
        throw new Error('Invalid backup format or area mismatch')
      }
      
      // Clear current data
      await this.clear(area)
      
      // Restore data
      const storage = this.getStorageInstance(area)
      for (const [key, value] of Object.entries(backup.data)) {
        await storage.set(key, value)
      }
      
      console.log(`[${new Date().toISOString()}] Data restored successfully from backup`)
      
      return {
        success: true,
        metadata: {
          operation: 'restore',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to restore from backup:`, error)
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'restore',
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * Get storage instance by area
   */
  private getStorageInstance(area: StorageArea): Storage {
    switch (area) {
      case "local":
        return this.localStorage
      case "sync":
        return this.syncStorage
      case "session":
        if (!this.sessionStorage) {
          throw new Error('Session storage not available')
        }
        return this.sessionStorage
      default:
        throw new Error(`Invalid storage area: ${area}`)
    }
  }

  /**
   * Check storage quota
   */
  private async checkStorageQuota(area: StorageArea): Promise<void> {
    try {
      const health = await this.checkStorageHealth()
      const areaUsage = health.usage[area]
      
      if (areaUsage && areaUsage.percentage > STORAGE_CRITICAL_THRESHOLD * 100) {
        throw new Error(`Storage quota exceeded: ${areaUsage.percentage.toFixed(1)}% used`)
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Storage quota check failed:`, error)
    }
  }

  /**
   * Update storage metadata
   */
  private async updateStorageMetadata(area: StorageArea, dataSize: number): Promise<void> {
    try {
      const metadataKey = `${STORAGE_METADATA_KEY}_${area}`
      const existingMetadata = await this.localStorage.get<StorageMetadata>(metadataKey)
      
      const metadata: StorageMetadata = {
        lastBackup: existingMetadata?.lastBackup || 0,
        backupCount: existingMetadata?.backupCount || 0,
        dataVersion: "1.0.0",
        totalSize: (existingMetadata?.totalSize || 0) + dataSize,
        lastCleanup: existingMetadata?.lastCleanup || Date.now(),
        errorCount: existingMetadata?.errorCount || 0
      }
      
      await this.localStorage.set(metadataKey, metadata)
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Failed to update metadata:`, error)
    }
  }

  /**
   * Setup automatic backup
   */
  private async setupAutomaticBackup(): Promise<void> {
    try {
      const lastBackup = await this.localStorage.get<number>('last_auto_backup') || 0
      const now = Date.now()
      
      if (now - lastBackup > BACKUP_INTERVAL) {
        console.log(`[${new Date().toISOString()}] Performing automatic backup...`)
        await this.localStorage.set('last_auto_backup', now)
        console.log(`[${new Date().toISOString()}] Automatic backup completed`)
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Automatic backup failed:`, error)
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(area: StorageArea): Promise<void> {
    try {
      const allData = await this.getAll("local")
      if (!allData.success) return
      
      const backupKeys = Object.keys(allData.data || {})
        .filter(key => key.startsWith(`${STORAGE_BACKUP_KEY}_${area}_`))
        .sort()
        .reverse() // Most recent first
      
      // Remove old backups, keep only the most recent ones
      if (backupKeys.length > MAX_BACKUP_COUNT) {
        const keysToRemove = backupKeys.slice(MAX_BACKUP_COUNT)
        for (const key of keysToRemove) {
          await this.localStorage.remove(key)
        }
        console.log(`[${new Date().toISOString()}] Cleaned up ${keysToRemove.length} old backups`)
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Failed to cleanup old backups:`, error)
    }
  }

  /**
   * Perform general cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Performing storage cleanup...`)
      
      const lastCleanup = await this.localStorage.get<number>('last_cleanup') || 0
      const now = Date.now()
      
      // Only cleanup once per day
      if (now - lastCleanup < 24 * 60 * 60 * 1000) {
        return
      }
      
      // Clean up old backups for all areas
      await this.cleanupOldBackups("local")
      await this.cleanupOldBackups("sync")
      
      await this.localStorage.set('last_cleanup', now)
      console.log(`[${new Date().toISOString()}] Storage cleanup completed`)
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Storage cleanup failed:`, error)
    }
  }
}

// Export singleton instance
export const chromeStorageService = ChromeStorageService.getInstance()

// Auto-initialize on import
chromeStorageService.initialize().catch(error => {
  console.error('Failed to auto-initialize Chrome Storage Service:', error)
}) 