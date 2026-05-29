# Supabase — Tarefas

> `tasks.md` | Módulo: `lib-supabase`

---

## Tarefas

- [ ] T-01 — Configurar variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] T-02 — Implementar `createAdminClient()` com null-guard e `persistSession: false`
- [ ] T-03 — Implementar `createClient()` server com `@supabase/ssr` e cookie adapter
- [ ] T-04 — Implementar `createClient()` browser com `createBrowserClient`
- [ ] T-05 — Verificar que nenhuma instância é criada em variável global

## Tarefas de Teste

- [ ] TT-01 — `createAdminClient()` com key ausente retorna `null`
- [ ] TT-02 — `createAdminClient()` com key presente retorna cliente com `persistSession: false`
- [ ] TT-03 — `createClient()` server lê cookies corretamente em contexto async
