# Usuários — Contratos de API

> `contracts.md` | Módulo: `usuarios` | doc_level: detalhado

---

## GET /api/users

**Sucesso (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "JOÃO_SILVA",
      "username": "@joao",
      "email": "joao@example.com",
      "role": "COLLABORATOR",
      "role_id": null,
      "isAdmin": false
    }
  ]
}
```

**Erro:**
```json
// 500
{ "error": "ERRO: FALHA_AO_BUSCAR_USUÁRIOS" }
```

---

## POST /api/users

**Requisição:**
```json
{
  "name": "João Silva",
  "username": "joao",
  "email": "Joao@Example.com",
  "password": "senha123",
  "role": "collaborator"
}
```

**Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "JOÃO_SILVA",
    "username": "@joao",
    "email": "joao@example.com",
    "role": "COLLABORATOR",
    "role_id": null,
    "isAdmin": false
  }
}
```

**Erro:**
```json
{ "error": "ERRO: FALHA_AO_CRIAR_USUÁRIO" }
```

---

## PATCH /api/users

**Requisição:**
```json
{ "id": "uuid", "role": "admin total" }
```

**Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "JOÃO_SILVA",
    "username": "@joao",
    "email": "joao@example.com",
    "role": "ADMIN_TOTAL",
    "role_id": null,
    "isAdmin": true
  }
}
```

**Erro:**
```json
{ "error": "ERRO: FALHA_AO_ATUALIZAR_USUÁRIO" }
```

---

## DELETE /api/users?id=uuid

**Sucesso (200):**
```json
{ "success": true }
```

**Erros:**
```json
// 400 — sem id
{ "error": "ID obrigatório" }

// 500
{ "error": "ERRO: FALHA_AO_DELETAR_USUÁRIO" }
```
