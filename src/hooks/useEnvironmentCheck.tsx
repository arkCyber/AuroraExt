/**
 * Environment Check Hook
 * 
 * Provides environment checking functionality throughout the application.
 * Automatically runs environment checks on startup and provides methods
 * to check environment status and trigger manual checks.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { message } from 'antd'
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
    
    try {
      console.log('🔍 [ENV-CHECK] Starting environment check...')
      const envReport = await runEnvironmentCheck()
      setReport(envReport)
      
      // Show notifications based on status
      if (envReport.overallStatus === 'critical') {
        message.error({
          content: `Environment issues detected: ${envReport.summary.errors} error(s)`,
          duration: 5,
          key: 'env-check'
        })
      } else if (envReport.overallStatus === 'warning') {
        message.warning({
          content: `Environment warnings: ${envReport.summary.warnings} warning(s)`,
          duration: 3,
          key: 'env-check'
        })
      }
      
      console.log('✅ [ENV-CHECK] Environment check completed:', envReport.overallStatus)
      
    } catch (error) {
      console.error('❌ [ENV-CHECK] Environment check failed:', error)
      message.error({
        content: 'Environment check failed. Please check console for details.',
        duration: 5,
        key: 'env-check'
      })
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
        console.log('📋 [ENV-CHECK] Using cached environment check result')
        setReport(lastCheck)
      } else {
        console.log('🚀 [ENV-CHECK] Running initial environment check...')
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