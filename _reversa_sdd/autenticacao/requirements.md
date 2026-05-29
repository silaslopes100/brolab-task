# Autenticação

> `requirements.md` | Módulo: `autenticacao` | granularity: hybrid
> Fonte: `app/api/auth/login/route.ts` | doc_level: detalhado

---

## Visão Geral

O módulo de autenticação é responsável por verificar a identidade de um membro da equipe e retornar os dados do usuário para o cliente. Aceita login por **email** ou **@username**. Não utiliza Supabase Auth — a lógica está inteiramente em um Route Handler customizado que consulta a tabela `team_members` diretamente. 🟢

---

## Responsabilidades

- Receber credenciais (identificador + senha) via HTTP POST 🟢
- Localizar o membro pelo email ou @username, nessa ordem de tentativa 🟢
- Comparar a senha fornecida com o valor armazenado em banco 🟢
- Derivar o flag `isAdmin` a partir do campo `role` 🟢
- Retornar o objeto do usuário autenticado ao cliente 🟢
- Retornar erro estruturado em caso de credenciais inválidas ou usuário não encontrado 🟢

---

## Regras de Negócio

- RN-01: O login aceita email **ou** @username como identificador; a busca é feita em dois passos sequenciais (email primeiro, username em seguida). 🟢
- RN-02: A senha é comparada como string simples (plaintext) — sem hashing. 🔴 LACUNA CRÍTICA — violação OWASP A02
- RN-03: `isAdmin` é `true` quando `role === "ADMIN_TOTAL"` ou `role === "ADMIN"`. 🟢
- RN-04: Se o membro não for encontrado por email nem por username, retorna HTTP 401. 🟢
- RN-05: Se a senha não corresponder, retorna HTTP 401. 🟢
- RN-06: Não existe invalidação de sessão server-side — o cliente mantém `currentUser` em `useState`. 🔴 LACUNA CRÍTICA
- RN-07: Não há rate limiting implementado no endpoint. 🔴 LACUNA — risco de brute force

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | Aceitar POST com `{ identifier, password }` e localizar o membro por email | Must | Dado email e senha válidos → retorna HTTP 200 com `{ user }` |
| RF-02 | Aceitar POST com `{ identifier, password }` e localizar o membro por @username quando não encontrado por email | Must | Dado @username e senha válidos → retorna HTTP 200 com `{ user }` |
| RF-03 | Rejeitar credenciais inválidas com HTTP 401 e mensagem `"Invalid credentials"` | Must | Dado senha incorreta → retorna HTTP 401 |
| RF-04 | Retornar `isAdmin: true` para roles `ADMIN_TOTAL` e `ADMIN` | Must | Dado usuário com role `ADMIN` → `user.isAdmin === true` |
| RF-05 | Retornar `isAdmin: false` para qualquer outro role | Must | Dado usuário com role `DEVELOPER` → `user.isAdmin === false` |
| RF-06 | Retornar HTTP 405 para métodos diferentes de POST | Should | GET /api/auth/login → HTTP 405 |

---

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Senha armazenada e comparada em plaintext (sem hash) | `app/api/auth/login/route.ts` | 🟢 CONFIRMADO (problema conhecido) |
| Segurança | Sem rate limiting no endpoint de login | Ausência de middleware | 🟢 CONFIRMADO (lacuna) |
| Segurança | Sem cookie/token server-side após login bem-sucedido | Resposta retorna apenas `{ user }` | 🟢 CONFIRMADO (lacuna) |
| Performance | Dois round-trips ao Supabase (email → username) no pior caso | `app/api/auth/login/route.ts:query1 + query2` | 🟢 |

---

## Critérios de Aceitação

```gherkin
# Cenário 1 — Login por email com senha correta
Dado que o membro "joao@example.com" existe em team_members com a senha "abc123"
Quando POST /api/auth/login com { "identifier": "joao@example.com", "password": "abc123" }
Então a resposta é HTTP 200
E o corpo contém { "user": { "email": "joao@example.com", "isAdmin": false } }

# Cenário 2 — Login por @username com senha correta
Dado que o membro com username "@joao.silva" existe em team_members
Quando POST /api/auth/login com { "identifier": "@joao.silva", "password": "abc123" }
Então a resposta é HTTP 200
E o corpo contém { "user": { "username": "@joao.silva" } }

# Cenário 3 — Senha incorreta
Dado que o membro "joao@example.com" existe
Quando POST /api/auth/login com { "identifier": "joao@example.com", "password": "senha_errada" }
Então a resposta é HTTP 401
E o corpo contém { "error": "Invalid credentials" }

# Cenário 4 — Identificador inexistente
Dado que "ninguem@example.com" não existe em team_members
Quando POST /api/auth/login com { "identifier": "ninguem@example.com", "password": "qualquer" }
Então a resposta é HTTP 401

# Cenário 5 — Admin role
Dado que o membro possui role = "ADMIN_TOTAL"
Quando o login ocorre com sucesso
Então o corpo contém { "user": { "isAdmin": true } }

# Cenário 6 — Non-admin role
Dado que o membro possui role = "DEVELOPER"
Quando o login ocorre com sucesso
Então o corpo contém { "user": { "isAdmin": false } }
```

---

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Login por email | Must | Fluxo primário — entrada da aplicação |
| Login por @username | Must | Fluxo alternativo documentado em ADR-004 |
| Derivação de isAdmin | Must | Controla exibição de funcionalidades admin no SPA |
| Rejeição de credenciais inválidas | Must | Segurança mínima do sistema |
| Rate limiting | Won't | Não implementado atualmente — lacuna documentada |
| Sessão server-side (token/cookie) | Won't | Não implementado atualmente — lacuna documentada |

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/auth/login/route.ts` | `POST handler` | 🟢 |
| `lib/supabase/admin.ts` | `createAdminClient()` | 🟢 |
| `app/page.tsx` | `handleLogin()` + `currentUser state` | 🟢 |
