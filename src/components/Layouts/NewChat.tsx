import { MoreHorizontal, TimerReset, MessageCircleMore, FileSpreadsheet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Dropdown, Switch } from "antd"
import type { MenuProps } from "antd"
import { useMessageOption } from "@/hooks/useMessageOption"

type Props = {
  clearChat: () => void
}

export const NewChat: React.FC<Props> = ({ clearChat }) => {
  const { t } = useTranslation(["option", "common"])

  const { temporaryChat, setTemporaryChat, messages } = useMessageOption()

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
          <Switch
            className={temporaryChat ? '!bg-indigo-500' : '!bg-gray-600'}

            size="small"
            checked={temporaryChat}
            onChange={(checked) => {
              setTemporaryChat(checked)
              // just like chatgpt
              if (messages.length > 0) {
                clearChat()
              }
            }}
          />
        </label>
      )
    }
  ]
  return (
    <div className="flex items-center justify-between py-2.5">
      <button
        onClick={clearChat}   // new Chat action ....
        className="inline-flex items-center px-3 py-1 text-xs font-medium leading-4 text-gray-600 transition-colors duration-200 ease-in-out bg-transparent bg-white border border-gray-400 dark:text-gray-400 dark:bg-transparent rounded-s-lg rounded-e-none dark:border-gray-400 pe-2 lg:text-sm dark:text-white disabled:opacity-50 hover:bg-violet-100 dark:hover:border-orange-300 dark:hover:bg-gray-500 dark:hover:text-white">
        <MessageCircleMore className="w-5 h-5" />
        <span className="truncate ms-3.2 items-start px-1">{t("newChat")}</span>
      </button>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <button className="inline-flex items-center px-3 py-1 text-xs font-medium leading-4 text-gray-400 transition-colors duration-200 ease-in-out bg-transparent bg-white border border-gray-400 rounded-lg dark:bg-transparent border-s-0 rounded-s-none dark:border-gray-400 lg:text-sm dark:text-white disabled:opacity-50 hover:bg-violet-100 dark:hover:border-orange-300 dark:hover:bg-gray-500 dark:hover:text-white">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100" />
        </button>


      </Dropdown>
    </div>
  )
}