#!/bin/bash

# ============================================
# Supabase 数据库 SQL 执行脚本
# ============================================

# 从 Supabase Dashboard 获取数据库连接字符串：
# 1. 打开 Supabase Dashboard
# 2. 进入 Project Settings > Database
# 3. 找到 "Connection string" 部分
# 4. 复制 "URI" 格式的连接字符串（session mode）
#
# 示例格式：
# postgresql://postgres:[YOUR-PASSWORD]@db.rskfpbdwujtsrmvnzxyo.supabase.co:5432/postgres

# 设置你的数据库连接字符串
DB_URL="postgresql://postgres.rskfpbdwujtsrmvnzxyo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "=========================================="
echo "Supabase 数据库 SQL 执行器"
echo "=========================================="
echo ""
echo "请选择要执行的操作："
echo ""
echo "1. 禁用触发器（快速修复注册问题）"
echo "2. 运行完整诊断"
echo "3. 执行自定义 SQL 文件"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
  1)
    echo "正在禁用触发器..."
    psql "$DB_URL" -f supabase/disable_trigger.sql
    ;;
  2)
    echo "正在运行诊断..."
    psql "$DB_URL" -f supabase/diagnose_database.sql
    ;;
  3)
    read -p "请输入 SQL 文件路径: " file_path
    echo "正在执行 $file_path..."
    psql "$DB_URL" -f "$file_path"
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac

echo ""
echo "✅ 执行完成！"
