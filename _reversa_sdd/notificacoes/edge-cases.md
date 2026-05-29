# Notificações — Casos de Borda

> `edge-cases.md` | Módulo: `notificacoes` | doc_level: detalhado

---

## EC-01: GET com erro no banco retorna corpo inconsistente

- **Comportamento:** `SELECT` falha → `return NextResponse.json({ notifications: [] }, { status: 500 })`
- **Resultado:** 🟡 HTTP 500 mas corpo é `{ notifications: [] }`, não `{ error: "..." }`

---

## EC-02: PATCH com `isRead = undefined`

- **Cenário:** Body `{ id: "uuid" }` sem `isRead`
- **Comportamento:** `UPDATE SET read = undefined` → Supabase pode ignorar ou lançar erro
- **Resultado:** 🟡 Comportamento indefinido

---

## EC-03: PATCH marcando notificação de outro usuário

- **Cenário:** Usuário A marca como lida notificação pertencente ao usuário B
- **Comportamento:** `UPDATE WHERE id = id` sem checar `user_id` → atualização bem-sucedida
- **Resultado:** 🔴 Sem isolamento de dados entre usuários

---

## EC-04: DELETE limpa notificações de outro usuário

- **Cenário:** `DELETE /api/notifications?userId=uuid-outro`
- **Comportamento:** `DELETE WHERE user_id = userId` sem autenticação
- **Resultado:** 🔴 Qualquer cliente pode limpar notificações de qualquer usuário

---

## EC-05: GET com userId inexistente

- **Cenário:** `userId = "uuid-falso"`
- **Comportamento:** `SELECT WHERE user_id = 'uuid-falso'` retorna `[]`
- **Resultado:** 🟢 HTTP 200 `{ notifications: [] }` — sem erro

---

## EC-06: Múltiplos DELETE em sequência

- **Cenário:** DELETE chamado duas vezes para o mesmo `userId`
- **Comportamento:** 2ª chamada deleta 0 registros, sem erro
- **Resultado:** 🟢 Idempotente
