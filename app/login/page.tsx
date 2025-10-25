"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, Chrome, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // 邮箱登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // 检查用户是否有 profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single()

      toast.success("登录成功！正在跳转...")

      // 如果没有 profile，跳转到 onboarding
      // 如果有 profile，跳转到日历
      if (profile) {
        router.push("/calendar")
      } else {
        router.push("/onboarding")
      }
      router.refresh()
    } catch (error: any) {
      console.error("登录错误:", error)
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("邮箱或密码错误，请重试")
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("请先验证您的邮箱，检查邮件中的验证链接")
      } else {
        toast.error(error.message || "登录失败，请重试")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 邮箱注册
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
        },
      })

      if (error) throw error

      // 检查是否需要邮箱验证
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("该邮箱已被注册，请直接登录")
        setIsLoading(false)
        return
      }

      // 检查是否自动确认了邮箱
      if (data.session) {
        // 邮箱已自动确认，直接跳转到 onboarding
        toast.success("注册成功！正在跳转...")
        router.push("/onboarding")
        router.refresh()
      } else {
        // 需要邮箱验证
        toast.success("注册成功！请检查您的邮箱（包括垃圾邮件文件夹）并点击验证链接", {
          duration: 8000,
        })
        toast.info("验证邮箱后即可登录使用", { duration: 8000 })
      }
    } catch (error: any) {
      console.error("注册错误:", error)
      toast.error(error.message || "注册失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // Google 登录
  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Google 登录失败")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">📅 Rich365 💰</h1>
          <p className="text-muted-foreground">365天财富行动计划</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>欢迎回来</CardTitle>
            <CardDescription>登录或注册开始您的财富之旅</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="signup">注册</TabsTrigger>
              </TabsList>

              {/* 登录表单 */}
              <TabsContent value="login">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登录
                  </Button>
                </form>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="signup">
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少6位密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    注册
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或者</span>
              </div>
            </div>

            {/* Google 登录 */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              使用 Google 登录
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <p>登录即表示您同意我们的服务条款和隐私政策</p>
          </CardFooter>
        </Card>

        {/* 返回首页 */}
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
