#!/usr/bin/env node
/* ============================================================================
 * AXIOM 指令集全目录生成器 —— docs/ISA-1024.md（1024 条微指令完整规格表）
 * 运行：node tools/gen-isa-doc.js
 * ==========================================================================*/
'use strict';
const path = require('path');
const fs = require('fs');
const REGISTRY = require(path.join(__dirname, '..', 'src', 'registry.js'));

const GROUPS = [];
REGISTRY.forEach(e => { if (!GROUPS.includes(e.group)) GROUPS.push(e.group); });
const verified = REGISTRY.filter(e => e.status === 'verified').length;

const lines = [];
lines.push('# AXIOM 指令集全目录（ISA-1024）');
lines.push('');
lines.push('> 本文件由 `node tools/gen-isa-doc.js` 从 `src/registry.js` 生成，请勿手改。');
lines.push('> 16 指令族 × 16 基础算子 × 4 执行变体 = **1024 条微指令**；当前 verified（有 core.js 实现且通过不变量自检）**' + verified + '** 条。');
lines.push('> 每条微指令携带：语义契约 · 数学不变量 · 实现状态（✅ verified / 🟡 spec）。');
lines.push('');
GROUPS.forEach(g => {
  const entries = REGISTRY.filter(e => e.group === g);
  const v = entries.filter(e => e.status === 'verified').length;
  lines.push('## ' + g + ' · ' + entries[0].groupName + '（' + entries[0].semantics.split('（')[0] + '）— verified ' + v + '/16');
  lines.push('');
  lines.push('| ID | 指令 | 变体 | 语义 | 数学不变量 | 状态 |');
  lines.push('|---|---|---|---|---|---|');
  entries.forEach(e => {
    lines.push('| ' + e.id + ' | `' + e.name + '` | ' + e.variant + ' | ' + e.semantics + ' | ' + e.invariant + ' | ' + (e.status === 'verified' ? '✅' : '🟡') + ' |');
  });
  lines.push('');
});
lines.push('---');
lines.push('');
lines.push('作者：晨星 · AXIOM v1.1.0 · MIT License');

const dest = path.join(__dirname, '..', 'docs', 'ISA-1024.md');
fs.writeFileSync(dest, lines.join('\n'));
console.log('已生成 docs/ISA-1024.md：' + REGISTRY.length + ' 条微指令（verified=' + verified + '）');
