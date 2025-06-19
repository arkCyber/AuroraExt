/**
 * WebSearch Component
 * 
 * A simple loading indicator component that displays a pulsing search icon
 * and "searching" text. This component is typically used to indicate that
 * a web search operation is in progress.
 */

import React from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

export const WebSearch = () => {
    // Get the translation function from i18n
    const { t } = useTranslation("common")

    return (
        // Container div with oval box shape, flex layout and styling
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400 bg-gray-100 dark:bg-stone-800 px-4 py-1.5 rounded-[20px] border border-gray-200 dark:border-stone-700">
            {/* Search icon with pulsing animation */}
            <Search className="w-3.5 h-3.5 animate-pulse" />
            {/* Translated "searching" text */}
            <span>{t("searching")}</span>
        </div>
    )
} 