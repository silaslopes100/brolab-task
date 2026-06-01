# Colunas — Casos de Borda

> `edge-cases.md` | Módulo: `colunas` | doc_level: detalhado

---

## EC-01: GET sempre retorna mesmo resultado

- **Cenário:** Chamadas repetidas ao GET
- **Comportamento:** Retorna sempre as 5 colunas hardcoded, independente de estado externo 🟢
- **Resultado esperado:** Idempotente e determinístico

---

## EC-02: POST com nome contendo minúsculas

- **Cenário:** `POST { name: "revisao" }`
- **Comportamento:** `id = name.toUpperCase()` → `"REVISAO"` 🟢
- **Resultado esperado:** `{ column: { id: "REVISAO", name: "REVISAO", ... } }`

---

## EC-03: POST sem `name`

- **Cenário:** Body `{}` ou body com `name: undefined`
- **Comportamento:** `name.toUpperCase()` → `TypeError` → catch → HTTP 500 🟢
- **Resultado esperado:** `{ error: "ERRO: FALHA_AO_CRIAR_COLUNA" }`

---

## EC-04: POST com `position` ausente

- **Cenário:** Body `{ name: "NOVA" }` sem position
- **Comportamento:** `position || DEFAULT_COLUMNS.length` → `5` 🟢
- **Resultado esperado:** `column.position = 5`

---

## EC-05: POST com coluna de nome duplicado de uma DEFAULT

- **Cenário:** `POST { name: "BACKLOG" }`
- **Comportamento:** Retorna `{ column: { id: "BACKLOG", ... } }` sem erro 🟡
- **Resultado esperado:** "Cria" a coluna BACKLOG duplicada in-memory
- **Risco:** Confusão no cliente se exibir a coluna criada junto com as hardcoded

---

## EC-06: DELETE com qualquer payload

- **Cenário:** DELETE com id, sem id, com body, sem body
- **Comportamento:** Handler completamente vazio — sempre 200 🔴
- **Resultado esperado:** `{ success: true }` em todos os casos
- **Risco:** Cliente acredita que a coluna foi deletada quando não foi

---

## EC-07: Task em coluna inexistente (status não mapeado)

- **Cenário:** `tasks.status = "COLUNA_ESTRANHA"` sem correspondência nas `DEFAULT_COLUMNS`
- **Comportamento:** API de tasks retorna a task com `columnId: "COLUNA_ESTRANHA"` 🟡
- **Resultado esperado:** Front-end não encontra coluna correspondente → task "perdida" no board
- **Risco:** UI pode travar ou ignorar silenciosamente a task
