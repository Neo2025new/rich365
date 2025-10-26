/**
 * 混合日历数据服务
 * 优先从数据库读取 AI 生成的数据，fallback 到模板数据
 */

import { getUserCalendarActions, getDailyAction as getAIDailyAction } from "@/lib/gemini-calendar"
import {
  getDailyAction as getTemplateDailyAction,
  getPersonalizedMonthTheme,
  type UserProfile,
  type DailyAction,
  type MonthTheme,
} from "@/lib/calendar-data"

/**
 * 获取月度主题（优先数据库，fallback 到模板）
 */
export async function getMonthTheme(
  userId: string | null,
  month: number,
  profile: UserProfile
): Promise<MonthTheme> {
  // 如果没有登录，使用模板
  if (!userId) {
    return getPersonalizedMonthTheme(month, profile)
  }

  try {
    // 尝试从数据库获取该月的第一个行动，从中提取主题
    const year = new Date().getFullYear()
    const actions = await getUserCalendarActions(userId, year, month)

    if (actions.length > 0) {
      // 使用数据库中的主题
      return {
        month,
        name: `${month}月`,
        theme: actions[0].theme || getPersonalizedMonthTheme(month, profile).theme,
        description: getPersonalizedMonthTheme(month, profile).description,
        emoji: actions[0].emoji || getPersonalizedMonthTheme(month, profile).emoji,
      }
    }

    // Fallback 到模板
    return getPersonalizedMonthTheme(month, profile)
  } catch (error) {
    console.error("[Calendar Hybrid] 获取月度主题失败:", error)
    return getPersonalizedMonthTheme(month, profile)
  }
}

/**
 * 获取月度行动列表（优先数据库，fallback 到模板）
 */
export async function getMonthActions(
  userId: string | null,
  year: number,
  month: number,
  profile: UserProfile
): Promise<DailyAction[]> {
  // 如果没有登录，使用模板
  if (!userId) {
    const { getPersonalizedDailyActions } = await import("@/lib/calendar-data")
    return getPersonalizedDailyActions(year, month, profile)
  }

  try {
    // 尝试从数据库获取
    const actions = await getUserCalendarActions(userId, year, month)

    if (actions.length > 0) {
      // 转换数据库格式到 DailyAction 格式
      return actions.map((action) => ({
        id: action.id ? parseInt(action.id.substring(0, 8), 16) : 0,
        date: action.date,
        title: action.title,
        description: action.description,
        emoji: action.emoji || "📝",
        theme: action.theme,
      }))
    }

    // Fallback 到模板
    const { getPersonalizedDailyActions } = await import("@/lib/calendar-data")
    return getPersonalizedDailyActions(year, month, profile)
  } catch (error) {
    console.error("[Calendar Hybrid] 获取月度行动失败:", error)
    // Fallback 到模板
    const { getPersonalizedDailyActions } = await import("@/lib/calendar-data")
    return getPersonalizedDailyActions(year, month, profile)
  }
}

/**
 * 获取单日行动（优先数据库，fallback 到模板）
 */
export async function getDailyAction(
  userId: string | null,
  date: string,
  profile: UserProfile
): Promise<DailyAction | null> {
  // 如果没有登录，使用模板
  if (!userId) {
    return getTemplateDailyAction(date, profile) || null
  }

  try {
    // 尝试从数据库获取
    const action = await getAIDailyAction(userId, date)

    if (action) {
      // 转换数据库格式到 DailyAction 格式
      return {
        id: action.id ? parseInt(action.id.substring(0, 8), 16) : 0,
        date: action.date,
        title: action.title,
        description: action.description,
        emoji: action.emoji || "📝",
        theme: action.theme,
      }
    }

    // Fallback 到模板
    return getTemplateDailyAction(date, profile) || null
  } catch (error) {
    console.error("[Calendar Hybrid] 获取单日行动失败:", error)
    // Fallback 到模板
    return getTemplateDailyAction(date, profile) || null
  }
}

/**
 * 检查用户是否有 AI 生成的日历
 */
export async function hasAICalendar(userId: string): Promise<boolean> {
  try {
    const actions = await getUserCalendarActions(userId)
    return actions.length > 0
  } catch (error) {
    console.error("[Calendar Hybrid] 检查 AI 日历失败:", error)
    return false
  }
}
