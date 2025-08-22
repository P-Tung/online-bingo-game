"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import LanguageSelector from "./language-selector"

interface GameHeaderProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode
}

export default function GameHeader({ title, subtitle, children }: GameHeaderProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle
            className="cursor-pointer hover:text-blue-600 transition-colors text-2xl font-bold"
            onClick={() => router.push("/")}
          >
            {title || t("home.title")}
          </CardTitle>
          <div className="flex gap-2 items-center">
            <LanguageSelector />
            {children && <div className="flex gap-2">{children}</div>}
          </div>
        </div>
        {subtitle && <div className="text-center text-lg font-semibold mt-2">{subtitle}</div>}
      </CardHeader>
    </Card>
  )
}