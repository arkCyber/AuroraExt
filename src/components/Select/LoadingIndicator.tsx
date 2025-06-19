import React from "react"

export const LoadingIndicator: React.FC<{ className?: string }> = ({
  className = ""
}) => (
  // Loading spinner component with smooth rotation animation
  // Uses Tailwind's animate-spin class for continuous rotation
  // The SVG contains:
  // 1. A background circle with 25% opacity for the track
  // 2. A spinning path with 75% opacity for the indicator
  // The animation creates a smooth, professional loading effect
  <div className={`animate-spin ${className}`}>
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
)
