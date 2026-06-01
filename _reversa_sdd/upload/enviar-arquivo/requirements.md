# Enviar Arquivo — Requisitos

> `requirements.md` | Caso de uso: `upload/enviar-arquivo`

---

## Visão Geral

Único caso de uso do módulo. Recebe arquivo via multipart e persiste no Storage + banco em uma única operação. 🟢

---

## Regras de Negócio

- `file` e `taskId` obrigatórios (HTTP 400 se ausentes) 🟢
- `upsert: false` — sem sobrescrever 🟢
- Path: `${taskId}/${uuid}.${ext}` 🟢

---

## Critério de Aceite

```gherkin
Dado formData com file=doc.pdf e taskId=uuid-task
Quando POST /api/upload
Então arquivo armazenado em Storage com path único
E metadados em task_files com task_id, name, size, type, path
E HTTP 200 { file: { id, name, size, type, url, createdAt } }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| POST handler | `app/api/upload/route.ts` | 1-120 |
