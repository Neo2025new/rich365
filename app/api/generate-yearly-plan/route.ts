/**
 * 生成用户的年度主题规划（12 个月）
 * 这是 AI 生成的第一步，快速生成整年的主题框架
 */

import { NextResponse } from "next/server"
import { genAI } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { mbtiData, roleData, type UserProfile } from "@/lib/calendar-data"

export async function POST(request: Request) {
  try {
    const { userId, profile } = await request.json()

    if (!userId || !profile) {
      return NextResponse.json({ success: false, error: "缺少必需参数" }, { status: 400 })
    }

    console.log(`[Yearly Plan] 开始生成年度规划 - User: ${userId}`)

    const supabase = await createClient()

    // 检查是否已经生成过
    const year = new Date().getFullYear()
    const { data: existing } = await supabase
      .from("monthly_themes")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log("[Yearly Plan] 年度规划已存在，跳过生成")
      return NextResponse.json({
        success: true,
        message: "年度规划已存在",
      })
    }

    // 构建 prompt
    const mbtiInfo = mbtiData[profile.mbti]
    const roleInfo = roleData[profile.role]

    // 防御性检查
    if (!mbtiInfo) {
      return NextResponse.json({ success: false, error: `无效的 MBTI 类型: ${profile.mbti}` }, { status: 400 })
    }
    if (!roleInfo) {
      return NextResponse.json({ success: false, error: `无效的职业类型: ${profile.role}` }, { status: 400 })
    }

    const prompt = `你是一个专业的财富增长顾问和年度规划师。

用户信息：
- MBTI 人格类型：${profile.mbti} (${mbtiInfo.name})
- 人格特质：${mbtiInfo.trait}
- 职业身份：${profile.role}
- 职业描述：${roleInfo.description}
${profile.goal ? `- 个人目标：${profile.goal}` : ""}

任务：为用户设计一个 12 个月的搞钱成长主题规划。

要求：
1. 每个月一个主题，主题要循序渐进、相互衔接
2. 符合用户的 MBTI 特质和职业特点
3. ${profile.goal ? "与用户的目标强相关" : "帮助用户全面提升财富能力"}
4. 主题要有吸引力、易理解
5. 每个主题包含：标题（6-8字）、描述（20-30字）、emoji

12 个月的参考主题方向（你可以根据用户特点调整）：
1. 第1个月：觉醒与认知 - 唤醒财富意识，建立基础认知
2. 第2个月：学习与积累 - 学习核心技能，积累知识资本
3. 第3个月：行动与实践 - 将知识转化为行动，建立习惯
4. 第4个月：品牌与影响 - 打造个人品牌，扩大影响力
5. 第5个月：探索与创新 - 尝试新机会，开拓收入渠道
6. 第6个月：人脉与合作 - 建立优质人脉，创造合作机会
7. 第7个月：变现与增长 - 将能力转化为收入，实现增长
8. 第8个月：内容与传播 - 持续输出价值，建立影响力
9. 第9个月：思维与格局 - 提升商业思维，拓展财富格局
10. 第10个月：效率与优化 - 优化系统流程，提高产出效率
11. 第11个月：复盘与迭代 - 总结经验教训，优化策略
12. 第12个月：规划与升级 - 制定新目标，准备新跃迁

输出格式（纯 JSON 数组，不要任何其他文字）：
[
  {
    "relativeMonth": 1,
    "theme": "搞钱觉醒月",
    "description": "唤醒财富意识，建立基础的财富认知体系",
    "emoji": "🌅"
  },
  ...共 12 个
]

重要：
- 必须生成完整的 12 个月规划
- 只返回 JSON 数组，不要任何解释、注释或代码块标记
- 确保 JSON 格式正确，可以直接解析
- 每个主题都要有实际指导意义`

    // 调用 Gemini AI
    console.log("[Yearly Plan] 调用 Gemini AI 生成年度规划...")
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    console.log("[Yearly Plan] AI 响应长度:", text.length)
    console.log("[Yearly Plan] AI 原始响应:", text.substring(0, 500)) // 打印前 500 字符

    // 解析 JSON
    const themes = parseYearlyPlan(text)
    console.log("[Yearly Plan] 解析到", themes.length, "个月主题")

    if (themes.length !== 12) {
      throw new Error(`生成的主题数量不正确: ${themes.length}，需要 12 个`)
    }

    // 计算每个相对月份的实际日期范围
    const today = new Date()
    const themesWithDates = themes.map((theme) => {
      const startOffset = (theme.relativeMonth - 1) * 30
      const endOffset = startOffset + 29

      const startDate = new Date(today)
      startDate.setDate(today.getDate() + startOffset)

      const endDate = new Date(today)
      endDate.setDate(today.getDate() + endOffset)

      return {
        user_id: userId,
        year,
        relative_month: theme.relativeMonth,
        theme: theme.theme,
        description: theme.description,
        emoji: theme.emoji,
        is_generated: theme.relativeMonth === 1, // 第一个月会立即生成详细行动
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      }
    })

    // 保存到数据库
    console.log("[Yearly Plan] 保存到数据库...")
    const { error } = await supabase.from("monthly_themes").insert(themesWithDates)

    if (error) {
      console.error("[Yearly Plan] 保存失败:", error)
      throw new Error(`保存失败: ${error.message}`)
    }

    console.log("[Yearly Plan] ✅ 年度规划生成成功")

    return NextResponse.json({
      success: true,
      message: "年度规划生成成功",
      themes: themesWithDates,
    })
  } catch (error) {
    console.error("[Yearly Plan] 错误:", error)
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
function parseYearlyPlan(
  text: string
): Array<{
  relativeMonth: number
  theme: string
  description: string
  emoji: string
}> {
  try {
    let cleanedText = text.trim()

    console.log("[Yearly Plan] 原始文本长度:", text.length)
    console.log("[Yearly Plan] 原始文本前 200 字符:", text.substring(0, 200))

    // 移除 markdown 代码块标记
    cleanedText = cleanedText.replace(/```json\n?/gi, "")
    cleanedText = cleanedText.replace(/```javascript\n?/gi, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")

    // 提取 JSON 数组
    const startIndex = cleanedText.indexOf("[")
    const endIndex = cleanedText.lastIndexOf("]")

    console.log("[Yearly Plan] JSON 起始位置:", startIndex, "结束位置:", endIndex)

    if (startIndex === -1 || endIndex === -1) {
      console.error("[Yearly Plan] 未找到 JSON 数组。完整文本:", cleanedText)
      throw new Error("响应中未找到 JSON 数组")
    }

    cleanedText = cleanedText.substring(startIndex, endIndex + 1).trim()

    console.log("[Yearly Plan] 提取的 JSON 前 300 字符:", cleanedText.substring(0, 300))

    const themes = JSON.parse(cleanedText)

    if (!Array.isArray(themes)) {
      throw new Error("响应不是数组格式")
    }

    console.log("[Yearly Plan] 解析成功，共", themes.length, "项")

    // 验证
    const validThemes = themes.filter(
      (theme) =>
        theme.relativeMonth &&
        theme.theme &&
        theme.description &&
        theme.emoji
    )

    console.log("[Yearly Plan] 有效主题数:", validThemes.length)

    if (validThemes.length !== themes.length) {
      console.warn("[Yearly Plan] 部分主题数据不完整:", {
        total: themes.length,
        valid: validThemes.length,
        invalid: themes.filter(t => !t.relativeMonth || !t.theme || !t.description || !t.emoji)
      })
    }

    return validThemes
  } catch (error) {
    console.error("[Yearly Plan] JSON 解析错误:", error)
    console.error("[Yearly Plan] 解析失败的文本:", text)
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : "未知错误"}`)
  }
}
