import React from "react"
import { useTranslation } from "react-i18next"

type Props = {
    generationInfo: {
        model?: string
        tokens?: number
        time?: number
        temperature?: number
    }
}

export const GenerationInfo = ({ generationInfo }: Props) => {
    const { t } = useTranslation("common")

    return (
        <div className="flex flex-col gap-1.5 text-xs">
            {generationInfo.model && (
                <div className="flex justify-between">
                    <span className="text-gray-500">{t("model")}:</span>
                    <span>{generationInfo.model}</span>
                </div>
            )}
            {generationInfo.tokens && (
                <div className="flex justify-between">
                    <span className="text-gray-500">{t("tokens")}:</span>
                    <span>{generationInfo.tokens}</span>
                </div>
            )}
            {generationInfo.time && (
                <div className="flex justify-between">
                    <span className="text-gray-500">{t("time")}:</span>
                    <span>{generationInfo.time}ms</span>
                </div>
            )}
            {generationInfo.temperature && (
                <div className="flex justify-between">
                    <span className="text-gray-500">{t("temperature")}:</span>
                    <span>{generationInfo.temperature}</span>
                </div>
            )}
        </div>
    )
} 