/**
 * 快速诊断登录问题
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    console.log("[Test Login] 开始测试...")

    // 测试 1: 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        success: false,
        step: "auth",
        error: authError.message,
        code: authError.code,
      })
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        step: "auth",
        message: "未登录",
        user: null,
      })
    }

    console.log("[Test Login] 用户已登录:", user.id)

    // 测试 2: 查询 profiles 表
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        success: false,
        step: "profile",
        error: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        details: profileError.details,
      })
    }

    return NextResponse.json({
      success: true,
      step: "complete",
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      diagnosis: {
        hasUsername: !!profile?.username,
        hasAvatar: !!profile?.avatar,
        hasMBTI: !!profile?.mbti,
        hasRole: !!profile?.role,
      },
    })
  } catch (error) {
    console.error("[Test Login] 错误:", error)

    return NextResponse.json({
      success: false,
      step: "unknown",
      error: error instanceof Error ? error.message : "未知错误",
    })
  }
}
