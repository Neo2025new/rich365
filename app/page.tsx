"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Target, Sparkles, Trophy, Calendar, TrendingUp, Users, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export default function LandingPage() {
  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "个性化匹配",
      description: "16种MBTI人格 × 5种职业身份 = 80种定制方案",
      emoji: "🎯",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "AI 智能推荐",
      description: "Gemini AI 驱动，根据你的目标生成个性化行动",
      emoji: "✨",
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "游戏化激励",
      description: "打卡、徽章、排行榜，让搞钱变得有趣",
      emoji: "🏆",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "365天陪伴",
      description: "每天一个微行动，365天培养财富思维",
      emoji: "📅",
    },
  ]

  const steps = [
    {
      number: "1",
      title: "选择人格与职业",
      description: "告诉我们你的 MBTI 类型和职业身份",
      emoji: "🧠",
    },
    {
      number: "2",
      title: "设定搞钱目标",
      description: "AI 为你生成专属行动建议（可选）",
      emoji: "🎯",
    },
    {
      number: "3",
      title: "开始行动打卡",
      description: "每天坚持一个小行动，见证财富增长",
      emoji: "🚀",
    },
  ]

  const stats = [
    { value: "365", label: "天行动计划", emoji: "📅" },
    { value: "80+", label: "定制方案", emoji: "🎨" },
    { value: "200+", label: "行动模板", emoji: "📝" },
    { value: "5", label: "成就徽章", emoji: "🏅" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">📅 Rich365 💰</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                登录
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="font-medium">
                开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-medium mb-6">
              🎉 每天一个搞钱行动，365天成为更会赚钱的自己
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
              Rich365
              <br />
              <span className="text-accent">搞钱行动日历</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              每天行动一小步，财富增长一大步
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              基于你的 MBTI 人格和职业身份，为你生成 365 个定制化"搞钱微行动"。
              通过 AI 智能推荐 + 游戏化激励，培养财富思维和行动习惯。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/onboarding">
                <Button size="lg" className="text-lg px-8 py-6 font-bold">
                  开始我的搞钱之旅
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                查看演示
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{stat.emoji}</div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              为什么选择 Rich365？
            </h2>
            <p className="text-lg text-muted-foreground">
              我们用科技和心理学，让搞钱变得简单、有趣、可持续
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-accent/50">
                  <div className="text-5xl mb-4">{feature.emoji}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">如何开始？</h2>
            <p className="text-lg text-muted-foreground">
              3 步开启你的 365 天搞钱之旅
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="p-8 h-full text-center border-2">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold">
                      {step.number}
                    </div>
                    <div className="text-5xl mb-4 mt-4">{step.emoji}</div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2">
                      <ArrowRight className="h-8 w-8 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center border-2 border-accent/50">
              <div className="text-6xl mb-6">🌟</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                加入 Rich365，开始你的财富增长之旅
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                不是一夜暴富，而是持续行动。365 天，365 个微行动，
                培养财富思维，成为更会赚钱的自己。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/onboarding">
                  <Button size="lg" className="text-lg px-8 py-6 font-bold">
                    立即免费开始
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold">📅 Rich365 💰</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  每天行动一小步，财富增长一大步。
                  365 天定制化搞钱行动，培养财富思维。
                </p>
                <p className="text-sm text-muted-foreground">
                  Action to Richness
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">产品</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link href="/onboarding" className="hover:text-accent transition-colors">
                      开始使用
                    </Link>
                  </li>
                  <li>
                    <Link href="/calendar" className="hover:text-accent transition-colors">
                      行动日历
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className="hover:text-accent transition-colors">
                      排行榜
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">支持</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link href="/login" className="hover:text-accent transition-colors">
                      登录
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-accent transition-colors">
                      帮助中心
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-accent transition-colors">
                      联系我们
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© 2025 Rich365. All rights reserved. Made with ❤️</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
