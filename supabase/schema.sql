-- Rich365 数据库结构
-- 在 Supabase SQL Editor 中运行此文件创建所需的表

-- 1. 用户配置表 (user_profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  mbti VARCHAR(4) CHECK (mbti IN ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP')),
  professional_role VARCHAR(50) CHECK (professional_role IN ('创业者/自雇者', '职场打工人', '创作者/内容从业者', '投资理财者', '学习者/转型者')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 打卡记录表 (check_in_records)
CREATE TABLE IF NOT EXISTS check_in_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  coins INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, check_in_date)
);

-- 3. 用户统计表 (user_stats)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  total_check_ins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. 已使用行动记录表 (used_actions)
CREATE TABLE IF NOT EXISTS used_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  action_title VARCHAR(255) NOT NULL,
  used_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, year, action_title)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_check_in_records_user_id ON check_in_records(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_date ON check_in_records(check_in_date);
CREATE INDEX IF NOT EXISTS idx_used_actions_user_id_year ON used_actions(user_id, year);

-- 启用行级安全 (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_actions ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户只能访问自己的数据

-- user_profiles 策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- check_in_records 策略
CREATE POLICY "Users can view own check-ins" ON check_in_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON check_in_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_stats 策略
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- used_actions 策略
CREATE POLICY "Users can view own used actions" ON used_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own used actions" ON used_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own used actions" ON used_actions
  FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
