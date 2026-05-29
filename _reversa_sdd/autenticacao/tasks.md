# Autenticação — Tarefas de Implementação

> `tasks.md` | Módulo: `autenticacao` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `team_members` existe com campos: `id`, `name`, `username`, `email`, `password`, `role`, `role_id`, `created_at`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada como variável de ambiente server-side
- [ ] `createAdminClient()` disponível em `lib/supabase/admin.ts`

---

## Tarefas

- [ ] T-01 — Criar o Route Handler `POST /api/auth/login`
  - Origem no legado: `app/api/auth/login/route.ts:4`
  - Critério de pronto: endpoint responde a POST com body `{ email, password }`
  - Confiança: 🟢

- [ ] T-02 — Implementar guard: retornar HTTP 500 se `createAdminClient()` retornar null
  - Origem no legado: `app/api/auth/login/route.ts:8-15`
  - Critério de pronto: ausência de `SUPABASE_SERVICE_ROLE_KEY` → `{ error: "..." }` com status 500
  - Confiança: 🟢

- [ ] T-03 — Normalizar o identificador: `toLowerCase().trim()` + construção do `usernameWithAt`
  - Origem no legado: `app/api/auth/login/route.ts:17-21`
  - Critério de pronto: `"  JOAO@EXAMPLE.COM  "` → `"joao@example.com"`; `"joao.silva"` → `"@joao.silva"`
  - Confiança: 🟢

- [ ] T-04 — Query 1: buscar membro por email (`maybeSingle`)
  - Origem no legado: `app/api/auth/login/route.ts:27-31`
  - Critério de pronto: encontra o usuário quando `loginIdentifier` é um email cadastrado
  - Confiança: 🟢

- [ ] T-05 — Query 2 (condicional): buscar membro por username se Query 1 falhar
  - Origem no legado: `app/api/auth/login/route.ts:33-40`
  - Critério de pronto: encontra o usuário quando `loginIdentifier` é um @username cadastrado
  - Confiança: 🟢

- [ ] T-06 — Retornar HTTP 401 se `user` for null após ambas as queries
  - Origem no legado: `app/api/auth/login/route.ts:42-46`
  - Critério de pronto: identificador inexistente → `{ error: "ERRO: CREDENCIAIS_INVÁLIDAS" }` + status 401
  - Confiança: 🟢

- [ ] T-07 — Comparar senha e retornar HTTP 401 se divergir
  - Origem no legado: `app/api/auth/login/route.ts:48-52`
  - Critério de pronto: senha incorreta → HTTP 401 com mesma mensagem de erro
  - Confiança: 🟢

- [ ] T-08 — Derivar `isAdmin` e montar objeto de resposta
  - Origem no legado: `app/api/auth/login/route.ts:54-65`
  - Critério de pronto: `role === "ADMIN_TOTAL"` ou `role === "ADMIN"` → `isAdmin: true`; demais roles → `isAdmin: false`
  - Confiança: 🟢

- [ ] T-09 — Implementar catch global com HTTP 500
  - Origem no legado: `app/api/auth/login/route.ts:68-72`
  - Critério de pronto: exceção não tratada → `{ error: "ERRO: FALHA_NO_SERVIDOR" }` + status 500
  - Confiança: 🟢

---

## Tarefas de Segurança (Melhorias Críticas — fora do legado)

- [ ] TS-01 — Substituir comparação plaintext por `bcrypt.compare()` ou `argon2.verify()`
  - Critério de pronto: senha armazenada como hash; login verifica hash corretamente
  - Confiança: 🔴 (não implementado no legado — tarefa de correção)

- [ ] TS-02 — Implementar rate limiting (ex: 5 tentativas / 15 min por IP)
  - Critério de pronto: exceder limite → HTTP 429 com `Retry-After`
  - Confiança: 🔴 (não implementado no legado — tarefa de correção)

- [ ] TS-03 — Emitir cookie de sessão assinado (HttpOnly, Secure, SameSite=Strict) após login bem-sucedido
  - Critério de pronto: resposta HTTP 200 inclui `Set-Cookie` com token seguro
  - Confiança: 🔴 (não implementado no legado — tarefa de correção)

- [ ] TS-04 — Adicionar validação de schema da entrada (Zod) antes de processar
  - Critério de pronto: body sem `email` ou `password` → HTTP 400 com erros de validação
  - Confiança: 🔴 (não implementado no legado — tarefa de correção)

---

## Tarefas de Teste

- [ ] TT-01 — Teste happy path: login por email válido
- [ ] TT-02 — Teste happy path: login por @username válido
- [ ] TT-03 — Teste de falha: senha incorreta → HTTP 401
- [ ] TT-04 — Teste de falha: identificador inexistente → HTTP 401
- [ ] TT-05 — Teste de falha: `SUPABASE_SERVICE_ROLE_KEY` ausente → HTTP 500
- [ ] TT-06 — Teste de role: `ADMIN_TOTAL` e `ADMIN` → `isAdmin: true`
- [ ] TT-07 — Teste de normalização: identificador com maiúsculas/espaços

---

## Ordem Sugerida

1. T-01 → T-02 (estrutura base)
2. T-03 → T-04 → T-05 (lógica de busca)
3. T-06 → T-07 (rejeição)
4. T-08 → T-09 (resposta e tratamento de erros)
5. TS-01 → TS-02 → TS-03 → TS-04 (segurança)

---

## Lacunas Pendentes (🔴)

- Hashing de senha: decisão necessária sobre algoritmo (bcrypt rounds vs argon2 params)
- Estratégia de sessão: cookie HttpOnly vs JWT vs Supabase Auth nativo
- `role_id`: campo retornado mas sem uso documentado — confirmar se pode ser omitido
