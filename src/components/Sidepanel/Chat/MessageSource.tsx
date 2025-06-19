/**
 * MessageSource Component
 * 
 * A component that displays a source reference for a message in the chat interface.
 * It renders as a clickable tag that shows either the source title, URL, or a default "Source" text.
 */

import React from "react"
import { Tag } from "antd"

/**
 * Props interface for the MessageSource component
 * @property {Object} source - The source information object
 * @property {string} [source.title] - The display title of the source
 * @property {string} [source.url] - The URL of the source
 * @property {string} [source.type] - The type of the source
 * @property {Function} [onSourceClick] - Callback function triggered when the source tag is clicked
 */
type Props = {
    source: {
        title?: string
        url?: string
        type?: string
    }
    onSourceClick?: (source: any) => void
}

/**
 * MessageSource Component
 * 
 * @param {Props} props - Component props containing source information and click handler
 * @returns {JSX.Element} A clickable tag displaying the source information
 */
export const MessageSource = ({ source, onSourceClick }: Props) => {
    return (
        <Tag
            // Apply styling for small text size, pointer cursor, and hover effect
            className="text-xs cursor-pointer hover:opacity-80"
            // Trigger the click handler when the tag is clicked
            onClick={() => onSourceClick?.(source)}
        >
            {/* Display the source title if available, otherwise show URL or default text */}
            {source.title || source.url || "Source"}
        </Tag>
    )
} 