"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mbtiData, roleData } from "@/lib/calendar-data"
import { getMonthTheme } from "@/lib/calendar-hybrid"
import { ArrowRight, User, Trophy, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function CalendarPage() {
  const router = useRouter()
  const { user, profile, loading, error: authError, retryLoad } = useAuth()
  const [monthThemes, setMonthThemes] = useState<Record<number, any>>({})
  const [isLoadingThemes, setIsLoadingThemes] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const redirectAttempted = useRef(false)
  const [waitingForProfile, setWaitingForProfile] = useState(false)

  useEffect(() => {
    // 检查是否刚从 onboarding 完成
    const justCompleted = sessionStorage.getItem("onboarding_just_completed")
    const savedProfile = sessionStorage.getItem("onboarding_profile")

    if (justCompleted) {
      console.log("[Calendar Page] ========== 检测到刚完成 onboarding ==========")
      console.log("[Calendar Page] 保存的 profile 数据:", savedProfile)
      setWaitingForProfile(true)

      // 设置超时，如果 5 秒后还没有 profile，停止等待
      const timeout = setTimeout(() => {
        console.log("[Calendar Page] ⏱️ 等待超时（5秒），停止等待")
        setWaitingForProfile(false)

        // 清理 sessionStorage
        sessionStorage.removeItem("onboarding_just_completed")
        sessionStorage.removeItem("onboarding_profile")
      }, 5000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [])

  useEffect(() => {
    console.log("[Calendar Page] 状态检查:", {
      loading,
      hasUser: !!user,
      userId: user?.id,
      hasProfile: !!profile,
      profileMbti: profile?.mbti,
      waitingForProfile,
      redirectAttempted: redirectAttempted.current,
    })

    // 如果检测到 profile 已加载
    if (profile) {
      if (waitingForProfile) {
        console.log("[Calendar Page] ✅ Profile 已加载，停止等待")
        setWaitingForProfile(false)

        // 清理 sessionStorage
        sessionStorage.removeItem("onboarding_just_completed")
        sessionStorage.removeItem("onboarding_profile")
      }
      return
    }

    // 如果正在等待 profile 更新，暂时不检查重定向
    if (waitingForProfile) {
      console.log("[Calendar Page] ⏳ 正在等待 profile 加载...")
      return
    }

    // 如果加载完成且没有 profile，跳转到 onboarding
    if (!loading && !profile && !redirectAttempted.current) {
      console.log("[Calendar Page] ⚠️ 没有 profile，准备重定向到 onboarding")
      console.log("[Calendar Page] 检查 sessionStorage 备份...")

      // 最后尝试从 sessionStorage 获取备份
      const savedProfile = sessionStorage.getItem("onboarding_profile")
      if (savedProfile) {
        console.log("[Calendar Page] 发现 sessionStorage 备份，但 AuthContext 未加载")
        console.log("[Calendar Page] 这可能是状态同步问题，再等待 1 秒...")

        // 再给一次机会
        setTimeout(() => {
          if (!profile && !redirectAttempted.current) {
            console.log("[Calendar Page] ❌ 最终确认没有 profile，重定向到 onboarding")
            redirectAttempted.current = true
            router.push("/onboarding")
          }
        }, 1000)
      } else {
        console.log("[Calendar Page] ❌ 没有备份数据，立即重定向到 onboarding")
        redirectAttempted.current = true
        router.push("/onboarding")
      }
    }
  }, [profile, loading, router, waitingForProfile, user])

  useEffect(() => {
    // 加载所有月份的主题
    if (profile) {
      console.log("[Calendar Page] 开始加载月度主题, user:", user?.id, "profile:", profile)
      loadMonthThemes()
    } else if (!loading) {
      // 如果没有 profile 且不在加载中，停止主题加载状态
      console.log("[Calendar Page] 没有 profile，停止加载")
      setIsLoadingThemes(false)
    }
  }, [profile, loading]) // 移除 user 依赖，避免重复触发

  const loadMonthThemes = async () => {
    if (!profile) return

    try {
      console.log("[Calendar Page] loadMonthThemes 开始")
      setIsLoadingThemes(true)
      setLoadError(null)
      const themes: Record<number, any> = {}

      // 设置超时（30秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("加载超时，请刷新页面重试")), 30000)
      })

      // 加载 12 个月的主题
      const loadPromise = (async () => {
        for (let month = 1; month <= 12; month++) {
          console.log(`[Calendar Page] 加载第 ${month} 月主题...`)
          const theme = await getMonthTheme(user?.id || null, month, profile)
          themes[month] = theme
          console.log(`[Calendar Page] 第 ${month} 月主题加载完成:`, theme.theme)
        }
        return themes
      })()

      // 使用 Promise.race 来实现超时
      const loadedThemes = await Promise.race([loadPromise, timeoutPromise]) as Record<number, any>

      console.log("[Calendar Page] 所有月度主题加载完成")
      setMonthThemes(loadedThemes)
      setIsLoadingThemes(false)
    } catch (error) {
      console.error("[Calendar Page] 加载月度主题失败:", error)
      setLoadError(error instanceof Error ? error.message : "加载失败")
      setIsLoadingThemes(false)
    }
  }

  // 显示认证错误
  if (authError && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg font-semibold mb-2">认证加载失败</p>
          <p className="text-muted-foreground mb-4">{authError}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={retryLoad} variant="default">
              重试
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              刷新页面
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading || isLoadingThemes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground mb-4">
            {loading ? "正在加载用户信息..." : "正在加载日历主题..."}
          </p>
          {loadError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium mb-2">加载失败</p>
              <p className="text-sm text-muted-foreground mb-3">{loadError}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                刷新页面
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
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
            const theme = monthThemes[month]

            return (
              <Link key={month} href={`/month/${month}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group border-2 hover:border-accent relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{theme?.emoji || "📅"}</div>
                    <div className="text-sm font-medium text-muted-foreground">{theme?.name || `${month}月`}</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                    {theme?.theme || "加载中..."}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{theme?.description || ""}</p>
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
