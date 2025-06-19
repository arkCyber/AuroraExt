import { useTranslation } from "react-i18next"

export const useLanguage = () => {
    const { i18n } = useTranslation()
    const currentLanguage = i18n.language

    return {
        currentLanguage
    }
} 