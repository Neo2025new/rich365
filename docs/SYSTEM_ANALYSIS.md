# Rich365 系统分析与重构方案

## 📊 当前问题分析

### 1. 认证系统问题

**问题描述：**
- ❌ 用户无法登录（AuthSessionMissingError）
- ❌ AuthContext 过度复杂（超时、重试、localStorage 备份）
- ❌ 多处调用 getUser/getSession 不一致
- ❌ 用户状态不稳定，一直出现问题

**根本原因：**
- 过度设计：引入了复杂的超时重试机制
- 状态管理混乱：Supabase session + localStorage + React state
- API 使用错误：getUser() vs getSession() 混用

### 2. 数据库设计问题

**当前 profiles 表结构：**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  mbti VARCHAR,          -- MBTI 人格类型
  role VARCHAR,          -- 职业身份
  goal TEXT,             -- 个人目标（可选）
  username VARCHAR(100), -- 用户名（后加的）
  avatar VARCHAR(10),    -- 头像 emoji（后加的）
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**问题：**
- ❌ 字段不断增加，缺少初期规划
- ❌ 没有明确的必填/可选字段约束
- ❌ username/avatar 是后加的，导致现有数据为 NULL
- ❌ 触发器自动生成随机值，增加复杂度
- ❌ 缺少数据完整性验证

### 3. 业务流程问题

**当前流程：**
```
注册 → Onboarding(3步/4步?)
  → MBTI → 职业 → 目标 → (用户名/头像?)
  → AI 生成(365天?/31天?)
  → 日历页面
```

**问题：**
- ❌ Onboarding 步骤一直在改（4步→3步）
- ❌ 用户名/头像：自动生成？用户输入？不确定
- ❌ AI 生成：全量（365天）还是渐进式（31天）？不确定
- ❌ 新用户默认状态不明确

### 4. 技术债务

**累积的问题：**
- 大量 backup 文件（page.tsx.backup）
- 诊断 API（test-login）
- 临时修复代码
- 过时的注释和代码

---

## 🎯 重构目标

### 目标 1：简单可靠的认证
- ✅ 用户能够稳定登录/登出
- ✅ 状态管理清晰、可预测
- ✅ 错误处理明确、易调试

### 目标 2：清晰的数据模型
- ✅ 数据库 schema 一次性设计到位
- ✅ 明确必填/可选字段
- ✅ 数据完整性约束
- ✅ 合理的默认值策略

### 目标 3：明确的业务流程
- ✅ Onboarding 步骤固定
- ✅ 用户体验流畅
- ✅ 生成策略清晰

### 目标 4：清理技术债务
- ✅ 删除无用代码和文件
- ✅ 统一代码风格
- ✅ 完善错误处理

---

## 💡 重构方案

### 方案 A：最小化重构（推荐，快速修复）

**核心思路：**
- 简化认证系统（去掉复杂的超时重试）
- 统一使用 getSession()
- 固定 Onboarding 流程
- 数据库字段设置合理默认值

**优点：**
- ✅ 快速见效（1-2 小时）
- ✅ 风险低
- ✅ 保留现有数据

**缺点：**
- ⚠️ 部分技术债务仍存在

---

### 方案 B：完全重构（彻底，但耗时）

**核心思路：**
- 完全重写 AuthContext
- 重新设计数据库 schema
- 重新实现 Onboarding
- 清理所有技术债务

**优点：**
- ✅ 系统架构清晰
- ✅ 无技术债务
- ✅ 易于维护

**缺点：**
- ⚠️ 耗时长（1-2 天）
- ⚠️ 风险高
- ⚠️ 可能需要数据迁移

---

## 🗄️ 数据库重新设计（方案 A）

### 新的 profiles 表设计

```sql
-- 删除旧表（如果需要完全重建）
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 创建新表
CREATE TABLE profiles (
  -- 基础字段
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 用户显示信息（必填）
  username VARCHAR(50) NOT NULL DEFAULT '',
  avatar VARCHAR(10) NOT NULL DEFAULT '😊',

  -- 人格和职业信息（必填，完成 onboarding 后）
  mbti VARCHAR(10) DEFAULT NULL,
  role VARCHAR(100) DEFAULT NULL,

  -- 个人目标（可选）
  goal TEXT DEFAULT NULL,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT username_length CHECK (char_length(username) >= 2),
  CONSTRAINT username_not_empty CHECK (username != '')
);

-- 创建索引
CREATE INDEX idx_profiles_username ON profiles(username);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户只能查看自己的 profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的 profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的 profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 触发器：新用户注册时自动创建 profile（简化版）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (
    NEW.id,
    '用户' || substr(NEW.id::text, 1, 8),  -- 简单的默认用户名
    '😊'  -- 默认头像
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器到 auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | UUID | ✅ | - | 用户 ID（外键） |
| username | VARCHAR(50) | ✅ | '用户xxx' | 用户名 |
| avatar | VARCHAR(10) | ✅ | '😊' | 头像 emoji |
| mbti | VARCHAR(10) | ❌ | NULL | MBTI 类型（onboarding 中设置） |
| role | VARCHAR(100) | ❌ | NULL | 职业身份（onboarding 中设置） |
| goal | TEXT | ❌ | NULL | 个人目标（可选） |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新时间 |

---

## 🔐 认证系统简化（方案 A）

### 新的 AuthContext 设计原则

1. **简单至上**：去掉复杂的超时重试逻辑
2. **统一 API**：全部使用 `getSession()`
3. **清晰状态**：只管理必要的状态
4. **错误优先**：明确的错误处理，不掩盖问题

### 简化后的 AuthContext

```typescript
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/calendar-data"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 初始化：获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // 新用户，没有 profile
          setProfile(null)
        } else {
          console.error("加载 profile 失败:", error)
        }
      } else {
        setProfile(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
```

---

## 🎨 Onboarding 流程定义（方案 A）

### 固定流程（3 步）

```
步骤 1: 选择 MBTI 人格类型
  ↓
步骤 2: 选择职业身份
  ↓
步骤 3: 设定目标（可选）+ 生成日历
```

### 用户名和头像处理

**策略：**
- 注册时自动创建默认值（用户xxx, 😊）
- 用户可以在"个人设置"页面修改
- **不在 Onboarding 中收集**（简化流程）

### AI 日历生成策略

**策略：**
- 只生成第一个月（31 天）
- 显示进度模态框
- 后续可以按需生成其他月份

---

## 📋 重构实施计划（方案 A - 推荐）

### Phase 1: 紧急修复（30 分钟）

**目标：** 让登录功能正常工作

1. ✅ 简化 AuthContext（去掉复杂逻辑）
2. ✅ 统一使用 getSession()
3. ✅ 测试登录/登出功能

### Phase 2: 数据库优化（30 分钟）

**目标：** 数据库 schema 稳定

1. ✅ 执行新的数据库迁移
2. ✅ 为现有用户补充默认值
3. ✅ 验证数据完整性

### Phase 3: 业务流程优化（30 分钟）

**目标：** Onboarding 和日历生成流畅

1. ✅ 确认 Onboarding 为 3 步
2. ✅ 测试渐进式生成
3. ✅ 验证完整流程

### Phase 4: 清理技术债务（30 分钟）

**目标：** 代码库整洁

1. ✅ 删除 backup 文件
2. ✅ 删除诊断 API
3. ✅ 清理无用注释

---

## ❓ 需要你确认的问题

1. **用户名和头像**
   - 选项 A：注册时自动生成，用户在设置页修改 ✅（推荐）
   - 选项 B：保留在 Onboarding 第 4 步

2. **AI 日历生成**
   - 选项 A：只生成第一个月（31天）✅（推荐）
   - 选项 B：生成全年（365天，慢）

3. **重构方案**
   - 方案 A：最小化重构（快速修复）✅（推荐）
   - 方案 B：完全重构（彻底但耗时）

4. **现有数据**
   - 选项 A：保留并补充默认值 ✅（推荐）
   - 选项 B：清空重新开始

---

## 📝 建议

**我的建议是采用方案 A（最小化重构）：**

**理由：**
1. ✅ 快速见效（1-2 小时完成）
2. ✅ 风险低（不影响现有数据）
3. ✅ 足够解决当前问题
4. ✅ 为未来优化留有空间

**具体步骤：**
1. 简化 AuthContext（30分钟）
2. 优化数据库 schema（30分钟）
3. 确认业务流程（30分钟）
4. 测试完整功能（30分钟）

总计约 2 小时，今天就能完成。

---

## 🤔 你的决定

请告诉我：
1. 你选择哪个方案？（A 还是 B）
2. 用户名/头像怎么处理？
3. AI 生成策略？
4. 现有数据保留还是清空？

确认后，我立即开始按照你的选择进行系统性重构。
