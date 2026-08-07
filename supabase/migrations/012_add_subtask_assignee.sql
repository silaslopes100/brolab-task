-- ============================================================================
-- Migration 012: responsável (assignee_id) em subtarefas
-- ----------------------------------------------------------------------------
-- Adiciona o campo assignee_id (UUID -> team_members) para permitir atribuir
-- um membro responsável a cada subtarefa.
-- ============================================================================
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subtasks_assignee_id ON subtasks(assignee_id);
