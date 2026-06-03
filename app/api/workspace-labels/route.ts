import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const CreateWorkspaceLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex ex: #ff4444"),
})

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())
    const { data, error } = await supabase.from("workspace_labels").select("*").order("name", { ascending: true })
    if (error) throw error
    return NextResponse.json({ labels: data || [] })
  } catch (err) {
    console.error("Error fetching workspace labels:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_ETIQUETAS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateWorkspaceLabelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { name, color } = parsed.data
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { data, error } = await supabase.from("workspace_labels").insert({ name: name.toUpperCase(), color }).select().single()
    if (error) throw error
    return NextResponse.json({ label: data })
  } catch (err) {
    console.error("Error creating workspace label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_ETIQUETA" }, { status: 500 })
  }
}
