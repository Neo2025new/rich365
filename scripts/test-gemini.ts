/**
 * Gemini API 测试脚本
 * 测试 API 密钥是否有效
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const apiKey = process.env.GEMINI_API_KEY

console.log('🔍 测试 Gemini API 密钥...\n')

if (!apiKey) {
  console.error('❌ 错误：未找到 GEMINI_API_KEY 环境变量')
  process.exit(1)
}

console.log('✅ 找到 API 密钥:', apiKey.substring(0, 20) + '...')

async function testGemini() {
  try {
    console.log('\n📡 正在调用 Gemini API...')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const result = await model.generateContent("说一句鼓励的话（10字以内）")
    const response = result.response
    const text = response.text()

    console.log('✅ API 调用成功！')
    console.log('📝 响应内容:', text)
    console.log('\n✨ Gemini API 工作正常！')

  } catch (error) {
    console.error('\n❌ API 调用失败:', error)

    if (error instanceof Error) {
      console.error('错误详情:', error.message)

      if (error.message.includes('API_KEY_INVALID')) {
        console.error('\n💡 提示：API 密钥无效，请检查：')
        console.error('1. 密钥是否正确')
        console.error('2. 是否在 Google AI Studio 启用了 API')
        console.error('3. 访问 https://aistudio.google.com/app/apikey 检查密钥状态')
      } else if (error.message.includes('quota')) {
        console.error('\n💡 提示：API 配额已用完')
      } else if (error.message.includes('PERMISSION_DENIED')) {
        console.error('\n💡 提示：API 密钥没有权限')
      }
    }

    process.exit(1)
  }
}

testGemini()
