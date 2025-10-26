-- 在 user_profiles 表中添加 username 和 avatar 字段
-- 用于排行榜和用户个人信息显示

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 为现有用户设置默认值
UPDATE user_profiles
SET
  username = COALESCE(username, '用户' || SUBSTRING(user_id::text, 1, 8)),
  avatar = COALESCE(avatar, '😊')
WHERE username IS NULL OR avatar IS NULL;

SELECT '✅ username 和 avatar 字段已添加到 user_profiles 表' as status;
