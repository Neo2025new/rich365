import { NextRequest, NextResponse } from "next/server"
import { generateGoalBasedActions } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { goal, mbti, role } = body

    // 验证参数
    if (!goal || !mbti || !role) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 调用 Gemini API
    const actions = await generateGoalBasedActions(goal, mbti, role)

    return NextResponse.json({ actions })
  } catch (error) {
    console.error("生成行动失败:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "生成失败" }, { status: 500 })
  }
}
