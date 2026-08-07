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
              ? "border-[var(--br-danger)] bg-[var(--br-danger)]/10 text-[var(--br-danger)]"
              : t.type === "warning"
              ? "border-[var(--br-warn)] bg-[var(--br-warn)]/10 text-[var(--br-warn)]"
              : t.type === "success"
              ? "border-[var(--br-accent)] bg-[var(--br-accent)]/10 text-[var(--br-accent)]"
              : "border-[var(--br-accent)] bg-[var(--br-bg)] text-[var(--br-accent)]"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
