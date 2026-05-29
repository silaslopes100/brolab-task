# Flowchart — Componente `MentionInput` (detalhado)

> Componente: `MentionInput` — `app/page.tsx`
>
> Autocomplete de @menções com filtro em tempo real sobre lista de membros.

```mermaid
flowchart TD
    START([Usuário digita no textarea]) --> onChange[handleChange disparado]
    onChange --> V1[newValue = e.target.value]
    V1 --> V2[Atualiza valor via onChange callback]
    V2 --> L1[lastAtIndex = newValue.lastIndexOf '@']

    L1 --> L2{lastAtIndex === -1?}
    L2 -- Sim --> HIDE[setShowMentions: false]

    L2 -- Não --> L3{lastAtIndex === newValue.length - 1?}
    L3 -- Sim - @ recém digitado --> SHOW1[setShowMentions: true - setMentionFilter: '']

    L3 -- Não --> L4[textAfterAt = newValue.slice lastAtIndex + 1]
    L4 --> L5{textAfterAt.includes ' '?}
    L5 -- Sim --> HIDE
    L5 -- Não --> SHOW2[setShowMentions: true - setMentionFilter: textAfterAt.toLowerCase]

    SHOW1 & SHOW2 --> FILTER[filteredTeam = team.filter username or name inclui mentionFilter]
    FILTER --> RENDER{filteredTeam.length > 0?}
    RENDER -- Sim --> DROPDOWN[Renderiza dropdown com membros filtrados]
    RENDER -- Não --> HIDE

    DROPDOWN --> SELECT[Usuário clica em um membro]
    SELECT --> REPLACE[lastAtIndex → substitui @filter por @username + espaço]
    REPLACE --> FOCUS[textarea.focus]
    FOCUS --> HIDE
```

## Exemplo de substituição

```
Antes:  "olá @jo"       (lastAtIndex = 4, textAfterAt = "jo")
Depois: "olá @joao.silva " (membro selecionado com username "joao.silva")
```
