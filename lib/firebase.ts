
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

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
