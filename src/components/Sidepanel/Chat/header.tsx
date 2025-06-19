import logoImage from "~/assets/icon.png"
import { useMessage } from "~/hooks/useMessage"
import { Link } from "react-router-dom"
import { Tooltip, Drawer } from "antd"
import {
  BoxesIcon,
  BrainCog,
  CogIcon,
  EraserIcon,
  HistoryIcon,
  XCircle
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { CurrentChatModelSettings } from "@/components/Common/Settings/CurrentChatModelSettings"
import React from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { PromptSelect } from "@/components/Common/PromptSelect"
import { Sidebar } from "@/components/Option/Sidebar"
export const SidepanelHeader = () => {
  const [hideCurrentChatModelSettings] = useStorage(
    "hideCurrentChatModelSettings",
    false
  )

  const {
    clearChat,
    isEmbedding,
    messages,
    streaming,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    setSelectedQuickPrompt,
    setMessages,
    setHistory,
    setHistoryId,
    setSelectedModel,
    historyId
  } = useMessage()
  const { t } = useTranslation(["sidepanel", "common"])
  const [openModelSettings, setOpenModelSettings] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className=" px-3 justify-between bg-white dark:bg-[#171717] border-b border-gray-300 dark:border-gray-700 py-4 items-center absolute top-0 z-10 flex h-14 w-full shadow-md">
      <div className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-700 dark:text-white">
        <img
          className="w-auto h-6"
          src={logoImage}
          alt={t("common:pageAssist")}
        />
        <span className="ml-1 text-sm ">{t("common:pageAssist")}</span>
      </div>

      <div className="flex items-center space-x-3">
        {isEmbedding ? (
          <Tooltip title={t("tooltip.embed")}>
            <BoxesIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 animate-bounce animate-infinite" />
          </Tooltip>
        ) : null}
        {messages.length > 0 && !streaming && (
          <button
            title={t("tooltip.clear")}
            onClick={() => {
              clearChat()
            }}
            className="flex items-center space-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-700">
            <EraserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
        <button
          title={t("tooltip.close")}
          onClick={() => {
            setSidebarOpen(false)
          }}
          className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-700">
          <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <Tooltip title={t("tooltip.history")}>
          <button
            onClick={() => {
              setSidebarOpen(true)
            }}
            className="flex items-center space-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-700">
            <HistoryIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </Tooltip>
        <PromptSelect
          selectedSystemPrompt={selectedSystemPrompt}
          setSelectedSystemPrompt={setSelectedSystemPrompt}
          setSelectedQuickPrompt={setSelectedQuickPrompt}
          className="text-gray-500 transition-colors dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        />
        {!hideCurrentChatModelSettings && (
          <Tooltip title={t("common:currentChatModelSettings")}>
            <button
              onClick={() => setOpenModelSettings(true)}
              className="text-gray-500 transition-colors dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <BrainCog className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
        <Link to="/settings">
          <CogIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
      </div>
      <CurrentChatModelSettings
        open={openModelSettings}
        setOpen={setOpenModelSettings}
      />

      <Drawer
        title={
          <div className="flex items-center justify-between">
            {t("tooltip.history")}
          </div>
        }
        placement="left"
        closeIcon={null}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}>
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          setMessages={setMessages}
          setHistory={setHistory}
          setHistoryId={setHistoryId}
          setSelectedModel={setSelectedModel}
          setSelectedSystemPrompt={setSelectedSystemPrompt}
          clearChat={clearChat}
          historyId={historyId}
          setSystemPrompt={(e) => { }}
          temporaryChat={false}
          history={history}
        />
      </Drawer>
    </div>
  )
}
