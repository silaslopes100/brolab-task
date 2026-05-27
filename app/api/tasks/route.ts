import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Buscar tarefas com assignees e labels
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        *,
        task_assignees (
          user_id,
          users (id, name, username)
        ),
        task_labels (
          label_id,
          labels (id, name, color)
        ),
        comments (
          id,
          content,
          created_at,
          user_id,
          users (id, name, username)
        )
      `)
      .order("position", { ascending: true })

    if (error) throw error

    // Transformar dados para o formato esperado pelo frontend
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      columnId: task.column_id,
      position: task.position,
      createdAt: task.created_at,
      assignees: task.task_assignees?.map((ta: { users: { name: string } }) => ta.users?.name).filter(Boolean) || [],
      labels: task.task_labels?.map((tl: { labels: { id: string; name: string; color: string } }) => tl.labels).filter(Boolean) || [],
      comments: task.comments?.map((c: { id: string; content: string; created_at: string; user_id: string; users: { id: string; name: string; username: string } }) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        authorId: c.user_id,
        authorName: c.users?.name || "Unknown",
        mentions: [],
      })) || [],
    }))

    return NextResponse.json({ tasks: formattedTasks })
  } catch (err) {
    console.error("Error fetching tasks:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_TAREFAS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, columnId, position, assignees, createdBy } = await request.json()
    const supabase = await createClient()

    // Criar tarefa
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        column_id: columnId,
        position: position || 0,
        created_by: createdBy,
      })
      .select()
      .single()

    if (taskError) throw taskError

    // Adicionar assignees
    if (assignees && assignees.length > 0) {
      // Buscar IDs dos usuários pelos nomes
      const { data: users } = await supabase
        .from("users")
        .select("id, name")
        .in("name", assignees)

      if (users && users.length > 0) {
        const assigneeInserts = users.map((u) => ({
          task_id: task.id,
          user_id: u.id,
        }))
        await supabase.from("task_assignees").insert(assigneeInserts)
      }
    }

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        columnId: task.column_id,
        position: task.position,
        createdAt: task.created_at,
        assignees: assignees || [],
        labels: [],
        comments: [],
      },
    })
  } catch (err) {
    console.error("Error creating task:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_TAREFA" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, title, description, columnId, position, assignees, labels } = await request.json()
    const supabase = await createClient()

    // Atualizar tarefa
    const updates: Record<string, string | number> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (columnId !== undefined) updates.column_id = columnId
    if (position !== undefined) updates.position = position

    if (Object.keys(updates).length > 0) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)

      if (taskError) throw taskError
    }

    // Atualizar assignees se fornecidos
    if (assignees !== undefined) {
      // Remover assignees existentes
      await supabase.from("task_assignees").delete().eq("task_id", id)

      // Adicionar novos assignees
      if (assignees.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name")
          .in("name", assignees)

        if (users && users.length > 0) {
          const assigneeInserts = users.map((u) => ({
            task_id: id,
            user_id: u.id,
          }))
          await supabase.from("task_assignees").insert(assigneeInserts)
        }
      }
    }

    // Atualizar labels se fornecidos
    if (labels !== undefined) {
      // Remover labels existentes
      await supabase.from("task_labels").delete().eq("task_id", id)

      // Adicionar novos labels
      if (labels.length > 0) {
        const labelInserts = labels.map((label: { id: string }) => ({
          task_id: id,
          label_id: label.id,
        }))
        await supabase.from("task_labels").insert(labelInserts)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating task:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_TAREFA" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_TAREFA" }, { status: 500 })
  }
}
