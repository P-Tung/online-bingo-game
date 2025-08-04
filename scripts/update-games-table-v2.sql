-- Add show_opponent column to games table (with IF NOT EXISTS to avoid errors)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='show_opponent') THEN
        ALTER TABLE games ADD COLUMN show_opponent BOOLEAN DEFAULT true;
    END IF;
END $$;
