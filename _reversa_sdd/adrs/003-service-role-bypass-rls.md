# ADR-003 — Service Role Key nas API Routes (Bypass de RLS)

> Status: ACEITO | Data: 2026-05-28 | Confiança: 🟢 CONFIRMADO

---

## Contexto

As API Routes do Next.js fazem chamadas ao Supabase para ler e escrever dados. Inicialmente, essas chamadas usavam a chave anônima (`SUPABASE_ANON_KEY`), que está sujeita ao Row Level Security (RLS) do Supabase. Como o banco não tem políticas RLS configuradas, havia erros de acesso.

Evidências:
- Commit `3115a01 feat: implement createAdminClient for Supabase integration and update API routes` (2026-05-28) — criou `lib/supabase/admin.ts` e atualizou todas as API routes para usar o admin client
- `lib/supabase/admin.ts`: `createClient(url, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })`
- Commit altera: `app/api/auth/login/route.ts`, `app/api/comments/route.ts`, `app/api/tasks/route.ts`
- `createAdminClient()` retorna `null` se `SERVICE_ROLE_KEY` não estiver definido (graceful degradation)

## Decisão

Criar um cliente Supabase com `SERVICE_ROLE_KEY` (service role) para uso exclusivo nas API Routes server-side, com `persistSession: false` e `autoRefreshToken: false`.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| Configurar políticas RLS com anon key | Requer modelagem de políticas RLS para cada tabela; mais complexo |
| Supabase Auth + RLS por `auth.uid()` | Incompatível com autenticação customizada (ADR-002) — sem auth.uid() disponível |
| Chamar Supabase diretamente do frontend | 🔴 Expõe a service role key no cliente; impossível |

## Consequências

**Positivas:**
- Acesso total ao banco sem necessidade de políticas RLS
- Simplicidade de implementação — sem configuração de políticas por tabela
- `persistSession: false` correto para uso server-side (sem vazamento de sessão entre requests)

**Negativas:**
- 🔴 **CRÍTICO:** A service role key ignora completamente o RLS — qualquer vulnerabilidade nas API Routes pode resultar em acesso irrestrito ao banco inteiro
- 🟡 Sem camada de autorização nas API Routes — qualquer chamada HTTP direta aos endpoints tem acesso total ao banco (sem verificar quem está chamando)
- 🟡 Se a service role key vazar para o cliente, é catastrófico
