# Deletar Tarefa — Requisitos

> `requirements.md` | Caso de uso: `tarefas/deletar-tarefa`
> Fonte: `app/api/tasks/route.ts` (DELETE handler)

---

## Visão Geral

Remove uma tarefa pelo ID passado na query string. A deleção cascateia para `task_files` no banco. Comentários não têm CASCADE declarado explicitamente. 🟢

---

## Responsabilidades

- Validar presença de `id` na query string 🟢
- Executar `DELETE FROM tasks WHERE id = ?` 🟢
- Retornar `{ success: true }` 🟢

---

## Regras de Negócio

- RN-01: `id` obrigatório — ausente → HTTP 400 `"ID obrigatório"` 🟢
- RN-02: `task_files` são deletados em cascade pelo banco 🟢
- RN-03: `task_comments` não têm CASCADE declarado — risco de registros órfãos 🟡
- RN-04: Deleção de ID inexistente → HTTP 200 (idempotente) 🟡

---

## Critérios de Aceite

```gherkin
Dado task com id="uuid-123" e 2 arquivos associados
Quando DELETE /api/tasks?id=uuid-123
Então HTTP 200 { success: true }
E task_files com task_id="uuid-123" deletados em cascade

Quando DELETE /api/tasks sem ?id
Então HTTP 400 { error: "ID obrigatório" }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas (aprox.) |
|-------|---------|--------|
| DELETE handler | `app/api/tasks/route.ts` | 207-240 |
