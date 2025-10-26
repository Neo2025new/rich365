/**
 * 分析项目代码，提取数据库 Schema 需求
 */

const fs = require('fs');
const path = require('path');

// 用于存储分析结果
const schemaNeeds = {
  tables: {},
  fields: {},
  queries: []
};

// 递归读取文件
function analyzeDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
      analyzeDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      analyzeFile(filePath);
    }
  });
}

// 分析单个文件
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 提取 .from("table_name") 调用
  const fromMatches = content.matchAll(/\.from\(['"](.*?)['"]\)/g);
  for (const match of fromMatches) {
    const tableName = match[1];
    if (!schemaNeeds.tables[tableName]) {
      schemaNeeds.tables[tableName] = { count: 0, files: new Set() };
    }
    schemaNeeds.tables[tableName].count++;
    schemaNeeds.tables[tableName].files.add(filePath.replace(process.cwd(), ''));
  }

  // 提取 SELECT 字段
  const selectMatches = content.matchAll(/\.select\(['"](.*?)['"]\)/g);
  for (const match of selectMatches) {
    const fields = match[1].split(',').map(f => f.trim());
    fields.forEach(field => {
      if (field === '*') return;
      const fieldName = field.split('.')[0].trim();
      if (!schemaNeeds.fields[fieldName]) {
        schemaNeeds.fields[fieldName] = { count: 0, files: new Set() };
      }
      schemaNeeds.fields[fieldName].count++;
      schemaNeeds.fields[fieldName].files.add(filePath.replace(process.cwd(), ''));
    });
  }

  // 提取字段访问（data.xxx）
  const dataAccess = content.matchAll(/data\.(\w+)/g);
  for (const match of dataAccess) {
    const fieldName = match[1];
    if (!schemaNeeds.fields[fieldName]) {
      schemaNeeds.fields[fieldName] = { count: 0, files: new Set() };
    }
    schemaNeeds.fields[fieldName].count++;
    schemaNeeds.fields[fieldName].files.add(filePath.replace(process.cwd(), ''));
  }
}

// 主执行
console.log('🔍 开始分析项目代码...\n');

// 分析关键目录
['app', 'lib', 'contexts'].forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    analyzeDirectory(dirPath);
  }
});

// 转换 Set 为 Array（用于 JSON 输出）
Object.keys(schemaNeeds.tables).forEach(table => {
  schemaNeeds.tables[table].files = Array.from(schemaNeeds.tables[table].files);
});

Object.keys(schemaNeeds.fields).forEach(field => {
  schemaNeeds.fields[field].files = Array.from(schemaNeeds.fields[field].files);
});

// 输出结果
console.log('=== 数据库表使用统计 ===\n');
const sortedTables = Object.entries(schemaNeeds.tables)
  .sort((a, b) => b[1].count - a[1].count);

sortedTables.forEach(([table, info]) => {
  console.log(`📊 ${table}`);
  console.log(`   使用次数: ${info.count}`);
  console.log(`   使用文件: ${info.files.length} 个`);
  console.log('');
});

console.log('\n=== 字段使用统计（Top 30）===\n');
const sortedFields = Object.entries(schemaNeeds.fields)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 30);

sortedFields.forEach(([field, info]) => {
  console.log(`   ${field}: ${info.count} 次`);
});

// 保存详细报告
const report = {
  timestamp: new Date().toISOString(),
  tables: sortedTables.map(([name, info]) => ({
    name,
    usage_count: info.count,
    files: info.files
  })),
  fields: sortedFields.map(([name, info]) => ({
    name,
    usage_count: info.count,
    files: info.files
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'schema_analysis_report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ 详细报告已保存到: supabase/schema_analysis_report.json');
