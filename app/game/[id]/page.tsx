"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import { supabase, type Game, type GamePlayer, type GameMove } from "@/lib/supabase"
import BoardSetup from "@/components/board-setup"
import GameHeader from "@/components/game-header"
import { useLanguage } from "@/contexts/language-context"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Broadcast event types
type BroadcastEvent =
  | { type: "player_joined"; payload: { player: GamePlayer } }
  | { type: "game_updated"; payload: { game: Game } }
  | { type: "board_setup_complete"; payload: { playerId: string; playerNumber: number } }
  | { type: "number_called"; payload: { move: GameMove; updatedPlayers: GamePlayer[] } }
  | { type: "game_finished"; payload: { winner: GamePlayer; game: Game } }

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const { t } = useLanguage()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [moves, setMoves] = useState<GameMove[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<GamePlayer | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [showOpponentArea, setShowOpponentArea] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Realtime channel ref
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Function to fetch initial game data (only called once)
  const fetchInitialGameData = async () => {
    try {
      console.log("Fetching initial game data for:", gameId)

      // Load game
      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).single()
      console.log("Game data:", gameData)

      // Load players
      const { data: playersData } = await supabase
        .from("game_players")
        .select("*")
        .eq("game_id", gameId)
        .order("player_number")
      console.log("Players data:", playersData)

      // Load moves
      const { data: movesData } = await supabase
        .from("game_moves")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at")

      setGame(gameData)
      setPlayers(playersData || [])
      setMoves(movesData || [])

      // AUTO-FIX: If we have 2 players but game is still "waiting", update to "setup"
      if (gameData && gameData.status === "waiting" && playersData && playersData.length === 2) {
        console.log("Auto-fixing: Game has 2 players but status is still 'waiting', updating to 'setup'")
        try {
          const { data: updatedGame } = await supabase
            .from("games")
            .update({ status: "setup" })
            .eq("id", gameId)
            .select()
            .single()

          if (updatedGame) {
            setGame(updatedGame)
            // Broadcast the game update
            channelRef.current?.send({
              type: "broadcast",
              event: "game_updated",
              payload: { game: updatedGame },
            })
          }
        } catch (error) {
          console.error("Error updating game status:", error)
        }
      }

      // Identify current player from localStorage
      const storedPlayerInfo = localStorage.getItem(`bingo-player-${gameId}`)
      if (storedPlayerInfo && playersData) {
        const playerInfo = JSON.parse(storedPlayerInfo)
        const player = playersData.find(
          (p) => p.player_number === playerInfo.playerNumber && p.player_name === playerInfo.playerName,
        )
        if (player) {
          console.log("Current player found:", player)
          setCurrentPlayer(player)
        }
      }
    } catch (error) {
      console.error("Error loading initial game data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Set up realtime subscription
  const setupRealtimeSubscription = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    console.log("Setting up realtime subscription for game:", gameId)

    const channel = supabase
      .channel(`game:${gameId}`)
      .on("broadcast", { event: "player_joined" }, ({ payload }: { payload: BroadcastEvent["payload"] }) => {
        console.log("Player joined event received:", payload)
        if ("player" in payload) {
          setPlayers((prev) => {
            const exists = prev.find((p) => p.id === payload.player.id)
            if (exists) return prev
            return [...prev, payload.player].sort((a, b) => a.player_number - b.player_number)
          })
        }
      })
      .on("broadcast", { event: "game_updated" }, ({ payload }: { payload: BroadcastEvent["payload"] }) => {
        console.log("Game updated event received:", payload)
        if ("game" in payload) {
          setGame((prevGame) => {
            // Only update if this is a different update (to prevent loops)
            if (prevGame?.current_player !== payload.game.current_player || prevGame?.status !== payload.game.status) {
              return payload.game
            }
            return prevGame
          })
        }
      })
      .on("broadcast", { event: "board_setup_complete" }, ({ payload }: { payload: BroadcastEvent["payload"] }) => {
        console.log("Board setup complete event received:", payload)
        if ("playerId" in payload) {
          setPlayers((prev) => prev.map((p) => (p.id === payload.playerId ? { ...p, board_setup_complete: true } : p)))
        }
      })
      .on("broadcast", { event: "number_called" }, ({ payload }: { payload: BroadcastEvent["payload"] }) => {
        console.log("Number called event received:", payload)
        if ("move" in payload && "updatedPlayers" in payload) {
          // Only update if this move isn't already in our local state (to prevent duplicates)
          setMoves((prev) => {
            const exists = prev.find((m) => m.id === payload.move.id)
            if (exists) return prev
            return [...prev, payload.move]
          })

          // Update players state
          setPlayers((prev) => {
            // Only update if the marked numbers are different
            const needsUpdate = prev.some((localPlayer) => {
              const updatedPlayer = payload.updatedPlayers.find((p) => p.id === localPlayer.id)
              return updatedPlayer && localPlayer.marked_numbers.length !== updatedPlayer.marked_numbers.length
            })

            if (needsUpdate) {
              return payload.updatedPlayers
            }
            return prev
          })

          // Update current player state if they have the called number
          if (currentPlayer && currentPlayer.board_numbers.includes(payload.move.number_called)) {
            setCurrentPlayer((prev) => {
              if (!prev) return prev
              const alreadyMarked = prev.marked_numbers.includes(payload.move.number_called)
              if (alreadyMarked) return prev

              return {
                ...prev,
                marked_numbers: [...prev.marked_numbers, payload.move.number_called],
              }
            })
          }
        }
      })
      .on("broadcast", { event: "game_finished" }, ({ payload }: { payload: BroadcastEvent["payload"] }) => {
        console.log("Game finished event received:", payload)
        if ("winner" in payload && "game" in payload) {
          setGame(payload.game)
        }
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status)
      })

    channelRef.current = channel
  }

  const handleBoardSetup = async (boardNumbers: number[]) => {
    if (!currentPlayer) return

    try {
      console.log("Submitting board setup for player", currentPlayer.player_number)

      // Update player's board and mark setup as complete
      const { data: updatedPlayer } = await supabase
        .from("game_players")
        .update({
          board_numbers: boardNumbers,
          board_setup_complete: true,
        })
        .eq("id", currentPlayer.id)
        .select()
        .single()

      if (updatedPlayer) {
        setCurrentPlayer(updatedPlayer)

        // Broadcast board setup completion
        channelRef.current?.send({
          type: "broadcast",
          event: "board_setup_complete",
          payload: {
            playerId: currentPlayer.id,
            playerNumber: currentPlayer.player_number,
          },
        })
      }

      console.log("Board setup submitted successfully")

      // Check if both players have completed setup
      const { data: allPlayers } = await supabase
        .from("game_players")
        .select("board_setup_complete")
        .eq("game_id", gameId)

      console.log("All players setup status:", allPlayers)

      const bothPlayersReady = allPlayers?.every((player) => player.board_setup_complete)
      console.log("Both players ready:", bothPlayersReady)

      if (bothPlayersReady) {
        console.log("Starting the game...")
        // Start the game
        const { data: updatedGame } = await supabase
          .from("games")
          .update({
            status: "playing",
            setup_complete: true,
          })
          .eq("id", gameId)
          .select()
          .single()

        if (updatedGame) {
          setGame(updatedGame)
          // Broadcast game update
          channelRef.current?.send({
            type: "broadcast",
            event: "game_updated",
            payload: { game: updatedGame },
          })
        }
      }
    } catch (error) {
      console.error("Error submitting board setup:", error)
    }
  }

  useEffect(() => {
    if (!gameId) return

    // Load initial data and set up realtime
    fetchInitialGameData()
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log("Cleaning up realtime subscription")
        channelRef.current.unsubscribe()
      }
    }
  }, [gameId])

  const copyPinToClipboard = async () => {
    const pin = gameId.slice(-4).toUpperCase()
    try {
      await navigator.clipboard.writeText(pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy PIN:", error)
      const textArea = document.createElement("textarea")
      textArea.value = pin
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const callNumber = async (number: number) => {
    if (!game || !currentPlayer || game.current_player !== currentPlayer.player_number) return

    // Check if number has already been called
    const alreadyCalled = moves.some((move) => move.number_called === number)
    if (alreadyCalled) {
      console.log("Number already called:", number)
      setSelectedNumber(null)
      return
    }

    try {
      // Add the move to database
      const { data: newMove } = await supabase
        .from("game_moves")
        .insert({
          game_id: gameId,
          number_called: number,
          called_by_player: currentPlayer.player_number,
        })
        .select()
        .single()

      if (!newMove) return

      // Update marked numbers for all players
      const updatedPlayers = players.map((player) => ({
        ...player,
        marked_numbers: player.board_numbers.includes(number)
          ? [...player.marked_numbers, number]
          : player.marked_numbers,
      }))

      // Update players in database
      for (const player of updatedPlayers) {
        await supabase.from("game_players").update({ marked_numbers: player.marked_numbers }).eq("id", player.id)
      }

      // Update local state immediately for current player
      setMoves((prev) => [...prev, newMove])
      setPlayers(updatedPlayers)

      // Update current player state if they have the called number
      if (currentPlayer.board_numbers.includes(number)) {
        setCurrentPlayer((prev) =>
          prev
            ? {
                ...prev,
                marked_numbers: [...prev.marked_numbers, number],
              }
            : prev,
        )
      }

      // Check for winner
      const winner = checkWinner(updatedPlayers)

      if (winner) {
        const { data: finishedGame } = await supabase
          .from("games")
          .update({
            status: "finished",
            winner: winner.player_number,
          })
          .eq("id", gameId)
          .select()
          .single()

        if (finishedGame) {
          // Update local game state
          setGame(finishedGame)

          // Broadcast game finished
          channelRef.current?.send({
            type: "broadcast",
            event: "game_finished",
            payload: { winner, game: finishedGame },
          })
        }
      } else {
        // Switch turns
        const nextPlayer = game.current_player === 1 ? 2 : 1
        const { data: updatedGame } = await supabase
          .from("games")
          .update({ current_player: nextPlayer })
          .eq("id", gameId)
          .select()
          .single()

        if (updatedGame) {
          // Update local game state immediately
          setGame(updatedGame)

          // Broadcast game update
          channelRef.current?.send({
            type: "broadcast",
            event: "game_updated",
            payload: { game: updatedGame },
          })
        }
      }

      // Broadcast the number call to other players
      channelRef.current?.send({
        type: "broadcast",
        event: "number_called",
        payload: { move: newMove, updatedPlayers },
      })

      setSelectedNumber(null)
    } catch (error) {
      console.error("Error calling number:", error)
    }
  }

  const checkWinner = (players: GamePlayer[]) => {
    for (const player of players) {
      if (hasWinningPattern(player.board_numbers, player.marked_numbers)) {
        return player
      }
    }
    return null
  }

  const getCompletedLines = (board: number[], marked: number[]) => {
    // Don't check if board is not set up
    if (!board || board.length !== 25 || board.some((num) => num === null || num === undefined)) {
      return { completedLines: 0, completedCells: new Set(), strikeLines: [] }
    }

    // Include both marked numbers by current player and all called numbers
    const calledNumbers = moves.map(move => move.number_called);
    const allMarkedNumbers = [...new Set([...marked, ...calledNumbers])]

    // Don't check if no numbers are marked or called
    if (allMarkedNumbers.length === 0) {
      return { completedLines: 0, completedCells: new Set(), strikeLines: [] }
    }

    // Convert board to 5x5 grid
    const grid = []
    for (let i = 0; i < 5; i++) {
      grid.push(board.slice(i * 5, (i + 1) * 5))
    }

    let completedLines = 0
    const completedCells = new Set<number>()
    const strikeLines: Array<{ type: string; index: number }> = []

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (grid[row].length === 5 && grid[row].every((num) => allMarkedNumbers.includes(num))) {
        completedLines++
        strikeLines.push({ type: "row", index: row })
        // Add all cells in this row to completed cells
        for (let col = 0; col < 5; col++) {
          completedCells.add(row * 5 + col)
        }
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      const column = grid.map((row) => row[col])
      if (column.length === 5 && column.every((num) => allMarkedNumbers.includes(num))) {
        completedLines++
        strikeLines.push({ type: "column", index: col })
        // Add all cells in this column to completed cells
        for (let row = 0; row < 5; row++) {
          completedCells.add(row * 5 + col)
        }
      }
    }

    // Check diagonals
    const diagonal1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]]
    const diagonal2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]]

    if (diagonal1.every((num) => allMarkedNumbers.includes(num))) {
      completedLines++
      strikeLines.push({ type: "diagonal", index: 0 })
      // Add diagonal cells
      for (let i = 0; i < 5; i++) {
        completedCells.add(i * 5 + i) // Main diagonal: (0,0), (1,1), (2,2), (3,3), (4,4)
      }
    }

    if (diagonal2.every((num) => allMarkedNumbers.includes(num))) {
      completedLines++
      strikeLines.push({ type: "diagonal", index: 1 })
      // Add anti-diagonal cells
      for (let i = 0; i < 5; i++) {
        completedCells.add(i * 5 + (4 - i)) // Anti-diagonal: (0,4), (1,3), (2,2), (3,1), (4,0)
      }
    }

    return { completedLines, completedCells, strikeLines }
  }

  const hasWinningPattern = (board: number[], marked: number[]) => {
    // Get completed lines info using both marked and called numbers
    const { completedLines } = getCompletedLines(board, marked)

    // Winner needs 5 or more completed lines
    if (completedLines >= 5) {
      console.log(`Winner found with ${completedLines} completed lines`)
      return true
    }

    // Log progress for debugging
    if (completedLines > 0) {
      console.log(`Player has ${completedLines}/5 completed lines`)
    }

    return false
  }

  const renderBoard = (player: GamePlayer, isCurrentPlayer: boolean) => {
    const grid = []
    for (let i = 0; i < 5; i++) {
      grid.push(player.board_numbers.slice(i * 5, (i + 1) * 5))
    }

    // Get completed lines info
    const { completedCells, strikeLines } = getCompletedLines(player.board_numbers, player.marked_numbers)

    return (
      <div className="relative w-full max-w-xs mx-auto">
        <div className="grid grid-cols-5 gap-1">
          {grid.flat().map((number, index) => {
            const isMarked = player.marked_numbers.includes(number) || moves.some((move) => move.number_called === number)
            const isCompletedLine = completedCells.has(index)
            const canClick =
              isCurrentPlayer &&
              game?.status === "playing" &&
              game?.current_player === currentPlayer?.player_number &&
              !isMarked

            return (
              <div
                key={index}
                onClick={canClick ? () => setSelectedNumber(number) : undefined}
                className={`
                  aspect-square flex items-center justify-center text-sm font-semibold border-2 rounded
                  ${
                    isMarked && isCompletedLine
                      ? "bg-blue-500 text-white border-blue-600" // Blue for completed lines
                      : isMarked
                        ? "bg-green-500 text-white border-green-600" // Green for regular marked or called
                        : isCurrentPlayer
                          ? canClick
                            ? selectedNumber === number
                              ? "bg-yellow-500 text-white border-yellow-600 cursor-pointer" // Yellow for selected
                              : "bg-white border-gray-300 hover:border-gray-400 cursor-pointer hover:bg-gray-50"
                            : "bg-white border-gray-300"
                          : "bg-gray-100 border-gray-200"
                  }
                `}
              >
                {isCurrentPlayer ? number : isMarked ? number : "?"}
              </div>
            )
          })}
        </div>

        {/* Strike lines overlay */}
        {strikeLines.map((line, index) => {
          if (line.type === "row") {
            return (
              <div
                key={index}
                className="absolute pointer-events-none bg-red-500"
                style={{
                  top: `${(line.index * 100) / 5 + 10}%`,
                  left: "0",
                  width: "100%",
                  height: "3px",
                  transform: "translateY(-50%)",
                }}
              />
            )
          } else if (line.type === "column") {
            return (
              <div
                key={index}
                className="absolute pointer-events-none bg-red-500"
                style={{
                  left: `${(line.index * 100) / 5 + 10}%`,
                  top: "0",
                  width: "3px",
                  height: "100%",
                  transform: "translateX(-50%)",
                }}
              />
            )
          } else if (line.type === "diagonal") {
            // Main diagonal (top-left to bottom-right)
            if (line.index === 0) {
              return (
                <div
                  key={index}
                  className="absolute pointer-events-none bg-red-500"
                  style={{
                    top: "0",
                    left: "0",
                    width: "141.42%", // √2 ≈ 1.414 to cover diagonal
                    height: "3px",
                    transformOrigin: "0 0",
                    transform: "rotate(45deg)",
                  }}
                />
              )
            }
            // Anti-diagonal (top-right to bottom-left)
            else {
              return (
                <div
                  key={index}
                  className="absolute pointer-events-none bg-red-500"
                  style={{
                    top: "0",
                    right: "0",
                    width: "141.42%", // √2 ≈ 1.414 to cover diagonal
                    height: "3px",
                    transformOrigin: "100% 0",
                    transform: "rotate(-45deg)",
                  }}
                />
              )
            }
          }
          return null
        })}
      </div>
    )
  }

  const getOpponentStats = (opponent: GamePlayer) => {
    const { completedLines } = getCompletedLines(opponent.board_numbers, opponent.marked_numbers)
    return {
      markedCount: opponent.marked_numbers.length,
      completedLines: completedLines,
      totalNumbers: 25,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("state.loading")}</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("state.gameNotFound")}</div>
      </div>
    )
  }

  console.log("Current game status:", game.status)
  console.log("Current player:", currentPlayer)
  console.log("Players count:", players.length)

  // Check if opponent view is allowed (default to true if column doesn't exist)
  const opponentViewAllowed = game.show_opponent !== false

  // Get winner info
  const winner = game.winner ? players.find((p) => p.player_number === game.winner) : null

  // STEP 1: Host creates room - go to waiting screen (have share pin)
  if (currentPlayer && currentPlayer.player_number === 1 && game.status === "waiting" && players.length === 1) {
    console.log("Showing waiting screen for Player 1")
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <GameHeader />
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">{t("waiting.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="text-lg font-semibold">
                  {t("waiting.gamePin")} {gameId.slice(-4).toUpperCase()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPinToClipboard}
                  className="flex items-center gap-1 h-8 px-2 bg-transparent"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? t("waiting.copied") : t("waiting.copy")}
                </Button>
              </div>
              <div className="text-gray-600">{t("waiting.sharePin")}</div>
              <div className="text-sm text-gray-500">
                {t("waiting.player1")} {players[0]?.player_name}
              </div>
              <div className="text-sm text-gray-500">
                {t("waiting.opponentView")} {opponentViewAllowed ? t("waiting.allowed") : t("waiting.disabled")}
              </div>
              <div className="text-blue-600">{t("waiting.waitingOpponent")}</div>
              <div className="text-xs text-green-400">⚡ Real-time updates enabled</div>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                {t("waiting.backHome")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // STEP 2 & 3: Both players joined -> show setup screen (regardless of current status if we have 2 players with empty boards)
  const shouldShowSetup =
    currentPlayer &&
    players.length === 2 &&
    (game.status === "setup" || (game.status === "waiting" && players.every((p) => p.board_numbers.length === 0)))

  if (shouldShowSetup) {
    console.log("Showing board setup screen")

    const opponent = players.find((p) => p.player_number !== currentPlayer.player_number)
    const isCurrentPlayerReady = currentPlayer.board_setup_complete || false
    const isOpponentReady = opponent?.board_setup_complete || false

    console.log("Current player setup complete:", isCurrentPlayerReady)
    console.log("Opponent setup complete:", isOpponentReady)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <GameHeader subtitle={t("setup.title")} />
          <div className="w-full max-w-2xl mx-auto">
            <BoardSetup
              playerName={currentPlayer.player_name}
              playerNumber={currentPlayer.player_number}
              onSubmit={handleBoardSetup}
              isSubmitted={isCurrentPlayerReady}
              opponentSubmitted={isOpponentReady}
            />
          </div>
        </div>
      </div>
    )
  }

  // Handle other states
  if (!currentPlayer && game.status === "playing" && players.length === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <GameHeader />
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">{t("state.gameInProgress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-gray-600">{t("state.gameInProgressDesc")}</div>
              <Button onClick={() => router.push("/")} className="w-full">
                {t("waiting.backHome")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <GameHeader />
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">{t("state.gameFull")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-gray-600">{t("state.gameFullDesc")}</div>
              <Button onClick={() => router.push("/")} className="w-full">
                {t("waiting.backHome")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // STEP 4, 5, 6: Main game play - call numbers until one has 5 in a row
  const opponent = players.find((p) => p.player_number !== currentPlayer.player_number)
  const opponentStats = opponent ? getOpponentStats(opponent) : null
  const currentPlayerStats = getCompletedLines(currentPlayer.board_numbers, currentPlayer.marked_numbers)

  console.log("Showing main game screen")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <GameHeader>
          <Badge variant={game.status === "playing" ? "default" : "secondary"}>{t(`game.${game.status}`)}</Badge>
          <Badge variant="outline">
            {t("player.you")} {currentPlayer.player_number}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ⚡ Real-time
          </Badge>
          {opponentViewAllowed && opponent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOpponentArea(!showOpponentArea)}
              className="flex items-center gap-1"
            >
              {showOpponentArea ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showOpponentArea ? t("game.hideOpponent") : t("game.showOpponent")}
            </Button>
          )}
        </GameHeader>

        {/* Winner Announcement */}
        {game.status === "finished" && winner && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-800 mb-2">
                  🎉 {winner.player_name} {t("game.isWinner")} 🎉
                </div>
                <div className="text-lg text-yellow-700">
                  {winner.player_number === currentPlayer.player_number
                    ? t("game.congratulations")
                    : t("game.betterLuck")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={`grid gap-6 ${showOpponentArea && opponent ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {/* Your Board */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                {t("game.yourBoard")} ({currentPlayer.player_name})
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {t("game.completedLines")} {currentPlayerStats.completedLines}/5
                </div>
                {game.status === "playing" && game.current_player === currentPlayer.player_number && (
                  <div className="text-xs text-gray-500 font-normal mt-1">{t("game.clickToCall")}</div>
                )}
                {game.status === "playing" &&
                  hasWinningPattern(currentPlayer.board_numbers, currentPlayer.marked_numbers) && (
                    <Badge className="ml-2" variant="default">
                      {t("game.winner")}
                    </Badge>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderBoard(currentPlayer, true)}
              <div className="mt-4 text-center text-xs text-gray-500">
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>{t("legend.marked")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>{t("legend.completeLine")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>{t("legend.selected")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opponent Info */}
          {opponentViewAllowed && opponent && showOpponentArea && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-blue-600">
                  {t("game.opponent")} {opponent.player_name}
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    {t("game.completedLines")} {opponentStats?.completedLines || 0}/5
                  </div>
                  {game.status === "playing" && hasWinningPattern(opponent.board_numbers, opponent.marked_numbers) && (
                    <Badge className="ml-2" variant="destructive">
                      {t("game.winner")}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-lg">
                    {t("game.numbersMarked")} {opponentStats?.markedCount}/25
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${((opponentStats?.markedCount || 0) / 25) * 100}%` }}
                    ></div>
                  </div>
                  {renderBoard(opponent, false)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call Number Button */}
        {game.status === "playing" && game.current_player === currentPlayer.player_number && selectedNumber && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="text-center">
                <Button onClick={() => callNumber(selectedNumber)} size="lg" className="text-lg px-8 py-3">
                  {t("game.callNumber")} {selectedNumber}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Called Numbers */}
        {moves.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t("game.calledNumbers")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moves.map((move, index) => (
                  <Badge key={index} variant="secondary">
                    {move.number_called} (P{move.called_by_player})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
