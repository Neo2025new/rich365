-- 创建月度主题规划表
-- 用于存储 AI 生成的 12 个月主题规划

CREATE TABLE IF NOT EXISTS monthly_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  relative_month INT NOT NULL CHECK (relative_month >= 1 AND relative_month <= 12),
  theme TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📅',
  is_generated BOOLEAN DEFAULT FALSE,  -- 该月是否已生成详细行动
  start_date DATE,  -- 该相对月份的起始日期
  end_date DATE,    -- 该相对月份的结束日期
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, year, relative_month)
);

-- 添加索引
CREATE INDEX idx_monthly_themes_user_year ON monthly_themes(user_id, year);
CREATE INDEX idx_monthly_themes_user_month ON monthly_themes(user_id, year, relative_month);

-- RLS 策略
ALTER TABLE monthly_themes ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的月度主题
CREATE POLICY "Users can view own monthly themes"
  ON monthly_themes
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的月度主题
CREATE POLICY "Users can insert own monthly themes"
  ON monthly_themes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的月度主题
CREATE POLICY "Users can update own monthly themes"
  ON monthly_themes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 添加触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_monthly_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_themes_updated_at
  BEFORE UPDATE ON monthly_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_themes_updated_at();

-- 添加注释
COMMENT ON TABLE monthly_themes IS '用户的 12 个月主题规划';
COMMENT ON COLUMN monthly_themes.relative_month IS '相对月份 (1=第一个月，从今天开始)';
COMMENT ON COLUMN monthly_themes.is_generated IS '该月的详细行动是否已生成';
COMMENT ON COLUMN monthly_themes.start_date IS '该相对月份的实际起始日期';
COMMENT ON COLUMN monthly_themes.end_date IS '该相对月份的实际结束日期';
