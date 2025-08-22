
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Debug logging for environment variables
console.log('Firebase Environment Variables Check:');
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing');
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
console.log('Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Missing');
console.log('Messaging Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Missing');
console.log('App ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set' : 'Missing');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
};

console.log('Initializing Firebase with config:', firebaseConfig);

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { db, auth };

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
