"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mbtiData, roleData, type MBTIType, type ProfessionalRole } from "@/lib/calendar-data"
import { AVATAR_OPTIONS, getRandomAvatar, generateRandomUsername, type AvatarOption } from "@/lib/avatar-options"
import { Check, ArrowLeft, ArrowRight, Sparkles, Loader2, User, Smile } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
// import { generateFullYearCalendar } from "@/lib/gemini-calendar" // 改用 API 调用
import { updateUserDisplayInfo } from "@/lib/supabase-leaderboard"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading, updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(null)
  const [goal, setGoal] = useState("")
  const [username, setUsername] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null)
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  // 初始化随机头像和用户名建议
  useEffect(() => {
    if (!selectedAvatar) {
      setSelectedAvatar(getRandomAvatar())
    }
    if (!username) {
      setUsername(generateRandomUsername())
    }
  }, [])

  // 检查登录状态并显示提示
  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginPrompt(true)
      // 5 秒后自动隐藏提示
      const timer = setTimeout(() => setShowLoginPrompt(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [authLoading, user])

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
      alert("AI 生成失败，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedMBTI || !selectedRole) return

    const profileData = {
      mbti: selectedMBTI,
      role: selectedRole,
      goal: goal || undefined,
      username: username || generateRandomUsername(),
      avatar: selectedAvatar || getRandomAvatar(),
    }

    try {
      // 使用 AuthContext 的 updateProfile，会自动处理 Supabase 或 LocalStorage
      await updateProfile(profileData)

      // 如果用户已登录，更新用户显示信息并生成 AI 日历
      if (user) {
        // 更新用户名和头像到 profiles 表
        await updateUserDisplayInfo(user.id, profileData.username, profileData.avatar)

        setIsGeneratingCalendar(true)
        toast.info("正在为你生成个性化的 365 天搞钱日历...")

        // 调用 API 生成日历
        const response = await fetch("/api/generate-calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            profile: profileData,
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast.success(`成功生成 ${result.actionsCount} 个搞钱行动！`)
        } else {
          console.error("AI 日历生成失败:", result.message)
          toast.warning("日历生成失败，将使用默认模板")
        }

        setIsGeneratingCalendar(false)
      }

      // 跳转到日历页面
      router.push("/calendar")
    } catch (error) {
      console.error("保存 profile 失败:", error)
      toast.error("保存失败，请重试")
      setIsGeneratingCalendar(false)
    }
  }

  const canProceedStep1 = selectedMBTI !== null
  const canProceedStep2 = selectedRole !== null
  const canProceedStep4 = username.length >= 2

  return (
    <div className="min-h-screen bg-background">
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

          {/* Step 3: Goal Input */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  设定你的搞钱目标
                </h1>
                <p className="text-lg text-muted-foreground">
                  输入你的目标，AI 将为你生成个性化的行动建议（此步骤可跳过）
                </p>
              </div>

              <Card className="p-6 mb-8 max-w-3xl mx-auto">
                <Label htmlFor="goal" className="text-base font-medium mb-2 block">
                  你的搞钱目标是什么？
                </Label>
                <Textarea
                  id="goal"
                  placeholder="例如：一年内存到 10 万元、学会投资理财、开发一个赚钱的副业项目、提升职场竞争力..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-[120px] resize-none mb-4"
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
                    className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-lg">AI 为你推荐的行动</h3>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSuggestions}</div>
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      💡 这些建议会融入你的 365 天行动日历中
                    </p>
                  </motion.div>
                )}
              </Card>

              {selectedMBTI && selectedRole && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-6 bg-accent/10 rounded-lg border border-accent/20 max-w-3xl mx-auto"
                >
                  <p className="text-sm text-muted-foreground mb-2">你的搞钱人格</p>
                  <p className="text-xl font-bold">
                    {mbtiData[selectedMBTI].emoji} {selectedMBTI} · {mbtiData[selectedMBTI].name} ×{" "}
                    {roleData[selectedRole].emoji} {selectedRole}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    专属于你的 365 个搞钱行动即将生成
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: Username and Avatar Selection */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">👤</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">设置你的个人形象</h1>
                <p className="text-lg text-muted-foreground">选择一个专属头像和用户名，在排行榜上展示你的风采</p>
              </div>

              <Card className="p-6 mb-8 max-w-3xl mx-auto">
                {/* Username Input */}
                <div className="mb-8">
                  <Label htmlFor="username" className="text-base font-medium mb-2 block flex items-center gap-2">
                    <User className="h-5 w-5" />
                    用户名
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名（至少2个字符）"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-lg"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {username.length < 2
                      ? "请输入至少2个字符"
                      : `看起来不错！（${username.length}/20）`}
                  </p>
                </div>

                {/* Avatar Selection */}
                <div>
                  <Label className="text-base font-medium mb-4 block flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    选择头像
                  </Label>

                  <Tabs defaultValue="people" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                      <TabsTrigger value="people">人物</TabsTrigger>
                      <TabsTrigger value="animals">动物</TabsTrigger>
                      <TabsTrigger value="objects">物品</TabsTrigger>
                      <TabsTrigger value="symbols">符号</TabsTrigger>
                    </TabsList>

                    {(["people", "animals", "objects", "symbols"] as const).map((category) => (
                      <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {AVATAR_OPTIONS.filter((avatar) => avatar.category === category).map((avatar) => {
                            const isSelected = selectedAvatar === avatar.emoji

                            return (
                              <Card
                                key={avatar.emoji}
                                onClick={() => setSelectedAvatar(avatar.emoji)}
                                className={`p-3 cursor-pointer transition-all duration-300 hover:scale-110 relative ${
                                  isSelected
                                    ? "border-2 border-accent shadow-lg bg-accent/10"
                                    : "border hover:border-accent/50"
                                }`}
                                title={avatar.name}
                              >
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full p-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                                <div className="text-center text-3xl">{avatar.emoji}</div>
                              </Card>
                            )
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Random Button */}
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAvatar(getRandomAvatar())
                      setUsername(generateRandomUsername())
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    随机生成
                  </Button>
                </div>
              </Card>

              {/* Preview */}
              {selectedAvatar && username && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-6 bg-accent/10 rounded-lg border border-accent/20 max-w-3xl mx-auto"
                >
                  <p className="text-sm text-muted-foreground mb-3">预览效果</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-4xl">{selectedAvatar}</div>
                    <div className="text-xl font-bold">{username}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    这就是你在排行榜上的显示效果！
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
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

            {currentStep < totalSteps ? (
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
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceedStep4 || isGeneratingCalendar}
                className="px-8"
              >
                {isGeneratingCalendar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>生成我的日历 🚀</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
