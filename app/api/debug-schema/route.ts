/**
 * Schema 诊断 API
 * 检查 Supabase schema 是否正确识别了新列
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "缺少 Supabase 配置" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("[Schema Debug] 开始诊断...")

    // 测试 1: 尝试查询 profiles 表（检查基本连接）
    const { data: testData, error: testError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1)

    console.log("[Schema Debug] 基本查询测试:", { testData, testError })

    // 测试 2: 尝试查询包含新列的数据
    const { data: fullData, error: fullError } = await supabase
      .from("user_profiles")
      .select("id, mbti, role, username, avatar")
      .limit(1)

    console.log("[Schema Debug] 完整查询测试:", { fullData, fullError })

    const diagnosis = {
      timestamp: new Date().toISOString(),
      supabaseUrl,
      tests: {
        basicQuery: {
          success: !testError,
          error: testError?.message,
          code: testError?.code,
        },
        fullQuery: {
          success: !fullError,
          error: fullError?.message,
          code: fullError?.code,
          hasUsernameColumn: fullData?.[0]?.hasOwnProperty("username") ?? false,
          hasAvatarColumn: fullData?.[0]?.hasOwnProperty("avatar") ?? false,
        },
      },
      recommendation: "",
    }

    // 生成建议
    if (fullError) {
      if (fullError.code === "PGRST204" || fullError.message?.includes("column")) {
        diagnosis.recommendation =
          "Schema cache 未刷新，请在 Supabase Dashboard 执行: NOTIFY pgrst, 'reload schema';"
      } else if (fullError.code === "42703") {
        diagnosis.recommendation = "列不存在，请检查数据库迁移是否执行成功"
      } else {
        diagnosis.recommendation = `未知错误: ${fullError.message}`
      }
    } else {
      diagnosis.recommendation = "✅ Schema 正常，所有列都可访问"
    }

    return NextResponse.json({
      success: true,
      diagnosis,
      instructions: {
        step1: "如果看到 schema cache 问题，在 Supabase SQL Editor 执行:",
        sql: "NOTIFY pgrst, 'reload schema';",
        step2: "等待 30 秒后刷新页面重试",
        dashboard: "https://supabase.com/dashboard/project/rskfpbdwujtsrmvnzxyo/sql/new",
      },
    })
  } catch (error) {
    console.error("[Schema Debug] 错误:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}
