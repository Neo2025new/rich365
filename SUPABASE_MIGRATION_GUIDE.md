# Supabase 数据库迁移指南

## ⚠️ 重要提示

保存图片功能已修复，但需要手动执行数据库迁移以修复打卡统计功能。

## 🔧 需要执行的迁移

### 1. 打开 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 选择你的项目：`richca`
3. 点击左侧菜单的 **SQL Editor**

### 2. 执行迁移脚本

复制以下文件的全部内容并在 SQL Editor 中执行：

📄 **文件路径**: `supabase/migrations/006_add_checkin_stats_fields.sql`

**或者直接复制以下 SQL**：

```sql
-- ============================================================================
-- 添加打卡统计字段到 profiles 表
-- ============================================================================

-- 添加打卡统计字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_check_ins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN profiles.total_check_ins IS '总打卡次数';
COMMENT ON COLUMN profiles.current_streak IS '当前连续打卡天数';
COMMENT ON COLUMN profiles.longest_streak IS '最长连续打卡天数';
COMMENT ON COLUMN profiles.total_coins IS '总获得金币数';
COMMENT ON COLUMN profiles.badges IS '已获得的徽章ID列表';

-- 创建 check_ins 表（如果不存在）
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id UUID REFERENCES daily_actions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 每个用户每天只能打卡一次
  UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(date);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date);

-- 添加注释
COMMENT ON TABLE check_ins IS '用户打卡记录表';
COMMENT ON COLUMN check_ins.user_id IS '用户ID';
COMMENT ON COLUMN check_ins.date IS '打卡日期';
COMMENT ON COLUMN check_ins.action_id IS '关联的行动ID（可选）';
COMMENT ON COLUMN check_ins.note IS '打卡备注（可选）';

-- 启用 RLS
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户只能查看自己的打卡记录"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的打卡记录"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的打卡记录"
  ON check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的打卡记录"
  ON check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- 创建函数：更新打卡统计数据
CREATE OR REPLACE FUNCTION update_check_in_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_total INTEGER;
  user_current_streak INTEGER;
  user_longest_streak INTEGER;
  last_check_in_date DATE;
  check_date DATE;
BEGIN
  -- 获取用户总打卡次数
  SELECT COUNT(*) INTO user_total
  FROM check_ins
  WHERE user_id = NEW.user_id;

  -- 计算当前连续打卡天数
  check_date := NEW.date;
  user_current_streak := 1;

  LOOP
    last_check_in_date := check_date - INTERVAL '1 day';

    IF EXISTS (
      SELECT 1 FROM check_ins
      WHERE user_id = NEW.user_id AND date = last_check_in_date
    ) THEN
      user_current_streak := user_current_streak + 1;
      check_date := last_check_in_date;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 获取最长连续打卡天数
  SELECT GREATEST(current_streak, user_current_streak) INTO user_longest_streak
  FROM profiles
  WHERE id = NEW.user_id;

  -- 更新 profiles 表
  UPDATE profiles
  SET
    total_check_ins = user_total,
    current_streak = user_current_streak,
    longest_streak = user_longest_streak,
    total_coins = user_total * 10, -- 每次打卡获得10金币
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：打卡后自动更新统计
CREATE TRIGGER update_stats_after_check_in
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_check_in_stats();
```

### 3. 验证迁移

执行成功后，点击 **Run** 按钮，应该看到 "Success" 提示。

## ✅ 修复的问题

### 1. 保存图片功能 ✅
- 移除了不支持的 `lab()` 颜色函数
- 使用标准 RGB 渐变色
- 现在可以正常保存图片

### 2. 打卡统计功能 ✅（需要执行迁移）
- 添加了 `total_check_ins`, `current_streak`, `longest_streak`, `total_coins`, `badges` 字段
- 创建了 `check_ins` 表
- 添加了自动更新统计的触发器

## 📦 最新部署

- 🌐 **生产环境**: https://richca-8z51r4nnf-neos-projects-9448fe10.vercel.app
- ⏱️ **部署时间**: 约 4 秒
- 📊 **部署ID**: 3pBPLyVyawtaR2U6NHsQL3x2NMyb

## 🎯 后续步骤

1. ✅ 保存图片功能 - 已修复（无需操作）
2. ⚠️ 打卡统计功能 - 需要执行上述 SQL（5分钟）
3. 🎉 完成后刷新页面即可正常使用
