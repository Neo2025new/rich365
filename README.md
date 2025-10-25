# Rich365 📅💰

> 365天财富行动计划 - 每天行动一小步，财富增长一大步

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://richca-liobo5lyr-neos-projects-9448fe10.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)

## ✨ 项目简介

Rich365 是一个个性化的财富行动计划应用，根据你的 MBTI 人格类型和职业身份，为你生成 365 个定制化的"搞钱行动"。通过每天坚持一个小行动，帮助你培养财富思维和行动习惯，实现财务自由。

## 🎯 核心功能

- 🧠 **个性化匹配** - 16种MBTI人格 × 5种职业身份 = 80种定制方案
- 📆 **智能行动推荐** - 200+个行动模板，365天不重复
- ✅ **打卡系统** - 每日打卡获得金币，记录成长轨迹
- 🏆 **成就徽章** - 5个成就徽章，激励持续行动
- 📊 **排行榜** - 连续打卡 & 累计打卡双榜单
- 📸 **分享卡片** - 将每日行动生成精美图片分享

## 🚀 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS + Shadcn UI
- **动画**: Framer Motion
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **存储**: LocalStorage (纯前端应用)
- **部署**: Vercel

## 📦 安装运行

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

### v0.2.0 (2025-10-25)
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
