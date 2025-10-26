"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDailyAction } from "@/lib/calendar-hybrid"
import type { DailyAction } from "@/lib/calendar-data"
import { ArrowLeft, Sparkles } from "lucide-react"
import { CheckInButton } from "@/components/check-in-button"
import { UserStatsCard } from "@/components/user-stats-card"
import { WealthTree } from "@/components/wealth-tree"
import { ShareCardDialog } from "@/components/share-card-dialog"
import { useAuth } from "@/contexts/AuthContext"

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  return <DayClientPageComponent date={date} />
}

function DayClientPageComponent({ date }: { date: string }) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [action, setAction] = useState<DailyAction | null>(null)
  const [isLoadingAction, setIsLoadingAction] = useState(true)

  useEffect(() => {
    // 如果加载完成且没有 profile，跳转到 onboarding
    if (!loading && !profile) {
      router.push("/onboarding")
    }
  }, [profile, loading, router])

  useEffect(() => {
    // 加载单日行动
    if (profile) {
      loadDayAction()
    }
  }, [profile, user, date])

  const loadDayAction = async () => {
    if (!profile) return

    setIsLoadingAction(true)

    try {
      const dailyAction = await getDailyAction(user?.id || null, date, profile)
      setAction(dailyAction)

      if (!dailyAction) {
        notFound()
      }
    } catch (error) {
      console.error("[Day Page] 加载行动失败:", error)
    } finally {
      setIsLoadingAction(false)
    }
  }

  if (loading || isLoadingAction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!profile || !action) {
    return null
  }

  const dateObj = new Date(date)
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href={`/month/${month}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回月历
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Date Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20 mb-6">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                {month}月{day}日 · {action.theme}
              </span>
            </div>

            {/* Main Card */}
            <Card className="p-8 md:p-12 mb-6">
              <div className="text-6xl md:text-7xl mb-6 text-center">{action.emoji}</div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-balance">{action.title}</h1>

              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center text-balance">
                  {action.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <CheckInButton date={date} />
                <ShareCardDialog date={date} emoji={action.emoji} title={action.title} theme={action.theme} />
              </div>
            </Card>

            {/* Motivational Quote */}
            <div className="text-center p-6 bg-accent/5 rounded-lg border border-accent/10">
              <p className="text-sm text-muted-foreground italic">
                "成功的秘诀就是每天进步一点点。今天的行动，就是明天的财富。"
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-8 border-t">
              <Link href={`/month/${month}`}>
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  查看本月所有行动
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost">返回日历</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <UserStatsCard />
              <WealthTree />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
