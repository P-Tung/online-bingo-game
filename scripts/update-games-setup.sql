-- Add setup tracking columns to games table
DO $$ 
BEGIN 
    -- Add setup_complete column to track if both players finished setup
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='setup_complete') THEN
        ALTER TABLE games ADD COLUMN setup_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add setup tracking to game_players table
DO $$ 
BEGIN 
    -- Add board_setup_complete column to track individual player setup status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_players' AND column_name='board_setup_complete') THEN
        ALTER TABLE game_players ADD COLUMN board_setup_complete BOOLEAN DEFAULT false;
    END IF;
END $$;
