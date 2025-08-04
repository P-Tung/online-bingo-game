"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface BoardSetupProps {
  playerName: string
  playerNumber: number
  onSubmit: (boardNumbers: number[]) => void
  isSubmitted: boolean
  opponentSubmitted: boolean
}

export default function BoardSetup({
  playerName,
  playerNumber,
  onSubmit,
  isSubmitted,
  opponentSubmitted,
}: BoardSetupProps) {
  const { t } = useLanguage()
  const [board, setBoard] = useState<(number | null)[]>(Array(25).fill(null))
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")

  // Check if board is complete (all 25 numbers filled and unique)
  const isBoardComplete = () => {
    const filledNumbers = board.filter((num) => num !== null) as number[]
    if (filledNumbers.length !== 25) return false

    // Check if all numbers are unique and between 1-25
    const uniqueNumbers = new Set(filledNumbers)
    return uniqueNumbers.size === 25 && filledNumbers.every((num) => num >= 1 && num <= 25)
  }

  // Get duplicate numbers for validation
  const getDuplicateNumbers = () => {
    const filledNumbers = board.filter((num) => num !== null) as number[]
    const numberCounts = new Map<number, number>()

    filledNumbers.forEach((num) => {
      numberCounts.set(num, (numberCounts.get(num) || 0) + 1)
    })

    const duplicates = new Set<number>()
    numberCounts.forEach((count, num) => {
      if (count > 1) {
        duplicates.add(num)
      }
    })

    return duplicates
  }

  // Generate random board
  const generateRandomBoard = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
    const shuffled = numbers.sort(() => Math.random() - 0.5)
    setBoard(shuffled)
  }

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (isSubmitted) return
    setSelectedCell(index)
    setInputValue(board[index]?.toString() || "")
  }

  // Handle number input
  const handleNumberInput = (value: string) => {
    const num = Number.parseInt(value)
    if (selectedCell === null) return

    if (value === "" || (num >= 1 && num <= 25)) {
      const newBoard = [...board]
      newBoard[selectedCell] = value === "" ? null : num
      setBoard(newBoard)
      setInputValue(value)
    }
  }

  // Handle submit
  const handleSubmit = () => {
    if (isBoardComplete()) {
      onSubmit(board as number[])
    }
  }

  // Get used numbers for validation
  const getUsedNumbers = () => {
    return new Set(board.filter((num) => num !== null) as number[])
  }

  const usedNumbers = getUsedNumbers()
  const duplicateNumbers = getDuplicateNumbers()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {t("setup.setUpBoard")} - {playerName}
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant={isSubmitted ? "default" : "secondary"}>
                {isSubmitted ? t("setup.submitted") : t("setup.settingUp")}
              </Badge>
              <Badge variant={opponentSubmitted ? "default" : "secondary"}>
                {t("setup.opponent")} {opponentSubmitted ? t("setup.ready") : t("setup.settingUp")}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">{t("setup.instructions")}</div>

          {/* Board Grid */}
          <div className="grid grid-cols-5 gap-2 w-full max-w-xs mx-auto">
            {board.map((number, index) => {
              const isDuplicate = number !== null && duplicateNumbers.has(number)
              const isEmpty = number === null

              return (
                <div
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-semibold border-2 rounded cursor-pointer
                    ${
                      selectedCell === index
                        ? "border-blue-500 bg-blue-50"
                        : isDuplicate
                          ? "border-red-500 bg-red-50 text-red-700"
                          : !isEmpty
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }
                    ${isSubmitted ? "cursor-not-allowed opacity-60" : ""}
                  `}
                >
                  {number || ""}
                </div>
              )
            })}
          </div>

          {/* Duplicate Warning */}
          {duplicateNumbers.size > 0 && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
              {t("setup.duplicateWarning")} {Array.from(duplicateNumbers).join(", ")}
            </div>
          )}

          {/* Number Input */}
          {selectedCell !== null && !isSubmitted && (
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                {t("setup.enterNumber")} {selectedCell + 1}:
              </div>
              <div className="flex justify-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={inputValue}
                  onChange={(e) => handleNumberInput(e.target.value)}
                  className={`w-20 px-2 py-1 border rounded text-center ${
                    inputValue &&
                    usedNumbers.has(Number.parseInt(inputValue)) &&
                    Number.parseInt(inputValue) !== board[selectedCell]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="1-25"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCell(null)
                    setInputValue("")
                  }}
                >
                  {t("setup.done")}
                </Button>
              </div>
              {inputValue &&
                usedNumbers.has(Number.parseInt(inputValue)) &&
                Number.parseInt(inputValue) !== board[selectedCell] && (
                  <div className="text-xs text-red-500">{t("setup.numberUsed")}</div>
                )}
            </div>
          )}

          {/* Action Buttons */}
          {!isSubmitted && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={generateRandomBoard}
                className="flex items-center gap-1 bg-transparent"
              >
                <Shuffle className="h-4 w-4" />
                {t("setup.randomBoard")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isBoardComplete() || duplicateNumbers.size > 0}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                {t("setup.submitBoard")}
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {!isBoardComplete() && !isSubmitted && (
            <div className="text-center text-sm text-gray-500">{t("setup.fillAllCells")}</div>
          )}

          {duplicateNumbers.size > 0 && !isSubmitted && (
            <div className="text-center text-sm text-red-500">{t("setup.removeDuplicates")}</div>
          )}

          {isSubmitted && !opponentSubmitted && (
            <div className="text-center text-sm text-blue-600">{t("setup.waitingOpponent")}</div>
          )}

          {isSubmitted && opponentSubmitted && (
            <div className="text-center text-sm text-green-600">{t("setup.bothReady")}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
