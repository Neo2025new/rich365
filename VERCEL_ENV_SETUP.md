# 🔑 Vercel 环境变量配置指南

## ✅ 当前部署状态

你的项目已成功部署到 Vercel！🎉

- **项目名称**: richca
- **最新部署**: https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app
- **构建状态**: ✅ Ready
- **构建时间**: 26秒

---

## 🚨 重要：添加环境变量（必须完成）

你的应用目前还无法正常工作，因为缺少必要的环境变量。请按照以下步骤添加：

### 方法 1：通过 Vercel Dashboard（推荐）

#### 步骤 1：访问项目设置

1. 打开浏览器，访问：https://vercel.com/dashboard
2. 找到并点击项目 **richca**
3. 点击顶部菜单的 **Settings**
4. 在左侧菜单找到 **Environment Variables**

#### 步骤 2：添加以下 4 个环境变量

**1. NEXT_PUBLIC_SUPABASE_URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://rskfpbdwujtsmrvnzxyo.supabase.co
Environment: Production, Preview, Development (全选)
```

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJza2ZwYmR3dWp0c3Jtdm56eHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTUwNjQsImV4cCI6MjA3Njk3MTA2NH0.DKpxKGkEFaVWqtv2DDqjy1oXDgcZ1Vk2TYpsIxLv8F8
Environment: Production, Preview, Development (全选)
```

**3. NEXT_PUBLIC_SITE_URL**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app
Environment: Production
```

**注意**: 如果你有自定义域名，请使用自定义域名替换上面的 URL。

**4. GEMINI_API_KEY**
```
Name: GEMINI_API_KEY
Value: AIzaSyC84ER7aCMRQhC3jQ4chUVSTcrqbO7uUFg
Environment: Production, Preview, Development (全选)
```

#### 步骤 3：重新部署

添加完所有环境变量后：
1. 返回项目主页
2. 点击 **Deployments** 标签
3. 找到最新的部署（最上面那个）
4. 点击右侧的 **⋯** 菜单
5. 选择 **Redeploy**
6. 等待重新部署完成（约 1-2 分钟）

---

### 方法 2：通过 Vercel CLI

如果你喜欢使用命令行，可以使用以下命令：

```bash
# 添加 NEXT_PUBLIC_SUPABASE_URL
echo "https://rskfpbdwujtsmrvnzxyo.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# 添加 NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJza2ZwYmR3dWp0c3Jtdm56eHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTUwNjQsImV4cCI6MjA3Njk3MTA2NH0.DKpxKGkEFaVWqtv2DDqjy1oXDgcZ1Vk2TYpsIxLv8F8" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 添加 NEXT_PUBLIC_SITE_URL
echo "https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app" | vercel env add NEXT_PUBLIC_SITE_URL production

# 添加 GEMINI_API_KEY
echo "AIzaSyC84ER7aCMRQhC3jQ4chUVSTcrqbO7uUFg" | vercel env add GEMINI_API_KEY production

# 重新部署
vercel --prod --yes
```

---

## 🔗 更新 Supabase Redirect URLs（必须完成）

添加环境变量后，你还需要在 Supabase 中配置 OAuth 重定向 URL：

### 步骤：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单 **Authentication** → **URL Configuration**
4. 在 **Site URL** 中填入：
   ```
   https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app
   ```

5. 在 **Redirect URLs** 中添加（每行一个）：
   ```
   https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app
   https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app/auth/callback
   https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app/*
   ```

6. 点击 **Save** 保存

---

## ✅ 验证部署

完成上述所有步骤后，访问你的应用：

🌐 **生产环境 URL**: https://richca-cdbe2orqs-neos-projects-9448fe10.vercel.app

### 测试清单：

- [ ] 访问首页，是否正常加载
- [ ] 点击 "开始搞钱"，是否跳转到登录页
- [ ] 尝试 Google 登录
- [ ] 尝试邮箱注册/登录
- [ ] 完成 Onboarding 流程（MBTI、职业、目标、用户名头像）
- [ ] 检查 AI 是否成功生成 365 天行动
- [ ] 查看年度日历
- [ ] 点击月份查看详情
- [ ] 点击某一天查看行动
- [ ] 尝试打卡功能
- [ ] 查看用户统计数据
- [ ] 访问排行榜页面

---

## 🎯 自定义域名（可选）

如果你想使用自己的域名（例如：rich365.com），可以：

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 **Domains**
3. 添加你的域名
4. 按照 Vercel 的指引配置 DNS
5. 更新 Supabase 的 Redirect URLs

---

## 🐛 常见问题

### Q1: 部署后页面显示空白或报错

**原因**: 环境变量未正确配置

**解决方案**:
1. 检查 Vercel Dashboard 中的环境变量是否都已添加
2. 确认值没有多余的空格或引号
3. 重新部署项目

### Q2: Google 登录失败

**原因**: Supabase Redirect URLs 未配置

**解决方案**:
1. 在 Supabase Dashboard 中添加 Vercel 部署的 URL
2. 确保格式正确（包含 https://）
3. 保存后等待 1-2 分钟生效

### Q3: AI 日历生成失败

**原因**: Gemini API Key 未配置或无效

**解决方案**:
1. 检查 `GEMINI_API_KEY` 环境变量
2. 确认 API Key 有效且有足够配额
3. 在 [Google AI Studio](https://makersuite.google.com/app/apikey) 验证 API Key

### Q4: 数据库连接失败

**原因**: Supabase 配置错误

**解决方案**:
1. 验证 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 确认已执行数据库迁移脚本
3. 检查 Supabase 项目是否正常运行

---

## 📊 监控和日志

### 查看部署日志：

```bash
vercel logs richca-cdbe2orqs-neos-projects-9448fe10.vercel.app
```

### 查看实时日志：

```bash
vercel logs richca-cdbe2orqs-neos-projects-9448fe10.vercel.app --follow
```

---

## 🎉 恭喜！

完成上述配置后，你的 Rich365 应用就可以正式上线使用了！

**下一步建议**:
1. 分享给朋友测试
2. 收集用户反馈
3. 监控应用性能和错误
4. 持续迭代优化

---

**需要帮助？** 随时告诉我遇到的问题！💪
