# Listar Usuários — Requisitos

> `requirements.md` | Caso de uso: `usuarios/listar-usuarios`

---

## Visão Geral

GET retorna todos os membros da equipe com `isAdmin` calculado, ordenados por data de criação. 🟢

---

## Regras de Negócio

- Ordenação: `created_at ASC` 🟢
- `isAdmin` calculado: `role === "ADMIN_TOTAL" || role === "ADMIN"` 🟢
- Fallback de cliente: admin → server 🟡

---

## Critério de Aceite

```gherkin
Quando GET /api/users
Então HTTP 200 { users: [...] } ordenados por created_at ASC com isAdmin correto
```
