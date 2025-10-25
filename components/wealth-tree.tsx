"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getUserStats } from "@/lib/checkin-data"
import { getTreeLevel, getNextTreeLevel, getTreeProgress, TREE_LEVELS } from "@/lib/tree-data"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp } from "lucide-react"

export function WealthTree() {
  const [stats, setStats] = useState(getUserStats())
  const [currentLevel, setCurrentLevel] = useState(getTreeLevel(0))
  const [nextLevel, setNextLevel] = useState(getNextTreeLevel(0))
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateTree = () => {
      const newStats = getUserStats()
      setStats(newStats)
      setCurrentLevel(getTreeLevel(newStats.totalCheckIns))
      setNextLevel(getNextTreeLevel(newStats.totalCheckIns))
      setProgress(getTreeProgress(newStats.totalCheckIns))
    }

    updateTree()

    window.addEventListener("storage", updateTree)
    const interval = setInterval(updateTree, 1000)

    return () => {
      window.removeEventListener("storage", updateTree)
      clearInterval(interval)
    }
  }, [])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">财富成长树</h3>
        <Sparkles className="h-5 w-5 text-accent" />
      </div>

      {/* Tree Visualization */}
      <div className="relative mb-6">
        <div className="flex justify-center items-end h-48 relative">
          {/* Tree Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Tree Emoji */}
            <div className="text-8xl relative z-10">{currentLevel.emoji}</div>

            {/* Glow Effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className={`absolute inset-0 bg-gradient-to-br ${currentLevel.color} blur-2xl rounded-full -z-10`}
            />
          </motion.div>

          {/* Floating Particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -60],
                x: [0, (Math.random() - 0.5) * 40],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.4,
                ease: "easeOut",
              }}
              className="absolute bottom-0 left-1/2"
              style={{ marginLeft: (Math.random() - 0.5) * 60 }}
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.div>
          ))}
        </div>

        {/* Level Info */}
        <div className="text-center mt-4">
          <div className="text-2xl font-bold mb-1">{currentLevel.name}</div>
          <div className="text-sm text-muted-foreground">{currentLevel.description}</div>
        </div>
      </div>

      {/* Progress to Next Level */}
      {nextLevel ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">成长进度</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">下一阶段</span>
            </div>
            <div className="font-medium">
              {nextLevel.emoji} {nextLevel.name}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            还需打卡 {nextLevel.requiredCheckIns - stats.totalCheckIns} 天解锁
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="text-lg font-bold mb-1">恭喜!</div>
          <div className="text-sm text-muted-foreground">你已达到最高等级 - 财富自由之树</div>
        </div>
      )}

      {/* All Levels Preview */}
      <div className="mt-6 pt-6 border-t">
        <div className="text-sm font-semibold mb-3">成长路径</div>
        <div className="grid grid-cols-3 gap-2">
          {TREE_LEVELS.map((level) => {
            const isUnlocked = stats.totalCheckIns >= level.requiredCheckIns
            const isCurrent = level.level === currentLevel.level

            return (
              <div
                key={level.level}
                className={`
                  p-2 rounded-lg border text-center transition-all
                  ${isCurrent ? "border-accent bg-accent/10 scale-105" : ""}
                  ${isUnlocked && !isCurrent ? "border-border bg-muted/50" : ""}
                  ${!isUnlocked ? "border-border/50 opacity-40" : ""}
                `}
              >
                <div className="text-2xl mb-1">{level.emoji}</div>
                <div className="text-xs font-medium">{level.name}</div>
                <div className="text-xs text-muted-foreground">{level.requiredCheckIns}天</div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
