import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        {
          error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA",
        },
        { status: 500 },
      )
    }

    const loginIdentifier = email.toLowerCase().trim()
    const usernameWithAt = loginIdentifier.startsWith("@")
      ? loginIdentifier
      : `@${loginIdentifier.replace(/^@/, "")}`

    let user = null
    let error = null

    const byEmail = await supabase
      .from("team_members")
      .select("*")
      .eq("email", loginIdentifier)
      .maybeSingle()

    if (byEmail.data) {
      user = byEmail.data
    } else {
      const byUsername = await supabase
        .from("team_members")
        .select("*")
        .eq("username", usernameWithAt)
        .maybeSingle()
      user = byUsername.data
      error = byUsername.error
    }

    if (error || !user) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 },
      )
    }

    if (user.password !== password) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 },
      )
    }

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
      { error: "ERRO: FALHA_NO_SERVIDOR" },
      { status: 500 },
    )
  }
}
