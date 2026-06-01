# Criar Etiqueta — Requisitos

> `requirements.md` | Caso de uso: `etiquetas/criar-etiqueta`

---

## Visão Geral

POST gera um objeto label em memória com cor determinística baseada no hash do nome. Sem persistência. 🔴

---

## Regras de Negócio

- `name` convertido para uppercase 🟢
- `id` = `name.toUpperCase()` (sem UUID) 🟡
- Cor = hash do nome sobre paleta de 7 cores 🟢
- Sem banco envolvido 🔴

---

## Critério de Aceite (legado)

```gherkin
Quando POST /api/labels { name: "bug" }
Então HTTP 200 { label: { id: "BUG", name: "BUG", color: "#<determinístico>" } }
E label não persiste no banco
```
