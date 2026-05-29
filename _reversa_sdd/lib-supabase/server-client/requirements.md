# Server Client — Requirements

> `lib-supabase/server-client/requirements.md`

## Função: `createClient()` (server)

**Localização:** `lib/supabase/server.ts`

### Contrato
- **Async** — requer `await cookies()` do Next.js
- Usa `createServerClient` de `@supabase/ssr`
- Anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Cookie adapter: `getAll()` lê todos os cookies; `setAll()` define com try/catch silencioso
- Respeita RLS baseado na sessão do usuário

### Regra
Deve ser instanciada dentro da função handler — **nunca em variável global**.
(Comentário no código: "Don't put in global variable — Fluid compute")

### Usada por
- `app/api/users/route.ts` (GET, como fallback se admin client null)
- Pode ser usada em middleware de autenticação futuramente
