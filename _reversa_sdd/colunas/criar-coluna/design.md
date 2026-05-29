# Criar Coluna — Design Técnico

> `design.md` | Caso de uso: `colunas/criar-coluna`

---

## Interface

```
POST /api/columns
Body: { name: string, position?: number }
→ 200: { column: { id, name, position } }
→ 500: { error: "ERRO: FALHA_AO_CRIAR_COLUNA" }
```

---

## Sequência

```
1. request.json() → { name, position }
2. const id = name.toUpperCase()
3. return { column: { id, name: id, position: position || 5 } }
// Sem I/O
```

---

## Notas

- 🔴 Sem INSERT — coluna não persiste
- 🟢 `name` e `id` são normalizados para uppercase (consistência com `tasks.status`)
