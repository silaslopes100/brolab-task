# Autenticação — Contrato HTTP

> `contracts.md` | Módulo: `autenticacao` | doc_level: detalhado
> Fonte: `app/api/auth/login/route.ts`

---

## Endpoint: POST /api/auth/login

### Request

```http
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

> 🟡 O campo `email` aceita tanto um endereço de email quanto um @username. O nome do campo é herdado do bootstrap v0.dev.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `email` | string | Sim | Email (`joao@example.com`) ou @username (`@joao.silva` ou `joao.silva`) |
| `password` | string | Sim | Senha em texto plano |

---

### Responses

#### 200 OK — Login bem-sucedido

```json
{
  "user": {
    "id": "uuid-v4",
    "name": "João Silva",
    "username": "@joao.silva",
    "email": "joao@example.com",
    "role": "DEVELOPER",
    "role_id": null,
    "isAdmin": false
  }
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user.id` | UUID | Identificador único do membro |
| `user.name` | string | Nome completo |
| `user.username` | string | @username (sempre prefixado com `@`) |
| `user.email` | string | Email do membro |
| `user.role` | string | Role original: `"ADMIN_TOTAL"`, `"ADMIN"`, `"DEVELOPER"`, etc. |
| `user.role_id` | string \| null | Campo retornado mas sem uso documentado 🟡 |
| `user.isAdmin` | boolean | `true` se `role === "ADMIN_TOTAL"` ou `role === "ADMIN"` |

---

#### 401 Unauthorized — Credenciais inválidas

```json
{
  "error": "ERRO: CREDENCIAIS_INVÁLIDAS"
}
```

Retornado quando:
- Identificador não encontrado em `team_members`
- Senha não corresponde ao valor armazenado

---

#### 500 Internal Server Error — Falha no servidor

```json
{
  "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA"
}
```
ou
```json
{
  "error": "ERRO: FALHA_NO_SERVIDOR"
}
```

---

### Notas de Segurança

- 🔴 Sem autenticação/autorização — qualquer requisição pode tentar login
- 🔴 Sem rate limiting
- 🔴 Sem `Set-Cookie` na resposta — sessão não gerenciada pelo servidor
- 🔴 Comparação de senha em plaintext
