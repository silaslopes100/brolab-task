CREATE TABLE IF NOT EXISTS workspace_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00ff88',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, color)
);

CREATE TABLE IF NOT EXISTS card_workspace_label (
  card_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES workspace_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);
