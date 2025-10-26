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
 * 获取相对月份的主题和日期范围
 */
export async function getRelativeMonthTheme(
  userId: string | null,
  relativeMonth: number,
  profile: UserProfile
): Promise<MonthTheme & { dateRange: { start: string; end: string } }> {
  const { startDate, endDate } = getRelativeMonthDateRange(relativeMonth)

  // 如果没有登录，使用模板
  if (!userId) {
    return {
      month: relativeMonth,
      name: `第${relativeMonth}个月`,
      theme: "搞钱觉醒月",
      description: "从今天开始，每天一个小行动，积累财富大能量",
      emoji: "💰",
      dateRange: { start: startDate, end: endDate },
    }
  }

  try {
    // 获取该日期范围的行动
    const actions = await getUserCalendarActionsByDateRange(userId, startDate, endDate)

    if (actions.length > 0) {
      // 使用数据库中的主题
      return {
        month: relativeMonth,
        name: `第${relativeMonth}个月`,
        theme: actions[0].theme || "搞钱觉醒月",
        description: formatDateRangeDescription(startDate, endDate),
        emoji: actions[0].emoji || "💰",
        dateRange: { start: startDate, end: endDate },
      }
    }

    // 没有数据
    return {
      month: relativeMonth,
      name: `第${relativeMonth}个月`,
      theme: "暂无数据",
      description: formatDateRangeDescription(startDate, endDate),
      emoji: "📅",
      dateRange: { start: startDate, end: endDate },
    }
  } catch (error) {
    console.error("[Calendar Hybrid] 获取相对月份主题失败:", error)
    return {
      month: relativeMonth,
      name: `第${relativeMonth}个月`,
      theme: "加载失败",
      description: formatDateRangeDescription(startDate, endDate),
      emoji: "❌",
      dateRange: { start: startDate, end: endDate },
    }
  }
}

/**
 * 格式化日期范围描述
 */
function formatDateRangeDescription(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const endMonth = end.getMonth() + 1
  const endDay = end.getDate()

  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}日 - ${endDay}日`
  } else {
    return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`
  }
}

/**
 * 获取月度主题（优先数据库，fallback 到模板）
 * @deprecated 使用 getRelativeMonthTheme 代替
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
 * 计算相对月份的日期范围
 * @param relativeMonth 1 = 第一个月（今天开始的30天），2 = 第二个月（第31-60天）
 */
function getRelativeMonthDateRange(relativeMonth: number): { startDate: string; endDate: string } {
  const today = new Date()
  const startOffset = (relativeMonth - 1) * 30
  const endOffset = startOffset + 29

  const start = new Date(today)
  start.setDate(today.getDate() + startOffset)

  const end = new Date(today)
  end.setDate(today.getDate() + endOffset)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

/**
 * 获取相对月份的行动列表（从今天开始计算）
 * @param relativeMonth 1 = 第一个月，2 = 第二个月
 */
export async function getRelativeMonthActions(
  userId: string | null,
  relativeMonth: number,
  profile: UserProfile
): Promise<DailyAction[]> {
  const { startDate, endDate } = getRelativeMonthDateRange(relativeMonth)

  // 如果没有登录，使用模板
  if (!userId) {
    const { getPersonalizedDailyActions } = await import("@/lib/calendar-data")
    // 为模板数据生成当前年月（fallback）
    const now = new Date()
    return getPersonalizedDailyActions(now.getFullYear(), now.getMonth() + 1, profile)
  }

  try {
    // 按日期范围查询
    const actions = await getUserCalendarActionsByDateRange(userId, startDate, endDate)

    if (actions.length > 0) {
      return actions.map((action) => ({
        id: action.id ? parseInt(action.id.substring(0, 8), 16) : 0,
        date: action.date,
        title: action.title,
        description: action.description,
        emoji: action.emoji || "📝",
        theme: action.theme,
      }))
    }

    // 如果没有数据，返回空数组
    return []
  } catch (error) {
    console.error("[Calendar Hybrid] 获取相对月份行动失败:", error)
    return []
  }
}

/**
 * 按日期范围获取行动
 */
async function getUserCalendarActionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { getUserCalendarActions } = await import("@/lib/gemini-calendar")

  // 创建临时的查询函数
  const supabase = await import("@/lib/supabase/client").then(m => m.createClient())

  const { data, error } = await supabase
    .from("daily_actions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })

  if (error) {
    console.error("[Calendar Hybrid] 查询失败:", error)
    throw new Error(`查询失败: ${error.message}`)
  }

  return data || []
}

/**
 * 获取月度行动列表（优先数据库，fallback 到模板）
 * @deprecated 使用 getRelativeMonthActions 代替
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
