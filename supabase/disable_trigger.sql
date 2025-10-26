-- ============================================
-- 临时禁用触发器的快速修复
-- 如果触发器有问题，先禁用它，让代码手动创建 profile
-- ============================================

-- 删除可能有问题的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- 删除相关函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 验证触发器已删除
SELECT
  '✅ 触发器已删除，现在新用户注册不会自动创建 profile' as status,
  '代码会在 onboarding 时手动创建 profile' as note;

-- 显示 auth.users 表上剩余的触发器（应该为空）
SELECT
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
