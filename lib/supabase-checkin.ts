/**
 * Supabase 打卡服务
 * 处理用户打卡记录、统计数据和徽章
 */

import { createClient } from "@/lib/supabase/client"
import type { Badge } from "@/lib/checkin-data"
import { BADGES } from "@/lib/checkin-data"

export interface CheckInRecord {
  id: string
  user_id: string
  date: string
  action_id?: string
  note?: string
  created_at: string
}

export interface UserStats {
  totalCheckIns: number
  currentStreak: number
  longestStreak: number
  totalCoins: number
  badges: string[]
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("total_check_ins, current_streak, longest_streak, total_coins, badges")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("[Checkin] 获取用户统计失败:", error)
      return getDefaultStats()
    }

    return {
      totalCheckIns: data.total_check_ins || 0,
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      totalCoins: data.total_coins || 0,
      badges: data.badges || [],
    }
  } catch (error) {
    console.error("[Checkin] 获取用户统计异常:", error)
    return getDefaultStats()
  }
}

function getDefaultStats(): UserStats {
  return {
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalCoins: 0,
    badges: [],
  }
}

/**
 * 检查今天是否已打卡
 */
export async function hasCheckedInToday(userId: string, date: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("check_ins")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .limit(1)

    if (error) {
      console.error("[Checkin] 检查打卡状态失败:", error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error("[Checkin] 检查打卡状态异常:", error)
    return false
  }
}

/**
 * 打卡
 */
export async function checkIn(
  userId: string,
  date: string,
  actionId?: string,
  note?: string
): Promise<{ success: boolean; stats?: UserStats; newBadges?: Badge[]; message?: string }> {
  const supabase = createClient()

  try {
    // 检查是否已打卡
    const alreadyCheckedIn = await hasCheckedInToday(userId, date)
    if (alreadyCheckedIn) {
      return { success: false, message: "今天已经打过卡了" }
    }

    // 验证日期：不能为未来日期
    const checkInDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkInDate.setHours(0, 0, 0, 0)

    if (checkInDate > today) {
      return { success: false, message: "不能为未来日期打卡" }
    }

    // 创建打卡记录
    const { error: insertError } = await supabase.from("check_ins").insert({
      user_id: userId,
      date,
      action_id: actionId,
      note,
    })

    if (insertError) {
      console.error("[Checkin] 打卡失败:", insertError)
      return { success: false, message: "打卡失败，请重试" }
    }

    // 获取更新后的统计数据
    const stats = await getUserStats(userId)

    // 检查新获得的徽章
    const newBadges = await checkNewBadges(userId, stats)

    return {
      success: true,
      stats,
      newBadges,
    }
  } catch (error) {
    console.error("[Checkin] 打卡异常:", error)
    return { success: false, message: "打卡失败，请重试" }
  }
}

/**
 * 检查新获得的徽章
 */
async function checkNewBadges(userId: string, stats: UserStats): Promise<Badge[]> {
  const supabase = createClient()
  const newBadges: Badge[] = []

  for (const badge of BADGES) {
    if (stats.badges.includes(badge.id)) continue

    const requirement = badge.requirement
    const achieved =
      badge.type === "streak" ? stats.currentStreak >= requirement : stats.totalCheckIns >= requirement

    if (achieved) {
      // 添加徽章到用户数据
      const { error } = await supabase
        .from("user_profiles")
        .update({ badges: [...stats.badges, badge.id] })
        .eq("id", userId)

      if (!error) {
        newBadges.push(badge)
      }
    }
  }

  return newBadges
}

/**
 * 获取用户打卡记录
 */
export async function getUserCheckIns(userId: string, limit?: number): Promise<CheckInRecord[]> {
  const supabase = createClient()

  try {
    let query = supabase.from("check_ins").select("*").eq("user_id", userId).order("date", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Checkin] 获取打卡记录失败:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Checkin] 获取打卡记录异常:", error)
    return []
  }
}

/**
 * 获取已获得的徽章
 */
export async function getEarnedBadges(userId: string): Promise<Badge[]> {
  const stats = await getUserStats(userId)
  return BADGES.filter((badge) => stats.badges.includes(badge.id))
}

/**
 * 获取下一个徽章
 */
export async function getNextBadge(userId: string): Promise<Badge | null> {
  const stats = await getUserStats(userId)
  const unearned = BADGES.filter((badge) => !stats.badges.includes(badge.id))

  if (unearned.length === 0) return null

  // 分类徽章
  const streakBadges = unearned.filter((b) => b.type === "streak")
  const totalBadges = unearned.filter((b) => b.type === "total")

  let nextStreakBadge: Badge | null = null
  let nextTotalBadge: Badge | null = null

  if (streakBadges.length > 0) {
    nextStreakBadge = streakBadges.reduce((closest, badge) => {
      const badgeDiff = badge.requirement - stats.currentStreak
      const closestDiff = closest.requirement - stats.currentStreak
      return badgeDiff >= 0 && badgeDiff < closestDiff ? badge : closest
    })
  }

  if (totalBadges.length > 0) {
    nextTotalBadge = totalBadges.reduce((closest, badge) => {
      const badgeDiff = badge.requirement - stats.totalCheckIns
      const closestDiff = closest.requirement - stats.totalCheckIns
      return badgeDiff >= 0 && badgeDiff < closestDiff ? badge : closest
    })
  }

  // 返回进度更高的徽章
  if (!nextStreakBadge) return nextTotalBadge
  if (!nextTotalBadge) return nextStreakBadge

  const streakProgress = stats.currentStreak / nextStreakBadge.requirement
  const totalProgress = stats.totalCheckIns / nextTotalBadge.requirement

  return streakProgress > totalProgress ? nextStreakBadge : nextTotalBadge
}
