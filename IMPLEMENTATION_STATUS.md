# Rich365 优化实施进度

## ✅ 已完成的工作

### 1. 深度项目分析
- ✅ 完整分析了项目结构和所有页面
- ✅ 识别了 4 个核心问题：
  1. 认证与用户状态管理混乱
  2. 缺少统一导航栏
  3. 日历不是 AI 生成的
  4. 数据持久化缺失
- ✅ 创建了详细的优化方案文档 (`OPTIMIZATION_PLAN.md`)

### 2. 数据库设计
- ✅ 创建了 Supabase 数据表结构 SQL
  - `profiles` 表：存储用户 MBTI、职业、目标
  - `daily_actions` 表：存储 AI 生成的 365 天行动
  - `check_ins` 表：记录用户打卡
  - 完整的 RLS 策略保护用户数据
  - 自动更新时间戳触发器

**文件**: `supabase/migrations/001_create_user_profiles.sql`

### 3. 统一认证管理
- ✅ 创建了 `AuthContext` (`contexts/AuthContext.tsx`)
- **功能**:
  - 统一管理用户登录状态
  - 自动从 Supabase 加载用户 profile
  - 向后兼容 localStorage（过渡期）
  - 提供 `useAuth()` hook 供所有页面使用
  - 支持 profile 更新和刷新

### 4. 全局导航组件
- ✅ 创建了 `AppHeader` 组件 (`components/app-header.tsx`)
- **功能**:
  - 固定顶部导航栏
  - 日历 / 排行榜 导航链接
  - 用户信息下拉菜单
  - 显示 MBTI 和职业
  - 退出登录功能
  - 在首页/登录页/Onboarding 页自动隐藏

### 5. 根布局更新
- ✅ 修改了 `app/layout.tsx`
- 集成 `AuthProvider` 包裹整个应用
- 添加 `AppHeader` 全局导航
- 添加 `Toaster` 用于通知

---

## 🚧 待完成的工作

### 第一优先级 (P0) - 需要立即完成

#### 1. 执行数据库迁移
**操作步骤**:
1. 登录 Supabase Dashboard
2. 进入项目的 SQL Editor
3. 复制 `supabase/migrations/001_create_user_profiles.sql` 的内容
4. 执行 SQL 创建表和策略

#### 2. 修改 Calendar 页面使用 AuthContext
当前 `app/calendar/page.tsx:15-26` 直接读取 localStorage，需要改为：

```typescript
import { useAuth } from "@/contexts/AuthContext"

export default function CalendarPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()  // ← 使用 useAuth

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/onboarding")
    }
  }, [profile, loading, router])

  if (loading) {
    return <LoadingScreen />
  }

  if (!profile) {
    return null
  }

  // ... 其余代码
}
```

#### 3. 修改 Leaderboard 页面
同样需要使用 useAuth 替换 localStorage

#### 4. 修改 Day 和 Month 页面
这两个页面也需要集成 useAuth

#### 5. 修改 Onboarding 完成逻辑
当前 `app/onboarding/page.tsx:69-86` 只保存到 localStorage，需要改为：

```typescript
import { useAuth } from "@/contexts/AuthContext"

const { user, updateProfile } = useAuth()

const handleComplete = async () => {
  if (!selectedMBTI || !selectedRole) return

  const profileData = {
    mbti: selectedMBTI,
    role: selectedRole,
    goal: goal || undefined,
  }

  try {
    // 使用 AuthContext 的 updateProfile，会自动处理 Supabase 或 LocalStorage
    await updateProfile(profileData)

    if (user) {
      // 已登录用户：生成 AI 日历
      // TODO: 调用 AI 生成服务
      router.push("/calendar")
    } else {
      // 未登录用户：提示登录
      // TODO: 显示弹窗引导登录/注册
      router.push("/calendar")  // 暂时允许使用
    }
  } catch (error) {
    console.error("保存 profile 失败:", error)
    alert("保存失败，请重试")
  }
}
```

---

### 第二优先级 (P1) - 核心功能

#### 6. 实现完整的 AI 日历生成服务

创建 `lib/gemini-calendar.ts`:

```typescript
import { createClient } from "@/lib/supabase/client"
import { genAI } from "@/lib/gemini"
import { UserProfile, mbtiData } from "@/lib/calendar-data"

export async function generateFullYearCalendar(
  userId: string,
  profile: UserProfile
): Promise<void> {
  const year = new Date().getFullYear()

  // 构建详细的 prompt
  const prompt = `你是专业的财富增长顾问...
  用户：${profile.mbti}、${profile.role}、目标：${profile.goal}

  请生成 365 个每日搞钱行动，JSON 格式：
  [{ date, title, description, emoji, theme, category }, ...]`

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const actions = JSON.parse(cleanedText)

  // 保存到 Supabase
  const supabase = createClient()

  for (const action of actions) {
    await supabase.from('daily_actions').insert({
      user_id: userId,
      date: action.date,
      title: action.title,
      description: action.description,
      emoji: action.emoji,
      theme: action.theme,
      category: action.category,
    })
  }
}
```

#### 7. 修改 Calendar 页面从数据库读取

```typescript
const [hasActions, setHasActions] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)

useEffect(() => {
  if (user && profile) {
    checkAndGenerateActions()
  }
}, [user, profile])

const checkAndGenerateActions = async () => {
  const { count } = await supabase
    .from('daily_actions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count === 0) {
    // 首次使用，生成 AI 日历
    setIsGenerating(true)
    await generateFullYearCalendar(user.id, profile)
    setIsGenerating(false)
  }

  setHasActions(true)
}
```

---

## 📊 进度总结

### 基础设施层 (40%)
- ✅ 数据库设计 (100%)
- ✅ AuthContext (100%)
- ✅ 全局 Header (100%)
- ⏳ 数据库表创建 (0%)
- ⏳ 页面集成 Auth (0%)

### 功能层 (0%)
- ⏳ AI 日历生成 (0%)
- ⏳ Onboarding 流程优化 (0%)
- ⏳ 数据迁移 (0%)

### 总体进度：**20%**

---

## 🎯 下一步行动

### 今天必须完成 (高优先级):
1. **执行数据库迁移** (10分钟)
   - 在 Supabase Dashboard 执行 SQL

2. **修改 Calendar 页面** (20分钟)
   - 集成 useAuth
   - 移除 localStorage 依赖

3. **修改 Leaderboard/Day/Month 页面** (30分钟)
   - 同样集成 useAuth

4. **测试基础流程** (15分钟)
   - 登录 → 查看 Calendar
   - Onboarding → 保存到 Supabase

### 明天完成 (中优先级):
5. **实现 AI 日历生成** (2小时)
   - 创建 gemini-calendar.ts
   - 修改 Onboarding 调用

6. **优化 Onboarding 流程** (1小时)
   - 添加登录/注册引导
   - 生成 AI 日历

### 后续优化 (低优先级):
7. 性能优化
8. 错误处理
9. UI/UX 改进

---

## 🔧 测试清单

完成上述工作后，需要测试以下场景：

### 场景 1: 新用户首次使用
- [ ] Landing Page → Onboarding
- [ ] 选择 MBTI + 职业 + 目标
- [ ] 保存成功（检查 Supabase profiles 表）
- [ ] 跳转到 Calendar
- [ ] Header 显示用户信息

### 场景 2: 已登录用户
- [ ] Landing Page → Login
- [ ] 登录成功后自动加载 profile
- [ ] Calendar 显示用户数据
- [ ] Header 显示正确的 MBTI 和职业

### 场景 3: 跨页面导航
- [ ] Calendar → Leaderboard (Header 导航)
- [ ] Header 在所有页面正常显示
- [ ] 用户下拉菜单功能正常

### 场景 4: 退出登录
- [ ] 点击退出登录
- [ ] 清除状态
- [ ] 跳转回首页

---

## 📝 技术债务

1. **LocalStorage 迁移**
   - 当前 AuthContext 同时支持 Supabase 和 LocalStorage
   - 未来需要迁移所有 LocalStorage 数据到 Supabase
   - 添加数据迁移提示

2. **错误处理**
   - 目前缺少网络错误处理
   - 需要添加 loading 状态
   - 需要用户友好的错误提示

3. **性能优化**
   - AuthContext 可以添加缓存
   - 减少不必要的 Supabase 查询
   - 优化 AI 生成性能

---

## 🎉 预期成果

完成所有优化后，项目将实现：

1. **统一的认证系统**
   - 所有数据存储在 Supabase
   - 跨设备同步
   - 安全的 RLS 策略

2. **完整的导航体验**
   - 全局 Header
   - 清晰的页面跳转
   - 用户信息展示

3. **真正的 AI 功能**
   - 365 天行动由 Gemini AI 生成
   - 基于用户目标个性化
   - 保存在数据库中

4. **流畅的用户流程**
   - Onboarding → (可选)登录 → AI 生成 → Calendar
   - 无缝的体验

**总预计开发时间**: 1-2 天
**当前剩余时间**: 约 6-8 小时

---

现在最紧急的任务是：**在 Supabase Dashboard 执行数据库迁移 SQL**，然后开始修改页面集成 AuthContext。

准备好了吗？我可以继续帮你完成剩余的工作！
