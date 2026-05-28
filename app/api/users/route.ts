import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())
    const { data: users, error } = await supabase
      .from("team_members")
      .select("id, email, username, name, role, role_id, created_at")
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      users: (users || []).map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        role_id: u.role_id,
        isAdmin: u.role === "ADMIN_TOTAL" || u.role === "ADMIN",
      })),
    })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_USUÁRIOS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, username, email, password, role } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const finalUsername = username.startsWith("@") ? username : `@${username}`

    const { data: user, error } = await supabase
      .from("team_members")
      .insert({
        name: name.toUpperCase().replace(/\s+/g, "_"),
        username: finalUsername.toLowerCase(),
        email: email.toLowerCase(),
        password,
        role: role?.toUpperCase().replace(/\s+/g, "_") || "COLLABORATOR",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
        isAdmin: user.role === "ADMIN_TOTAL" || user.role === "ADMIN",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_USUÁRIO" },
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
    const { error } = await supabase.from("team_members").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_USUÁRIO" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, email, password, role } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const updates: Record<string, string> = {}
    if (name) updates.name = name.toUpperCase().replace(/\s+/g, "_")
    if (email) updates.email = email.toLowerCase()
    if (password) updates.password = password
    if (role) updates.role = role.toUpperCase().replace(/\s+/g, "_")

    const { data: user, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
        isAdmin: user.role === "ADMIN_TOTAL" || user.role === "ADMIN",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ATUALIZAR_USUÁRIO" },
      { status: 500 },
    )
  }
}
