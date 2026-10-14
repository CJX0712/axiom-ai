#!/usr/bin/env node
/* ============================================================================
 * AXIOM 单文件构建器
 *   将 src/core.js + src/registry.js + src/ui.js 原样内联进 axiom.html
 *   —— HTML 中运行的正是 Node 测试的同一份代码（单一事实来源）
 * 运行：node tools/build.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = function (p) { return fs.readFileSync(path.join(root, p), 'utf8'); };

const core = read('src/core.js');
const registry = read('src/registry.js');
const ui = read('src/ui.js');

/* 语法预检（构建期即失败，避免产出坏 HTML） */
[['core.js', core], ['registry.js', registry], ['ui.js', ui]].forEach(function (item) {
  try { new Function(item[1]); } catch (e) {
    console.error('语法错误: ' + item[0] + ' -> ' + e.message);
    process.exit(1);
  }
  if (item[1].indexOf('</' + 'script>') !== -1) {
    console.error(item[0] + ' 含有 </script>，会破坏 HTML 内联，请避免');
    process.exit(1);
  }
});

/* 字符串拼接（非模板字符串）——对任意 JS 源码注入安全 */
const parts = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="description" content="AXIOM · 自验证 AI 微指令操作系统 —— 十层架构 × 1024 微指令 × 64 项不变量，零依赖单文件，作者：晨星">',
  '<title>AXIOM · 自验证 AI 微指令操作系统</title>',
  '<style>html,body{margin:0;padding:0;background:#0a0e17;}</style>',
  '</head>',
  '<body>',
  '<div id="app"></div>',
  '<script>',
  '/* ==== AXIOM core.js（与 Node 测试同源） ==== */',
  core,
  '</' + 'script>',
  '<script>',
  '/* ==== AXIOM registry.js（1024 微指令，由 tools/gen-registry.js 生成） ==== */',
  registry,
  '</' + 'script>',
  '<script>',
  '/* ==== AXIOM ui.js（仪表盘） ==== */',
  ui,
  '</' + 'script>',
  '</body>',
  '</html>',
  ''
];
const html = parts.join('\n');
const dest = path.join(root, 'axiom.html');
fs.writeFileSync(dest, html);
console.log('axiom.html 构建完成：' + (html.length / 1024).toFixed(1) + ' KB（零外部依赖单文件）');
