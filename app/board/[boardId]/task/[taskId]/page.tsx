"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"

export default function TaskLinkPage() {
  const params = useParams<{ boardId: string; taskId: string }>()
  const router = useRouter()
  const [state, setState] = useState<"checking" | "denied">("checking")

  useEffect(() => {
    const boardId = params?.boardId
    const taskId = params?.taskId
    if (!taskId) {
      router.replace("/")
      return
    }

    if (boardId !== DEFAULT_WORKSPACE_ID) {
      setState("denied")
      return
    }

    const go = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData.user) {
            const subtask = new URLSearchParams(window.location.search).get("subtask")
            const target = `/?task=${encodeURIComponent(taskId)}${subtask ? `&subtask=${encodeURIComponent(subtask)}` : ""}`
            router.replace(target)
            return
          }
        }
      } catch {
        // fallback abaixo
      }
      router.replace("/")
    }
    go()
  }, [params, router])

  if (state === "denied") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-[#FF3333] bg-black max-w-md w-full p-6">
          <div className="text-[#FF3333] font-bold text-sm mb-4">{">"} SEM_PERMISSAO</div>
          <div className="text-white/70 text-xs mb-6">
            Este workspace não está disponível nesta instância. Verifique o link ou entre em contato com o administrador.
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors"
          >
            [ VOLTAR ]
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-[#00FF66] text-xs animate-pulse">REDIRECIONANDO...</span>
    </div>
  )
}
