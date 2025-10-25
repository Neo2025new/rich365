"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Coins, Flame, Sparkles, Trophy } from "lucide-react"
import { checkIn, hasCheckedInToday, type Badge } from "@/lib/supabase-checkin"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface CheckInButtonProps {
  date: string
}

export function CheckInButton({ date }: CheckInButtonProps) {
  const { user } = useAuth()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAnimation, setShowAnimation] = useState(false)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [coins, setCoins] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // 检查是否已打卡
    if (user) {
      checkIfCheckedIn()
    } else {
      setIsLoading(false)
    }
  }, [user, date])

  const checkIfCheckedIn = async () => {
    if (!user) return

    setIsLoading(true)
    const checked = await hasCheckedInToday(user.id, date)
    setIsCheckedIn(checked)
    setIsLoading(false)
  }

  const handleCheckIn = async () => {
    if (isCheckedIn || !user) return

    setIsLoading(true)

    const result = await checkIn(user.id, date)

    if (result.success && result.stats) {
      setIsCheckedIn(true)
      setCoins(10)
      setStreak(result.stats.currentStreak)
      setNewBadges(result.newBadges || [])
      setShowAnimation(true)

      toast.success("打卡成功！+10 金币")

      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowAnimation(false)
        setNewBadges([])
      }, 3000)
    } else {
      toast.error(result.message || "打卡失败，请重试")
    }

    setIsLoading(false)
  }

  return (
    <div className="relative">
      <Button
        size="lg"
        onClick={handleCheckIn}
        disabled={isCheckedIn || isLoading || !user}
        className="text-lg px-8 relative overflow-hidden"
      >
        {isCheckedIn ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            已完成打卡
          </>
        ) : isLoading ? (
          <>
            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
            加载中...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            完成今日行动
          </>
        )}
      </Button>

      {/* Animations */}
      <AnimatePresence>
        {showAnimation && (
          <>
            {/* Coin Animation */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`coin-${i}`}
                initial={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  scale: 1,
                }}
                animate={{
                  opacity: 0,
                  y: -100 - Math.random() * 50,
                  x: (Math.random() - 0.5) * 100,
                  scale: 1.5,
                  rotate: Math.random() * 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <Coins className="h-8 w-8 text-yellow-500" />
              </motion.div>
            ))}

            {/* Streak Fire Animation */}
            {streak > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border rounded-lg px-4 py-2 shadow-lg pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-lg">{streak} 天连续打卡!</span>
                </div>
              </motion.div>
            )}

            {/* Badge Unlock Animation */}
            {newBadges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -top-32 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border rounded-lg px-6 py-4 shadow-xl pointer-events-none min-w-[200px]"
              >
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl mb-1">{newBadges[0].emoji}</div>
                  <div className="font-bold">{newBadges[0].name}</div>
                  <div className="text-sm opacity-90">{newBadges[0].description}</div>
                </div>
              </motion.div>
            )}

            {/* Coins Earned Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 rounded-full px-4 py-1 text-sm font-bold shadow-lg pointer-events-none whitespace-nowrap"
            >
              +{coins} 金币
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
