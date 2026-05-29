# Usuários

> `requirements.md` | Módulo: `usuarios` | granularity: hybrid
> Fonte: `app/api/users/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo CRUD completo de membros da equipe. Suporta listagem (GET), criação (POST), atualização parcial (PATCH) e remoção (DELETE). Dados persitidos na tabela `team_members`. Único módulo que usa **fallback** de cliente: `createAdminClient() ?? (await createClient())`. 🟢

---

## Responsabilidades

- Listar todos os membros da equipe 🟢
- Criar novo membro com nome, username, email, senha e papel 🟢
- Atualizar campos parciais de um membro 🟢
- Remover membro por `id` 🟢

---

## Regras de Negócio

- RN-01: GET usa fallback: `createAdminClient() ?? createClient()` 🟡
- RN-02: GET ordena por `created_at ASC` 🟢
- RN-03: `isAdmin = role === "ADMIN_TOTAL" || role === "ADMIN"` 🟢
- RN-04: POST normaliza `name` → `name.toUpperCase().replace(/\s+/g, "_")` 🟢
- RN-05: POST normaliza `username` → prefixado com `@`, toLowerCase 🟢
- RN-06: POST normaliza `email` → `email.toLowerCase()` 🟢
- RN-07: POST normaliza `role` → `role.toUpperCase().replace(/\s+/g, "_") || "COLLABORATOR"` 🟢
- RN-08: PATCH aceita campos parciais (`name`, `email`, `password`, `role`) 🟢
- RN-09: PATCH não permite atualizar `username` 🟡
- RN-10: DELETE por `id` via query string (HTTP 400 se ausente) 🟢
- RN-11: **Senha armazenada em texto puro** — sem hash 🔴 CRÍTICO

---

## Issues Críticas

| Severidade | Problema |
|-----------|---------|
| 🔴 CRÍTICO | Senha armazenada em plaintext na coluna `password` |
| 🔴 CRÍTICO | Sem autenticação — qualquer cliente pode criar, atualizar ou deletar usuários |
| 🟡 ALTO | Fallback para `createClient()` em GET pode expor dados se service role falhar |
| 🟡 MÉDIO | `username` não pode ser atualizado via PATCH |

---

## Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-01 | GET retorna todos os membros com `isAdmin` calculado | Must |
| RF-02 | POST cria membro com normalização de campos | Must |
| RF-03 | PATCH atualiza parcialmente campos permitidos | Must |
| RF-04 | DELETE remove membro por `id` | Must |

---

## Critérios de Aceite

```gherkin
# Listar
Quando GET /api/users
Então HTTP 200 { users: [...] } com isAdmin calculado, ordenados por created_at ASC

# Criar
Quando POST /api/users { name: "João Silva", username: "joao", email: "joao@a.com", password: "123", role: "collaborator" }
Então HTTP 200 { user: { id, name: "JOÃO_SILVA", username: "@joao", email: "joao@a.com", role: "COLLABORATOR", isAdmin: false } }

# Atualizar
Quando PATCH /api/users { id: "uuid", name: "novo nome" }
Então HTTP 200 { user: { ...campos atualizados... } }

# Deletar
Quando DELETE /api/users?id=uuid
Então HTTP 200 { success: true }
```

---

## Rastreabilidade

| Arquivo | Função | Cobertura |
|---------|--------|-----------|
| `app/api/users/route.ts` | `GET`, `POST`, `PATCH`, `DELETE` | 🟢 |
