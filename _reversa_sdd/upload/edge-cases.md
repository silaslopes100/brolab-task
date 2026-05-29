# Upload — Casos de Borda

> `edge-cases.md` | Módulo: `upload` | doc_level: detalhado

---

## EC-01: Arquivo sem extensão

- **Cenário:** `file.name = "documento"` (sem ponto)
- **Comportamento:** `file.name.split(".").pop()` → `"documento"` (retorna a string inteira)
- **Resultado:** `fileName = "${taskId}/${uuid}.documento"` — path incomum mas funcional 🟡

---

## EC-02: Colisão de UUID (probabilidade ínfima)

- **Cenário:** `crypto.randomUUID()` gera UUID já existente
- **Comportamento:** `upsert: false` → `storage.upload` falha com erro de conflito
- **Resultado:** HTTP 500 `"FALHA_AO_ENVIAR_ARQUIVO"` 🟢 (correto negar sobrescrever)

---

## EC-03: `taskId` inválido (não corresponde a task real)

- **Cenário:** `taskId = "uuid-fake"`
- **Comportamento:** Upload no Storage sucede; INSERT em `task_files` pode falhar por FK violation
- **Resultado:** HTTP 500 — Storage tem arquivo sem registro no banco 🟡 (arquivo órfão)

---

## EC-04: Bucket `task-files` em inconsistência

- **Cenário:** `getBucket()` retorna erro mas `createBucket()` também falha
- **Comportamento:** Código prossegue para `storage.upload()` sem bucket → falha
- **Resultado:** HTTP 500 🟡 (sem tratamento específico para falha na criação do bucket)

---

## EC-05: Arquivo de tamanho zero

- **Cenário:** `file.size = 0`
- **Comportamento:** `new Uint8Array(buffer)` → buffer vazio → upload sucede 🟡
- **Resultado:** Arquivo vazio registrado no banco e Storage sem erro

---

## EC-06: Tipo MIME forjado

- **Cenário:** Cliente envia `type = "image/png"` mas arquivo é um executável
- **Comportamento:** `{ contentType: file.type }` passa o tipo declarado sem validação
- **Resultado:** 🔴 Arquivo perigoso aceito com tipo forjado
