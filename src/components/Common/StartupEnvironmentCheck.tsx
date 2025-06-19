/**
 * Startup Environment Check Component
 * 
 * Automatically runs environment checks on application startup and
 * displays critical issues that need immediate attention.
 * 
 * @author Aurora Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react'
import { Modal, Alert, Button, Space, Typography, List } from 'antd'
import { 
  WarningOutlined, 
  CloseCircleOutlined,
  SettingOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons'
import { useEnvironmentCheck } from '@/hooks/useEnvironmentCheck'
import EnvironmentCheck from './EnvironmentCheck'
import { useNavigate } from 'react-router-dom'

const { Text, Title } = Typography

export const StartupEnvironmentCheck: React.FC = () => {
  const { report, isHealthy, hasErrors } = useEnvironmentCheck()
  const [showStartupModal, setShowStartupModal] = useState(false)
  const [showDetailedModal, setShowDetailedModal] = useState(false)
  const [hasShownStartupCheck, setHasShownStartupCheck] = useState(false)
  const navigate = useNavigate()

  // Show startup modal if there are critical issues
  useEffect(() => {
    if (report && !hasShownStartupCheck) {
      // Only show modal for critical errors, not warnings
      if (hasErrors) {
        setShowStartupModal(true)
      }
      setHasShownStartupCheck(true)
    }
  }, [report, hasErrors, hasShownStartupCheck])

  // Get critical issues
  const getCriticalIssues = () => {
    if (!report) return []
    return report.checks.filter(check => !check.passed && check.severity === 'error')
  }

  const criticalIssues = getCriticalIssues()

  if (!showStartupModal || !report || !hasErrors) {
    return null
  }

  return (
    <>
      {/* Startup Warning Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
              Environment Issues Detected
            </Title>
          </Space>
        }
        open={showStartupModal}
        onCancel={() => setShowStartupModal(false)}
        footer={[
          <Button 
            key="ignore" 
            onClick={() => setShowStartupModal(false)}
          >
            Continue Anyway
          </Button>,
          <Button 
            key="details" 
            icon={<SettingOutlined />}
            onClick={() => {
              setShowStartupModal(false)
              setShowDetailedModal(true)
            }}
          >
            View Details
          </Button>,
          <Button 
            key="settings" 
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => {
              setShowStartupModal(false)
              navigate('/settings')
            }}
          >
            Go to Settings
          </Button>
        ]}
        width={600}
        closable={false}
        maskClosable={false}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="error"
            message="Critical System Issues"
            description={`${criticalIssues.length} critical error(s) were detected that may prevent Aurora from working properly.`}
            showIcon
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>Critical Issues:</Text>
        </div>

        <List
          size="small"
          dataSource={criticalIssues.slice(0, 5)} // Show max 5 issues
          renderItem={(issue) => (
            <List.Item>
              <Space>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                <div>
                  <Text strong>{issue.category}: </Text>
                  <Text>{issue.message}</Text>
                </div>
              </Space>
            </List.Item>
          )}
        />

        {criticalIssues.length > 5 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              And {criticalIssues.length - 5} more critical issue(s)...
            </Text>
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, background: '#f6f6f6', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>What this means:</strong> These issues may cause features to malfunction, 
            prevent API calls from working, or lead to unexpected errors during use. 
            We recommend resolving these issues before continuing.
          </Text>
        </div>
      </Modal>

      {/* Detailed Environment Check Modal */}
      <EnvironmentCheck
        visible={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        autoRun={false}
      />
    </>
  )
}

export default StartupEnvironmentCheck 