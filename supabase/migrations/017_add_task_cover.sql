-- Capa (imagem de fundo) dos cards do quadro
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
