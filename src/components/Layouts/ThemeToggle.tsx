import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useDarkMode } from "~/hooks/useDarkmode"

const ThemeToggle = () => {
    const { mode, toggleDarkMode } = useDarkMode()
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        }
        return "light"
    })

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
        localStorage.setItem("theme", theme)
    }, [theme])

    const handleToggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        toggleDarkMode()
    }

    return (
        <button
            onClick={handleToggleTheme}
            className="p-1.5 mx-3 transition bg-gray-300 rounded-full dark:bg-gray-700 hover:bg-stone-500 dark:hover:bg-gray-500">
            {theme === "dark" ? (
                <SunIcon className="w-4 h-4 text-yellow-500" />
            ) : (
                <MoonIcon className="w-4 h-4 text-gray-800 hover:text-orange-300 dark:text-gray-200" />
            )}
        </button>
    )
}

export default ThemeToggle