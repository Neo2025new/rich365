-- ============================================
-- 数据库诊断脚本
-- 用于检查当前数据库状态
-- ============================================

-- 检查所有表
SELECT
  '=== 数据库中的所有表 ===' as info;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 检查 user_profiles 表结构
SELECT
  '=== user_profiles 表结构 ===' as info;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 检查所有触发器
SELECT
  '=== 所有触发器 ===' as info;

SELECT
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 检查 auth.users 上的触发器
SELECT
  '=== auth.users 表上的触发器 ===' as info;

SELECT
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 检查所有函数
SELECT
  '=== 所有自定义函数 ===' as info;

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 检查 RLS 策略
SELECT
  '=== user_profiles 表的 RLS 策略 ===' as info;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
