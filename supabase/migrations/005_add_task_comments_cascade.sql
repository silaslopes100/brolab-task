-- Add CASCADE ON DELETE for task_comments.task_id -> tasks.id
-- First drop the existing FK, then recreate with CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'task_comments_task_id_fkey'
      AND table_name = 'task_comments'
  ) THEN
    ALTER TABLE task_comments DROP CONSTRAINT task_comments_task_id_fkey;
  END IF;
END $$;

ALTER TABLE task_comments
  ADD CONSTRAINT task_comments_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE CASCADE;
