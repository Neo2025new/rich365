-- ============================================================================
-- Rich365 性能优化脚本
-- 添加数据库索引和优化查询性能
-- ============================================================================

-- ============================================================================
-- 第 1 步：添加组合索引优化查询
-- ============================================================================

-- 优化 daily_actions 按用户和日期查询（最常用的查询模式）
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_date_composite
  ON daily_actions(user_id, date DESC);

-- 优化 check_ins 按用户和日期查询
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date_composite
  ON check_ins(user_id, date DESC);

-- 注意：部分索引不能使用 CURRENT_DATE（不是 IMMUTABLE 函数）
-- 已移除 idx_daily_actions_future，使用完整索引即可

-- 优化按类别查询
CREATE INDEX IF NOT EXISTS idx_daily_actions_category
  ON daily_actions(category)
  WHERE category IS NOT NULL;

-- 优化按主题查询
CREATE INDEX IF NOT EXISTS idx_daily_actions_theme
  ON daily_actions(theme)
  WHERE theme IS NOT NULL;

-- ============================================================================
-- 第 2 步：分析表统计信息（帮助查询优化器）
-- ============================================================================

ANALYZE profiles;
ANALYZE daily_actions;
ANALYZE check_ins;

-- ============================================================================
-- 第 3 步：添加注释说明
-- ============================================================================

COMMENT ON INDEX idx_daily_actions_user_date_composite IS '优化按用户ID和日期查询（日历加载的主要查询）';
COMMENT ON INDEX idx_check_ins_user_date_composite IS '优化按用户ID和日期查询打卡记录';
COMMENT ON INDEX idx_daily_actions_category IS '优化按类别筛选行动';
COMMENT ON INDEX idx_daily_actions_theme IS '优化按主题筛选行动';

-- ============================================================================
-- 完成！性能优化完成
-- ============================================================================

SELECT 'Performance optimization completed successfully!' as message;
