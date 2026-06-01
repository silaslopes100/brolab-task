-- Fix column_position for tasks orphaned by column renames.
-- Migration 006 backfilled via tasks.status = columns.name, but if a column
-- was renamed (e.g. FEITO -> APROVADO), those tasks fell to default 0.

-- First pass: map known renamed statuses to their current column
UPDATE tasks
SET column_position = (SELECT position FROM columns WHERE name = 'APROVADO')
WHERE status = 'FEITO'
  AND column_position IS DISTINCT FROM (SELECT position FROM columns WHERE name = 'APROVADO');

-- Second pass: any remaining tasks with an invalid column_position go to backlog
UPDATE tasks
SET column_position = 0
WHERE column_position IS NULL
   OR column_position NOT IN (SELECT position FROM columns);
