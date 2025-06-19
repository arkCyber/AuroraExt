import { getOllamaURL } from "~/services/ollama"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "antd"
import { cleanUrl } from "@/libs/clean-url"
import { Descriptions } from "antd"
import fetcher from "@/libs/fetcher"
import { motion } from "framer-motion"
import { SunriseIcon } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"

export const setBadgeText = (text: string) => {
  if (chrome?.action?.setBadgeText) {
    chrome.action.setBadgeText({ text })
  }
}

export const setBadgeBackgroundColor = (color: string) => {
  if (chrome?.action?.setBadgeBackgroundColor) {
    chrome.action.setBadgeBackgroundColor({ color })
  }
}

export const setTitle = (title: string) => {
  if (chrome?.action?.setTitle) {
    chrome.action.setTitle({ title })
  }
}

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* AI Circuit Lines */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 8 }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <motion.path
            d="M10,25 L90,25"
            stroke="rgba(251, 146, 60, 0.4)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.path
            d="M50,5 L50,45"
            stroke="rgba(251, 146, 60, 0.4)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </svg>
      </motion.div>

      {/* Web3 Hexagons */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 8 }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <motion.path
            d="M50,5 L90,20 L90,30 L50,45 L10,30 L10,20 Z"
            fill="none"
            stroke="rgba(251, 146, 60, 0.3)"
            strokeWidth="2"
            initial={{ scale: 0.8, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-orange-400 rounded-full"
          initial={{ x: Math.random() * 100, y: -5, opacity: 0 }}
          animate={{
            x: Math.random() * 100,
            y: 55,
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export const AboutApp = () => {
  const { t } = useTranslation("settings")
  const { currentLanguage } = useLanguage()
  const supportedLanguages = ["en", "zh", "zh-TW", "ja", "ko", "ru", "uk", "de", "fr", "it", "es", "pt-BR", "sv", "no", "ar", "ml"]
  const isSupportedLanguage = supportedLanguages.includes(currentLanguage)

  const { data, status } = useQuery({
    queryKey: ["fetchOllamURL"],
    queryFn: async () => {
      const chromeVersion = browser.runtime.getManifest().version
      try {
        const url = await getOllamaURL()
        const req = await fetcher(`${cleanUrl(url)}/api/version`)

        if (!req.ok) {
          return {
            ollama: "N/A",
            chromeVersion
          }
        }

        const res = (await req.json()) as { version: string }
        return {
          ollama: res.version,
          chromeVersion
        }
      } catch {
        return {
          ollama: "N/A",
          chromeVersion
        }
      }
    }
  })

  return (
    <div className="relative flex flex-col min-h-screen space-y-3">
      <AnimatedBackground />
      {status === "pending" && <Skeleton paragraph={{ rows: 4 }} active />}
      {status === "success" && (
        <div className="flex flex-col space-y-4">
          <Descriptions
            title={<span className="text-xl">{t("about.heading")}</span>}
            column={1}
            size="middle"
            items={[
              {
                key: 1,
                label: t("about.chromeVersion"),
                children: data.chromeVersion
              },
              {
                key: 2,
                label: t("about.vision"),
                children: (
                  <div className="font-normal text-gray-700">
                    <p className="text-base leading-relaxed text-left dark:text-stone-400">
                      <div className="flex items-center gap-2 mb-2">
                        <SunriseIcon className="w-6 h-6 text-yellow-500" />
                        {t("about.vision.en")}
                      </div>
                      {t("about.vision.en.description")}
                      <br />
                      <br />
                      <div className="flex items-center gap-2 mb-2">
                        <SunriseIcon className="w-6 h-6 text-yellow-500" />
                        {currentLanguage === "en"
                          ? t("about.vision.zh")
                          : t(`about.vision.${currentLanguage}`)
                        }
                      </div>
                      {currentLanguage === "en"
                        ? t("about.vision.zh.description")
                        : t(`about.vision.${currentLanguage}.description`)
                      }
                    </p>
                  </div>
                )
              },
              {
                key: 3,
                label: t("about.twitter"),
                children: (
                  <a
                    href="https://twitter.com/arksong2025"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 dark:text-blue-400"
                  >
                    @arksong2025
                  </a>
                )
              },
              {
                key: 4,
                label: t("about.contactEmail"),
                children: (
                  <a
                    href="mailto:arksong2025@gmail.com"
                    className="text-blue-500 dark:text-blue-400"
                  >
                    arksong2025@gmail.com
                  </a>
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  )
}
