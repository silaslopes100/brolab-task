"use client"

import { useEffect, useRef, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function PwaSetup() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err)
      })
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShowBanner(true)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setShowBanner(false)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const install = async () => {
    const deferred = deferredPrompt.current
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === "accepted") setShowBanner(false)
    deferredPrompt.current = null
  }

  if (!showBanner || dismissed || installed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] border-t-2 border-[var(--br-accent)] bg-[var(--br-bg)] px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]">
      <div className="min-w-0">
        <div className="text-[var(--br-accent)] text-xs font-bold">[ INSTALAR_BROLABTASK ]</div>
        <div className="text-[var(--br-text-secondary)] text-[10px] truncate">
          instale como aplicativo e receba notificações push
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={install}
          className="h-11 px-3 border border-[var(--br-accent)] bg-[var(--br-accent)] text-black text-xs font-bold hover:bg-[var(--br-accent-strong)] transition-colors"
        >
          INSTALAR
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="h-11 px-3 border border-[var(--br-border)] text-[var(--br-text-secondary)] text-xs hover:border-[var(--br-accent)] transition-colors"
        >
          AGORA_NÃO
        </button>
      </div>
    </div>
  )
}