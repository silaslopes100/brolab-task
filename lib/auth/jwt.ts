import jwt from "jsonwebtoken"

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "brolab-access-secret-dev"
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "brolab-refresh-secret-dev"

export function getAccessTokenExpiry(): number {
  return 60 * 60 // 1 hora (antes 15min)
}

export function getRefreshTokenExpiry(): number {
  return 60 * 60 * 24 * 30 // 30 dias (antes 7d)
}

export interface JwtPayload {
  userId: string
  username: string
  role: string
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: getAccessTokenExpiry() })
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: getRefreshTokenExpiry() })
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload
  } catch {
    return null
  }
}
