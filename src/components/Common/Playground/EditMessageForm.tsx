/**
 * EditMessageForm Component
 * A form component for editing messages in the chat interface.
 * Supports both bot and user message editing with different behaviors.
 */

import { useForm } from "@mantine/form"
import React from "react"
import { useTranslation } from "react-i18next"
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize"

/**
 * Props interface for EditMessageForm
 * @property {string} value - The current message text to be edited
 * @property {function} onSumbit - Callback function when form is submitted
 * @property {function} onClose - Callback function to close the edit form
 * @property {boolean} isBot - Flag indicating if the message is from a bot
 */
type Props = {
  value: string
  onSumbit: (value: string, isSend: boolean) => void
  onClose: () => void
  isBot: boolean
}

export const EditMessageForm = (props: Props) => {
  // State to handle IME composition (for languages like Japanese, Chinese)
  const [isComposing, setIsComposing] = React.useState(false)
  // Ref for the textarea element to handle dynamic resizing
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation("common")

  // Initialize form with Mantine's useForm hook
  const form = useForm({
    initialValues: {
      message: props.value
    }
  })

  // Hook to dynamically adjust textarea height based on content
  useDynamicTextareaSize(textareaRef, form.values.message, 300)

  // Update form value when props.value changes
  React.useEffect(() => {
    form.setFieldValue("message", props.value)
  }, [props.value])

  return (
    <form
      onSubmit={form.onSubmit((data) => {
        // Prevent form submission during IME composition
        if (isComposing) return
        props.onClose()
        props.onSumbit(data.message, true)
      })}
      className="flex flex-col gap-2 mt-2">
      {/* Dynamic textarea with auto-resize functionality and minimum width */}
      <textarea
        {...form.getInputProps("message")}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        required
        rows={1}
        style={{ minHeight: "80px", minWidth: "560px" }}
        tabIndex={0}
        placeholder={t("editMessage.placeholder")}
        ref={textareaRef}
        className="w-full py-2 pb-8 mb-1 bg-transparent border border-gray-100 rounded dark:border-stone-600 focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 dark:text-gray-100"
      />
      {/* Action buttons container */}
      <div className="flex flex-wrap gap-0 -mt-1">
        <div className="flex justify-end w-full">
          {/* Action buttons group */}
          <div className="flex space-x-3 mx-3 my-0">
            {/* Save and Submit button - different text for bot/user messages */}
            <button
              aria-label={t("save")}
              className="px-3 py-1.5 text-sm text-white bg-black rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-violet-500 dark:bg-indigo-500">
              {props.isBot ? t("save") : t("saveAndSubmit")}
            </button>

            {/* Cancel button */}
            <button
              onClick={props.onClose}
              aria-label={t("cancel")}
              className="py-1.5 text-sm text-gray-700 border rounded-lg dark:border-gray-600 px-3 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>{" "}
    </form>
  )
}
