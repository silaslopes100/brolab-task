# Atualizar Tarefa — Requisitos

> `requirements.md` | Caso de uso: `tarefas/atualizar-tarefa`
> Fonte: `app/api/tasks/route.ts` (PATCH handler)

---

## Visão Geral

Atualiza parcialmente uma tarefa existente. Usado tanto para editar campos textuais quanto para mover a tarefa entre colunas (drag-and-drop) ou reordenar dentro da mesma coluna. 🟢

---

## Responsabilidades

- Receber `id` + campos opcionais para atualização 🟢
- Montar objeto `updates` apenas com campos definidos 🟢
- Executar `UPDATE` no banco 🟢
- Retornar `{ success: true }` 🟢

---

## Regras de Negócio

- RN-01: Atualização é **parcial** — campos ausentes no body não são alterados 🟢
- RN-02: `columnId` presente → `updates.status = columnId` 🟢
- RN-03: `labels` presente → `updates.labels = labels.map(l => l.name)` 🟢
- RN-04: PATCH com apenas `{ id }` → nenhuma query ao banco, retorna success 🟢
- RN-05: PATCH com ID inexistente → HTTP 200 (sem erro de "não encontrado") 🟡

---

## Critérios de Aceite

```gherkin
Dado task com title="Old" e columnId="BACKLOG"
Quando PATCH { id, columnId: "FAZENDO" }
Então tasks.status = "FAZENDO" e title não alterado

Quando PATCH { id } sem outros campos
Então HTTP 200 { success: true } sem query ao banco

Quando PATCH com id inexistente
Então HTTP 200 { success: true } (comportamento silencioso)
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas (aprox.) |
|-------|---------|--------|
| PATCH handler | `app/api/tasks/route.ts` | 164-205 |
