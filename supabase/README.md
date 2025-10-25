# Supabase 设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 等待项目初始化完成

## 2. 获取环境变量

1. 在 Supabase 项目中，点击 `Settings` > `API`
2. 复制以下信息：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. 配置环境变量

1. 在项目根目录创建 `.env.local` 文件
2. 添加以下内容：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**生产环境** 需要在 Vercel 中配置：
- `NEXT_PUBLIC_SITE_URL=https://rich365.ai`

## 4. 创建数据库表

1. 在 Supabase 项目中，点击 `SQL Editor`
2. 创建新查询
3. 复制 `supabase/schema.sql` 文件的全部内容
4. 粘贴并运行 SQL

## 5. 配置 Google OAuth（可选）

### 5.1 获取 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：Web 应用
   - 授权重定向 URI：
     - 开发环境：`http://localhost:3000/auth/callback`
     - 生产环境：`https://rich365.ai/auth/callback`
     - Supabase 回调：`https://<your-project-ref>.supabase.co/auth/v1/callback`

5. 复制 `Client ID` 和 `Client Secret`

### 5.2 在 Supabase 中配置 Google Provider

1. 在 Supabase 项目中，点击 `Authentication` > `Providers`
2. 找到 Google 并启用
3. 填入：
   - Client ID
   - Client Secret
4. 保存

## 6. 配置邮箱认证

Supabase 默认启用邮箱认证，但你可以自定义：

1. 点击 `Authentication` > `Email Templates`
2. 自定义确认邮件、重置密码邮件等

## 7. 测试认证

1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3000/login`
3. 测试邮箱注册/登录
4. 测试 Google 登录

## 8. 部署到生产环境

### Vercel 环境变量配置

在 Vercel 项目设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://rich365.ai
```

### Supabase 生产环境 URL 配置

1. 在 Supabase 项目中，点击 `Authentication` > `URL Configuration`
2. 添加 `Site URL`: `https://rich365.ai`
3. 添加 `Redirect URLs`:
   - `https://rich365.ai/**`
   - `https://rich365.ai/auth/callback`

## 常见问题

### Q: 邮箱确认邮件没有收到？
A: 检查垃圾邮件文件夹，或在 Supabase 中禁用邮箱确认（开发环境）

### Q: Google 登录报错 redirect_uri_mismatch？
A: 确保 Google Console 中的回调 URI 与实际 URI 完全匹配

### Q: 用户数据没有保存？
A: 检查 RLS 策略是否正确配置，确保用户有权限访问自己的数据

## 数据库结构

- **user_profiles**: 用户 MBTI 和职业配置
- **check_in_records**: 打卡记录
- **user_stats**: 用户统计（打卡次数、连续天数等）
- **used_actions**: 已使用的行动（用于去重）

所有表都启用了行级安全（RLS），用户只能访问自己的数据。
