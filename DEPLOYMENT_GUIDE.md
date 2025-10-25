# 🚀 Rich365 部署指南

## ✅ 当前状态

你的代码已经成功提交到本地 Git 仓库：
- Commit: `60724f6`
- 18 个文件已修改
- 2,808 行新增代码
- 105 行删除代码

## 📋 部署前准备清单

### 1. 数据库迁移 ✅

确保你已经在 Supabase Dashboard 中执行了两个迁移脚本：

- [x] `supabase/migrations/001_create_user_profiles.sql`
- [x] `supabase/migrations/002_add_user_stats.sql`

**验证方法**：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 **Table Editor**
3. 检查 `profiles` 表是否有这些字段：
   - `user_id`, `mbti`, `role`, `goal`
   - `total_check_ins`, `current_streak`, `longest_streak`
   - `total_coins`, `badges`, `username`, `avatar`

### 2. 环境变量配置 ✅

检查你的 `.env.local` 文件包含：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🎯 部署方案选择

根据你的需求，选择以下部署方案之一：

### 方案 A：部署到 Vercel（推荐）

**优点**：
- 自动化 CI/CD
- 免费 Hobby 计划
- 与 Next.js 完美集成
- 自动 HTTPS
- 全球 CDN 加速

**步骤**：

#### 1. 创建 GitHub 仓库并推送代码

```bash
# 在 GitHub 创建一个新仓库（例如：rich365）
# 然后执行以下命令：

git remote add origin https://github.com/你的用户名/rich365.git
git branch -M main
git push -u origin main
```

#### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New... → Project**
3. 选择你的 GitHub 仓库（例如：`rich365`）
4. **Framework Preset** 选择 `Next.js`
5. 点击 **Deploy**

#### 3. 配置环境变量

部署成功后：
1. 进入项目 **Settings → Environment Variables**
2. 添加以下变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   GEMINI_API_KEY = your_gemini_api_key
   ```
3. 点击 **Redeploy** 重新部署

#### 4. 更新 Supabase 配置

1. 登录 Supabase Dashboard
2. 进入 **Authentication → URL Configuration**
3. 添加 Vercel 部署的 URL 到：
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app`

---

### 方案 B：部署到自己的服务器

**优点**：
- 完全控制
- 无供应商锁定
- 可自定义配置

**步骤**：

#### 1. 构建生产版本

```bash
npm run build
```

#### 2. 启动生产服务器

```bash
npm start
```

#### 3. 使用 PM2 保持进程运行（可选）

```bash
npm install -g pm2
pm2 start npm --name "rich365" -- start
pm2 save
pm2 startup
```

#### 4. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 方案 C：部署到其他平台

#### Railway
1. 访问 [Railway](https://railway.app/)
2. 连接 GitHub 仓库
3. 添加环境变量
4. 自动部署

#### Netlify
1. 访问 [Netlify](https://www.netlify.com/)
2. 连接 GitHub 仓库
3. 构建命令：`npm run build`
4. 发布目录：`.next`
5. 添加环境变量

---

## 🧪 部署后测试清单

部署完成后，请测试以下功能：

### 1. 认证系统 ✅
- [ ] Google 登录
- [ ] 邮箱注册
- [ ] 邮箱登录
- [ ] 退出登录

### 2. Onboarding 流程 ✅
- [ ] Step 1: MBTI 选择
- [ ] Step 2: 职业选择
- [ ] Step 3: 目标设置（可选）
- [ ] Step 4: 用户名和头像选择
- [ ] AI 日历生成（365天行动）

### 3. 日历功能 ✅
- [ ] 年度日历显示
- [ ] 月度主题显示
- [ ] 点击月份进入详情
- [ ] 每日行动显示
- [ ] 打卡按钮功能

### 4. 打卡系统 ✅
- [ ] 打卡成功显示动画
- [ ] 金币增加（+10）
- [ ] 连续天数统计
- [ ] 徽章解锁
- [ ] 防止重复打卡
- [ ] 防止未来日期打卡

### 5. 统计数据 ✅
- [ ] 用户统计卡片显示
- [ ] 连续打卡天数
- [ ] 累计金币
- [ ] 累计打卡天数
- [ ] 最长连击

### 6. 排行榜 ✅
- [ ] 连续打卡榜
- [ ] 累计行动榜
- [ ] 用户排名显示
- [ ] 自己的条目高亮
- [ ] 自动刷新（每10秒）

### 7. 数据库验证 ✅
- [ ] `profiles` 表记录正确
- [ ] `check_ins` 表记录正确
- [ ] `daily_actions` 表有 365 条记录
- [ ] 统计数据自动更新

---

## 🔧 常见问题

### Q1: Gemini API 调用失败

**原因**：API Key 未正确配置或已过期

**解决方案**：
1. 检查环境变量 `GEMINI_API_KEY` 是否正确
2. 确认 API Key 有效且有足够配额
3. 检查网络连接是否正常

### Q2: 数据库连接失败

**原因**：Supabase 配置错误或 RLS 策略问题

**解决方案**：
1. 验证 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 检查 Supabase Dashboard 中 RLS 策略是否启用
3. 确认数据库迁移已执行

### Q3: OAuth 登录失败

**原因**：Google OAuth 配置错误

**解决方案**：
1. 在 Supabase Dashboard 检查 Google OAuth 配置
2. 确认 Redirect URI 包含部署的域名
3. 检查 Google Cloud Console 中的 OAuth 配置

### Q4: 打卡功能不工作

**原因**：数据库触发器未创建或用户未登录

**解决方案**：
1. 确认已执行 `002_add_user_stats.sql` 迁移
2. 检查浏览器控制台是否有错误
3. 验证用户已登录且有有效 session

---

## 📊 性能优化建议

### 1. 启用 Vercel Analytics（可选）

```bash
npm install @vercel/analytics
```

在 `app/layout.tsx` 中添加：

```typescript
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. 添加 Supabase Connection Pooling

在 Supabase Dashboard 中：
1. 进入 **Settings → Database**
2. 启用 **Connection Pooling**
3. 使用 Pooler connection string（适用于 Serverless 环境）

### 3. 优化图片加载

所有图片已使用 Next.js `<Image>` 组件，自动优化。

### 4. 启用缓存（可选）

如果需要进一步优化，可以考虑添加 Redis 缓存或使用 React Query。

---

## 🎉 部署完成

恭喜！你的 Rich365 应用已经部署成功！

**下一步建议**：
1. 分享给朋友测试
2. 收集用户反馈
3. 持续迭代优化
4. 添加更多功能

**功能扩展方向**：
- 🔔 每日提醒推送
- 📱 PWA 支持（离线使用）
- 🎨 主题切换（暗色模式）
- 📈 数据可视化图表
- 👥 好友系统和互动
- 🏅 更多徽章和成就
- 💰 金币商城和兑换

---

**需要帮助？** 随时告诉我遇到的问题！💪
