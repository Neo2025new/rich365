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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // 新用户，profile 还未创建（触发器会自动创建）
          console.log("[AuthContext] 新用户，等待 profile 创建")
          setProfile(null)
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
      }
    } catch (error) {
      console.error("[AuthContext] 加载 profile 异常:", error)
      setProfile(null)
    } finally {
      setLoading(false)
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

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)

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
