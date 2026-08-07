import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"
import { logActivity } from "@/lib/activities"
import { enqueueWebhookJob } from "@/lib/webhook-queue"

const TASK_ID_RE = /#([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g

// POST /api/webhooks/github — webhook configurado manualmente no repositório.
export async function POST(request: NextRequest) {
  const event = request.headers.get("x-github-event") || ""
  const deliveryId = request.headers.get("x-github-delivery") || crypto.randomUUID()

  if (!["push", "pull_request"].includes(event)) {
    // Ping de validação do GitHub
    return NextResponse.json({ received: true, deliveryId })
  }

  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ error: "ERRO: PAYLOAD_INVALIDO" }, { status: 400 })
  }

  // Processa assincronamente na fila; responde 200 imediatamente
  enqueueWebhookJob(async () => {
    const supabase = createAdminClient()
    if (!supabase) return

    const repoName = payload.repository?.full_name || ""
    if (!repoName) return

    // Só processa se o repositório estiver vinculado ao workspace
    const { data: integration } = await supabase
      .from("git_integrations")
      .select("id, provider")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("repository_full_name", repoName)
      .maybeSingle()
    if (!integration) return

    if (event === "push") {
      const branch = String(payload.ref || "").replace("refs/heads/", "")
      for (const commit of payload.commits || []) {
        const message = String(commit.message || "")
        for (const m of message.matchAll(TASK_ID_RE)) {
          const taskId = m[1].toLowerCase()
          const { data: task } = await supabase
            .from("tasks")
            .select("id")
            .eq("id", taskId)
            .maybeSingle()
          if (!task) continue

          await logActivity(supabase, {
            taskId,
            userId: null,
            action: "git_commit",
            newValue: {
              repo: repoName,
              sha: String(commit.id || "").slice(0, 7),
              message: message.split("\n")[0],
              branch,
              url: commit.url || null,
              author: commit.author?.name || commit.author?.username || null,
            },
          })
        }
      }
    } else if (event === "pull_request") {
      const pr = payload.pull_request
      if (!pr) return
      const text = `${pr.title || ""}\n${pr.body || ""}`
      for (const m of text.matchAll(TASK_ID_RE)) {
        const taskId = m[1].toLowerCase()
        const { data: task } = await supabase
          .from("tasks")
          .select("id")
          .eq("id", taskId)
          .maybeSingle()
        if (!task) continue

        await logActivity(supabase, {
          taskId,
          userId: null,
          action: "git_pr",
          newValue: {
            repo: repoName,
            number: pr.number ?? null,
            title: pr.title || "",
            state: pr.state || "",
            merged: !!pr.merged,
            url: pr.html_url || null,
            author: pr.user?.login || null,
          },
        })
      }
    }
  })

  return NextResponse.json({ received: true, queued: true, deliveryId })
}
