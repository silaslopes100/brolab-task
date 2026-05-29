# Atualizar Usuário — Requisitos

> `requirements.md` | Caso de uso: `usuarios/atualizar-usuario`

---

## Visão Geral

PATCH atualiza parcialmente campos de um membro. Campos não enviados são ignorados. 🟢

---

## Regras de Negócio

- Apenas `name`, `email`, `password`, `role` atualizáveis 🟢
- `username` não atualizável via PATCH 🟡
- Normalização idêntica ao POST 🟢
- `id` obrigatório no body (sem validação explícita) 🟡

---

## Critério de Aceite

```gherkin
Quando PATCH /api/users { id: "uuid", role: "admin" }
Então HTTP 200 { user: { ...membro com role: "ADMIN"... } }
E apenas o campo role foi alterado
```
