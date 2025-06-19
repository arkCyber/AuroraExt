import { supportLanguage } from "@/i18n/support-language"
import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

export const useI18n = () => {
  const { i18n, t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("i18nextLng") || "en"
  })
  const [isLanguageChanging, setIsLanguageChanging] = useState(false)
  const lastLanguageChange = useRef<string | null>(null)

  // Effect to sync with i18n language changes
  useEffect(() => {
    const handleLanguageChanged = async (lng: string) => {
      if (lng !== currentLanguage) {
        try {
          setCurrentLanguage(lng)
          localStorage.setItem("i18nextLng", lng)
          setIsLanguageChanging(false)
          lastLanguageChange.current = lng
        } catch (error) {
          console.error('Failed to change language:', error)
          setIsLanguageChanging(false)
          lastLanguageChange.current = null
        }
      }
    }

    // Set initial language
    if (i18n.language && i18n.language !== currentLanguage) {
      handleLanguageChanged(i18n.language)
    }

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n, currentLanguage])

  const changeLanguage = useCallback(async (lng: string) => {
    if (lng === currentLanguage || lng === lastLanguageChange.current) {
      return
    }

    try {
      setIsLanguageChanging(true)
      lastLanguageChange.current = lng

      // Update i18n first
      await i18n.changeLanguage(lng)

      // Then update local state
      setCurrentLanguage(lng)
      localStorage.setItem("i18nextLng", lng)

    } catch (error) {
      console.error('Error changing language:', error)
      setIsLanguageChanging(false)
      lastLanguageChange.current = null
      throw error
    }
  }, [i18n, currentLanguage])

  return {
    currentLanguage,
    changeLanguage,
    supportLanguage,
    isLanguageChanging,
    locale: currentLanguage,
    changeLocale: changeLanguage,
    t
  }
}
