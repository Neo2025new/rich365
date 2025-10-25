/**
 * 数据库迁移执行脚本
 * 执行: npx tsx scripts/run-migration.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// 加载环境变量
dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少环境变量:")
  console.error("  - NEXT_PUBLIC_SUPABASE_URL")
  console.error("  - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// 使用 service role key 创建客户端（绕过 RLS）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration(filename: string) {
  console.log(`\n📝 执行迁移: ${filename}`)

  const migrationPath = path.join(__dirname, "../supabase/migrations", filename)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ 迁移文件不存在: ${migrationPath}`)
    return false
  }

  const sql = fs.readFileSync(migrationPath, "utf-8")

  try {
    // 使用 Supabase 的 rpc 执行 SQL
    // 注意：这需要在 Supabase 中创建一个执行 SQL 的函数
    // 或者我们可以直接使用 SQL 编辑器手动执行

    console.log("📋 SQL 内容:")
    console.log("=" .repeat(80))
    console.log(sql)
    console.log("=".repeat(80))

    console.log("\n⚠️  注意: 请手动在 Supabase Dashboard 的 SQL Editor 中执行上述 SQL")
    console.log("🔗 Supabase Dashboard: https://supabase.com/dashboard/project/rskfpbdwujtsrmvnzxyo/sql/new")

    return true
  } catch (error) {
    console.error(`❌ 执行失败:`, error)
    return false
  }
}

async function main() {
  console.log("🚀 开始执行数据库迁移...\n")
  console.log(`📍 Supabase URL: ${supabaseUrl}`)

  const migrationFile = "003_add_username_avatar_to_profiles.sql"

  const success = await runMigration(migrationFile)

  if (success) {
    console.log("\n✅ 迁移脚本已准备好")
    console.log("\n📌 下一步:")
    console.log("1. 访问 Supabase Dashboard")
    console.log("2. 进入 SQL Editor")
    console.log("3. 粘贴上述 SQL 并执行")
  } else {
    console.log("\n❌ 迁移失败")
    process.exit(1)
  }
}

main()
