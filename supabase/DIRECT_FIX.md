# 直接使用命令行修复数据库

## 步骤 1: 获取数据库连接字符串

1. 打开 **Supabase Dashboard**: https://supabase.com/dashboard
2. 进入你的项目
3. 点击左侧菜单的 **Project Settings** (齿轮图标)
4. 点击 **Database**
5. 找到 **Connection string** 部分
6. 选择 **Session mode** (不是 Transaction mode)
7. 复制 **URI** 格式的连接字符串

示例格式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.rskfpbdwujtsrmvnzxyo.supabase.co:5432/postgres
```

## 步骤 2: 快速修复（禁用触发器）

在终端执行以下命令（替换 `[YOUR-PASSWORD]` 为你的数据库密码）：

```bash
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -c "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE; DROP FUNCTION IF EXISTS handle_new_user() CASCADE;"
```

## 步骤 3: 验证修复

执行诊断命令：

```bash
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/diagnose_database.sql
```

## 或者使用脚本（推荐）

1. 编辑 `supabase/run_sql.sh`
2. 将 `DB_URL` 替换为你的连接字符串
3. 运行脚本：

```bash
./supabase/run_sql.sh
```

然后选择：
- 选项 1: 禁用触发器（快速修复）
- 选项 2: 运行诊断

## 步骤 4: 测试注册

修复后，尝试注册新用户，应该不再出现 "Database error saving new user" 错误。
