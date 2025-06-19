/**
 * RAG (Retrieval-Augmented Generation) Settings Component
 * This component provides a user interface for configuring RAG-related settings including:
 * - Embedding model selection
 * - Text splitting strategy and parameters
 * - Chunk size and overlap settings
 * - Document retrieval settings
 * - File size limits
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, Form, Input, InputNumber, Select, Skeleton } from "antd"
import { SaveButton } from "@/components/Common/SaveButton2"
import {
  defaultEmbeddingChunkOverlap,
  defaultEmbeddingChunkSize,
  defaultEmbeddingModelForRag,
  defaultSplittingStrategy,
  defaultSsplttingSeparator,
  getEmbeddingModels,
  saveForRag
} from "~/services/ollama"
import { SettingPrompt } from "./prompt"
import { useTranslation } from "react-i18next"
import { getNoOfRetrievedDocs, getTotalFilePerKB } from "@/services/app"
import { SidepanelRag } from "./sidepanel-rag"
import { ProviderIcons } from "@/components/Common/ProviderIcon"

export const RagSettings = () => {
  const { t } = useTranslation("settings")
  const [form] = Form.useForm()
  // Watch splitting strategy changes to conditionally render separator input
  const splittingStrategy = Form.useWatch("splittingStrategy", form)
  const queryClient = useQueryClient()

  // Fetch all RAG-related settings from the backend
  const { data: ollamaInfo, status } = useQuery({
    queryKey: ["fetchRAGSettings"],
    queryFn: async () => {
      const [
        allModels,
        chunkOverlap,
        chunkSize,
        defaultEM,
        totalFilePerKB,
        noOfRetrievedDocs,
        splittingStrategy,
        splittingSeparator
      ] = await Promise.all([
        getEmbeddingModels({ returnEmpty: true }),
        defaultEmbeddingChunkOverlap(),
        defaultEmbeddingChunkSize(),
        defaultEmbeddingModelForRag(),
        getTotalFilePerKB(),
        getNoOfRetrievedDocs(),
        defaultSplittingStrategy(),
        defaultSsplttingSeparator()
      ])
      return {
        models: allModels,
        chunkOverlap,
        chunkSize,
        defaultEM,
        totalFilePerKB,
        noOfRetrievedDocs,
        splittingStrategy,
        splittingSeparator
      }
    }
  })

  // Mutation to save RAG settings
  const { mutate: saveRAG, isPending: isSaveRAGPending } = useMutation({
    mutationFn: async (data: {
      model: string
      chunkSize: number
      overlap: number
      totalFilePerKB: number
      noOfRetrievedDocs: number
      strategy: string
      separator: string
    }) => {
      await saveForRag(
        data.model,
        data.chunkSize,
        data.overlap,
        data.totalFilePerKB,
        data.noOfRetrievedDocs,
        data.strategy,
        data.separator
      )
      return true
    },
    onSuccess: () => {
      // Invalidate and refetch settings after successful save
      queryClient.invalidateQueries({
        queryKey: ["fetchRAGSettings"]
      })
    }
  })

  return (
    <div className="flex flex-col space-y-2">
      {/* Show loading skeleton while fetching settings */}
      {status === "pending" && <Skeleton paragraph={{ rows: 4 }} active />}
      {status === "success" && (
        <div className="flex flex-col space-y-4">
          {/* Main RAG Settings Section */}
          <div>
            <div>
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                {t("rag.ragSettings.label")}
              </h2>
              <div className="mt-2 mb-4 border border-b border-gray-200 dark:border-gray-600"></div>
            </div>
            {/* Settings Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={(data) => {
                saveRAG({
                  model: data.defaultEM,
                  chunkSize: data.chunkSize,
                  overlap: data.chunkOverlap,
                  totalFilePerKB: data.totalFilePerKB,
                  noOfRetrievedDocs: data.noOfRetrievedDocs,
                  separator: data.splittingSeparator,
                  strategy: data.splittingStrategy
                })
              }}
              initialValues={{
                chunkSize: ollamaInfo?.chunkSize,
                chunkOverlap: ollamaInfo?.chunkOverlap,
                defaultEM: ollamaInfo?.defaultEM,
                totalFilePerKB: ollamaInfo?.totalFilePerKB,
                noOfRetrievedDocs: ollamaInfo?.noOfRetrievedDocs,
                splittingStrategy: ollamaInfo?.splittingStrategy,
                splittingSeparator: ollamaInfo?.splittingSeparator
              }}>
              {/* Embedding Model Selection */}
              <Form.Item
                name="defaultEM"
                label={t("rag.ragSettings.model.label")}
                help={t("rag.ragSettings.model.help")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.model.required")
                  }
                ]}>
                <Select
                  size="large"
                  showSearch
                  placeholder={t("rag.ragSettings.model.placeholder")}
                  style={{ width: "100%" }}
                  className="mt-4 [&_.ant-select-selection-placeholder]:text-[15px]"
                  filterOption={(input, option) =>
                    option.label.key
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={ollamaInfo.models?.map((model) => ({
                    label: (
                      <span
                        key={model.model}
                        className="flex flex-row items-center gap-3 truncate">
                        {model?.avatar ? (
                          <Avatar
                            src={model.avatar}
                            alt={model.name}
                            size="small"
                          />
                        ) : (
                          <ProviderIcons
                            provider={model?.provider}
                            className="w-5 h-5"
                          />
                        )}
                        <span className="truncate">
                          {model?.nickname || model?.name}
                        </span>
                      </span>
                    ),
                    value: model.model
                  }))}
                />
              </Form.Item>

              {/* Text Splitting Strategy Selection */}
              <Form.Item
                name="splittingStrategy"
                label={t("rag.ragSettings.splittingStrategy.label")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.model.required")
                  }
                ]}>
                <Select
                  size="large"
                  showSearch
                  style={{ width: "100%" }}
                  className="mt-4 [&_.ant-select-selection-placeholder]:text-[15px]"
                  options={[
                    "RecursiveCharacterTextSplitter",
                    "CharacterTextSplitter"
                  ].map((e) => ({
                    label: e,
                    value: e
                  }))}
                />
              </Form.Item>

              {/* Conditional Separator Input for CharacterTextSplitter */}
              {splittingStrategy !== "RecursiveCharacterTextSplitter" && (
                <Form.Item
                  name="splittingSeparator"
                  label={t("rag.ragSettings.splittingSeparator.label")}
                  rules={[
                    {
                      required: true,
                      message: t("rag.ragSettings.splittingSeparator.required")
                    }
                  ]}>
                  <Input
                    size="large"
                    style={{ width: "100%" }}
                    placeholder={t(
                      "rag.ragSettings.splittingSeparator.placeholder"
                    )}
                  />
                </Form.Item>
              )}

              {/* Chunk Size Configuration */}
              <Form.Item
                name="chunkSize"
                label={t("rag.ragSettings.chunkSize.label")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.chunkSize.required")
                  }
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder={t("rag.ragSettings.chunkSize.placeholder")}
                />
              </Form.Item>

              {/* Chunk Overlap Configuration */}
              <Form.Item
                name="chunkOverlap"
                label={t("rag.ragSettings.chunkOverlap.label")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.chunkOverlap.required")
                  }
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder={t("rag.ragSettings.chunkOverlap.placeholder")}
                />
              </Form.Item>

              {/* Number of Retrieved Documents Configuration */}
              <Form.Item
                name="noOfRetrievedDocs"
                label={t("rag.ragSettings.noOfRetrievedDocs.label")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.noOfRetrievedDocs.required")
                  }
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder={t(
                    "rag.ragSettings.noOfRetrievedDocs.placeholder"
                  )}
                />
              </Form.Item>

              {/* Total File Size Limit Configuration */}
              <Form.Item
                name="totalFilePerKB"
                label={t("rag.ragSettings.totalFilePerKB.label")}
                rules={[
                  {
                    required: true,
                    message: t("rag.ragSettings.totalFilePerKB.required")
                  }
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder={t("rag.ragSettings.totalFilePerKB.placeholder")}
                />
              </Form.Item>

              {/* Save Button */}
              <div className="flex justify-end">
                <SaveButton disabled={isSaveRAGPending} btnType="submit" />
              </div>
            </Form>
          </div>

          {/* RAG Sidepanel Component */}
          <SidepanelRag />

          {/* Prompt Settings Section */}
          <div>
            <div>
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                {t("rag.prompt.label")}
              </h2>
              <div className="mt-2 mb-4 border border-b border-gray-200 dark:border-gray-600"></div>
            </div>
            <SettingPrompt />
          </div>
        </div>
      )}
    </div>
  )
}
