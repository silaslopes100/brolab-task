# Colunas — Design Técnico

> `design.md` | Módulo: `colunas` | doc_level: detalhado
> Fonte: `app/api/columns/route.ts`

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| GET | `/api/columns` | — | `{ columns: Column[] }` | 200, 500 |
| POST | `/api/columns` | `{ name, position? }` | `{ column: Column }` | 200, 500 |
| DELETE | `/api/columns` | — | `{ success: true }` | 200 |

**Tipo `Column`:**
```ts
{ id: string, name: string, position: number }
```

---

## Fluxo Principal — GET

```
1. DEFAULT_COLUMNS.map((name, index) => ({ id: name, name, position: index }))
2. return { columns }
// Sem query ao banco — puramente in-memory
```

**Constante hardcoded:**
```ts
const DEFAULT_COLUMNS = ["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]
```

---

## Fluxo Principal — POST

```
1. request.json() → { name, position }
2. const id = name.toUpperCase()
3. return { column: { id, name: id, position: position || DEFAULT_COLUMNS.length } }
// Sem INSERT — sem efeito colateral
```

> 🔴 **Atenção:** A coluna "criada" não é persistida. O próximo GET não a incluirá.

---

## Fluxo Principal — DELETE

```
1. return { success: true }
// Completamente vazio — no-op
```

> 🔴 **Atenção:** Nenhuma operação é executada. Apenas retorna sucesso.

---

## Relação com o Módulo Tarefas

O `column.id` é o mesmo valor que `tasks.status`. A ordenação do board no cliente usa `columns[]` para criar as faixas e distribui tasks via `task.columnId === column.id`. 🟢

```
columns[0].id = "BACKLOG"
  ↕ (igualdade de string)
tasks[i].columnId = "BACKLOG" (= tasks.status no banco)
```

---

## Dependências

- **Nenhuma** — módulo completamente stateless, zero dependências externas 🟢

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Colunas hardcoded no array em vez de tabela no banco | `DEFAULT_COLUMNS` constante no módulo | 🟢 |
| `id = name` (sem UUID) para facilitar match com `tasks.status` | `id: name` em GET; `id = name.toUpperCase()` em POST | 🟢 |
| DELETE como no-op intencional (funcionalidade não implementada) | Corpo vazio do DELETE handler | 🟢 |

---

## Risco Arquitetural

| Risco | Descrição | Severidade |
|-------|-----------|------------|
| Sem tabela `columns` | Adicionar colunas requer deploy | 🔴 |
| POST in-memory | Coluna "criada" desaparece no refresh | 🔴 |
| DELETE no-op | Coluna "deletada" permanece | 🔴 |
| `tasks.status` sem FK | Tarefas podem ter `status` sem coluna correspondente | 🟡 |
