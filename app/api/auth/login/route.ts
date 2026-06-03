import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const BCRYPT_PREFIX = "$2a$"

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

<<<<<<< HEAD
    if (user.password !== password) {
=======
    let passwordValid = false

    if (user.password.startsWith(BCRYPT_PREFIX)) {
      passwordValid = await bcrypt.compare(password, user.password)
    } else if (user.password === password) {
      passwordValid = true
      const hashed = await bcrypt.hash(password, 10)
      await supabase.from("team_members").update({ password: hashed }).eq("id", user.id)
    }

    if (!passwordValid) {
>>>>>>> parent of 6786381 (renomear função de middleware para proxy e ajustar lógica de autenticação)
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
