
"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import LanguageSelector from "@/components/language-selector"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [gameId, setGameId] = useState("")
  const [showOpponent, setShowOpponent] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  // Load saved player name from localStorage on component mount
  useEffect(() => {
    const savedName = localStorage.getItem("bingo-player-name")
    if (savedName) {
      setPlayerName(savedName)
    }
  }, [])

  // Save player name to localStorage whenever it changes
  const handleNameChange = (name: string) => {
    setPlayerName(name)
    if (name.trim()) {
      localStorage.setItem("bingo-player-name", name.trim())
    } else {
      localStorage.removeItem("bingo-player-name")
    }
  }

  const createGame = async () => {
    if (!playerName.trim()) return

    setLoading(true)
    try {
      console.log("Creating new game...")

      // Check if Firebase is properly initialized
      if (!db) {
        throw new Error("Firebase database is not initialized");
      }

      // Create game document
      const gameRef = await addDoc(collection(db, "games"), {
        status: "waiting",
        current_player: 1,
        winner: null,
        show_opponent: showOpponent,
        setup_complete: false,
        created_at: serverTimestamp(),
      })

      console.log("Game created with ID:", gameRef.id)

      // Add player 1 to the game with empty board for setup
      const playerRef = await addDoc(collection(db, "game_players"), {
        game_id: gameRef.id,
        player_number: 1,
        player_name: playerName.trim(),
        board_numbers: [], // Empty board - will be set up later
        marked_numbers: [],
        board_setup_complete: false,
        created_at: serverTimestamp(),
      })

      console.log("Player 1 added to game with ID:", playerRef.id)

      // Save player info to localStorage for game identification
      localStorage.setItem(
        `bingo-player-${gameRef.id}`,
        JSON.stringify({
          playerNumber: 1,
          playerName: playerName.trim(),
        }),
      )

      // Navigate to game page
      router.push(`/game/${gameRef.id}`)
    } catch (error) {
      console.error("Error creating game:", error)
      if (error instanceof Error) {
        alert(`${t("error.createGameFailed")}: ${error.message}`)
      } else {
        alert(t("error.createGameFailed"))
      }
    } finally {
      setLoading(false)
    }
  }

  const joinGame = async () => {
    if (!playerName.trim() || !gameId.trim()) return

    setLoading(true)
    try {
      console.log("Joining game with PIN:", gameId)

      // Find game by matching last 4 characters of the ID
      const gamesSnapshot = await getDocs(query(collection(db, "games"), where("status", "==", "waiting")))
      
      const matchingGame = gamesSnapshot.docs.find(doc => 
        doc.id.slice(-4).toLowerCase() === gameId.toLowerCase()
      )

      if (!matchingGame) {
        alert(t("error.gameNotFound"))
        return
      }

      console.log("Found matching game:", matchingGame.id)

      // Add player 2 to the game with empty board for setup
      const playerRef = await addDoc(collection(db, "game_players"), {
        game_id: matchingGame.id,
        player_number: 2,
        player_name: playerName.trim(),
        board_numbers: [], // Empty board - will be set up later
        marked_numbers: [],
        board_setup_complete: false,
        created_at: serverTimestamp(),
      })

      console.log("Player 2 added to game")

      // Update game status to setup phase
      await updateDoc(doc(db, "games", matchingGame.id), {
        status: "setup"
      })

      console.log("Game status updated to setup")

      // Save player info to localStorage for game identification
      localStorage.setItem(
        `bingo-player-${matchingGame.id}`,
        JSON.stringify({
          playerNumber: 2,
          playerName: playerName.trim(),
        }),
      )

      // Navigate to game page
      router.push(`/game/${matchingGame.id}`)
    } catch (error) {
      console.error("Error joining game:", error)
      if (error instanceof Error) {
        alert(`${t("error.joinGameFailed")}: ${error.message}`)
      } else {
        alert(t("error.joinGameFailed"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Language Selector */}
        <div className="flex justify-center">
          <LanguageSelector />
        </div>

        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">🎲 Bingo</h1>
          <p className="text-gray-600">{t("home.subtitle")}</p>
        </div>

        {/* Player Name Input */}
        <Card>
          <CardHeader>
            <CardTitle>{t("home.enterName")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder={t("home.namePlaceholder")}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={20}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Create Game */}
        <Card>
          <CardHeader>
            <CardTitle>{t("home.createGame")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="show-opponent" checked={showOpponent} onCheckedChange={setShowOpponent} />
              <Label htmlFor="show-opponent" className="text-sm">
                {t("home.showOpponent")}
              </Label>
            </div>
            <Button onClick={createGame} disabled={!playerName.trim() || loading} className="w-full">
              {loading ? t("home.creating") : t("home.createGameButton")}
            </Button>
          </CardContent>
        </Card>

        {/* Join Game */}
        <Card>
          <CardHeader>
            <CardTitle>{t("home.joinGame")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder={t("home.enterPin")}
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full text-center text-lg font-mono"
            />
            <Button onClick={joinGame} disabled={!playerName.trim() || !gameId.trim() || loading} className="w-full">
              {loading ? t("home.joining") : t("home.joinGameButton")}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("home.howToPlay")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. {t("home.step1")}</p>
            <p>2. {t("home.step2")}</p>
            <p>3. {t("home.step3")}</p>
            <p>4. {t("home.step4")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
