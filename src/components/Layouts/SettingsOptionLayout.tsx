/**
 * SettingsOptionLayout Component
 * 
 * This component provides the layout structure for the Aurora Settings pages.
 * It includes a navigation sidebar with various settings options and a main content area.
 * The layout is responsive and supports both light and dark themes.
 */

import {
  BookIcon,
  FileCog,
  BrainCircuitIcon,
  OrbitIcon,
  ShareIcon,
  BlocksIcon,
  InfoIcon,
  CombineIcon,
  ChromeIcon,
  CpuIcon,
  UserIcon
} from "lucide-react"

import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { OllamaIcon } from "../Icons/Ollama"
import { BetaTag } from "../Common/Beta"

/**
 * Utility function to combine class names conditionally
 * @param classes - Array of class names to combine
 * @returns Combined class names string
 */
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

/**
 * LinkComponent - Renders a navigation link item in the settings sidebar
 * 
 * @param item - Object containing link properties:
 *   - href: The route path
 *   - name: Display text or JSX element
 *   - icon: Lucide icon component
 *   - current: Current active route
 *   - beta: Optional flag to show beta tag
 */
const LinkComponent = (item: {
  href: string
  name: string | JSX.Element
  icon: any
  current: string
  beta?: boolean
}) => {
  return (
    <li
      className="inline-flex items-center border-r border-gray-300 dark:border-gray-600">
      <Link
        to={item.href}
        className={classNames(
          item.current === item.href
            ? "bg-violet-100 text-gray-600 dark:bg-[#262626] dark:text-violet-400"
            : "text-gray-700 hover:text-gray-500 dark:text-gray-300 dark:hover:text-indigo-300",
          "group relative flex gap-x-3 rounded-md py-1.5 pl-2 pr-3 text-sm font-semibold w-full transition-all duration-200"
        )}>
        <div className={classNames(
          "absolute left-0 top-0 h-full w-1 transition-all duration-200",
          item.current === item.href
            ? "bg-violet-500 dark:bg-violet-400"
            : "group-hover:bg-violet-200 dark:group-hover:bg-violet-700"
        )} />

        <div className={classNames(
          "absolute inset-0 rounded-md transition-all duration-200",
          item.current === item.href
            ? "bg-violet-100 dark:bg-gray-700"
            : "group-hover:bg-violet-50 dark:group-hover:bg-gray-700"
        )} style={{ right: '1rem' }} />

        <div className="relative z-10 flex items-center gap-x-3">
          <item.icon
            className={classNames(
              item.current === item.href
                ? "text-gray-600 dark:text-violet-400"
                : "text-gray-500 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-violet-400",
              "h-5 w-5 shrink-0"
            )}
            aria-hidden="true"
          />
          {item.name}
        </div>
      </Link>
      {item.beta && <BetaTag />}
    </li>
  )
}

/**
 * SettingsLayout Component
 * 
 * Main layout wrapper for all settings pages. Provides:
 * - A responsive sidebar navigation
 * - Main content area with proper spacing and scrolling
 * - Dark/light theme support
 * - Internationalization support
 * 
 * @param children - React nodes to be rendered in the main content area
 */
export const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const { t } = useTranslation(["settings", "common", "openai"])
  return (
    // Main container with full width and minimum height
    <div className="flex flex-col w-full min-h-screen mt-10 pt-11 -z-10">
      {/* Settings page title */}
      <div className="pl-24 text-lg font-semibold text-gray-700 dark:text-gray-200">Aurora Setting</div>

      {/* Main content area with proper layout structure */}
      <main className="relative flex-1 w-full">
        <div className="w-full h-full mx-auto overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row lg:gap-x-16 lg:px-24">
            {/* Settings navigation sidebar */}
            <aside className="sticky lg:mt-0 mt-4 top-0 bg-white dark:bg-[#171717] lg:border-0 lg:bg-transparent lg:dark:bg-transparent">
              <nav className="w-full px-4 py-2 overflow-x-auto sm:px-6 lg:px-0 lg:py-0 lg:mt-2">
                <ul
                  role="list"
                  className="flex flex-row lg:flex-col gap-x-3 gap-y-0.5 min-w-max lg:min-w-0">
                  {/* 添加个人设置链接 */}
                  <LinkComponent
                    href="/settings/account"
                    name={t("personalSettings.title")}
                    icon={UserIcon}
                    current={location.pathname}
                  />
                  <LinkComponent
                    href="/settings"
                    name={t("generalSettings.title")}
                    icon={OrbitIcon}
                    current={location.pathname}
                  />
                  <LinkComponent
                    href="/settings/rag"
                    name={t("rag.title")}
                    icon={CombineIcon}
                    current={location.pathname}
                  />
                  <LinkComponent
                    href="/settings/ollama"
                    name={t("ollamaSettings.title")}
                    icon={OllamaIcon}
                    current={location.pathname}
                  />
                  <LinkComponent
                    href="/settings/openai"
                    name={t("openai:settings")}
                    icon={CpuIcon}
                    current={location.pathname}
                    beta
                  />
                  <LinkComponent
                    href="/settings/model"
                    name={t("manageModels.title")}
                    current={location.pathname}
                    icon={BrainCircuitIcon}
                  />
                  <LinkComponent
                    href="/settings/knowledge"
                    name={
                      <div className="inline-flex items-center gap-2">
                        {t("manageKnowledge.title")}
                      </div>
                    }
                    icon={BlocksIcon}
                    current={location.pathname}
                  />
                  <LinkComponent
                    href="/settings/prompt"
                    name={t("managePrompts.title")}
                    icon={FileCog}
                    current={location.pathname}
                  />
                  {/*}
                  <LinkComponent
                    href="/settings/share"
                    name={t("manageShare.title")}
                    icon={ShareIcon}
                    current={location.pathname}
                  />  
                  */}

                  <LinkComponent
                    href="/settings/about"
                    name={t("about.title")}
                    icon={InfoIcon}
                    current={location.pathname}
                  />
                </ul>
              </nav>
            </aside>

            {/* Main content area for settings pages */}
            <main className="flex-1 px-4 pt-4 sm:px-6 lg:px-0 lg:pt-2">
              <div className="max-w-4xl pr-8 mx-auto space-y-8 sm:space-y-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </main>
    </div>
  )
}
