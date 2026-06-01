# Comentários — Tarefas de Implementação

> `tasks.md` | Módulo: `comentarios` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `task_comments` com colunas: `id UUID`, `task_id FK→tasks.id`, `author_username TEXT`, `content TEXT`, `created_at`
- [ ] Tabela `notifications` com colunas: `id`, `user_id FK→team_members.id`, `type TEXT`, `message TEXT`, `task_id`, `task_title`, `from_user`, `read BOOL`, `created_at`

---

## Tarefas

- [ ] T-01 — Implementar POST handler com INSERT em `task_comments`
  - Critério de pronto: comentário persiste com `task_id`, `author_username`, `content`
  - Confiança: 🟢

- [ ] T-02 — Implementar extração de menções via `content.match(/@([\w]+)/g) || []`
  - Critério de pronto: `"@alice ok"` → `mentions = ["alice"]`
  - Confiança: 🟢

- [ ] T-03 — Buscar `team_members` mencionados por username e inserir notificações tipo `mention`
  - Critério de pronto: notificação inserida com `user_id` correto e mensagem com título da tarefa
  - Confiança: 🟢

- [ ] T-04 — Retornar comentário com `authorId = authorName = author_username` e `mentions: []`
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — POST sem menção → comentário criado, sem notificações
- [ ] TT-02 — POST com `@alice` existente → notificação criada para alice
- [ ] TT-03 — POST com `@fantasma` inexistente → sem notificação, sem erro
- [ ] TT-04 — POST sem service role key → HTTP 500

---

## Dívidas Técnicas

- [ ] DT-01 — Implementar DELETE de comentários
- [ ] DT-02 — Envolver INSERT notif + INSERT comentário em transação (ou usar function PG)
- [ ] DT-03 — Validar `authorUsername` contra usuário autenticado
