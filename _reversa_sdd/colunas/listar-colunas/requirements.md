# Listar Colunas — Requisitos

> `requirements.md` | Caso de uso: `colunas/listar-colunas`
> Fonte: `app/api/columns/route.ts` (GET handler)

---

## Visão Geral

Retorna as 5 colunas hardcoded do board Kanban em ordem de posição. É chamado pelo SPA no boot para montar as faixas do board. Sem acesso ao banco de dados. 🟢

---

## Responsabilidades

- Retornar `[{ id, name, position }]` para as 5 colunas fixas 🟢
- Garantir que `id === name` para cada coluna 🟢
- Garantir ordenação por posição (BACKLOG=0 ... FEITO=4) 🟢

---

## Regras de Negócio

- RN-01: Colunas são sempre as mesmas — não dependem de estado do banco 🟢
- RN-02: `column.id = column.name = DEFAULT_COLUMNS[i]` (string uppercase) 🟢

---

## Critérios de Aceite

```gherkin
Quando GET /api/columns
Então HTTP 200 com exatamente 5 colunas
E a primeira é { id: "BACKLOG", name: "BACKLOG", position: 0 }
E a última é { id: "FEITO", name: "FEITO", position: 4 }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| GET handler | `app/api/columns/route.ts` | 11-21 |
| `DEFAULT_COLUMNS` | `app/api/columns/route.ts` | 3-9 |
