# 数据库完全重建指南

## ⚠️ 重要警告

**此操作将删除数据库中的所有现有数据！**

执行前请确保：
1. 已备份重要数据（如果有）
2. 理解此操作不可逆
3. 已获得相关授权

## 📋 重建内容

此脚本将创建以下完整的数据库结构：

### 1️⃣ **profiles 表**
用户档案表，包含：
- 基础信息：用户名、头像
- 个性化信息：MBTI、职业、目标
- 打卡统计：总打卡数、连续天数、金币、徽章
- 时间戳：创建时间、更新时间

### 2️⃣ **daily_actions 表**
每日行动表，包含：
- 行动信息：日期、标题、描述、emoji
- 分类信息：主题、类别
- 完成状态：是否完成、完成时间

### 3️⃣ **check_ins 表**
打卡记录表，包含：
- 打卡信息：日期、关联行动、备注
- 自动关联到 profiles 表，更新统计数据

### 4️⃣ **自动触发器**
- ✅ 新用户注册自动创建 profile
- ✅ 更新时自动更新 updated_at 时间戳
- ✅ 打卡后自动更新统计数据（连续天数、金币等）

### 5️⃣ **安全策略 (RLS)**
- ✅ 所有表启用行级安全
- ✅ 用户只能访问自己的数据

## 🚀 执行步骤

### 步骤 1: 访问 Supabase Dashboard

1. 打开浏览器，访问：https://supabase.com/dashboard
2. 登录您的账户
3. 选择项目：**richca**

### 步骤 2: 打开 SQL Editor

1. 点击左侧菜单的 **SQL Editor**
2. 点击 **+ New query** 创建新查询

### 步骤 3: 执行重建脚本

1. 打开文件：`supabase/migrations/007_complete_database_rebuild.sql`
2. 复制**全部内容**
3. 粘贴到 SQL Editor 中
4. 点击右下角的 **Run** 按钮

### 步骤 4: 等待执行完成

执行过程大约需要 **5-10 秒**。

成功后，您会看到：
```
Success. No rows returned
```

## ✅ 验证数据库

执行成功后，您可以验证数据库结构：

### 查看所有表

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该看到：
- ✅ check_ins
- ✅ daily_actions
- ✅ profiles

### 查看 profiles 表结构

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

应该包含以下字段：
- id (uuid)
- username (varchar)
- avatar (varchar)
- mbti (varchar)
- role (varchar)
- goal (text)
- total_check_ins (integer)
- current_streak (integer)
- longest_streak (integer)
- total_coins (integer)
- badges (text[])
- created_at (timestamptz)
- updated_at (timestamptz)

## 🧪 测试新数据库

### 1. 测试用户注册

访问 https://rich365.ai 并注册一个新账户。

检查是否自动创建了 profile：
```sql
SELECT id, username, avatar, created_at
FROM profiles
LIMIT 5;
```

### 2. 测试生成日历

登录后，在 onboarding 页面选择 MBTI 和职业，生成日历。

检查是否创建了 daily_actions：
```sql
SELECT date, title, theme, category
FROM daily_actions
ORDER BY date
LIMIT 10;
```

### 3. 测试打卡功能

完成一次打卡操作。

检查打卡记录和统计更新：
```sql
-- 查看打卡记录
SELECT * FROM check_ins ORDER BY created_at DESC LIMIT 5;

-- 查看统计数据
SELECT username, total_check_ins, current_streak, total_coins
FROM profiles
WHERE total_check_ins > 0;
```

## 🔧 常见问题

### Q: 执行失败，提示权限错误？
A: 确保您使用的是项目所有者账户，或具有足够的数据库权限。

### Q: 能否只删除数据，保留表结构？
A: 可以，使用以下命令：
```sql
TRUNCATE profiles, daily_actions, check_ins CASCADE;
```

### Q: 如何恢复到之前的状态？
A: 此操作不可逆。建议执行前先导出数据备份。

### Q: 触发器没有生效？
A: 检查触发器是否创建成功：
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## 📊 数据库架构图

```
┌─────────────────────────────────────────────────┐
│                  auth.users                     │
│                 (Supabase Auth)                 │
└───────────────────┬─────────────────────────────┘
                    │
                    │ id (FK)
                    ▼
┌─────────────────────────────────────────────────┐
│                   profiles                      │
│  - username, avatar                             │
│  - mbti, role, goal                             │
│  - total_check_ins, current_streak              │
│  - longest_streak, total_coins, badges          │
└──────────┬──────────────────────┬───────────────┘
           │                      │
           │ user_id (FK)         │ user_id (FK)
           ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐
│   daily_actions      │  │     check_ins        │
│  - date, title       │  │  - date, note        │
│  - description       │  │  - action_id (FK)    │
│  - theme, category   │  │                      │
│  - completed         │◄─┤  (自动更新统计)      │
└──────────────────────┘  └──────────────────────┘
```

## 🎯 完成后的下一步

1. ✅ 数据库重建完成
2. 🔄 访问 https://rich365.ai 测试应用
3. 📊 验证所有功能是否正常：
   - 用户注册和登录
   - MBTI 和职业选择
   - 日历生成
   - 打卡功能
   - 统计数据显示
   - 保存图片功能

---

**如有任何问题，请查看 Supabase Dashboard 的 Logs 页面获取详细错误信息。**
