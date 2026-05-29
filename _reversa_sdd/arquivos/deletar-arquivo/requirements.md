# Deletar Arquivo — Requisitos

> `requirements.md` | Caso de uso: `arquivos/deletar-arquivo`

---

## Visão Geral

Remoção em duas fases: fase 1 remove do Supabase Storage; fase 2 deleta o registro da tabela `task_files`. A fase 2 só executa após o sucesso da fase 1. 🟢

---

## Regras de Negócio

- Requer `id` na query string (HTTP 400 se ausente) 🟢
- HTTP 404 se arquivo não encontrado no banco 🟢
- Storage remove antes do banco 🟢

---

## Critério de Aceite

```gherkin
Quando DELETE /api/files?id=uuid-arquivo
E arquivo existe em task_files com path="taskId/uuid.pdf"
Então storage.remove(["taskId/uuid.pdf"]) executado com sucesso
E task_files DELETE WHERE id = uuid-arquivo executado
E HTTP 200 { success: true }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| DELETE handler | `app/api/files/route.ts` | 55-130 aprox |
