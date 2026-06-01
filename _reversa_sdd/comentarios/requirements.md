# Comentários

> `requirements.md` | Módulo: `comentarios` | granularity: hybrid
> Fonte: `app/api/comments/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo responsável pela criação de comentários em tarefas. Suporta menções a membros via `@username` no conteúdo do comentário e dispara notificações automáticas para cada membro mencionado. Implementa apenas POST (sem GET, PATCH ou DELETE próprios — comentários são retornados agregados no GET /api/tasks). 🟢

---

## Responsabilidades

- Criar um comentário em uma tarefa específica 🟢
- Extrair menções `@username` do conteúdo via regex 🟢
- Buscar IDs dos membros mencionados 🟢
- Inserir notificações do tipo `mention` para cada mencionado 🟢
- Retornar o comentário criado no formato padrão 🟢

---

## Regras de Negócio

- RN-01: Menções são detectadas via `/@([\w]+)/g` no conteúdo 🟢
- RN-02: A notificação é criada com `type: "mention"` e `message: "{autor} mencionou você na tarefa "{título}""` 🟢
- RN-03: Membros mencionados que não existem em `team_members` são ignorados silenciosamente 🟢
- RN-04: `comments[].mentions` retorna sempre `[]` (extraídas mas não persistidas no comentário) 🟢
- RN-05: `authorId === authorName === authorUsername` (sem FK para `team_members.id`) 🟢
- RN-06: Sem GET próprio — comentários são lidos via `GET /api/tasks` (agregados) 🟢
- RN-07: Sem DELETE de comentários 🔴 (lacuna)

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | POST cria comentário em `task_comments` | Must | Comentário persistido com `task_id`, `author_username`, `content` |
| RF-02 | POST detecta menções `@username` no conteúdo | Must | `content = "olá @joao"` → `mentions = ["joao"]` |
| RF-03 | POST insere notificação `mention` para cada membro mencionado que existe | Must | Notificação em `notifications` com `user_id` correto |
| RF-04 | POST busca título da tarefa para compor mensagem da notificação | Should | `message` contém o título da tarefa |
| RF-05 | POST retorna comentário com `id, content, createdAt, authorId, authorName, mentions: []` | Must | Formato consistente com o GET /api/tasks |

---

## Requisitos Não Funcionais

| Tipo | Requisito | Confiança |
|------|-----------|-----------|
| Atomicidade | Sem transação — comentário pode ser inserido sem notificação se a query de notifs falhar | 🟢 (lacuna) |
| Autorização | Sem verificação de autoria — qualquer cliente pode postar como qualquer username | 🔴 |

---

## Critérios de Aceite

```gherkin
# Cenário 1 — Criar comentário sem menção
Quando POST /api/comments { taskId, authorUsername: "alice", content: "ok" }
Então HTTP 200 com { comment: { id, content: "ok", authorId: "alice", mentions: [] } }
E nenhuma notificação inserida

# Cenário 2 — Criar comentário com menção
Quando POST /api/comments { taskId, authorUsername: "alice", content: "olá @bob revise" }
E "bob" existe em team_members
Então HTTP 200 com { comment }
E notificação inserida para bob com type="mention"

# Cenário 3 — Menção a membro inexistente
Quando POST /api/comments { content: "@fantasma" }
Então HTTP 200 e nenhuma notificação inserida (silencioso)

# Cenário 4 — Sem service role key
Então HTTP 500 { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }
```

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/comments/route.ts` | `POST` handler completo | 🟢 |
| `app/api/comments/route.ts` | regex `/@([\w]+)/g` | 🟢 |
| `app/api/comments/route.ts` | query `team_members.in('username', mentions)` | 🟢 |
| `app/api/comments/route.ts` | `notifications.insert(notifInserts)` | 🟢 |
