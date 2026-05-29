# Autenticação — Design Técnico

> `design.md` | Módulo: `autenticacao` | doc_level: detalhado
> Fonte: `app/api/auth/login/route.ts`

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| POST | `/api/auth/login` | `{ email: string, password: string }` | `{ user: UserObject }` ou `{ error: string }` | 200, 401, 500 |

> 🟡 O campo de entrada é nomeado `email` no JSON, mas aceita @username como valor — o nome é enganoso.

**UserObject retornado em caso de sucesso:**
```ts
{
  id: string           // UUID
  name: string
  username: string     // prefixado com "@"
  email: string
  role: string         // "ADMIN_TOTAL" | "ADMIN" | outros
  role_id: string | null
  isAdmin: boolean     // derivado: role === "ADMIN_TOTAL" || role === "ADMIN"
}
```

---

## Fluxo Principal

1. Recebe `POST /api/auth/login` com body `{ email, password }` 🟢
2. Instancia `createAdminClient()` — retorna `null` se `SUPABASE_SERVICE_ROLE_KEY` não está configurada → HTTP 500 🟢
3. Normaliza o identificador: `loginIdentifier = email.toLowerCase().trim()` 🟢
4. Constrói `usernameWithAt`: se não começa com `@`, prefixa com `@` 🟢
5. **Query 1:** `SELECT * FROM team_members WHERE email = loginIdentifier LIMIT 1` 🟢
6. Se `byEmail.data` existir → `user = byEmail.data` (pula query 2) 🟢
7. Se não → **Query 2:** `SELECT * FROM team_members WHERE username = usernameWithAt LIMIT 1` 🟢
8. Se `user` ainda for `null` → HTTP 401 `"ERRO: CREDENCIAIS_INVÁLIDAS"` 🟢
9. Compara `user.password !== password` (plaintext) → HTTP 401 se diferente 🟢
10. Monta e retorna `UserObject` com `isAdmin` derivado → HTTP 200 🟢

---

## Fluxos Alternativos

- **Supabase admin client null:** `SUPABASE_SERVICE_ROLE_KEY` ausente → HTTP 500 com mensagem `"ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA"` 🟢
- **Exceção inesperada (catch):** qualquer erro não tratado → HTTP 500 `"ERRO: FALHA_NO_SERVIDOR"` 🟢
- **Identificador é @username:** a query por email falha (não é email válido), a segunda query por username encontra o usuário 🟢
- **Identificador sem prefixo @:** `usernameWithAt` é construído adicionando `@` antes de tentar a segunda query 🟢

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` — acesso à tabela `team_members` via service_role 🟢
- `team_members` (tabela Supabase) → campos: `id`, `name`, `username`, `email`, `password`, `role`, `role_id` 🟢

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Split query (email primeiro, username depois) para evitar falha em `.or()` com `@` no valor | `app/api/auth/login/route.ts:27-45` + ADR-004 | 🟢 |
| Campo de input nomeado `email` mas aceita qualquer identificador | `const { email, password } = await request.json()` | 🟢 |
| `isAdmin` computado on-the-fly, não armazenado | `isAdmin: user.role === "ADMIN_TOTAL" \|\| user.role === "ADMIN"` | 🟢 |
| Comparação de senha em plaintext | `user.password !== password` | 🟢 |
| Sem cookie/token na resposta — estado de sessão exclusivamente no cliente | Retorno apenas `{ user }` sem `Set-Cookie` | 🟢 |

---

## Estado Interno

Este módulo é **stateless** no servidor. Nenhum estado de sessão é mantido após a resposta. O `currentUser` vive exclusivamente em `useState` no `app/page.tsx`. 🟢

---

## Observabilidade

Nenhum log estruturado emitido. Erros são retornados como strings no corpo JSON. 🟢 (ausência confirmada)

---

## Riscos e Lacunas

- 🔴 Senha em plaintext — `user.password !== password` sem bcrypt/argon2 (OWASP A02)
- 🔴 Sem rate limiting — endpoint suscetível a brute force
- 🔴 Sem sessão server-side — logout é apenas `setCurrentUser(null)` no cliente; token jamais é invalidado
- 🔴 Sem validação de schema de entrada (Zod/etc.) — body malformado cai no `catch` genérico
- 🟡 `role_id` retornado mas não documentado em nenhum outro artefato — uso desconhecido
