# Criar Coluna — Requisitos

> `requirements.md` | Caso de uso: `colunas/criar-coluna`
> Fonte: `app/api/columns/route.ts` (POST handler)

---

## Visão Geral

Recebe dados de uma nova coluna e retorna o objeto formatado — **sem persistência no banco**. A coluna existe apenas na resposta da requisição. É uma implementação stub/incompleta. 🟢 (documentando comportamento real)

---

## Responsabilidades

- Receber `{ name, position }` 🟢
- Normalizar `name` para uppercase como `id` 🟢
- Retornar `{ column: { id, name, position } }` 🟢

---

## Regras de Negócio

- RN-01: `id = name.toUpperCase()` 🟢
- RN-02: `position` default = `DEFAULT_COLUMNS.length` (= 5) se ausente 🟢
- RN-03: Sem INSERT no banco — coluna é gerada in-memory por requisição 🔴

---

## Critérios de Aceite

```gherkin
Quando POST /api/columns { name: "revisao", position: 5 }
Então HTTP 200 { column: { id: "REVISAO", name: "REVISAO", position: 5 } }

Quando POST /api/columns sem name
Então HTTP 500 { error: "ERRO: FALHA_AO_CRIAR_COLUNA" }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| POST handler | `app/api/columns/route.ts` | 23-38 |
