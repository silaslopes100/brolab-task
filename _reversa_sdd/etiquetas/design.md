# Etiquetas — Design Técnico

> `design.md` | Módulo: `etiquetas` | doc_level: detalhado

---

## Interface

| Método | Caminho | Entrada | Saída | Observação |
|--------|---------|---------|-------|-----------|
| GET | `/api/labels` | — | `{ labels: [] }` | Hardcoded — sem DB |
| POST | `/api/labels` | `{ name }` | `{ label }` | Em memória |
| DELETE | `/api/labels` | — | `{ success: true }` | No-op |

---

## Fluxo GET

```
1. return { labels: [] }   ← hardcoded, sem banco
```

---

## Fluxo POST

```
1. { name } = await request.json()
2. label = {
     id:    name.toUpperCase(),
     name:  name.toUpperCase(),
     color: getLabelColor(name.toUpperCase())
   }
3. return { label }
```

---

## Fluxo DELETE

```
1. return { success: true }   ← no-op
```

---

## Tipo retornado pelo POST

```ts
type LabelItem = {
  id: string      // = name.toUpperCase()
  name: string    // = name.toUpperCase()
  color: string   // hex "#RRGGBB"
}
```

---

## Ausências Críticas

- Sem `createAdminClient()` — único módulo da API sem acesso ao Supabase
- Sem tabela `labels` ou `task_labels` no banco
- Sem `taskId` no POST — label não é associada a nenhuma task via API
- Integração com tasks: labels são gerenciadas exclusivamente no estado React da SPA (`app/page.tsx`)
