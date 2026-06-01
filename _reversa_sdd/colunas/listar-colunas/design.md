# Listar Colunas — Design Técnico

> `design.md` | Caso de uso: `colunas/listar-colunas`

---

## Interface

```
GET /api/columns
→ 200: { columns: [{ id, name, position }] }
→ 500: { error: "ERRO: FALHA_AO_BUSCAR_COLUNAS" } (nunca ocorre na prática)
```

---

## Sequência de Execução

```
1. DEFAULT_COLUMNS.map((name, index) => ({ id: name, name, position: index }))
2. return NextResponse.json({ columns })
// Zero I/O — retorno instantâneo
```

---

## Notas

- 🟢 Sem banco, sem autenticação, sem dependências externas
- 🟢 `try/catch` é redundante (operação puramente síncrona e in-memory, sem chance de throw)
