/**
 * Supabase 排行榜服务
 * 处理用户排行榜数据
 */

import { createClient } from "@/lib/supabase/client"

export interface LeaderboardEntry {
  id: string
  username: string
  avatar: string
  currentStreak: number
  totalCheckIns: number
  totalCoins: number
  isCurrentUser?: boolean
}

/**
 * 获取连续打卡排行榜
 */
export async function getStreakLeaderboard(currentUserId?: string, limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, username, avatar, current_streak, total_check_ins, total_coins")
      .order("current_streak", { ascending: false })
      .order("total_check_ins", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[Leaderboard] 获取连续打卡排行榜失败:", error)
      return []
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      username: entry.username || "未命名用户",
      avatar: entry.avatar || "⭐",
      currentStreak: entry.current_streak || 0,
      totalCheckIns: entry.total_check_ins || 0,
      totalCoins: entry.total_coins || 0,
      isCurrentUser: currentUserId ? entry.id === currentUserId : false,
    }))
  } catch (error) {
    console.error("[Leaderboard] 获取连续打卡排行榜异常:", error)
    return []
  }
}

/**
 * 获取累计打卡排行榜
 */
export async function getTotalCheckInsLeaderboard(currentUserId?: string, limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, username, avatar, current_streak, total_check_ins, total_coins")
      .order("total_check_ins", { ascending: false })
      .order("current_streak", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[Leaderboard] 获取累计打卡排行榜失败:", error)
      return []
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      username: entry.username || "未命名用户",
      avatar: entry.avatar || "⭐",
      currentStreak: entry.current_streak || 0,
      totalCheckIns: entry.total_check_ins || 0,
      totalCoins: entry.total_coins || 0,
      isCurrentUser: currentUserId ? entry.id === currentUserId : false,
    }))
  } catch (error) {
    console.error("[Leaderboard] 获取累计打卡排行榜异常:", error)
    return []
  }
}

/**
 * 获取用户排名
 */
export async function getUserRank(
  userId: string,
  type: "streak" | "total"
): Promise<{
  rank: number
  total: number
}> {
  const supabase = createClient()

  try {
    const orderColumn = type === "streak" ? "current_streak" : "total_check_ins"

    // 获取用户统计
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select(`${orderColumn}`)
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return { rank: 0, total: 0 }
    }

    const userValue = userData[orderColumn] || 0

    // 计算排名（比用户强的人数 + 1）
    const { count, error: countError } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .gt(orderColumn, userValue)

    if (countError) {
      return { rank: 0, total: 0 }
    }

    const rank = (count || 0) + 1

    // 获取总用户数
    const { count: totalCount } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })

    return {
      rank,
      total: totalCount || 0,
    }
  } catch (error) {
    console.error("[Leaderboard] 获取用户排名异常:", error)
    return { rank: 0, total: 0 }
  }
}

/**
 * 更新用户显示信息（用户名和头像）
 */
export async function updateUserDisplayInfo(
  userId: string,
  username: string,
  avatar: string
): Promise<{ success: boolean }> {
  const supabase = createClient()

  try {
    // UPDATE 需要 WHERE 条件来定位记录
    const { error } = await supabase.from("user_profiles").update({ username, avatar }).eq("user_id", userId)

    if (error) {
      console.error("[Leaderboard] 更新用户显示信息失败:", error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error("[Leaderboard] 更新用户显示信息异常:", error)
    return { success: false }
  }
}
