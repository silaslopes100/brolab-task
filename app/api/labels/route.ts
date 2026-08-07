import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceId } from "@/lib/labels"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const LabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex ex: #ff4444"),
})

const UpdateLabelSchema = z.object({
  id: z.string().min(1, "ID obrigatório"),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex ex: #ff4444").optional(),
})

async function getClient() {
  return createAdminClient() ?? (await createClient())
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = resolveWorkspaceId(searchParams.get("workspaceId"))
    const supabase = await getClient()
    const { data, error } = await supabase
      .from("labels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true })
    if (error) throw error
    return NextResponse.json({ labels: data || [] })
  } catch (err) {
    console.error("Error fetching labels:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_ETIQUETAS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LabelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { name, color } = parsed.data
    const workspaceId = resolveWorkspaceId(body.workspaceId)
    const supabase = await getClient()
    const { data, error } = await supabase
      .from("labels")
      .insert({ workspace_id: workspaceId, name: name.toUpperCase(), color })
      .select()
      .single()
    if (error) {
      if (String(error.code).startsWith("23")) {
        return NextResponse.json({ error: "ERRO: ETIQUETA_JA_EXISTE" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ label: data })
  } catch (err) {
    console.error("Error creating label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_ETIQUETA" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = UpdateLabelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { id, ...rest } = parsed.data
    const updates: Record<string, unknown> = {}
    if (rest.name !== undefined) updates.name = rest.name.toUpperCase()
    if (rest.color !== undefined) updates.color = rest.color
    const supabase = await getClient()
    const { data, error } = await supabase
      .from("labels")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      if (String(error.code).startsWith("23")) {
        return NextResponse.json({ error: "ERRO: ETIQUETA_JA_EXISTE" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ label: data })
  } catch (err) {
    console.error("Error updating label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_ETIQUETA" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }
    const supabase = await getClient()
    const { error } = await supabase.from("labels").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_ETIQUETA" }, { status: 500 })
  }
}
