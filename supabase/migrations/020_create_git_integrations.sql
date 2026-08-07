-- Power-up Git: repositórios sincronizados com as tarefas
CREATE TABLE IF NOT EXISTS git_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  repository_full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, provider, repository_full_name)
);

CREATE INDEX IF NOT EXISTS idx_git_integrations_workspace ON git_integrations(workspace_id);
