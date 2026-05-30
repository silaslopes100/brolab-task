CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  estimated_hours DOUBLE PRECISION DEFAULT 0,
  time_spent DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'BACKLOG',
  position INTEGER NOT NULL DEFAULT 0,
  assignees TEXT[] DEFAULT '{}',
  timer_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_task_comments_subtask_id ON task_comments(subtask_id);
