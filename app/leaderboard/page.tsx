"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import { UserStatsCard } from "@/components/user-stats-card"
import { WealthTree } from "@/components/wealth-tree"

export default function LeaderboardPage() {
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("userProfile")
    if (stored) {
      setHasProfile(true)
    } else {
      router.push("/")
    }
  }, [router])

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/calendar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回日历
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Leaderboard />
          </div>

          {/* Sidebar */}
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
