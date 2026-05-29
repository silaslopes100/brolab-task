# Etiquetas — Contratos de API

> `contracts.md` | Módulo: `etiquetas` | doc_level: detalhado

---

## GET /api/labels

**Resposta (200) — sempre:**
```json
{ "labels": [] }
```
> 🔴 Lista sempre vazia — sem leitura de banco.

---

## POST /api/labels

**Requisição:**
```json
{ "name": "urgente" }
```

**Resposta (200):**
```json
{
  "label": {
    "id": "URGENTE",
    "name": "URGENTE",
    "color": "#EF4444"
  }
}
```
> 🟡 Label criada em memória. Não persiste entre requisições.

**Erro:**
```json
// 500
{ "error": "ERRO: FALHA_AO_CRIAR_ETIQUETA" }
```

---

## DELETE /api/labels

**Resposta (200) — sempre:**
```json
{ "success": true }
```
> 🔴 No-op — sem parâmetros, sem efeito.

---

## Mapeamento de Cor por Nome

| Nome | Hash | Cor |
|------|------|-----|
| `"URGENTE"` | determinístico | `#EF4444` (vermelho) |
| `"BUG"` | determinístico | depende do hash |
| (qualquer nome) | `Math.abs(hash) % 7` | índice na paleta de 7 cores |
