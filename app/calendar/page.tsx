"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPersonalizedMonthTheme, type UserProfile, mbtiData, roleData } from "@/lib/calendar-data"
import { ArrowRight, User, Trophy } from "lucide-react"

export default function CalendarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userProfile")
      if (stored) {
        setProfile(JSON.parse(stored))
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
      router.push("/")
    }
  }, [router])

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">
                {mbtiData[profile.mbti].emoji} {profile.mbti} · {mbtiData[profile.mbti].name} ×{" "}
                {roleData[profile.role].emoji} {profile.role}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">你的专属搞钱日历</h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-2">每天行动一小步，财富增长一大步</p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                重新选择人格
              </Button>
              <Link href="/leaderboard">
                <Button variant="outline" size="sm">
                  <Trophy className="mr-2 h-4 w-4" />
                  查看排行榜
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Themes Grid */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">选择月份，开始行动</h2>
          <p className="text-muted-foreground">12个月，12个专属主题，365个搞钱行动等你解锁</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {months.map((month) => {
            const theme = getPersonalizedMonthTheme(month, profile)

            return (
              <Link key={month} href={`/month/${month}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group border-2 hover:border-accent">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{theme.emoji}</div>
                    <div className="text-sm font-medium text-muted-foreground">{theme.name}</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{theme.theme}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{theme.description}</p>
                  <div className="flex items-center text-sm font-medium text-accent">
                    查看日历
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>持续行动，财富自由不是梦 💰</p>
        </div>
      </div>
    </div>
  )
}
