-- Add column_position to tasks, referencing columns.position instead of columns.name
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS column_position INTEGER;

-- Backfill: set column_position based on current status matching columns.name
UPDATE tasks
SET column_position = c.position
FROM columns c
WHERE tasks.status = c.name
  AND tasks.column_position IS NULL;

-- Default any remaining nulls to 0
UPDATE tasks SET column_position = 0 WHERE column_position IS NULL;

-- Make column_position NOT NULL after backfill
ALTER TABLE tasks ALTER COLUMN column_position SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN column_position SET DEFAULT 0;
