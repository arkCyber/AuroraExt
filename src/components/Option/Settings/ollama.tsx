/**
 * SettingsOllama Component
 * 
 * A settings panel for configuring Ollama integration settings.
 * Allows users to:
 * - Set the Ollama server URL
 * - Enable/disable Ollama globally
 * - Configure advanced Ollama settings
 * - Manage model settings
 * 
 * Uses React Query for data fetching and Ant Design components for the UI.
 */

import { useQuery } from "@tanstack/react-query"
import { Collapse, Skeleton, Switch } from "antd"
import { useState } from "react"
import { SaveButton } from "~/components/Common/SaveButton"
import { getOllamaURL, setOllamaURL as saveOllamaURL } from "~/services/ollama"
import { Trans, useTranslation } from "react-i18next"
import { AdvanceOllamaSettings } from "@/components/Common/Settings/AdvanceOllamaSettings"
import { ModelSettings } from "./model-settings"
import { useStorage } from "@plasmohq/storage/hook"
import { AlertCircleIcon } from "lucide-react"
import { Link } from "react-router-dom"

export const SettingsOllama = () => {
  // State management for Ollama URL and enabled status
  const [ollamaURL, setOllamaURL] = useState<string>("")
  const [ollamaEnabled, setOllamaEnabled] = useStorage(
    "ollamaEnabledStatus",
    true
  )
  const [_, setCheckOllamaStatus] = useStorage("checkOllamaStatus", true)
  const { t } = useTranslation("settings")

  // Fetch Ollama URL using React Query
  const { status } = useQuery({
    queryKey: ["fetchOllamURL"],
    queryFn: async () => {
      try {
        const [ollamaURL] = await Promise.all([getOllamaURL()])
        setOllamaURL(ollamaURL)
        return {}
      } catch (e) {
        console.error(e)
        return {}
      }
    }
  })

  return (
    <div className="flex flex-col space-y-1">
      {/* Loading State */}
      {status === "pending" && <Skeleton paragraph={{ rows: 4 }} active />}

      {/* Main Settings Panel */}
      {status === "success" && (
        <div className="flex flex-col space-y-2">
          <div>
            {/* Header Section */}
            <div>
              <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                {t("ollamaSettings.heading")}
              </h2>
              <div className="mt-1 mb-2 border border-b border-gray-200 dark:border-gray-600"></div>
            </div>

            {/* Ollama URL Configuration */}
            <div className="mb-2">
              <label
                htmlFor="ollamaURL"
                className="text-sm font-medium dark:text-gray-200">
                {t("ollamaSettings.settings.ollamaUrl.label")}
              </label>
              <input
                type="url"
                id="ollamaURL"
                value={ollamaURL}
                onChange={(e) => {
                  setOllamaURL(e.target.value)
                }}
                placeholder={t("ollamaSettings.settings.ollamaUrl.placeholder")}
                className="w-full p-1 border border-gray-300 rounded-md dark:bg-[#262626] dark:text-gray-100 text-[15px]"
              />
            </div>

            {/* Save URL Button */}
            <div className="flex justify-end mb-2">
              <SaveButton
                onClick={() => {
                  saveOllamaURL(ollamaURL)
                }}
                className="mt-1"
              />
            </div>

            {/* Advanced Settings Collapse Panel */}
            <Collapse
              size="small"
              items={[
                {
                  key: "1",
                  label: (
                    <div>
                      <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        {t("ollamaSettings.settings.advanced.label")}
                      </h2>
                      <p className="mb-2 text-xs text-gray-700 dark:text-gray-400">
                        <Trans
                          i18nKey="settings:ollamaSettings.settings.advanced.help"
                          components={{
                            anchor: (
                              <a
                                href="https://github.com/n4ze3m/page-assist/blob/main/docs/connection-issue.md#solutions"
                                target="__blank"
                                className="text-blue-600 dark:text-blue-400"></a>
                            )
                          }}
                        />
                      </p>
                    </div>
                  ),
                  children: <AdvanceOllamaSettings />
                }
              ]}
            />

            {/* Global Enable/Disable Section */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium dark:text-gray-200">
                  {t("ollamaSettings.settings.globalEnable.label")}
                </label>
                <Switch
                  size="small"
                  checked={ollamaEnabled}
                  onChange={(checked) => {
                    setOllamaEnabled(checked)
                    setCheckOllamaStatus(checked)
                  }}
                  className={`${ollamaEnabled ? 'dark:!bg-indigo-300' : ''}`}
                />
              </div>

              {/* Warning Message when Ollama is Disabled */}
              {!ollamaEnabled && (
                <div className="p-2 mt-1 rounded-md bg-yellow-50 dark:bg-yellow-900/30">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircleIcon className="w-4 h-4 text-yellow-400 dark:text-yellow-500" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <Trans
                          i18nKey="settings:ollamaSettings.settings.globalEnable.warning"
                          components={{
                            anchor: (
                              <Link
                                to="/settings/openai"
                                className="text-blue-600 dark:text-blue-400"></Link>
                            )
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Settings Section */}
          <ModelSettings />
        </div>
      )}
    </div>
  )
}