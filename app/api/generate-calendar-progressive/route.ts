/**
 * 渐进式 AI 日历生成 API
 * 先生成年度规划和第一个月，避免超时
 */

import { NextResponse } from "next/server"
import { genAI } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { UserProfile, mbtiData, roleData } from "@/lib/calendar-data"

export async function POST(request: Request) {
  try {
    const { userId, profile, phase } = await request.json()

    if (!userId || !profile) {
      return NextResponse.json({ success: false, error: "缺少必需参数" }, { status: 400 })
    }

    console.log(`[Progressive Calendar] 开始生成 - Phase: ${phase}, User: ${userId}`)

    const supabase = await createClient()

    // Phase 1: 生成年度规划 + 第一个月 (快速)
    if (phase === "initial" || !phase) {
      const year = new Date().getFullYear()
      const mbtiInfo = mbtiData[profile.mbti]
      const roleInfo = roleData[profile.role]

      const prompt = `你是一个专业的财富增长顾问和行动规划师。

用户信息：
- MBTI 人格类型：${profile.mbti} (${mbtiInfo.name})
- 人格特质：${mbtiInfo.trait}
- 职业身份：${profile.role}
- 职业描述：${roleInfo.description}
${profile.goal ? `- 个人目标：${profile.goal}` : ""}

任务：为用户生成 ${year} 年 1月份（31天）的每日"搞钱微行动"。

主题：搞钱觉醒月 - 唤醒财富意识，建立基础认知

要求：
1. 每个行动必须具体、可执行（30分钟内可完成）
2. 行动要符合用户的 MBTI 特质和职业特点
3. ${profile.goal ? "行动要与用户的个人目标强相关" : "行动要帮助用户提升财富能力"}
4. 从简单到复杂，循序渐进
5. 每个行动包含：标题（10字以内）、描述（30-50字）、emoji、类别

类别选项：learning（学习）、networking（社交）、content（内容）、optimization（优化）、sales（销售）、investment（投资）、branding（品牌）、skill（技能）、mindset（思维）、execution（执行）

输出格式（纯 JSON 数组，不要任何其他文字）：
[
  {
    "date": "${year}-01-01",
    "title": "阅读一本理财书籍",
    "description": "从经典理财书籍开始，建立基础的财富认知，了解复利的力量。",
    "emoji": "📚",
    "theme": "搞钱觉醒月",
    "category": "learning"
  },
  ...共 31 个（1月1日到1月31日）
]

重要：
- 必须生成完整的 31 个行动（${year}-01-01 到 ${year}-01-31）
- 只返回 JSON 数组，不要任何解释、注释或代码块标记
- 确保 JSON 格式正确，可以直接解析`

      console.log("[Progressive Calendar] 调用 Gemini AI 生成第一个月...")
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      console.log("[Progressive Calendar] AI 响应长度:", text.length)

      // 解析 JSON
      const actions = parseAIResponse(text)
      console.log("[Progressive Calendar] 解析到", actions.length, "个行动")

      if (actions.length === 0) {
        throw new Error("AI 未生成任何行动")
      }

      // 保存到数据库
      console.log("[Progressive Calendar] 保存到数据库...")
      const { error } = await supabase.from("daily_actions").insert(
        actions.map((action) => ({
          user_id: userId,
          date: action.date,
          title: action.title,
          description: action.description,
          emoji: action.emoji,
          theme: action.theme,
          category: action.category,
        }))
      )

      if (error) {
        console.error("[Progressive Calendar] 保存失败:", error)
        throw new Error(`保存失败: ${error.message}`)
      }

      console.log("[Progressive Calendar] ✅ 第一个月生成成功")

      return NextResponse.json({
        success: true,
        phase: "initial",
        message: "第一个月生成成功",
        actionsCount: actions.length,
        nextPhase: "remaining", // 可以后续生成剩余月份
      })
    }

    // Phase 2: 生成剩余月份（可选，后台异步）
    if (phase === "remaining") {
      // TODO: 实现剩余11个月的生成
      // 可以在后台队列中处理，或者让用户按需生成
      return NextResponse.json({
        success: true,
        phase: "remaining",
        message: "剩余月份将在后台生成",
      })
    }

    return NextResponse.json({ success: false, error: "未知的 phase" }, { status: 400 })
  } catch (error) {
    console.error("[Progressive Calendar] 错误:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      },
      { status: 500 }
    )
  }
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(text: string): Array<{
  date: string
  title: string
  description: string
  emoji: string
  theme: string
  category: string
}> {
  try {
    let cleanedText = text.trim()

    // 移除 markdown 代码块标记
    cleanedText = cleanedText.replace(/```json\n?/gi, "")
    cleanedText = cleanedText.replace(/```javascript\n?/gi, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")

    // 移除注释
    cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\//g, "")
    cleanedText = cleanedText.replace(/\/\/.*/g, "")

    // 提取 JSON 数组
    const startIndex = cleanedText.indexOf("[")
    const endIndex = cleanedText.lastIndexOf("]")

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("响应中未找到 JSON 数组")
    }

    cleanedText = cleanedText.substring(startIndex, endIndex + 1).trim()

    const actions = JSON.parse(cleanedText)

    if (!Array.isArray(actions)) {
      throw new Error("响应不是数组格式")
    }

    // 验证并过滤
    const validActions = actions.filter(
      (action) =>
        action.date &&
        action.title &&
        action.description &&
        action.emoji &&
        action.theme &&
        action.category
    )

    return validActions
  } catch (error) {
    console.error("[Progressive Calendar] JSON 解析错误:", error)
    console.error("[Progressive Calendar] 原始响应:", text.substring(0, 500))
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : "未知错误"}`)
  }
}
