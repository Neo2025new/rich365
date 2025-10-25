# Rich365 📅💰

> **搞钱行动日历** | Action to Richness
> 365天财富行动计划 - 每天行动一小步，财富增长一大步

[![Live on rich365.ai](https://img.shields.io/badge/Live%20on-rich365.ai-00D9FF?style=for-the-badge&logo=vercel)](https://rich365.ai)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

## 📖 文档导航

- 📋 **[完整产品需求文档 (PRD)](./PRODUCT_REQUIREMENTS.md)** - 详细的产品功能规划
- 📊 **[功能完成度分析](./FEATURE_STATUS.md)** - 当前进度和开发计划
- 🔧 **[登录功能设置指南](./SETUP.md)** - Supabase 配置教程

## ✨ 项目简介

Rich365 是一个融合"**自我成长 × 搞钱行动 × 游戏化激励**"的每日行动系统。

根据你的 **MBTI 人格类型**和**职业身份**，为你生成 **365 个定制化的"搞钱行动"**。通过每天坚持一个极小的积极行为（微行动），零负担培养搞钱习惯，让你通过 365 天行动，成为更会搞钱的自己！

### 💡 设计灵感

参考国外产品 [Action for Happiness](https://actionforhappiness.org)，结合中国用户的"搞钱"需求，打造一个真正能"玩出来"的个人财富成长系统。

## 🎯 核心功能

### ✅ 已完成功能（55%）

- 🧠 **个性化匹配** - 16种MBTI人格 × 5种职业身份 = 80种定制方案
- 📆 **智能行动推荐** - 200+个行动模板，365天不重复
- ✅ **打卡系统** - 每日打卡获得金币，记录成长轨迹
- 🏆 **成就徽章** - 5个成就徽章，激励持续行动
- 📊 **排行榜** - 连续打卡 & 累计打卡双榜单
- 🔐 **用户系统** - 邮箱密码登录 + Google OAuth

### 🚧 开发中功能（30%）

- 👤 **用户档案** - 头像上传、昵称设置
- 💾 **数据持久化** - Supabase 数据库集成
- 🎨 **视觉升级** - iOS 风格设计，粉色+金色配色
- ✨ **动效增强** - 打卡动画、金币掉落、徽章解锁

### 🔜 即将推出功能（15%）

- 🌳 **财富成长树** - 可视化成长过程，打卡浇水让树长大
- 📱 **今日搞钱卡片** - 一键生成精美分享卡片
- 📄 **PDF 导出** - 生成定制化 365 天行动日历
- 🎮 **游戏化升级** - 更多互动动效和激励机制

## 🚀 技术栈

### 前端
- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS 4 + Shadcn UI
- **动画**: Framer Motion
- **图表**: Recharts
- **表单**: React Hook Form + Zod

### 后端
- **认证**: Supabase Auth（邮箱密码 + Google OAuth）
- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage（头像上传）
- **实时同步**: Supabase Realtime

### 部署
- **平台**: Vercel
- **域名**: rich365.ai
- **CDN**: Vercel Edge Network

## 🌐 在线体验

**官方网站**: [https://rich365.ai](https://rich365.ai)

立即访问体验 365 天财富行动计划！

## 📦 本地安装运行

```bash
# 克隆项目
git clone <repository-url>

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🏗️ 项目结构

```
rich365/
├── app/              # Next.js App Router 页面
│   ├── page.tsx      # 首页（MBTI和职业选择）
│   ├── calendar/     # 12个月日历总览
│   ├── month/        # 单月日历视图
│   ├── day/          # 单日行动详情
│   └── leaderboard/  # 排行榜页面
├── components/       # React 组件
│   ├── ui/           # Shadcn UI 组件库
│   └── ...           # 业务组件
├── lib/              # 核心业务逻辑
│   ├── calendar-data.ts    # 行动生成算法
│   ├── checkin-data.ts     # 打卡和成就系统
│   └── leaderboard-data.ts # 排行榜数据
└── hooks/            # 自定义 React Hooks
```

## 🎨 特色亮点

1. **高度个性化** - 根据 MBTI 和职业智能匹配行动
2. **智能算法** - 365天内不重复推荐，确保内容新鲜
3. **游戏化设计** - 金币、徽章、排行榜增强参与度
4. **美观现代** - 精心设计的 UI，流畅的动画效果
5. **完全离线** - 纯前端实现，无需后端服务器

## 📝 最近更新

### v0.3.0 (2025-10-25) - 产品规划与登录系统

**🎯 产品规划**
- ✅ 研究 Action for Happiness 产品设计
- ✅ 完成详细的产品需求文档 (PRD)
- ✅ 完成功能完成度分析文档
- ✅ 制定 4 阶段开发路线图（8周计划）

**🔐 用户系统**
- ✅ Supabase 认证集成
- ✅ 邮箱密码登录/注册
- ✅ Google OAuth 登录
- ✅ 数据库表结构设计（4张表）
- ✅ 用户菜单组件
- ✅ 路由保护中间件

**📋 待完成核心功能**
- 🚧 财富成长树（P0）
- 🚧 今日搞钱卡片生成（P0）
- 🚧 用户档案（头像+昵称）
- 🚧 数据迁移到 Supabase
- 🚧 PDF 导出功能

### v0.2.0 (2025-10-25) - Bug 修复
- ✅ 修复年份硬编码问题，支持跨年使用
- ✅ 升级 React 19 依赖，解决兼容性问题
- ✅ 修复徽章推荐逻辑
- ✅ 添加 LocalStorage 错误处理
- ✅ 添加打卡日期验证
- ✅ 项目更名为 Rich365

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ by Claude Code**
