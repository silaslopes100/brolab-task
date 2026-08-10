"use client"

import { useEffect, useState } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64Url)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export default function PushToggle() {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
  )
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => setEnabled(false))
  }, [supported])

  const enable = async () => {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        if (!VAPID_PUBLIC_KEY) {
          console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada")
          return
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      const res = await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setEnabled(true)
    } catch (err) {
      console.error("Erro ao ativar push:", err)
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch("/api/push/register", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        })
      }
      setEnabled(false)
    } catch (err) {
      console.error("Erro ao desativar push:", err)
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={enabled ? disable : enable}
      disabled={busy}
      className={`h-10 px-3 border text-xs transition-colors disabled:opacity-50 ${
        enabled
          ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
          : "border-[var(--br-border)] text-[var(--br-accent)] hover:border-[var(--br-accent)]"
      }`}
      title={enabled ? "Desativar notificações push" : "Ativar notificações push"}
    >
      [ {busy ? "..." : enabled ? "PUSH_ON" : "PUSH_OFF"} ]
    </button>
  )
}