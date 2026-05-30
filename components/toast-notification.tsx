"use client"

import { useState, useEffect, useCallback } from "react"

interface Toast {
  id: string
  message: string
  type: "info" | "success" | "warning" | "error"
}

let toastListeners: Array<(t: Toast) => void> = []

export function showToast(message: string, type: Toast["type"] = "info") {
  const toast: Toast = { id: Date.now().toString(), message, type }
  toastListeners.forEach((fn) => fn(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 4000)
    }
    toastListeners.push(handler)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border px-4 py-3 text-xs animate-in slide-in-from-right ${
            t.type === "error"
              ? "border-[#FF3333] bg-[#FF3333]/10 text-[#FF3333]"
              : t.type === "warning"
              ? "border-[#F97316] bg-[#F97316]/10 text-[#F97316]"
              : t.type === "success"
              ? "border-[#00FF66] bg-[#00FF66]/10 text-[#00FF66]"
              : "border-[#00FF66] bg-black text-[#00FF66]"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
