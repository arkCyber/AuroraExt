/**
 * Environment Check Hook
 * 
 * Provides environment checking functionality throughout the application.
 * Automatically runs environment checks on startup and logs results to console.
 * No popup notifications - all status information is logged.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { runEnvironmentCheck, getLastEnvironmentCheck, EnvironmentReport } from '@/services/environment-check'

interface EnvironmentCheckContextType {
  report: EnvironmentReport | null
  loading: boolean
  runCheck: () => Promise<void>
  isHealthy: boolean
  hasWarnings: boolean
  hasErrors: boolean
  lastCheckTime: number | null
}

const EnvironmentCheckContext = createContext<EnvironmentCheckContextType | null>(null)

/**
 * Environment Check Provider Component
 * Wraps the application to provide environment checking functionality
 */
export const EnvironmentCheckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [report, setReport] = useState<EnvironmentReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasRunInitialCheck, setHasRunInitialCheck] = useState(false)

  // Run environment check
  const runCheck = useCallback(async () => {
    if (loading) return

    setLoading(true)
    const timestamp = new Date().toISOString()
    
    try {
      console.log(`🔍 [${timestamp}] [ENV-CHECK] Starting environment check...`)
      const envReport = await runEnvironmentCheck()
      setReport(envReport)
      
      // Log results to console instead of showing popups
      const statusTimestamp = new Date().toISOString()
      if (envReport.overallStatus === 'critical') {
        console.error(`❌ [${statusTimestamp}] [ENV-CHECK] Environment issues detected: ${envReport.summary.errors} error(s), ${envReport.summary.warnings} warning(s)`)
        envReport.checks.filter(check => !check.passed && check.severity === 'error').forEach(check => {
          console.error(`❌ [${statusTimestamp}] [ENV-CHECK] ERROR - ${check.category}: ${check.message}`)
        })
      } else if (envReport.overallStatus === 'warning') {
        console.warn(`⚠️ [${statusTimestamp}] [ENV-CHECK] Environment warnings: ${envReport.summary.warnings} warning(s)`)
        envReport.checks.filter(check => !check.passed && check.severity === 'warning').forEach(check => {
          console.warn(`⚠️ [${statusTimestamp}] [ENV-CHECK] WARNING - ${check.category}: ${check.message}`)
        })
      } else {
        console.log(`✅ [${statusTimestamp}] [ENV-CHECK] Environment healthy: All ${envReport.summary.passed} checks passed`)
      }
      
      console.log(`✅ [${statusTimestamp}] [ENV-CHECK] Environment check completed with status: ${envReport.overallStatus}`)
      
    } catch (error) {
      const errorTimestamp = new Date().toISOString()
      console.error(`❌ [${errorTimestamp}] [ENV-CHECK] Environment check failed:`, error)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // Run initial check on mount
  useEffect(() => {
    if (!hasRunInitialCheck) {
      // Check if we have a recent cached check
      const lastCheck = getLastEnvironmentCheck()
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      
      if (lastCheck && lastCheck.timestamp > fiveMinutesAgo) {
        const cacheTimestamp = new Date().toISOString()
        console.log(`📋 [${cacheTimestamp}] [ENV-CHECK] Using cached environment check result from ${new Date(lastCheck.timestamp).toISOString()}`)
        setReport(lastCheck)
      } else {
        const startTimestamp = new Date().toISOString()
        console.log(`🚀 [${startTimestamp}] [ENV-CHECK] Running initial environment check...`)
        runCheck()
      }
      
      setHasRunInitialCheck(true)
    }
  }, [runCheck, hasRunInitialCheck])

  // Computed properties
  const isHealthy = report?.overallStatus === 'healthy'
  const hasWarnings = (report?.summary.warnings || 0) > 0
  const hasErrors = (report?.summary.errors || 0) > 0
  const lastCheckTime = report?.timestamp || null

  const contextValue: EnvironmentCheckContextType = {
    report,
    loading,
    runCheck,
    isHealthy,
    hasWarnings,
    hasErrors,
    lastCheckTime
  }

  return (
    <EnvironmentCheckContext.Provider value={contextValue}>
      {children}
    </EnvironmentCheckContext.Provider>
  )
}

/**
 * Hook to use environment check functionality
 */
export const useEnvironmentCheck = (): EnvironmentCheckContextType => {
  const context = useContext(EnvironmentCheckContext)
  if (!context) {
    throw new Error('useEnvironmentCheck must be used within an EnvironmentCheckProvider')
  }
  return context
}

/**
 * Simple hook for components that only need to know if environment is healthy
 */
export const useEnvironmentStatus = () => {
  const { isHealthy, hasWarnings, hasErrors, report } = useEnvironmentCheck()
  
  return {
    isHealthy,
    hasWarnings, 
    hasErrors,
    status: report?.overallStatus || 'unknown',
    summary: report?.summary
  }
}

/**
 * Hook for triggering environment checks manually
 */
export const useEnvironmentChecker = () => {
  const { runCheck, loading } = useEnvironmentCheck()
  
  return {
    runCheck,
    loading
  }
} 