/**
 * EmptySidePanel Component
 * 
 * This component displays the initial state of the chat panel when no conversation is active.
 * It handles:
 * 1. Ollama connection status display and management
 * 2. Model selection dropdown with search functionality
 * 3. RAG (Retrieval-Augmented Generation) mode toggle switch
 * 4. Ollama URL configuration and connection status
 * 
 * The component uses React Query for data fetching and state management,
 * and integrates with the browser's storage system for persistent settings.
 */

import { cleanUrl } from "@/libs/clean-url"
import { useStorage } from "@plasmohq/storage/hook"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Select } from "antd"
import {
  getOllamaURL,
  isOllamaRunning,
  setOllamaURL as saveOllamaURL,
  fetchChatModels
} from "~/services/ollama"
import { useMessage } from "~/hooks/useMessage"

export const EmptySidePanel = () => {
  // State for managing Ollama URL input field
  const [ollamaURL, setOllamaURL] = useState<string>("")
  const { t } = useTranslation(["common"])
  const queryClient = useQueryClient()

  // Get chat mode and model selection from global message context
  const { selectedModel, setSelectedModel, chatMode, setChatMode } = useMessage()

  // Get user preference for Ollama status checking from browser storage
  const [checkOllamaStatus] = useStorage("checkOllamaStatus", true)

  // Query hook for fetching Ollama status and available models
  // This query runs when checkOllamaStatus changes
  const {
    data: ollamaInfo,
    status: ollamaStatus,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["ollamaStatus", checkOllamaStatus],
    queryFn: async () => {
      const ollamaURL = await getOllamaURL()
      const isOk = await isOllamaRunning()
      const models = await fetchChatModels({ returnEmpty: false })
      // Invalidate the models query to refresh the dropdown
      queryClient.invalidateQueries({
        queryKey: ["getAllModelsForSelect"]
      })
      return {
        isOk: checkOllamaStatus ? isOk : true,
        models,
        ollamaURL
      }
    }
  })

  // Update local Ollama URL state when the info changes
  useEffect(() => {
    if (ollamaInfo?.ollamaURL) {
      setOllamaURL(ollamaInfo.ollamaURL)
    }
  }, [ollamaInfo])

  /**
   * Renders the main configuration section containing:
   * 1. Model selection dropdown with search functionality
   * 2. RAG mode toggle switch for enabling/disabling page context integration
   */
  const renderSection = () => {
    return (
      <div className="mt-4">
        {/* Model Selection Dropdown with Search */}
        <Select
          onChange={(e) => {
            setSelectedModel(e)
            localStorage.setItem("selectedModel", e)
          }}
          value={selectedModel}
          size="large"
          filterOption={(input, option) =>
            option?.label?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
            option?.value?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          showSearch
          placeholder={t("selectAModel")}
          style={{ width: "100%" }}
          className="mt-4 [&_.ant-select-selection-placeholder]:text-[15px]"
          options={ollamaInfo?.models?.map((model) => ({
            label: model.name,
            value: model.model
          }))}
        />

        {/* RAG Mode Toggle Switch with Custom Styling */}
        <div className="mt-4">
          <div className="inline-flex items-center">
            <label
              className="relative flex items-center p-3 rounded-full cursor-pointer"
              htmlFor="check">
              <input
                type="checkbox"
                checked={chatMode === "rag"}
                onChange={(e) => {
                  setChatMode(e.target.checked ? "rag" : "normal")
                }}
                className="before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-10 before:w-10 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity"
                id="check"
              />
              <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"></path>
                </svg>
              </span>
            </label>
            <label
              className="mt-px text-sm font-light text-gray-900 cursor-pointer select-none dark:text-gray-400"
              htmlFor="check">
              {t("chatWithCurrentPage")}
            </label>
          </div>
        </div>
      </div>
    )
  }

  // Render welcome screen when Ollama status check is disabled
  if (!checkOllamaStatus) {
    return (
      <div className="px-4 mx-auto mt-10 sm:max-w-md">
        <div className="rounded-lg justify-start items-start flex flex-col border dark:border-gray-700 p-8 bg-white dark:bg-[#262626] shadow-lg">
          <div className="inline-flex items-center space-x-2">
            <p className="text-sm text-gray-900 dark:text-gray-400">
              <span>👋</span>
              {t("welcome")}
            </p>
          </div>
          {ollamaStatus === "success" && ollamaInfo?.isOk && renderSection()}
        </div>
      </div>
    )
  }

  // Main render with Ollama status check and connection management
  return (
    <div className="px-4 mx-auto mt-10 sm:max-w-lg">
      <div className="rounded-lg justify-start items-start flex flex-col border border-gray-300 dark:border-gray-700 p-8 bg-white/80 dark:bg-[#262626]/80 backdrop-blur-sm shadow-lg">
        {/* Loading State with Bouncing Animation */}
        {(ollamaStatus === "pending" || isRefetching) && (
          <div className="inline-flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <p className="text-sm text-gray-900 dark:text-gray-400">
              {t("ollamaState.searching")}
            </p>
          </div>
        )}
        {/* Success State with Pulse Animation */}
        {!isRefetching && ollamaStatus === "success" ? (
          ollamaInfo?.isOk ? (
            <div className="flex flex-col w-full space-y-4">
              <div className="inline-flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-900 dark:text-gray-400">
                  {t("ollamaState.running")}
                </p>
              </div>
              {renderSection()}
            </div>
          ) : (
            // Error State with URL Configuration
            <div className="flex flex-col items-start justify-start w-full space-y-2">
              <div className="inline-flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <p className="text-sm text-gray-900 dark:text-gray-400">
                  {t("ollamaState.notRunning")}
                </p>
              </div>

              {/* Ollama URL Input Field */}
              <input
                className="w-full px-4 py-2 mt-2 bg-gray-100 rounded-md dark:bg-black dark:text-gray-100"
                type="url"
                value={ollamaURL}
                onChange={(e) => setOllamaURL(e.target.value)}
              />

              {/* Retry Connection Button */}
              <button
                onClick={() => {
                  saveOllamaURL(ollamaURL)
                  refetch()
                }}
                className="inline-flex items-center px-2 py-2 mt-4 text-sm font-medium leading-4 text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-white dark:text-gray-800 dark:hover:bg-gray-100 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-100 disabled:opacity-50">
                <RotateCcw className="w-4 h-4 mr-3" />
                {t("retry")}
              </button>

              {/* Connection Error Message with Link */}
              {ollamaURL && cleanUrl(ollamaURL) !== "http://127.0.0.1:11434" && (
                <p className="mb-4 text-xs text-center text-gray-700 dark:text-gray-400">
                  <Trans
                    i18nKey="ollamaState.connectionError"
                    components={{
                      anchor: (
                        <a
                          href="https://github.com/n4ze3m/page-assist/blob/main/docs/connection-issue.md"
                          target="__blank"
                          className="text-blue-600 dark:text-blue-400"></a>
                      )
                    }}
                  />
                </p>
              )}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
