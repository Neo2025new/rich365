# Rich365 重构部署指南

## 📋 重构完成清单

### ✅ 已完成的改动

1. **数据库完全重置和重新设计**
   - 删除所有旧表和数据
   - 创建简洁的新 schema
   - 优化索引和约束
   - 文件：`supabase/migrations/005_reset_and_redesign_schema.sql`

2. **AuthContext 完全简化**
   - 从 408 行缩减到 155 行
   - 去掉复杂的超时重试逻辑
   - 统一使用 `getSession()`
   - 清晰的错误处理

3. **技术债务清理**
   - 删除所有 backup 文件
   - 删除诊断 API (test-login)
   - 删除旧的迁移文件

---

## 🚀 部署步骤

### 步骤 1：在 Supabase 执行数据库迁移（⚠️ 重要）

**警告：此操作会删除所有现有数据！**

1. 打开 Supabase Dashboard
   - URL: https://supabase.com/dashboard/project/rskfpbdwujtsrmvnzxyo/sql/new

2. 复制并执行以下文件的完整内容：
   - 文件位置：`supabase/migrations/005_reset_and_redesign_schema.sql`

3. 确认执行成功
   - 应该看到："Success. No rows returned"
   - 检查 Tables 菜单，确认表已重建

4. 等待 30-60 秒
   - 让 schema cache 刷新

---

### 步骤 2：测试本地环境

#### 2.1 清除浏览器缓存
```bash
# 硬刷新（重要！）
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 或者使用隐私模式
```

#### 2.2 测试注册流程
1. 访问 http://localhost:3000
2. 点击"注册"
3. 注册新账号
4. **检查：** 是否自动创建了用户名（如"用户abc12345"）

#### 2.3 测试 Onboarding
1. 注册后应自动跳转到 `/onboarding`
2. **确认：** 只有 3 步
   - 步骤 1：选择 MBTI
   - 步骤 2：选择职业
   - 步骤 3：设定目标 + 生成日历

#### 2.4 测试 AI 生成
1. 完成前两步
2. 点击"生成我的专属日历"
3. **检查：**
   - 显示进度模态框
   - 4 个阶段：准备 → 生成 → 保存 → 完成
   - 只生成 31 天（第一个月）
   - 30-60 秒内完成

#### 2.5 测试日历页面
1. 生成完成后自动跳转
2. **检查：**
   - 显示 1 月的 31 个行动
   - 每个行动有标题、描述、emoji

---

### 步骤 3：提交代码并部署

#### 3.1 查看改动
```bash
git status
```

应该看到：
- `contexts/AuthContext.tsx` (modified)
- `supabase/migrations/005_reset_and_redesign_schema.sql` (new)
- `docs/SYSTEM_ANALYSIS.md` (new)
- `docs/DEPLOYMENT_GUIDE.md` (new)
- 旧文件被删除

#### 3.2 提交改动
```bash
git add -A
git commit -m "系统性重构：简化认证，重新设计数据库，清理技术债务"
git push
```

#### 3.3 在生产环境执行数据库迁移
1. 打开生产环境 Supabase Dashboard
2. SQL Editor
3. 执行 `005_reset_and_redesign_schema.sql`
4. 等待 30-60 秒

#### 3.4 测试生产环境
- 访问生产网站
- 测试注册、登录、Onboarding
- 确认一切正常

---

## 📊 新的数据库 Schema

### profiles 表
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- 用户 ID
  username VARCHAR(50) NOT NULL,          -- 用户名（自动生成）
  avatar VARCHAR(10) NOT NULL DEFAULT '😊', -- 头像 emoji
  mbti VARCHAR(10),                       -- MBTI（onboarding中设置）
  role VARCHAR(100),                      -- 职业（onboarding中设置）
  goal TEXT,                              -- 目标（可选）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### daily_actions 表
```sql
CREATE TABLE daily_actions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  emoji VARCHAR(10) NOT NULL DEFAULT '💰',
  theme VARCHAR(50),
  category VARCHAR(50),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)  -- 每天只有一个行动
);
```

---

## 🔧 简化后的 AuthContext

**从 408 行缩减到 155 行**

**主要改动：**
- ✅ 去掉所有超时重试逻辑
- ✅ 统一使用 `getSession()`
- ✅ 简化状态管理
- ✅ 清晰的错误处理

**代码对比：**
```typescript
// ❌ 旧代码（复杂）
const CONFIG = {
  PROFILE_LOAD_TIMEOUT: 8000,
  AUTH_INIT_TIMEOUT: 15000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
}
// ... 100+ 行超时重试逻辑

// ✅ 新代码（简单）
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null)
  if (session?.user) {
    loadProfile(session.user.id)
  }
})
```

---

## 🎯 业务流程

### 注册流程
```
用户注册
  ↓
触发器自动创建 profile
  - username: "用户abc12345"
  - avatar: "😊"
  - mbti: NULL（待填）
  - role: NULL（待填）
  ↓
跳转到 /onboarding
```

### Onboarding 流程（固定 3 步）
```
步骤 1: 选择 MBTI
  ↓
步骤 2: 选择职业
  ↓
步骤 3: 设定目标（可选）+ 生成日历
  ↓
显示进度模态框（30-60秒）
  ↓
生成第一个月（31天）
  ↓
跳转到 /calendar
```

### 用户名和头像
- **注册时**：自动生成默认值
- **修改方式**：在"个人设置"页面修改（未来功能）
- **不在 Onboarding 中收集**

### AI 生成策略
- **初次生成**：只生成第一个月（31天）
- **后续生成**：用户可在日历页面按需生成其他月份
- **预计时间**：30-60 秒

---

## ⚠️ 注意事项

1. **数据会被清空**
   - 执行迁移后，所有旧数据将被删除
   - 用户需要重新注册

2. **浏览器缓存**
   - 必须清除缓存才能看到新代码
   - 建议使用隐私模式测试

3. **Schema Cache**
   - 执行迁移后等待 30-60 秒
   - 如果仍有问题，执行 `NOTIFY pgrst, 'reload schema';`

4. **环境变量**
   - 确认 `.env.local` 中的 Supabase 配置正确
   - 确认 `GEMINI_API_KEY` 有效

---

## 🐛 常见问题

### 问题 1：登录后看不到用户名
**原因**：Profile 触发器未执行或数据库未刷新
**解决**：
1. 检查 Supabase → Database → Triggers
2. 确认 `on_auth_user_created` 触发器存在
3. 等待 30 秒或刷新 schema

### 问题 2：生成日历失败
**原因**：Gemini API 配置问题
**解决**：
1. 检查 `.env.local` 中的 `GEMINI_API_KEY`
2. 查看浏览器控制台错误
3. 检查 Gemini API 配额

### 问题 3：仍然看到 AuthSessionMissingError
**原因**：浏览器使用了旧的 JavaScript 代码
**解决**：
1. 硬刷新（Ctrl/Cmd + Shift + R）
2. 清除浏览器缓存
3. 使用隐私模式

---

## ✅ 验收标准

部署成功的标志：

- ✅ 用户可以成功注册
- ✅ 注册后自动创建用户名（"用户xxx"）
- ✅ Onboarding 只有 3 步
- ✅ AI 生成显示进度模态框
- ✅ 只生成 31 天（第一个月）
- ✅ 日历页面正常显示
- ✅ 无 AuthSessionMissingError 错误

---

## 📞 如果遇到问题

1. 查看浏览器控制台（F12 → Console）
2. 查看 Supabase Logs
3. 查看完整的错误堆栈
4. 联系开发者

---

## 🎉 重构完成！

**改进总结：**
- 🚀 代码从 408 行缩减到 155 行（简化 62%）
- 🗄️ 数据库 schema 清晰、规范
- 🧪 业务流程固定、明确
- 🧹 技术债务完全清理

**下一步：**
- 按照本指南执行部署
- 测试完整流程
- 收集用户反馈
- 继续迭代优化
