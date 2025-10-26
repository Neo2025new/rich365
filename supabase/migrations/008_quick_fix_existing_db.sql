-- ============================================================================
-- Rich365 快速修复脚本（保留现有数据）
-- 只添加缺失的字段和功能，不删除数据
-- ============================================================================

-- 第 1 步：添加缺失的字段到 profiles 表
DO $$
BEGIN
    -- 添加打卡统计字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'total_check_ins') THEN
        ALTER TABLE profiles ADD COLUMN total_check_ins INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'current_streak') THEN
        ALTER TABLE profiles ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'longest_streak') THEN
        ALTER TABLE profiles ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'total_coins') THEN
        ALTER TABLE profiles ADD COLUMN total_coins INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'badges') THEN
        ALTER TABLE profiles ADD COLUMN badges TEXT[] NOT NULL DEFAULT '{}';
    END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN profiles.total_check_ins IS '总打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '总获得金币数';
COMMENT ON COLUMN profiles.badges IS '已获得的徽章ID列表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_total_check_ins ON profiles(total_check_ins);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak);

-- 第 2 步：创建 check_ins 表（如果不存在）
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(date);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date);

-- 添加注释
COMMENT ON TABLE check_ins IS '用户打卡记录表';
COMMENT ON COLUMN check_ins.user_id IS '用户ID';
COMMENT ON COLUMN check_ins.date IS '打卡日期';

-- 第 3 步：启用 RLS（如果未启用）
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户只能查看自己的打卡记录" ON check_ins;
DROP POLICY IF EXISTS "用户只能创建自己的打卡记录" ON check_ins;
DROP POLICY IF EXISTS "用户只能更新自己的打卡记录" ON check_ins;
DROP POLICY IF EXISTS "用户只能删除自己的打卡记录" ON check_ins;

-- 创建新的 RLS 策略
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

-- 第 4 步：创建或更新触发器函数
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
  SELECT COALESCE(GREATEST(current_streak, user_current_streak), user_current_streak)
  INTO user_longest_streak
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

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_stats_after_check_in ON check_ins;

-- 创建新触发器
CREATE TRIGGER update_stats_after_check_in
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_check_in_stats();

-- 第 5 步：刷新 PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 完成！
SELECT 'Database quick fix completed successfully!' as message;
