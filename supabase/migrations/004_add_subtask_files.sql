-- Add subtask_id column to task_files
ALTER TABLE task_files ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_task_files_subtask_id ON task_files(subtask_id);
