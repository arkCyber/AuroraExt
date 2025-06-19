import { setBadgeBackgroundColor, setBadgeText, setTitle } from "@/utils/action"
import fetcher from "@/libs/fetcher"

export const progressHuman = (completed: number, total: number) => {
    return ((completed / total) * 100).toFixed(0) + "%"
}

export const clearBadge = () => {
    setBadgeText({ text: "" } as any)
    setTitle({ title: "" } as any)
}
export const streamDownload = async (url: string, model: string) => {
    url += "/api/pull"
    const response = await fetcher(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, stream: true })
    })

    const reader = response.body?.getReader()

    const decoder = new TextDecoder()

    let isSuccess = true
    while (true) {
        if (!reader) {
            break
        }
        const { done, value } = await reader.read()

        if (done) {
            break
        }

        const text = decoder.decode(value)
        try {
            const json = JSON.parse(text.trim()) as {
                status: string
                total?: number
                completed?: number
            }
            if (json.total && json.completed) {
                setBadgeText({
                    text: progressHuman(json.completed, json.total)
                } as any)
                setBadgeBackgroundColor({ color: "#0000FF" } as any)
            } else {
                setBadgeText({ text: "🏋️‍♂️" } as any)
                setBadgeBackgroundColor({ color: "#FFFFFF" } as any)
            }

            setTitle({ title: json.status } as any)

            if (json.status === "success") {
                isSuccess = true
            }
        } catch (e) {
            console.error(e)
        }
    }

    if (isSuccess) {
        setBadgeText({ text: "✅" } as any)
        setBadgeBackgroundColor({ color: "#00FF00" } as any)
        setTitle({ title: "Model pulled successfully" } as any)
    } else {
        setBadgeText({ text: "❌" } as any)
        setBadgeBackgroundColor({ color: "#FF0000" } as any)
        setTitle({ title: "Model pull failed" } as any)
    }

    setTimeout(() => {
        clearBadge()
    }, 5000)
}