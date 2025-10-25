/**
 * AI 日历生成服务
 * 使用 Gemini AI 为用户生成个性化的 365 天搞钱行动
 */

import { genAI } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/client"
import { UserProfile, mbtiData, roleData } from "@/lib/calendar-data"

/**
 * 为用户生成完整的一年日历（365天行动）
 */
export async function generateFullYearCalendar(
  userId: string,
  profile: UserProfile
): Promise<{ success: boolean; message: string; actionsCount?: number }> {
  try {
    console.log(`[AI Calendar] 开始为用户 ${userId} 生成日历...`)
    console.log(`[AI Calendar] 用户配置:`, profile)

    // 1. 检查 API 密钥
    if (!process.env.GEMINI_API_KEY) {
      console.error("[AI Calendar] ❌ GEMINI_API_KEY 未设置")
      return {
        success: false,
        message: "服务器配置错误：API 密钥未设置",
      }
    }

    // 2. 检查是否已经生成过
    const supabase = createClient()
    const { count } = await supabase
      .from("daily_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (count && count > 0) {
      console.log(`[AI Calendar] 用户已有 ${count} 个行动，跳过生成`)
      return {
        success: true,
        message: "日历已存在",
        actionsCount: count,
      }
    }

    // 3. 构建详细的 AI prompt
    const year = new Date().getFullYear()
    const prompt = buildPrompt(year, profile)

    // 4. 调用 Gemini AI 生成
    console.log(`[AI Calendar] 调用 Gemini AI...`)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (apiError: any) {
      console.error("[AI Calendar] Gemini API 调用失败:", apiError)

      // 检查具体的 API 错误类型
      if (apiError.message?.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        return {
          success: false,
          message: "API 密钥被限制，请联系管理员修复配置",
        }
      } else if (apiError.message?.includes("API_KEY_INVALID")) {
        return {
          success: false,
          message: "API 密钥无效，请联系管理员",
        }
      } else if (apiError.message?.includes("quota")) {
        return {
          success: false,
          message: "API 配额已用完，请稍后重试",
        }
      } else if (apiError.status === 403) {
        return {
          success: false,
          message: "API 访问被拒绝，请检查密钥配置",
        }
      } else {
        throw apiError
      }
    }

    const text = result.response.text()
    console.log(`[AI Calendar] AI 响应长度: ${text.length} 字符`)

    // 5. 解析 JSON 响应
    const actions = parseAIResponse(text)
    console.log(`[AI Calendar] 解析到 ${actions.length} 个行动`)

    if (actions.length === 0) {
      throw new Error("AI 未生成任何行动")
    }

    // 6. 保存到数据库
    console.log(`[AI Calendar] 开始保存到数据库...`)
    await saveActionsToDatabase(userId, actions)

    console.log(`[AI Calendar] ✅ 成功生成并保存 ${actions.length} 个行动`)

    return {
      success: true,
      message: `成功生成 ${actions.length} 个搞钱行动`,
      actionsCount: actions.length,
    }
  } catch (error) {
    console.error("[AI Calendar] 错误:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "生成失败，请稍后重试",
    }
  }
}

/**
 * 构建 AI prompt
 */
function buildPrompt(year: number, profile: UserProfile): string {
  if (!profile.mbti || !profile.role) {
    throw new Error("Profile mbti and role are required to build prompt")
  }

  const mbtiInfo = mbtiData[profile.mbti]
  const roleInfo = roleData[profile.role]

  return `你是一个专业的财富增长顾问和行动规划师。

用户信息：
- MBTI 人格类型：${profile.mbti} (${mbtiInfo.name})
- 人格特质：${mbtiInfo.trait}
- 职业身份：${profile.role}
- 职业描述：${roleInfo.description}
- 职业特点：${roleInfo.traits}
${profile.goal ? `- 个人目标：${profile.goal}` : ""}

任务：为用户生成 365 个每日"搞钱微行动"，帮助用户在 ${year} 年实现财富增长。

要求：
1. 每个行动必须具体、可执行（30分钟内可完成）
2. 行动要符合用户的 MBTI 特质和职业特点
3. ${profile.goal ? "行动要与用户的个人目标强相关" : "行动要帮助用户提升财富能力"}
4. 行动要有渐进性（从简单到复杂，循序渐进）
5. 包含多样性（学习、实践、社交、投资、创作等）
6. 每个行动包含：标题（10字以内）、描述（30-50字）、emoji、类别

分12个月，每月有主题：
1月（搞钱觉醒月）：唤醒财富意识，建立基础认知
2月（投资学习月）：学习投资知识，提升财商
3月（行动复利月）：每日小行动，积累大财富
4月（品牌经营月）：打造个人品牌，扩大影响力
5月（副业探索月）：开拓收入渠道，创造被动收入
6月（人脉拓展月）：建立优质人脉，创造合作机会
7月（技能变现月）：将技能转化为收入来源
8月（内容创作月）：持续输出内容，建立影响力
9月（商业思维月）：培养商业嗅觉，发现赚钱机会
10月（效率提升月）：优化工作流程，提高产出效率
11月（财富复盘月）：总结经验教训，优化赚钱策略
12月（目标规划月）：制定新年计划，设定财富目标

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
  ...共 365 个
]

重要：
- 必须生成完整的 365 个行动（从 ${year}-01-01 到 ${year}-12-31）
- 只返回 JSON 数组，不要任何解释、注释或代码块标记
- 确保 JSON 格式正确，可以直接解析
- 每个行动都要有实际价值和可操作性
`
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
    console.log("[AI Calendar] 开始解析 AI 响应，原始长度:", text.length)

    // 移除可能的 markdown 代码块标记
    let cleanedText = text.trim()

    // 移除各种 markdown 代码块标记
    cleanedText = cleanedText.replace(/```json\n?/gi, "")
    cleanedText = cleanedText.replace(/```javascript\n?/gi, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")

    // 移除可能的注释（// 和 /* */)
    cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\//g, "") // 移除 /* */ 注释
    cleanedText = cleanedText.replace(/\/\/.*/g, "") // 移除 // 注释

    // 查找 JSON 数组的开始和结束
    const startIndex = cleanedText.indexOf("[")
    const endIndex = cleanedText.lastIndexOf("]")

    if (startIndex === -1 || endIndex === -1) {
      console.error("[AI Calendar] 无法找到 JSON 数组")
      console.error("[AI Calendar] 清理后的文本前500字符:", cleanedText.substring(0, 500))
      throw new Error("响应中未找到 JSON 数组")
    }

    // 提取纯 JSON 部分
    cleanedText = cleanedText.substring(startIndex, endIndex + 1).trim()

    console.log("[AI Calendar] 清理后的 JSON 长度:", cleanedText.length)
    console.log("[AI Calendar] JSON 前100字符:", cleanedText.substring(0, 100))

    // 解析 JSON
    const actions = JSON.parse(cleanedText)

    console.log("[AI Calendar] JSON 解析成功，数组长度:", actions.length)

    // 验证格式
    if (!Array.isArray(actions)) {
      throw new Error("响应不是数组格式")
    }

    // 验证每个行动的必需字段
    const validActions = actions.filter((action, index) => {
      const isValid =
        action.date &&
        action.title &&
        action.description &&
        action.emoji &&
        action.theme &&
        action.category

      if (!isValid && index < 5) {
        // 只记录前5个无效行动
        console.warn(`[AI Calendar] 第 ${index + 1} 个行动无效:`, action)
      }

      return isValid
    })

    console.log(
      `[AI Calendar] 有效行动: ${validActions.length}/${actions.length}`
    )

    if (validActions.length === 0) {
      throw new Error("没有有效的行动")
    }

    return validActions
  } catch (error) {
    console.error("[AI Calendar] ❌ JSON 解析错误:", error)
    console.error("[AI Calendar] 原始响应前1000字符:", text.substring(0, 1000))
    console.error("[AI Calendar] 原始响应后200字符:", text.substring(text.length - 200))

    throw new Error(
      `JSON 解析失败: ${error instanceof Error ? error.message : "未知错误"}`
    )
  }
}

/**
 * 保存行动到数据库
 */
async function saveActionsToDatabase(
  userId: string,
  actions: Array<{
    date: string
    title: string
    description: string
    emoji: string
    theme: string
    category: string
  }>
): Promise<void> {
  const supabase = createClient()

  // 批量插入（每次最多 100 条）
  const batchSize = 100
  for (let i = 0; i < actions.length; i += batchSize) {
    const batch = actions.slice(i, i + batchSize)

    const { error } = await supabase.from("daily_actions").insert(
      batch.map((action) => ({
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
      console.error(`[AI Calendar] 批次 ${i / batchSize + 1} 保存失败:`, error)
      throw new Error(`保存到数据库失败: ${error.message}`)
    }

    console.log(`[AI Calendar] 已保存 ${i + batch.length}/${actions.length} 个行动`)
  }
}

/**
 * 获取用户的日历行动（从数据库）
 */
export async function getUserCalendarActions(userId: string, year?: number, month?: number) {
  const supabase = createClient()

  let query = supabase
    .from("daily_actions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })

  // 可选：按年份筛选
  if (year) {
    query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`)
  }

  // 可选：按月份筛选
  if (year && month) {
    const monthStr = month.toString().padStart(2, "0")
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const nextMonthStr = nextMonth.toString().padStart(2, "0")

    query = query.gte("date", `${year}-${monthStr}-01`).lt("date", `${nextYear}-${nextMonthStr}-01`)
  }

  const { data, error } = await query

  if (error) {
    console.error("[AI Calendar] 获取行动失败:", error)
    throw new Error(`获取行动失败: ${error.message}`)
  }

  return data || []
}

/**
 * 获取单日行动
 */
export async function getDailyAction(userId: string, date: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("daily_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // 未找到
      return null
    }
    console.error("[AI Calendar] 获取单日行动失败:", error)
    throw new Error(`获取行动失败: ${error.message}`)
  }

  return data
}
