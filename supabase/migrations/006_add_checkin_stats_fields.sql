-- ============================================================================
-- 添加打卡统计字段到 profiles 表
-- ============================================================================

-- 添加打卡统计字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_check_ins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN profiles.total_check_ins IS '总打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '总获得金币数';
COMMENT ON COLUMN profiles.badges IS '已获得的徽章ID列表';

-- 创建 check_ins 表（如果不存在）
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 每个用户每天只能打卡一次
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
COMMENT ON COLUMN check_ins.action_id IS '关联的行动ID（可选）';
COMMENT ON COLUMN check_ins.note IS '打卡备注（可选）';

-- 启用 RLS
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
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

-- 创建函数：更新打卡统计数据
CREATE OR REPLACE FUNCTION update_check_in_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_total INTEGER;
  user_current_streak INTEGER;
  user_longest_streak INTEGER;
  last_check_in_date DATE;
  current_date DATE;
BEGIN
  -- 获取用户总打卡次数
  SELECT COUNT(*) INTO user_total
  FROM check_ins
  WHERE user_id = NEW.user_id;

  -- 计算当前连续打卡天数
  current_date := NEW.date;
  user_current_streak := 1;

  LOOP
    last_check_in_date := current_date - INTERVAL '1 day';

    IF EXISTS (
      SELECT 1 FROM check_ins
      WHERE user_id = NEW.user_id AND date = last_check_in_date
    ) THEN
      user_current_streak := user_current_streak + 1;
      current_date := last_check_in_date;
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
    total_coins = user_total * 10, -- 每次打卡获得10金币
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
