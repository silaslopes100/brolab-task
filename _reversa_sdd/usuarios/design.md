# Usuários — Design Técnico

> `design.md` | Módulo: `usuarios` | doc_level: detalhado

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| GET | `/api/users` | — | `{ users: UserItem[] }` | 200, 500 |
| POST | `/api/users` | `{ name, username, email, password, role }` | `{ user: UserItem }` | 200, 500 |
| PATCH | `/api/users` | `{ id, name?, email?, password?, role? }` | `{ user: UserItem }` | 200, 500 |
| DELETE | `/api/users?id=uuid` | `id` (query) | `{ success: true }` | 200, 400, 500 |

**Tipo `UserItem`:**
```ts
{
  id: string
  name: string      // uppercase com underscore
  username: string  // @prefixado, lowercase
  email: string     // lowercase
  role: string      // uppercase com underscore
  role_id: string | null
  isAdmin: boolean  // role === "ADMIN_TOTAL" || role === "ADMIN"
}
```

---

## Fluxo GET

```
1. supabase = createAdminClient() ?? await createClient()
2. SELECT id, email, username, name, role, role_id, created_at
   FROM team_members ORDER BY created_at ASC
3. Mapear → UserItem com isAdmin
4. return { users }
```

---

## Fluxo POST

```
1. { name, username, email, password, role } = await request.json()
2. supabase = createAdminClient() → null? return 500

Normalização:
  name     → name.toUpperCase().replace(/\s+/g, "_")
  username → !startsWith("@") ? "@" + username : username → toLowerCase()
  email    → email.toLowerCase()
  role     → (role?.toUpperCase().replace(/\s+/g, "_")) || "COLLABORATOR"

3. INSERT INTO team_members { name, username, email, password, role }
4. return { user: UserItem }
```

---

## Fluxo PATCH

```
1. { id, name, email, password, role } = await request.json()
2. supabase = createAdminClient() → null? return 500

Construção de updates (apenas campos presentes):
  updates.name     = name.toUpperCase().replace(/\s+/g, "_")     (se name)
  updates.email    = email.toLowerCase()                          (se email)
  updates.password = password                                     (se password)
  updates.role     = role.toUpperCase().replace(/\s+/g, "_")     (se role)

3. UPDATE team_members SET updates WHERE id = id
4. return { user: UserItem }
```

---

## Fluxo DELETE

```
1. id = searchParams.get("id") → null? return 400
2. supabase = createAdminClient() → null? return 500
3. DELETE FROM team_members WHERE id = id
4. return { success: true }
```

---

## Esquema da Tabela `team_members`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID | PK |
| `name` | TEXT | uppercase + underscore |
| `username` | TEXT | @prefixado, unique |
| `email` | TEXT | lowercase, unique |
| `password` | TEXT | 🔴 plaintext |
| `role` | TEXT | uppercase + underscore |
| `role_id` | UUID | nullable |
| `created_at` | TIMESTAMPTZ | |

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` 🟢
- `lib/supabase/server.ts` → `createClient()` (fallback no GET) 🟡
- Tabela: `team_members` 🟢
