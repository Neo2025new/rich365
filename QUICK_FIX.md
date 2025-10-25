# 紧急修复生产环境

## 步骤 1：在生产环境 Supabase 刷新 Schema Cache

打开 Supabase SQL Editor（确保是生产环境的项目）：
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

执行：
```sql
-- 刷新 schema cache
NOTIFY pgrst, 'reload schema';

-- 等待 30 秒后，检查 profiles 表
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**预期结果：**
应该看到 8 个字段：
- id
- username
- avatar
- mbti
- role
- goal
- created_at
- updated_at

如果**字段不对**（比如缺少 username/avatar），说明迁移未执行。

---

## 步骤 2：如果字段不对，重新执行迁移

在**生产环境** Supabase SQL Editor 执行：

完整复制 `supabase/migrations/005_reset_and_redesign_schema.sql` 的内容并执行。

**警告：这会删除生产环境的所有数据！**

---

## 步骤 3：强制 Vercel 重新部署

1. 打开 Vercel Dashboard
2. 找到你的项目
3. 点击最新的 deployment
4. 点击右上角三个点 → "Redeploy"
5. 等待部署完成（2-3 分钟）

---

## 步骤 4：清除浏览器缓存

访问生产网站时：
1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

或者使用隐私模式访问。

---

## 步骤 5：测试

1. 访问生产网站
2. 注册新账号
3. 检查：
   - [ ] Onboarding 是 3 步
   - [ ] 无认证加载失败错误
   - [ ] 自动创建用户名

---

## 如果还是失败

请提供以下信息：
1. 生产环境 Supabase 项目 ID
2. Vercel 部署 URL
3. 浏览器控制台完整错误日志
4. Supabase logs（Dashboard → Logs）
