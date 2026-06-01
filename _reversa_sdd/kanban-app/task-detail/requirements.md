# Task Detail — Requirements

> `kanban-app/task-detail/requirements.md`

## Descrição
Modal fullscreen de edição de task. Seções: título, descrição, assignees, labels, arquivos, comentários.

## Comportamento
- Abre ao clicar no `TaskCard`
- Botão `[ SAVE ]` chama `onSave` + `onClose`
- **Assignees:** toggle por clique — name do membro armazenado (não id)
- **Labels:** gerenciadas via `LabelManager` — estado local do modal
- **Arquivos:** lista de `TaskFile`; botão de upload via `input[type=file]` oculto → POST `/api/upload` → `window.location.reload()`
- **Comentários:** histórico com `max-h-60` scroll; `MentionInput` para novo comentário
- Botão `[ POST_COMMENT ]` desabilitado se campo vazio
- Linha de rodapé: CREATED timestamp + ID parcial

## Issues
- 🔴 Upload usa `window.location.reload()` (perde estado)
- 🟡 Labels não persistem via API separada — dependem do PATCH da task
