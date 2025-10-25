"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { getUserStats, getEarnedBadges, getNextBadge, type Badge, type UserStats } from "@/lib/supabase-checkin"
import { Coins, Flame, Trophy, Target } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function UserStatsCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalCoins: 0,
    badges: [],
  })
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [nextBadge, setNextBadge] = useState<Badge | null>(null)

  useEffect(() => {
    if (user) {
      updateStats()

      // Poll for updates
      const interval = setInterval(updateStats, 5000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [user])

  const updateStats = async () => {
    if (!user) return

    const [userStats, badges, next] = await Promise.all([
      getUserStats(user.id),
      getEarnedBadges(user.id),
      getNextBadge(user.id),
    ])

    setStats(userStats)
    setEarnedBadges(badges)
    setNextBadge(next)
  }

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">你的搞钱成就</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">连续打卡</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalCoins}</div>
            <div className="text-sm text-muted-foreground">累计金币</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <div className="text-sm text-muted-foreground">累计打卡</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.longestStreak}</div>
            <div className="text-sm text-muted-foreground">最长连击</div>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3">已获得徽章</h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg"
                title={badge.description}
              >
                <span className="text-xl">{badge.emoji}</span>
                <span className="text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Badge */}
      {nextBadge && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">下一个目标</h4>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-2xl">{nextBadge.emoji}</span>
            <div className="flex-1">
              <div className="font-medium">{nextBadge.name}</div>
              <div className="text-sm text-muted-foreground">{nextBadge.description}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
