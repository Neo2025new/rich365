# 🔧 修复 Gemini API "Referrer Blocked" 错误

## 问题诊断

错误信息：
```
API_KEY_HTTP_REFERRER_BLOCKED
Requests from referer <empty> are blocked.
```

**原因**：你的 Gemini API 密钥设置了 HTTP Referrer 限制，但服务器端请求没有 referrer，导致被阻止。

---

## 解决方案 1：移除 API 密钥限制（推荐）

### 步骤：

1. **访问 Google AI Studio**
   - 打开：https://aistudio.google.com/app/apikey

2. **找到你的 API 密钥**
   - 找到密钥：`AIzaSyCfB59lWA9de_taenDSYSDbxhXS8zgBVAc`
   - 点击右侧的"编辑"按钮（铅笔图标）

3. **修改应用限制**
   - 找到 "Application restrictions"（应用限制）
   - 选择 **"None"**（无限制）
   - 或者选择 "IP addresses"（按 IP 限制）而不是 "HTTP referrers"

4. **保存更改**
   - 点击 "Save"
   - 等待几分钟让更改生效

---

## 解决方案 2：创建新的无限制 API 密钥（更快）

### 步骤：

1. **访问 Google AI Studio**
   - 打开：https://aistudio.google.com/app/apikey

2. **创建新密钥**
   - 点击 "Create API key"
   - 选择你的 Google Cloud 项目
   - 在 "Application restrictions" 选择 **"None"**

3. **复制新密钥**
   - 复制生成的 API 密钥

4. **更新项目配置**

**本地环境**：
```bash
# 更新 .env.local
GEMINI_API_KEY=你的新密钥
```

**Vercel 生产环境**：
```bash
# 删除旧密钥
echo "y" | vercel env rm GEMINI_API_KEY production

# 添加新密钥
echo "你的新密钥" | vercel env add GEMINI_API_KEY production

# 重新部署
vercel --prod --yes
```

---

## 解决方案 3：添加正确的 Referrer（如果你想保持限制）

如果你想保留 HTTP Referrer 限制，需要添加以下域名：

### 允许的 Referrer 列表：

```
# Vercel 部署域名
*.vercel.app/*
richca-*.vercel.app/*

# 你的自定义域名（如果有）
yourdomain.com/*
*.yourdomain.com/*

# 本地开发
localhost:3000/*
127.0.0.1:3000/*
```

### 设置步骤：

1. 在 API 密钥编辑页面
2. 选择 "HTTP referrers (web sites)"
3. 点击 "Add an item"
4. 添加上面的每个 referrer
5. 保存

---

## 验证修复

修改后，运行测试脚本验证：

```bash
npx tsx scripts/test-gemini.ts
```

应该看到：
```
✅ API 调用成功！
📝 响应内容: [AI 生成的内容]
✨ Gemini API 工作正常！
```

---

## 推荐设置

### 🔒 安全性最佳实践：

1. **开发环境**：使用无限制的 API 密钥
2. **生产环境**：
   - 优先使用 IP 地址限制（如果 Vercel 有固定 IP）
   - 或使用 HTTP Referrer 限制（添加你的域名）
3. **定期轮换** API 密钥

### ⚡ 快速修复（推荐）：

创建一个**无限制**的新 API 密钥，用于服务器端调用。这是最快且最简单的解决方案，因为：
- 服务器端请求本身就是安全的
- Vercel 的环境变量已经加密保护
- 不会暴露给客户端

---

## 常见问题

### Q: 移除限制安全吗？
A: 对于服务器端 API 密钥，是安全的。因为：
- 密钥存储在 Vercel 环境变量中（加密）
- 不会暴露给浏览器客户端
- 只有你的服务器代码可以访问

### Q: 修改后多久生效？
A: 通常 1-5 分钟，Google 需要时间同步配置。

### Q: 可以同时有多个 API 密钥吗？
A: 可以！建议：
- 一个用于开发（无限制）
- 一个用于生产（有限制）

---

## 下一步

修复 API 密钥限制后：
1. 在本地测试：`npx tsx scripts/test-gemini.ts`
2. 更新 Vercel 环境变量
3. 重新部署应用
4. 测试 AI 日历生成功能
