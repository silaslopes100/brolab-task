# Deletar Coluna — Requisitos

> `requirements.md` | Caso de uso: `colunas/deletar-coluna`
> Fonte: `app/api/columns/route.ts` (DELETE handler)

---

## Visão Geral

Endpoint que simula a deleção de uma coluna — retorna sempre `{ success: true }` sem executar nenhuma operação. É uma implementação stub. 🟢 (documentando comportamento real)

---

## Responsabilidades

- Retornar `{ success: true }` independente do input 🟢

---

## Regras de Negócio

- RN-01: Sem operação real — nenhuma coluna é removida 🔴
- RN-02: Sem validação de `id` ou existência 🔴
- RN-03: Tasks da coluna "deletada" permanecem intactas no banco 🟢

---

## Critérios de Aceite

```gherkin
Quando DELETE /api/columns (qualquer input)
Então sempre HTTP 200 { success: true }
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| DELETE handler | `app/api/columns/route.ts` | 40-42 |
