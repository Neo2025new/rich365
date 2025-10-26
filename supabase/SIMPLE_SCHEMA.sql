-- ============================================
-- Rich365 简化数据库 Schema
-- 最简单直接的方式，忽略所有错误
-- ============================================

-- 设置：忽略不存在的对象错误
SET client_min_messages TO WARNING;

-- ============================================
-- 删除所有东西（忽略不存在错误）
-- ============================================

-- 删除函数
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_stats_on_check_in CASCADE;
DROP FUNCTION IF EXISTS update_stats_on_check_in CASCADE;
DROP FUNCTION IF EXISTS update_check_in_stats CASCADE;

-- 删除表（级联删除触发器）
DROP TABLE IF EXISTS coach_chat_messages CASCADE;
DROP TABLE IF EXISTS coach_check_ins CASCADE;
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS check_in_records CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS used_actions CASCADE;
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS monthly_themes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 恢复正常消息级别
SET client_min_messages TO NOTICE;

-- ============================================
-- 创建表
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti VARCHAR(4),
  role VARCHAR(50),
  goal TEXT,
  username TEXT,
  avatar TEXT,
  total_check_ins INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_coins INT DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '📝',
  theme TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE monthly_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  relative_month INT NOT NULL CHECK (relative_month >= 1 AND relative_month <= 12),
  theme TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📅',
  is_generated BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, relative_month)
);

CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 创建索引
-- ============================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX idx_daily_actions_date ON daily_actions(date);
CREATE INDEX idx_monthly_themes_user_year ON monthly_themes(user_id, year);
CREATE INDEX idx_monthly_themes_user_month ON monthly_themes(user_id, year, relative_month);
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date);

-- ============================================
-- 启用 RLS
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- user_profiles: 所有人可查看，只能改自己
CREATE POLICY "user_profiles_select_all" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- daily_actions: 只能看和改自己的
CREATE POLICY "daily_actions_select_own" ON daily_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_actions_insert_own" ON daily_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- monthly_themes: 只能看和改自己的
CREATE POLICY "monthly_themes_select_own" ON monthly_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monthly_themes_insert_own" ON monthly_themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_themes_update_own" ON monthly_themes FOR UPDATE USING (auth.uid() = user_id);

-- check_ins: 只能看和改自己的
CREATE POLICY "check_ins_select_own" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "check_ins_insert_own" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_update_own" ON check_ins FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 创建 updated_at 触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER monthly_themes_updated_at
  BEFORE UPDATE ON monthly_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 验证安装
-- ============================================

SELECT '✅ Rich365 数据库安装完成！' as status;

SELECT table_name as "创建的表",
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t.table_name) as "字段数"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'daily_actions', 'monthly_themes', 'check_ins')
ORDER BY table_name;

SELECT CASE
  WHEN COUNT(*) = 0 THEN '✅ auth.users 上没有触发器'
  ELSE '⚠️ auth.users 上还有触发器'
END as "触发器检查"
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
