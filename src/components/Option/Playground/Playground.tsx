/**
 * Playground Component Module
 * 
 * This module implements a sophisticated chat interface with the following features:
 * - Theme-aware UI with dark/light mode support
 * - File drag and drop functionality
 * - Smart scrolling behavior for chat messages
 * - Animated border effects
 * - Background image handling based on theme
 * - Real-time chat message streaming
 */

import React, { useState, useEffect, useRef } from "react";
import { PlaygroundForm } from "./PlaygroundForm";
import { PlaygroundChat } from "./PlaygroundChat";
import { useMessageOption } from "@/hooks/useMessageOption";
import { webUIResumeLastChat } from "@/services/app";
import darkBackground from "./dark_background.jpg";
import lightBackground from "./light_background.jpg";
import {
  formatToChatHistory,
  formatToMessage,
  getPromptById,
  getRecentChatFromWebUI,
} from "@/db";
import { getLastUsedChatSystemPrompt } from "@/services/model-settings";
import { useStoreChatModelSettings } from "@/store/model";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import { ChevronDown } from "lucide-react";

/**
 * Animation keyframes for the breathing border effect
 * Creates a pulsing red border with shadow that smoothly transitions
 * 
 * The animation cycle:
 * 1. Starts with 50% opacity border and light shadow
 * 2. Transitions to 80% opacity border and stronger shadow at midpoint
 * 3. Returns to initial state
 * 
 * Uses rgba colors for better performance and smooth transitions
 */
const borderBreathKeyframes = `
@keyframes borderBreath {
  0% {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
  }
  50% {
    border-color: rgba(239, 68, 68, 0.8);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  }
  100% {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
  }
}`;

/**
 * Styling configuration for the border breath animation
 * Combines animation properties with Tailwind classes for consistent styling
 */
const borderBreathStyles = {
  animation: 'borderBreath 2s ease-in-out infinite',
  className: `
    border-red-500/50 
    shadow-[0_0_10px_rgba(239,68,68,0.2)]
    hover:border-red-500/80 
    hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]
    transition-all 
    duration-1000
  `
};

/**
 * Playground Component
 * 
 * A sophisticated chat interface component that provides:
 * - Real-time message streaming and display
 * - Theme-aware styling with dark/light mode support
 * - File drag-and-drop capabilities
 * - Smart scrolling behavior with auto-scroll functionality
 * - Animated visual feedback for user interactions
 * 
 * Component Structure:
 * - Main container with drop zone functionality
 * - Scrollable chat message area with theme-aware background
 * - Bottom section with scroll-to-bottom button and input form
 * 
 * @component
 * @returns {JSX.Element} The rendered Playground component
 */
export const Playground = () => {
  // =========== Refs and State Management ===========

  /**
   * Reference for the drop zone container
   * Used to handle file drag and drop events
   */
  const drop = useRef<HTMLDivElement>(null);

  /**
   * State for managing the currently dropped file
   * Updated when a user successfully drops a file in the drop zone
   */
  const [dropedFile, setDropedFile] = useState<File | undefined>();

  /**
   * Tracks the current theme mode (dark/light)
   * Updates automatically when system theme changes
   */
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  /**
   * Manages the current state of file drop interaction
   * - idle: Default state, no drag interaction
   * - dragging: File is being dragged over the drop zone
   * - error: Invalid file or drop operation
   */
  const [dropState, setDropState] = useState<"idle" | "dragging" | "error">("idle");

  // =========== Custom Hooks ===========

  /**
   * Hook for managing chat messages and options
   * Provides functionality for:
   * - Message history management
   * - Knowledge base selection
   * - System prompt configuration
   * - Message streaming state
   */
  const {
    selectedKnowledge,
    messages,
    setHistoryId,
    setHistory,
    setMessages,
    setSelectedSystemPrompt,
    streaming,
  } = useMessageOption();

  /**
   * Hook for managing system-level chat settings
   * Handles global system prompt configuration
   */
  const { setSystemPrompt } = useStoreChatModelSettings();

  /**
   * Smart scroll hook for managing scroll behavior
   * - Tracks scroll position
   * - Provides auto-scroll functionality
   * - Handles smooth scrolling to bottom
   */
  const { containerRef, isAtBottom, scrollToBottom } = useSmartScroll(messages, streaming);

  // =========== Effects ===========

  /**
   * Theme Observer Effect
   * 
   * Sets up:
   * 1. MutationObserver to watch for theme changes in document
   * 2. Adds border breath animation styles to document
   * 
   * Cleanup:
   * - Disconnects observer
   * - Removes animation styles
   */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Add border breath animation keyframes to document
    const style = document.createElement('style');
    style.textContent = borderBreathKeyframes;
    document.head.appendChild(style);

    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);

  // =========== Styling Configurations ===========

  /**
   * Dark mode background configuration
   * Applies a dark theme-optimized background image with overlay effects
   */
  const darkModeBackground = {
    backgroundImage: `url('${darkBackground}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay',
  };

  /**
   * Light mode background configuration
   * Applies a light theme-optimized background image with overlay effects
   */
  const lightModeBackground = {
    backgroundImage: `url('${lightBackground}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'normal',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay',
  };

  /**
   * Memoized background style
   * Prevents unnecessary recalculation of background styles
   * Updates only when theme changes
   */
  const backgroundStyle = React.useMemo(() => ({
    ...(isDarkMode ? darkModeBackground : lightModeBackground)
  }), [isDarkMode]);

  /**
   * Determines the background color during drag operations
   * Provides visual feedback for drag state based on current theme
   * 
   * @returns {string} Tailwind CSS classes for background color
   */
  const getDropBackgroundColor = () => {
    if (dropState === "dragging") {
      return isDarkMode ? "bg-gray-800" : "bg-gray-100";
    }
    return "";
  };

  /**
   * Combined container styles
   * Merges background styles with drag state opacity
   */
  const containerStyle = {
    ...backgroundStyle,
    ...(dropState === "dragging" && { opacity: 0.8 }),
  };

  return (
    <div
      ref={drop}
      className={`relative flex h-full flex-col items-center ${getDropBackgroundColor()}`}
    >
      {/* Main chat container with advanced styling features:
          - Custom scrollbar
          - Theme-aware background masks
          - Animated border breathing effect
          - Overflow handling for content */}
      <div
        ref={containerRef}
        className={`
          flex flex-col items-center w-full h-full px-5 
          overflow-x-hidden overflow-y-auto border-4 
          custom-scrollbar bg-bottom-mask-light 
          dark:bg-bottom-mask-dark mask-bottom-fade 
          will-change-mask ${borderBreathStyles.className}
        `}
        style={{
          ...containerStyle,
          animation: borderBreathStyles.animation,
        }}
      >
        <PlaygroundChat />
      </div>

      {/* Bottom section containing:
          1. Conditional scroll-to-bottom button
          2. Chat input form
          Positioned absolutely to maintain visibility */}
      <div className="absolute bottom-0 w-full">
        {/* Scroll to bottom button - Appears when not at bottom
            Features:
            - Floating button with shadow
            - Theme-aware styling
            - Bounce animation for attention
            - Centered positioning */}
        {!isAtBottom && (
          <div className="fixed left-0 right-0 z-20 flex justify-center bottom-36">
            <button
              onClick={scrollToBottom}
              className="bg-indigo-200 shadow border border-indigo-500 dark:border-none dark:bg-indigo-500 p-1.5 rounded-full pointer-events-auto animate-bounce"
            >
              <ChevronDown className="text-gray-600 size-4 dark:text-gray-300" />
            </button>
          </div>
        )}
        {/* Chat input form component
            Receives dropped file state for handling file uploads */}
        <PlaygroundForm dropedFile={dropedFile} />
      </div>
    </div>
  );
};