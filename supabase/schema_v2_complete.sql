-- ============================================
-- Rich365 完整数据库 Schema v2.0
-- 包含 AI 教练聊天系统
-- ============================================

-- 清理旧表（谨慎使用！会删除所有数据）
-- DROP TABLE IF EXISTS coach_chat_messages CASCADE;
-- DROP TABLE IF EXISTS coach_check_ins CASCADE;
-- DROP TABLE IF EXISTS check_in_records CASCADE;
-- DROP TABLE IF EXISTS user_stats CASCADE;
-- DROP TABLE IF EXISTS used_actions CASCADE;
-- DROP TABLE IF EXISTS daily_actions CASCADE;
-- DROP TABLE IF EXISTS monthly_themes CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- 1. 用户配置表
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti VARCHAR(4) NOT NULL CHECK (mbti IN ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP')),
  role VARCHAR(50) NOT NULL,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 月度主题规划表
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_themes (
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

-- ============================================
-- 3. 每日行动表
-- ============================================
CREATE TABLE IF NOT EXISTS daily_actions (
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

-- ============================================
-- 4. AI 教练打卡记录表（新）
-- ============================================
CREATE TABLE IF NOT EXISTS coach_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,

  -- 打卡状态
  is_completed BOOLEAN DEFAULT FALSE,

  -- AI 教练互动摘要
  chat_summary TEXT,

  -- 用户自评（1-5星）
  self_rating INT CHECK (self_rating >= 1 AND self_rating <= 5),

  -- 用户反思/笔记
  reflection TEXT,

  -- 完成度评分（AI 生成）
  ai_completion_score INT CHECK (ai_completion_score >= 0 AND ai_completion_score <= 100),

  -- AI 评价
  ai_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- ============================================
-- 5. AI 教练聊天记录表（新）
-- ============================================
CREATE TABLE IF NOT EXISTS coach_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id UUID NOT NULL REFERENCES coach_check_ins(id) ON DELETE CASCADE,

  -- 消息类型：user 或 assistant
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),

  -- 消息内容
  content TEXT NOT NULL,

  -- 消息元数据
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 用户统计表
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 打卡统计
  total_check_ins INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,

  -- 最后打卡日期
  last_check_in_date DATE,

  -- 总分数/积分
  total_points INT DEFAULT 0,

  -- 平均完成度
  average_completion_score DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. 已使用行动表（用于去重）
-- ============================================
CREATE TABLE IF NOT EXISTS used_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action_title)
);

-- ============================================
-- 索引
-- ============================================

-- user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- monthly_themes
CREATE INDEX IF NOT EXISTS idx_monthly_themes_user_year ON monthly_themes(user_id, year);
CREATE INDEX IF NOT EXISTS idx_monthly_themes_user_month ON monthly_themes(user_id, year, relative_month);

-- daily_actions
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_actions_date ON daily_actions(date);

-- coach_check_ins
CREATE INDEX IF NOT EXISTS idx_coach_check_ins_user_date ON coach_check_ins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_coach_check_ins_user_id ON coach_check_ins(user_id);

-- coach_chat_messages
CREATE INDEX IF NOT EXISTS idx_coach_chat_messages_check_in ON coach_chat_messages(check_in_id);
CREATE INDEX IF NOT EXISTS idx_coach_chat_messages_user_id ON coach_chat_messages(user_id);

-- user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- used_actions
CREATE INDEX IF NOT EXISTS idx_used_actions_user_id ON used_actions(user_id);

-- ============================================
-- Row Level Security (RLS) 策略
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

-- All users can view leaderboard (top stats)
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

-- ============================================
-- 触发器函数
-- ============================================

-- 更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_profiles
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- monthly_themes
CREATE TRIGGER monthly_themes_updated_at
  BEFORE UPDATE ON monthly_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- coach_check_ins
CREATE TRIGGER coach_check_ins_updated_at
  BEFORE UPDATE ON coach_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- user_stats
CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 自动更新用户统计的触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_user_stats_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  v_user_stats RECORD;
  v_yesterday DATE;
  v_new_streak INT;
BEGIN
  -- 只在打卡完成时更新统计
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN

    -- 获取当前用户统计
    SELECT * INTO v_user_stats
    FROM user_stats
    WHERE user_id = NEW.user_id;

    -- 如果用户统计不存在，创建一条
    IF v_user_stats IS NULL THEN
      INSERT INTO user_stats (user_id, total_check_ins, current_streak, longest_streak, last_check_in_date)
      VALUES (NEW.user_id, 1, 1, 1, NEW.date);
      RETURN NEW;
    END IF;

    -- 计算昨天的日期
    v_yesterday := NEW.date - INTERVAL '1 day';

    -- 更新连续打卡天数
    IF v_user_stats.last_check_in_date = v_yesterday THEN
      -- 连续打卡
      v_new_streak := v_user_stats.current_streak + 1;
    ELSIF v_user_stats.last_check_in_date = NEW.date THEN
      -- 同一天多次打卡，保持不变
      v_new_streak := v_user_stats.current_streak;
    ELSE
      -- 断签了，重新开始
      v_new_streak := 1;
    END IF;

    -- 更新用户统计
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

CREATE TRIGGER update_stats_on_check_in
  AFTER INSERT OR UPDATE ON coach_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_check_in();

-- ============================================
-- 表注释
-- ============================================

COMMENT ON TABLE user_profiles IS '用户配置信息（MBTI、职业、目标等）';
COMMENT ON TABLE monthly_themes IS '12个月的主题规划';
COMMENT ON TABLE daily_actions IS '每日行动计划';
COMMENT ON TABLE coach_check_ins IS 'AI教练打卡记录';
COMMENT ON TABLE coach_chat_messages IS 'AI教练聊天消息';
COMMENT ON TABLE user_stats IS '用户统计数据';
COMMENT ON TABLE used_actions IS '已使用的行动（去重）';

COMMENT ON COLUMN coach_check_ins.ai_completion_score IS 'AI评估的完成度（0-100）';
COMMENT ON COLUMN coach_check_ins.self_rating IS '用户自评（1-5星）';
COMMENT ON COLUMN coach_check_ins.chat_summary IS 'AI教练对话总结';

-- ============================================
-- 初始化完成
-- ============================================

-- 输出提示
DO $$
BEGIN
  RAISE NOTICE '✅ Rich365 数据库 Schema v2.0 创建完成！';
  RAISE NOTICE '包含表：';
  RAISE NOTICE '  - user_profiles (用户配置)';
  RAISE NOTICE '  - monthly_themes (月度主题)';
  RAISE NOTICE '  - daily_actions (每日行动)';
  RAISE NOTICE '  - coach_check_ins (AI教练打卡)';
  RAISE NOTICE '  - coach_chat_messages (AI聊天记录)';
  RAISE NOTICE '  - user_stats (用户统计)';
  RAISE NOTICE '  - used_actions (行动去重)';
END $$;
