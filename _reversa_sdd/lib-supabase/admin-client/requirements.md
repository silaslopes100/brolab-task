# Admin Client — Requirements

> `lib-supabase/admin-client/requirements.md`

## Função: `createAdminClient()`

**Localização:** `lib/supabase/admin.ts`

### Contrato
- Lê `SUPABASE_SERVICE_ROLE_KEY` do ambiente
- Se ausente → retorna `null` (não lança exceção)
- Se presente → retorna cliente Supabase com service role
- `autoRefreshToken: false` — sem refresh automático de token
- `persistSession: false` — stateless, sem armazenamento de sessão
- Header `X-Client-Info: brolab-task-admin`

### Comportamento de Segurança
- 🟢 Chave não exposta ao browser (só server-side)
- 🟢 `persistSession: false` evita vazamento de sessão admin
- 🟡 Retorno `null` em vez de erro pode mascarar misconfiguration de ambiente

### Usada por
Todos os Route Handlers em `app/api/*/route.ts`
