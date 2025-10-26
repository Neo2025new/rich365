-- ============================================================================
-- Rich365 数据库完整恢复脚本
-- 从零开始重建整个数据库结构
-- ============================================================================

-- ============================================================================
-- 第 1 步：删除所有现有对象（如果存在）
-- ============================================================================

-- 删除触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_check_in_stats_trigger ON check_ins;

-- 删除函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_check_in_stats() CASCADE;

-- 删除表（按依赖顺序）
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 第 2 步：创建 profiles 表
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar TEXT DEFAULT '😊',
  mbti TEXT,
  role TEXT,
  goal TEXT,
  total_check_ins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS '用户档案表';
COMMENT ON COLUMN profiles.id IS '用户 ID（关联 auth.users）';
COMMENT ON COLUMN profiles.username IS '用户名';
COMMENT ON COLUMN profiles.avatar IS '用户头像 emoji';
COMMENT ON COLUMN profiles.mbti IS 'MBTI 人格类型';
COMMENT ON COLUMN profiles.role IS '职业身份';
COMMENT ON COLUMN profiles.goal IS '个人目标';
COMMENT ON COLUMN profiles.total_check_ins IS '累计打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '累计金币数';
COMMENT ON COLUMN profiles.badges IS '获得的徽章列表（JSON）';

-- ============================================================================
-- 第 3 步：创建 daily_actions 表
-- ============================================================================

CREATE TABLE daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  theme TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_actions IS '每日搞钱行动表';
COMMENT ON COLUMN daily_actions.user_id IS '用户 ID';
COMMENT ON COLUMN daily_actions.date IS '行动日期';
COMMENT ON COLUMN daily_actions.title IS '行动标题';
COMMENT ON COLUMN daily_actions.description IS '行动描述';
COMMENT ON COLUMN daily_actions.emoji IS '行动图标';
COMMENT ON COLUMN daily_actions.theme IS '月度主题';
COMMENT ON COLUMN daily_actions.category IS '行动分类';

-- ============================================================================
-- 第 4 步：创建 check_ins 表
-- ============================================================================

CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_id UUID REFERENCES daily_actions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  coins_earned INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

COMMENT ON TABLE check_ins IS '用户打卡记录表';
COMMENT ON COLUMN check_ins.user_id IS '用户 ID';
COMMENT ON COLUMN check_ins.action_id IS '关联的行动 ID';
COMMENT ON COLUMN check_ins.date IS '打卡日期';
COMMENT ON COLUMN check_ins.notes IS '打卡备注';
COMMENT ON COLUMN check_ins.coins_earned IS '获得的金币数';

-- ============================================================================
-- 第 5 步：创建索引（性能优化）
-- ============================================================================

-- profiles 表索引
CREATE INDEX idx_profiles_mbti ON profiles(mbti);
CREATE INDEX idx_profiles_role ON profiles(role);

-- daily_actions 表索引
CREATE INDEX idx_daily_actions_user_date_composite ON daily_actions(user_id, date DESC);
CREATE INDEX idx_daily_actions_category ON daily_actions(category) WHERE category IS NOT NULL;
CREATE INDEX idx_daily_actions_theme ON daily_actions(theme) WHERE theme IS NOT NULL;

-- check_ins 表索引
CREATE INDEX idx_check_ins_user_date_composite ON check_ins(user_id, date DESC);
CREATE INDEX idx_check_ins_action ON check_ins(action_id);

-- ============================================================================
-- 第 6 步：启用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 第 7 步：创建 RLS 策略
-- ============================================================================

-- profiles 表策略
CREATE POLICY "用户可以查看自己的档案"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的档案"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的档案"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- daily_actions 表策略
CREATE POLICY "用户可以查看自己的行动"
  ON daily_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的行动"
  ON daily_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的行动"
  ON daily_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的行动"
  ON daily_actions FOR DELETE
  USING (auth.uid() = user_id);

-- check_ins 表策略
CREATE POLICY "用户可以查看自己的打卡"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的打卡"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的打卡"
  ON check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的打卡"
  ON check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第 8 步：创建触发器函数
-- ============================================================================

-- 自动为新用户创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', '新用户'),
    '😊'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS '自动为新用户创建 profile 记录';

-- 更新打卡统计数据
CREATE OR REPLACE FUNCTION update_check_in_stats()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE;
  has_yesterday_checkin BOOLEAN;
  new_streak INTEGER;
BEGIN
  -- 计算昨天的日期
  yesterday := NEW.date - INTERVAL '1 day';

  -- 检查昨天是否有打卡
  SELECT EXISTS(
    SELECT 1 FROM check_ins
    WHERE user_id = NEW.user_id AND date = yesterday
  ) INTO has_yesterday_checkin;

  -- 计算新的连续打卡天数
  IF has_yesterday_checkin THEN
    -- 连续打卡，递增
    SELECT current_streak + 1 INTO new_streak
    FROM profiles
    WHERE id = NEW.user_id;
  ELSE
    -- 中断了，重新开始
    new_streak := 1;
  END IF;

  -- 更新 profile 统计数据
  UPDATE profiles
  SET
    total_check_ins = total_check_ins + 1,
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    total_coins = total_coins + COALESCE(NEW.coins_earned, 10),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_check_in_stats() IS '更新用户打卡统计数据（总次数、连续天数、金币等）';

-- ============================================================================
-- 第 9 步：绑定触发器
-- ============================================================================

-- 新用户注册时自动创建 profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 打卡时自动更新统计数据
CREATE TRIGGER update_check_in_stats_trigger
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_check_in_stats();

-- ============================================================================
-- 第 10 步：分析表（优化查询性能）
-- ============================================================================

ANALYZE profiles;
ANALYZE daily_actions;
ANALYZE check_ins;

-- ============================================================================
-- 完成！
-- ============================================================================

SELECT
  '✅ 数据库恢复完成！' as message,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_count,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)) as triggers_count;
