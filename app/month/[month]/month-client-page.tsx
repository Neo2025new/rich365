"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getMonthTheme, getMonthActions } from "@/lib/calendar-hybrid"
import { ArrowLeft, Calendar, Download, Printer } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import type { DailyAction, MonthTheme } from "@/lib/calendar-data"
import html2canvas from "html2canvas"
import { toast } from "sonner"

const cardColors = [
  "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900",
  "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-950 dark:to-yellow-900",
  "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900",
  "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950 dark:to-purple-900",
  "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950 dark:to-green-900",
  "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950 dark:to-orange-900",
  "bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-950 dark:to-teal-900",
]

export default function MonthClientPage({
  params,
}: {
  params: { month: string }
}) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const month = Number.parseInt(params.month)
  const [theme, setTheme] = useState<MonthTheme | null>(null)
  const [actions, setActions] = useState<DailyAction[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 如果加载完成且没有 profile，跳转到 onboarding
    if (!loading && !profile) {
      router.push("/onboarding")
    }
  }, [profile, loading, router])

  useEffect(() => {
    // 加载月度数据
    if (profile) {
      loadMonthData()
    }
  }, [profile, user, month])

  const loadMonthData = async () => {
    if (!profile) return

    setIsLoadingData(true)
    const currentYear = new Date().getFullYear()

    try {
      const [monthTheme, monthActions] = await Promise.all([
        getMonthTheme(user?.id || null, month, profile),
        getMonthActions(user?.id || null, currentYear, month, profile),
      ])

      setTheme(monthTheme)
      setActions(monthActions)
    } catch (error) {
      console.error("[Month Page] 加载数据失败:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // 保存图片
  const handleSaveImage = async () => {
    if (!calendarRef.current || !theme) {
      toast.error("未找到要保存的内容")
      return
    }

    setIsSaving(true)

    try {
      console.log("[Month Page] 开始生成图片...")
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: calendarRef.current.scrollWidth,
        windowHeight: calendarRef.current.scrollHeight,
      })

      console.log("[Month Page] 图片生成成功，准备下载...")
      const link = document.createElement("a")
      link.download = `搞钱日历-${theme.name}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast.success("图片已保存！")
    } catch (error) {
      console.error("[Month Page] 保存图片失败:", error)
      toast.error("保存图片失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  // 打印功能
  const handlePrint = () => {
    window.print()
  }

  if (isNaN(month) || month < 1 || month > 12) {
    notFound()
  }

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!profile || !theme) {
    return null
  }

  // Use current year dynamically
  const currentYear = new Date().getFullYear()

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, month, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, month - 1, 1).getDay()

  const calendarDays: (number | null)[] = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回日历
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveImage} disabled={isSaving}>
                <Download className="mr-2 h-4 w-4" />
                {isSaving ? "生成中..." : "保存图片"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                打印
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{theme.emoji}</div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">{theme.name} · {currentYear}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{theme.theme}</h1>
              <p className="text-muted-foreground">{theme.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="container mx-auto px-4 py-8 md:py-12">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2 md:mb-4">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dateStr = `${currentYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
            const action = actions.find((a) => a.date === dateStr)
            const colorClass = action ? cardColors[day % cardColors.length] : ""

            return (
              <Link
                key={day}
                href={action ? `/day/${dateStr}` : "#"}
                className={action ? "cursor-pointer" : "cursor-default"}
              >
                <Card
                  className={`aspect-square p-2 md:p-4 flex flex-col justify-between transition-all duration-300 ${colorClass} ${
                    action ? "hover:shadow-lg hover:scale-[1.05] hover:border-primary border-2" : "opacity-50 bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-lg md:text-xl font-bold text-foreground">{day}</div>
                    {action && <div className="text-xl md:text-2xl">{action.emoji}</div>}
                  </div>
                  {action && (
                    <div className="text-xs md:text-sm font-medium leading-tight line-clamp-2 text-balance text-foreground">
                      {action.title}
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Stats */}
        <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">本月进度</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            本月共有 <span className="font-bold text-foreground">{actions.length}</span> 个专属搞钱行动等你完成
          </p>
        </div>
      </div>

      {/* 打印视图 - 只在打印时显示 */}
      <div className="hidden print:block">
        {actions.map((action, index) => (
          <div
            key={action.date}
            className="print-page"
            style={{
              pageBreakAfter: index < actions.length - 1 ? 'always' : 'auto',
              width: '148mm',
              height: '210mm',
              padding: '20mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* 页眉 */}
            <div>
              <div className="text-xs text-gray-500 mb-4">
                {new Date(action.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium mb-6">
                {action.theme}
              </div>
            </div>

            {/* 主要内容 */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <div className="text-8xl">{action.emoji}</div>
              <h1 className="text-4xl font-bold leading-tight">{action.title}</h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                {action.description}
              </p>
            </div>

            {/* 页脚 */}
            <div className="text-center space-y-2">
              <div className="text-sm font-bold">搞钱行动日历</div>
              <div className="text-xs text-gray-500">每天行动一小步，财富增长一大步</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
