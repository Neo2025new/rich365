/**
 * 数据库迁移 API
 * 访问: /api/migrate-database
 *
 * 这个 API 会执行所有待执行的迁移脚本
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "缺少 Supabase 配置" },
        { status: 500 }
      )
    }

    // 使用 service role key 创建客户端（绕过 RLS）
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[Migration] 开始执行数据库迁移...")

    // 执行迁移 SQL
    const migrationSQL = `
      -- 添加 username 和 avatar 列到 profiles 表

      -- 1. 添加 username 列
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS username VARCHAR(100);

      -- 2. 添加 avatar 列
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS avatar VARCHAR(10);

      -- 3. 添加索引
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
    `

    // 使用 Supabase 的 rpc 调用执行原始 SQL
    // 注意：这需要先在 Supabase 中创建一个执行 SQL 的函数
    // 由于直接执行 SQL 的限制，我们使用 pg client

    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("[Migration] 执行失败:", error)

      // 如果 RPC 函数不存在，返回手动执行的指示
      if (error.code === "PGRST202" || error.message?.includes("exec_sql")) {
        return NextResponse.json({
          success: false,
          error: "需要在 Supabase Dashboard 手动执行迁移",
          sql: migrationSQL,
          instructions: [
            "1. 访问 https://supabase.com/dashboard/project/rskfpbdwujtsrmvnzxyo/sql/new",
            "2. 粘贴上述 SQL",
            "3. 点击 Run 执行",
          ],
        })
      }

      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[Migration] ✅ 迁移执行成功")

    return NextResponse.json({
      success: true,
      message: "数据库迁移成功完成",
      migrations: ["003_add_username_avatar_to_profiles"],
    })
  } catch (error) {
    console.error("[Migration] 错误:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

// 支持 GET 请求查看迁移 SQL
export async function GET() {
  const migrationSQL = `-- 添加 username 和 avatar 列到 profiles 表
-- 用于存储用户的显示名称和头像

-- 1. 添加 username 列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- 2. 添加 avatar 列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar VARCHAR(10);

-- 3. 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. 添加注释
COMMENT ON COLUMN profiles.username IS '用户显示名称（用于排行榜等）';
COMMENT ON COLUMN profiles.avatar IS '用户头像 emoji';`

  return NextResponse.json({
    success: true,
    sql: migrationSQL,
    instructions: {
      step1: "复制上面的 SQL",
      step2: "访问 Supabase Dashboard SQL Editor",
      step3: "https://supabase.com/dashboard/project/rskfpbdwujtsrmvnzxyo/sql/new",
      step4: "粘贴并运行 SQL",
    },
  })
}
