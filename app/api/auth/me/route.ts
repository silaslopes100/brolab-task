import { NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ user: null })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ user: null })
    }

    const { data: user, error } = await supabase
      .from("team_members")
      .select("id, email, username, name, role, role_id, avatar_url")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ user: null })
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
        avatarUrl: user.avatar_url || null,
      },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
