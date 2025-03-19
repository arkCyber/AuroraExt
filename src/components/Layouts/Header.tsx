import { useStorage } from "@plasmohq/storage/hook";
import {
  BrainCog,
  ChevronLeft,
  ChevronRight,
  CogIcon,
  ComputerIcon,
  ZapIcon,
  AtSign,
  CircleUserRound,
  Globe, // Import the Globe icon
} from "lucide-react";

import logoImage from "~/assets/icon.png";
import UserImage from "~/assets/arkSong.png";


import { useTranslation } from "react-i18next";
import { useLocation, NavLink } from "react-router-dom";
import { SelectedKnowledge } from "../Option/Knowledge/SelectedKnowledge";
import { ModelSelect } from "../Common/ModelSelect";
import { PromptSelect } from "../Common/PromptSelect";
import { useQuery } from "@tanstack/react-query";

import { fetchChatModels } from "~/services/ollama";
import { useMessageOption } from "~/hooks/useMessageOption";
import { Tooltip, Dropdown, Menu, Select } from "antd"; // Ensure Select is imported
import { getAllPrompts } from "@/db";
import { ProviderIcons } from "../Common/ProviderIcon";
import { NewChat } from "./NewChat";
import { PageAssistSelect } from "../Select";
import { MoreOptions } from "./MoreOptions";

import { useState, useEffect } from "react"; // Ensure useEffect is imported
import ThemeToggle from "./ThemeToggle";

// Default Avatar for user profile
const defaultAvatar =
  "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png";


// const [isLoggedIn, setIsLoggedIn] = useState(false);
// const [userAvatar, setUserAvatar] = useState("");


type Props = {
  setSidebarOpen: (open: boolean) => void;
  setOpenModelSettings: (open: boolean) => void;
};

export const Header: React.FC<Props> = ({
  setOpenModelSettings,
  setSidebarOpen,
}) => {
  const { t, i18n } = useTranslation(["option", "common"]);
  const isRTL = i18n.dir() === "rtl";

  const [shareModeEnabled] = useStorage("shareMode", false);
  const [hideCurrentChatModelSettings] = useStorage("hideCurrentChatModelSettings", false);
  const {
    selectedModel,
    setSelectedModel,
    clearChat,
    selectedSystemPrompt,
    setSelectedQuickPrompt,
    setSelectedSystemPrompt,
    messages,
    streaming,
    historyId,
    temporaryChat,
  } = useMessageOption();

  // 获取聊天模型数据
  const {
    data: models,
    isLoading: isModelsLoading,
    refetch,
  } = useQuery({
    queryKey: ["fetchModel"],
    queryFn: () => fetchChatModels({ returnEmpty: true }),
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  });

  // 获取所有提示词数据
  const { data: prompts, isLoading: isPromptLoading } = useQuery({
    queryKey: ["fetchAllPromptsLayout"],
    queryFn: getAllPrompts,
  });

  const { pathname } = useLocation();

  // 根据 ID 获取提示词信息
  const getPromptInfoById = (id: string) => {
    return prompts?.find((prompt) => prompt.id === id);
  };

  // 处理提示词选择变化
  const handlePromptChange = (value?: string) => {
    if (!value) {
      setSelectedSystemPrompt(undefined);
      setSelectedQuickPrompt(undefined);
      return;
    }
    const prompt = getPromptInfoById(value);
    if (prompt?.is_system) {
      setSelectedSystemPrompt(prompt.id);
    } else {
      setSelectedSystemPrompt(undefined);
      setSelectedQuickPrompt(prompt.content);
    }
  };

  // 处理语言切换
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Dropdown menu for language selection
  const languageMenu = (
    <Menu className="bg-white rounded-md shadow-lg dark:bg-neutral-900">
      <Menu.Item
        key="en"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("en")}
      >
        English
      </Menu.Item>
      <Menu.Item
        key="zh"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("zh")}
      >
        中文
      </Menu.Item>
    </Menu>
  );

  // 修复 sidePanel.setOptions 错误
  useEffect(() => {
    if (chrome?.sidePanel?.setOptions) {
      chrome.sidePanel.setOptions({
        path: "sidePanel.html", // 确保 path 属性正确
        enabled: true,
      });
    }
  }, []);

  return (
    <div
      className={`absolute top-0 z-10 flex w-full flex-row overflow-x-auto lg:overflow-x-visible h-14 p-3 bg-stone-200 border-gray-500 border-b shadow-lg text-gray-600 dark:bg-[#1a1717] dark:drop-shadow-[8px_12px_16px_rgba(100,149,237,0.3)]
  dark:border-stone-600 border-opacity-50 ${temporaryChat && "!bg-gray-100 dark:!bg-black"
        }`}
    >
      {/* Header 左侧内容 */}
      <div className="flex items-center gap-2">
        {pathname !== "/" && (
          <div>
            <NavLink
              to="/"
              className="items-center text-gray-600 transition-colors dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200"
            >
              {isRTL ? (
                <div style={{ animation: "slideLeftRight 2s ease-in-out infinite" }}>
                  <ChevronRight className="w-7 h-7" />
                </div>
              ) : (
                <div style={{ animation: "slideLeftRight 2s ease-in-out infinite" }}>
                  <ChevronLeft className="w-7 h-7" />
                </div>
              )}
            </NavLink>
          </div>
        )}
        <div className="flex">
          <div className="flex items-center gap-6">
            <img
              className="w-auto ml-4 h-7"
              src={logoImage}
              alt={t("common:pageAssist")}
            />
          </div>
          <p className="flex items-center ml-2 mr-6 text-base text-zinc-800 dark:text-gray-200">{"Aurora"}</p>
        </div>
        <NewChat clearChat={clearChat} />
        <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">{"/ Model "}</span>
        <div className="hidden lg:block">
          <Select
            className="border-gray-300 w-54"
            placeholder={t("common:selectAModel")}
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e);
              localStorage.setItem("selectedModel", e);
            }}
            filterOption={(input, option) => {
              return option?.label?.props['data-title']?.toLowerCase()?.includes(input.toLowerCase()) ?? false;
            }}
            showSearch
            loading={isModelsLoading}
            options={models?.map((model) => ({
              label: (
                <span key={model.model} data-title={model.name} className="flex flex-row items-center gap-3">
                  <ProviderIcons provider={model?.provider} className="w-4 h-4" />
                  <span className="line-clamp-2">{model.name}</span>
                </span>
              ),
              value: model.model,
            }))}
            size="base"
          />
        </div>
        <div className="lg:hidden">
          <ModelSelect />
        </div>
        <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">{"/ Prompt "}</span>
        <div className="hidden lg:block text-zinc-600 dark:text-zinc-350">
          <Select
            size="base"
            loading={isPromptLoading}
            showSearch
            placeholder={t("selectAPrompt")}
            className="text-gray-600 w-50 dark:text-zinc-400"
            allowClear
            onChange={handlePromptChange}
            value={selectedSystemPrompt}
            filterOption={(input, option) => {
              return option?.label?.key?.toLowerCase()?.includes(input.toLowerCase()) ?? false;
            }}
            options={prompts?.map((prompt) => ({
              label: (
                <span key={prompt.id} className="flex flex-row items-center gap-3">
                  {prompt.is_system ? <ComputerIcon className="w-4 h-4" /> : <ZapIcon className="w-4 h-4" />}
                  {prompt.title}
                </span>
              ),
              value: prompt.id,
            }))}
          />
        </div>
        <div className="lg:hidden">
          <PromptSelect
            selectedSystemPrompt={selectedSystemPrompt}
            setSelectedSystemPrompt={setSelectedSystemPrompt}
            setSelectedQuickPrompt={setSelectedQuickPrompt}
          />
        </div>
        <SelectedKnowledge />
      </div>

      {/* Header 右侧内容 */}
      <div className="flex justify-end flex-1 px-4">
        <div className="flex items-center ml-4 md:ml-6">
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* MoreOptions moving ????  */}
        <div className="flex items-center gap-4">
          {messages.length > 0 && !streaming && (
            <MoreOptions
              shareModeEnabled={shareModeEnabled}
              historyId={historyId}
              messages={messages}
            />
          )}

          {/* currentChatModelSettings*/}
          {!hideCurrentChatModelSettings && (
            < Tooltip title={t("common:currentChatModelSettings")}>
              <button
                onClick={() => setOpenModelSettings(true)}
                className="text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200 "
              >
                <BrainCog className="w-5 h-5 dark:hover:text-gray-100" />
              </button>
            </Tooltip>
          )}

          {/* ????? */}
          <Tooltip title={t("githubRepository")}>
            <a
              href="https://github.com/arkCyber/AuroraExt"
              target="_blank"
              className="hidden mx-1 text-gray-600 transition-colors lg:block dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200"
            >
              <AtSign className="w-5 h-5 dark:hover:text-gray-100" />
            </a>
          </Tooltip>


          <Tooltip title={t("Settings")}>
            <NavLink
              to="/settings"
              className="mx-2 text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-100"
            >
              <CogIcon className="w-6 h-6 dark:hover:text-gray-100" />
            </NavLink>
          </Tooltip>


          {/* 新增语言选择器 */}
          <Dropdown overlay={languageMenu} trigger={["hover", "click"]}>
            <Tooltip>
              <button aria-label="Toggle language" className="text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200">
                <Globe className="w-5 h-5 dark:hover:text-gray-100" />
              </button>


            </Tooltip>
          </Dropdown>


          {/* login ....... */}
          <Tooltip title={t("login/Register")}>
            <button className="text-gray-600 transition-colors dark:border-none dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200">

              <img
                src={UserImage}
                className="w-6 h-6 border border-gray-600 -ml-4rounded-full dark:border-gray-600"
                alt={t("login/Register")}
              />

            </button>
          </Tooltip>

        </div>
      </div>

      {/* 嵌入 CSS 动画 */}
      <style>
        {`
        @keyframes slideLeftRight{
            0% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            100% { transform: translateX(-10px); }
          }
        `}
      </style>
    </div >
  );
};