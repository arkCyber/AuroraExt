/**
 * Environment Check Component
 * 
 * Displays environment check results with detailed information
 * about system health and potential issues.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react'
import { Alert, Modal, Progress, Button, Collapse, Tag, Space, Typography, Spin } from 'antd'
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { runEnvironmentCheck, EnvironmentReport, EnvironmentCheckResult } from '@/services/environment-check'
import { useTranslation } from 'react-i18next'

const { Text, Title } = Typography
const { Panel } = Collapse

interface EnvironmentCheckProps {
  visible: boolean
  onClose: () => void
  onComplete?: (report: EnvironmentReport) => void
  autoRun?: boolean
}

export const EnvironmentCheck: React.FC<EnvironmentCheckProps> = ({
  visible,
  onClose,
  onComplete,
  autoRun = true
}) => {
  const { t } = useTranslation(['common', 'settings'])
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<EnvironmentReport | null>(null)
  const [progress, setProgress] = useState(0)

  // Run environment check
  const performCheck = async () => {
    setLoading(true)
    setProgress(0)
    
    try {
      console.log('🚀 [ENV-CHECK] Starting environment diagnostics...')
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const envReport = await runEnvironmentCheck()
      
      clearInterval(progressInterval)
      setProgress(100)
      setReport(envReport)
      
      // Call completion callback
      if (onComplete) {
        onComplete(envReport)
      }
      
      console.log('✅ [ENV-CHECK] Environment check completed:', envReport.overallStatus)
      
    } catch (error) {
      console.error('❌ [ENV-CHECK] Environment check failed:', error)
      setReport({
        overallStatus: 'critical',
        timestamp: Date.now(),
        checks: [{
          passed: false,
          message: `Environment check failed: ${error.message}`,
          severity: 'error',
          category: 'system'
        }],
        summary: { passed: 0, warnings: 0, errors: 1 }
      })
    } finally {
      setLoading(false)
    }
  }

  // Auto-run on mount
  useEffect(() => {
    if (visible && autoRun && !report) {
      performCheck()
    }
  }, [visible, autoRun])

  // Get status icon
  const getStatusIcon = (result: EnvironmentCheckResult) => {
    if (result.passed) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    } else if (result.severity === 'warning') {
      return <WarningOutlined style={{ color: '#faad14' }} />
    } else {
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    }
  }

  // Get overall status
  const getOverallStatus = () => {
    if (!report) return null

    const { overallStatus, summary } = report
    
    if (overallStatus === 'healthy') {
      return (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          message="Environment Healthy"
          description={`All checks passed successfully. Aurora is ready to use.`}
          showIcon
        />
      )
    } else if (overallStatus === 'warning') {
      return (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message="Environment Warnings"
          description={`${summary.warnings} warning(s) detected. Aurora should work but some features may be limited.`}
          showIcon
        />
      )
    } else {
      return (
        <Alert
          type="error"
          icon={<CloseCircleOutlined />}
          message="Environment Issues"
          description={`${summary.errors} critical error(s) detected. Please resolve these issues for optimal performance.`}
          showIcon
        />
      )
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      'chrome-api': 'blue',
      'storage': 'green',
      'providers': 'orange',
      'network': 'purple',
      'permissions': 'red',
      'database': 'cyan',
      'local-servers': 'geekblue',
      'system': 'magenta'
    }
    return colors[category] || 'default'
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Environment Diagnostics
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="recheck" icon={<ReloadOutlined />} onClick={performCheck} disabled={loading}>
          Run Check Again
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <div style={{ minHeight: 400 }}>
        {/* Progress Bar */}
        {loading && (
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">Running environment diagnostics...</Text>
            <Progress percent={progress} status="active" />
          </div>
        )}

        {/* Loading State */}
        {loading && !report && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Checking system environment...</Text>
            </div>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div>
            {/* Overall Status */}
            <div style={{ marginBottom: 24 }}>
              {getOverallStatus()}
            </div>

            {/* Summary Stats */}
            <div style={{ marginBottom: 24 }}>
              <Space>
                <Tag color="green">{report.summary.passed} Passed</Tag>
                <Tag color="orange">{report.summary.warnings} Warnings</Tag>
                <Tag color="red">{report.summary.errors} Errors</Tag>
                <Text type="secondary">
                  Checked at {formatTimestamp(report.timestamp)}
                </Text>
              </Space>
            </div>

            {/* Detailed Results */}
            <Collapse defaultActiveKey={report.overallStatus !== 'healthy' ? ['issues'] : []}>
              {/* Issues Panel - Show if there are warnings or errors */}
              {(report.summary.warnings > 0 || report.summary.errors > 0) && (
                <Panel header="Issues Detected" key="issues">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {report.checks
                      .filter(check => !check.passed)
                      .map((check, index) => (
                        <Alert
                          key={index}
                          type={check.severity === 'error' ? 'error' : 'warning'}
                          icon={getStatusIcon(check)}
                          message={
                            <Space>
                              {check.message}
                              <Tag color={getCategoryColor(check.category)}>
                                {check.category}
                              </Tag>
                            </Space>
                          }
                          description={
                            check.details && (
                              <pre style={{ fontSize: 12, margin: 0 }}>
                                {JSON.stringify(check.details, null, 2)}
                              </pre>
                            )
                          }
                          showIcon
                        />
                      ))}
                  </div>
                </Panel>
              )}

              {/* All Results Panel */}
              <Panel header="All Check Results" key="all">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.checks.map((check, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        backgroundColor: check.passed ? '#f6ffed' : '#fff2f0'
                      }}
                    >
                      <Space>
                        {getStatusIcon(check)}
                        <Text strong={!check.passed}>{check.message}</Text>
                      </Space>
                      <Tag color={getCategoryColor(check.category)}>
                        {check.category}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* System Information Panel */}
              <Panel header="System Information" key="system">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <Text type="secondary">Browser:</Text>
                    <div>{navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Unknown'}</div>
                  </div>
                  <div>
                    <Text type="secondary">Online:</Text>
                    <div>{navigator.onLine ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <Text type="secondary">Language:</Text>
                    <div>{navigator.language}</div>
                  </div>
                  <div>
                    <Text type="secondary">Platform:</Text>
                    <div>{navigator.platform}</div>
                  </div>
                </div>
              </Panel>
            </Collapse>
          </div>
        )}

        {/* Instructions */}
        {report && report.overallStatus !== 'healthy' && (
          <div style={{ marginTop: 24 }}>
            <Alert
              type="info"
              icon={<InfoCircleOutlined />}
              message="Next Steps"
              description={
                <div>
                  <p>If you're experiencing issues:</p>
                  <ul>
                    <li>Check Chrome extension permissions</li>
                    <li>Verify AI provider configurations</li>
                    <li>Ensure network connectivity</li>
                    <li>Try refreshing the page</li>
                    <li>Contact support if issues persist</li>
                  </ul>
                </div>
              }
              showIcon
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default EnvironmentCheck 