-- Migration: Add notification preferences to team_members
-- Email and Telegram notification settings

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_verification_code TEXT;

-- Index for quick lookup by verification code
CREATE INDEX IF NOT EXISTS idx_team_members_telegram_code 
ON team_members(telegram_verification_code) 
WHERE telegram_verification_code IS NOT NULL;