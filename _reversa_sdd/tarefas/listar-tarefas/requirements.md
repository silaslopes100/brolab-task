# Listar Tarefas — Requisitos

> `requirements.md` | Caso de uso: `tarefas/listar-tarefas`
> Fonte: `app/api/tasks/route.ts` (GET handler)

---

## Visão Geral

Recupera todas as tarefas do banco de dados com dados agregados (comentários e arquivos) em uma única requisição. É a principal chamada da aplicação, executada no boot e após mutações relevantes. 🟢

---

## Responsabilidades

- Retornar lista completa de tasks ordenadas por `position ASC` 🟢
- Agregar `task_comments` em cada task 🟢
- Agregar `task_files` em cada task com URL pública resolvida 🟢
- Transformar `labels TEXT[]` em objetos `{ id, name, color }` 🟢
- Mapear `tasks.status` para `columnId` 🟢

---

## Regras de Negócio

- RN-01: Sem filtros — retorna **todas** as tasks de **todas** as colunas 🟢
- RN-02: `comments[].mentions` sempre retorna `[]` (não é computado) 🟢
- RN-03: `comments[].authorId === comments[].authorName` (mesmo campo `author_username`) 🟢
- RN-04: Ordenação por `position ASC` é global, não por coluna 🟢

---

## Critérios de Aceite

```gherkin
Dado que existem 10 tasks com comentários e arquivos
Quando GET /api/tasks
Então HTTP 200 com { tasks: [...] } onde tasks.length = 10
E cada task contém comments[] e files[] corretos
E labels retornam com id, name e color
E tasks estão ordenadas por position ASC

Dado falha no banco
Quando GET /api/tasks
Então HTTP 500 com { error: "ERRO: FALHA_AO_BUSCAR_TAREFAS" }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| GET handler | `app/api/tasks/route.ts` | 23-112 |
| Agrupamento em memória | `app/api/tasks/route.ts` | 40-59 |
| Formatação da resposta | `app/api/tasks/route.ts` | 61-103 |
| `getLabelColor()` | `app/api/tasks/route.ts` | 16-21 |
