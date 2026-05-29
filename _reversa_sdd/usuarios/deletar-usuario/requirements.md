# Deletar Usuário — Requisitos

> `requirements.md` | Caso de uso: `usuarios/deletar-usuario`

---

## Visão Geral

DELETE remove membro por `id` via query string. HTTP 400 se `id` ausente. 🟢

---

## Regras de Negócio

- `id` obrigatório na query string (HTTP 400 se ausente) 🟢
- Sem verificação de existência antes do DELETE 🟡

---

## Critério de Aceite

```gherkin
Quando DELETE /api/users?id=uuid-user
Então HTTP 200 { success: true }
E membro removido de team_members

Quando DELETE /api/users
Então HTTP 400 { error: "ID obrigatório" }
```
