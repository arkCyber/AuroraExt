# Aurora Environment Check System

The Aurora Environment Check System is a comprehensive diagnostic tool that automatically detects and reports potential issues that could affect the application's functionality. This system helps prevent runtime errors by identifying problems during startup.

## Features

### 🔍 Comprehensive Diagnostics
- **Chrome API Availability**: Verifies extension APIs are accessible
- **Storage Health**: Tests read/write operations and storage usage
- **Provider Configurations**: Validates AI provider settings
- **Network Connectivity**: Checks internet connection
- **Extension Permissions**: Ensures required permissions are granted
- **Database Integrity**: Verifies data structure consistency
- **Local Server Detection**: Identifies available local AI servers

### 🚀 Automatic Startup Checks
- Runs automatically when Aurora starts
- Shows critical issues that need immediate attention
- Caches results to avoid repeated checks
- Provides actionable recommendations

### 🎯 Smart Alerting
- **Green**: All systems healthy
- **Yellow**: Warnings that may limit functionality
- **Red**: Critical errors requiring immediate attention

## How It Works

### 1. Automatic Initialization
When Aurora starts, the Environment Check system:
```typescript
// Automatically runs in EnvironmentCheckProvider
useEffect(() => {
  if (!hasRunInitialCheck) {
    // Check for cached results first
    const lastCheck = getLastEnvironmentCheck()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    if (lastCheck && lastCheck.timestamp > fiveMinutesAgo) {
      setReport(lastCheck) // Use cached results
    } else {
      runCheck() // Run fresh check
    }
  }
}, [])
```

### 2. Issue Detection
The system performs these specific checks:

#### Chrome APIs Check
```typescript
// Verifies essential Chrome extension APIs
if (!chrome.storage) missingAPIs.push('storage')
if (!chrome.runtime) missingAPIs.push('runtime') 
if (!chrome.tabs) missingAPIs.push('tabs')
```

#### Storage Health Check
```typescript
// Tests storage read/write operations
const testKey = '__aurora_storage_test__'
const testValue = { timestamp: Date.now(), test: true }
await chrome.storage.local.set({ [testKey]: testValue })
const result = await chrome.storage.local.get(testKey)
```

#### Provider Configuration Check
```typescript
// Validates AI provider settings
const providers = await getAllOpenAIConfig()
for (const provider of providers) {
  if (!provider.baseUrl) issues.push(`Missing baseUrl`)
  if (!provider.apiKey) issues.push(`Missing API key`)
}
```

### 3. User Interface

#### Settings Integration
The environment status is displayed in the Settings page:
```typescript
// In GeneralSettings component
<EnvironmentStatus />
```

#### Startup Warnings
Critical issues automatically show a modal on startup:
```typescript
// Shows only for critical errors
if (hasErrors) {
  setShowStartupModal(true)
}
```

## Usage Examples

### Manual Environment Check
```typescript
import { useEnvironmentChecker } from '@/hooks/useEnvironmentCheck'

const { runCheck, loading } = useEnvironmentChecker()

// Trigger manual check
await runCheck()
```

### Environment Status Monitoring
```typescript
import { useEnvironmentStatus } from '@/hooks/useEnvironmentCheck'

const { isHealthy, hasWarnings, hasErrors, status } = useEnvironmentStatus()

if (!isHealthy) {
  console.warn('Environment issues detected:', status)
}
```

### Environment Check Results
```typescript
import { useEnvironmentCheck } from '@/hooks/useEnvironmentCheck'

const { report } = useEnvironmentCheck()

// Access detailed results
report.checks.forEach(check => {
  console.log(`${check.category}: ${check.message}`)
})
```

## Check Categories

| Category | Description | Critical Level |
|----------|-------------|----------------|
| `chrome-api` | Chrome extension APIs availability | High |
| `storage` | Local storage read/write functionality | High |
| `providers` | AI provider configurations | Medium |
| `network` | Internet connectivity | Medium |
| `permissions` | Extension permissions | High |
| `database` | Data integrity and structure | High |
| `local-servers` | Local AI server availability | Low |

## Error Handling

### Graceful Degradation
```typescript
// System continues to work even if environment check fails
try {
  const envReport = await runEnvironmentCheck()
  setReport(envReport)
} catch (error) {
  console.error('Environment check failed:', error)
  // App continues to function
}
```

### User Guidance
The system provides specific guidance for each issue:
```typescript
// Example error with actionable advice
{
  passed: false,
  message: 'Missing permissions: storage, tabs',
  severity: 'error',
  category: 'permissions',
  // User sees: "Check Chrome extension permissions"
}
```

## Configuration

### Customizing Check Frequency
```typescript
// Cached results expire after 5 minutes
const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

// For development, force fresh checks:
const lastCheck = null // Bypasses cache
```

### Adding Custom Checks
```typescript
// Extend EnvironmentCheckService
class CustomEnvironmentCheck extends EnvironmentCheckService {
  async checkCustomFeature(): Promise<EnvironmentCheckResult> {
    try {
      // Your custom check logic
      return {
        passed: true,
        message: 'Custom feature working',
        severity: 'info',
        category: 'custom'
      }
    } catch (error) {
      return {
        passed: false,
        message: `Custom check failed: ${error.message}`,
        severity: 'error',
        category: 'custom'
      }
    }
  }
}
```

## Benefits

### For Users
- **Early Problem Detection**: Issues are identified before they cause failures
- **Clear Guidance**: Specific instructions on how to resolve problems
- **Improved Reliability**: Reduces unexpected errors during use

### For Developers
- **Debugging Support**: Detailed logs and error information
- **Health Monitoring**: Real-time system status visibility
- **Proactive Maintenance**: Issues caught before user reports

### For Support
- **Diagnostic Information**: Comprehensive system status reports
- **Issue Reproduction**: Consistent environment state tracking
- **Resolution Guidance**: Automated troubleshooting suggestions

## Implementation Details

### File Structure
```
src/
├── services/
│   └── environment-check.ts      # Core diagnostic service
├── hooks/
│   └── useEnvironmentCheck.tsx   # React hooks for state management
├── components/
│   ├── Common/
│   │   ├── EnvironmentCheck.tsx           # Detailed diagnostic modal
│   │   └── StartupEnvironmentCheck.tsx    # Startup warning modal
│   └── Option/Settings/
│       └── environment-status.tsx         # Settings page status display
```

### Integration Points
1. **App Initialization**: `EnvironmentCheckProvider` wraps main app
2. **Settings Page**: Status display in general settings
3. **Startup Flow**: Automatic critical issue detection
4. **Error Handling**: Graceful degradation when checks fail

This system ensures Aurora users have a smooth, reliable experience by catching and addressing potential issues before they impact functionality. 