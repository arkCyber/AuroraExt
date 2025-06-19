/**
 * Main layout component that provides the application's base structure.
 * Includes a sidebar, header, and model settings drawer.
 */

import React, { useState } from "react"

import { Sidebar } from "../Option/Sidebar"
import { Drawer, Tooltip } from "antd"

import { useTranslation } from "react-i18next"

import { CurrentChatModelSettings } from "../Common/Settings/CurrentChatModelSettings"
import { Header } from "./Header"
import { EraserIcon } from "lucide-react"
import { PageAssitDatabase } from "@/db"
import { useMessageOption } from "@/hooks/useMessageOption"
import { useQueryClient } from "@tanstack/react-query"
import { useStoreChatModelSettings } from "@/store/model"

/**
 * OptionLayout Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered within the layout
 * @returns {JSX.Element} The layout component with sidebar, header, and content area
 */
export default function OptionLayout({
  children
}: {
  children: React.ReactNode
}) {
  // State for controlling sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Translations hook for multiple namespaces
  const { t } = useTranslation(["option", "common", "settings"])

  // State for controlling model settings drawer visibility
  const [openModelSettings, setOpenModelSettings] = useState(false)

  // Custom hook for managing chat messages and options
  const {
    setMessages,
    setHistory,
    setHistoryId,
    historyId,
    clearChat,
    setSelectedModel,
    temporaryChat,
    setSelectedSystemPrompt
  } = useMessageOption()

  // React Query client for cache management
  const queryClient = useQueryClient()

  // Hook for managing system prompt settings
  const { setSystemPrompt } = useStoreChatModelSettings()

  return (
    <div className="flex w-full h-full">
      <main className="relative w-full h-dvh">
        {/* Header section with z-index to stay on top */}
        <div className="relative z-10 w-full">
          <Header
            setSidebarOpen={setSidebarOpen}
            setOpenModelSettings={setOpenModelSettings}
          />
        </div>

        {/* Main content area */}
        {children}

        {/* Sidebar drawer component */}
        <Drawer
          title={
            <div className="flex items-center justify-between">
              {t("sidebarTitle")}

              {/* Clear chat history button with tooltip */}
              <Tooltip
                title={t(
                  "settings:generalSettings.system.deleteChatHistory.label"
                )}
                placement="right">
                <button
                  onClick={async () => {
                    // Confirmation dialog before deleting chat history
                    const confirm = window.confirm(
                      t(
                        "settings:generalSettings.system.deleteChatHistory.confirm"
                      )
                    )

                    if (confirm) {
                      // Delete all chat history from database and update UI
                      const db = new PageAssitDatabase()
                      await db.deleteAllChatHistory()
                      await queryClient.invalidateQueries({
                        queryKey: ["fetchChatHistory"]
                      })
                      clearChat()
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <EraserIcon className="size-5" />
                </button>
              </Tooltip>
            </div>
          }
          placement="left"
          closeIcon={null}
          onClose={() => setSidebarOpen(false)}
          open={sidebarOpen}>
          {/* Sidebar content with chat management props */}
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            setMessages={setMessages}
            setHistory={setHistory}
            setHistoryId={setHistoryId}
            setSelectedModel={setSelectedModel}
            setSelectedSystemPrompt={setSelectedSystemPrompt}
            clearChat={clearChat}
            historyId={historyId}
            setSystemPrompt={setSystemPrompt}
            temporaryChat={temporaryChat}
            history={history}
          />
        </Drawer>

        {/* Model settings drawer component */}
        <CurrentChatModelSettings
          open={openModelSettings}
          setOpen={setOpenModelSettings}
          useDrawer
        />
      </main>
    </div>
  )
}
