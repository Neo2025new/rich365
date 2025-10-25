"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/calendar-data"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // 设置超时保护（10秒后强制结束加载状态）
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.error("[AuthContext] 加载超时，强制结束加载状态")
        setLoading(false)
      }
    }, 10000)

    // 获取当前登录用户
    const initAuth = async () => {
      try {
        console.log("[AuthContext] 开始初始化认证...")
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error("[AuthContext] 获取用户失败:", error)
          setUser(null)
          setProfile(null)
          loadLocalProfile()
          setLoading(false)
          clearTimeout(loadingTimeout)
          return
        }

        console.log("[AuthContext] 获取到用户:", user?.id)
        setUser(user)

        if (user) {
          await loadProfile(user.id)
        } else {
          // 未登录时，尝试从 localStorage 加载（向后兼容）
          loadLocalProfile()
          setLoading(false)
        }
        clearTimeout(loadingTimeout)
      } catch (error) {
        console.error("[AuthContext] 初始化认证失败:", error)
        setUser(null)
        setProfile(null)
        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    }

    initAuth()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] 认证状态变化:", event, "user:", session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        loadLocalProfile()
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      console.log("[AuthContext] 开始加载 profile, userId:", userId)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // 用户没有 profile，可能刚注册
          console.log("[AuthContext] 未找到 profile，用户需要完成 onboarding")
          setProfile(null)
          return
        } else {
          console.error("[AuthContext] 加载 profile 出错:", error)
          setProfile(null)
          return
        }
      }

      console.log("[AuthContext] Profile 数据:", data)

      if (!data) {
        console.log("[AuthContext] 没有 profile 数据")
        setProfile(null)
        return
      }

      if (data.mbti && data.role) {
        // 确保必需字段存在
        const userProfile: UserProfile = {
          mbti: data.mbti,
          role: data.role,
          goal: data.goal || undefined,
          username: data.username || undefined,
          avatar: data.avatar || undefined,
        }
        console.log("[AuthContext] Profile 验证通过，设置 profile:", userProfile)
        setProfile(userProfile)

        // 同步到 localStorage
        localStorage.setItem("userProfile", JSON.stringify(userProfile))
      } else {
        // 数据不完整，需要重新完成 onboarding
        console.log("[AuthContext] Profile 数据不完整，缺少必需字段:", {
          mbti: data.mbti,
          role: data.role,
        })
        setProfile(null)
      }
    } catch (error) {
      console.error("[AuthContext] 加载 profile 失败:", error)
      setProfile(null)
    } finally {
      console.log("[AuthContext] loadProfile 完成，设置 loading = false")
      setLoading(false)
    }
  }

  const loadLocalProfile = () => {
    try {
      const stored = localStorage.getItem("userProfile")
      if (stored) {
        setProfile(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading profile from localStorage:", error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    } else {
      loadLocalProfile()
    }
  }

  const updateProfile = async (newProfile: UserProfile) => {
    if (user) {
      // 已登录：更新 Supabase
      try {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            mbti: newProfile.mbti,
            role: newProfile.role,
            goal: newProfile.goal || null,
            username: newProfile.username || null,
            avatar: newProfile.avatar || null,
          })
          .eq("id", user.id)

        if (error) throw error

        setProfile(newProfile)
        localStorage.setItem("userProfile", JSON.stringify(newProfile))
      } catch (error) {
        console.error("Error updating profile:", error)
        throw error
      }
    } else {
      // 未登录：只更新 localStorage
      setProfile(newProfile)
      localStorage.setItem("userProfile", JSON.stringify(newProfile))
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // 清除 localStorage
    localStorage.removeItem("userProfile")
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
