# Etiquetas — Casos de Borda

> `edge-cases.md` | Módulo: `etiquetas` | doc_level: detalhado

---

## EC-01: Duas etiquetas com mesmo nome

- **Comportamento:** POST retorna objeto idêntico; sem erro de duplicidade (sem banco) 🔴
- **Resultado:** Cliente pode ter duas "etiquetas" com o mesmo `id`

---

## EC-02: Nome vazio `""`

- **Comportamento:** `"".toUpperCase() = ""` → `getLabelColor("")` retorna `LABEL_COLORS[0]` (#FFFFFF)
- **Resultado:** Label `{ id: "", name: "", color: "#FFFFFF" }` sem erro 🟡

---

## EC-03: Nome com espaços

- **Comportamento:** `"bug critico".toUpperCase() = "BUG CRITICO"` → id = `"BUG CRITICO"` 🟡
- **Resultado:** IDs com espaço são gerados sem normalização

---

## EC-04: DELETE sem parâmetros

- **Comportamento:** No-op — retorna `{ success: true }` independente de qualquer input 🔴
- **Resultado:** Impossível deletar uma etiqueta específica via API

---

## EC-05: Nome com caracteres Unicode

- **Comportamento:** `charCodeAt()` suporta Unicode — hash calculado sobre pontos de código
- **Resultado:** Cor gerada; id = nome transformado para uppercase 🟢

---

## EC-06: Reinício do servidor

- **Comportamento:** Labels criadas via POST em requisições anteriores não existem mais
- **Resultado:** Estado de labels perdido permanentemente 🔴 CRÍTICO
