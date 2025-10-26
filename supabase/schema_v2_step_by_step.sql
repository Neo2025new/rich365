-- ============================================
-- Rich365 数据库 Schema v2.0 - 分步执行版本
-- 请按照注释的步骤顺序执行
-- ============================================

-- ============================================
-- 步骤 1: 清理旧表和函数
-- ============================================

DROP TABLE IF EXISTS coach_chat_messages CASCADE;
DROP TABLE IF EXISTS coach_check_ins CASCADE;
DROP TABLE IF EXISTS check_in_records CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS used_actions CASCADE;
DROP TABLE IF EXISTS daily_actions CASCADE;
DROP TABLE IF EXISTS monthly_themes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_stats_on_check_in CASCADE;

-- 确认清理完成
SELECT 'Step 1 完成：旧表已清理' as status;

-- ============================================
-- 步骤 2: 创建所有表（不含 RLS）
-- ============================================

-- 1. 用户配置表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti VARCHAR(4) NOT NULL CHECK (mbti IN ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP')),
  role VARCHAR(50) NOT NULL,
  goal TEXT,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. AI 教练打卡记录表
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

-- 5. AI 教练聊天记录表
CREATE TABLE coach_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id UUID NOT NULL REFERENCES coach_check_ins(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 用户统计表
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_check_ins INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_check_in_date DATE,
  total_points INT DEFAULT 0,
  average_completion_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 已使用行动表
CREATE TABLE used_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action_title)
);

SELECT 'Step 2 完成：所有表已创建' as status;

-- ============================================
-- 步骤 3: 创建索引
-- ============================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_monthly_themes_user_year ON monthly_themes(user_id, year);
CREATE INDEX idx_monthly_themes_user_month ON monthly_themes(user_id, year, relative_month);
CREATE INDEX idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX idx_daily_actions_date ON daily_actions(date);
CREATE INDEX idx_coach_check_ins_user_date ON coach_check_ins(user_id, date);
CREATE INDEX idx_coach_check_ins_user_id ON coach_check_ins(user_id);
CREATE INDEX idx_coach_chat_messages_check_in ON coach_chat_messages(check_in_id);
CREATE INDEX idx_coach_chat_messages_user_id ON coach_chat_messages(user_id);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_used_actions_user_id ON used_actions(user_id);

SELECT 'Step 3 完成：索引已创建' as status;

-- ============================================
-- 步骤 4: 启用 RLS 并创建策略
-- ============================================

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- monthly_themes
ALTER TABLE monthly_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly themes"
  ON monthly_themes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly themes"
  ON monthly_themes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly themes"
  ON monthly_themes FOR UPDATE
  USING (auth.uid() = user_id);

-- daily_actions
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily actions"
  ON daily_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily actions"
  ON daily_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- coach_check_ins
ALTER TABLE coach_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins"
  ON coach_check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON coach_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON coach_check_ins FOR UPDATE
  USING (auth.uid() = user_id);

-- coach_chat_messages
ALTER TABLE coach_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON coach_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON coach_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view leaderboard"
  ON user_stats FOR SELECT
  USING (true);

-- used_actions
ALTER TABLE used_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own used actions"
  ON used_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own used actions"
  ON used_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

SELECT 'Step 4 完成：RLS 策略已创建' as status;

-- ============================================
-- 步骤 5: 创建触发器函数
-- ============================================

-- 更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新用户统计的函数
CREATE OR REPLACE FUNCTION update_user_stats_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  v_user_stats RECORD;
  v_yesterday DATE;
  v_new_streak INT;
BEGIN
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
    SELECT * INTO v_user_stats FROM user_stats WHERE user_id = NEW.user_id;

    IF v_user_stats IS NULL THEN
      INSERT INTO user_stats (user_id, total_check_ins, current_streak, longest_streak, last_check_in_date)
      VALUES (NEW.user_id, 1, 1, 1, NEW.date);
      RETURN NEW;
    END IF;

    v_yesterday := NEW.date - INTERVAL '1 day';

    IF v_user_stats.last_check_in_date = v_yesterday THEN
      v_new_streak := v_user_stats.current_streak + 1;
    ELSIF v_user_stats.last_check_in_date = NEW.date THEN
      v_new_streak := v_user_stats.current_streak;
    ELSE
      v_new_streak := 1;
    END IF;

    UPDATE user_stats
    SET
      total_check_ins = CASE
        WHEN v_user_stats.last_check_in_date = NEW.date THEN total_check_ins
        ELSE total_check_ins + 1
      END,
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_check_in_date = NEW.date,
      total_points = total_points + COALESCE(NEW.ai_completion_score, 50),
      average_completion_score = (
        SELECT AVG(ai_completion_score)
        FROM coach_check_ins
        WHERE user_id = NEW.user_id AND ai_completion_score IS NOT NULL
      )
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Step 5 完成：触发器函数已创建' as status;

-- ============================================
-- 步骤 6: 创建触发器
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

CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_on_check_in
  AFTER INSERT OR UPDATE ON coach_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_check_in();

SELECT 'Step 6 完成：触发器已创建' as status;

-- ============================================
-- 步骤 7: 验证安装
-- ============================================

SELECT
  'Step 7 完成：数据库安装完成！' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgisinternal = false) as trigger_count;

-- 列出所有创建的表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
