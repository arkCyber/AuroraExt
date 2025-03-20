import { cleanUrl } from "@/libs/clean-url"
import { useStorage } from "@plasmohq/storage/hook"
import { useQuery } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import {
  getOllamaURL,
  isOllamaRunning,
  setOllamaURL as saveOllamaURL
} from "~/services/ollama"

export const PlaygroundEmpty = () => {
  const [ollamaURL, setOllamaURL] = useState<string>("")
  const { t } = useTranslation(["playground", "common"])

  const [checkOllamaStatus] = useStorage("checkOllamaStatus", true)

  const {
    data: ollamaInfo,
    status: ollamaStatus,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["ollamaStatus"],
    queryFn: async () => {
      const ollamaURL = await getOllamaURL()
      const isOk = await isOllamaRunning()

      if (ollamaURL) {
        saveOllamaURL(ollamaURL)
      }

      return {
        isOk,
        ollamaURL
      }
    },
    enabled: checkOllamaStatus
  })

  useEffect(() => {
    if (ollamaInfo?.ollamaURL) {
      setOllamaURL(ollamaInfo.ollamaURL)
    }
  }, [ollamaInfo])


  if (!checkOllamaStatus) {
    return (
      <div className="px-4 mx-auto mt-10 sm:max-w-xl">
        <div className="rounded-lg justify-center items-center flex flex-col border p-8 bg-gray-100 dark:bg-[#262626] dark:border-gray-600">
          <h1 className="flex items-center justify-center gap-3 text-sm font-medium text-center text-gray-400 dark:text-gray-400">
            <span >👋</span>
            <span className="text-gray-700 dark:text-gray-300">
              {t("welcome")}
            </span>
          </h1>
        </div>
      </div>
    )
  }
  return (
    <div className="px-4 mx-auto mt-10 sm:max-w-xl">
      <div className="rounded-lg justify-center items-center flex flex-col border p-8 bg-gray-50 dark:bg-[#262626]  dark:border-gray-500 border-gray-500 shadow-lg drop-shadow-[6px_6px_6px_rgba(0,0,0,0.1)] dark:drop-shadow-[8px_8px_8px_rgba(100,149,237,0.4)]">
        {(ollamaStatus === "pending" || isRefetching) && (
          <div className="inline-flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-gray-900 dark:text-gray-400">

              {t("ollamaState.searching")}
            </p>
          </div>
        )}
        {!isRefetching && ollamaStatus === "success" ? (
          ollamaInfo.isOk ? (
            <div className="flex flex-col items-center justify-center mt-4">
              <div className="inline-flex items-center space-x-2">

                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-900 dark:text-gray-400">
                  Ollama is running ……
                </p>
              </div>

              <div className="flex items-center py-2 text-lg text-gray-700 dark:text-gray-300">
                <span className="inline-block animate-wave">👋</span>
                <div className="relative inline-block ml-1 min-w-[300px] flex items-center">
                  <span className="inline-block overflow-hidden whitespace-nowrap animate-typewriter">Welcome to Aurora Agent World!</span>
                  <span className="inline-block w-[2px] h-[1em] bg-current ml-1 animate-blink"></span>
                </div>
              </div>
              <div className="mt-2 text-base leading-relaxed text-gray-600 font-extralight dark:text-gray-400">Aurora will bring you into AI+ Web3 next-generation network!</div>
              <div className="text-base leading-relaxed text-gray-600 dark:text-gray-400 dark:font-extralight">Aurora启蒙老师引领你迈入AI+ Web3网络时代，放飞人生的梦想!</div>
              <div className="mt-2 text-base leading-relaxed tracking-wider text-gray-600 font-extralight animate-pulse dark:text-gray-300">✨✨✨✨⭐️⭐️⭐️💫💫💫</div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="inline-flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-gray-900 dark:text-gray-400">
                  {t("ollamaState.notRunning")}
                </p>
              </div>

              <input
                className="bg-gray-100 dark:bg-[#262626] dark:text-gray-100 rounded-md px-4 py-2 mt-2 w-full"
                type="url"
                value={ollamaURL}
                onChange={(e) => setOllamaURL(e.target.value)}
              />

              <button
                onClick={() => {
                  saveOllamaURL(ollamaURL)
                  refetch()
                }}
                className="inline-flex items-center px-2 py-2 mt-4 text-sm font-medium leading-4 text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-white dark:text-gray-800 dark:hover:bg-gray-100 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-100 disabled:opacity-50 ">
                <RotateCcw className="w-4 h-4 mr-3" />
                {t("common:retry")}
              </button>

              {ollamaURL &&
                cleanUrl(ollamaURL) !== "http://127.0.0.1:11434" && (
                  <p className="mb-4 text-xs text-center text-gray-500 dark:text-gray-400">
                    <Trans
                      i18nKey="playground:ollamaState.connectionError"
                      components={{
                        anchor: (
                          <a
                            href="https://github.com/n4ze3m/page-assist/blob/main/docs/connection-issue.md"
                            target="__blank"
                            className="text-blue-600 dark:text-blue-400"></a>
                        )
                      }}
                    />
                  </p>
                )}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}