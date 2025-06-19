/**
 * GeneralSettings Component
 * 
 * A comprehensive settings panel that allows users to configure various aspects of the application,
 * including language preferences, chat behavior, UI settings, and system operations.
 * Uses React Query for state management and Ant Design components for the UI.
 */

import { useQueryClient } from "@tanstack/react-query"
import { useDarkMode } from "~/hooks/useDarkmode"
import { useMessageOption } from "~/hooks/useMessageOption"
import { PageAssitDatabase } from "@/db"
import { Select, Switch, Button } from "antd"
import { SUPPORTED_LANGUAGES } from "~/utils/supported-languages"
import { MoonIcon, SunIcon, DatabaseIcon } from "lucide-react"
import { SearchModeSettings } from "./search-mode"
import { useTranslation } from "react-i18next"
import { useI18n } from "@/hooks/useI18n"
import { TTSModeSettings } from "./tts-mode"
import {
  exportPageAssistData,
  importPageAssistData
} from "@/libs/export-import"
import { useStorage } from "@plasmohq/storage/hook"
import { useNavigate } from "react-router-dom"

export const GeneralSettings = () => {
  // Initialize hooks for various settings using persistent storage
  const { clearChat } = useMessageOption()
  const [userChatBubble, setUserChatBubble] = useStorage("userChatBubble", true)

  // Speech and language settings
  const [speechToTextLanguage, setSpeechToTextLanguage] = useStorage(
    "speechToTextLanguage",
    "en-US"
  )

  // Chat behavior settings
  const [copilotResumeLastChat, setCopilotResumeLastChat] = useStorage(
    "copilotResumeLastChat",
    false
  )
  const [webUIResumeLastChat, setWebUIResumeLastChat] = useStorage(
    "webUIResumeLastChat",
    false
  )
  const [defaultChatWithWebsite, setDefaultChatWithWebsite] = useStorage(
    "defaultChatWithWebsite",
    false
  )
  const [restoreLastChatModel, setRestoreLastChatModel] = useStorage(
    "restoreLastChatModel",
    false
  )

  // UI and notification settings
  const [generateTitle, setGenerateTitle] = useStorage("titleGenEnabled", false)
  const [hideCurrentChatModelSettings, setHideCurrentChatModelSettings] =
    useStorage("hideCurrentChatModelSettings", false)
  const [sendNotificationAfterIndexing, setSendNotificationAfterIndexing] =
    useStorage("sendNotificationAfterIndexing", false)
  const [checkOllamaStatus, setCheckOllamaStatus] = useStorage(
    "checkOllamaStatus",
    true
  )
  const [checkWideMode, setCheckWideMode] = useStorage("checkWideMode", false)
  const [openReasoning, setOpenReasoning] = useStorage("openReasoning", false)

  // Initialize utility hooks
  const queryClient = useQueryClient()
  const { mode, toggleDarkMode } = useDarkMode()
  const { t } = useTranslation("settings")
  const { changeLocale, locale, supportLanguage } = useI18n()
  const navigate = useNavigate()

  return (
    <dl className="flex flex-col space-y-2 text-sm">
      {/* General Settings Header */}
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
          {t("generalSettings.title")}
        </h2>
        <div className="mt-3 border border-b border-gray-200 dark:border-gray-600"></div>
      </div>

      {/* Speech Recognition Language Selection */}
      <div className="flex flex-row justify-between">
        <span className="text-gray-700 dark:text-neutral-50">
          {t("generalSettings.settings.speechRecognitionLang.label")}
        </span>

        <Select
          placeholder={t(
            "generalSettings.settings.speechRecognitionLang.placeholder"
          )}
          allowClear
          showSearch
          options={SUPPORTED_LANGUAGES}
          value={speechToTextLanguage}
          filterOption={(input, option) =>
            option!.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
            option!.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onChange={(value) => {
            setSpeechToTextLanguage(value)
          }}
        />
      </div>

      {/* Application Language Selection */}
      <div className="flex flex-row justify-between">
        <span className="text-gray-700 dark:text-neutral-50">
          {t("generalSettings.settings.language.label")}
        </span>

        <Select
          placeholder={t("generalSettings.settings.language.placeholder")}
          allowClear
          showSearch
          style={{ width: "200px" }}
          className="[&_.ant-select-selection-placeholder]:text-[15px]"
          options={supportLanguage.map(lang => ({
            value: lang.value,
            label: t(`languages.${lang.value}`, lang.label)
          }))}
          value={locale}
          filterOption={(input, option) =>
            (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
          }
          onChange={(value) => {
            if (value) {
              changeLocale(value)
            }
          }}
        />
      </div>

      {/* Chat Behavior Settings */}
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.copilotResumeLastChat.label")}
          </span>
        </div>
        <Switch
          className={copilotResumeLastChat ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={copilotResumeLastChat}
          onChange={(checked) => setCopilotResumeLastChat(checked)}
        />
      </div>
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.turnOnChatWithWebsite.label")}
          </span>
        </div>
        <Switch
          className={defaultChatWithWebsite ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={defaultChatWithWebsite}
          onChange={(checked) => setDefaultChatWithWebsite(checked)}
        />
      </div>
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.webUIResumeLastChat.label")}
          </span>
        </div>
        <Switch
          className={webUIResumeLastChat ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={webUIResumeLastChat}
          onChange={(checked) => setWebUIResumeLastChat(checked)}
        />
      </div>
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.hideCurrentChatModelSettings.label")}
          </span>
        </div>

        <Switch
          className={hideCurrentChatModelSettings ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={hideCurrentChatModelSettings}
          onChange={(checked) => setHideCurrentChatModelSettings(checked)}
        />
      </div>
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.restoreLastChatModel.label")}
          </span>
        </div>

        <Switch
          className={restoreLastChatModel ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={restoreLastChatModel}
          onChange={(checked) => setRestoreLastChatModel(checked)}
        />
      </div>

      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.sendNotificationAfterIndexing.label")}
          </span>
        </div>

        <Switch
          className={sendNotificationAfterIndexing ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={sendNotificationAfterIndexing}
          onChange={setSendNotificationAfterIndexing}
        />
      </div>

      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.generateTitle.label")}
          </span>
        </div>

        <Switch
          className={generateTitle ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={generateTitle}
          onChange={(checked) => setGenerateTitle(checked)}
        />
      </div>

      {/* System Settings */}
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.ollamaStatus.label")}
          </span>
        </div>

        <Switch
          className={checkOllamaStatus ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={checkOllamaStatus}
          onChange={(checked) => setCheckOllamaStatus(checked)}
        />
      </div>

      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.wideMode.label")}
          </span>
        </div>

        <Switch
          className={checkWideMode ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={checkWideMode}
          onChange={(checked) => setCheckWideMode(checked)}
        />
      </div>

      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.openReasoning.label")}
          </span>
        </div>

        <Switch
          className={openReasoning ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={openReasoning}
          onChange={(checked) => setOpenReasoning(checked)}
        />
      </div>

      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            {t("generalSettings.settings.userChatBubble.label")}
          </span>
        </div>

        <Switch
          className={userChatBubble ? '!bg-indigo-500' : '!bg-gray-600'}
          size="small"
          checked={userChatBubble}
          onChange={(checked) => setUserChatBubble(checked)}
        />
      </div>

      {/* Dark Mode Toggle */}
      <div className="flex flex-row justify-between">
        <span className="text-gray-700 dark:text-neutral-50 ">
          {t("generalSettings.settings.darkMode.label")}
        </span>

        <button
          onClick={toggleDarkMode}
          className={`inline-flex mt-4 items-center rounded-md border border-transparent bg-black px-2 py-1 text-sm font-medium leading-4 text-white shadow-sm  dark:text-gray-800 dark:!bg-indigo-300 disabled:opacity-50 `}>
          {mode === "dark" ? (
            <SunIcon className="w-4 h-4 mr-2" />
          ) : (
            <MoonIcon className="w-4 h-4 mr-2" />
          )}
          {mode === "dark"
            ? t("generalSettings.settings.darkMode.options.light")
            : t("generalSettings.settings.darkMode.options.dark")}
        </button>
      </div>

      {/* Additional Settings Components */}
      <SearchModeSettings />
      <TTSModeSettings />

      {/* System Operations Section */}
      <div>
        <div className="mb-5">
          <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
            {t("generalSettings.system.heading")}
          </h2>
          <div className="mt-3 border border-b border-gray-200 dark:border-gray-600"></div>
        </div>

        {/* Export Settings */}
        <div className="flex flex-row justify-between mb-3">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.system.export.label")}
          </span>
          <button
            onClick={exportPageAssistData}
            className="px-4 py-1 text-white bg-gray-800 rounded-md cursor-pointer dark:!bg-indigo-300 dark:text-gray-900">
            {t("generalSettings.system.export.button")}
          </button>
        </div>

        {/* Import Settings */}
        <div className="flex flex-row justify-between mb-3">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.system.import.label")}
          </span>
          <label
            htmlFor="import"
            className="px-4 py-1 text-white bg-gray-800 rounded-md cursor-pointer dark:!bg-indigo-300 dark:text-gray-900">
            {t("generalSettings.system.import.button")}
          </label>
          <input
            type="file"
            accept=".json"
            id="import"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                importPageAssistData(e.target.files[0])
              }
            }}
          />
        </div>

        {/* Clear Chat History */}
        <div className="flex flex-row justify-between mb-3">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.system.deleteChatHistory.label")}
          </span>

          <button
            onClick={async () => {
              const confirm = window.confirm(
                t("generalSettings.system.deleteChatHistory.confirm")
              )

              if (confirm) {
                // Clear database
                const db = new PageAssitDatabase()
                await db.deleteAllChatHistory()

                // Invalidate queries and clear chat state
                queryClient.invalidateQueries({
                  queryKey: ["fetchChatHistory"]
                })
                clearChat()

                // Clear browser storage
                try {
                  await browser.storage.sync.clear()
                  await browser.storage.local.clear()
                  await browser.storage.session.clear()
                } catch (e) {
                  console.error("Error clearing storage:", e)
                }
              }
            }}
            className="px-4 py-1 text-white bg-red-500 rounded-md cursor-pointer dark:!bg-red-600 dark:text-gray-200">
            {t("generalSettings.system.deleteChatHistory.button")}
          </button>
        </div>
      </div>

      {/* Database Settings */}
      {/* Database Settings - Currently disabled
      <div className="flex flex-row justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-700 dark:text-neutral-50">
            数据库设置
          </span>
          <DatabaseIcon className="w-4 h-4" />
        </div>
        <Button
          type="link" 
          onClick={() => navigate("/settings/database")}
          className="text-indigo-500 hover:text-indigo-600"
        >
          管理数据库
        </Button>
      </div>
      */}
    </dl>
  )
}
