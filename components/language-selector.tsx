"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Globe } from "lucide-react"

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "vi" : "en")}
      className="flex items-center gap-1"
    >
      <Globe className="h-4 w-4" />
      {language === "en" ? "Tiếng Việt" : "English"}
    </Button>
  )
}
