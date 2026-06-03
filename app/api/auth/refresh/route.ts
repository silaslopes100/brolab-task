import { NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, signAccessToken, signRefreshToken, getAccessTokenExpiry, getRefreshTokenExpiry } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value
  if (!refreshToken) {
    return NextResponse.json({ error: "ERRO: TOKEN_AUSENTE" }, { status: 401 })
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    return NextResponse.json({ error: "ERRO: TOKEN_INVALIDO" }, { status: 401 })
  }

  const newPayload = { userId: payload.userId, username: payload.username, role: payload.role }
  const newAccessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  const response = NextResponse.json({ accessToken: newAccessToken })

  const isProd = process.env.NODE_ENV === "production"

  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: getRefreshTokenExpiry(),
  })

  response.cookies.set("access_token", newAccessToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: getAccessTokenExpiry(),
  })

  return response
}
