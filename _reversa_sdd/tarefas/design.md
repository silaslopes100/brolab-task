# Tarefas — Design Técnico

> `design.md` | Módulo: `tarefas` | doc_level: detalhado
> Fonte: `app/api/tasks/route.ts`

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| GET | `/api/tasks` | — | `{ tasks: Task[] }` | 200, 500 |
| POST | `/api/tasks` | `TaskCreateInput` (body JSON) | `{ task: Task }` | 200, 500 |
| PATCH | `/api/tasks` | `TaskUpdateInput` (body JSON) | `{ success: true }` | 200, 400, 500 |
| DELETE | `/api/tasks?id=uuid` | `id` (query string) | `{ success: true }` | 200, 400, 500 |

**Tipo `Task` (retornado):**
```ts
{
  id: string
  title: string
  description: string
  columnId: string        // = tasks.status no banco
  position: number
  createdAt: string
  assignees: string[]     // nomes (não IDs)
  labels: { id: string, name: string, color: string }[]
  comments: {
    id: string
    content: string
    createdAt: string
    authorId: string      // = author_username
    authorName: string    // = author_username (mesmo valor)
    mentions: []          // sempre array vazio
  }[]
  files: {
    id: string
    name: string
    size: number
    type: string
    url: string           // URL pública do Supabase Storage
    createdAt: string
  }[]
}
```

**`TaskCreateInput`:**
```ts
{ title, description?, columnId?, position?, assignees?, labels?: { name: string }[] }
```

**`TaskUpdateInput`:**
```ts
{ id, title?, description?, columnId?, position?, assignees?, labels?: { name: string }[] }
```

---

## Fluxo Principal — GET

1. Instancia `createAdminClient() ?? await createClient()` (fallback para anon) 🟢
2. `SELECT * FROM tasks ORDER BY position ASC` 🟢
3. `SELECT * FROM task_comments ORDER BY created_at ASC` 🟢
4. Agrupa comments por `task_id` em memória 🟢
5. `SELECT * FROM task_files ORDER BY created_at ASC` 🟢
6. Agrupa files por `task_id` em memória 🟢
7. Para cada task, resolve `getPublicUrl(f.path)` para cada arquivo (síncrono, não async) 🟢
8. Mapeia: `task.status → columnId`, `task.labels TEXT[] → { id, name, color }[]` 🟢
9. Retorna `{ tasks: formattedTasks }` 🟢

---

## Fluxo Principal — POST

1. Extrai `{ title, description, columnId, position, assignees, labels }` do body 🟢
2. Instancia `createAdminClient()` — retorna 500 se null 🟢
3. `INSERT INTO tasks (title, description, status=columnId, position, assignees, labels[names])` 🟢
4. Retorna `{ task }` no mesmo formato do GET (sem comments/files — arrays vazios) 🟢

---

## Fluxo Principal — PATCH

1. Extrai `{ id, ...campos }` do body 🟢
2. Monta objeto `updates` apenas com campos definidos (parcial) 🟢
3. `labels` mapeados para array de nomes: `labels.map(l => l.name)` 🟢
4. `UPDATE tasks SET ...updates WHERE id = id` 🟢
5. Retorna `{ success: true }` 🟢

---

## Fluxo Principal — DELETE

1. Extrai `id` de `request.url` query string 🟢
2. Retorna HTTP 400 se `id` ausente 🟢
3. `DELETE FROM tasks WHERE id = id` 🟢
4. `task_files` são deletadas em cascade 🟢
5. Retorna `{ success: true }` 🟢

---

## Algoritmo `getLabelColor`

```ts
function getLabelColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)  // djb2-like
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]
}
// LABEL_COLORS = 7 cores: #FFFFFF, #6B7280, #84CC16, #A3E635, #F97316, #EF4444, #22C55E
```

> 🟢 Determinístico: mesmo nome → mesma cor sempre. Renomear a label muda a cor.

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` — queries sem RLS 🟢
- `lib/supabase/server.ts` → `createClient()` — fallback SSR 🟢
- Tabelas: `tasks`, `task_comments`, `task_files` 🟢
- Supabase Storage bucket `task-files` → `getPublicUrl()` 🟢

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Três queries separadas no GET (não JOINs) + merge em memória | `route.ts:27-82` | 🟢 |
| `tasks.status` armazena nome da coluna, não UUID | `route.ts:134-136` — `status: columnId \|\| "BACKLOG"` | 🟢 |
| Labels persistidas como `TEXT[]` sem tabela | `route.ts:140-142` | 🟢 |
| `mentions: []` sempre vazio na agregação do GET | `route.ts:93` | 🟢 |
| `authorId` e `authorName` têm o mesmo valor (`author_username`) | `route.ts:89-91` | 🟢 |

---

## Riscos e Lacunas

- 🔴 Sem paginação — GET retorna 100% das tasks; degrada com volume alto
- 🔴 Sem autenticação/autorização nos endpoints
- 🟡 N+1 implícito em `getPublicUrl()` — chamada síncrona por arquivo, mas não é async (baixo impacto atual)
- 🟡 `task_comments` não tem CASCADE DELETE declarado — comentários podem ficar órfãos se a task for deletada por outra rota
- 🟡 `assignees: TEXT[]` — renomear membro não atualiza tasks já criadas
