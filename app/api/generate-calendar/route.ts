import { NextRequest, NextResponse } from "next/server"
import { generateFullYearCalendar } from "@/lib/gemini-calendar"
import { UserProfile } from "@/lib/calendar-data"

export const maxDuration = 60 // 最大执行时间 60 秒

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profile } = body as { userId: string; profile: UserProfile }

    // 验证参数
    if (!userId || !profile) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    if (!profile.mbti || !profile.role) {
      return NextResponse.json({ error: "用户配置不完整" }, { status: 400 })
    }

    console.log(`[API] 开始为用户 ${userId} 生成日历...`)

    // 调用日历生成函数
    const result = await generateFullYearCalendar(userId, profile)

    if (result.success) {
      console.log(`[API] ✅ 日历生成成功`)
      return NextResponse.json(result)
    } else {
      console.error(`[API] ❌ 日历生成失败:`, result.message)
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error("[API] 日历生成异常:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "生成失败，请稍后重试",
      },
      { status: 500 }
    )
  }
}
