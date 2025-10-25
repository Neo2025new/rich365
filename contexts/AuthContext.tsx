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
    // 获取当前登录用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadProfile(user.id)
      } else {
        // 未登录时，尝试从 localStorage 加载（向后兼容）
        loadLocalProfile()
        setLoading(false)
      }
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        loadLocalProfile()
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // 用户没有 profile，可能刚注册
          console.log("No profile found for user, user needs to complete onboarding")
        } else {
          throw error
        }
      }

      if (data) {
        const userProfile: UserProfile = {
          mbti: data.mbti,
          role: data.role,
          goal: data.goal || undefined,
          username: data.username || undefined,
          avatar: data.avatar || undefined,
        }
        setProfile(userProfile)

        // 同步到 localStorage
        localStorage.setItem("userProfile", JSON.stringify(userProfile))
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
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
