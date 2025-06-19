/**
 * ShareModal Component
 * 
 * A modal component that enables users to share their chat conversations.
 * Features include:
 * - Custom title and username for shared content
 * - Preview of chat messages
 * - Generation of shareable links
 * - Clipboard integration for easy sharing
 */

import { Form, Image, Input, Modal, Tooltip, message } from "antd"
import { Share, BrainCog } from "lucide-react"
import { useState } from "react"
import type { Message } from "~/store/option"
import Markdown from "./Markdown"
import React from "react"
import { useMutation } from "@tanstack/react-query"
import { getPageShareUrl } from "~/services/ollama"
import { cleanUrl } from "~/libs/clean-url"
import { getTitleById, getUserId, saveWebshare } from "@/db"
import { useTranslation } from "react-i18next"
import fetcher from "@/libs/fetcher"

/**
 * Props interface for ShareModal component
 */
type Props = {
  messages: Message[]              // Array of chat messages to be shared
  historyId: string               // Unique identifier for the chat history
  open: boolean                   // Controls modal visibility
  setOpen: (state: boolean) => void // Function to toggle modal visibility
}

/**
 * Reformats messages for sharing by adding username and restructuring the data
 * @param messages Array of messages to be reformatted
 * @param username Username to be displayed for user messages
 * @returns Reformatted messages array
 */
const reformatMessages = (messages: Message[], username: string) => {
  return messages.map((message, idx) => {
    return {
      id: idx,
      name: message.isBot ? message.name : username,
      isBot: message.isBot,
      message: message.message,
      images: message.images
    }
  })
}

/**
 * PlaygroundMessage Component
 * 
 * Renders a single message in the share preview with user/bot styling
 */
export const PlaygroundMessage = (
  props: Message & {
    username: string  // Username to display for user messages
  }
) => {
  return (
    <div className="w-full text-gray-800 group dark:text-gray-100">
      <div className="flex w-full gap-4 m-auto text-base md:gap-6 md:max-w-2xl lg:max-w-xl xl:max-w-3xl lg:px-0">
        <div className="flex flex-row w-full gap-4 m-auto md:gap-6 md:max-w-2xl lg:max-w-xl xl:max-w-3xl">
          {/* Avatar section */}
          <div className="relative flex flex-col items-end w-8">
            <div className="relative flex items-center justify-center text-white rounded-sm h-7 w-7">
              {props.isBot ? (
                // Bot avatar with BrainCog icon
                <div className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <BrainCog className="w-5 h-5" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Message content section */}
          <div className="flex w-[calc(100%-50px)] flex-col gap-3 lg:w-[calc(100%-115px)]">
            {/* Sender name */}
            <span className="text-xs font-bold text-gray-800 dark:text-white">
              {props.isBot ? props.name : props.username}
            </span>

            {/* Message content */}
            <div className="flex flex-col flex-grow">
              <Markdown message={props.message} />
            </div>

            {/* Image attachments */}
            {props.images && props.images.length > 0 && (
              <div className="flex w-full m-auto mt-4 md:max-w-2xl lg:max-w-xl xl:max-w-3xl">
                {props.images
                  .filter((image) => image.length > 0)
                  .map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt="Uploaded Image"
                      width={180}
                      className="relative rounded-md"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generates a default share title using the format "Aurora + username + time"
 * @param username The current user's name
 * @returns A formatted title string
 */
const generateDefaultTitle = (username: string): string => {
  const now = new Date()
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return `Aurora Chat - ${username} - ${formattedDate} ${formattedTime}`
}

/**
 * ShareModal Component Implementation
 */
export const ShareModal: React.FC<Props> = ({
  messages,
  historyId,
  open,
  setOpen
}) => {
  const { t } = useTranslation("common")
  const [form] = Form.useForm()
  const name = Form.useWatch("name", form)

  // Load chat title when messages change or when name changes
  React.useEffect(() => {
    if (messages.length > 0) {
      getTitleById(historyId).then((title) => {
        // If no existing title is found, generate a default one
        const defaultTitle = generateDefaultTitle(name || t("share.form.defaultValue.name"))
        form.setFieldsValue({
          title: title || defaultTitle
        })
      })
    }
  }, [messages, historyId, name]) // Added name as dependency

  // Update title when name changes
  React.useEffect(() => {
    if (name && !form.getFieldValue("title")) {
      form.setFieldsValue({
        title: generateDefaultTitle(name)
      })
    }
  }, [name])

  /**
   * Handles form submission and share link generation
   * @param values Form values containing title and username
   * @returns Share data including URL and API information
   */
  const onSubmit = async (values: { title: string; name: string }) => {
    const owner_id = await getUserId()
    const chat = reformatMessages(messages, values.name)
    const title = values.title
    const url = await getPageShareUrl()

    // Create share link through API
    const res = await fetcher(`${cleanUrl(url)}/api/v1/share/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        owner_id,
        messages: chat,
        title
      })
    })

    if (!res.ok) throw new Error(t("share.notification.failGenerate"))

    const data = await res.json()

    return {
      ...data,
      url: `${cleanUrl(url)}/share/${data.chat_id}`,
      api_url: cleanUrl(url),
      share_id: data.chat_id
    }
  }

  // Mutation hook for share link creation
  const { mutate: createShareLink, isPending } = useMutation({
    mutationFn: onSubmit,
    onSuccess: async (data) => {
      // Copy URL to clipboard and save share data
      const url = data.url
      navigator.clipboard.writeText(url)
      message.success(t("share.notification.successGenerate"))
      await saveWebshare({
        title: data.title,
        url,
        api_url: data.api_url,
        share_id: data.share_id
      })
      setOpen(false)
    },
    onError: (error) => {
      message.error(error?.message || t("share.notification.failGenerate"))
    }
  })

  return (
    <Modal
      title={t("share.modal.title")}
      open={open}
      footer={null}
      width={600}
      onCancel={() => setOpen(false)}>
      <Form
        form={form}
        layout="vertical"
        onFinish={createShareLink}
        initialValues={{
          title: generateDefaultTitle(t("share.form.defaultValue.name")),
          name: t("share.form.defaultValue.name")
        }}>
        {/* Title input field */}
        <Form.Item
          name="title"
          label={t("share.form.title.label")}
          rules={[{ required: true, message: t("share.form.title.required") }]}>
          <Input size="large" placeholder={t("share.form.title.placeholder")} />
        </Form.Item>

        {/* Username input field */}
        <Form.Item
          name="name"
          label={t("share.form.name.label")}
          rules={[{ required: true, message: t("share.form.name.required") }]}>
          <Input size="large" placeholder={t("share.form.name.placeholder")} />
        </Form.Item>

        {/* Messages preview section */}
        <Form.Item>
          <div className="max-h-[180px] overflow-x-auto border dark:border-gray-700 rounded-md p-2">
            <div className="flex flex-col p-3">
              {messages.map((message, index) => (
                <PlaygroundMessage key={index} {...message} username={name} />
              ))}
            </div>
          </div>
        </Form.Item>

        {/* Submit button */}
        <Form.Item>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-transparent bg-black px-2 py-2.5 text-md font-medium leading-4 text-white shadow-sm dark:bg-white dark:text-gray-800 disabled:opacity-50 ">
              {isPending
                ? t("share.form.btn.saving")
                : t("share.form.btn.save")}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
