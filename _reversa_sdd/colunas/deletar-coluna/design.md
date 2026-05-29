# Deletar Coluna — Design Técnico

> `design.md` | Caso de uso: `colunas/deletar-coluna`

---

## Interface

```
DELETE /api/columns
→ 200: { success: true }  (sempre)
```

---

## Sequência

```
1. return NextResponse.json({ success: true })
// Handler vazio — nenhuma operação
```

---

## Notas

- 🔴 No-op completo — implementar DELETE real requer tabela `columns` + estratégia de migração de tasks
