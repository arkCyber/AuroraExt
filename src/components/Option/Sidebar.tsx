/**
 * Sidebar Component
 * 
 * A component that displays the chat history in a sidebar format.
 * It provides functionality to view, edit, delete, and pin chat histories.
 * The histories are grouped by date (pinned, today, yesterday, last 7 days, older).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  PageAssitDatabase,
  formatToChatHistory,
  formatToMessage,
  deleteByHistoryId,
  updateHistory,
  pinHistory,
  getPromptById
} from "@/db"
import { Empty, Skeleton, Dropdown, Menu, Tooltip, Input } from "antd"
import {
  Trash2,
  MoreVertical,
  PinIcon,
  PinOffIcon,
  BotIcon,
  Search,
  XCircle,
  TimerReset,
  FilePenLine
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  getLastUsedChatModel,
  getLastUsedChatSystemPrompt,
  lastUsedChatModelEnabled
} from "@/services/model-settings"
import { setSidebarOpen } from "@/services/app"
import { useState } from "react"

/**
 * Props interface for the Sidebar component
 * @property {() => void} onClose - Function to close the sidebar
 * @property {(messages: any) => void} setMessages - Function to set chat messages
 * @property {(history: any) => void} setHistory - Function to set chat history
 * @property {(historyId: string) => void} setHistoryId - Function to set current history ID
 * @property {(model: string) => void} setSelectedModel - Function to set selected chat model
 * @property {(prompt: string) => void} setSelectedSystemPrompt - Function to set selected system prompt
 * @property {(prompt: string) => void} setSystemPrompt - Function to set system prompt content
 * @property {() => void} clearChat - Function to clear current chat
 * @property {boolean} temporaryChat - Flag indicating if current chat is temporary
 * @property {string} historyId - Current chat history ID
 * @property {any} history - Current chat history data
 */
type Props = {
  onClose: () => void
  setMessages: (messages: any) => void
  setHistory: (history: any) => void
  setHistoryId: (historyId: string) => void
  setSelectedModel: (model: string) => void
  setSelectedSystemPrompt: (prompt: string) => void
  setSystemPrompt: (prompt: string) => void
  clearChat: () => void
  temporaryChat: boolean
  historyId: string
  history: any
}

export const Sidebar = ({
  onClose,
  setMessages,
  setHistory,
  setHistoryId,
  setSelectedModel,
  setSelectedSystemPrompt,
  clearChat,
  historyId,
  setSystemPrompt,
  temporaryChat
}: Props) => {
  // Initialize translation and navigation hooks
  const { t } = useTranslation(["option", "common"])
  const client = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * Fetch and group chat histories using React Query
   * Groups are organized by: pinned, today, yesterday, last 7 days, and older
   */
  const { data: chatHistories, status } = useQuery({
    queryKey: ["fetchChatHistory"],
    queryFn: async () => {
      const db = new PageAssitDatabase()
      const history = await db.getChatHistories()

      // Calculate date ranges for grouping
      const now = new Date()
      const today = new Date(now.setHours(0, 0, 0, 0))
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      // Group histories by date and pinned status
      const pinnedItems = history.filter((item) => item.is_pinned)
      const todayItems = history.filter(
        (item) => !item.is_pinned && new Date(item?.createdAt) >= today
      )
      const yesterdayItems = history.filter(
        (item) =>
          !item.is_pinned &&
          new Date(item?.createdAt) >= yesterday &&
          new Date(item?.createdAt) < today
      )
      const lastWeekItems = history.filter(
        (item) =>
          !item.is_pinned &&
          new Date(item?.createdAt) >= lastWeek &&
          new Date(item?.createdAt) < yesterday
      )
      const olderItems = history.filter(
        (item) => !item.is_pinned && new Date(item?.createdAt) < lastWeek
      )

      // Create groups array with non-empty categories
      const groups = []
      if (pinnedItems.length) groups.push({ label: "pinned", items: pinnedItems })
      if (todayItems.length) groups.push({ label: "today", items: todayItems })
      if (yesterdayItems.length) groups.push({ label: "yesterday", items: yesterdayItems })
      if (lastWeekItems.length) groups.push({ label: "last7Days", items: lastWeekItems })
      if (olderItems.length) groups.push({ label: "older", items: olderItems })

      return groups
    }
  })

  /**
   * Mutation for deleting chat history
   * Clears current chat if deleted history is currently active
   */
  const { mutate: deleteHistory } = useMutation({
    mutationKey: ["deleteHistory"],
    mutationFn: deleteByHistoryId,
    onSuccess: (history_id) => {
      client.invalidateQueries({
        queryKey: ["fetchChatHistory"]
      })
      if (historyId === history_id) {
        clearChat()
      }
    }
  })

  /**
   * Mutation for editing chat history title
   */
  const { mutate: editHistory } = useMutation({
    mutationKey: ["editHistory"],
    mutationFn: async (data: { id: string; title: string }) => {
      return await updateHistory(data.id, data.title)
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["fetchChatHistory"]
      })
    }
  })

  /**
   * Mutation for pinning/unpinning chat history
   */
  const { mutate: pinChatHistory, isPending: pinLoading } = useMutation({
    mutationKey: ["pinHistory"],
    mutationFn: async (data: { id: string; is_pinned: boolean }) => {
      return await pinHistory(data.id, data.is_pinned)
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["fetchChatHistory"]
      })
    }
  })

  /**
   * Filter chat histories based on search query
   */
  const filterChatHistories = (groups: any[]) => {
    if (!searchQuery.trim()) return groups

    const query = searchQuery.toLowerCase()
    return groups.map(group => ({
      ...group,
      items: group.items.filter((chat: any) =>
        chat.title.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0)
  }

  const handleClose = async () => {
    await setSidebarOpen("right_clk")
    onClose()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header section with search and close button */}
      <div className="flex items-center justify-between">
      </div>

      {/* Search input */}
      <div className="relative mb-2">
        <Input
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          placeholder={t("common:searchHistory")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          allowClear
        />
      </div>

      {/* Main content with scrollbar */}
      <div
        className={`flex-1 overflow-y-auto z-99 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500 bg-white dark:bg-[#1a1717] ${temporaryChat ? "pointer-events-none opacity-50" : ""}`}>
        {/* Empty state when no histories exist */}
        {status === "success" && (!chatHistories || chatHistories.length === 0) && (
          <div className="flex items-center justify-center mt-20 overflow-hidden">
            <Empty description={t("common:noHistory")} />
          </div>
        )}

        {/* Loading state with skeleton */}
        {status === "pending" && (
          <div className="flex items-center justify-center mt-5">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex items-center justify-center">
            <span className="text-red-500">Error loading history</span>
          </div>
        )}

        {/* Chat history groups */}
        {status === "success" && chatHistories && chatHistories.length > 0 && (
          <div className="flex flex-col gap-2">
            {filterChatHistories(chatHistories).map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Group header */}
                <h3 className="px-2 text-sm font-medium text-gray-500">
                  {t(`common:date:${group.label}`)}
                </h3>

                {/* Chat history items */}
                <div className="flex flex-col gap-2 mt-2">
                  {group.items.map((chat, index) => (
                    <div
                      key={index}
                      className="flex py-2 px-2 items-center gap-3 relative rounded-md truncate hover:pr-4 group transition-opacity duration-300 ease-in-out bg-gray-100 dark:bg-[#232222] dark:text-gray-100 text-gray-800 border hover:bg-gray-200 dark:hover:bg-[#2d2d2d] dark:border-gray-800">
                      {/* Copilot indicator */}
                      {chat?.message_source === "copilot" && (
                        <Tooltip title={t("common:sidebarChat")} placement="top">
                          <BotIcon className="text-green-500 size-3" />
                        </Tooltip>
                      )}

                      {/* Chat title button */}
                      <button
                        className="flex-1 w-full overflow-hidden break-all truncate text-start"
                        onClick={async () => {
                          // Load chat history and update state
                          const db = new PageAssitDatabase()
                          const history = await db.getChatHistory(chat.id)
                          setHistoryId(chat.id)
                          setHistory(formatToChatHistory(history))
                          setMessages(formatToMessage(history))

                          // Load last used model if enabled
                          const isLastUsedChatModel = await lastUsedChatModelEnabled()
                          if (isLastUsedChatModel) {
                            const currentChatModel = await getLastUsedChatModel(chat.id)
                            if (currentChatModel) {
                              setSelectedModel(currentChatModel)
                            }
                          }

                          // Load last used prompt
                          const lastUsedPrompt = await getLastUsedChatSystemPrompt(chat.id)
                          if (lastUsedPrompt) {
                            if (lastUsedPrompt.prompt_id) {
                              const prompt = await getPromptById(lastUsedPrompt.prompt_id)
                              if (prompt) {
                                setSelectedSystemPrompt(lastUsedPrompt.prompt_id)
                              }
                            }
                            setSystemPrompt(lastUsedPrompt.prompt_content)
                          }

                          // Navigate to home and close sidebar
                          navigate("/")
                          onClose()
                        }}>
                        <span className="flex-grow truncate">{chat.title}</span>
                      </button>

                      {/* Chat options dropdown */}
                      <div className="flex items-center gap-2">
                        <Dropdown
                          overlay={
                            <Menu>
                              {/* Pin/Unpin option */}
                              <Menu.Item
                                key="pin"
                                icon={
                                  chat.is_pinned ? (
                                    <PinOffIcon className="w-4 h-4" />
                                  ) : (
                                    <PinIcon className="w-4 h-4" />
                                  )
                                }
                                onClick={() =>
                                  pinChatHistory({
                                    id: chat.id,
                                    is_pinned: !chat.is_pinned
                                  })
                                }
                                disabled={pinLoading}>
                                {chat.is_pinned ? t("common:unpin") : t("common:pin")}
                              </Menu.Item>

                              {/* Edit title option */}
                              <Menu.Item
                                key="edit"
                                icon={<FilePenLine className="size-5" />}
                                onClick={() => {
                                  const newTitle = prompt(t("editHistoryTitle"), chat.title)
                                  if (newTitle) {
                                    editHistory({ id: chat.id, title: newTitle })
                                  }
                                }}>
                                {t("common:edit")}
                              </Menu.Item>

                              {/* Delete option */}
                              <Menu.Item
                                key="delete"
                                icon={<Trash2 className="w-4 h-4" />}
                                danger
                                onClick={() => {
                                  if (!confirm(t("deleteHistoryConfirmation"))) return
                                  deleteHistory(chat.id)
                                }}>
                                {t("common:delete")}
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={["click"]}
                          placement="bottomRight">
                          <button className="text-gray-500 dark:text-gray-400 opacity-80 hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
