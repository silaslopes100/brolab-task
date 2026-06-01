# Usuários — Casos de Borda

> `edge-cases.md` | Módulo: `usuarios` | doc_level: detalhado

---

## EC-01: Username já com `@` no POST

- **Cenário:** `username = "@alice"`
- **Comportamento:** `startsWith("@") → true` → não duplica o prefixo 🟢
- **Resultado:** `username = "@alice"` (correto)

---

## EC-02: Username sem `@` no POST

- **Cenário:** `username = "alice"`
- **Comportamento:** `startsWith("@") → false` → `"@" + "alice" = "@alice"` 🟢

---

## EC-03: `role` não fornecido no POST

- **Cenário:** `role = undefined`
- **Comportamento:** `role?.toUpperCase()... || "COLLABORATOR"` → `"COLLABORATOR"` 🟢

---

## EC-04: `name` com múltiplos espaços

- **Cenário:** `name = "João  Silva  Jr"`
- **Comportamento:** `.replace(/\s+/g, "_")` → `"JOÃO_SILVA_JR"` 🟢

---

## EC-05: PATCH sem `id`

- **Cenário:** `body = { name: "novo" }` sem `id`
- **Comportamento:** `UPDATE WHERE id = undefined` → Supabase ignora ou erro
- **Resultado:** 🟡 Sem validação explícita de `id` no PATCH (diferente do DELETE)

---

## EC-06: Senha em PATCH

- **Cenário:** `{ id, password: "nova_senha" }` 
- **Comportamento:** `updates.password = "nova_senha"` → UPDATE sem hash 🔴
- **Resultado:** Nova senha armazenada em plaintext

---

## EC-07: Email duplicado no POST

- **Cenário:** Email já existente em `team_members`
- **Comportamento:** `INSERT` falha com unique constraint violation → catch throw → HTTP 500
- **Resultado:** 🟡 Erro genérico `"FALHA_AO_CRIAR_USUÁRIO"` sem indicar duplicidade

---

## EC-08: Fallback para `createClient()` no GET

- **Cenário:** `SUPABASE_SERVICE_ROLE_KEY` ausente
- **Comportamento:** `createAdminClient()` retorna null → `await createClient()` (SSR client)
- **Resultado:** 🟡 GET pode funcionar com RLS do usuário autenticado; pode expor dados errados
