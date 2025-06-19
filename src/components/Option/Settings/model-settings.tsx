/**
 * ModelSettings Component
 * 
 * A settings panel that allows users to configure various model parameters for the application.
 * Uses React Query for state management and Ant Design components for the UI.
 * Includes both basic and advanced settings for model configuration.
 */

import { BetaTag } from "@/components/Common/Beta"
import { SaveButton } from "@/components/Common/SaveButton2"
import { getAllModelSettings, setModelSetting } from "@/services/model-settings"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Form, Skeleton, Input, InputNumber, Collapse, Switch } from "antd"
import React from "react"
import { useTranslation } from "react-i18next"

export const ModelSettings = () => {
  // Initialize hooks and state
  const { t } = useTranslation("common")
  const [form] = Form.useForm()
  const client = useQueryClient()

  // Fetch model settings using React Query
  const { isPending: isLoading } = useQuery({
    queryKey: ["fetchModelConfig"],
    queryFn: async () => {
      const data = await getAllModelSettings()
      form.setFieldsValue(data)
      return data
    }
  })

  return (
    <div>
      {/* Header Section */}
      <div>
        <div className="inline-flex items-center gap-2">
          <BetaTag />
          <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
            {t("modelSettings.label")}
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-700 dark:text-neutral-400">
          {t("modelSettings.description")}
        </p>
        <div className="mt-3 mb-6 border border-b border-gray-200 dark:border-gray-500"></div>
      </div>

      {/* Main Settings Form */}
      {!isLoading ? (
        <Form
          onFinish={(values: {
            keepAlive: string
            temperature: number
            topK: number
            topP: number
            numGpu: number
          }) => {
            // Save each setting individually
            Object.entries(values).forEach(([key, value]) => {
              setModelSetting(key, value)
            })
            // Invalidate queries to refresh data
            client.invalidateQueries({
              queryKey: ["fetchModelConfig"]
            })
          }}
          form={form}
          layout="vertical">
          {/* Basic Settings */}
          <Form.Item
            name="keepAlive"
            help={t("modelSettings.form.keepAlive.help")}
            label={t("modelSettings.form.keepAlive.label")}>
            <Input
              size="large"
              placeholder={t("modelSettings.form.keepAlive.placeholder")}
            />
          </Form.Item>

          {/* Temperature Control */}
          <Form.Item
            name="temperature"
            label={t("modelSettings.form.temperature.label")}>
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              placeholder={t("modelSettings.form.temperature.placeholder")}
            />
          </Form.Item>

          {/* Context Window Size */}
          <Form.Item name="numCtx" label={t("modelSettings.form.numCtx.label")}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder={t("modelSettings.form.numCtx.placeholder")}
              size="large"
            />
          </Form.Item>

          {/* Number of Predictions */}
          <Form.Item
            name="numPredict"
            label={t("modelSettings.form.numPredict.label")}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder={t("modelSettings.form.numPredict.placeholder")}
            />
          </Form.Item>

          {/* Advanced Settings Collapse Panel */}
          <Collapse
            ghost
            className="bg-transparent border-none"
            items={[
              {
                key: "1",
                label: t("modelSettings.advanced"),
                children: (
                  <React.Fragment>
                    {/* Top K Sampling */}
                    <Form.Item
                      name="topK"
                      label={t("modelSettings.form.topK.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t("modelSettings.form.topK.placeholder")}
                        size="large"
                      />
                    </Form.Item>

                    {/* Top P Sampling */}
                    <Form.Item
                      name="topP"
                      label={t("modelSettings.form.topP.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        size="large"
                        placeholder={t("modelSettings.form.topP.placeholder")}
                      />
                    </Form.Item>

                    {/* GPU Configuration */}
                    <Form.Item
                      name="numGpu"
                      label={t("modelSettings.form.numGpu.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        size="large"
                        placeholder={t("modelSettings.form.numGpu.placeholder")}
                      />
                    </Form.Item>

                    {/* Minimum Probability Threshold */}
                    <Form.Item
                      name="minP"
                      label={t("modelSettings.form.minP.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t("modelSettings.form.minP.placeholder")}
                      />
                    </Form.Item>

                    {/* Repetition Penalty */}
                    <Form.Item
                      name="repeatPenalty"
                      label={t("modelSettings.form.repeatPenalty.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t(
                          "modelSettings.form.repeatPenalty.placeholder"
                        )}
                      />
                    </Form.Item>

                    {/* Last N Tokens for Repetition */}
                    <Form.Item
                      name="repeatLastN"
                      label={t("modelSettings.form.repeatLastN.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t(
                          "modelSettings.form.repeatLastN.placeholder"
                        )}
                      />
                    </Form.Item>

                    {/* Tail Free Sampling */}
                    <Form.Item
                      name="tfsZ"
                      label={t("modelSettings.form.tfsZ.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t("modelSettings.form.tfsZ.placeholder")}
                      />
                    </Form.Item>

                    {/* Number of Tokens to Keep */}
                    <Form.Item
                      name="numKeep"
                      label={t("modelSettings.form.numKeep.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t(
                          "modelSettings.form.numKeep.placeholder"
                        )}
                      />
                    </Form.Item>

                    {/* Number of Threads */}
                    <Form.Item
                      name="numThread"
                      label={t("modelSettings.form.numThread.label")}>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder={t(
                          "modelSettings.form.numThread.placeholder"
                        )}
                      />
                    </Form.Item>

                    {/* Memory Mapping Toggle */}
                    <Form.Item
                      name="useMMap"
                      label={t("modelSettings.form.useMMap.label")}>
                      <Switch
                        className={form.getFieldValue("useMMap") ? '!bg-indigo-400' : '!bg-gray-600'}
                        size="small"
                      />
                    </Form.Item>

                    {/* Memory Lock Toggle */}
                    <Form.Item
                      name="useMlock"
                      label={t("modelSettings.form.useMlock.label")}>
                      <Switch
                        className={form.getFieldValue("useMlock") ? '!bg-indigo-400' : '!bg-gray-600'}
                        size="small"
                      />
                    </Form.Item>
                  </React.Fragment>
                )
              }
            ]}
          />

          {/* Save Button */}
          <div className="flex justify-end">
            <SaveButton btnType="submit" />
          </div>
        </Form>
      ) : (
        <Skeleton active />
      )}
    </div>
  )
}
