/**
 * PromptBody Component
 * 
 * A comprehensive prompt management interface that allows users to:
 * 1. Manage custom prompts (add, edit, delete)
 * 2. Manage copilot prompts (edit)
 * 3. Switch between custom and copilot prompt management
 * 
 * Features:
 * - CRUD operations for custom prompts
 * - Edit functionality for copilot prompts
 * - System/Quick prompt type distinction
 * - Form validation
 * - Success/Error notifications
 * - Responsive table views
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Skeleton,
  Table,
  Tooltip,
  notification,
  Modal,
  Input,
  Form,
  Switch,
  Segmented,
  Tag,
  Select
} from "antd"
import { Trash2, Pen, Computer, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { deletePromptById, getAllPrompts, savePrompt, updatePrompt, initializeDefaultPrompts } from "@/db"
import {
  getAllCopilotPrompts,
  setAllCopilotPrompts
} from "@/services/application"
import { PROMPT_CATEGORIES } from "@/services/prompt-initialization"
import { tagColors } from "@/utils/color"

export const PromptBody = () => {
  // Query client for managing React Query cache
  const queryClient = useQueryClient()

  // State management for modals and forms
  const [open, setOpen] = useState(false) // Add prompt modal
  const [openEdit, setOpenEdit] = useState(false) // Edit prompt modal
  const [editId, setEditId] = useState("") // ID of prompt being edited
  const [currentPage, setCurrentPage] = useState(1) // Current page number
  const [createForm] = Form.useForm() // Form for creating new prompts
  const [editForm] = Form.useForm() // Form for editing existing prompts
  const { t } = useTranslation(["settings", "common", "personalSettings"])

  // State for managing prompt type selection (custom vs copilot)
  const [selectedSegment, setSelectedSegment] = useState<"custom" | "copilot">("custom")

  // State for category filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // State for copilot prompt management
  const [openCopilotEdit, setOpenCopilotEdit] = useState(false)
  const [editCopilotId, setEditCopilotId] = useState("")
  const [editCopilotForm] = Form.useForm()

  // Fetch all custom prompts
  const { data, status, refetch } = useQuery({
    queryKey: ["fetchAllPrompts"],
    queryFn: getAllPrompts,
    staleTime: 0, // Disable caching to ensure fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  })

  // Fetch all copilot prompts
  const { data: copilotData, status: copilotStatus } = useQuery({
    queryKey: ["fetchCopilotPrompts"],
    queryFn: getAllCopilotPrompts
  })

  // Filter prompts by selected category
  const filteredData = data?.filter(prompt => {
    if (selectedCategory === "all") return true
    return prompt.category === selectedCategory
  }) || []

  // Calculate pagination based on filtered data
  const totalFilteredPrompts = filteredData.length
  const pageSize = 12
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  // Mutation for deleting prompts
  const { mutate: deletePrompt } = useMutation({
    mutationFn: deletePromptById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetchAllPrompts"]
      })
      notification.success({
        message: t("managePrompts.notification.deletedSuccess"),
        description: t("managePrompts.notification.deletedSuccessDesc")
      })
    },
    onError: (error) => {
      notification.error({
        message: t("managePrompts.notification.error"),
        description: error?.message || t("managePrompts.notification.someError")
      })
    }
  })

  // Mutation for saving new prompts
  const { mutate: savePromptMutation, isPending: savePromptLoading } =
    useMutation({
      mutationFn: savePrompt,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["fetchAllPrompts"]
        })
        setOpen(false)
        createForm.resetFields()
        notification.success({
          message: t("managePrompts.notification.addSuccess"),
          description: t("managePrompts.notification.addSuccessDesc")
        })
      },
      onError: (error) => {
        notification.error({
          message: t("managePrompts.notification.error"),
          description:
            error?.message || t("managePrompts.notification.someError")
        })
      }
    })

  // Mutation for updating existing prompts
  const { mutate: updatePromptMutation, isPending: isUpdatingPrompt } =
    useMutation({
      mutationFn: async (data: any) => {
        return await updatePrompt({
          ...data,
          id: editId
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["fetchAllPrompts"]
        })
        setOpenEdit(false)
        editForm.resetFields()
        notification.success({
          message: t("managePrompts.notification.updatedSuccess"),
          description: t("managePrompts.notification.updatedSuccessDesc")
        })
      },
      onError: (error) => {
        notification.error({
          message: t("managePrompts.notification.error"),
          description:
            error?.message || t("managePrompts.notification.someError")
        })
      }
    })

  // Mutation for updating copilot prompts
  const { mutate: updateCopilotPrompt, isPending: isUpdatingCopilotPrompt } =
    useMutation({
      mutationFn: async (data: any) => {
        return await setAllCopilotPrompts([
          {
            key: data.key,
            prompt: data.prompt
          }
        ])
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["fetchCopilotPrompts"]
        })
        setOpenCopilotEdit(false)
        editCopilotForm.resetFields()
        notification.success({
          message: t("managePrompts.notification.updatedSuccess"),
          description: t("managePrompts.notification.updatedSuccessDesc")
        })
      },
      onError: (error) => {
        notification.error({
          message: t("managePrompts.notification.error"),
          description:
            error?.message || t("managePrompts.notification.someError")
        })
      }
    })

  // Function to handle importing default prompts
  const handleImportDefaultPrompts = async () => {
    try {
      Modal.confirm({
        title: t("managePrompts.confirm.importTitle"),
        content: t("managePrompts.confirm.importContent"),
        okText: t("managePrompts.confirm.ok"),
        cancelText: t("managePrompts.confirm.cancel"),
        onOk: async () => {
          await initializeDefaultPrompts()
          await queryClient.invalidateQueries({ queryKey: ["fetchAllPrompts"] })
          await refetch()
          notification.success({
            message: t("managePrompts.notification.defaultSuccess"),
            description: t("managePrompts.notification.defaultSuccessDesc"),
            placement: 'top'
          })
        }
      })
    } catch (error) {
      notification.error({
        message: t("managePrompts.notification.error"),
        description: t("managePrompts.notification.someError"),
        placement: 'top'
      })
    }
  }

  /**
   * Renders the custom prompts section
   * Includes:
   * - Add new prompt button
   * - Table of existing prompts with actions
   * - Loading skeleton while fetching data
   */
  function customPrompts() {
    return (
      <div className="space-y-2">
        <style>
          {`
            .custom-table .ant-table-tbody > tr > td {
              padding: 4px 16px;
              line-height: 1.1;
            }
            .custom-table .ant-table-thead > tr > th {
              padding: 4px 16px;
              line-height: 1.1;
            }
            .custom-table .ant-table-cell {
              font-size: 0.875rem;
            }
          `}
        </style>
        <div className="flex justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">分类筛选:</span>
            <Select
              size="small"
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value)
                setCurrentPage(1) // Reset to first page when category changes
              }}
              className="w-32"
              options={PROMPT_CATEGORIES.map(cat => ({
                label: cat.label,
                value: cat.key
              }))}
            />
            {selectedCategory !== "all" && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({totalFilteredPrompts} 个提示词)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImportDefaultPrompts}
              className="px-3 py-1 text-sm text-gray-800 bg-indigo-300 rounded-md cursor-pointer hover:bg-indigo-400 dark:text-gray-800">
              {t("managePrompts.defaultBtn")}
            </button>
            <button
              onClick={() => {
                window.open('https://github.com/f/awesome-chatgpt-prompts', '_blank')
              }}
              className="px-3 py-1 text-sm text-gray-800 bg-indigo-300 rounded-md cursor-pointer hover:bg-indigo-400 dark:text-gray-800">
              {t("managePrompts.hubBtn")}
            </button>
            <button
              onClick={() => setOpen(true)}
              className="px-3 py-1 text-sm text-gray-800 bg-indigo-300 rounded-md cursor-pointer hover:bg-indigo-400 dark:text-gray-800">
              {t("managePrompts.addBtn")}
            </button>
          </div>
        </div>

        {status === "pending" && <Skeleton paragraph={{ rows: 6 }} />}

        {status === "success" && (
          <Table
            size="small"
            className="custom-table"
            pagination={{
              pageSize: 12,
              current: currentPage,
              total: totalFilteredPrompts,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false
            }}
            columns={[
              {
                title: t("managePrompts.columns.index"),
                key: "index",
                width: 50,
                align: "center",
                render: (_, __, index) => (currentPage - 1) * 12 + index + 1
              },
              {
                title: t("managePrompts.columns.icon"),
                key: "icon",
                width: 50,
                render: (_, record) => (
                  <span className="flex items-center justify-center">
                    {record.is_system ? (
                      <Computer className="text-indigo-400 size-4" />
                    ) : (
                      <Zap className="text-indigo-400 size-4" />
                    )}
                  </span>
                )
              },
              {
                title: t("managePrompts.columns.title"),
                dataIndex: "title",
                key: "title",
                width: 220,
                render: (content) => (
                  <span className="line-clamp-1 max-w-[21ch] truncate">
                    {content}
                  </span>
                )
              },
              {
                title: t("managePrompts.columns.prompt"),
                dataIndex: "content",
                key: "content",
                render: (content) => (
                  <span className="line-clamp-1 max-w-[240px]">{content}</span>
                )
              },
              {
                title: t("managePrompts.columns.actions"),
                render: (_, record) => (
                  <div className="flex gap-4">
                    <Tooltip title={t("managePrompts.tooltip.delete")}>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(t("managePrompts.confirm.delete"))
                          ) {
                            deletePrompt(record.id)
                          }
                        }}
                        className="text-red-500 hover:text-red-600 dark:text-red-400">
                        <Trash2 className="size-4" />
                      </button>
                    </Tooltip>
                    <Tooltip title={t("managePrompts.tooltip.edit")}>
                      <button
                        onClick={() => {
                          setEditId(record.id)
                          editForm.setFieldsValue(record)
                          setOpenEdit(true)
                        }}
                        className="text-indigo-400 hover:text-indigo-500 dark:text-indigo-400">
                        <Pen className="size-4" />
                      </button>
                    </Tooltip>
                  </div>
                )
              }
            ]}
            bordered
            dataSource={paginatedData}
            rowKey={(record) => record.id}
          />
        )}
      </div>
    )
  }

  /**
   * Renders the copilot prompts section
   * Includes:
   * - Table of copilot prompts with edit actions
   * - Loading skeleton while fetching data
   * - Custom styling for better presentation
   */
  function copilotPrompts() {
    return (
      <div className="space-y-2">
        <style>
          {`
            .copilot-table .ant-table-tbody > tr > td {
              padding: 6px 16px;
              line-height: 1.2;
            }
            .copilot-table .ant-table-thead > tr > th {
              padding: 6px 16px;
              line-height: 1.2;
            }
            .copilot-table .ant-table-cell {
              font-size: 0.875rem;
            }
          `}
        </style>
        {copilotStatus === "pending" && <Skeleton paragraph={{ rows: 6 }} />}

        {copilotStatus === "success" && (
          <Table
            size="small"
            className="copilot-table"
            pagination={false}
            columns={[
              {
                title: t("managePrompts.columns.index"),
                key: "index",
                width: 50,
                align: "center",
                render: (_, __, index) => index + 1
              },
              {
                title: t("managePrompts.columns.title"),
                dataIndex: "key",
                key: "key",
                width: 220,
                render: (content) => (
                  <span className="line-clamp-1">
                    <Tag color={tagColors[content || "default"]} className="py-0.5">
                      {t(`common:copilot.${content}`)}
                    </Tag>
                  </span>
                )
              },
              {
                title: t("managePrompts.columns.prompt"),
                dataIndex: "prompt",
                key: "prompt",
                render: (content) => (
                  <span className="line-clamp-1 max-w-[240px]">{content}</span>
                )
              },
              {
                render: (_, record) => (
                  <div className="flex gap-4">
                    <Tooltip title={t("managePrompts.tooltip.edit")}>
                      <button
                        onClick={() => {
                          setEditCopilotId(record.key)
                          editCopilotForm.setFieldsValue(record)
                          setOpenCopilotEdit(true)
                        }}
                        className="text-indigo-400 hover:text-indigo-500 dark:text-indigo-400">
                        <Pen className="size-4" />
                      </button>
                    </Tooltip>
                  </div>
                )
              }
            ]}
            bordered
            dataSource={copilotData}
            rowKey={(record) => record.key}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Segment control for switching between custom and copilot prompts */}
      <div className="flex items-center justify-between mb-1">
        <Segmented
          block
          className="!bg-gray-100 dark:!bg-gray-800 [&_.ant-segmented-item-selected]:!bg-indigo-300 [&_.ant-segmented-item-selected]:!text-gray-800 hover:[&_.ant-segmented-item]:!bg-indigo-400 dark:hover:[&_.ant-segmented-item]:!bg-indigo-400"
          value={selectedSegment}
          onChange={(value) => {
            setSelectedSegment(value as "custom" | "copilot")
          }}
          options={[
            {
              label: t("managePrompts.segmented.custom"),
              value: "custom"
            },
            {
              label: t("managePrompts.segmented.copilot"),
              value: "copilot"
            }
          ]}
        />
      </div>

      {/* Render appropriate section based on selection */}
      {selectedSegment === "custom" && customPrompts()}
      {selectedSegment === "copilot" && copilotPrompts()}

      {/* Modal for adding new prompts */}
      <Modal
        title={t("managePrompts.modal.addTitle")}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        className="!border-indigo-500 [&_.ant-modal-content]:!border-indigo-500">
        <Form
          onFinish={(values) => savePromptMutation(values)}
          layout="vertical"
          form={createForm}
          className="space-y-2">
          <Form.Item
            name="title"
            label={t("personalSettings.form.roleTitle")}
            className="mb-3"
            rules={[
              {
                required: true,
                message: t("personalSettings.form.roleTitle.required")
              }
            ]}>
            <Input placeholder={t("personalSettings.form.roleTitle.placeholder")} />
          </Form.Item>

          <Form.Item
            name="is_system"
            valuePropName="checked"
            className="mb-3 -mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-700 dark:text-gray-300">{t("managePrompts.form.isSystem.label")}</span>
              <Form.Item
                name="is_system"
                valuePropName="checked"
                noStyle>
                <Switch
                  size="small"
                  className="!bg-gray-600 [&.ant-switch-checked]:!bg-indigo-400 hover:opacity-90"
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            name="content"
            label={t("managePrompts.form.prompt.label")}
            className="mb-2"
            rules={[
              {
                required: true,
                message: t("managePrompts.form.prompt.required")
              }
            ]}
            help={t("managePrompts.form.prompt.help")}>
            <Input.TextArea
              placeholder={t("managePrompts.form.prompt.placeholder")}
              autoSize={{ minRows: 6, maxRows: 12 }}
              className="!resize-y"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <button
              disabled={savePromptLoading}
              className="inline-flex items-center justify-center w-full px-2 py-2 mt-4 text-sm font-medium leading-4 text-center text-gray-800 bg-indigo-300 border border-transparent rounded-md shadow-sm hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-800 dark:hover:bg-indigo-200 dark:focus:ring-indigo-500 dark:focus:ring-offset-gray-100 disabled:opacity-50">
              {savePromptLoading
                ? t("managePrompts.form.btnSave.saving")
                : t("managePrompts.form.btnSave.save")}
            </button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for editing existing prompts */}
      <Modal
        title={t("managePrompts.modal.editTitle")}
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        footer={null}
        className="!border-indigo-500 [&_.ant-modal-content]:!border-indigo-500">
        <Form
          onFinish={(values) => updatePromptMutation(values)}
          layout="vertical"
          form={editForm}
          className="space-y-2">
          <Form.Item
            name="title"
            label={t("personalSettings.form.roleTitle")}
            className="mb-3"
            rules={[
              {
                required: true,
                message: t("personalSettings.form.roleTitle.required")
              }
            ]}>
            <Input placeholder={t("personalSettings.form.roleTitle.placeholder")} />
          </Form.Item>

          <Form.Item
            name="is_system"
            valuePropName="checked"
            className="mb-3 -mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-700 dark:text-gray-300">{t("managePrompts.form.isSystem.label")}</span>
              <Form.Item
                name="is_system"
                valuePropName="checked"
                noStyle>
                <Switch
                  size="small"
                  className="!bg-gray-600 [&.ant-switch-checked]:!bg-indigo-400 hover:opacity-90"
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            name="content"
            label={t("managePrompts.form.prompt.label")}
            className="mb-2"
            rules={[
              {
                required: true,
                message: t("managePrompts.form.prompt.required")
              }
            ]}
            help={t("managePrompts.form.prompt.help")}>
            <Input.TextArea
              placeholder={t("managePrompts.form.prompt.placeholder")}
              autoSize={{ minRows: 6, maxRows: 12 }}
              className="!resize-y"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <button
              disabled={isUpdatingPrompt}
              className="inline-flex items-center justify-center w-full px-2 py-2 mt-4 text-sm font-medium leading-4 text-center text-gray-800 bg-indigo-300 border border-transparent rounded-md shadow-sm hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-800 dark:hover:bg-indigo-200 dark:focus:ring-indigo-500 dark:focus:ring-offset-gray-100 disabled:opacity-50">
              {isUpdatingPrompt
                ? t("managePrompts.form.btnEdit.saving")
                : t("managePrompts.form.btnEdit.save")}
            </button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for editing copilot prompts */}
      <Modal
        title={t("managePrompts.modal.editTitle")}
        open={openCopilotEdit}
        onCancel={() => setOpenCopilotEdit(false)}
        footer={null}
        className="!border-indigo-500 [&_.ant-modal-content]:!border-indigo-500">
        <Form
          onFinish={(values) =>
            updateCopilotPrompt({
              key: editCopilotId,
              prompt: values.prompt
            })
          }
          layout="vertical"
          form={editCopilotForm}>
          <Form.Item
            name="prompt"
            label={t("managePrompts.form.prompt.label")}
            rules={[
              {
                required: true,
                message: t("managePrompts.form.prompt.required")
              },
              {
                validator: (_, value) => {
                  if (value && value.includes("{text}")) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error(
                      t("managePrompts.form.prompt.missingTextPlaceholder")
                    )
                  )
                }
              }
            ]}>
            <Input.TextArea
              placeholder={t("managePrompts.form.prompt.placeholder")}
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          </Form.Item>

          <Form.Item>
            <button
              disabled={isUpdatingCopilotPrompt}
              className="inline-flex items-center justify-center w-full px-2 py-2 mt-4 text-sm font-medium leading-4 text-center text-gray-800 bg-indigo-300 border border-transparent rounded-md shadow-sm hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-800 dark:hover:bg-indigo-200 dark:focus:ring-indigo-500 dark:focus:ring-offset-gray-100 disabled:opacity-50">
              {isUpdatingCopilotPrompt
                ? t("managePrompts.form.btnEdit.saving")
                : t("managePrompts.form.btnEdit.save")}
            </button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
