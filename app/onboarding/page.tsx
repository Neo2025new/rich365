"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { mbtiData, roleData, type MBTIType, type ProfessionalRole } from "@/lib/calendar-data"
import { Check, ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import CalendarGeneratingModal from "@/components/CalendarGeneratingModal"

type GenerationPhase = "preparing" | "generating" | "saving" | "complete"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(null)
  const [goal, setGoal] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // 新增：生成进度相关状态
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false)
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("preparing")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentAction, setCurrentAction] = useState<string>()

  const totalSteps = 3 // 从 4 步改为 3 步
  const progress = (currentStep / totalSteps) * 100

  // 检查登录状态并显示提示
  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginPrompt(true)
      const timer = setTimeout(() => setShowLoginPrompt(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [authLoading, user])

  // 检查 profile 是否已完整，如果完整则跳转到 calendar（老用户）
  useEffect(() => {
    if (!authLoading && profile && profile.mbti && profile.role) {
      console.log("[Onboarding] ✅ 检测到完整 profile，跳转到 calendar")
      router.push("/calendar")
    }
  }, [authLoading, profile, router])

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerateAISuggestions = async () => {
    if (!goal || !selectedMBTI || !selectedRole) return

    setIsGenerating(true)
    setAiSuggestions(null)

    try {
      const response = await fetch("/api/generate-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          mbti: selectedMBTI,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        throw new Error("生成失败")
      }

      const data = await response.json()
      setAiSuggestions(data.actions)
    } catch (error) {
      console.error("AI 生成失败:", error)
      toast.error("AI 生成失败，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedMBTI || !selectedRole) return

    console.log("[Onboarding] ========== 开始生成日历 ==========")
    console.log("[Onboarding] 用户信息:", { userId: user?.id, isLoggedIn: !!user })

    const profileData = {
      mbti: selectedMBTI,
      role: selectedRole,
      goal: goal || undefined,
    }

    try {
      // Phase 1: 准备生成
      setIsGeneratingCalendar(true)
      setGenerationPhase("preparing")
      setGenerationProgress(10)
      console.log("[Onboarding] [Phase 1/4] 准备生成...")

      // 更新 profile（不包括 username 和 avatar，这些已经在注册时自动生成）
      await updateProfile(profileData)
      console.log("[Onboarding] ✅ Profile 更新完成")

      setGenerationProgress(20)

      // 如果用户已登录，生成 AI 日历
      if (user) {
        console.log("[Onboarding] 用户已登录，开始生成 AI 日历")

        // Phase 2.1: 生成年度规划（12 个月主题）
        setGenerationPhase("generating")
        setGenerationProgress(25)
        setCurrentAction("正在为你规划全年的搞钱主题...")

        console.log("[Onboarding] 步骤 1: 生成年度规划...")
        const yearlyPlanResponse = await fetch("/api/generate-yearly-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            profile: profileData,
          }),
        })

        const yearlyPlanResult = await yearlyPlanResponse.json()

        if (!yearlyPlanResult.success) {
          console.error("[Onboarding] ❌ 年度规划生成失败:", yearlyPlanResult.error)
          toast.error(yearlyPlanResult.error || "年度规划生成失败")
          setIsGeneratingCalendar(false)
          return
        }

        console.log("[Onboarding] ✅ 年度规划生成完成")
        setGenerationProgress(40)

        // Phase 2.2: 使用模拟数据生成第一个月
        setCurrentAction("正在为你定制第一个月的搞钱行动...")

        console.log("[Onboarding] 步骤 2: 使用模拟数据生成第一个月...")
        const response = await fetch("/api/generate-mock-first-month", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          console.log("[Onboarding] ✅ 第一个月模拟数据生成完成，共", result.count, "个行动")
          setGenerationProgress(80)

          // Phase 3: 完成
          setGenerationPhase("saving")
          setGenerationProgress(90)
          setCurrentAction("保存数据...")

          await new Promise(resolve => setTimeout(resolve, 500))

          setGenerationProgress(100)
          setGenerationPhase("complete")
          console.log("[Onboarding] ✅ 日历生成完成")

          toast.success(`成功生成 ${result.count} 个搞钱行动！`)

          // 等待 1 秒显示完成状态
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          console.error("[Onboarding] ⚠️ 模拟数据生成失败:", result.error)
          toast.error(result.error || "日历生成失败，请重试")
          setIsGeneratingCalendar(false)
          return
        }
      } else {
        console.log("[Onboarding] 用户未登录，跳过 AI 日历生成")
        setGenerationPhase("complete")
        setGenerationProgress(100)
      }

      // 等待确保所有状态已经传播
      console.log("[Onboarding] 等待 500ms 确保状态同步...")
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log("[Onboarding] 准备跳转到日历页面")

      // 设置标记
      sessionStorage.setItem("onboarding_just_completed", "true")
      sessionStorage.setItem("onboarding_profile", JSON.stringify(profileData))

      console.log("[Onboarding] ✅ 即将跳转到日历...")

      // 跳转
      router.replace("/calendar")

      console.log("[Onboarding] ========== 完成流程结束 ==========")
    } catch (error) {
      console.error("[Onboarding] ❌ 生成失败:", error)
      toast.error("生成失败，请重试")
      setIsGeneratingCalendar(false)
      setGenerationPhase("preparing")
      setGenerationProgress(0)
    }
  }

  const canProceedStep1 = selectedMBTI !== null
  const canProceedStep2 = selectedRole !== null

  return (
    <div className="min-h-screen bg-background">
      {/* 生成进度模态框 */}
      <CalendarGeneratingModal
        isOpen={isGeneratingCalendar}
        currentPhase={generationPhase}
        progress={generationProgress}
        currentAction={currentAction}
      />

      {/* 未登录提示 */}
      {showLoginPrompt && !user && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  💡 登录后可享受完整功能（AI 日历生成、云端同步、排行榜等）
                </p>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push("/login?redirect=/onboarding")}
                  className="bg-white text-orange-600 hover:bg-gray-100 text-xs"
                >
                  立即登录
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-white hover:bg-white/20 text-xs"
                >
                  继续
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className={`fixed left-0 right-0 z-50 bg-background border-b transition-all ${showLoginPrompt && !user ? "top-[60px]" : "top-0"}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">📅 Rich365</span>
            <span className="text-sm text-muted-foreground">
              步骤 {currentStep} / {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className={`container mx-auto px-4 pb-32 max-w-5xl transition-all ${showLoginPrompt && !user ? "pt-40" : "pt-28"}`}>
        <AnimatePresence mode="wait">
          {/* Step 1: MBTI Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">🧠</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  选择你的 MBTI 人格类型
                </h1>
                <p className="text-lg text-muted-foreground">
                  不同的人格类型，适合不同的搞钱方式。选择最符合你的类型。
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
                {(Object.keys(mbtiData) as MBTIType[]).map((mbti) => {
                  const data = mbtiData[mbti]
                  const isSelected = selectedMBTI === mbti

                  return (
                    <Card
                      key={mbti}
                      onClick={() => setSelectedMBTI(mbti)}
                      className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 relative ${
                        isSelected
                          ? "border-2 border-accent shadow-lg bg-accent/5"
                          : "border-2 hover:border-accent/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-3xl mb-2">{data.emoji}</div>
                        <div className="font-bold text-sm mb-1">{mbti}</div>
                        <div className="text-xs text-muted-foreground">{data.name}</div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {selectedMBTI && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20"
                >
                  <p className="text-sm text-muted-foreground">
                    已选择：
                    <span className="font-bold text-accent ml-2">
                      {mbtiData[selectedMBTI].emoji} {selectedMBTI} · {mbtiData[selectedMBTI].name}
                    </span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Role Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">💼</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  选择你的职业身份
                </h1>
                <p className="text-lg text-muted-foreground">
                  根据你的职业，我们会为你定制专属的搞钱行动。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {(Object.keys(roleData) as ProfessionalRole[]).map((role) => {
                  const data = roleData[role]
                  const isSelected = selectedRole === role

                  return (
                    <Card
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] relative ${
                        isSelected
                          ? "border-2 border-accent shadow-lg bg-accent/5"
                          : "border-2 hover:border-accent/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full p-1.5">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="text-4xl flex-shrink-0">{data.emoji}</div>
                        <div className="flex-1">
                          <div className="font-bold text-lg mb-2">{role}</div>
                          <div className="text-sm text-muted-foreground mb-2">{data.description}</div>
                          <div className="text-xs text-muted-foreground italic">{data.traits}</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {selectedRole && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20"
                >
                  <p className="text-sm text-muted-foreground">
                    已选择：
                    <span className="font-bold text-accent ml-2">
                      {roleData[selectedRole].emoji} {selectedRole}
                    </span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Goal Input + Generate Calendar */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center max-w-4xl mx-auto">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  设定你的搞钱目标
                </h1>
                <p className="text-lg text-muted-foreground">
                  输入你的目标，AI 将为你生成个性化的行动建议（此步骤可跳过）
                </p>
              </div>

              {/* 左右布局：左边目标输入，右边生成按钮 */}
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
                {/* 左侧：目标输入区域 */}
                <Card className="p-6 flex-1 max-w-2xl w-full">
                  <label htmlFor="goal" className="text-base font-medium mb-2 block">
                    你的搞钱目标是什么？
                  </label>
                  <Textarea
                    id="goal"
                    placeholder="例如：一年内存到 10 万元、学会投资理财、开发一个赚钱的副业项目、提升职场竞争力..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="min-h-[200px] resize-none mb-4"
                  />

                  {selectedMBTI && selectedRole && goal && (
                    <Button
                      onClick={handleGenerateAISuggestions}
                      disabled={isGenerating}
                      variant="outline"
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          AI 生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          获取 AI 行动建议
                        </>
                      )}
                    </Button>
                  )}

                  {aiSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20 max-h-[400px] overflow-y-auto"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
                        <h3 className="font-semibold text-lg">AI 为你推荐的行动</h3>
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{aiSuggestions}</div>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        💡 这些建议会融入你的 365 天行动日历中
                      </p>
                    </motion.div>
                  )}
                </Card>

                {/* 右侧：生成日历按钮 */}
                {selectedMBTI && selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:sticky lg:top-6 w-full lg:w-[400px] flex-shrink-0"
                  >
                    <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-accent/20">
                      <div className="text-center mb-6">
                        <p className="text-sm text-muted-foreground mb-2">你的搞钱人格</p>
                        <p className="text-2xl font-bold mb-4">
                          {mbtiData[selectedMBTI].emoji} {selectedMBTI} · {mbtiData[selectedMBTI].name}
                        </p>
                        <p className="text-lg font-semibold mb-4">
                          × {roleData[selectedRole].emoji} {selectedRole}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          专属于你的搞钱行动即将生成
                        </p>
                      </div>

                      {/* 生成日历按钮 */}
                      <Button
                        onClick={handleComplete}
                        disabled={isGeneratingCalendar}
                        size="lg"
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-6 text-lg mb-3"
                      >
                        {isGeneratingCalendar ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            生成我的专属日历 🚀
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        ⏱️ 预计需要 30-60 秒
                      </p>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons - 只在前两步显示 */}
      {currentStep < 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-6">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>

              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
                className="px-8"
              >
                下一步
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 第 3 步也有返回按钮 */}
      {currentStep === 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-6">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
