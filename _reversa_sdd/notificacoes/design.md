# Notificações — Design Técnico

> `design.md` | Módulo: `notificacoes` | doc_level: detalhado

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| GET | `/api/notifications?userId=uuid` | `userId` (query) | `{ notifications: [...] }` | 200, 500 |
| PATCH | `/api/notifications` | `{ id, isRead }` (body JSON) | `{ success: bool }` | 200, 400, 500 |
| DELETE | `/api/notifications?userId=uuid` | `userId` (query) | `{ success: bool }` | 200, 400, 500 |

---

## Fluxo GET

```
1. userId = searchParams.get("userId")
2. createAdminClient() → null? return 500
3. !userId? return { notifications: [] }
4. SELECT * FROM notifications WHERE user_id = userId ORDER BY created_at DESC
5. Mapear campos DB → API
6. return { notifications }
```

---

## Mapeamento DB → API (GET)

```ts
{
  id: n.id,
  type: n.type,
  message: n.message,
  taskId: n.task_id,
  taskTitle: n.task_title,
  fromUser: n.from_user,
  createdAt: n.created_at,
  read: n.read,
}
```

---

## Fluxo PATCH

```
1. createAdminClient() → null? return 500
2. { id, isRead } = await request.json()
3. !id? return 400 "ID obrigatório"
4. UPDATE notifications SET read = isRead WHERE id = id
5. return { success: true }
```

---

## Fluxo DELETE

```
1. userId = searchParams.get("userId")
2. createAdminClient() → null? return 500
3. !userId? return 400 "userId obrigatório"
4. DELETE FROM notifications WHERE user_id = userId
5. return { success: true }
```

---

## Esquema da Tabela `notifications`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → team_members.id |
| `type` | TEXT | `"mention"` |
| `message` | TEXT | Texto completo |
| `task_id` | UUID | FK → tasks.id (nullable) |
| `task_title` | TEXT | Desnormalizado para performance |
| `from_user` | TEXT | Username do autor |
| `read` | BOOLEAN | Default: false |
| `created_at` | TIMESTAMPTZ | |

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` 🟢
- Tabela: `notifications` 🟢
- Produtor: `app/api/comments/route.ts` (insere ao detectar `@mentions`) 🟢
