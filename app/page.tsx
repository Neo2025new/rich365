"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mbtiData, roleData, type MBTIType, type ProfessionalRole } from "@/lib/calendar-data"
import { Check } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(null)

  const handleGenerate = () => {
    if (selectedMBTI && selectedRole) {
      try {
        localStorage.setItem("userProfile", JSON.stringify({ mbti: selectedMBTI, role: selectedRole }))
        router.push("/calendar")
      } catch (error) {
        console.error("Failed to save user profile:", error)
        alert("保存失败，请检查浏览器设置是否允许存储数据")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">📅 Rich365 💰</h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-2">每天行动一小步，财富增长一大步</p>
            <p className="text-lg text-muted-foreground">365 days, 365 actions toward wealth.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        {/* Step 1: MBTI Selection */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium mb-3">
              步骤 1/2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">选择你的 MBTI 人格类型</h2>
            <p className="text-muted-foreground">不同的人格类型，适合不同的搞钱方式</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {(Object.keys(mbtiData) as MBTIType[]).map((mbti) => {
              const data = mbtiData[mbti]
              const isSelected = selectedMBTI === mbti

              return (
                <Card
                  key={mbti}
                  onClick={() => setSelectedMBTI(mbti)}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 relative ${
                    isSelected ? "border-2 border-accent shadow-lg bg-accent/5" : "border-2 hover:border-accent/50"
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
        </div>

        {/* Step 2: Role Selection */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium mb-3">
              步骤 2/2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">选择你的职业身份</h2>
            <p className="text-muted-foreground">根据你的职业，定制专属搞钱行动</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(roleData) as ProfessionalRole[]).map((role) => {
              const data = roleData[role]
              const isSelected = selectedRole === role

              return (
                <Card
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] relative ${
                    isSelected ? "border-2 border-accent shadow-lg bg-accent/5" : "border-2 hover:border-accent/50"
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
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedMBTI || !selectedRole}
            className="text-lg px-8 py-6 font-bold"
          >
            {selectedMBTI && selectedRole ? "生成我的搞钱行动日历 🚀" : "请先完成选择"}
          </Button>
        </div>

        {/* Preview */}
        {selectedMBTI && selectedRole && (
          <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20 text-center">
            <p className="text-sm text-muted-foreground mb-2">你的搞钱人格</p>
            <p className="text-xl font-bold">
              {mbtiData[selectedMBTI].emoji} {selectedMBTI} · {mbtiData[selectedMBTI].name} ×{" "}
              {roleData[selectedRole].emoji} {selectedRole}
            </p>
            <p className="text-sm text-muted-foreground mt-2">专属于你的 365 个搞钱行动即将生成</p>
          </div>
        )}
      </div>
    </div>
  )
}
