# Flowchart — Módulo `labels`

> `app/api/labels/route.ts`
>
> ⚠️ Labels **não têm persistência própria** — armazenadas como TEXT[] em `tasks.labels`.

```mermaid
flowchart TD
    A{Método HTTP?}
    A -- GET --> B[⚠️ Retorna SEMPRE array vazio]
    B --> C[200 OK - labels: empty array]

    A -- POST --> D[Extrai name do body]
    D --> E{name presente?}
    E -- Não --> ERR1[400 name obrigatório]
    E -- Sim --> F[Normaliza name para UPPERCASE]
    F --> G[Calcula cor via getLabelColor - hash determinístico]
    G --> H[Retorna label em memória id = name]
    H --> I[⚠️ NÃO persiste - a tarefa persiste o nome no seu TEXT[]]
    I --> J[200 OK - label object]

    A -- DELETE --> K[⚠️ NO-OP]
    K --> L[200 OK - success: true]
```
