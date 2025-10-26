# 🆘 数据库恢复指南

## 📊 当前状况

数据库已被删除，需要重新创建所有表结构、索引、RLS 策略和触发器。

---

## ✅ 快速恢复步骤（推荐）

### 方法 1：使用 Supabase Dashboard（最简单）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击「New query」

3. **复制并执行恢复脚本**
   - 打开本地文件：`supabase/migrations/010_complete_database_recovery.sql`
   - 全选复制脚本内容
   - 粘贴到 SQL Editor
   - 点击「Run」按钮

4. **验证恢复结果**
   - 应该看到成功消息：`✅ 数据库恢复完成！`
   - 显示表数量、索引数量、触发器数量

5. **完成！**
   - 数据库结构已恢复
   - 可以正常使用应用

---

### 方法 2：使用命令行（需要 Supabase CLI）

```bash
# 1. 确保已安装 Supabase CLI
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 链接到你的项目
supabase link --project-ref <你的项目引用ID>

# 4. 执行恢复脚本
supabase db push --include-schema public

# 或者直接执行 SQL 文件
psql <你的数据库连接字符串> -f supabase/migrations/010_complete_database_recovery.sql
```

---

## 📋 恢复脚本包含的内容

### 1️⃣ 表结构
- ✅ `profiles` - 用户档案表
- ✅ `daily_actions` - 每日搞钱行动表
- ✅ `check_ins` - 打卡记录表

### 2️⃣ 索引（性能优化）
- ✅ 用户-日期复合索引
- ✅ 分类和主题索引
- ✅ MBTI 和职业索引

### 3️⃣ Row Level Security (RLS)
- ✅ 所有表启用 RLS
- ✅ 用户只能访问自己的数据
- ✅ 完整的增删改查策略

### 4️⃣ 触发器和函数
- ✅ 自动为新用户创建 profile
- ✅ 自动更新打卡统计数据
- ✅ 自动计算连续打卡天数

---

## 🔍 验证数据库恢复

执行恢复脚本后，检查以下内容：

### 1. 检查表是否创建成功

在 Supabase Dashboard → Table Editor 中，应该看到：
- ✅ profiles
- ✅ daily_actions
- ✅ check_ins

### 2. 检查 RLS 是否启用

在每个表的设置中，确认「Enable Row Level Security」已开启。

### 3. 测试应用功能

1. **注册/登录** - 测试新用户注册
2. **档案页面** - 填写 MBTI、职业、目标
3. **生成日历** - AI 生成搞钱行动
4. **打卡功能** - 测试打卡并查看统计

---

## ⚠️ 注意事项

### 数据丢失说明

❌ **无法恢复的数据：**
- 用户的历史档案数据
- 已生成的搞钱行动
- 打卡记录和统计数据

✅ **可以恢复的：**
- 完整的数据库结构
- 所有功能正常工作
- 用户可以重新生成日历

### 用户体验影响

- 现有用户需要重新填写档案信息
- 需要重新生成搞钱行动日历
- 打卡记录从零开始

建议在应用中添加提示：
> "系统升级完成，请重新设置你的个人档案并生成新的搞钱行动日历。"

---

## 🚀 恢复后的操作

### 1. 更新应用提示

在首页或登录后添加公告：

```tsx
<Alert>
  <AlertTitle>系统升级通知</AlertTitle>
  <AlertDescription>
    数据库已升级到最新版本，请重新设置个人档案并生成新的搞钱行动日历。
    感谢你的理解和支持！
  </AlertDescription>
</Alert>
```

### 2. 测试所有功能

- ✅ 用户注册和登录
- ✅ 档案填写
- ✅ AI 日历生成
- ✅ 打卡功能
- ✅ 图片下载
- ✅ 日历文件导出

### 3. 监控错误日志

观察应用日志，确保没有数据库相关错误。

---

## 💡 未来预防措施

### 1. 定期备份

在 Supabase Dashboard → Database → Backups 中：
- 启用自动备份
- 定期手动创建快照

### 2. 使用 Point-in-Time Recovery (PITR)

升级到 Supabase Pro 计划，启用 PITR 功能。

### 3. 迁移脚本版本控制

所有迁移脚本已保存在 `supabase/migrations/` 目录中，
确保这些文件纳入 Git 版本控制。

---

## 📞 需要帮助？

如果恢复过程中遇到问题：

1. **检查错误消息** - SQL Editor 会显示具体错误
2. **查看日志** - Supabase Dashboard → Logs
3. **重新执行** - 脚本是幂等的，可以安全重复执行

---

## ✨ 总结

**恢复只需 3 步：**

1. 打开 Supabase SQL Editor
2. 复制粘贴 `010_complete_database_recovery.sql` 脚本
3. 点击 Run 执行

**预计耗时：** < 1 分钟

**恢复后：** 所有功能正常，用户需要重新设置档案
