/**
 * Header Component
 * 
 * This component serves as the main navigation and control bar for the application.
 * It includes:
 * - Model selection for AI models
 * - Prompt selection and management
 * - Language switching capabilities
 * - Theme toggling
 * - User profile and settings
 * - Various utility functions for chat management
 */

import { useStorage } from "@plasmohq/storage/hook";
import {
  BrainCog,
  ChevronLeft,
  ChevronRight,
  CogIcon,
  ComputerIcon,
  ZapIcon,
  AtSign,
  Globe,
  PanelLeftIcon
} from "lucide-react";

// Import assets and images
import logoImage from "~/assets/icon.png";
import UserImage from "~/assets/arkSong.png";
import defaultAvatar from "~/assets/default_avatar.png";

// Import necessary hooks and components
import { useTranslation } from "react-i18next";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { SelectedKnowledge } from "../Option/Knowledge/SelectedKnowledge";
import { ModelSelect } from "../Common/ModelSelect";
import { PromptSelect } from "../Common/PromptSelect";
import { useQuery } from "@tanstack/react-query";

// Import services and utilities
import { fetchChatModels } from "~/services/ollama";
import { useMessageOption } from "~/hooks/useMessageOption";
import { Tooltip, Dropdown, Menu, Select } from "antd";
import { getAllPrompts } from "@/db";
import { ProviderIcons } from "../Common/ProviderIcon";
import { NewChat } from "./NewChat";
import { PageAssistSelect } from "../Select";

import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { UserProfileDropdown } from './UserProfileDropdown';
import { Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { DatabaseService, UserProfile } from '../../services/database';

/**
 * Props interface for the Header component
 */
type Props = {
  setSidebarOpen: (open: boolean) => void;      // Function to control sidebar visibility
  setOpenModelSettings: (open: boolean) => void; // Function to control model settings modal
};

export const Header: React.FC<Props> = ({
  setOpenModelSettings,
  setSidebarOpen,
}) => {
  // Initialize translation and RTL support
  const { t, i18n } = useTranslation(["option", "common"]);
  const isRTL = i18n.dir() === "rtl";
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // Add effect to listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language changed to:', i18n.language);
      setCurrentLang(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Storage hooks for application state
  const [shareModeEnabled] = useStorage("shareMode", false);
  const [hideCurrentChatModelSettings] = useStorage("hideCurrentChatModelSettings", false);

  // Message options and chat state management
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

  // Fetch available chat models using React Query
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

  // Fetch all available prompts using React Query
  const { data: prompts, isLoading: isPromptLoading } = useQuery({
    queryKey: ["fetchAllPromptsLayout"],
    queryFn: getAllPrompts,
  });

  const { pathname } = useLocation();
  const navigate = useNavigate();

  /**
   * Get prompt information by ID
   * @param id Prompt ID
   * @returns Prompt object if found
   */
  const getPromptInfoById = (id: string) => {
    return prompts?.find((prompt) => prompt.id === id);
  };

  /**
   * Handle prompt selection changes
   * @param value Selected prompt ID
   */
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

  /**
   * Handle language change
   * @param language Language code to switch to
   */
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Language selection dropdown menu configuration
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
      <Menu.Item
        key="zh-TW"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("zh-TW")}
      >
        繁體中文
      </Menu.Item>
      <Menu.Item
        key="de"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("de")}
      >
        Deutsch
      </Menu.Item>
      <Menu.Item
        key="fr"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("fr")}
      >
        Français
      </Menu.Item>
      <Menu.Item
        key="uk"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("uk")}
      >
        Українська
      </Menu.Item>
      <Menu.Item
        key="ja"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("ja")}
      >
        日本語
      </Menu.Item>
      <Menu.Item
        key="ko"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("ko")}
      >
        한국어
      </Menu.Item>
      <Menu.Item
        key="ar"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("ar")}
      >
        العربية
      </Menu.Item>
      <Menu.Item
        key="ru"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("ru")}
      >
        Русский
      </Menu.Item>
      <Menu.Item
        key="es"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("es")}
      >
        Español
      </Menu.Item>
      <Menu.Item
        key="it"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("it")}
      >
        Italiano
      </Menu.Item>
      <Menu.Item
        key="pt-BR"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("pt-BR")}
      >
        Português (Brasil)
      </Menu.Item>
      <Menu.Item
        key="ml"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("ml")}
      >
        മലയാളം
      </Menu.Item>
      <Menu.Item
        key="fa"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("fa")}
      >
        فارسی
      </Menu.Item>
      <Menu.Item
        key="da"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("da")}
      >
        Dansk
      </Menu.Item>
      <Menu.Item
        key="no"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("no")}
      >
        Norsk
      </Menu.Item>
      <Menu.Item
        key="sv"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("sv")}
      >
        Svenska
      </Menu.Item>
      <Menu.Item
        key="th"
        className="text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => handleLanguageChange("th")}
      >
        ไทย
      </Menu.Item>
    </Menu>
  );

  // Initialize Chrome side panel options
  useEffect(() => {
    if (chrome?.sidePanel?.setOptions) {
      chrome.sidePanel.setOptions({
        path: "sidePanel.html",
        enabled: true,
      });
    }
  }, []);

  return (
    <div
      className={`absolute top-0 z-10 flex w-full flex-row overflow-x-auto lg:overflow-x-visible h-14 p-3 bg-stone-200 border-gray-500 border-b shadow-lg text-gray-600 dark:bg-gray-900 dark:drop-shadow-[8px_12px_16px_rgba(100,149,237,0.3)]
  dark:border-stone-600 border-opacity-50 ${temporaryChat && "!bg-gray-100 dark:!bg-black"
        }`}
    >
      {/* Left Section: Navigation and Model Selection */}
      <div className="flex items-center gap-2">
        {/* Back Navigation Button */}
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

        {/* Logo and Title */}
        <div className="flex">
          <div className="flex items-center gap-6">
            <img
              className="w-auto ml-4 h-7"
              src={logoImage}
              alt={t("common:pageAssist")}
            />
          </div>
          <Tooltip title="Aurora Enlightenment Teacher">
            <p className="flex items-center ml-2 mr-6 text-base text-zinc-800 dark:text-gray-200">{"Aurora"}</p>
          </Tooltip>
        </div>

        <NewChat clearChat={clearChat} setSidebarOpen={setSidebarOpen} />

        {/* Model Selection Section */}
        <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">{"/ Model "}</span>
        <div className="hidden lg:block">
          <Select
            className="border-gray-300 w-66"
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
            size="middle"
          />
        </div>

        {/* Mobile Model Selection */}
        <div className="lg:hidden">
          <ModelSelect />
        </div>

        {/* Prompt Selection Section */}
        <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">{"/ Prompt "}</span>
        <div className="hidden lg:block text-zinc-600 dark:text-zinc-350">
          <Select
            size="middle"
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

        {/* Mobile Prompt Selection */}
        <div className="lg:hidden">
          <PromptSelect
            selectedSystemPrompt={selectedSystemPrompt}
            setSelectedSystemPrompt={setSelectedSystemPrompt}
            setSelectedQuickPrompt={setSelectedQuickPrompt}
          />
        </div>

        {/* Knowledge Selection */}
        <SelectedKnowledge />
      </div>

      {/* Right Section: User Controls and Settings */}
      <div className="flex justify-end flex-1 px-4">
        {/* Theme Toggle */}
        <div className="flex items-center ml-4 md:ml-6">
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Additional Options and Settings */}
        <div className="flex items-center gap-4">
          {/* Current Chat Model Settings */}
          {!hideCurrentChatModelSettings && (
            <Tooltip title={t("common:currentChatModelSettings")}>
              <button
                onClick={() => setOpenModelSettings(true)}
                className="text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200"
              >
                <BrainCog className="w-5 h-5 dark:hover:text-gray-100" />
              </button>
            </Tooltip>
          )}

          {/* GitHub Repository Link */}

          {
            /*
          
          <Tooltip title={t("githubRepository")}>
            <a
              href="https://github.com/arkCyber/AuroraExt"
              target="_blank"
              className="hidden mx-1 text-gray-600 transition-colors lg:block dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200"
            >
              <AtSign className="w-5 h-5 dark:hover:text-gray-100" />
            </a>
          </Tooltip>

          // Email contact link
          [
            {
              key: 4,
              label: t("about.contactEmail"),
              icon: <Mail className="w-4 h-4" />,
              onClick: () => window.open("mailto:contact@example.com")
            }
          ]
            */
          }

          {/* Language Selection Dropdown */}
          <Dropdown overlay={languageMenu} trigger={["hover", "click"]}>
            <Tooltip>
              <button aria-label="Toggle language" className="text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-200">
                <Globe className="w-5 h-5 dark:hover:text-gray-100" />
              </button>
            </Tooltip>
          </Dropdown>
          {/* Settings Link */}
          <Tooltip title={t("settings")}>
            <NavLink
              to="/settings"
              className="text-gray-600 transition-colors dark:text-gray-300 hover:text-indigo-500 dark:hover:text-gray-100"
            >
              <CogIcon className="w-5 h-5 dark:hover:text-gray-100" />
            </NavLink>
          </Tooltip>


          {/* User Profile Dropdown */}
          <UserProfileDropdown />
        </div>
      </div>

      {/* CSS Animation for Navigation Arrows
       * Creates a smooth sliding motion for the back/forward navigation arrows
       * The animation:
       * 1. Starts at -10px (left)
       * 2. Moves to +10px (right) at 50%
       * 3. Returns to -10px (left) at 100%
       * 4. Repeats infinitely with ease-in-out timing
       * This creates a subtle "beckoning" effect to indicate navigation
       */}
      <style>
        {`
        @keyframes slideLeftRight{
            0% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            100% { transform: translateX(-10px); }
          }
        `}
      </style>
    </div>
  );
};