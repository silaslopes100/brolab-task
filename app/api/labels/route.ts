import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())

    const { data: labels, error } = await supabase
      .from("labels")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      labels: (labels || []).map((l) => ({
        id: l.name,
        name: l.name,
        color: l.color,
      })),
    })
  } catch (err) {
    console.error("Error fetching labels:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_ETIQUETAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const labelName = name.toUpperCase()

    const { data, error } = await supabase
      .from("labels")
      .insert({
        name: labelName,
        color: color || "#6B7280",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      label: {
        id: data.name,
        name: data.name,
        color: data.color,
      },
    })
  } catch (err) {
    console.error("Error creating label:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_ETIQUETA" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { error } = await supabase.from("labels").delete().eq("name", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting label:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_ETIQUETA" },
      { status: 500 },
    )
  }
}
