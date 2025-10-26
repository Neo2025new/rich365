/**
 * 生成指定月份的详细行动计划（30天）
 * 用于解锁月份 2-12
 */

import { NextResponse } from "next/server"
import { genAI } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { mbtiData, roleData } from "@/lib/calendar-data"

export async function POST(request: Request) {
  try {
    const { userId, relativeMonth, profile } = await request.json()

    if (!userId || !relativeMonth || !profile) {
      return NextResponse.json({ success: false, error: "缺少必需参数" }, { status: 400 })
    }

    console.log(`[Month Actions] 开始生成第${relativeMonth}个月的行动 - User: ${userId}`)

    const supabase = await createClient()

    // 1. 获取该月的主题信息
    const year = new Date().getFullYear()
    const { data: monthTheme, error: themeError } = await supabase
      .from("monthly_themes")
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("relative_month", relativeMonth)
      .single()

    if (themeError || !monthTheme) {
      console.error("[Month Actions] 未找到月度主题:", themeError)
      return NextResponse.json({ success: false, error: "未找到月度主题，请先生成年度规划" }, { status: 404 })
    }

    // 2. 检查是否已经生成过
    if (monthTheme.is_generated) {
      console.log("[Month Actions] 该月已生成，跳过")
      return NextResponse.json({
        success: true,
        message: "该月已生成",
      })
    }

    // 3. 计算日期范围
    const startDate = monthTheme.start_date
    const endDate = monthTheme.end_date
    const start = new Date(startDate)
    const end = new Date(endDate)

    console.log(`[Month Actions] 日期范围: ${startDate} ~ ${endDate}`)

    // 4. 构建 prompt
    const mbtiInfo = mbtiData[profile.mbti]
    const roleInfo = roleData[profile.role]

    // 防御性检查
    if (!mbtiInfo) {
      return NextResponse.json({ success: false, error: `无效的 MBTI 类型: ${profile.mbti}` }, { status: 400 })
    }
    if (!roleInfo) {
      return NextResponse.json({ success: false, error: `无效的职业类型: ${profile.role}` }, { status: 400 })
    }

    const prompt = `你是一个专业的财富增长顾问。

用户信息：
- MBTI 人格类型：${profile.mbti} (${mbtiInfo.name})
- 人格特质：${mbtiInfo.trait}
- 职业身份：${profile.role}
- 职业描述：${roleInfo.description}
${profile.goal ? `- 个人目标：${profile.goal}` : ""}

当前月度主题：
- 月份：第${relativeMonth}个月
- 主题：${monthTheme.theme}
- 描述：${monthTheme.description}
- 时间范围：${startDate} 至 ${endDate}

任务：为用户设计从 ${startDate} 到 ${endDate} 的每日行动计划（共30天）。

要求：
1. 每天一个具体的搞钱行动
2. 行动要符合月度主题"${monthTheme.theme}"
3. 难度循序渐进，从简单到复杂
4. 符合用户的 MBTI 特质和职业特点
5. ${profile.goal ? "与用户目标强相关" : "帮助用户提升财富能力"}
6. 每个行动包含：标题（8-15字）、描述（30-50字）、emoji

输出格式（纯 JSON 数组，不要任何其他文字）：
[
  {
    "date": "${startDate}",
    "title": "认识你的财富盲区",
    "description": "列出3个你当前最缺乏的财富认知，开始觉醒之旅",
    "emoji": "👁️"
  },
  {
    "date": "${new Date(start.getTime() + 86400000).toISOString().split("T")[0]}",
    "title": "...",
    "description": "...",
    "emoji": "..."
  },
  ...共 30 天
]

重要：
- 必须生成完整的 30 天行动
- 日期从 ${startDate} 开始，每天递增
- 只返回 JSON 数组，不要任何解释、注释或代码块标记
- 确保 JSON 格式正确，可以直接解析
- 每个行动都要有实际指导意义`

    // 5. 调用 Gemini AI
    console.log("[Month Actions] 调用 Gemini AI 生成行动...")
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    console.log("[Month Actions] AI 响应长度:", text.length)

    // 6. 解析 JSON
    const actions = parseDailyActions(text)
    console.log("[Month Actions] 解析到", actions.length, "个行动")

    if (actions.length !== 30) {
      throw new Error(`生成的行动数量不正确: ${actions.length}，需要 30 个`)
    }

    // 7. 保存到数据库
    console.log("[Month Actions] 保存到数据库...")
    const actionsToInsert = actions.map((action) => ({
      user_id: userId,
      date: action.date,
      title: action.title,
      description: action.description,
      emoji: action.emoji,
      theme: monthTheme.theme,
    }))

    const { error: insertError } = await supabase.from("daily_actions").insert(actionsToInsert)

    if (insertError) {
      console.error("[Month Actions] 保存失败:", insertError)
      throw new Error(`保存失败: ${insertError.message}`)
    }

    // 8. 更新 monthly_themes 表，标记为已生成
    const { error: updateError } = await supabase
      .from("monthly_themes")
      .update({ is_generated: true })
      .eq("id", monthTheme.id)

    if (updateError) {
      console.error("[Month Actions] 更新主题状态失败:", updateError)
    }

    console.log("[Month Actions] ✅ 第", relativeMonth, "个月行动生成成功")

    return NextResponse.json({
      success: true,
      message: "行动生成成功",
      count: actions.length,
    })
  } catch (error) {
    console.error("[Month Actions] 错误:", error)
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
function parseDailyActions(
  text: string
): Array<{
  date: string
  title: string
  description: string
  emoji: string
}> {
  try {
    let cleanedText = text.trim()

    // 移除 markdown 代码块标记
    cleanedText = cleanedText.replace(/```json\n?/gi, "")
    cleanedText = cleanedText.replace(/```javascript\n?/gi, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")

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

    // 验证
    const validActions = actions.filter(
      (action) => action.date && action.title && action.description && action.emoji
    )

    return validActions
  } catch (error) {
    console.error("[Month Actions] JSON 解析错误:", error)
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : "未知错误"}`)
  }
}
