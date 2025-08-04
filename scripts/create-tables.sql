-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_player INTEGER DEFAULT 1 CHECK (current_player IN (1, 2)),
  winner INTEGER CHECK (winner IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_players table
CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_number INTEGER CHECK (player_number IN (1, 2)),
  player_name TEXT NOT NULL,
  board_numbers INTEGER[] DEFAULT '{}',
  marked_numbers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, player_number)
);

-- Create game_moves table
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  number_called INTEGER CHECK (number_called >= 1 AND number_called <= 25),
  called_by_player INTEGER CHECK (called_by_player IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you might want to restrict this in production)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_players" ON game_players FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_moves" ON game_moves FOR ALL USING (true);
