-- ============================================================================
-- Rich365 数据库完全重置和重新设计
-- 执行时间：需要在 Supabase Dashboard SQL Editor 中执行
-- 警告：此脚本会删除所有现有数据！
-- ============================================================================

-- ============================================================================
-- 第 1 步：删除旧表和触发器
-- ============================================================================

-- 删除旧的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- 删除旧的函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_random_username() CASCADE;
DROP FUNCTION IF EXISTS generate_random_avatar() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 删除旧表（级联删除所有依赖）
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 第 2 步：创建新的 profiles 表（简洁设计）
-- ============================================================================

CREATE TABLE profiles (
  -- 基础字段
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 用户显示信息（注册时自动生成，用户可在设置中修改）
  username VARCHAR(50) NOT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT '😊',

  -- 人格和职业信息（在 onboarding 中设置，可为 NULL 直到完成 onboarding）
  mbti VARCHAR(10),
  role VARCHAR(100),

  -- 个人目标（可选）
  goal TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束
  CONSTRAINT username_min_length CHECK (char_length(username) >= 2),
  CONSTRAINT username_max_length CHECK (char_length(username) <= 50)
);

-- 创建索引（加速查询）
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- 添加注释
COMMENT ON TABLE profiles IS '用户 profile 表';
COMMENT ON COLUMN profiles.id IS '用户 ID（关联 auth.users）';
COMMENT ON COLUMN profiles.username IS '用户显示名称（2-50字符）';
COMMENT ON COLUMN profiles.avatar IS '用户头像 emoji';
COMMENT ON COLUMN profiles.mbti IS 'MBTI 人格类型（onboarding 中设置）';
COMMENT ON COLUMN profiles.role IS '职业身份（onboarding 中设置）';
COMMENT ON COLUMN profiles.goal IS '个人目标（可选）';

-- ============================================================================
-- 第 3 步：创建 daily_actions 表（每日搞钱行动）
-- ============================================================================

CREATE TABLE daily_actions (
  -- 基础字段
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 日期和内容
  date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  emoji VARCHAR(10) NOT NULL DEFAULT '💰',

  -- 分类信息
  theme VARCHAR(50),
  category VARCHAR(50),

  -- 完成状态
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束
  UNIQUE(user_id, date),  -- 每个用户每天只有一个行动
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT description_not_empty CHECK (char_length(description) > 0)
);

-- 创建索引（加速查询）
CREATE INDEX idx_daily_actions_user_id ON daily_actions(user_id);
CREATE INDEX idx_daily_actions_date ON daily_actions(date);
CREATE INDEX idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX idx_daily_actions_completed ON daily_actions(completed);

-- 添加注释
COMMENT ON TABLE daily_actions IS '每日搞钱行动表';
COMMENT ON COLUMN daily_actions.date IS '行动日期';
COMMENT ON COLUMN daily_actions.title IS '行动标题';
COMMENT ON COLUMN daily_actions.description IS '行动描述';
COMMENT ON COLUMN daily_actions.theme IS '月度主题';
COMMENT ON COLUMN daily_actions.category IS '行动分类';
COMMENT ON COLUMN daily_actions.completed IS '是否已完成';

-- ============================================================================
-- 第 4 步：启用 Row Level Security (RLS)
-- ============================================================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;

-- Profiles 表的 RLS 策略
CREATE POLICY "用户只能查看自己的 profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的 profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的 profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Daily Actions 表的 RLS 策略
CREATE POLICY "用户只能查看自己的行动"
  ON daily_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的行动"
  ON daily_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的行动"
  ON daily_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的行动"
  ON daily_actions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第 5 步：创建触发器和函数
-- ============================================================================

-- 函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到 profiles 表
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 应用到 daily_actions 表
CREATE TRIGGER update_daily_actions_updated_at
  BEFORE UPDATE ON daily_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 函数：新用户注册时自动创建 profile（简化版）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 为新用户创建基础 profile
  -- username: "用户" + 用户 ID 前 8 位
  -- avatar: 默认笑脸 emoji
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (
    NEW.id,
    '用户' || substr(NEW.id::text, 1, 8),
    '😊'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器到 auth.users（用户注册时自动执行）
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 第 6 步：刷新 PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 完成！数据库已完全重置并重新设计
-- ============================================================================
