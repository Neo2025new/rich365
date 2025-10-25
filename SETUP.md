# Rich365 登录功能设置指南

## 📋 概述

Rich365 现已支持用户登录功能，使用 **Supabase** 作为认证和数据库服务。

支持的登录方式：
- ✉️ **邮箱密码登录/注册**
- 🔐 **Google OAuth 登录**

## 🚀 快速开始

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册/登录
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `rich365`
   - Database Password: 设置一个强密码（请保存好）
   - Region: 选择离你最近的区域
4. 点击 "Create new project" 并等待初始化完成

### 步骤 2: 获取 API 密钥

1. 在 Supabase 项目中，点击左侧菜单的 `Settings` (齿轮图标)
2. 点击 `API`
3. 找到并复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤 3: 配置环境变量

创建 `.env.local` 文件（在项目根目录）：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=你的_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**注意**: `.env.local` 已在 `.gitignore` 中，不会被提交到 git。

### 步骤 4: 创建数据库表

1. 在 Supabase 项目中，点击左侧菜单的 `SQL Editor`
2. 点击 "+ New query"
3. 打开 `supabase/schema.sql` 文件
4. 复制全部内容并粘贴到 SQL Editor
5. 点击 "Run" 执行 SQL

这将创建以下表：
- `user_profiles`: 用户 MBTI 和职业配置
- `check_in_records`: 打卡记录
- `user_stats`: 用户统计数据
- `used_actions`: 已使用的行动记录

### 步骤 5: 配置 Google OAuth（可选）

#### 5.1 获取 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 "Google+ API"
4. 前往 "APIs & Services" > "Credentials"
5. 点击 "+ CREATE CREDENTIALS" > "OAuth client ID"
6. 选择 "Web application"
7. 填写信息：
   - Name: `Rich365`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (开发)
     - `https://rich365.ai` (生产)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://rich365.ai/auth/callback`
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
8. 复制 **Client ID** 和 **Client Secret**

#### 5.2 在 Supabase 中配置 Google

1. 在 Supabase 项目中，点击 `Authentication` > `Providers`
2. 找到 "Google" 并点击展开
3. 启用 "Google enabled"
4. 填入：
   - Client ID (从 Google 获取)
   - Client Secret (从 Google 获取)
5. 点击 "Save"

### 步骤 6: 测试登录功能

1. 启动开发服务器：
```bash
npm run dev
```

2. 访问 http://localhost:3000

3. 点击右上角的"登录"按钮

4. 尝试：
   - 邮箱注册（会收到确认邮件）
   - 邮箱登录
   - Google 登录

## 🌍 生产环境部署

### Vercel 环境变量配置

1. 访问 Vercel 项目设置
2. 前往 "Settings" > "Environment Variables"
3. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=你的_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
NEXT_PUBLIC_SITE_URL=https://rich365.ai
```

4. 重新部署项目

### Supabase URL 配置

1. 在 Supabase 项目中，点击 `Authentication` > `URL Configuration`
2. 设置：
   - **Site URL**: `https://rich365.ai`
   - **Redirect URLs**: 添加以下 URL
     - `https://rich365.ai/**`
     - `https://rich365.ai/auth/callback`
3. 点击 "Save"

## ❓ 常见问题

### Q: 邮箱确认邮件没有收到？

**A**:
- 检查垃圾邮件文件夹
- 开发环境可以在 Supabase 中禁用邮箱确认：
  - 前往 `Authentication` > `Providers` > `Email`
  - 禁用 "Confirm email"

### Q: Google 登录显示 redirect_uri_mismatch？

**A**: 确保 Google Console 中配置的回调 URI 与实际使用的完全匹配，包括：
- http vs https
- localhost vs 域名
- 端口号

### Q: 登录后跳转到 404？

**A**: 检查 middleware.ts 配置，确保路由保护正确

### Q: 数据没有保存到数据库？

**A**:
- 检查 RLS 策略是否正确配置
- 确保用户已登录
- 检查浏览器 Console 是否有错误

## 📁 项目结构

```
rich365/
├── lib/supabase/
│   ├── client.ts          # 浏览器端 Supabase 客户端
│   ├── server.ts          # 服务器端 Supabase 客户端
│   └── middleware.ts      # 认证中间件
├── app/
│   ├── login/             # 登录页面
│   │   └── page.tsx
│   └── auth/
│       └── callback/      # OAuth 回调处理
│           └── route.ts
├── components/
│   └── user-menu.tsx      # 用户菜单组件
├── supabase/
│   ├── schema.sql         # 数据库结构
│   └── README.md          # Supabase 设置详细说明
├── middleware.ts          # Next.js 中间件（路由保护）
└── .env.local.example     # 环境变量示例
```

## 🔐 安全性

- ✅ 所有数据表启用行级安全（RLS）
- ✅ 用户只能访问自己的数据
- ✅ 密码使用 bcrypt 加密
- ✅ OAuth 使用 PKCE 流程
- ✅ JWT Token 自动刷新

## 📚 更多资源

- [Supabase 文档](https://supabase.com/docs)
- [Next.js + Supabase 集成](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Google OAuth 设置](https://support.google.com/cloud/answer/6158849)

## 💡 提示

- 在 Supabase 中可以查看实时用户和数据
- 建议在生产环境配置邮件模板
- 可以添加更多 OAuth 提供商（GitHub、Facebook 等）
- 记得定期备份数据库

---

**需要帮助？** 查看 `supabase/README.md` 获取更详细的配置说明。
