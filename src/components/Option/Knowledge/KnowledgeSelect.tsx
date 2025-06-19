/**
 * KnowledgeSelect Component
 * 
 * A dropdown component that allows users to select and toggle knowledge bases for message options.
 * It displays a list of available knowledge bases with their titles and icons, and handles the selection state.
 */

import { getAllKnowledge } from "@/db/knowledge"
import { useMessageOption } from "@/hooks/useMessageOption"
import { useQuery } from "@tanstack/react-query"
import { Dropdown, Tooltip } from "antd"
import { Blocks } from "lucide-react"
import React from "react"
import { useTranslation } from "react-i18next"

export const KnowledgeSelect: React.FC = () => {
  // Get translation function for internationalization
  const { t } = useTranslation("playground")

  // Get and set the selected knowledge from message options context
  const { setSelectedKnowledge, selectedKnowledge } = useMessageOption()

  // Fetch all knowledge bases with "finished" status
  // Refetch every second to keep the list updated
  const { data } = useQuery({
    queryKey: ["getAllKnowledge"],
    queryFn: async () => {
      const data = await getAllKnowledge("finished")
      return data
    },
    refetchInterval: 1000
  })

  return (
    <>
      {/* Only render the dropdown if there are knowledge bases available */}
      {data && data.length > 0 && (
        <Dropdown
          menu={{
            // Map knowledge bases to dropdown menu items
            items:
              data?.map((d) => ({
                key: d.id,
                label: (
                  // Each menu item displays an icon and the knowledge base title
                  // Uses truncation and line clamping for long titles
                  <div className="inline-flex items-center gap-2 text-sm truncate w-52 line-clamp-3 dark:border-gray-700 dark:hover:bg-indigo-400">
                    <div>
                      <Blocks className="w-5 h-5 text-gray-400" />
                    </div>
                    {d.title}
                  </div>
                ),
                // Handle selection/deselection of knowledge base
                onClick: () => {
                  const knowledge = data?.find((k) => k.id === d.id)
                  if (selectedKnowledge?.id === d.id) {
                    setSelectedKnowledge(null)
                  } else {
                    setSelectedKnowledge(knowledge)
                  }
                }
              })) || [],
            // Style the dropdown menu with scrolling for many items
            style: {
              maxHeight: 500,
              overflowY: "scroll"
            },
            className: "no-scrollbar",
            // Highlight the currently selected knowledge base
            activeKey: selectedKnowledge?.id
          }}
          placement={"topLeft"}
          trigger={["click"]}>
          {/* Trigger button with tooltip */}
          <Tooltip title={`Select ${t("tooltip.knowledge")}`}>
            <button type="button" className="dark:text-gray-300">
              <Blocks className="w-5 h-5" />
            </button>
          </Tooltip>
        </Dropdown>
      )}
    </>
  )
}
