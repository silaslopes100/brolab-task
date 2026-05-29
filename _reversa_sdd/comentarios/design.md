# Comentários — Design Técnico

> `design.md` | Módulo: `comentarios` | doc_level: detalhado
> Fonte: `app/api/comments/route.ts`

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| POST | `/api/comments` | `CommentCreateInput` (body JSON) | `{ comment: Comment }` | 200, 500 |

**`CommentCreateInput`:**
```ts
{ taskId: string, authorUsername: string, content: string }
```

**`Comment` (retornado):**
```ts
{
  id: string
  content: string
  createdAt: string
  authorId: string      // = author_username
  authorName: string    // = author_username (mesmo valor)
  mentions: []          // sempre vazio
}
```

---

## Fluxo Principal — POST

```
1. request.json() → { taskId, authorUsername, content }
2. createAdminClient() → null? return 500
3. Extrair menções: content.match(/@([\w]+)/g) || []
                    → mentions = ["@joao", "@maria"].map(m => m.slice(1))
                    → mentions = ["joao", "maria"]

4. if (mentions.length > 0):
   a. SELECT id, username FROM team_members WHERE username IN (mentions)
   b. if (!usersError && mentionedUsers.length > 0):
      c. SELECT title FROM tasks WHERE id = taskId (.single())
      d. notifInserts = mentionedUsers.map(u => ({
           user_id: u.id,
           type: "mention",
           message: `${authorUsername} mencionou você na tarefa "${taskTitle}"`,
           task_id: taskId,
           task_title: taskTitle,
           from_user: authorUsername,
           read: false
         }))
      e. INSERT INTO notifications (notifInserts)

5. INSERT INTO task_comments { task_id: taskId, author_username: authorUsername, content }
6. SELECT (via .single())
7. return { comment: { id, content, createdAt, authorId: author_username, authorName: author_username, mentions: [] } }
```

---

## Detalhes do Regex de Menção

```ts
const mentions = (content.match(/@([\w]+)/g) || []).map((m) => m.slice(1))
// /@([\w]+)/g captura @palavra (letras, dígitos, underscore)
// .slice(1) remove o "@"
// Exemplos:
//   "olá @joao_silva ok" → ["joao_silva"]
//   "@a @b @c" → ["a", "b", "c"]
//   "sem arroba" → []
```

---

## Ordem das Operações

```
menção detectada → busca users → busca título task → INSERT notif → INSERT comentário → retorna
```

> 🟡 **Sem transação**: se o INSERT de comentário falhar após INSERT de notificações, as notificações ficam sem comentário correspondente.

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` 🟢
- Tabelas: `task_comments`, `team_members`, `tasks`, `notifications` 🟢

---

## Riscos e Lacunas

- 🔴 Sem autenticação — `authorUsername` é parâmetro livre; qualquer cliente pode se passar por outro usuário
- 🟡 Sem transação entre INSERT de notif e INSERT de comentário
- 🟡 `mentions: []` sempre vazio na resposta — informação extraída mas descartada no retorno
- 🔴 Sem DELETE de comentários — comentários criados por engano não têm rota de remoção
- 🟡 Se `taskId` não existe, o INSERT de comentário falha mas as notificações foram inseridas
