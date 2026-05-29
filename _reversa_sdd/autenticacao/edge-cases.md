# Autenticação — Casos de Borda

> `edge-cases.md` | Módulo: `autenticacao` | doc_level: detalhado

---

## EC-01 — Identificador sem prefixo `@` como username

**Cenário:** Usuário digita `joao.silva` sem `@` na intenção de fazer login por username.

**Comportamento atual:** O código constrói `usernameWithAt = "@joao.silva"` e tenta a Query 2. Se `team_members.username = "@joao.silva"`, o login funciona. 🟢

**Risco:** Se o username no banco não tiver o prefixo `@`, o login falha mesmo que o identificador seja válido. 🟡

---

## EC-02 — Identificador que é simultaneamente email e começa com `@`

**Cenário:** Usuário digita `@joao@example.com` (improvável mas possível).

**Comportamento atual:** A Query 1 (por email) compara com `@joao@example.com` — não encontra. A Query 2 tenta username `@@joao@example.com` — não encontra. Retorna 401. 🟡

---

## EC-03 — Identificador com letras maiúsculas

**Cenário:** Usuário digita `JOAO@EXAMPLE.COM` ou `@JOAO.SILVA`.

**Comportamento atual:** `.toLowerCase().trim()` normaliza para `joao@example.com` ou `@joao.silva`. Se o banco armazena em lowercase, funciona. Se não, pode falhar. 🟡

---

## EC-04 — Senha com espaços ou caracteres especiais

**Cenário:** Senha contém espaços: `"minha senha"`.

**Comportamento atual:** Nenhum trim é aplicado à senha — a comparação é literal. Se o banco armazena com espaços, funciona. Se não, falha silenciosamente. 🟡

---

## EC-05 — `SUPABASE_SERVICE_ROLE_KEY` ausente

**Cenário:** Deploy sem a variável de ambiente configurada.

**Comportamento atual:** `createAdminClient()` retorna `null`. O handler retorna HTTP 500 com mensagem específica antes de qualquer query. 🟢

---

## EC-06 — Body malformado (sem `email` ou `password`)

**Cenário:** `POST` com body `{}` ou body que não é JSON.

**Comportamento atual:** `const { email, password } = await request.json()` — `email` e `password` serão `undefined`. O `.toLowerCase()` lança `TypeError`. O `catch` captura e retorna HTTP 500 `"ERRO: FALHA_NO_SERVIDOR"`. 🟢 (funciona mas mensagem genérica)

**Melhoria:** Validação explícita com Zod → HTTP 400 com detalhe do campo inválido.

---

## EC-07 — Dois membros com o mesmo email

**Cenário:** Dados inconsistentes no banco — dois registros com o mesmo email.

**Comportamento atual:** `.maybeSingle()` retorna erro se mais de um resultado for encontrado. O `error` é propagado para a condição `if (error || !user)` → HTTP 401. 🟡

---

## EC-08 — Timeout de rede para o Supabase

**Cenário:** Supabase indisponível ou lento.

**Comportamento atual:** Nenhum timeout explícito configurado. A requisição pendura até o timeout padrão do Node.js. O `catch` captura se a promise rejeitar → HTTP 500. 🟡
