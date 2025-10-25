-- 添加用户统计字段到 profiles 表
-- 用于存储打卡统计、徽章等信息

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_check_ins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- 添加头像和用户名（用于排行榜显示）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar VARCHAR(10) DEFAULT '⭐';

-- 添加索引以提升排行榜查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_check_ins ON profiles(total_check_ins DESC);

-- 允许所有用户查看其他用户的排行榜数据（但不能查看目标等私密信息）
DROP POLICY IF EXISTS "Users can view leaderboard data" ON profiles;
CREATE POLICY "Users can view leaderboard data" ON profiles
  FOR SELECT USING (true);

-- 添加注释
COMMENT ON COLUMN profiles.total_check_ins IS '总打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '累计金币数';
COMMENT ON COLUMN profiles.badges IS '已获得的徽章 ID 数组';
COMMENT ON COLUMN profiles.username IS '用户名（用于排行榜显示）';
COMMENT ON COLUMN profiles.avatar IS '头像表情（用于排行榜显示）';

-- 创建统计更新函数
CREATE OR REPLACE FUNCTION update_user_stats_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  consecutive_days INTEGER;
  yesterday DATE;
BEGIN
  -- 更新总打卡次数和金币
  UPDATE profiles
  SET
    total_check_ins = total_check_ins + 1,
    total_coins = total_coins + 10
  WHERE id = NEW.user_id;

  -- 计算连续打卡天数
  yesterday := NEW.date - INTERVAL '1 day';

  SELECT COUNT(*) INTO consecutive_days
  FROM generate_series(
    (SELECT MIN(date) FROM check_ins WHERE user_id = NEW.user_id),
    NEW.date,
    '1 day'::interval
  ) AS expected_date
  WHERE EXISTS (
    SELECT 1 FROM check_ins
    WHERE user_id = NEW.user_id
    AND date = expected_date::date
  );

  -- 更新连续天数和最长连续天数
  UPDATE profiles
  SET
    current_streak = consecutive_days,
    longest_streak = GREATEST(longest_streak, consecutive_days)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：打卡时自动更新统计
DROP TRIGGER IF EXISTS update_stats_on_checkin ON check_ins;
CREATE TRIGGER update_stats_on_checkin
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_checkin();
