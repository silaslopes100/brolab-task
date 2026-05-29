# Criar Usuário — Requisitos

> `requirements.md` | Caso de uso: `usuarios/criar-usuario`

---

## Visão Geral

POST cria membro com normalização de campos. Senha armazenada em plaintext. 🔴

---

## Regras de Negócio

- `name` → uppercase + underscore 🟢
- `username` → `@`-prefixado + lowercase 🟢
- `email` → lowercase 🟢
- `role` → uppercase + underscore, default `"COLLABORATOR"` 🟢
- Senha em plaintext 🔴 CRÍTICO

---

## Critério de Aceite

```gherkin
Quando POST /api/users { name, username, email, password, role }
Então HTTP 200 { user: { id, name, username, email, role, isAdmin } }
E campos normalizados conforme RN-04 a RN-07
```
