-- 添加 username 和 avatar 列到 profiles 表
-- 用于存储用户的显示名称和头像

-- 1. 添加 username 列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- 2. 添加 avatar 列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar VARCHAR(10);

-- 3. 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. 添加注释
COMMENT ON COLUMN profiles.username IS '用户显示名称（用于排行榜等）';
COMMENT ON COLUMN profiles.avatar IS '用户头像 emoji';
