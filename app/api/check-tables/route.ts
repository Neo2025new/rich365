/**
 * 检查 Supabase 表是否存在
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // 检查 monthly_themes 表
    const { data: monthlyThemes, error: monthlyError } = await supabase
      .from("monthly_themes")
      .select("count")
      .limit(1)

    // 检查 daily_actions 表
    const { data: dailyActions, error: dailyError } = await supabase
      .from("daily_actions")
      .select("count")
      .limit(1)

    return NextResponse.json({
      tables: {
        monthly_themes: {
          exists: !monthlyError,
          error: monthlyError?.message,
          code: monthlyError?.code,
        },
        daily_actions: {
          exists: !dailyError,
          error: dailyError?.message,
          code: dailyError?.code,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "检查失败",
      },
      { status: 500 }
    )
  }
}
