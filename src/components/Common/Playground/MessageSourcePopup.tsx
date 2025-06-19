import { KnowledgeIcon } from "@/components/Option/Knowledge/KnowledgeIcon"
import { Modal } from "antd"

type Props = {
  source: any
  open: boolean
  setOpen: (open: boolean) => void
}

export const MessageSourcePopup: React.FC<Props> = ({
  source,
  open,
  setOpen
}) => {
  return (
    <Modal
      open={open}
      // mask={false}
      zIndex={10000}
      onCancel={() => setOpen(false)}
      footer={null}
      onOk={() => setOpen(false)}>
      <div className="flex flex-col gap-2 mt-6">
        <h4 className="inline-flex items-center gap-2 p-2 font-semibold text-gray-800 bg-gray-100 text-md dark:bg-gray-800 dark:text-gray-100">
          {source?.type && (
            <KnowledgeIcon type={source?.type} className="w-5 h-4" />
          )}
          {source?.name}
        </h4>
        {source?.type === "pdf" ? (
          <>
            <p className="text-sm text-gray-500">{source?.pageContent}</p>

            <div className="flex flex-wrap gap-3">
              <span className="p-1 text-xs text-gray-500 border border-gray-300 rounded-md dark:border-gray-700">
                {`Page ${source?.metadata?.page}`}
              </span>

              <span className="p-1 text-xs text-gray-500 border border-gray-300 rounded-md dark:border-gray-700">
                {`Line ${source?.metadata?.loc?.lines?.from} - ${source?.metadata?.loc?.lines?.to}`}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">{source?.pageContent}</p>
          </>
        )}
      </div>
    </Modal>
  )
}
