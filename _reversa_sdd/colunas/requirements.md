# Colunas

> `requirements.md` | Módulo: `colunas` | granularity: hybrid
> Fonte: `app/api/columns/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo responsável pela estrutura de colunas do board Kanban. Provê a lista de colunas para o front-end montar as faixas do board. **Crítico:** as colunas são hardcoded no servidor — não há tabela de colunas no banco de dados. O POST cria uma coluna apenas em memória (no escopo da requisição) e o DELETE é no-op. 🟢

---

## Responsabilidades

- Retornar lista de colunas com `{ id, name, position }` 🟢
- Simular criação de coluna (in-memory, sem persistência) 🟢
- Simular deleção de coluna (no-op) 🟢

---

## Regras de Negócio

- RN-01: As 5 colunas são fixas e definidas em código: `["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]` 🟢
- RN-02: `column.id === column.name` (sem UUID) 🟢
- RN-03: `position` = índice no array (0 a 4) 🟢
- RN-04: POST não persiste nada no banco — a coluna retornada existe apenas na resposta 🔴
- RN-05: DELETE sempre retorna `{ success: true }` sem executar nenhuma operação 🔴
- RN-06: A relação com tasks é via `tasks.status = column.id (= nome da coluna)` 🟢

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | GET retorna as 5 colunas hardcoded ordenadas por posição | Must | `columns[0].name = "BACKLOG"`, `columns[4].name = "FEITO"` |
| RF-02 | GET gera `id = name` (string, não UUID) | Must | `columns[0].id = "BACKLOG"` |
| RF-03 | POST recebe `{ name, position }` e retorna a coluna "criada" | Should | Retorna `{ column: { id, name, position } }` |
| RF-04 | POST normaliza nome para uppercase | Should | POST `{ name: "nova" }` → `column.id = "NOVA"` |
| RF-05 | DELETE retorna `{ success: true }` | Should | HTTP 200 sem efeito colateral |

---

## Requisitos Não Funcionais

| Tipo | Requisito | Confiança |
|------|-----------|-----------|
| Persistência | **Nenhuma** — colunas hardcoded, POST/DELETE sem DB | 🟢 (lacuna crítica) |
| Configurabilidade | Impossível adicionar/remover colunas sem alterar código | 🟢 (lacuna) |

---

## Critérios de Aceite

```gherkin
# Cenário 1 — Listar colunas
Quando GET /api/columns
Então HTTP 200 com { columns: [5 itens] }
E colunas são BACKLOG, FAZENDO, ALTERAÇÕES, APROVADO, FEITO
E column.id === column.name para cada coluna

# Cenário 2 — Criar coluna (in-memory)
Quando POST /api/columns { name: "revisao", position: 5 }
Então HTTP 200 com { column: { id: "REVISAO", name: "REVISAO", position: 5 } }
Mas coluna NÃO é persistida — não aparece em GET subsequente

# Cenário 3 — Deletar coluna (no-op)
Quando DELETE /api/columns (qualquer id)
Então HTTP 200 com { success: true }
Mas nenhuma coluna é removida
```

---

## Lacunas Críticas

| Lacuna | Impacto | Severidade |
|--------|---------|------------|
| POST não persiste no banco | Colunas criadas pelo usuário sumem ao recarregar | 🔴 CRÍTICO |
| DELETE não remove nada | Board não pode ser configurado | 🔴 CRÍTICO |
| Colunas hardcoded | Impossível personalizar sem alterar código | 🔴 CRÍTICO |
| Sem tabela `columns` | Arquitetura incompleta para Kanban configurável | 🔴 CRÍTICO |

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/columns/route.ts` | `GET`, `POST`, `DELETE` | 🟢 |
| `app/api/columns/route.ts` | `DEFAULT_COLUMNS` | 🟢 |
