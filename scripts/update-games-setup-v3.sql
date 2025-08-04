-- Drop and recreate columns to ensure they exist properly
DO $$ 
BEGIN 
    -- Add setup_complete column to games table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='setup_complete') THEN
        ALTER TABLE games ADD COLUMN setup_complete BOOLEAN DEFAULT false;
    END IF;
    
    -- Add board_setup_complete column to game_players table  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_players' AND column_name='board_setup_complete') THEN
        ALTER TABLE game_players ADD COLUMN board_setup_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update existing games to have setup_complete = false
UPDATE games SET setup_complete = false WHERE setup_complete IS NULL;

-- Update existing players to have board_setup_complete = false  
UPDATE game_players SET board_setup_complete = false WHERE board_setup_complete IS NULL;
