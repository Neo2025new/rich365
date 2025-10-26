-- ============================================
-- Rich365 完整数据库 Schema - 修复版
-- 一次性执行，无需分步
-- ============================================

-- ============================================
-- 清理旧数据
-- ============================================

-- 先删除触发器（避免触发器引用的函数被删除时报错）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_stats_after_check_in ON check_ins CASCADE;
DROP TRIGGER IF EXISTS update_stats_on_check_in ON check_ins CASCADE;

-- 删除所有函数
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_stats_on_check_in CASCADE;
DROP FUNCTION IF EXISTS update_stats_on_check_in CASCADE;
DROP FUNCTION IF EXISTS update_check_in_stats CASCADE;

-- 删除所有表
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

-- ============================================
-- 创建表
-- ============================================

-- 1. 用户配置表（包含所有必要字段）
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基础信息
  mbti VARCHAR(4) CHECK (mbti IN ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP')),
  role VARCHAR(50),
  goal TEXT,

  -- 显示信息（排行榜用）
  username TEXT,
  avatar TEXT,

  -- 统计信息（打卡用）
  total_check_ins INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_coins INT DEFAULT 0,
  badges TEXT[] DEFAULT '{}',

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 月度主题规划表
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

-- 3. 每日行动表
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

-- 4. 打卡记录表（简化版，兼容现有代码）
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 5. AI 教练打卡记录表（未来功能）
CREATE TABLE coach_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  chat_summary TEXT,
  self_rating INT CHECK (self_rating >= 1 AND self_rating <= 5),
  reflection TEXT,
  ai_completion_score INT CHECK (ai_completion_score >= 0 AND ai_completion_score <= 100),
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. AI 教练聊天记录表（未来功能）
CREATE TABLE coach_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id UUID NOT NULL REFERENCES coach_check_ins(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 创建索引
-- ============================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_monthly_themes_user_year ON monthly_themes(user_id, year);
CREATE INDEX idx_monthly_themes_user_month ON monthly_themes(user_id, year, relative_month);
CREATE INDEX idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX idx_daily_actions_date ON daily_actions(date);
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_coach_check_ins_user_date ON coach_check_ins(user_id, date);
CREATE INDEX idx_coach_check_ins_user_id ON coach_check_ins(user_id);
CREATE INDEX idx_coach_chat_messages_check_in ON coach_chat_messages(check_in_id);
CREATE INDEX idx_coach_chat_messages_user_id ON coach_chat_messages(user_id);

-- ============================================
-- 启用 RLS 并创建策略
-- ============================================

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (true);  -- 所有人可查看（排行榜需要）

CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- monthly_themes
ALTER TABLE monthly_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_themes_select" ON monthly_themes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "monthly_themes_insert" ON monthly_themes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_themes_update" ON monthly_themes
  FOR UPDATE USING (auth.uid() = user_id);

-- daily_actions
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_actions_select" ON daily_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_actions_insert" ON daily_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- check_ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "check_ins_select" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "check_ins_insert" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "check_ins_update" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- coach_check_ins
ALTER TABLE coach_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_check_ins_select" ON coach_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coach_check_ins_insert" ON coach_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_check_ins_update" ON coach_check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- coach_chat_messages
ALTER TABLE coach_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_chat_messages_select" ON coach_chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coach_chat_messages_insert" ON coach_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 创建触发器函数
-- ============================================

-- 更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 打卡时更新统计数据（直接更新 user_profiles）
CREATE OR REPLACE FUNCTION update_stats_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  v_profile RECORD;
  v_yesterday DATE;
  v_new_streak INT;
BEGIN
  -- 获取用户档案
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = NEW.user_id;

  IF v_profile IS NULL THEN
    -- 如果档案不存在，创建默认档案
    INSERT INTO user_profiles (user_id, total_check_ins, current_streak, longest_streak, total_coins)
    VALUES (NEW.user_id, 1, 1, 1, 10)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  v_yesterday := NEW.date - INTERVAL '1 day';

  -- 计算连续天数
  IF v_profile.current_streak = 0 THEN
    -- 第一次打卡
    v_new_streak := 1;
  ELSE
    -- 查找最近一次打卡日期
    DECLARE
      v_last_check_in_date DATE;
    BEGIN
      SELECT MAX(date) INTO v_last_check_in_date
      FROM check_ins
      WHERE user_id = NEW.user_id AND date < NEW.date;

      IF v_last_check_in_date IS NULL THEN
        v_new_streak := 1;
      ELSIF v_last_check_in_date = v_yesterday THEN
        -- 连续打卡
        v_new_streak := v_profile.current_streak + 1;
      ELSIF v_last_check_in_date = NEW.date THEN
        -- 同一天重复打卡（不应该发生，因为有 UNIQUE 约束）
        v_new_streak := v_profile.current_streak;
      ELSE
        -- 中断了，重新开始
        v_new_streak := 1;
      END IF;
    END;
  END IF;

  -- 更新统计数据
  UPDATE user_profiles
  SET
    total_check_ins = total_check_ins + 1,
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    total_coins = total_coins + 10
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 创建触发器
-- ============================================

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER monthly_themes_updated_at
  BEFORE UPDATE ON monthly_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER coach_check_ins_updated_at
  BEFORE UPDATE ON coach_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 打卡时自动更新统计
CREATE TRIGGER update_stats_after_check_in
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_check_in();

-- ============================================
-- 创建新用户自动触发器（可选）
-- ============================================

-- 新用户注册时自动创建 user_profiles 记录
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username, avatar)
  VALUES (
    NEW.id,
    '用户' || substr(NEW.id::text, 1, 8),
    '😊'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器到 auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 完成提示
-- ============================================

SELECT
  '✅ 数据库安装完成！' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;

-- 列出所有创建的表
SELECT table_name as "创建的表"
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
