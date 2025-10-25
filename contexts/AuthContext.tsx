"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/calendar-data"

type LoadingState = "idle" | "loading" | "success" | "error" | "timeout"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  loadingState: LoadingState
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  retryLoad: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 配置常量
const CONFIG = {
  PROFILE_LOAD_TIMEOUT: 8000, // profile 加载超时（8秒）
  AUTH_INIT_TIMEOUT: 15000, // 整体初始化超时（15秒）
  MAX_RETRIES: 2, // 最大重试次数
  RETRY_DELAY: 1000, // 重试延迟（1秒）
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // 使用 ref 追踪状态，避免闭包问题
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const initStartTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    mountedRef.current = true
    initStartTimeRef.current = Date.now()

    console.log("[AuthContext] ========== 开始初始化认证系统 ==========")
    console.log("[AuthContext] 配置:", CONFIG)

    // 启动认证初始化
    initAuth()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      console.log("[AuthContext] 🔔 认证状态变化:", event, "user:", session?.user?.id)

      setUser(session?.user ?? null)

      if (session?.user) {
        // 用户登录，加载 profile
        await loadProfileWithRetry(session.user.id)
      } else {
        // 用户登出
        setProfile(null)
        loadLocalProfile()
        setLoading(false)
        setLoadingState("success")
      }
    })

    return () => {
      console.log("[AuthContext] 组件卸载，清理资源")
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * 初始化认证
   */
  const initAuth = async () => {
    if (!mountedRef.current) return

    try {
      setLoadingState("loading")
      console.log("[AuthContext] [步骤 1/3] 获取当前登录用户...")

      // 设置整体超时保护
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("认证初始化超时")), CONFIG.AUTH_INIT_TIMEOUT)
      })

      const authPromise = supabase.auth.getUser()

      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any

      if (!mountedRef.current) return

      if (error) {
        throw error
      }

      console.log("[AuthContext] [步骤 2/3] ✅ 用户状态:", user ? `已登录 (${user.id})` : "未登录")
      setUser(user)

      if (user) {
        // 已登录，加载 profile
        console.log("[AuthContext] [步骤 3/3] 加载用户 profile...")
        await loadProfileWithRetry(user.id)
      } else {
        // 未登录，尝试从 localStorage 加载
        console.log("[AuthContext] [步骤 3/3] 未登录，尝试从 localStorage 恢复...")
        loadLocalProfile()
        finishLoading("success")
      }

      const elapsed = Date.now() - initStartTimeRef.current
      console.log(`[AuthContext] ========== ✅ 认证初始化完成 (耗时 ${elapsed}ms) ==========`)
    } catch (error) {
      if (!mountedRef.current) return

      console.error("[AuthContext] ❌ 认证初始化失败:", error)
      setError(error instanceof Error ? error.message : "认证初始化失败")

      // 尝试从 localStorage 恢复
      loadLocalProfile()
      finishLoading("error")
    }
  }

  /**
   * 带重试的 profile 加载
   */
  const loadProfileWithRetry = async (userId: string, retryCount = 0): Promise<void> => {
    if (!mountedRef.current) return

    try {
      console.log(`[AuthContext] 加载 profile (尝试 ${retryCount + 1}/${CONFIG.MAX_RETRIES + 1})`)

      await loadProfile(userId)

      // 加载成功
      retryCountRef.current = 0
    } catch (error) {
      if (!mountedRef.current) return

      console.error(`[AuthContext] Profile 加载失败 (尝试 ${retryCount + 1}):`, error)

      // 是否应该重试
      if (retryCount < CONFIG.MAX_RETRIES) {
        console.log(`[AuthContext] ⏳ ${CONFIG.RETRY_DELAY}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY))

        if (mountedRef.current) {
          await loadProfileWithRetry(userId, retryCount + 1)
        }
      } else {
        // 重试次数用尽
        console.error("[AuthContext] ❌ Profile 加载失败，已达最大重试次数")
        setError("加载用户信息失败，请刷新页面重试")

        // 尝试从 localStorage 恢复
        loadLocalProfile()
        finishLoading("error")
      }
    }
  }

  /**
   * 加载 profile（带超时保护）
   */
  const loadProfile = async (userId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (!mountedRef.current) {
        reject(new Error("组件已卸载"))
        return
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        reject(new Error(`Profile 加载超时 (>${CONFIG.PROFILE_LOAD_TIMEOUT}ms)`))
      }, CONFIG.PROFILE_LOAD_TIMEOUT)

      try {
        console.log("[AuthContext] 📡 查询数据库 profile...")
        const startTime = Date.now()

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        clearTimeout(timeoutId)

        const elapsed = Date.now() - startTime
        console.log(`[AuthContext] 📡 数据库响应 (耗时 ${elapsed}ms)`)

        if (!mountedRef.current) {
          reject(new Error("组件已卸载"))
          return
        }

        if (error) {
          if (error.code === "PGRST116") {
            // 用户没有 profile，这是正常情况（新用户）
            console.log("[AuthContext] ℹ️ 未找到 profile，用户需要完成 onboarding")
            setProfile(null)
            finishLoading("success")
            resolve()
            return
          } else {
            throw error
          }
        }

        if (!data) {
          console.log("[AuthContext] ⚠️ Profile 数据为空")
          setProfile(null)
          finishLoading("success")
          resolve()
          return
        }

        // 验证必需字段
        if (data.mbti && data.role) {
          const userProfile: UserProfile = {
            mbti: data.mbti,
            role: data.role,
            goal: data.goal || undefined,
            username: data.username || undefined,
            avatar: data.avatar || undefined,
          }

          console.log("[AuthContext] ✅ Profile 加载成功:", userProfile)
          setProfile(userProfile)

          // 同步到 localStorage（备份）
          localStorage.setItem("userProfile", JSON.stringify(userProfile))

          finishLoading("success")
          resolve()
        } else {
          // 数据不完整
          console.log("[AuthContext] ⚠️ Profile 数据不完整，缺少必需字段:", {
            mbti: data.mbti,
            role: data.role,
          })
          setProfile(null)
          finishLoading("success")
          resolve()
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error("[AuthContext] ❌ 加载 profile 失败:", error)
        reject(error)
      }
    })
  }

  /**
   * 从 localStorage 加载 profile（备份方案）
   */
  const loadLocalProfile = () => {
    try {
      const stored = localStorage.getItem("userProfile")
      if (stored) {
        const localProfile = JSON.parse(stored)
        console.log("[AuthContext] 📦 从 localStorage 恢复 profile:", localProfile)
        setProfile(localProfile)
      }
    } catch (error) {
      console.error("[AuthContext] ❌ localStorage 恢复失败:", error)
    }
  }

  /**
   * 完成加载
   */
  const finishLoading = (state: LoadingState) => {
    if (!mountedRef.current) return

    console.log("[AuthContext] 完成加载，状态:", state)
    setLoading(false)
    setLoadingState(state)
  }

  /**
   * 刷新 profile
   */
  const refreshProfile = async () => {
    if (user) {
      setLoading(true)
      setLoadingState("loading")
      retryCountRef.current = 0
      await loadProfileWithRetry(user.id)
    } else {
      loadLocalProfile()
    }
  }

  /**
   * 更新 profile
   */
  const updateProfile = async (newProfile: UserProfile) => {
    if (user) {
      // 已登录：更新 Supabase
      try {
        console.log("[AuthContext] updateProfile 开始, userId:", user.id)
        console.log("[AuthContext] 新 profile:", newProfile)

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

        if (error) {
          console.error("[AuthContext] ❌ 数据库更新失败:", error)
          throw error
        }

        console.log("[AuthContext] ✅ 数据库更新成功")

        // 立即更新本地状态
        setProfile(newProfile)
        localStorage.setItem("userProfile", JSON.stringify(newProfile))

        console.log("[AuthContext] ✅ 本地状态已更新")

        // 等待状态传播
        await new Promise(resolve => setTimeout(resolve, 150))

        console.log("[AuthContext] ✅ updateProfile 完成")
      } catch (error) {
        console.error("[AuthContext] ❌ updateProfile 失败:", error)
        throw error
      }
    } else {
      // 未登录：只更新 localStorage
      console.log("[AuthContext] 未登录，仅更新 localStorage")
      setProfile(newProfile)
      localStorage.setItem("userProfile", JSON.stringify(newProfile))
    }
  }

  /**
   * 登出
   */
  const signOut = async () => {
    console.log("[AuthContext] 用户登出")
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setError(null)
    localStorage.removeItem("userProfile")
  }

  /**
   * 手动重试加载
   */
  const retryLoad = () => {
    console.log("[AuthContext] 🔄 手动重试加载...")
    setError(null)
    retryCountRef.current = 0
    initStartTimeRef.current = Date.now()
    initAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loadingState,
        error,
        signOut,
        refreshProfile,
        updateProfile,
        retryLoad,
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
