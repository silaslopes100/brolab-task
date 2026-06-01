# Etiquetas

> `requirements.md` | Módulo: `etiquetas` | granularity: hybrid
> Fonte: `app/api/labels/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo de gestão de etiquetas (labels) para tarefas. **Crítico:** o módulo não possui persistência em banco de dados. O GET retorna sempre uma lista vazia hardcoded; POST e DELETE operam exclusivamente na memória da requisição, sem qualquer gravação. 🔴

---

## Responsabilidades

- GET: retornar lista de etiquetas (hardcoded `[]`) 🔴
- POST: gerar objeto de etiqueta em memória com cor determinística por nome 🟡
- DELETE: retornar sucesso sem executar nenhuma operação 🔴

---

## Regras de Negócio

- RN-01: GET sempre retorna `{ labels: [] }` — sem leitura do banco 🔴 CRÍTICO
- RN-02: POST cria label em memória: `id = name.toUpperCase()`, `name = name.toUpperCase()` 🟡
- RN-03: Cor calculada por hash determinístico de `name` sobre paleta de 7 cores 🟢
- RN-04: DELETE é no-op — retorna `{ success: true }` sem qualquer operação 🔴 CRÍTICO
- RN-05: Labels não são persistidas — não existem na tabela `task_labels` ou similar 🔴

---

## Paleta de Cores

| Índice | Hex | Descrição |
|--------|-----|-----------|
| 0 | `#FFFFFF` | Branco |
| 1 | `#6B7280` | Cinza |
| 2 | `#84CC16` | Verde lima |
| 3 | `#A3E635` | Verde claro |
| 4 | `#F97316` | Laranja |
| 5 | `#EF4444` | Vermelho |
| 6 | `#22C55E` | Verde |

---

## Algoritmo de Hash de Cor

```ts
function getLabelColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]
}
```

- Determinístico: mesmo nome → mesma cor em qualquer execução 🟢
- Distribuição uniforme sobre a paleta 🟢

---

## Requisitos Funcionais

| ID | Requisito | Estado | Criticidade |
|----|-----------|--------|------------|
| RF-01 | GET retorna lista de etiquetas | 🔴 retorna `[]` fixo | CRÍTICO |
| RF-02 | POST cria etiqueta com cor determinística | 🟡 em memória | ALTO |
| RF-03 | DELETE remove etiqueta | 🔴 no-op | CRÍTICO |

---

## Critérios de Aceite (legado real)

```gherkin
# GET — sempre retorna lista vazia
Quando GET /api/labels
Então HTTP 200 { labels: [] }

# POST — label em memória
Quando POST /api/labels { name: "urgente" }
Então HTTP 200 { label: { id: "URGENTE", name: "URGENTE", color: "#<hash>" } }

# DELETE — no-op
Quando DELETE /api/labels
Então HTTP 200 { success: true }  (sem efeito)
```

---

## Issues Conhecidas

| Severidade | Problema |
|-----------|---------|
| 🔴 CRÍTICO | Labels não são persistidas no banco |
| 🔴 CRÍTICO | GET sempre retorna lista vazia |
| 🔴 CRÍTICO | DELETE é no-op |
| 🟡 ALTO | Labels criados via POST se perdem ao reiniciar o servidor |

---

## Rastreabilidade

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/labels/route.ts` | `GET`, `POST`, `DELETE`, `getLabelColor` | 🟢 |
