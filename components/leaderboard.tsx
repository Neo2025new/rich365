"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getStreakLeaderboard,
  getTotalCheckInsLeaderboard,
  getUserRank,
  type LeaderboardEntry,
} from "@/lib/leaderboard-data"
import { Trophy, Flame, Target, Medal, Crown, Award } from "lucide-react"
import { motion } from "framer-motion"

export function Leaderboard() {
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalLeaderboard, setTotalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [streakRank, setStreakRank] = useState(0)
  const [totalRank, setTotalRank] = useState(0)

  useEffect(() => {
    const updateLeaderboard = () => {
      setStreakLeaderboard(getStreakLeaderboard())
      setTotalLeaderboard(getTotalCheckInsLeaderboard())
      setStreakRank(getUserRank("streak"))
      setTotalRank(getUserRank("total"))
    }

    updateLeaderboard()

    window.addEventListener("storage", updateLeaderboard)
    const interval = setInterval(updateLeaderboard, 2000)

    return () => {
      window.removeEventListener("storage", updateLeaderboard)
      clearInterval(interval)
    }
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-amber-500"
    if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-500"
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-orange-600"
    return "bg-muted"
  }

  const renderLeaderboardList = (entries: LeaderboardEntry[], type: "streak" | "total") => {
    return (
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const rank = index + 1
          const value = type === "streak" ? entry.currentStreak : entry.totalCheckIns

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${entry.isCurrentUser ? "bg-accent/20 border-accent shadow-sm" : "bg-card hover:bg-muted/50"}
                `}
              >
                {/* Rank */}
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${getRankBadge(rank)}
                `}
                >
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div className="text-2xl">{entry.avatar}</div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.username}
                    {entry.isCurrentUser && <span className="ml-2 text-xs text-accent">(你)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{entry.totalCoins} 金币</div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{type === "streak" ? "连续天" : "累计天"}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            搞钱打卡榜
          </h3>
          <p className="text-sm text-muted-foreground mt-1">比你更努力的人，还在搞钱！</p>
        </div>
      </div>

      <Tabs defaultValue="streak" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="streak" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            连续打卡榜
          </TabsTrigger>
          <TabsTrigger value="total" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            累计行动榜
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streak" className="space-y-4">
          {/* User Rank Card */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">你的排名</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">#{streakRank}</span>
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Leaderboard List */}
          {renderLeaderboardList(streakLeaderboard, "streak")}
        </TabsContent>

        <TabsContent value="total" className="space-y-4">
          {/* User Rank Card */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">你的排名</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">#{totalRank}</span>
                <Target className="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>

          {/* Leaderboard List */}
          {renderLeaderboardList(totalLeaderboard, "total")}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
