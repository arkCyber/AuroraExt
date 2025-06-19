/**
 * Environment Status Component
 * 
 * Displays the current environment status in the settings page
 * with quick access to detailed diagnostics.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import React, { useState } from 'react'
import { Card, Alert, Button, Space, Tag, Typography, Statistic, Row, Col, Divider } from 'antd'
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useEnvironmentCheck, useEnvironmentChecker } from '@/hooks/useEnvironmentCheck'
import EnvironmentCheck from '@/components/Common/EnvironmentCheck'
import { useTranslation } from 'react-i18next'

const { Text, Title } = Typography

export const EnvironmentStatus: React.FC = () => {
  const { t } = useTranslation(['settings', 'common'])
  const { report, isHealthy, hasWarnings, hasErrors, lastCheckTime } = useEnvironmentCheck()
  const { runCheck, loading } = useEnvironmentChecker()
  const [showDetails, setShowDetails] = useState(false)

  // Get status info
  const getStatusInfo = () => {
    if (!report) {
      return {
        type: 'info' as const,
        icon: <InfoCircleOutlined />,
        title: 'Environment Check Pending',
        description: 'Environment check has not been run yet'
      }
    }

    if (isHealthy) {
      return {
        type: 'success' as const,
        icon: <CheckCircleOutlined />,
        title: 'Environment Healthy',
        description: 'All systems are working correctly'
      }
    } else if (hasErrors) {
      return {
        type: 'error' as const,
        icon: <CloseCircleOutlined />,
        title: 'Environment Issues',
        description: `${report.summary.errors} critical error(s) detected`
      }
    } else {
      return {
        type: 'warning' as const,
        icon: <WarningOutlined />,
        title: 'Environment Warnings',
        description: `${report.summary.warnings} warning(s) detected`
      }
    }
  }

  const statusInfo = getStatusInfo()

  // Format last check time
  const formatLastCheck = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day(s) ago`
    if (hours > 0) return `${hours} hour(s) ago`
    if (minutes > 0) return `${minutes} minute(s) ago`
    return 'Just now'
  }

  return (
    <>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Environment Status</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={runCheck}
              loading={loading}
              size="small"
            >
              Check Now
            </Button>
            <Button 
              icon={<InfoCircleOutlined />}
              onClick={() => setShowDetails(true)}
              size="small"
            >
              Details
            </Button>
          </Space>
        }
      >
        {/* Main Status Alert */}
        <Alert
          type={statusInfo.type}
          icon={statusInfo.icon}
          message={statusInfo.title}
          description={statusInfo.description}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Statistics */}
        {report && (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Passed"
                  value={report.summary.passed}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Warnings"
                  value={report.summary.warnings}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Errors"
                  value={report.summary.errors}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <div>
                  <Text type="secondary">Last Check</Text>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {formatLastCheck(lastCheckTime)}
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            {/* Quick Issues Summary */}
            {(hasWarnings || hasErrors) && (
              <div>
                <Title level={5}>Issues Detected:</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.checks
                    .filter(check => !check.passed)
                    .slice(0, 3) // Show only first 3 issues
                    .map((check, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {check.severity === 'error' ? (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        ) : (
                          <WarningOutlined style={{ color: '#faad14' }} />
                        )}
                        <Text>{check.message}</Text>
                        <Tag color={check.severity === 'error' ? 'red' : 'orange'}>
                          {check.category}
                        </Tag>
                      </div>
                    ))}
                  
                  {report.checks.filter(check => !check.passed).length > 3 && (
                    <Text type="secondary">
                      And {report.checks.filter(check => !check.passed).length - 3} more issue(s)...
                    </Text>
                  )}
                </div>
              </div>
            )}

            {/* Health Summary */}
            {isHealthy && (
              <div>
                <Title level={5}>System Health:</Title>
                <Space wrap>
                  <Tag color="green">Chrome APIs Ready</Tag>
                  <Tag color="green">Storage Healthy</Tag>
                  <Tag color="green">Database Intact</Tag>
                  <Tag color="green">Permissions Granted</Tag>
                </Space>
              </div>
            )}
          </>
        )}

        {!report && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">
              Click "Check Now" to run environment diagnostics
            </Text>
          </div>
        )}
      </Card>

      {/* Detailed Environment Check Modal */}
      <EnvironmentCheck
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        autoRun={false}
      />
    </>
  )
}

export default EnvironmentStatus 