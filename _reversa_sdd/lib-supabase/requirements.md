# Supabase — Clientes

> `requirements.md` | Módulo: `lib-supabase` | granularity: module
> Fontes: `lib/supabase/admin.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`
> doc_level: detalhado

---

## Visão Geral

Três fábricas de cliente Supabase com escopos e privilégios distintos. Cada arquivo exporta uma função `createClient()` ou `createAdminClient()`. Nenhum deles deve ser instanciado em variáveis globais — a criação deve ocorrer dentro de funções. 🟢

---

## Três Fábricas

| Arquivo | Exportação | Escopo | Privilégio | Usa Cookies |
|---------|-----------|--------|-----------|------------|
| `admin.ts` | `createAdminClient()` | Server | Service Role (ignora RLS) | Não |
| `server.ts` | `createClient()` | Server (SSR) | Anon Key + RLS | Sim (Next.js cookies) |
| `client.ts` | `createClient()` | Browser (CSR) | Anon Key + RLS | Não (browser storage) |

---

## `admin.ts` — Service Role Client

- **Propósito:** Operações administrativas que bypassam RLS 🟢
- **Retorna `null` se `SUPABASE_SERVICE_ROLE_KEY` ausente** — todos os handlers verificam isso 🟢
- **`autoRefreshToken: false`, `persistSession: false`** — stateless por design 🟢
- **Header:** `X-Client-Info: brolab-task-admin`
- **Variável:** `SUPABASE_SERVICE_ROLE_KEY` (server-only, não exposta ao browser) 🟢

---

## `server.ts` — SSR Client

- **Propósito:** Acesso ao Supabase em Server Components/Route Handlers com contexto de sessão do usuário 🟢
- **Async:** requer `await cookies()` — só pode ser chamado em contexto async 🟢
- **Fallback de `anonKey`:** aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY` OU `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 🟢
- **`setAll` com try/catch:** silencia erros ao chamar de Server Components 🟢
- **Usada como fallback no GET `/api/users`** quando admin client é null 🟡

---

## `client.ts` — Browser Client

- **Propósito:** Acesso ao Supabase no browser (Client Components) 🟢
- **Usado em:** `app/page.tsx` para Supabase Realtime (canal de notificações) 🟢
- **Mesmo fallback de `anonKey`** que `server.ts` 🟢
- **Sync:** não requer `await` — pode ser instanciado diretamente 🟢

---

## Variáveis de Ambiente Requeridas

| Variável | Tipo | Obrigatoriedade |
|---------|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública | Obrigatória para todos |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon | Obrigatória para server/client |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave anon (alias) | Alternativa ao anterior |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta | Obrigatória para admin (opcional gracioso) |

---

## Rastreabilidade

| Arquivo | Função | Usada por |
|---------|--------|-----------|
| `lib/supabase/admin.ts` | `createAdminClient()` | Todos os route handlers API |
| `lib/supabase/server.ts` | `createClient()` | `/api/auth/login`, `/api/users` (fallback), middleware |
| `lib/supabase/client.ts` | `createClient()` | `app/page.tsx` (Realtime) |
