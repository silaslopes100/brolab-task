-- Adiciona campos de navegação nas notificações (deep link para tarefa/subtarefa)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS board_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS subtask_id UUID;

CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_subtask_id ON notifications(subtask_id);
