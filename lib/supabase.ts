import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Game = {
  id: string
  status: "waiting" | "setup" | "playing" | "finished"
  current_player: number
  winner: number | null
  show_opponent?: boolean
  setup_complete?: boolean
  created_at: string
}

export type GamePlayer = {
  id: string
  game_id: string
  player_number: number
  player_name: string
  board_numbers: number[]
  marked_numbers: number[]
  board_setup_complete?: boolean
  created_at: string
}

export type GameMove = {
  id: string
  game_id: string
  number_called: number
  called_by_player: number
  created_at: string
}
