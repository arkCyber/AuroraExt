/**
 * EditMessageForm Component
 * A form component for editing chat messages with dynamic textarea sizing and IME support.
 * Supports both bot and user message editing with different submission behaviors.
 */

import { useForm } from "@mantine/form"
import React from "react"
import { useTranslation } from "react-i18next"
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize"

/**
 * Props interface for EditMessageForm
 * @property {string} value - The initial message text to be edited
 * @property {(value: string, isSend: boolean) => void} onSumbit - Callback function when form is submitted
 * @property {() => void} onClose - Callback function to close the edit form
 * @property {boolean} isBot - Flag indicating if the message is from a bot
 */
type Props = {
    value: string
    onSumbit: (value: string, isSend: boolean) => void
    onClose: () => void
    isBot: boolean
}

export const EditMessageForm = (props: Props) => {
    // State to handle IME (Input Method Editor) composition events
    const [isComposing, setIsComposing] = React.useState(false)
    // Ref for the textarea element to handle dynamic sizing
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
            className="flex flex-col gap-2">
            {/* Dynamic textarea with IME support and auto-resize */}
            <textarea
                {...form.getInputProps("message")}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                required
                rows={1}
                style={{ minHeight: "80px" }}
                tabIndex={0}
                placeholder={t("editMessage.placeholder")}
                ref={textareaRef}
                className="w-full py-2 pb-8 m-1 bg-transparent border border-gray-100 rounded dark:border-stone-600 focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 dark:text-gray-100 text-[15px]"
            />
            {/* Action buttons container */}
            <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex justify-end w-full">
                    {/* Action buttons */}
                    <div className="flex space-x-2">
                        {/* Save and Submit button - different text for bot/user messages */}
                        <button
                            aria-label={t("save")}
                            className="px-4 py-1 text-white bg-gray-800 rounded-md cursor-pointer dark:!bg-indigo-300 dark:text-gray-900">
                            {props.isBot ? t("save") : t("saveAndSubmit")}
                        </button>

                        {/* Cancel button to close the edit form */}
                        <button
                            onClick={props.onClose}
                            aria-label={t("cancel")}
                            className="px-4 py-1 text-white bg-gray-800 rounded-md cursor-pointer dark:!bg-indigo-300 dark:text-gray-900">
                            {t("cancel")}
                        </button>
                    </div>
                </div>
            </div>{" "}
        </form>
    )
}
