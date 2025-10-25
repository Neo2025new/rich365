import { GoogleGenerativeAI } from "@google/generative-ai"

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 生成基于用户目标的个性化搞钱行动建议
 * @param goal 用户目标
 * @param mbti 用户 MBTI 类型
 * @param role 用户职业身份
 * @returns 生成的行动建议
 */
export async function generateGoalBasedActions(goal: string, mbti: string, role: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `你是一个专业的财富增长顾问，擅长制定可执行的微行动计划。

用户信息：
- MBTI 人格类型：${mbti}
- 职业身份：${role}
- 目标：${goal}

请基于用户的目标，生成 3 个具体的、可立即执行的"搞钱微行动"建议。

要求：
1. 每个行动必须是具体的、可执行的（30分钟内可完成）
2. 行动要符合用户的 MBTI 人格特质和职业身份
3. 使用行动号召性的语言（动词开头）
4. 每个行动控制在 20-30 字以内
5. 返回格式：每行一个行动，用数字编号，无需额外说明

示例格式：
1. 今天记录 3 笔支出，标注「必要」或「可省」
2. 花 10 分钟研究一个新的赚钱技能
3. 联系一位行业前辈，请教职业发展建议

现在请生成 3 个行动建议：`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    return text
  } catch (error) {
    console.error("Gemini API 调用失败:", error)
    throw new Error("生成行动建议失败，请稍后重试")
  }
}

/**
 * 验证用户目标是否合理
 * @param goal 用户输入的目标
 * @returns 是否合理及建议
 */
export async function validateGoal(goal: string): Promise<{ valid: boolean; suggestion?: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `判断以下目标是否是一个合理的、与财富增长相关的目标：

目标：${goal}

要求：
1. 如果目标合理，回复：VALID
2. 如果目标不合理或不相关，回复：INVALID，并简短说明原因（不超过 30 字）

请直接回复：`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text().trim()

    if (text.startsWith("VALID")) {
      return { valid: true }
    } else if (text.startsWith("INVALID")) {
      const suggestion = text.replace("INVALID", "").trim().replace(/^[，,、]/, "")
      return { valid: false, suggestion }
    }

    return { valid: true } // 默认认为合理
  } catch (error) {
    console.error("Gemini API 调用失败:", error)
    return { valid: true } // 出错时默认通过
  }
}
