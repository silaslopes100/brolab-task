const TODOIST_API_URL = "https://api.todoist.com/rest/v2/tasks"

export function getTodoistToken(): string | null {
  return process.env.TODOIST_API_TOKEN || null
}

// Mapeia a prioridade do nosso sistema (labels alta/média/baixa) para o Todoist (p1-p4).
// Sem label de prioridade, usa p4 (padrão/normal).
export function mapTodoistPriority(labels: Array<{ name: string }>): number {
  const names = (labels || []).map((l) => (l.name || "").toLowerCase())
  if (names.includes("alta")) return 1
  if (names.includes("média") || names.includes("media")) return 3
  if (names.includes("baixa")) return 4
  return 4
}

// Cria uma tarefa no Todoist. Nunca lança exceção: em caso de erro,
// registra no log e retorna null (o fluxo principal não trava).
export async function createTodoistTask(input: {
  content: string
  description?: string
  priority?: number
  dueDate?: string
  token?: string
}): Promise<{ id: string } | null> {
  const token = input.token || getTodoistToken()
  if (!token) {
    console.error("[todoist] token nao configurado (TODOIST_API_TOKEN)")
    return null
  }

  const body: Record<string, unknown> = {
    content: input.content,
    priority: Math.min(4, Math.max(1, input.priority || 4)),
  }
  if (input.description) body.description = input.description
  if (input.dueDate) body.due_date = input.dueDate

  try {
    const res = await fetch(TODOIST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[todoist] falha ao criar tarefa:", res.status, text)
      return null
    }

    const data = await res.json()
    return { id: data.id }
  } catch (err) {
    console.error("[todoist] erro ao chamar a API:", err)
    return null
  }
}
