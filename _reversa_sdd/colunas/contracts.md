# Colunas — Contratos de API

> `contracts.md` | Módulo: `colunas` | doc_level: detalhado
> Fonte: `app/api/columns/route.ts`

---

## GET /api/columns

**Requisição:**
```
GET /api/columns
(sem parâmetros)
```

**Resposta de sucesso (200):**
```json
{
  "columns": [
    { "id": "BACKLOG",    "name": "BACKLOG",    "position": 0 },
    { "id": "FAZENDO",    "name": "FAZENDO",    "position": 1 },
    { "id": "ALTERAÇÕES", "name": "ALTERAÇÕES", "position": 2 },
    { "id": "APROVADO",   "name": "APROVADO",   "position": 3 },
    { "id": "FEITO",      "name": "FEITO",      "position": 4 }
  ]
}
```

**Resposta de erro (500):**
```json
{ "error": "ERRO: FALHA_AO_BUSCAR_COLUNAS" }
```

> 🟢 O erro 500 nunca ocorre na prática (sem I/O no GET).

---

## POST /api/columns

**Requisição:**
```
POST /api/columns
Content-Type: application/json

{
  "name": "string",       // obrigatório
  "position": 5           // opcional, default: DEFAULT_COLUMNS.length (= 5)
}
```

**Resposta de sucesso (200):**
```json
{
  "column": {
    "id": "NOME_EM_UPPERCASE",
    "name": "NOME_EM_UPPERCASE",
    "position": 5
  }
}
```

**Resposta de erro (500):**
```json
{ "error": "ERRO: FALHA_AO_CRIAR_COLUNA" }
```

> 🔴 **Nota:** A coluna retornada NÃO é persistida. Não aparece no GET subsequente.

---

## DELETE /api/columns

**Requisição:**
```
DELETE /api/columns
(qualquer parâmetro — ignorado)
```

**Resposta (sempre 200):**
```json
{ "success": true }
```

> 🔴 **Nota:** No-op. Nenhuma coluna é removida.

---

## Mapeamento DB ↔ API

| Campo na API | Campo no banco | Tabela |
|-------------|----------------|--------|
| `column.id` | — | Não existe (hardcoded) |
| `column.name` | `tasks.status` | `tasks` (relação implícita) |
| `column.position` | — | Não existe (índice do array) |
