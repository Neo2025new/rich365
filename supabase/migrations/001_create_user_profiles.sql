-- Rich365 数据库结构
-- 创建用户配置和日历行动表

-- 1. 用户配置表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti VARCHAR(4) NOT NULL CHECK (mbti IN (
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  )),
  role VARCHAR(50) NOT NULL CHECK (role IN (
    '创业者/自雇者',
    '职场打工人',
    '创作者/内容从业者',
    '投资理财者',
    '学习者/转型者'
  )),
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户日历行动表
CREATE TABLE IF NOT EXISTS daily_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  emoji VARCHAR(10),
  theme VARCHAR(100),
  category VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_date ON daily_actions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_actions_date ON daily_actions(date);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date);

-- 5. 启用 RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 6. RLS 策略：用户只能访问自己的数据

-- Profiles 表策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily Actions 表策略
DROP POLICY IF EXISTS "Users can view own actions" ON daily_actions;
CREATE POLICY "Users can view own actions" ON daily_actions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own actions" ON daily_actions;
CREATE POLICY "Users can insert own actions" ON daily_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own actions" ON daily_actions;
CREATE POLICY "Users can update own actions" ON daily_actions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own actions" ON daily_actions;
CREATE POLICY "Users can delete own actions" ON daily_actions
  FOR DELETE USING (auth.uid() = user_id);

-- Check-ins 表策略
DROP POLICY IF EXISTS "Users can view own check-ins" ON check_ins;
CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON check_ins;
CREATE POLICY "Users can insert own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own check-ins" ON check_ins;
CREATE POLICY "Users can update own check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own check-ins" ON check_ins;
CREATE POLICY "Users can delete own check-ins" ON check_ins
  FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为 profiles 和 daily_actions 添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_actions_updated_at ON daily_actions;
CREATE TRIGGER update_daily_actions_updated_at
    BEFORE UPDATE ON daily_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 自动创建 profile 的触发器函数（当用户注册时）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 这里不自动创建 profile，让用户通过 onboarding 流程创建
  -- 但可以添加一些初始化逻辑
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 10. 创建触发器：当新用户注册时执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. 添加注释
COMMENT ON TABLE profiles IS '用户配置表：存储 MBTI、职业角色和目标';
COMMENT ON TABLE daily_actions IS '用户每日行动表：存储 AI 生成的 365 天行动计划';
COMMENT ON TABLE check_ins IS '打卡记录表：记录用户的每日打卡情况';
