-- 清理所有用户数据（开发/测试用）
-- ⚠️ 警告：此脚本会删除所有用户数据，仅用于开发和测试环境

-- 1. 删除所有打卡记录
DELETE FROM check_ins;

-- 2. 删除所有每日行动
DELETE FROM daily_actions;

-- 3. 删除所有用户配置
DELETE FROM profiles;

-- 4. 重置序列（如果有的话）
-- PostgreSQL 的 UUID 不需要重置序列

-- 显示清理结果
SELECT
  (SELECT COUNT(*) FROM check_ins) as check_ins_count,
  (SELECT COUNT(*) FROM daily_actions) as daily_actions_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count;

-- 注意：
-- 1. 此脚本不会删除 auth.users 表中的用户账号
-- 2. 如果需要完全清理，请在 Supabase 控制台的 Authentication 页面手动删除用户
-- 3. 或者使用 Supabase Dashboard > Authentication > Users 批量删除
