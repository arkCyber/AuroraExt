/**
 * MoreOptions Component
 * 
 * A dropdown menu component that provides additional actions for chat messages,
 * including copying, downloading in various formats, and sharing functionality.
 */

import {
  MoreVertical,
  FileText,
  Share2,
  FileJson,
  FileCode,
  ImageIcon
} from "lucide-react"

import { Dropdown, MenuProps, message } from "antd"
import { Message } from "@/types/message"
import { useState } from "react"
import { ShareModal } from "../Common/ShareModal"
import { useTranslation } from "react-i18next"
import { removeModelSuffix } from "@/db/models"

interface MoreOptionsProps {
  messages: Message[]           // Array of chat messages
  historyId: string           // Unique identifier for the chat history
  shareModeEnabled: boolean   // Whether sharing functionality is enabled
}

/**
 * Formats the chat messages as plain text
 * @param messages Array of chat messages
 * @returns Formatted string with messages
 */
const formatAsText = (messages: Message[]) => {
  return messages
    .map((msg) => {
      const text = `${msg.isBot ? msg.name : "You"}: ${msg.message}`
      return text
    })
    .join("\n\n")
}

/**
 * Formats the chat messages as markdown
 * @param messages Array of chat messages
 * @returns Formatted markdown string with messages and images
 */
const formatAsMarkdown = (messages: Message[]) => {
  return messages
    .map((msg) => {
      let content = `**${msg.isBot ? removeModelSuffix(msg.name?.replaceAll(/accounts\/[^\/]+\/models\//g, "")) : "You"}**:\n${msg.message}`

      // Add image links if present
      if (msg.images && msg.images.length > 0) {
        const imageMarkdown = msg.images
          .filter((img) => img.length > 0)
          .map((img) => `\n\n![Image](${img})`)
          .join("\n")
        content += imageMarkdown
      }

      return content
    })
    .join("\n\n")
}

/**
 * Downloads content as a file
 * @param content Content to be downloaded
 * @param filename Name of the file to be downloaded
 */
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates an image representation of the chat
 * @param messages Array of chat messages
 * @returns Promise resolving to a data URL of the generated image
 */
const generateChatImage = async (messages: Message[]) => {
  // Create canvas and set initial properties
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  canvas.width = 1200
  const padding = 40
  let yPosition = padding

  /**
   * Wraps text to fit within the canvas width
   * @param text Text to wrap
   * @param maxWidth Maximum width for the text
   * @returns Array of wrapped lines
   */
  const wrapText = (text: string, maxWidth: number) => {
    const paragraphs = text.split("\n")
    const lines = []

    paragraphs.forEach((paragraph) => {
      if (paragraph.length === 0) {
        lines.push("")
        return
      }

      const words = paragraph.split(" ")
      let currentLine = words[0]

      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + " " + word).width
        if (width < maxWidth) {
          currentLine += " " + word
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
      lines.push(currentLine)
    })

    return lines
  }

  // Calculate total height needed for the canvas
  let totalHeight = padding
  messages.forEach((msg) => {
    totalHeight += 20
    const maxWidth = canvas.width - padding * 2

    // Handle code blocks differently
    if (msg.message.includes("```")) {
      const blocks = msg.message.split("```")
      blocks.forEach((block, index) => {
        if (index % 2 === 1) {
          // Code block
          const codeLines = block.split("\n")
          totalHeight += codeLines.length * 25 + 20
        } else {
          // Regular text
          const wrappedText = wrapText(block, maxWidth)
          totalHeight += wrappedText.length * 25
        }
      })
    } else {
      const wrappedText = wrapText(msg.message, maxWidth)
      totalHeight += wrappedText.length * 25
    }

    // Add space for images
    if (msg.images?.length) {
      totalHeight += msg.images.length * 250
    }

    totalHeight += 30
  })

  canvas.height = totalHeight

  // Set background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  /**
   * Draws the chat messages on the canvas
   */
  const drawText = async () => {
    for (const msg of messages) {
      // Draw sender name
      ctx.font = "bold 18px Inter, Arial"
      ctx.fillStyle = msg.isBot ? "#1A202C" : "#1E4E8C"
      ctx.fillText(`${msg.isBot ? removeModelSuffix(msg.name?.replaceAll(/accounts\/[^\/]+\/models\//g, "")) : "You"}:`, padding, yPosition)
      yPosition += 35

      // Handle message content
      if (msg.message.includes("```")) {
        // Handle code blocks
        const blocks = msg.message.split("```")
        blocks.forEach((block, index) => {
          if (index % 2 === 1) {
            // Code block styling
            const codeLines = block.split("\n")
            const codeHeight = codeLines.length * 25 + 20
            ctx.fillStyle = "#1a1a1a"
            ctx.fillRect(
              padding,
              yPosition,
              canvas.width - padding * 2,
              codeHeight
            )
            ctx.font = "15px Consolas, monospace"
            ctx.fillStyle = "#e6e6e6"
            codeLines.forEach((line, lineIndex) => {
              ctx.fillText(line, padding + 15, yPosition + 25 + lineIndex * 25)
            })
            yPosition += codeHeight + 20
          } else {
            // Regular text styling
            ctx.font = "16px Inter, Arial"
            ctx.fillStyle = "#1A202C"
            const wrappedText = wrapText(block, canvas.width - padding * 2)
            wrappedText.forEach((line) => {
              ctx.fillText(line, padding, yPosition)
              yPosition += 30
            })
          }
        })
      } else {
        // Regular text styling
        ctx.font = "16px Inter, Arial"
        ctx.fillStyle = "#1A202C"
        const wrappedText = wrapText(msg.message, canvas.width - padding * 2)
        wrappedText.forEach((line) => {
          ctx.fillText(line, padding, yPosition)
          yPosition += 30
        })
      }

      // Handle images
      if (msg.images?.length) {
        for (const imgUrl of msg.images) {
          if (imgUrl) {
            try {
              const img = new Image()
              img.crossOrigin = "anonymous"
              await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = imgUrl
              })

              // Scale image to fit canvas
              const maxWidth = canvas.width - padding * 2
              const maxHeight = 100
              const scale = Math.min(
                maxWidth / img.width,
                maxHeight / img.height,
                0.5
              )
              const drawWidth = img.width * scale
              const drawHeight = img.height * scale

              ctx.drawImage(img, padding, yPosition + 10, drawWidth, drawHeight)
              yPosition += drawHeight + 30
            } catch (e) {
              console.warn("Failed to load image:", imgUrl)
            }
          }
        }
      }
      yPosition += 30
    }
  }

  await drawText()
  return canvas.toDataURL("image/png")
}

export const MoreOptions = ({
  shareModeEnabled = false,
  historyId,
  messages
}: MoreOptionsProps) => {
  const { t } = useTranslation("option")
  const [onShareOpen, setOnShareOpen] = useState(false)

  // Define base menu items (copy and download options)
  const baseItems: MenuProps["items"] = [
    {
      type: "group",
      label: t("more.copy.group"),
      children: [
        {
          key: "copy-text",
          label: t("more.copy.asText"),
          icon: <FileText className="w-4 h-4" />,
          onClick: () => {
            navigator.clipboard.writeText(formatAsText(messages))
            message.success(t("more.copy.success"))
          }
        },
        {
          key: "copy-markdown",
          label: t("more.copy.asMarkdown"),
          icon: <FileCode className="w-4 h-4" />,
          onClick: () => {
            navigator.clipboard.writeText(formatAsMarkdown(messages))
            message.success(t("more.copy.success"))
          }
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "group",
      label: t("more.download.group"),
      children: [
        {
          key: "download-txt",
          label: t("more.download.text"),
          icon: <FileText className="w-4 h-4" />,
          onClick: () => {
            downloadFile(formatAsText(messages), "chat.txt")
          }
        },
        {
          key: "download-md",
          label: t("more.download.markdown"),
          icon: <FileCode className="w-4 h-4" />,
          onClick: () => {
            downloadFile(formatAsMarkdown(messages), "chat.md")
          }
        },
        {
          key: "download-json",
          label: t("more.download.json"),
          icon: <FileJson className="w-4 h-4" />,
          onClick: () => {
            const jsonContent = JSON.stringify(messages, null, 2)
            downloadFile(jsonContent, "chat.json")
          }
        },
        {
          key: "download-image",
          label: t("more.download.image"),
          icon: <ImageIcon className="w-4 h-4" />,
          onClick: async () => {
            const dataUrl = await generateChatImage(messages)
            const link = document.createElement("a")
            link.download = "chat.png"
            link.href = dataUrl
            link.click()
          }
        }
      ]
    }
  ]

  // Add share option if enabled
  const shareItem = {
    type: "divider"
  } as const

  const shareOption = {
    key: "share",
    label: t("more.share"),
    icon: <Share2 className="w-4 h-4" />,
    onClick: () => {
      setOnShareOpen(true)
    }
  }

  // Combine menu items based on share mode
  const items = shareModeEnabled
    ? [...baseItems, shareItem, shareOption]
    : baseItems

  return (
    <>
      <Dropdown
        menu={{
          items
        }}
        trigger={["click"]}
        placement="bottomRight">
        <button className="flex items-center justify-center w-5 h-5 transition-colors duration-200 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <MoreVertical className="translate-y-[2px]" />
        </button>
      </Dropdown>
      <ShareModal
        open={onShareOpen}
        historyId={historyId}
        messages={messages}
        setOpen={setOnShareOpen}
      />
    </>
  )
}
