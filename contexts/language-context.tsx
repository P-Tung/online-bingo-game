"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "vi"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Home page
    "home.title": "Bingo Game",
    "home.enterName": "Enter your name",
    "home.nameSaved": "✓ Name saved for next time",
    "home.gameSettings": "Game Settings",
    "home.allowOpponentView": "Allow Opponent View",
    "home.opponentViewDesc": "Players can see opponent's progress",
    "home.createGame": "Create New Game",
    "home.or": "or",
    "home.enterPin": "Enter 4-character PIN",
    "home.joinGame": "Join Game",

    // Game states
    "game.waiting": "waiting",
    "game.setup": "setup",
    "game.playing": "playing",
    "game.finished": "finished",
    "game.autoRefresh": "Auto-refresh: 1s",
    "game.showOpponent": "Show Opponent",
    "game.hideOpponent": "Hide Opponent",

    // Waiting screen
    "waiting.title": "Waiting for Player 2",
    "waiting.gamePin": "Game PIN:",
    "waiting.copy": "Copy",
    "waiting.copied": "Copied!",
    "waiting.sharePin": "Share this PIN with Player 2 so they can join the game!",
    "waiting.player1": "Player 1:",
    "waiting.opponentView": "Opponent View:",
    "waiting.allowed": "Allowed",
    "waiting.disabled": "Disabled",
    "waiting.waitingOpponent": "Waiting for opponent...",
    "waiting.backHome": "Back to Home",

    // Board setup
    "setup.title": "Board Setup",
    "setup.setUpBoard": "Set Up Your Board",
    "setup.submitted": "✓ Submitted",
    "setup.settingUp": "Setting up...",
    "setup.opponent": "Opponent:",
    "setup.ready": "✓ Ready",
    "setup.instructions": "Click on cells to enter numbers 1-25. Each number can only be used once.",
    "setup.duplicateWarning": "⚠️ Duplicate numbers found:",
    "setup.enterNumber": "Enter number for cell",
    "setup.done": "Done",
    "setup.numberUsed": "This number is already used!",
    "setup.randomBoard": "Random Board",
    "setup.submitBoard": "Submit Board",
    "setup.fillAllCells": "Fill all 25 cells with unique numbers 1-25 to submit",
    "setup.removeDuplicates": "Remove duplicate numbers before submitting",
    "setup.waitingOpponent": "Waiting for opponent to finish setup...",
    "setup.bothReady": "Both players ready! Starting game...",

    // Game play
    "game.yourBoard": "Your Board",
    "game.completedLines": "Completed Lines:",
    "game.clickToCall": "Click a number to call it",
    "game.winner": "WINNER!",
    "game.opponent": "Opponent:",
    "game.numbersMarked": "Numbers Marked:",
    "game.callNumber": "Call Number",
    "game.calledNumbers": "Called Numbers",
    "game.yourTurn": "Your Turn!",
    "game.waitingFor": "Waiting for",
    "game.isWinner": "is winner!",
    "game.congratulations": "Congratulations!",
    "game.betterLuck": "Better luck next time!",

    // Colors legend
    "legend.marked": "Marked",
    "legend.completeLine": "Complete Line",
    "legend.selected": "Selected",

    // Other states
    "state.gameInProgress": "Game in Progress",
    "state.gameInProgressDesc": "This game is already in progress with 2 players.",
    "state.gameFull": "Game Full",
    "state.gameFullDesc": "This game already has 2 players or you're not part of this game.",
    "state.gameNotFound": "Game not found",
    "state.loading": "Loading game...",

    // Errors
    "error.gameNotFound": "Game not found! Please check your PIN.",
    "error.createGame": "Error creating game. Please try again.",
    "error.joinGame": "Error joining game. Please try again.",

    // Player labels
    "player.you": "You are Player",
    
    // Common actions
    "common.close": "Close",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.continue": "Continue",
    "common.submit": "Submit",
    "common.reset": "Reset",
    "common.clear": "Clear",
    "common.refresh": "Refresh",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.warning": "Warning",
    "common.info": "Info",
    
    // Navigation
    "nav.home": "Home",
    "nav.game": "Game",
    "nav.settings": "Settings",
    "nav.help": "Help",
    "nav.about": "About",
    
    // Form validation
    "validation.required": "This field is required",
    "validation.minLength": "Minimum length is {min} characters",
    "validation.maxLength": "Maximum length is {max} characters",
    "validation.invalidEmail": "Please enter a valid email",
    "validation.invalidNumber": "Please enter a valid number",
    
    // Board related
    "board.cell": "Cell",
    "board.row": "Row",
    "board.column": "Column",
    "board.number": "Number",
    "board.empty": "Empty",
    "board.filled": "Filled",
    
    // Game mechanics
    "mechanics.bingo": "BINGO!",
    "mechanics.line": "Line",
    "mechanics.diagonal": "Diagonal",
    "mechanics.horizontal": "Horizontal",
    "mechanics.vertical": "Vertical",
    "mechanics.pattern": "Pattern",
    "mechanics.turn": "Turn",
    "mechanics.round": "Round",
    "mechanics.score": "Score",
    "mechanics.points": "Points",
    
    // Connection status
    "connection.connected": "Connected",
    "connection.disconnected": "Disconnected",
    "connection.connecting": "Connecting...",
    "connection.reconnecting": "Reconnecting...",
    "connection.lost": "Connection lost",
    "connection.restored": "Connection restored",
  },
  vi: {
    // Home page
    "home.title": "Trò Chơi Bingo",
    "home.enterName": "Nhập tên của bạn",
    "home.nameSaved": "✓ Tên đã được lưu cho lần sau",
    "home.gameSettings": "Cài Đặt Trò Chơi",
    "home.allowOpponentView": "Cho Phép Xem Đối Thủ",
    "home.opponentViewDesc": "Người chơi có thể thấy tiến độ của đối thủ",
    "home.createGame": "Tạo Trò Chơi Mới",
    "home.or": "hoặc",
    "home.enterPin": "Nhập mã PIN 4 ký tự",
    "home.joinGame": "Tham Gia Trò Chơi",

    // Game states
    "game.waiting": "đang chờ",
    "game.setup": "thiết lập",
    "game.playing": "đang chơi",
    "game.finished": "kết thúc",
    "game.autoRefresh": "Tự động làm mới: 1s",
    "game.showOpponent": "Hiện Đối Thủ",
    "game.hideOpponent": "Ẩn Đối Thủ",

    // Waiting screen
    "waiting.title": "Đang Chờ Người Chơi 2",
    "waiting.gamePin": "Mã PIN:",
    "waiting.copy": "Sao chép",
    "waiting.copied": "Đã sao chép!",
    "waiting.sharePin": "Chia sẻ mã PIN này với Người chơi 2 để họ có thể tham gia!",
    "waiting.player1": "Người chơi 1:",
    "waiting.opponentView": "Xem đối thủ:",
    "waiting.allowed": "Cho phép",
    "waiting.disabled": "Tắt",
    "waiting.waitingOpponent": "Đang chờ đối thủ...",
    "waiting.backHome": "Về Trang Chủ",

    // Board setup
    "setup.title": "Thiết Lập Bàn Chơi",
    "setup.setUpBoard": "Thiết Lập Bàn Chơi Của Bạn",
    "setup.submitted": "✓ Đã gửi",
    "setup.settingUp": "Đang thiết lập...",
    "setup.opponent": "Đối thủ:",
    "setup.ready": "✓ Sẵn sàng",
    "setup.instructions": "Nhấp vào ô để nhập số từ 1-25. Mỗi số chỉ được sử dụng một lần.",
    "setup.duplicateWarning": "⚠️ Tìm thấy số trùng lặp:",
    "setup.enterNumber": "Nhập số cho ô",
    "setup.done": "Xong",
    "setup.numberUsed": "Số này đã được sử dụng!",
    "setup.randomBoard": "Bàn Ngẫu Nhiên",
    "setup.submitBoard": "Gửi Bàn Chơi",
    "setup.fillAllCells": "Điền tất cả 25 ô với các số duy nhất từ 1-25 để gửi",
    "setup.removeDuplicates": "Xóa các số trùng lặp trước khi gửi",
    "setup.waitingOpponent": "Đang chờ đối thủ hoàn thành thiết lập...",
    "setup.bothReady": "Cả hai người chơi đã sẵn sàng! Bắt đầu trò chơi...",

    // Game play
    "game.yourBoard": "Bàn Của Bạn",
    "game.completedLines": "Đường Hoàn Thành:",
    "game.clickToCall": "Nhấp vào số để gọi",
    "game.winner": "THẮNG!",
    "game.opponent": "Đối thủ:",
    "game.numbersMarked": "Số Đã Đánh Dấu:",
    "game.callNumber": "Gọi Số",
    "game.calledNumbers": "Số Đã Gọi",
    "game.yourTurn": "Lượt Của Bạn!",
    "game.waitingFor": "Đang chờ",
    "game.isWinner": "là người thắng!",
    "game.congratulations": "Chúc mừng!",
    "game.betterLuck": "Chúc may mắn lần sau!",

    // Colors legend
    "legend.marked": "Đã đánh dấu",
    "legend.completeLine": "Đường hoàn thành",
    "legend.selected": "Đã chọn",

    // Other states
    "state.gameInProgress": "Trò Chơi Đang Diễn Ra",
    "state.gameInProgressDesc": "Trò chơi này đang diễn ra với 2 người chơi.",
    "state.gameFull": "Trò Chơi Đầy",
    "state.gameFullDesc": "Trò chơi này đã có 2 người chơi hoặc bạn không phải là thành viên của trò chơi này.",
    "state.gameNotFound": "Không tìm thấy trò chơi",
    "state.loading": "Đang tải trò chơi...",

    // Errors
    "error.gameNotFound": "Không tìm thấy trò chơi! Vui lòng kiểm tra mã PIN.",
    "error.createGame": "Lỗi tạo trò chơi. Vui lòng thử lại.",
    "error.joinGame": "Lỗi tham gia trò chơi. Vui lòng thử lại.",

    // Player labels
    "player.you": "Bạn là Người chơi",
    
    // Common actions
    "common.close": "Đóng",
    "common.cancel": "Hủy",
    "common.confirm": "Xác nhận",
    "common.save": "Lưu",
    "common.delete": "Xóa",
    "common.edit": "Chỉnh sửa",
    "common.back": "Quay lại",
    "common.next": "Tiếp theo",
    "common.previous": "Trước",
    "common.continue": "Tiếp tục",
    "common.submit": "Gửi",
    "common.reset": "Đặt lại",
    "common.clear": "Xóa",
    "common.refresh": "Làm mới",
    "common.loading": "Đang tải...",
    "common.error": "Lỗi",
    "common.success": "Thành công",
    "common.warning": "Cảnh báo",
    "common.info": "Thông tin",
    
    // Navigation
    "nav.home": "Trang chủ",
    "nav.game": "Trò chơi",
    "nav.settings": "Cài đặt",
    "nav.help": "Trợ giúp",
    "nav.about": "Giới thiệu",
    
    // Form validation
    "validation.required": "Trường này là bắt buộc",
    "validation.minLength": "Độ dài tối thiểu là {min} ký tự",
    "validation.maxLength": "Độ dài tối đa là {max} ký tự",
    "validation.invalidEmail": "Vui lòng nhập email hợp lệ",
    "validation.invalidNumber": "Vui lòng nhập số hợp lệ",
    
    // Board related
    "board.cell": "Ô",
    "board.row": "Hàng",
    "board.column": "Cột",
    "board.number": "Số",
    "board.empty": "Trống",
    "board.filled": "Đã điền",
    
    // Game mechanics
    "mechanics.bingo": "BINGO!",
    "mechanics.line": "Đường",
    "mechanics.diagonal": "Chéo",
    "mechanics.horizontal": "Ngang",
    "mechanics.vertical": "Dọc",
    "mechanics.pattern": "Mẫu",
    "mechanics.turn": "Lượt",
    "mechanics.round": "Vòng",
    "mechanics.score": "Điểm",
    "mechanics.points": "Điểm số",
    
    // Connection status
    "connection.connected": "Đã kết nối",
    "connection.disconnected": "Đã ngắt kết nối",
    "connection.connecting": "Đang kết nối...",
    "connection.reconnecting": "Đang kết nối lại...",
    "connection.lost": "Mất kết nối",
    "connection.restored": "Khôi phục kết nối",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("bingo-language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "vi")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language when it changes
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("bingo-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
