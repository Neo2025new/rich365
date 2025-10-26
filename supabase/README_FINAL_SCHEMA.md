# Rich365 最终数据库 Schema 说明

## 🎯 设计原则

基于对整个项目代码的深度分析，这个 Schema 遵循以下原则：

### 1. 零触发器设计 ⚡
- **不在 auth.users 上创建任何触发器**
- user_profiles 由代码在 onboarding 时创建
- 所有业务逻辑在应用层处理
- 避免触发器导致的 "Database error saving new user" 错误

### 2. 代码驱动 📊
- 通过分析项目代码，精确提取所有必需的表和字段
- 表使用统计：
  - `daily_actions`: 15次使用，9个文件
  - `user_profiles`: 15次使用，5个文件
  - `monthly_themes`: 7次使用，4个文件
  - `check_ins`: 3次使用，1个文件

### 3. 最简 RLS 🔒
- user_profiles: 所有人可查看（排行榜需要），只能更新自己
- 其他表: 只能查看和修改自己的数据
- 策略清晰简单，不冲突

### 4. 完整字段 ✅
所有代码中使用的字段都已包含：
- user_profiles: id, user_id, mbti, role, goal, username, avatar, total_check_ins, current_streak, longest_streak, total_coins, badges
- daily_actions: id, user_id, date, title, description, emoji, theme, category
- monthly_themes: id, user_id, year, relative_month, theme, description, emoji, is_generated, start_date, end_date
- check_ins: id, user_id, date, action_id, note

## 📋 执行步骤

### 1. 备份当前数据（如果需要）
如果有重要数据，先备份：
```sql
-- 导出 user_profiles
COPY (SELECT * FROM user_profiles) TO '/tmp/user_profiles_backup.csv' CSV HEADER;
```

### 2. 执行 SQL 脚本
1. 打开 **Supabase Dashboard**
2. 进入 **SQL Editor**
3. 复制 `FINAL_SCHEMA.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 **Run**
6. 等待执行完成（约5-10秒）

### 3. 验证安装
执行完成后，你应该看到：
- ✅ Rich365 数据库安装完成！
- 4个表的列表及字段数
- ✅ auth.users 上没有触发器（正确）

## 🔧 工作原理

### 用户注册流程
1. 用户在 `/login` 页面注册
2. Supabase 创建 auth.users 记录（**不触发任何触发器**）
3. 用户跳转到 `/onboarding`
4. 用户填写 MBTI、职业、目标
5. 提交后，`/api/generate-calendar-progressive` 创建 user_profiles 记录
6. 同时生成年度规划和第一个月的行动

### 数据创建时机
- **user_profiles**: 在 onboarding 提交时创建
- **monthly_themes**: 在 onboarding 提交时创建（12个月）
- **daily_actions**: 在 onboarding 提交时创建（第1个月30天）
- **check_ins**: 在用户打卡时创建

## 🐛 故障排除

### 如果注册时还是出错

检查是否有遗留的触发器：
```sql
-- 查看 auth.users 上的触发器
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

如果有触发器，手动删除：
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
```

### 如果字段缺失

检查表结构：
```sql
-- 查看 user_profiles 的字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

## ✨ 优势

1. **可靠性**: 零触发器，避免复杂的依赖关系
2. **性能**: 优化的索引，快速查询
3. **安全性**: 简洁的 RLS 策略，数据隔离
4. **可维护性**: 清晰的表结构，易于理解
5. **完整性**: 包含所有代码需要的字段

## 📊 数据库分析报告

详细的代码使用分析报告保存在：
`supabase/schema_analysis_report.json`

包含：
- 每个表的使用次数和文件列表
- 每个字段的使用次数和文件列表
- 完整的依赖关系图
