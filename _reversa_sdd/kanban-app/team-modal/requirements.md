# Team Modal — Requirements

> `kanban-app/team-modal/requirements.md`

## Descrição
Modal de gestão de membros do time. Modo leitura para todos; modo edição (criar/excluir) apenas para admins.

## Comportamento
- Exibe todos os membros: nome, badge ADMIN (se admin), @username, role, email
- **Admin only:** botão DEL em membros (exceto o próprio usuário atual)
- **Admin only:** botão `[ + CREATE_USER ]` → abre formulário inline
- Formulário de criação: name, username, role, email, password, checkbox isAdmin
- Submit: campos name, email, password obrigatórios; username derivado de email se vazio; role default "COLLABORATOR"
- Username formatado: lowercase + dots (`.`)
- POST para `/api/users`; após sucesso: `fetchData()` + fecha form

## Issues
- 🔴 CRÍTICO: Admin cria usuários com senha em plaintext via frontend
- 🟡 MÉDIO: Sem confirmação antes de deletar membro
