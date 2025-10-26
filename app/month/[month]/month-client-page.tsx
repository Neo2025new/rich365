"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRelativeMonthTheme, getRelativeMonthActions } from "@/lib/calendar-hybrid"
import { ArrowLeft, Calendar, Download, Printer, CalendarPlus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import type { DailyAction } from "@/lib/calendar-data"
import html2canvas from "html2canvas"
import { toast } from "sonner"

// 使用 RGB 渐变替代 Tailwind 类，避免 html2canvas 的 lab() 颜色问题
const getCardStyle = (day: number) => {
  const gradients = [
    "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", // pink
    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", // yellow
    "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", // blue
    "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)", // purple
    "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", // green
    "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)", // orange
    "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)", // teal
  ]
  return { background: gradients[day % gradients.length] }
}

export default function MonthClientPage({
  params,
}: {
  params: { month: string }
}) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const relativeMonth = Number.parseInt(params.month) // 1 = 第一个月（从今天开始30天）
  const [theme, setTheme] = useState<any | null>(null)
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
    // 加载相对月份数据
    if (profile) {
      loadMonthData()
    }
  }, [profile, user, relativeMonth])

  const loadMonthData = async () => {
    if (!profile) return

    setIsLoadingData(true)

    try {
      const [monthTheme, monthActions] = await Promise.all([
        getRelativeMonthTheme(user?.id || null, relativeMonth, profile),
        getRelativeMonthActions(user?.id || null, relativeMonth, profile),
      ])

      setTheme(monthTheme)
      setActions(monthActions)
      console.log("[Month Page] 加载完成:", { theme: monthTheme, actionsCount: monthActions.length })
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

  // 下载日历文件
  const handleDownloadCalendar = async () => {
    if (!user || !theme?.dateRange) {
      toast.error("请先登录或等待数据加载")
      return
    }

    try {
      console.log("[Month Page] 下载日历文件...")
      // 使用实际的日期范围
      const startDate = new Date(theme.dateRange.start)
      const year = startDate.getFullYear()
      const month = startDate.getMonth() + 1

      const url = `/api/export-calendar?userId=${user.id}&year=${year}&month=${month}`

      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "下载失败")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl

      link.download = `搞钱行动日历-${theme.name}.ics`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("日历文件已下载，可导入到手机日历！")
    } catch (error) {
      console.error("[Month Page] 下载日历失败:", error)
      toast.error(error instanceof Error ? error.message : "下载失败，请重试")
    }
  }

  if (isNaN(relativeMonth) || relativeMonth < 1) {
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

  // 生成日历网格（只包含有数据的天数）
  // 按周分组显示
  const calendarDays: Array<{ date: string; day: number; dayOfWeek: number } | null> = []

  if (actions.length > 0) {
    // 获取第一天的星期几
    const firstDate = new Date(actions[0].date)
    const firstDayOfWeek = firstDate.getDay()

    // 添加空白填充
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null)
    }

    // 添加所有有数据的天
    actions.forEach((action) => {
      const date = new Date(action.date)
      calendarDays.push({
        date: action.date,
        day: date.getDate(),
        dayOfWeek: date.getDay(),
      })
    })
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
              <Button variant="outline" size="sm" onClick={handleDownloadCalendar}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                下载日历
              </Button>
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
              <div className="text-sm text-muted-foreground mb-1">{theme.name}</div>
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
          {calendarDays.map((dayInfo, index) => {
            if (dayInfo === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const action = actions.find((a) => a.date === dayInfo.date)

            return (
              <Link
                key={dayInfo.date}
                href={action ? `/day/${dayInfo.date}` : "#"}
                className={action ? "cursor-pointer" : "cursor-default"}
              >
                <Card
                  style={action ? getCardStyle(dayInfo.day) : undefined}
                  className={`aspect-square p-2 md:p-4 flex flex-col justify-between transition-all duration-300 ${
                    action ? "hover:shadow-lg hover:scale-[1.05] hover:border-primary border-2" : "opacity-50 bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-lg md:text-xl font-bold text-foreground">{dayInfo.day}</div>
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
            <h3 className="font-semibold">{theme.name}进度</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            共有 <span className="font-bold text-foreground">{actions.length}</span> 个专属搞钱行动等你完成
          </p>
          {theme.dateRange && (
            <p className="text-xs text-muted-foreground mt-2">
              📅 {theme.dateRange.start} 至 {theme.dateRange.end}
            </p>
          )}
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
              <div className="text-xs mb-4" style={{ color: "#6b7280" }}>
                {new Date(action.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "#f3f4f6", color: "#000000" }}>
                {action.theme}
              </div>
            </div>

            {/* 主要内容 */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <div className="text-8xl">{action.emoji}</div>
              <h1 className="text-4xl font-bold leading-tight" style={{ color: "#000000" }}>{action.title}</h1>
              <p className="text-lg leading-relaxed max-w-md" style={{ color: "#4b5563" }}>
                {action.description}
              </p>
            </div>

            {/* 页脚 */}
            <div className="text-center space-y-2">
              <div className="text-sm font-bold" style={{ color: "#000000" }}>搞钱行动日历</div>
              <div className="text-xs" style={{ color: "#6b7280" }}>每天行动一小步，财富增长一大步</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
