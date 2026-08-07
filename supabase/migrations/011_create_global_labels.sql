-- ============================================================================
-- Migration 011: Labels globais reutilizáveis (escopo do workspace)
-- ----------------------------------------------------------------------------
-- 1. Renomeia as tabelas legadas de labels (por board e workspace antigas)
-- 2. Cria workspaces + labels global com (workspace_id, name, color, timestamps)
-- 3. Migra os dados das tabelas antigas e do array tasks.labels
-- 4. Cria card_labels (join cartão <-> label) e descarta as tabelas legadas
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Renomear tabelas legadas (preserva dados para migração)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS labels RENAME TO labels_legacy;
ALTER TABLE IF EXISTS workspace_labels RENAME TO workspace_labels_legacy;
ALTER TABLE IF EXISTS card_workspace_label RENAME TO card_labels_legacy;

-- ----------------------------------------------------------------------------
-- 2. Workspaces + labels globais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace padrão (single-tenant atual). UUID fixo usado pela API.
INSERT INTO workspaces (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Workspace Padrão')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT labels_workspace_id_name_key UNIQUE (workspace_id, name)
);

-- ----------------------------------------------------------------------------
-- 3. Migrar dados: workspace_labels_legacy e labels_legacy -> labels
--    (prioriza workspace_labels; deduplica por nome, case-insensitive)
-- ----------------------------------------------------------------------------
INSERT INTO labels (workspace_id, name, color, created_at, updated_at)
SELECT DISTINCT ON (UPPER(name))
  '00000000-0000-0000-0000-000000000001'::uuid,
  name,
  color,
  created_at,
  NOW()
FROM (
  SELECT name, color, created_at, 1 AS priority FROM workspace_labels_legacy
  UNION ALL
  SELECT name, color, created_at, 0 AS priority FROM labels_legacy
) merged
ORDER BY UPPER(name), priority DESC, created_at DESC;

-- Backfill: nomes que só existem dentro do array tasks.labels ("NAME||COLOR")
INSERT INTO labels (workspace_id, name, color, created_at, updated_at)
SELECT DISTINCT
  '00000000-0000-0000-0000-000000000001'::uuid,
  split_part(lbl, '||', 1),
  COALESCE(NULLIF(split_part(lbl, '||', 2), ''), '#6B7280'),
  NOW(),
  NOW()
FROM tasks, unnest(COALESCE(tasks.labels, '{}'::TEXT[])) AS lbl
WHERE trim(lbl) <> ''
ON CONFLICT (workspace_id, name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Join table card_labels (cartão <-> label) + migração
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Migrar vínculos existentes (card_workspace_label -> card_labels por nome)
INSERT INTO card_labels (card_id, label_id)
SELECT cl.card_id, l.id
FROM card_labels_legacy cl
JOIN workspace_labels_legacy wl ON wl.id = cl.label_id
JOIN labels l ON l.name = wl.name
ON CONFLICT DO NOTHING;

-- Backfill: vínculos derivados do array tasks.labels
INSERT INTO card_labels (card_id, label_id)
SELECT DISTINCT t.id, l.id
FROM tasks t
JOIN unnest(COALESCE(t.labels, '{}'::TEXT[])) AS lbl ON true
JOIN labels l ON UPPER(l.name) = UPPER(split_part(lbl, '||', 1))
WHERE trim(lbl) <> ''
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Remover tabelas legadas
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS card_labels_legacy;
DROP TABLE IF EXISTS workspace_labels_legacy;
DROP TABLE IF EXISTS labels_legacy;

-- ----------------------------------------------------------------------------
-- 6. updated_at automático
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_labels_updated_at ON labels;
CREATE TRIGGER trg_labels_updated_at
BEFORE UPDATE ON labels
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Realtime: propagar alterações de labels para todos os clientes
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE labels;
  END IF;
END $$;

COMMIT;
