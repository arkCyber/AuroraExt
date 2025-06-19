/**
 * OpenAIFetchModel Component
 * 
 * A component that allows users to fetch, search, and select OpenAI models for their configuration.
 * It provides functionality to:
 * - Fetch available models from OpenAI API
 * - Search through available models
 * - Select/deselect models individually or all at once
 * - Save selected models with their type (chat or embedding)
 */

import { getOpenAIConfigById } from "@/db/openai"
import { getAllOpenAIModels } from "@/libs/openai"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Checkbox, Input, Spin, message, Radio } from "antd"
import { useState, useMemo } from "react"
import { createManyModels } from "@/db/models"
import { Popover } from "antd"
import { InfoIcon } from "lucide-react"

/**
 * Props interface for the OpenAIFetchModel component
 * @property {string} openaiId - The ID of the OpenAI configuration
 * @property {Function} setOpenModelModal - Function to control the visibility of the model selection modal
 */
type Props = {
  openaiId: string
  setOpenModelModal: (openModelModal: boolean) => void
}

export const OpenAIFetchModel = ({ openaiId, setOpenModelModal }: Props) => {
  const { t } = useTranslation(["openai"])
  // State for managing selected models, search term, and model type
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [modelType, setModelType] = useState("chat")
  const queryClient = useQueryClient()

  // Query to fetch OpenAI models using the provided configuration
  const { data, status, error } = useQuery({
    queryKey: ["openAIConfigs", openaiId],
    queryFn: async () => {
      console.log('🔄 [DEBUG] OpenAIFetchModel: Starting model fetch for provider:', openaiId)
      
      try {
        const config = await getOpenAIConfigById(openaiId)
        console.log('⚙️ [DEBUG] Provider config retrieved:', {
          id: config?.id,
          name: config?.name,
          baseUrl: config?.baseUrl,
          hasApiKey: !!config?.apiKey,
          provider: config?.provider,
          headersCount: config?.headers?.length || 0
        })
        
        if (!config) {
          throw new Error(`Provider configuration not found for ID: ${openaiId}`)
        }
        
        if (!config.baseUrl) {
          throw new Error('Provider baseUrl is missing')
        }
        
        console.log('🚀 [DEBUG] Calling getAllOpenAIModels...')
        const models = await getAllOpenAIModels(config.baseUrl, config.apiKey, config.headers)
        
        console.log('📊 [DEBUG] Models fetched successfully:', {
          count: models?.length || 0,
          models: models?.slice(0, 3)?.map(m => ({ id: m.id, name: m.name })) || []
        })
        
        return models
      } catch (fetchError) {
        console.error('❌ [ERROR] Failed to fetch models in OpenAIFetchModel:', fetchError)
        console.error('🔍 [ERROR] Error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        })
        throw fetchError
      }
    },
    enabled: !!openaiId,
    retry: (failureCount, error) => {
      console.log(`🔄 [DEBUG] Retry attempt ${failureCount} for openaiId: ${openaiId}`)
      console.log('⚠️ [DEBUG] Error that triggered retry:', error)
      return failureCount < 2 // Retry up to 2 times
    }
  })

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    return (
      data?.filter((model) =>
        (model.name ?? model.id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) || []
    )
  }, [data, searchTerm])

  /**
   * Handles selecting/deselecting all models
   * @param {boolean} checked - Whether to select or deselect all models
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedModels(filteredModels.map((model) => model.id))
    } else {
      setSelectedModels([])
    }
  }

  /**
   * Handles selecting/deselecting individual models
   * @param {string} modelId - The ID of the model to toggle
   * @param {boolean} checked - Whether to select or deselect the model
   */
  const handleModelSelect = (modelId: string, checked: boolean) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, modelId])
    } else {
      setSelectedModels((prev) => prev.filter((id) => id !== modelId))
    }
  }

  /**
   * Saves the selected models to the database
   * @param {string[]} models - Array of model IDs to save
   * @returns {Promise<boolean>} - Success status of the operation
   */
  const onSave = async (models: string[]) => {
    const payload = models.map((id) => ({
      model_id: id,
      name: filteredModels.find((model) => model.id === id)?.name ?? id,
      provider_id: openaiId,
      model_type: modelType
    }))

    await createManyModels(payload)
    return true
  }

  // Mutation hook for saving models
  const { mutate: saveModels, isPending: isSaving } = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setOpenModelModal(false)
      queryClient.invalidateQueries({
        queryKey: ["fetchModel"]
      })
      message.success(t("modal.model.success"))
    }
  })

  // Handler for the save button click
  const handleSave = () => {
    saveModels(selectedModels)
  }

  // Loading state
  if (status === "pending") {
    return (
      <div className="flex items-center justify-center h-40">
        <Spin size="large" />
      </div>
    )
  }

  // Error state or no data
  if (status === "error" || !data || data.length === 0) {
    console.error('🚨 [DEBUG] OpenAIFetchModel error state:', {
      status,
      hasData: !!data,
      dataLength: data?.length,
      error: error?.message,
      openaiId
    })
    
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-4">
        <p className="text-center text-gray-600 text-md dark:text-gray-300">
          {status === "error" ? "Failed to fetch models" : t("noModelFound")}
        </p>
        {status === "error" && (
          <div className="text-center">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">
              Error: {error?.message || "Unknown error"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Check browser console for detailed logs
            </p>
          </div>
        )}
        {status !== "error" && data?.length === 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              API responded but returned no models
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("modal.model.subheading")}
      </p>

      {/* Search input for filtering models */}
      <Input
        placeholder={t("searchModel")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />

      {/* Selection controls */}
      <div className="flex justify-between">
        <Checkbox
          checked={selectedModels.length === filteredModels.length}
          indeterminate={
            selectedModels.length > 0 &&
            selectedModels.length < filteredModels.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}>
          {t("selectAll")}
        </Checkbox>
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {`${selectedModels?.length} / ${data?.length}`}
        </div>
      </div>

      {/* Scrollable list of models */}
      <div className="space-y-2 custom-scrollbar max-h-[300px] border overflow-y-auto dark:border-gray-600 rounded-md p-3">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredModels.map((model, idx) => (
            <div
              key={idx}
              onClick={() => {
                handleModelSelect(model.id, !selectedModels.includes(model.id))
              }}
              className="flex items-center justify-between px-2 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedModels.includes(model.id)}
                  onChange={(e) =>
                    handleModelSelect(model.id, e.target.checked)
                  }
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {`${model?.name || model.id}`.replaceAll(
                      /accounts\/[^\/]+\/models\//g,
                      ""
                    )}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {model.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model type selection */}
      <div className="flex items-center">
        <Radio.Group
          onChange={(e) => setModelType(e.target.value)}
          value={modelType}>
          <Radio value="chat">{t("radio.chat")}</Radio>
          <Radio value="embedding">{t("radio.embedding")}</Radio>
        </Radio.Group>
        <Popover
          content={
            <div>
              <p>
                <b className="text-gray-800 dark:text-gray-100">
                  {t("radio.chat")}
                </b>{" "}
                {t("radio.chatInfo")}
              </p>
              <p>
                <b className="text-gray-800 dark:text-gray-100">
                  {t("radio.embedding")}
                </b>{" "}
                {t("radio.embeddingInfo")}
              </p>
            </div>
          }>
          <InfoIcon className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
        </Popover>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex items-center justify-center w-full px-2 py-2 mt-4 text-sm font-medium leading-4 text-center text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-white dark:text-gray-800 dark:hover:bg-gray-100 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-100 disabled:opacity-50">
        {isSaving ? t("saving") : t("save")}
      </button>
    </div>
  )
}
