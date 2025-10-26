# 数据库重装指南

## ⚠️ 重要提示

**此操作会删除所有现有数据！请确保已备份重要数据！**

## 📋 重装步骤

### 方案 A：完全重建（推荐）

适用于：开发/测试环境，或者不需要保留旧数据的情况

#### 步骤 1: 清理旧表

登录 Supabase Dashboard → SQL Editor，运行：

```sql
-- ⚠️ 警告：此操作会删除所有表和数据！

DROP TABLE IF EXISTS coach_chat_messages CASCADE;
DROP TABLE IF EXISTS coach_check_ins CASCADE;
DROP TABLE IF EXISTS check_in_records CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS used_actions CASCADE;
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS monthly_themes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 清理旧的触发器函数
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_stats_on_check_in CASCADE;
```

#### 步骤 2: 执行新 Schema

继续在 SQL Editor 中，复制并运行整个 `supabase/schema_v2_complete.sql` 文件的内容。

#### 步骤 3: 验证

运行以下查询验证表是否创建成功：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该看到以下表：
- ✅ coach_chat_messages
- ✅ coach_check_ins
- ✅ daily_actions
- ✅ monthly_themes
- ✅ user_profiles
- ✅ user_stats
- ✅ used_actions

---

### 方案 B：迁移保留数据

适用于：生产环境，需要保留用户数据

#### 步骤 1: 备份现有数据

```sql
-- 备份用户配置
CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;

-- 备份每日行动
CREATE TABLE daily_actions_backup AS SELECT * FROM daily_actions;

-- 备份用户统计（如果表结构兼容）
CREATE TABLE user_stats_backup AS SELECT * FROM user_stats;
```

#### 步骤 2: 创建新表

只创建新表，不删除旧表：

```sql
-- 创建 monthly_themes（如果不存在）
CREATE TABLE IF NOT EXISTS monthly_themes ( ... );

-- 创建 coach_check_ins（新）
CREATE TABLE IF NOT EXISTS coach_check_ins ( ... );

-- 创建 coach_chat_messages（新）
CREATE TABLE IF NOT EXISTS coach_chat_messages ( ... );
```

#### 步骤 3: 迁移打卡数据

```sql
-- 将旧的 check_in_records 迁移到新的 coach_check_ins
INSERT INTO coach_check_ins (user_id, date, is_completed, created_at)
SELECT
  user_id,
  check_in_date as date,
  true as is_completed,
  created_at
FROM check_in_records
ON CONFLICT (user_id, date) DO NOTHING;
```

#### 步骤 4: 删除旧表

确认数据迁移成功后：

```sql
DROP TABLE IF EXISTS check_in_records CASCADE;
```

---

## 🔧 常见问题

### Q1: 提示权限不足？
**A:** 确保使用的是 Supabase 项目的 Postgres 密码（不是 anon key），在 SQL Editor 中以 postgres 用户身份执行。

### Q2: RLS 策略报错？
**A:** 先禁用 RLS，创建表后再启用：
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- ... 创建表 ...
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Q3: 触发器函数已存在？
**A:** 先删除再创建：
```sql
DROP FUNCTION IF EXISTS function_name CASCADE;
CREATE OR REPLACE FUNCTION function_name() ...
```

---

## 📊 数据库对比

### 旧 Schema vs 新 Schema v2.0

| 功能 | 旧版 | 新版 v2.0 | 说明 |
|------|------|-----------|------|
| 用户配置 | ✅ user_profiles | ✅ user_profiles | 保持不变 |
| 月度主题 | ❌ | ✅ monthly_themes | 新增 |
| 每日行动 | ✅ daily_actions | ✅ daily_actions | 保持不变 |
| 打卡记录 | ✅ check_in_records | ✅ coach_check_ins | **升级为 AI 教练打卡** |
| 聊天记录 | ❌ | ✅ coach_chat_messages | **新增 AI 对话功能** |
| 用户统计 | ✅ user_stats | ✅ user_stats | 新增字段 |
| 行动去重 | ✅ used_actions | ✅ used_actions | 保持不变 |

### 主要变更

1. **打卡系统升级**
   - 从简单的 `check_in_records` 升级为 `coach_check_ins`
   - 新增：AI 评分、聊天总结、用户反思

2. **新增 AI 教练聊天**
   - `coach_chat_messages` 表存储对话历史
   - 支持多轮对话
   - 记录元数据

3. **用户统计增强**
   - 新增平均完成度
   - 新增总积分系统

---

## ✅ 验证清单

重装完成后，请验证：

- [ ] 所有表已创建
- [ ] 索引已创建
- [ ] RLS 策略已启用
- [ ] 触发器已创建
- [ ] 可以插入测试数据
- [ ] 前端可以正常访问

### 测试插入

```sql
-- 测试插入用户配置
INSERT INTO user_profiles (user_id, mbti, role, goal)
VALUES (
  auth.uid(),
  'INTJ',
  '程序员',
  '财富自由'
);

-- 测试创建打卡
INSERT INTO coach_check_ins (user_id, date, is_completed)
VALUES (
  auth.uid(),
  CURRENT_DATE,
  false
);
```

---

## 🚀 下一步

数据库重装完成后：

1. **更新 API**
   - 修改所有使用 `check_in_records` 的代码
   - 实现 AI 教练对话 API

2. **更新前端**
   - 重构打卡组件
   - 添加聊天界面

3. **测试**
   - 完整流程测试
   - 性能测试

---

## 📞 支持

如遇到问题，请检查：
1. Supabase 日志
2. 浏览器控制台错误
3. API 响应错误信息
