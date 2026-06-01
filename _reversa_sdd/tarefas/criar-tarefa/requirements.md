# Criar Tarefa — Requisitos

> `requirements.md` | Caso de uso: `tarefas/criar-tarefa`
> Fonte: `app/api/tasks/route.ts` (POST handler)

---

## Visão Geral

Cria uma nova tarefa no board Kanban com os campos especificados. Persiste no banco via `INSERT` e retorna a task criada no mesmo formato do GET. 🟢

---

## Responsabilidades

- Receber `{ title, description, columnId, position, assignees, labels }` 🟢
- Inserir uma nova linha em `tasks` com `status = columnId` 🟢
- Retornar a task criada com `labels` formatadas e arrays `comments/files` vazios 🟢

---

## Regras de Negócio

- RN-01: `columnId` é mapeado para `tasks.status` 🟢
- RN-02: `labels` é array de objetos `{ name }` → persistido como `TEXT[]` de nomes 🟢
- RN-03: Valores default: `description=""`, `status="BACKLOG"`, `position=0`, `assignees=[]`, `labels=[]` 🟢
- RN-04: Requer `SUPABASE_SERVICE_ROLE_KEY` — sem fallback anon para escrita 🟢

---

## Critérios de Aceite

```gherkin
Quando POST /api/tasks { title: "Nova", columnId: "FAZENDO" }
Então HTTP 200 com task.columnId = "FAZENDO" e task.id preenchido

Quando POST /api/tasks sem columnId
Então task.columnId = "BACKLOG"

Quando SUPABASE_SERVICE_ROLE_KEY ausente
Então HTTP 500 com { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas (aprox.) |
|-------|---------|--------|
| POST handler | `app/api/tasks/route.ts` | 115-162 |
