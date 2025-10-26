/**
 * 导出月度日历为 .ics 文件
 * 支持导入到 iPhone/Android 日历、Google Calendar、Outlook 等
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = Number.parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    if (!userId) {
      return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 })
    }

    console.log(`[Export Calendar] 导出日历 - User: ${userId}, ${year}/${month}`)

    const supabase = await createClient()

    // 获取当月的所有行动
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
    const endDate = `${year}-${month.toString().padStart(2, "0")}-31`

    const { data: actions, error } = await supabase
      .from("daily_actions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })

    if (error) {
      console.error("[Export Calendar] 数据库查询失败:", error)
      return NextResponse.json({ error: "查询失败" }, { status: 500 })
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({ error: "该月暂无行动数据" }, { status: 404 })
    }

    console.log(`[Export Calendar] 找到 ${actions.length} 个行动`)

    // 生成 .ics 文件内容
    const icsContent = generateICSFile(actions, year, month)

    // 返回文件
    const monthName = new Date(year, month - 1).toLocaleDateString("zh-CN", { month: "long" })
    const fileName = `搞钱行动日历-${year}年${monthName}.ics`

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error("[Export Calendar] 错误:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "导出失败" },
      { status: 500 }
    )
  }
}

/**
 * 生成符合 RFC 5545 标准的 iCalendar 文件
 */
function generateICSFile(
  actions: Array<{
    date: string
    title: string
    description: string
    emoji: string
    theme: string
    category: string
  }>,
  year: number,
  month: number
): string {
  const now = new Date()
  const timestamp = formatDateTimeUTC(now)
  const monthName = new Date(year, month - 1).toLocaleDateString("zh-CN", { month: "long" })

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rich365//搞钱行动日历//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:搞钱行动日历 - ${year}年${monthName}`,
    "X-WR-TIMEZONE:Asia/Shanghai",
    "X-WR-CALDESC:每天一个搞钱微行动，财富增长一大步",
  ].join("\r\n")

  // 为每个行动创建一个全天事件
  for (const action of actions) {
    const dateStr = action.date.replace(/-/g, "") // 20250101
    const uid = `action-${action.date}@rich365.ai`

    // 转义特殊字符
    const summary = escapeICSText(`${action.emoji} ${action.title}`)
    const description = escapeICSText(
      `📅 ${action.theme}\n🏷️ ${getCategoryName(action.category)}\n\n${action.description}\n\n💡 来自搞钱行动日历 - www.rich365.ai`
    )

    ics += "\r\n"
    ics += [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `CATEGORIES:${action.category},${action.theme}`,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "SEQUENCE:0",
    ].join("\r\n")
    ics += "\r\nEND:VEVENT"
  }

  ics += "\r\nEND:VCALENDAR"

  return ics
}

/**
 * 格式化为 UTC 时间戳 (yyyyMMddTHHmmssZ)
 */
function formatDateTimeUTC(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")

  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  )
}

/**
 * 转义 ICS 文本中的特殊字符
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // 反斜杠
    .replace(/;/g, "\\;") // 分号
    .replace(/,/g, "\\,") // 逗号
    .replace(/\n/g, "\\n") // 换行符
}

/**
 * 获取类别中文名称
 */
function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    learning: "学习",
    networking: "社交",
    content: "内容",
    optimization: "优化",
    sales: "销售",
    investment: "投资",
    branding: "品牌",
    skill: "技能",
    mindset: "思维",
    execution: "执行",
  }
  return categoryMap[category] || category
}
