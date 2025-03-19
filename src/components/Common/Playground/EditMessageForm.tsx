import { useForm } from "@mantine/form"
import React from "react"
import { useTranslation } from "react-i18next"
import useDynamicTextareaSize from "~/hooks/useDynamicTextareaSize"

type Props = {
  value: string
  onSumbit: (value: string, isSend: boolean) => void
  onClose: () => void
  isBot: boolean
}

export const EditMessageForm = (props: Props) => {
  const [isComposing, setIsComposing] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation("common")

  const form = useForm({
    initialValues: {
      message: props.value
    }
  })
  useDynamicTextareaSize(textareaRef, form.values.message, 300)

  React.useEffect(() => {
    form.setFieldValue("message", props.value)
  }, [props.value])

  return (
    <form
      onSubmit={form.onSubmit((data) => {
        if (isComposing) return
        props.onClose()
        props.onSumbit(data.message, true)
      })}
      className="flex flex-col gap-2">
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
        className="w-full p-5 pb-8 m-1 bg-transparent border border-gray-100 rounded dark:border-stone-600 focus-within:outline-none focus:ring-0 focus-visible:ring-0 ring-0 dark:ring-0 dark:text-gray-100"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        <div
          className={`w-full flex ${!props.isBot ? "justify-between" : "justify-end"
            }`}>
          {!props.isBot && (
            <button
              type="button"
              onClick={() => {
                props.onSumbit(form.values.message, false)
                props.onClose()
              }}
              aria-label={t("save")}
              className="border border-gray-600 px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 text-sm dark:bg-indigo-400">
              {t("save")}
            </button>
          )}
          <div className="flex space-x-2">
            <button
              aria-label={t("save")}
              className="px-8 py-1 text-sm text-white bg-black rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-violet-500 dark:bg-indigo-500">
              {props.isBot ? t("save") : t("saveAndSubmit")}
            </button>

            <button
              onClick={props.onClose}
              aria-label={t("cancel")}
              className="py-1 text-sm text-gray-700 border rounded-lg dark:border-gray-600 px-7 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>{" "}
    </form>
  )
}
