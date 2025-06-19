/**
 * NewChat Component
 * A component that provides controls for starting a new chat and managing temporary chat settings.
 * Includes a "New Chat" button and a dropdown menu with additional options.
 */

import { MoreHorizontal, TimerReset, MessageCircleMore, FileSpreadsheet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Dropdown, Switch } from "antd"
import type { MenuProps } from "antd"
import { useMessageOption } from "@/hooks/useMessageOption"
import { useStorage } from "@plasmohq/storage/hook"
import { ApplicationSelect } from "../Common/ApplicationSelect"
import { useState } from "react"

/**
 * Props interface for the NewChat component
 * @property {() => void} clearChat - Function to clear the current chat history
 * @property {(open: boolean) => void} setSidebarOpen - Function to control sidebar visibility
 */
type Props = {
  clearChat: () => void
  setSidebarOpen: (open: boolean) => void
}

export const NewChat: React.FC<Props> = ({ clearChat, setSidebarOpen }) => {
  // Initialize translation hook for internationalization
  const { t } = useTranslation(["option", "common"])

  // Get temporary chat state and messages from the message options hook
  const { temporaryChat, setTemporaryChat, messages, streaming, historyId, setSelectedSystemPrompt } = useMessageOption()

  // Get share mode state from storage
  const [shareModeEnabled] = useStorage("shareMode", false)

  // State for application select modal
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  /**
   * Dropdown menu items configuration
   * Currently includes a toggle for temporary chat mode and history options
   */
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <label className="flex items-center gap-6 justify-between px-1 py-0.5 cursor-pointer w-full">
          <div className="flex items-center gap-2">
            <TimerReset className="w-4 h-4 text-gray-450" />
            <span>
              {t("temporaryChat")}
            </span>
          </div>
          {/* Toggle switch for temporary chat mode */}
          <Switch
            className={temporaryChat ? '!bg-indigo-500 dark:!bg-indigo-500' : '!bg-gray-600'}
            size="small"
            checked={temporaryChat}
            onChange={(checked) => {
              setTemporaryChat(checked)
              // Clear chat history when enabling temporary chat mode
              if (messages.length > 0) {
                clearChat()
              }
            }}
          />
        </label>
      )
    },
    {
      key: "2",
      label: (
        <div className="flex items-center gap-2 px-1 py-0.5">
          <FileSpreadsheet className="w-4 h-4 text-gray-450" />
          <span>{t("ChatHistory")}</span>
        </div>
      ),
      onClick: () => {
        // Open sidebar when clicking history option
        setSidebarOpen(true)
      }
    }
  ]

  // Handle prompt selection
  const handlePromptSelect = (promptId: string) => {
    setSelectedSystemPrompt(promptId);
    clearChat();
    setIsSelectOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between py-2.5">
        {/* New Chat button */}
        <button
          onClick={() => setIsSelectOpen(true)}
          className="inline-flex items-center px-3 py-1 text-xs font-medium leading-4 text-gray-600 transition-colors duration-200 ease-in-out bg-transparent bg-white border border-gray-400 dark:text-gray-400 dark:bg-transparent rounded-s-lg rounded-e-none dark:border-gray-400 pe-2 lg:text-sm dark:text-white disabled:opacity-50 hover:bg-violet-100 dark:hover:border-orange-300 dark:hover:bg-gray-500 dark:hover:text-white">
          <MessageCircleMore className="w-5 h-5" />
          <span className="truncate ms-3.2 items-start px-1">{t("newChat")}</span>
        </button>

        {/* Options dropdown menu */}
        <Dropdown menu={{ items }} trigger={["click", "hover"]}>
          <button className="inline-flex items-center px-3 py-1 text-xs font-medium leading-4 text-gray-400 transition-colors duration-200 ease-in-out bg-transparent bg-white border border-gray-400 rounded-lg dark:bg-transparent border-s-0 rounded-s-none dark:border-gray-400 lg:text-sm dark:text-white disabled:opacity-50 hover:bg-violet-100 dark:hover:border-orange-300 dark:hover:bg-gray-500 dark:hover:text-white">
            <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100" />
          </button>
        </Dropdown>
      </div>

      {/* Application Selection Modal */}
      <ApplicationSelect
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onJustStart={() => {
          clearChat();
          setIsSelectOpen(false);
        }}
        onSelectPrompt={handlePromptSelect}
      />

      {/* Custom styles for dropdown menu */}
      <style>
        {`
          /* Light mode styles */
          .ant-dropdown-menu {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          /* Dark mode styles */
          .dark .ant-dropdown-menu {
            background-color: #1a1717;
            border: 1px solid #333;
          }

          /* Scrollbar styles for both modes */
          .ant-dropdown-menu::-webkit-scrollbar {
            width: 6px;
          }

          .ant-dropdown-menu::-webkit-scrollbar-track {
            background: transparent;
          }

          .ant-dropdown-menu::-webkit-scrollbar-thumb {
            background-color: #888;
            border-radius: 3px;
          }

          .dark .ant-dropdown-menu::-webkit-scrollbar-thumb {
            background-color: #444;
          }

          /* Menu item hover styles */
          .ant-dropdown-menu-item:hover {
            background-color: #f5f5f5;
          }

          .dark .ant-dropdown-menu-item:hover {
            background-color: #333;
          }

          /* Menu item active styles */
          .ant-dropdown-menu-item-active {
            background-color: #e6f7ff;
          }

          .dark .ant-dropdown-menu-item-active {
            background-color: #2a2a2a;
          }

          /* Chat History specific styles */
          .ant-dropdown-menu-item[data-menu-id="2"] {
            color: #666;
          }

          .dark .ant-dropdown-menu-item[data-menu-id="2"] {
            color: #999;
          }

          .ant-dropdown-menu-item[data-menu-id="2"]:hover {
            color: #333;
          }

          .dark .ant-dropdown-menu-item[data-menu-id="2"]:hover {
            color: #fff;
          }

          /* Chat History icon styles */
          .ant-dropdown-menu-item[data-menu-id="2"] .w-4 {
            color: #666;
          }

          .dark .ant-dropdown-menu-item[data-menu-id="2"] .w-4 {
            color: #999;
          }

          .ant-dropdown-menu-item[data-menu-id="2"]:hover .w-4 {
            color: #333;
          }

          .dark .ant-dropdown-menu-item[data-menu-id="2"]:hover .w-4 {
            color: #fff;
          }
        `}
      </style>
    </>
  )
}