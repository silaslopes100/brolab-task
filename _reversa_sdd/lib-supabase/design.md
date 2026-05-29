# Supabase — Design Técnico

> `design.md` | Módulo: `lib-supabase` | doc_level: detalhado

---

## `createAdminClient()` — admin.ts

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return null

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "brolab-task-admin" } },
    },
  )
}
```

**Padrão de uso nos handlers:**
```ts
const supabase = createAdminClient()
if (!supabase) return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
```

---

## `createClient()` — server.ts

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
               ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  return createServerClient(url, anonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => { try { items.forEach(({name,value,options}) => cookieStore.set(name,value,options)) } catch {} }
    }
  })
}
```

---

## `createClient()` — client.ts

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
               ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return createBrowserClient(url!, anonKey!)
}
```

---

## Hierarquia de Privilégios

```
createAdminClient()    ← service role → ignora RLS → operações admin
createClient(server)   ← anon key + cookies → respeita RLS + sessão do user
createClient(browser)  ← anon key → respeita RLS + autenticação browser
```

---

## Realtime (client.ts)

Usado em `app/page.tsx` para escutar INSERT em `notifications`:
```ts
const supabase = createClient()
supabase.channel(`notifications_user_${userId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'notifications', filter: `user_id=eq.${userId}` }, handler)
  .subscribe()
```
