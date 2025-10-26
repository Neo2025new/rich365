/**
 * 数据库清理脚本
 * 删除所有用户数据（用于开发/测试）
 *
 * 使用方法：
 * npx tsx scripts/cleanup-database.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建 Supabase 管理员客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupDatabase() {
  console.log('⚠️  警告：此脚本将删除所有用户数据！')
  console.log('开始清理数据库...\n')

  try {
    // 1. 删除所有打卡记录
    console.log('🗑️  删除打卡记录...')
    const { error: checkInsError, count: checkInsCount } = await supabase
      .from('check_ins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录的技巧

    if (checkInsError) {
      console.error('❌ 删除打卡记录失败:', checkInsError)
    } else {
      console.log(`✅ 已删除 ${checkInsCount || 0} 条打卡记录`)
    }

    // 2. 删除所有每日行动
    console.log('🗑️  删除每日行动...')
    const { error: actionsError, count: actionsCount } = await supabase
      .from('daily_actions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (actionsError) {
      console.error('❌ 删除每日行动失败:', actionsError)
    } else {
      console.log(`✅ 已删除 ${actionsCount || 0} 条每日行动`)
    }

    // 3. 删除所有月度主题
    console.log('🗑️  删除月度主题...')
    const { error: themesError, count: themesCount } = await supabase
      .from('monthly_themes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (themesError) {
      console.error('❌ 删除月度主题失败:', themesError)
    } else {
      console.log(`✅ 已删除 ${themesCount || 0} 条月度主题`)
    }

    // 4. 删除所有用户配置
    console.log('🗑️  删除用户配置...')
    const { error: profilesError, count: profilesCount } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (profilesError) {
      console.error('❌ 删除用户配置失败:', profilesError)
    } else {
      console.log(`✅ 已删除 ${profilesCount || 0} 条用户配置`)
    }

    // 5. 验证清理结果
    console.log('\n📊 验证清理结果...')
    const [checkIns, actions, themes, profiles] = await Promise.all([
      supabase.from('check_ins').select('*', { count: 'exact', head: true }),
      supabase.from('daily_actions').select('*', { count: 'exact', head: true }),
      supabase.from('monthly_themes').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true })
    ])

    console.log(`✅ check_ins 表: ${checkIns.count || 0} 条记录`)
    console.log(`✅ daily_actions 表: ${actions.count || 0} 条记录`)
    console.log(`✅ monthly_themes 表: ${themes.count || 0} 条记录`)
    console.log(`✅ user_profiles 表: ${profiles.count || 0} 条记录`)

    console.log('\n✨ 数据库清理完成！')
    console.log('\n⚠️  注意：')
    console.log('1. 此脚本不会删除 auth.users 表中的用户账号')
    console.log('2. 如需删除用户账号，请访问 Supabase 控制台:')
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/auth/users')}`)

  } catch (error) {
    console.error('❌ 清理过程出错:', error)
    process.exit(1)
  }
}

// 执行清理
cleanupDatabase()
