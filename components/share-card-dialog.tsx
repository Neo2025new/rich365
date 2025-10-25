"use client"

import { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Download, Check } from "lucide-react"
import html2canvas from "html2canvas"
import { useAuth } from "@/contexts/AuthContext"
import { getUserStatistics } from "@/lib/supabase-checkin"

interface ShareCardDialogProps {
  date: string
  emoji: string
  title: string
  theme: string
}

export function ShareCardDialog({ date, emoji, title, theme }: ShareCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const { user } = useAuth()

  const dateObj = new Date(date)
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
  const dayOfWeek = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][dateObj.getDay()]

  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        const stats = await getUserStatistics(user.id)
        if (stats) {
          setCurrentStreak(stats.currentStreak)
        }
      }
    }
    loadStats()
  }, [user])

  const handleDownload = async () => {
    if (!cardRef.current) return

    setIsGenerating(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const link = document.createElement("a")
      link.download = `搞钱行动-${date}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      setIsDownloaded(true)
      setTimeout(() => setIsDownloaded(false), 2000)
    } catch (error) {
      console.error("Failed to generate image:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
          <Share2 className="mr-2 h-5 w-5" />
          分享今日行动
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分享今日搞钱行动</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div
            ref={cardRef}
            className="aspect-[9/16] bg-gradient-to-br from-pink-50 via-yellow-50 to-orange-50 p-8 rounded-2xl flex flex-col justify-between"
            style={{ width: "360px" }}
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">
                {formattedDate} · {dayOfWeek}
              </div>
              <div className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-gray-700">
                {theme}
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-4">
              <div className="text-7xl">{emoji}</div>
              <div className="text-2xl font-bold text-gray-900 leading-tight px-4">{title}</div>
            </div>

            {/* Footer */}
            <div className="space-y-3">
              {/* Stats Badge */}
              {currentStreak > 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full text-sm font-bold">
                  <span>已打卡第 {currentStreak} 天</span>
                  <span>🔥</span>
                </div>
              )}

              {/* Branding */}
              <div className="text-center space-y-1">
                <div className="text-lg font-bold text-gray-900">搞钱行动日历</div>
                <div className="text-xs text-gray-600">每天行动一小步，财富增长一大步</div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>生成中...</>
            ) : isDownloaded ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                已保存
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                保存图片
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">保存后可分享到微信、小红书、Twitter等平台</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
