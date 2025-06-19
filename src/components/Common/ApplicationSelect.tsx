/**
 * ApplicationSelect Component
 * 
 * A modal component that displays a grid of available prompts/templates for users to select from.
 * Features include:
 * - Search functionality to filter prompts
 * - Pagination for browsing through multiple prompts
 * - Grid layout with 4x4 display of prompts
 * - Dark mode support
 * - Responsive design
 * - "Just Chat" quick start option
 * 
 * Each prompt card displays:
 * - An icon (system or regular prompt)
 * - Title
 * - Preview of content
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {() => void} onClose - Callback function when modal is closed
 * @param {() => void} onJustStart - Callback function for quick start without selecting a prompt
 * @param {(promptId: string) => void} onSelectPrompt - Callback function when a prompt is selected
 * 
 * Usage:
 * <ApplicationSelect
 *   open={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onJustStart={() => handleQuickStart()}
 *   onSelectPrompt={(id) => handlePromptSelection(id)}
 * />
 */

import { Modal, Pagination, Input, Tabs } from "antd";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getAllPrompts } from "@/db";
import { ZapIcon, ComputerIcon, SearchIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { PROMPT_CATEGORIES } from "@/services/prompt-initialization";
import { TextSearch } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onJustStart: () => void;
  onSelectPrompt: (promptId: string) => void;
};

export const ApplicationSelect: React.FC<Props> = ({
  open,
  onClose,
  onJustStart,
  onSelectPrompt,
}) => {
  const { t } = useTranslation(["option", "common"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const pageSize = 16; // Show 16 prompts per page (4 rows x 4 columns)

  // Fetch all available prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ["fetchAllPromptsForSelect"],
    queryFn: getAllPrompts,
  });

  // Filter prompts based on search query and selected category
  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];

    let filtered = prompts;

    // Filter by category first
    if (selectedCategory !== "all") {
      filtered = prompts.filter(prompt => prompt.category === selectedCategory);
    }

    // Then filter by search query if exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prompts, searchQuery, selectedCategory]);

  // Calculate pagination
  const totalPrompts = filteredPrompts?.length || 0;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPrompts = filteredPrompts?.slice(startIndex, endIndex);

  // Reset to first page when category or search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setSearchQuery(""); // Clear search when changing category
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate category tabs with prompt counts
  const categoryTabs = useMemo(() => {
    if (!prompts) return [];

    return PROMPT_CATEGORIES.map(category => {
      const count = category.key === "all"
        ? prompts.length
        : prompts.filter(p => p.category === category.key).length;

      return {
        key: category.key,
        label: `${category.label} (${count})`,
        count
      };
    });
  }, [prompts]);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      height={580} // Reduced from 600 to 580
      className="border border-indigo-800 shadow-2xl application-select-modal"
      title={
        <div className="flex justify-between items-center">
          {/* Just Chat Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onJustStart}
              className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <ZapIcon className="w-4 h-4" />
              <span className="text-sm">Just Chat</span>
            </button>
          </div>

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2">
              <TextSearch className="w-6 h-6 text-gray-600 dark:text-rose-100" />
              <h2 className="mb-0.5 text-xl font-semibold">{t("common:chooseApplication")}</h2>
            </div>
            <p className="text-gray-400 dark:text-rose-100 text-sm">{t("common:chatWithSoul")}</p>
          </div>
          <div className="-ml-30 w-48 mt-8.5">
            <Input.Search
              placeholder={selectedCategory === "all" ? t("common:searchPrompts") : `在${categoryTabs.find(t => t.key === selectedCategory)?.label?.split(' (')[0]}中搜索...`}
              allowClear
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              size="middle"
            />
          </div>
        </div>
      }
      centered
    >
      <div className="flex flex-col gap-2 mt-2"> {/* Reduced gap and margin */}
        {/* Category Tabs */}
        <Tabs
          activeKey={selectedCategory}
          onChange={handleCategoryChange}
          className="category-tabs"
          items={categoryTabs.map(tab => ({
            key: tab.key,
            label: (
              <span className="text-sm">
                {tab.label}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-2"> {/* Reduced gap */}
                {/* Prompts Grid */}
                <div className="grid grid-cols-4 gap-3 mt-1"> {/* Reduced margin */}
                  {!isLoading && currentPrompts?.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => onSelectPrompt(prompt.id)}
                      className="flex items-start p-2 transition-all border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-gray-800 group"
                    >
                      <div className="flex-shrink-0 p-1 transition-colors bg-blue-100 rounded-lg dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800">
                        {prompt.is_system ? (
                          <ComputerIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ZapIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 ml-2 text-left">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5 truncate">
                          {prompt.title}
                        </h3>
                        <p className="text-xs leading-tight text-gray-500 dark:text-gray-400 line-clamp-2">
                          {prompt.content.substring(0, 50)}...
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Empty State */}
                {!isLoading && totalPrompts === 0 && (
                  <div className="py-4 text-center mt-7">
                    <SearchIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-400">
                      {searchQuery ? "没有找到匹配的提示词" : `${categoryTabs.find(t => t.key === selectedCategory)?.label?.split(' (')[0]}分类暂无提示词`}
                    </p>
                  </div>
                )}
                {/* Pagination */}
                {!isLoading && totalPrompts > pageSize && (
                  <div className="flex justify-center mt-1"> {/* Reduced margin */}
                    <Pagination
                      current={currentPage}
                      total={totalPrompts}
                      pageSize={pageSize}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      size="small"
                      className="custom-pagination text-xs"
                      style={{ gap: '0px' }}
                      showTotal={(total, range) => <span className="text-xs">{`${range[0]}-${range[1]} of ${total} items`}</span>}
                    />
                  </div>
                )}
              </div>
            )
          }))}
        />
      </div>

      <style>
        {`
          .application-select-modal .ant-modal-content {
            background: white;
            border-radius: 16px;
            padding: 12px 12px 4px 12px; /* Reduced bottom padding to 30% (12px -> 4px) */
            height: 600px; /* Reduced height */
            display: flex;
            flex-direction: column;
          }
          
          .dark .application-select-modal .ant-modal-content {
            background: #1a1a1a;
            color: white;
          }
          
          .application-select-modal .ant-modal-close {
            color: #666;
          }
          
          .dark .application-select-modal .ant-modal-close {
            color: #999;
          }
          
          .application-select-modal .ant-modal-header {
            background: transparent;
            border-bottom: none;
            padding-bottom: 8px; /* Reduced padding */
            padding-top: 0;
          }
          
          .application-select-modal .ant-modal-body {
            padding: 4px 0 0 0; /* Reduced padding */
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .application-select-modal .ant-modal-body::-webkit-scrollbar {
            width: 6px;
          }

          .application-select-modal .ant-modal-body::-webkit-scrollbar-track {
            background: transparent;
          }

          .application-select-modal .ant-modal-body::-webkit-scrollbar-thumb {
            background-color: #888;
            border-radius: 3px;
          }

          .dark .application-select-modal .ant-modal-body::-webkit-scrollbar-thumb {
            background-color: #444;
          }

          /* Category Tabs Styles */
          .category-tabs .ant-tabs-nav {
            margin-bottom: 6px; /* Reduced margin */
          }

          .category-tabs .ant-tabs-tab {
            padding: 6px 12px; /* Reduced padding */
            font-size: 12px;
            border-radius: 0;
            margin-right: 0;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
            min-width: auto;
            flex: none;
            line-height: 0.28; /* Reduced to 50% of 0.56 */
            color: #9ca3af;
          }

          .category-tabs .ant-tabs-tab:hover {
            background: transparent;
            color: #4b5563;
          }

          .category-tabs .ant-tabs-tab-active {
            background: transparent;
            border-bottom: 2px solid #6366f1;
            color: #6366f1;
          }

          .category-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #6366f1;
          }

          .category-tabs .ant-tabs-ink-bar {
            display: none;
          }

          .category-tabs .ant-tabs-content {
            margin-top: 0;
          }

          .category-tabs .ant-tabs-nav-wrap {
            justify-content: center;
          }

          .category-tabs .ant-tabs-nav-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .dark .category-tabs .ant-tabs-tab {
            color: #9ca3af;
            background: transparent;
            border-bottom: 2px solid transparent;
          }

          .dark .category-tabs .ant-tabs-tab:hover {
            background: transparent;
            color: #d1d5db;
          }

          .dark .category-tabs .ant-tabs-tab-active {
            background: transparent;
            border-bottom: 2px solid #6366f1;
            color: #6366f1;
          }

          .dark .category-tabs .ant-tabs-nav-list {
            border-bottom: 1px solid #4b5563;
          }

          /* Search Input Styles */
          .ant-input-search .ant-input {
            background-color: transparent; /* Remove background */
            border-color: #e5e7eb;
          }

          .dark .ant-input-search .ant-input {
            background-color: transparent; /* Remove background */
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .dark .ant-input-search .ant-input-search-button {
            background-color: #4b5563;
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .dark .ant-input-search .ant-input::placeholder {
            color: #9ca3af;
          }

          /* Pagination Styles */
          .custom-pagination {
            margin-top: 0.25rem; /* Reduced margin */
            font-size: 12px;
          }

          .custom-pagination .ant-pagination-total-text {
            font-size: 12px;
            color: #6b7280;
          }

          .custom-pagination .ant-pagination-item,
          .custom-pagination .ant-pagination-prev,
          .custom-pagination .ant-pagination-next {
            min-width: 24px;
            height: 24px;
            line-height: 22px;
            margin-inline-end: 4px;
          }

          .custom-pagination .ant-pagination-item {
            border-radius: 4px;
            border-color: #e5e7eb;
            background-color: white;
          }

          .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
          .custom-pagination .ant-pagination-next .ant-pagination-item-link {
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-color: #e5e7eb;
            background-color: white;
          }

          .custom-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
          .custom-pagination .ant-pagination-next:hover .ant-pagination-item-link {
            border-color: #3b82f6;
            color: #3b82f6;
          }

          .custom-pagination .ant-pagination-item:hover {
            border-color: #3b82f6;
          }

          .custom-pagination .ant-pagination-item:hover a {
            color: #3b82f6;
          }

          .custom-pagination .ant-pagination-item-active {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }

          .custom-pagination .ant-pagination-item-active a {
            color: white;
          }

          .dark .custom-pagination .ant-pagination-total-text {
            color: #9ca3af;
          }

          .dark .custom-pagination .ant-pagination-item,
          .dark .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
          .dark .custom-pagination .ant-pagination-next .ant-pagination-item-link {
            background-color: #374151;
            border-color: #4b5563;
          }

          .dark .custom-pagination .ant-pagination-item a,
          .dark .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
          .dark .custom-pagination .ant-pagination-next .ant-pagination-item-link {
            color: #e5e7eb;
          }

          .dark .custom-pagination .ant-pagination-item-active {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }

          .dark .custom-pagination .ant-pagination-item:hover,
          .dark .custom-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
          .dark .custom-pagination .ant-pagination-next:hover .ant-pagination-item-link {
            border-color: #3b82f6;
          }

          .dark .custom-pagination .ant-pagination-item:hover a,
          .dark .custom-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
          .dark .custom-pagination .ant-pagination-next:hover .ant-pagination-item-link {
            color: #3b82f6;
          }

          .dark .custom-pagination .ant-pagination-disabled .ant-pagination-item-link,
          .dark .custom-pagination .ant-pagination-disabled:hover .ant-pagination-item-link {
            color: #6b7280;
            border-color: #4b5563;
          }

          /* Header Search Input Styles */
          .application-select-modal .ant-modal-header .ant-input-search .ant-input {
            background-color: #f9fafb;
            border-color: #e5e7eb;
            font-size: 14px;
          }

          .dark .application-select-modal .ant-modal-header .ant-input-search .ant-input {
            background-color: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .dark .application-select-modal .ant-modal-header .ant-input-search .ant-input-search-button {
            background-color: #4b5563;
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .dark .application-select-modal .ant-modal-header .ant-input-search .ant-input::placeholder {
            color: #9ca3af;
          }

          .category-tabs {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .category-tabs .ant-tabs-content-holder {
            flex: 1;
            overflow: hidden;
          }

          .category-tabs .ant-tabs-tabpane {
            height: 100%;
            overflow-y: auto;
          }
        `}
      </style>
    </Modal>
  );
}; 