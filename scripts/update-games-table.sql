-- Add show_opponent column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS show_opponent BOOLEAN DEFAULT true;
