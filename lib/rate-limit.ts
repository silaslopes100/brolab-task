const attemptMap = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const entry = attemptMap.get(key)

  if (!entry || now > entry.resetAt) {
    attemptMap.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInMs: WINDOW_MS }
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetInMs: entry.resetAt - now }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attemptMap) {
    if (now > entry.resetAt) attemptMap.delete(key)
  }
}, 60_000)
