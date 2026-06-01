# Criar Etiqueta — Design Técnico

> `design.md` | Caso de uso: `etiquetas/criar-etiqueta`

---

## Sequência

```
POST { name }
1. name.toUpperCase() → nameUpper
2. color = getLabelColor(nameUpper)
3. label = { id: nameUpper, name: nameUpper, color }
4. return { label }
```

---

## getLabelColor

```ts
hash = 0
for char in name:
  hash = charCode(char) + ((hash << 5) - hash)
return LABEL_COLORS[Math.abs(hash) % 7]
```

Sem acesso ao Supabase. Sem IO.
