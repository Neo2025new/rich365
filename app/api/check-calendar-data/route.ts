import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * 检查用户是否已有日历数据
 * 用于 onboarding 流程确认 AI 生成完成
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ hasData: false, count: 0 })
  }

  try {
    const supabase = await createClient()

    const { data, error, count } = await supabase
      .from("daily_actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)

    if (error) {
      console.error("[Check Calendar Data] Error:", error)
      return NextResponse.json({
        hasData: false,
        count: 0,
        error: error.message,
      })
    }

    console.log(`[Check Calendar Data] User ${userId.substring(0, 8)}... has ${count || 0} actions`)

    return NextResponse.json({
      hasData: (count || 0) > 0,
      count: count || 0,
    })
  } catch (error) {
    console.error("[Check Calendar Data] Exception:", error)
    return NextResponse.json({
      hasData: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
