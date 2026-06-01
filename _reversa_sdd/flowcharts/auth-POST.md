# Flowchart — Função `auth POST` (detalhado)

> Função: `POST /api/auth/login` — `app/api/auth/login/route.ts`
>
> Fluxo detalhado: lógica de normalização de identificador + dois caminhos de busca.

```mermaid
flowchart TD
    START([Requisição POST /api/auth/login]) --> P1[Parse body: email, password]
    P1 --> P2[adminClient = createAdminClient]
    P2 --> P3{adminClient é null?}
    P3 -- Sim --> E1([500 SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA])

    P3 -- Não --> N1[loginIdentifier = email.toLowerCase.trim]
    N1 --> N2{loginIdentifier.includes '@'?}

    N2 -- Sim email normal --> Q1[SELECT * FROM team_members WHERE LOWER email = loginIdentifier]
    Q1 --> R1{rows.length > 0?}
    R1 -- Não --> E2([401 USUARIO_NAO_ENCONTRADO])
    R1 -- Sim --> V1[user = rows 0]

    N2 -- Não username --> N3[usernameQuery = '@' + loginIdentifier]
    N3 --> Q2[SELECT * FROM team_members WHERE username ILIKE usernameQuery]
    Q2 --> R2{rows.length > 0?}
    R2 -- Não --> E2
    R2 -- Sim --> V1

    V1 --> PW{password === user.password?}
    PW -- Não --> E3([401 SENHA_INCORRETA])
    PW -- Sim --> A1[isAdmin = role === 'ADMIN_TOTAL' OR role === 'ADMIN']
    A1 --> RES[Monta user object com id, name, username, email, role, role_id, isAdmin]
    RES --> OK([200 OK - user object])
```

## Notas de segurança

| Ponto | Status | Risco |
|-------|--------|-------|
| Comparação de senha | `user.password !== password` | 🔴 CRÍTICO — plaintext |
| Rate limiting | Ausente | 🟡 ALTO — brute force |
| Logging de tentativas | Ausente | 🟡 MÉDIO |
| Expiração de sessão | Ausente (estado React) | 🔴 ALTO |
