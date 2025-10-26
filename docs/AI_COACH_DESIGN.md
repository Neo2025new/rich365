# AI 教练打卡系统设计文档

## 🎯 核心理念

将简单的"点击打卡"升级为"AI 教练互动打卡"，通过与 Gemini AI 对话来完成每日打卡，提供个性化指导和反馈。

## 📊 数据库设计

### 新增表

#### 1. `coach_check_ins` - AI 教练打卡记录
```sql
- id: UUID
- user_id: UUID
- date: DATE (哪一天的打卡)
- daily_action_id: UUID (关联的每日行动)
- is_completed: BOOLEAN (是否完成打卡)
- chat_summary: TEXT (AI 对话总结)
- self_rating: INT (用户自评 1-5星)
- reflection: TEXT (用户反思)
- ai_completion_score: INT (AI 评分 0-100)
- ai_feedback: TEXT (AI 反馈)
```

#### 2. `coach_chat_messages` - 聊天记录
```sql
- id: UUID
- user_id: UUID
- check_in_id: UUID (关联打卡记录)
- role: VARCHAR ('user' | 'assistant')
- content: TEXT (消息内容)
- metadata: JSONB (额外元数据)
- created_at: TIMESTAMPTZ
```

### 更新表

#### `user_stats` 新增字段
```sql
- average_completion_score: DECIMAL (平均完成度)
- total_points: INT (总积分)
```

## 🔄 交互流程

### 1. 用户进入打卡页面

```
Day Page (/day/2025-10-26)
├─ 显示今日行动
├─ 显示 "开始与 AI 教练对话" 按钮
└─ 如果已打卡，显示聊天历史
```

### 2. 开始对话

**用户点击"开始对话"**
```typescript
1. 创建 coach_check_in 记录（is_completed: false）
2. AI 发送开场白：
   "你好！我是你的搞钱教练 💰
   今天的行动是：【{action.title}】
   {action.description}

   准备好开始了吗？和我聊聊你打算怎么完成这个行动吧！"
```

### 3. 对话过程

**AI 教练的角色定位：**
- ✅ 友好、鼓励、专业
- ✅ 基于用户的 MBTI 和职业特点提供个性化建议
- ✅ 追问细节，确保用户真正理解并执行行动
- ✅ 提供实用的技巧和方法

**对话示例：**
```
User: "我计划今天花1小时学习财务知识"

AI: "很棒的计划！👍 具体打算学习哪方面的财务知识呢？
     比如：投资理财、记账方法、税务优化等？"

User: "我想学投资理财"

AI: "好的！作为 INTJ，你擅长系统化学习 📚
     我建议你：
     1. 先了解基础概念（股票、基金、债券）
     2. 学习资产配置原理
     3. 模拟投资练手

     你觉得从哪个开始呢？"
```

### 4. 完成打卡

**触发条件：**
- 对话轮次 >= 3 轮
- AI 判断用户已经理解并制定了行动计划

**AI 发送总结消息：**
```
"太好了！让我总结一下今天的行动计划：

✅ 你要做的：{用户的计划}
🎯 关键要点：{重点}
💡 我的建议：{AI 建议}

给今天的行动打个分吧（1-5星）⭐
完成后记得回来分享成果！"
```

**用户确认后：**
```typescript
1. 更新 coach_check_in:
   - is_completed = true
   - chat_summary = AI 生成的总结
   - ai_completion_score = AI 评估的完成度

2. 更新 user_stats:
   - total_check_ins + 1
   - current_streak 更新
   - total_points += ai_completion_score

3. 保存所有聊天记录到 coach_chat_messages
```

## 🤖 AI Prompt 设计

### System Prompt

```
你是 Rich365 的 AI 财富教练。

用户信息：
- MBTI: {mbti}
- 职业: {role}
- 目标: {goal}

今日行动：
- 标题: {action.title}
- 描述: {action.description}
- 主题: {action.theme}

你的职责：
1. 鼓励用户完成每日行动
2. 提供具体、可执行的建议
3. 根据用户的 MBTI 特质调整沟通方式
4. 追问细节，确保用户真正理解
5. 在 3-5 轮对话后，引导用户制定具体计划

沟通风格：
- 友好、专业、简洁
- 使用 emoji 增加亲和力
- 每次回复控制在 3-5 句话
- 多提问，少说教

完成标准：
- 用户已理解今日行动的意义
- 用户制定了具体的执行计划
- 对话轮次 >= 3 轮
```

### 对话阶段 Prompt

#### 阶段 1: 开场（第 1 轮）
```
介绍今日行动，询问用户的初步想法
```

#### 阶段 2: 深入探讨（第 2-3 轮）
```
追问细节，提供建议，确保用户理解
```

#### 阶段 3: 制定计划（第 4-5 轮）
```
帮助用户制定具体的执行步骤
```

#### 阶段 4: 总结确认（第 6 轮）
```
总结行动计划，请用户确认并打分
```

## 📱 UI/UX 设计

### 打卡页面布局

```
┌─────────────────────────────────┐
│  10月26日 · 搞钱觉醒月           │
│  💰                              │
│  认识你的财富盲区                │
│  列出3个你当前最缺乏的...         │
├─────────────────────────────────┤
│                                  │
│  【聊天区域】                     │
│  ┌───────────────────────────┐  │
│  │ AI: 你好！我是你的...       │  │
│  │                            │  │
│  │ User: 我准备好了           │  │
│  │                            │  │
│  │ AI: 很棒！具体打算...       │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │ 输入消息...          [发送] │  │
│  └───────────────────────────┘  │
│                                  │
│  [未打卡] 或 [✅ 已完成]          │
└─────────────────────────────────┘
```

### 交互细节

1. **聊天气泡**
   - AI 消息：左对齐，浅色背景
   - 用户消息：右对齐，主题色背景
   - 显示时间戳

2. **打卡确认**
   - AI 发送总结后，显示"完成打卡"按钮
   - 点击后弹出评分（1-5星）
   - 可选：添加个人反思

3. **已打卡状态**
   - 显示聊天历史（只读）
   - 显示 AI 总结
   - 显示用户评分和反思

## 🔌 API 设计

### 1. 开始打卡对话
```typescript
POST /api/coach/start-chat
Body: {
  userId: string
  date: string
}
Response: {
  checkInId: string
  firstMessage: string
}
```

### 2. 发送消息
```typescript
POST /api/coach/send-message
Body: {
  checkInId: string
  message: string
}
Response: {
  aiResponse: string
  canComplete: boolean  // 是否可以完成打卡
  summary?: string      // 如果可以完成，返回总结
}
```

### 3. 完成打卡
```typescript
POST /api/coach/complete-check-in
Body: {
  checkInId: string
  selfRating: number    // 1-5
  reflection?: string
}
Response: {
  success: boolean
  stats: {
    currentStreak: number
    totalPoints: number
  }
}
```

### 4. 获取聊天历史
```typescript
GET /api/coach/chat-history?date=2025-10-26
Response: {
  checkIn: CoachCheckIn
  messages: CoachChatMessage[]
}
```

## 🎨 功能亮点

### 1. 个性化对话
- 基于用户 MBTI 调整沟通方式
- 结合用户职业给出针对性建议
- 记忆用户的目标和历史对话

### 2. 智能评分
- AI 根据对话质量评估完成度
- 综合考虑：
  - 用户理解程度
  - 计划的具体性
  - 执行的可行性

### 3. 数据可视化
- 完成度趋势图
- AI 评分 vs 自评对比
- 聊天轮次统计

### 4. 激励系统
- 连续打卡奖励
- 高质量对话额外加分
- 成就徽章系统

## 🚀 实施步骤

### Phase 1: 数据库（当前）
- ✅ 创建新表
- ✅ 迁移旧数据

### Phase 2: AI 教练 API
- [ ] 实现对话 API
- [ ] Gemini 集成
- [ ] Prompt 工程优化

### Phase 3: 前端 UI
- [ ] 聊天组件
- [ ] 打卡流程重构
- [ ] 历史记录查看

### Phase 4: 优化
- [ ] 对话质量优化
- [ ] 性能优化
- [ ] A/B 测试

## 💡 未来扩展

1. **语音对话**
   - 支持语音输入/输出
   - 更自然的交互体验

2. **教练个性化**
   - 用户可选择教练风格
   - 不同主题对应不同教练

3. **社区功能**
   - 分享优秀对话
   - 互相激励

4. **数据洞察**
   - 个人成长报告
   - AI 生成月度总结
