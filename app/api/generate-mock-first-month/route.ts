/**
 * 生成第一个月的模拟数据
 * 用于演示和快速初始化
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateMockFirstMonth } from "@/lib/mock-first-month"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "缺少 userId" }, { status: 400 })
    }

    console.log(`[Mock First Month] 开始为用户 ${userId} 生成模拟数据`)

    const supabase = await createClient()

    // 生成模拟数据
    const mockActions = generateMockFirstMonth(userId)

    console.log(`[Mock First Month] 生成了 ${mockActions.length} 条模拟数据`)

    // 插入数据库
    const { error } = await supabase
      .from("daily_actions")
      .insert(mockActions)

    if (error) {
      console.error("[Mock First Month] 插入数据失败:", error)
      return NextResponse.json({ success: false, error: `插入失败: ${error.message}` }, { status: 500 })
    }

    console.log("[Mock First Month] ✅ 模拟数据插入成功")

    return NextResponse.json({
      success: true,
      count: mockActions.length,
      message: "模拟数据生成成功"
    })
  } catch (error) {
    console.error("[Mock First Month] 错误:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成失败"
      },
      { status: 500 }
    )
  }
}
