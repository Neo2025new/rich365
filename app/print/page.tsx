"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import type { DailyAction } from "@/lib/calendar-data"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrintPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [actions, setActions] = useState<DailyAction[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    // 如果加载完成且没有 profile，跳转到 onboarding
    if (!loading && !profile) {
      router.push("/onboarding")
    }
  }, [profile, loading, router])

  useEffect(() => {
    // 加载从今天开始的30天数据
    if (user) {
      loadActions()
    }
  }, [user])

  const loadActions = async () => {
    if (!user) return

    setIsLoadingData(true)
    const supabase = createClient()

    try {
      // 获取从今天开始的30天
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 29)

      const startDateStr = today.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from("daily_actions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true })

      if (error) throw error

      setActions(data || [])
    } catch (error) {
      console.error("[Print Page] 加载数据失败:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handlePrint = () => {
    window.print()
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

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 工具栏 - 只在屏幕上显示，打印时隐藏 */}
      <div className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回日历
              </Button>
            </Link>
            <Button onClick={handlePrint} size="lg">
              <Printer className="mr-2 h-5 w-5" />
              开始打印
            </Button>
          </div>
        </div>
      </div>

      {/* 打印预览提示 */}
      <div className="container mx-auto px-4 py-8 print:hidden">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">📄 打印设置建议</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 纸张大小：A5 (148mm x 210mm)</li>
            <li>• 方向：纵向</li>
            <li>• 边距：默认</li>
            <li>• 共 {actions.length} 页，每页一个搞钱行动</li>
          </ul>
        </div>
      </div>

      {/* 打印内容 */}
      <div className="print:block">
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
              justifyContent: 'space-between',
              backgroundColor: 'white',
              color: 'black',
              margin: '0 auto 2rem',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
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
              <div className="text-xs text-gray-400">第 {index + 1} 天 / 共 {actions.length} 天</div>
            </div>
          </div>
        ))}
      </div>

      {/* 打印CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
