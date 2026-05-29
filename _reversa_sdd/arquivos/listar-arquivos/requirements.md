# Listar Arquivos — Requisitos

> `requirements.md` | Caso de uso: `arquivos/listar-arquivos`

---

## Visão Geral

Lista todos os arquivos anexados a uma tarefa, resolvendo a URL pública de cada um. 🟢

---

## Regras de Negócio

- Requer `taskId` na query string (HTTP 400 se ausente) 🟢
- Ordenação: `created_at ASC` 🟢

---

## Critério de Aceite

```gherkin
Quando GET /api/files?taskId=uuid-task
Então HTTP 200 com { files: [...] } com URLs resolvidas e ordenados por data de criação
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| GET handler | `app/api/files/route.ts` | 1-55 aprox |
