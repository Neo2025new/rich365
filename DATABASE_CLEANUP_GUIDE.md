# 数据库清理指南

## 方案 1：使用 Supabase 控制台 SQL Editor（推荐）

### 步骤：

1. **打开 Supabase 控制台**
   - 访问：https://supabase.com/dashboard/project/rskfpbdwujtsmrvnzxyo
   - 登录你的账号

2. **打开 SQL Editor**
   - 左侧菜单点击 "SQL Editor"
   - 点击 "New query"

3. **执行清理 SQL**
   - 复制以下 SQL 代码并粘贴到编辑器：

```sql
-- 清理所有用户数据
DELETE FROM check_ins;
DELETE FROM daily_actions;
DELETE FROM profiles;

-- 显示清理结果
SELECT
  (SELECT COUNT(*) FROM check_ins) as check_ins_count,
  (SELECT COUNT(*) FROM daily_actions) as daily_actions_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count;
```

4. **点击 "Run" 执行**
   - 应该显示所有表的记录数都是 0

### 清理用户账号（可选）

如果还需要删除 auth.users 表中的用户账号：

1. 左侧菜单点击 "Authentication"
2. 点击 "Users" 标签
3. 选择要删除的用户，点击 "Delete user"
4. 或使用 SQL（⚠️ 谨慎使用）：

```sql
-- 删除所有用户账号（会级联删除所有相关数据）
DELETE FROM auth.users;
```

---

## 方案 2：使用 Node.js 脚本

### 前置准备：

1. **获取 Service Role Key**
   - 打开 Supabase 控制台
   - Settings > API
   - 复制 "service_role" key（secret）

2. **添加到 .env.local**

```bash
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 执行清理：

```bash
# 安装依赖（如果需要）
npm install tsx dotenv

# 执行清理脚本
npx tsx scripts/cleanup-database.ts
```

---

## 清理内容说明

此操作会删除：
- ✅ 所有打卡记录（check_ins 表）
- ✅ 所有每日行动（daily_actions 表）
- ✅ 所有用户配置（profiles 表）

此操作不会删除：
- ❌ auth.users 表中的用户账号（需手动删除）

---

## 清理后的效果

1. 所有用户的 profile、日历数据、打卡记录都会被清空
2. 用户账号（email/Google登录）仍然存在
3. 用户重新登录后需要重新完成 onboarding 流程
4. 这样可以测试完整的新用户注册流程

---

## 注意事项

⚠️ **警告**：
- 此操作不可逆！请确保在开发/测试环境执行
- 建议先备份数据（如果有重要数据）
- 生产环境请谨慎操作
