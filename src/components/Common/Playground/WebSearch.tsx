import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

export const WebSearch = () => {
  const { t } = useTranslation('common')
  return (
    // Container with animated gradient border
    // Uses animated-gradient-border class which applies:
    // 1. A 3px solid border
    // 2. Gradient border animation that cycles through multiple colors
    // 3. 3s infinite animation duration
    // 4. Rounded corners for better visual appeal
    <div className="animated-gradient-border mt-4 flex w-56 items-center gap-4 !rounded-full bg-neutral-100 p-1 text-slate-900 dark:bg-neutral-800 dark:text-slate-50">
      <div className="rounded-full p-1">
        <Globe className="w-6 h-6" />
      </div>
      <div className="text-sm font-semibold">
        {t('webSearch')}
      </div>
    </div>
  )
}
