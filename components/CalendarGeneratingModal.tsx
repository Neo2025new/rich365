"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react"

type GenerationPhase = "preparing" | "generating" | "saving" | "complete"

interface CalendarGeneratingModalProps {
  isOpen: boolean
  currentPhase: GenerationPhase
  progress: number
  currentAction?: string
}

export default function CalendarGeneratingModal({
  isOpen,
  currentPhase,
  progress,
  currentAction,
}: CalendarGeneratingModalProps) {
  const [dots, setDots] = useState("...")

  // 动态显示点点点
  useEffect(() => {
    if (currentPhase === "complete") return

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "."
        if (prev === ".") return ".."
        return "..."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [currentPhase])

  if (!isOpen) return null

  const phaseInfo = {
    preparing: {
      emoji: "🎯",
      title: "准备生成",
      description: "正在分析你的人格和目标",
    },
    generating: {
      emoji: "✨",
      title: "AI 生成中",
      description: "Gemini AI 正在为你定制专属行动",
    },
    saving: {
      emoji: "💾",
      title: "保存数据",
      description: "正在保存你的搞钱日历",
    },
    complete: {
      emoji: "🎉",
      title: "生成完成",
      description: "你的365天搞钱计划已就绪",
    },
  }

  const current = phaseInfo[currentPhase]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-8 shadow-2xl border-2 border-accent/20">
        <div className="text-center">
          {/* Emoji 动画 */}
          <div className="text-7xl mb-6 animate-bounce">{current.emoji}</div>

          {/* 标题 */}
          <h2 className="text-3xl font-bold mb-2">
            {current.title}
            {currentPhase !== "complete" && <span className="text-accent">{dots}</span>}
          </h2>

          {/* 描述 */}
          <p className="text-lg text-muted-foreground mb-6">{current.description}</p>

          {/* 进度条 */}
          <div className="mb-6">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>

          {/* 当前行动预览 */}
          {currentAction && currentPhase === "generating" && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium">正在生成</p>
              </div>
              <p className="text-sm text-muted-foreground">{currentAction}</p>
            </div>
          )}

          {/* 状态指示器 */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className={`flex items-center gap-1 ${currentPhase === "complete" ? "text-green-500" : ""}`}>
              {currentPhase === "complete" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>
                {currentPhase === "complete" ? "已完成" : "生成中"}
              </span>
            </div>
          </div>

          {/* 提示文字 */}
          {currentPhase !== "complete" && (
            <p className="text-xs text-muted-foreground mt-6">
              ⏱️ 预计需要 30-60 秒，请稍候...
            </p>
          )}

          {currentPhase === "complete" && (
            <p className="text-sm text-accent mt-6 font-medium animate-pulse">
              🚀 即将跳转到你的专属日历...
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
