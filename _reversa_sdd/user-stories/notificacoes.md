# User Stories — Notificações

> `user-stories/notificacoes.md` | BrolabTask

---

## Épico: Notificações

**US-13** — Como **membro do time**, quero receber notificações em tempo real quando sou mencionado em um comentário, para que eu não perca contexto importante.

**Critérios de aceite:**
- Quando alguém usa `@meu_username` em um comentário, recebo uma notificação
- A notificação aparece imediatamente via Supabase Realtime (sem reload)
- O contador vermelho no sino aumenta

---

**US-14** — Como **membro do time**, quero visualizar minhas notificações, para acompanhar atividades relevantes.

**Critérios de aceite:**
- Clico em `[ NOTIF ]` no header
- Vejo a lista de notificações com: mensagem, título da task e timestamp em pt-BR
- Notificações não lidas têm borda verde e ponto indicador

---

**US-15** — Como **membro do time**, quero marcar uma notificação como lida, para controlar o que já processei.

**Critérios de aceite:**
- Clico em uma notificação → ela fica marcada como lida imediatamente (otimistic update)
- O contador do sino diminui
- A borda muda para cinza, o ponto desaparece

---

**US-16** — Como **membro do time**, quero limpar todas as minhas notificações de uma vez, para manter o painel organizado.

**Critérios de aceite:**
- Botão `[ CLEAR_ALL ]` no modal de notificações
- Todas as notificações são removidas do banco e do estado local
- Contador do sino vai a zero

---

## Épico: Perfil e Time

**US-17** — Como **membro do time**, quero editar meu perfil (nome, email, senha, role), para manter minhas informações atualizadas.

**Critérios de aceite:**
- Botão `[ EDIT_PROFILE ]` no header
- Posso alterar nome, email, role
- Campo de senha: deixar vazio = não altera a senha
- Após salvar, o header reflete o novo username imediatamente

---

**US-18** — Como **administrador**, quero convidar novos membros ao time, para expandir a equipe.

**Critérios de aceite:**
- Acesso ao modal `[ VIEW_TEAM ]`
- Vejo badge `[ ADMIN_MODE ]` no título do modal
- Formulário de criação: nome, username, role, email, senha, flag de admin
- Novo membro aparece na lista após criação

---

**US-19** — Como **administrador**, quero remover membros do time, para manter o time organizado.

**Critérios de aceite:**
- Botão DEL aparece ao lado de cada membro (exceto eu mesmo)
- Membro é removido da lista após confirmação da API

---

**US-20** — Como **membro não-administrador**, quero visualizar o time sem poder editar, para ter visibilidade da equipe.

**Critérios de aceite:**
- Botão `[ VIEW_TEAM ]` disponível para todos
- Formulário de criação e botões DEL não aparecem para não-admins
