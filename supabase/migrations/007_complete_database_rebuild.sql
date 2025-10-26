-- ============================================================================
-- Rich365 完整数据库重建脚本
-- 警告：此脚本会删除所有现有数据！
-- 执行时间：需要在 Supabase Dashboard SQL Editor 中执行
-- ============================================================================

-- ============================================================================
-- 第 1 步：删除所有现有表、触发器和函数
-- ============================================================================

-- 删除所有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_daily_actions_updated_at ON daily_actions CASCADE;
DROP TRIGGER IF EXISTS update_stats_after_check_in ON check_ins CASCADE;

-- 删除所有函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_check_in_stats() CASCADE;
DROP FUNCTION IF EXISTS generate_random_username() CASCADE;
DROP FUNCTION IF EXISTS generate_random_avatar() CASCADE;

-- 删除所有表（级联删除所有依赖）
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 第 2 步：创建 profiles 表（包含所有字段）
-- ============================================================================

CREATE TABLE profiles (
  -- 基础字段
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 用户显示信息
  username VARCHAR(50) NOT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT '😊',

  -- 人格和职业信息
  mbti VARCHAR(10),
  role VARCHAR(100),
  goal TEXT,

  -- 打卡统计字段
  total_check_ins INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}',

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束
  CONSTRAINT username_min_length CHECK (char_length(username) >= 2),
  CONSTRAINT username_max_length CHECK (char_length(username) <= 50)
);

-- 创建索引
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_total_check_ins ON profiles(total_check_ins);
CREATE INDEX idx_profiles_current_streak ON profiles(current_streak);

-- 添加注释
COMMENT ON TABLE profiles IS '用户 profile 表';
COMMENT ON COLUMN profiles.id IS '用户 ID（关联 auth.users）';
COMMENT ON COLUMN profiles.username IS '用户显示名称（2-50字符）';
COMMENT ON COLUMN profiles.avatar IS '用户头像 emoji';
COMMENT ON COLUMN profiles.mbti IS 'MBTI 人格类型';
COMMENT ON COLUMN profiles.role IS '职业身份';
COMMENT ON COLUMN profiles.goal IS '个人目标（可选）';
COMMENT ON COLUMN profiles.total_check_ins IS '总打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '总获得金币数';
COMMENT ON COLUMN profiles.badges IS '已获得的徽章ID列表';

-- ============================================================================
-- 第 3 步：创建 daily_actions 表
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
  UNIQUE(user_id, date),
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT description_not_empty CHECK (char_length(description) > 0)
);

-- 创建索引
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
-- 第 4 步：创建 check_ins 表
-- ============================================================================

CREATE TABLE check_ins (
  -- 基础字段
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 打卡信息
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束：每个用户每天只能打卡一次
  UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(date);
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date);

-- 添加注释
COMMENT ON TABLE check_ins IS '用户打卡记录表';
COMMENT ON COLUMN check_ins.user_id IS '用户ID';
COMMENT ON COLUMN check_ins.date IS '打卡日期';
COMMENT ON COLUMN check_ins.action_id IS '关联的行动ID（可选）';
COMMENT ON COLUMN check_ins.note IS '打卡备注（可选）';

-- ============================================================================
-- 第 5 步：启用 Row Level Security (RLS)
-- ============================================================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

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

-- Check Ins 表的 RLS 策略
CREATE POLICY "用户只能查看自己的打卡记录"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的打卡记录"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的打卡记录"
  ON check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的打卡记录"
  ON check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第 6 步：创建触发器和函数
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

-- 函数：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- 绑定触发器到 auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 函数：更新打卡统计数据
CREATE OR REPLACE FUNCTION update_check_in_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_total INTEGER;
  user_current_streak INTEGER;
  user_longest_streak INTEGER;
  last_check_in_date DATE;
  check_date DATE;
BEGIN
  -- 获取用户总打卡次数
  SELECT COUNT(*) INTO user_total
  FROM check_ins
  WHERE user_id = NEW.user_id;

  -- 计算当前连续打卡天数
  check_date := NEW.date;
  user_current_streak := 1;

  LOOP
    last_check_in_date := check_date - INTERVAL '1 day';

    IF EXISTS (
      SELECT 1 FROM check_ins
      WHERE user_id = NEW.user_id AND date = last_check_in_date
    ) THEN
      user_current_streak := user_current_streak + 1;
      check_date := last_check_in_date;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 获取最长连续打卡天数
  SELECT GREATEST(current_streak, user_current_streak) INTO user_longest_streak
  FROM profiles
  WHERE id = NEW.user_id;

  -- 更新 profiles 表
  UPDATE profiles
  SET
    total_check_ins = user_total,
    current_streak = user_current_streak,
    longest_streak = user_longest_streak,
    total_coins = user_total * 10,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：打卡后自动更新统计
CREATE TRIGGER update_stats_after_check_in
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_check_in_stats();

-- ============================================================================
-- 第 7 步：刷新 PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 完成！数据库已完全重建
-- ============================================================================
