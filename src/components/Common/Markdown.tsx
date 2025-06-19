import "katex/dist/katex.min.css"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import "property-information"
import React from "react"
import { CodeBlock } from "./CodeBlock"
import { preprocessLaTeX } from "@/utils/latex"

function Markdown({
  message,
  className = "prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 dark:prose-dark",
}: {
  message: string
  className?: string
}) {
  message = preprocessLaTeX(message)
  return (
    <div style={{ maxWidth: "160ch", width: "100%" }}> {/* 确保容器宽度为 100ch */}
      <ReactMarkdown
        className={className}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }) {
            return children
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline ? (
              <CodeBlock
                language={match ? match[1] : ""}
                value={String(children).replace(/\n$/, "")}
              />
            ) : (
              <code className={`${className} font-semibold`} {...props}>
                {children}
              </code>
            )
          },
          a({ node, ...props }) {
            return (
              <a
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-500 break-all hover:underline" // 确保长 URL 强制换行
                {...props}
              >
                {props.children}
              </a>
            )
          },
          p({ children }) {
            return (
              <p className="mb-2 break-words whitespace-normal last:mb-0"> {/* 确保文本不强制换行 */}
                {children}
              </p>
            )
          },
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown