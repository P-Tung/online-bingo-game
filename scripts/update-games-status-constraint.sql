-- Update the games table status constraint to include 'setup'
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (status IN ('waiting', 'setup', 'playing', 'finished'));
