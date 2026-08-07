-- Adiciona URL do avatar do usuário (foto de perfil)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
