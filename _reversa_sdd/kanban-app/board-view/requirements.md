# Board View — Requirements

> `kanban-app/board-view/requirements.md`

## Descrição
Área principal do board Kanban. Scroll horizontal de colunas. Cada coluna tem scroll vertical de cards.

## Comportamento
- Colunas exibidas em ordem de `column.position`
- Botão `[ + NEW COLUMN ]` ao final do scroll horizontal
- Status bar no topo: COLUMNS count + TASKS count
- Colunas com nome em `DEFAULT_COLUMN_NAMES` não exibem botão de exclusão
- Task cards clicáveis → abre `TaskEditModal`
- Navegação de task: ← → move entre colunas; ▲ ▼ reordena dentro da coluna
- Altura fixa: `calc(100vh - 200px)` com overflow-x: auto

## Responsividade
- Mobile: colunas com `w-72`, desktop `w-80`
- Header colapsa verticalmente em mobile
