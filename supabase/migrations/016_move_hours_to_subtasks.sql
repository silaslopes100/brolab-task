-- Move a granularidade de horas para as subtarefas.
-- Remove os campos de horas da tarefa pai (se existirem no schema antigo).
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;

-- Garante os campos de horas nas subtarefas.
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS estimated_hours DOUBLE PRECISION DEFAULT 0;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS actual_hours DOUBLE PRECISION DEFAULT 0;
