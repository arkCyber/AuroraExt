/**
 * SettingsPrompt Component
 * 
 * A component that allows users to configure and manage different types of prompts:
 * 1. RAG (Retrieval-Augmented Generation) prompts
 * 2. Web Search prompts
 * 
 * Features:
 * - Toggle between RAG and Web Search prompt configurations
 * - Form-based prompt editing with validation
 * - Real-time updates using React Query
 * - Internationalization support
 * - Auto-initialization status display
 * - Manual reinitialization controls
 */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Skeleton, Radio, Form, Input, Button, Tag, Space, Divider } from "antd"
import React from "react"
import { useTranslation } from "react-i18next"
import { SaveButton } from "@/components/Common/SaveButton2"
import {
  getWebSearchPrompt,
  geWebSearchFollowUpPrompt,
  setWebPrompts,
  promptForRag,
  setPromptForRag
} from "~/services/ollama"
import {
  getPromptsStats,
  forceReinitializePrompts,
  getCurrentPromptsVersion
} from "@/services/prompt-initialization"

export const SettingPrompt = () => {
  const { t } = useTranslation("settings")

  // State to track which prompt type is currently selected (RAG or Web Search)
  const [selectedValue, setSelectedValue] = React.useState<"web" | "rag">("rag")

  // React Query client for managing server state and cache invalidation
  const queryClient = useQueryClient()

  // Fetch all prompt configurations using React Query
  // This includes RAG prompts and Web Search prompts
  const { status, data } = useQuery({
    queryKey: ["fetchRagPrompt"],
    queryFn: async () => {
      const [prompt, webSearchPrompt, webSearchFollowUpPrompt] =
        await Promise.all([
          promptForRag(),
          getWebSearchPrompt(),
          geWebSearchFollowUpPrompt()
        ])

      return {
        prompt,
        webSearchPrompt,
        webSearchFollowUpPrompt
      }
    }
  })

  // Fetch prompts statistics for auto-initialization status
  const { data: promptsStats, refetch: refetchStats } = useQuery({
    queryKey: ["promptsStats"],
    queryFn: getPromptsStats,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Handle forced reinitialization of default prompts
  const handleForceReinit = async () => {
    try {
      console.log(`[${new Date().toISOString()}] Starting manual prompt reinitialization...`)
      const result = await forceReinitializePrompts()
      if (result) {
        await refetchStats()
        queryClient.invalidateQueries({ queryKey: ["fetchAllPrompts"] })
        console.log(`[${new Date().toISOString()}] Manual reinitialization completed successfully`)
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during manual reinitialization:`, error)
    }
  }

  return (
    <dl className="flex flex-col space-y-2 text-sm">
      {/* General Settings Header */}
      <div className="!mb-5">
        <h2 className="!text-base !font-semibold !leading-7 !text-gray-900 dark:!text-white">
          Prompts Management
        </h2>
        <div className="!mt-3 !border !border-b !border-gray-200 dark:!border-gray-600"></div>
      </div>

      {/* Auto-initialization Status Section */}
      {promptsStats && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
            Default Prompts Status
          </h3>
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Total Prompts:</span>
              <Tag color="blue">{promptsStats.total}</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">System Prompts:</span>
              <Tag color="green">{promptsStats.system}</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Quick Prompts:</span>
              <Tag color="orange">{promptsStats.quick}</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Version:</span>
              <Tag color={promptsStats.version !== 'not-initialized' ? 'success' : 'warning'}>
                {promptsStats.version}
              </Tag>
            </div>
          </Space>
          
          <Divider className="my-3" />
          
          <div className="flex justify-end">
            <Button 
              size="small" 
              type="primary" 
              danger
              onClick={handleForceReinit}
              className="text-xs"
            >
              Force Reinitialize Defaults
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            ⚠️ This will reset all system prompts to defaults. User-created prompts will be preserved.
          </div>
        </div>
      )}

      {/* Show loading skeleton while fetching data */}
      {status === "pending" && <Skeleton paragraph={{ rows: 4 }} active />}

      {status === "success" && (
        <>
          {/* Toggle between RAG and Web Search prompt configurations */}
          <div className="flex justify-end my-3">
            <Radio.Group
              defaultValue={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}>
              <Radio.Button value="rag">RAG</Radio.Button>
              <Radio.Button value="web">{t("rag.prompt.option2")}</Radio.Button>
            </Radio.Group>
          </div>

          {/* RAG Prompt Configuration Form */}
          {selectedValue === "rag" && (
            <Form
              layout="vertical"
              onFinish={(values) => {
                // Update RAG prompts and invalidate the query cache to refresh data
                setPromptForRag(
                  values?.systemPrompt || "",
                  values?.questionPrompt || ""
                )
                queryClient.invalidateQueries({
                  queryKey: ["fetchRagPrompt"]
                })
              }}
              initialValues={{
                systemPrompt: data.prompt.ragPrompt,
                questionPrompt: data.prompt.ragQuestionPrompt
              }}>
              {/* System Prompt Input */}
              <Form.Item
                label={t("managePrompts.systemPrompt")}
                name="systemPrompt"
                rules={[
                  {
                    required: true,
                    message: "Enter a prompt."
                  }
                ]}>
                <Input.TextArea
                  value={data.webSearchPrompt}
                  rows={5}
                  placeholder="Enter a prompt."
                />
              </Form.Item>
              {/* Question Prompt Input */}
              <Form.Item
                label={t("managePrompts.questionPrompt")}
                name="questionPrompt"
                rules={[
                  {
                    required: true,
                    message: "Enter a follow up prompt."
                  }
                ]}>
                <Input.TextArea
                  value={data.webSearchFollowUpPrompt}
                  rows={5}
                  placeholder={t(
                    "rag.prompt.webSearchFollowUpPromptPlaceholder"
                  )}
                />
              </Form.Item>
              <Form.Item>
                <div className="flex justify-end">
                  <SaveButton btnType="submit" />
                </div>{" "}
              </Form.Item>
            </Form>
          )}

          {/* Web Search Prompt Configuration Form */}
          {selectedValue === "web" && (
            <Form
              layout="vertical"
              onFinish={(values) => {
                // Update Web Search prompts and invalidate the query cache
                setWebPrompts(
                  values?.webSearchPrompt || "",
                  values?.webSearchFollowUpPrompt || ""
                )
                queryClient.invalidateQueries({
                  queryKey: ["fetchRagPrompt"]
                })
              }}
              initialValues={{
                webSearchPrompt: data.webSearchPrompt,
                webSearchFollowUpPrompt: data.webSearchFollowUpPrompt
              }}>
              {/* Web Search Prompt Input */}
              <Form.Item
                label={t("rag.prompt.webSearchPrompt")}
                name="webSearchPrompt"
                help={t("rag.prompt.webSearchPromptHelp")}
                rules={[
                  {
                    required: true,
                    message: t("rag.prompt.webSearchPromptError")
                  }
                ]}>
                <Input.TextArea
                  value={data.webSearchPrompt}
                  rows={5}
                  placeholder={t("rag.prompt.webSearchPromptPlaceholder")}
                />
              </Form.Item>
              {/* Web Search Follow-up Prompt Input */}
              <Form.Item
                label={t("rag.prompt.webSearchFollowUpPrompt")}
                name="webSearchFollowUpPrompt"
                help={t("rag.prompt.webSearchFollowUpPromptHelp")}
                rules={[
                  {
                    required: true,
                    message: t("rag.prompt.webSearchFollowUpPromptError")
                  }
                ]}>
                <Input.TextArea
                  value={data.webSearchFollowUpPrompt}
                  rows={5}
                  placeholder={t(
                    "rag.prompt.webSearchFollowUpPromptPlaceholder"
                  )}
                />
              </Form.Item>
              <Form.Item>
                <div className="flex justify-end">
                  <SaveButton btnType="submit" />
                </div>{" "}
              </Form.Item>
            </Form>
          )}
        </>
      )}
    </dl>
  )
}
