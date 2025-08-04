"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
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

      // Create new game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          status: "waiting",
          setup_complete: false,
          show_opponent: showOpponent,
        })
        .select()
        .single()

      if (gameError) {
        console.error("Game creation error:", gameError)
        throw gameError
      }

      console.log("Game created:", game.id)

      // Add player 1 to the game with empty board for setup
      const { data: player, error: playerError } = await supabase
        .from("game_players")
        .insert({
          game_id: game.id,
          player_number: 1,
          player_name: playerName.trim(),
          board_numbers: [], // Empty board - will be set up later
          board_setup_complete: false,
        })
        .select()
        .single()

      if (playerError) {
        console.error("Player creation error:", playerError)
        throw playerError
      }

      console.log("Player 1 added to game")

      // Store player info in localStorage
      localStorage.setItem(
        `bingo-player-${game.id}`,
        JSON.stringify({
          playerNumber: 1,
          playerName: playerName.trim(),
        }),
      )

      router.push(`/game/${game.id}`)
    } catch (error) {
      console.error("Error creating game:", error)
      alert(t("error.createGame"))
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
      const { data: games, error: gamesError } = await supabase.from("games").select("*").eq("status", "waiting")

      if (gamesError) throw gamesError

      const matchingGame = games?.find((game) => game.id.slice(-4).toLowerCase() === gameId.toLowerCase())

      if (!matchingGame) {
        alert(t("error.gameNotFound"))
        return
      }

      console.log("Found matching game:", matchingGame.id)

      // Add player 2 to the game with empty board for setup
      const { data: player, error: playerError } = await supabase
        .from("game_players")
        .insert({
          game_id: matchingGame.id,
          player_number: 2,
          player_name: playerName.trim(),
          board_numbers: [], // Empty board - will be set up later
          board_setup_complete: false,
        })
        .select()
        .single()

      if (playerError) {
        console.error("Player 2 creation error:", playerError)
        throw playerError
      }

      console.log("Player 2 added to game")

      // Update game status to setup phase
      const { data: updatedGame, error: updateError } = await supabase
        .from("games")
        .update({ status: "setup" })
        .eq("id", matchingGame.id)
        .select()
        .single()

      if (updateError) {
        console.error("Game status update error:", updateError)
        throw updateError
      }

      console.log("Game status updated to setup")

      // Broadcast player joined event
      const channel = supabase.channel(`game:${matchingGame.id}`)
      await channel.send({
        type: "broadcast",
        event: "player_joined",
        payload: { player },
      })

      // Broadcast game updated event
      await channel.send({
        type: "broadcast",
        event: "game_updated",
        payload: { game: updatedGame },
      })

      // Store player info in localStorage
      localStorage.setItem(
        `bingo-player-${matchingGame.id}`,
        JSON.stringify({
          playerNumber: 2,
          playerName: playerName.trim(),
        }),
      )

      router.push(`/game/${matchingGame.id}`)
    } catch (error) {
      console.error("Error joining game:", error)
      alert(t("error.joinGame"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-center text-2xl font-bold">{t("home.title")}</CardTitle>
            <LanguageSelector />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Input
              placeholder={t("home.enterName")}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mb-4"
            />
            {playerName && <div className="text-xs text-green-600 mb-2">{t("home.nameSaved")}</div>}
          </div>

          <div className="space-y-4">
            {/* Game Settings for Create Game */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm">{t("home.gameSettings")}</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-opponent" className="text-sm font-medium">
                    {t("home.allowOpponentView")}
                  </Label>
                  <div className="text-xs text-gray-500">{t("home.opponentViewDesc")}</div>
                </div>
                <Switch id="show-opponent" checked={showOpponent} onCheckedChange={setShowOpponent} />
              </div>
            </div>

            <Button onClick={createGame} disabled={!playerName.trim() || loading} className="w-full">
              {t("home.createGame")}
            </Button>

            <div className="text-center text-sm text-gray-500">{t("home.or")}</div>

            <div className="space-y-2">
              <Input
                placeholder={t("home.enterPin")}
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                maxLength={4}
              />
              <Button
                onClick={joinGame}
                disabled={!playerName.trim() || !gameId.trim() || loading}
                className="w-full bg-transparent"
                variant="outline"
              >
                {t("home.joinGame")}
              </Button>
            </div>
          </div>

          {/* Real-time indicator */}
          <div className="text-center text-xs text-green-600 bg-green-50 p-2 rounded">⚡ Real-time updates enabled</div>
        </CardContent>
      </Card>
    </div>
  )
}
