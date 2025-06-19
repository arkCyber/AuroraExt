/**
 * CodeBlock Component
 * A reusable component for displaying code snippets with syntax highlighting and additional features
 * like copying to clipboard and downloading the code.
 */

import { programmingLanguages } from "@/utils/langauge-extension"
import { Tooltip, Modal } from "antd"
import { CheckIcon, Copy, ClipboardIcon, DownloadIcon } from "lucide-react"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

/**
 * Props interface for the CodeBlock component
 * @property {string} language - The programming language for syntax highlighting
 * @property {string} value - The actual code content to display
 */
interface Props {
  language: string
  value: string
}

/**
 * CodeBlock Component
 * Renders a code block with syntax highlighting, copy to clipboard functionality,
 * and download capability. Uses react-syntax-highlighter for code formatting.
 */
export const CodeBlock: FC<Props> = ({ language, value }) => {
  // State for managing copy button feedback
  const [isBtnPressed, setIsBtnPressed] = useState(false)
  // State for controlling the preview modal visibility
  const [previewVisible, setPreviewVisible] = useState(false)
  const { t } = useTranslation("common")

  /**
   * Handles copying the code content to clipboard
   * Shows a visual feedback (checkmark) for 4 seconds after successful copy
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setIsBtnPressed(true)
    setTimeout(() => {
      setIsBtnPressed(false)
    }, 4000)
  }

  /**
   * Closes the preview modal
   */
  const handlePreviewClose = () => {
    setPreviewVisible(false)
  }

  /**
   * Handles downloading the code content as a file
   * Creates a blob with the code content and triggers a download
   * Filename includes timestamp and appropriate file extension based on language
   */
  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code_${new Date().toISOString().replace(/[:.]/g, "-")}.${programmingLanguages[language] || language}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="not-prose">
        {/* Main code block container with dark theme */}
        <div className=" [&_div+div]:!mt-0 my-4 bg-zinc-950 rounded-xl">
          {/* Language indicator header */}
          <div className="flex flex-row px-4 py-2 bg-gray-700 rounded-t-xl ">
            <span className="font-mono text-sm text-violet-300 dark:text-grey-400">{language || "text"}</span>
          </div>
          {/* Action buttons container (sticky positioned) */}
          <div className="sticky top-9 md:top-[5.75rem]">
            <div className="absolute bottom-0 flex items-center right-2 h-9">
              {/* Download button with tooltip */}
              <Tooltip title={t("downloadCode")}>
                <button
                  onClick={handleDownload}
                  className="flex gap-1.5 items-center rounded bg-grey-600 p-1 text-xs text-gray-200 hover:bg-indigo-500 hover:text-violet-200 focus:outline-none">
                  <DownloadIcon className="size-4" />
                </button>
              </Tooltip>
              {/* Copy button with tooltip and success feedback */}
              <Tooltip title={t("copyToClipboard")}>
                <button
                  onClick={handleCopy}
                  className="flex gap-1.5 items-center rounded bg-grey-600 p-1 text-xs text-gray-200 hover:bg-indigo-500 hover:text-violet-200 focus:outline-none">
                  {!isBtnPressed ? (
                    <Copy className="size-4" />
                  ) : (
                    <CheckIcon className="text-green-400 size-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Syntax highlighter component for code display */}
          <SyntaxHighlighter
            language={language}
            style={coldarkDark}
            PreTag="div"
            customStyle={{
              margin: 0,
              width: "100%",
              background: "transparent",
              padding: "1.5rem 1rem"
            }}
            lineNumberStyle={{
              userSelect: "none"
            }}
            codeTagProps={{
              style: {
                fontSize: "0.9rem",
                fontFamily: "var(--font-mono)"
              }
            }}>
            {value}
          </SyntaxHighlighter>
        </div>
      </div>
      {/* Preview modal for HTML content */}
      {previewVisible && (
        <Modal
          open={previewVisible}
          onCancel={handlePreviewClose}
          footer={null}
          width="80%"
          zIndex={999999}
          centered
          styles={{
            body: {
              padding: 0
            }
          }}>
          <div className="relative  w-full h-[80vh]">
            <iframe
              srcDoc={value}
              title="HTML Preview"
              className="w-full h-full"
            />
          </div>
        </Modal>
      )}
    </>
  )
}
