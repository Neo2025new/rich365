/**
 * 调试 API：查看数据库中的日期数据
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 })
    }

    const supabase = await createClient()

    // 查询前10条数据
    const { data: firstTen, error: firstError } = await supabase
      .from("daily_actions")
      .select("date, title, theme")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(10)

    // 查询后10条数据
    const { data: lastTen, error: lastError } = await supabase
      .from("daily_actions")
      .select("date, title, theme")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10)

    // 查询总数
    const { count } = await supabase
      .from("daily_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // 查询日期范围
    const { data: dateRange } = await supabase
      .from("daily_actions")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    const minDate = dateRange?.[0]?.date
    const maxDate = dateRange?.[dateRange.length - 1]?.date

    // 计算今天
    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      userId,
      today,
      totalCount: count,
      dateRange: {
        min: minDate,
        max: maxDate,
      },
      firstTen: firstTen || [],
      lastTen: lastTen?.reverse() || [],
      analysis: {
        startsFromToday: minDate === today,
        startsFromJan1: minDate?.endsWith('-01-01'),
        expectedStartDate: today,
        actualStartDate: minDate,
        dateDifference: minDate ? Math.floor((new Date(today).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
      }
    })
  } catch (error) {
    console.error("[Debug Dates] 错误:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 }
    )
  }
}
