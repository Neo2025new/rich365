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
    // 初始化：获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      // RLS 策略会自动根据 auth.uid() 过滤，不需要手动指定 user_id
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // 新用户，创建默认 profile 并生成第一个月数据
          console.log("[AuthContext] 新用户，初始化默认数据")
          await initializeNewUser(userId)
          return
        } else {
          console.error("[AuthContext] 加载 profile 失败:", error)
          setProfile(null)
        }
      } else if (data) {
        // 构建 UserProfile 对象
        const userProfile: UserProfile = {
          mbti: data.mbti || undefined,
          role: data.role || undefined,
          goal: data.goal || undefined,
          username: data.username || undefined,
          avatar: data.avatar || undefined,
        }
        setProfile(userProfile)

        // 检查是否需要生成第一个月数据
        await ensureFirstMonthData(userId, userProfile)
      }
    } catch (error) {
      console.error("[AuthContext] 加载 profile 异常:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const initializeNewUser = async (userId: string) => {
    try {
      console.log("[AuthContext] 🚀 开始初始化新用户")

      // 创建默认 profile
      const defaultProfile = {
        mbti: "INFP",
        role: "创业者",
        goal: "实现财富自由"
      }

      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          ...defaultProfile
        })

      if (insertError) {
        console.error("[AuthContext] ❌ 创建默认 profile 失败:", insertError)
        setLoading(false)
        return
      }

      console.log("[AuthContext] ✅ 默认 profile 创建成功")

      // 生成第一个月数据
      await generateFirstMonth(userId, defaultProfile)

      // 重新加载 profile
      await loadProfile(userId)
    } catch (error) {
      console.error("[AuthContext] ❌ 初始化新用户失败:", error)
      setLoading(false)
    }
  }

  const ensureFirstMonthData = async (userId: string, profile: UserProfile) => {
    try {
      // 检查是否有 daily_actions
      const { data, error } = await supabase
        .from("daily_actions")
        .select("id")
        .limit(1)

      if (!data || data.length === 0) {
        // 没有数据，生成第一个月
        console.log("[AuthContext] 📅 检测到没有数据，生成第一个月")
        await generateFirstMonth(userId, profile)
      }
    } catch (error) {
      console.error("[AuthContext] 检查 daily_actions 失败:", error)
    }
  }

  const generateFirstMonth = async (userId: string, profile: UserProfile) => {
    try {
      console.log("[AuthContext] 🤖 调用 AI 生成第一个月...")

      const response = await fetch("/api/generate-calendar-progressive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profile,
          phase: "initial"
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log("[AuthContext] ✅ 第一个月数据生成成功，共", result.actionsCount, "个行动")
      } else {
        console.error("[AuthContext] ❌ 生成第一个月失败:", result.error)
      }
    } catch (error) {
      console.error("[AuthContext] ❌ 调用 API 失败:", error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      setLoading(true)
      await loadProfile(user.id)
    }
  }

  const updateProfile = async (newProfile: UserProfile) => {
    if (!user) {
      throw new Error("用户未登录")
    }

    try {
      // 只更新提供的字段，避免将 username/avatar 设为 null
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (newProfile.mbti !== undefined) updateData.mbti = newProfile.mbti
      if (newProfile.role !== undefined) updateData.role = newProfile.role
      if (newProfile.goal !== undefined) updateData.goal = newProfile.goal
      if (newProfile.username !== undefined) updateData.username = newProfile.username
      if (newProfile.avatar !== undefined) updateData.avatar = newProfile.avatar

      // UPDATE 需要 WHERE 条件来定位记录
      // RLS 确保只能更新自己的数据
      const { error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("user_id", user.id)

      if (error) {
        console.error("[AuthContext] 更新 profile 失败:", error)
        throw error
      }

      // 更新本地状态（合并而不是替换）
      setProfile(prev => ({ ...prev, ...newProfile }))
    } catch (error) {
      console.error("[AuthContext] 更新 profile 异常:", error)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
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
