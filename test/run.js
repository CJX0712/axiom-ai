#!/usr/bin/env node
/* ============================================================================
 * AXIOM 无头自检（Node）—— 可运行、可复现、可验证
 *   1) core.js 全部不变量检查（解析 vs 数值 / 暴力枚举 vs 优化算法）
 *   2) 注册表完整性（1024 条、ID 唯一、每族 64 条、变体语义完整）
 * 运行：node test/run.js   （失败退出码 1）
 * ==========================================================================*/
'use strict';
const path = require('path');
const AXIOM = require(path.join(__dirname, '..', 'src', 'core.js'));
const REGISTRY = require(path.join(__dirname, '..', 'src', 'registry.js'));

function fmt(x) {
  if (!isFinite(x)) return '  ∞(err)';
  if (x === 0) return '      0';
  return x.toExponential(2).replace('e-', 'e-').padStart(9);
}

let failures = 0;
const lines = [];

/* ---------- 1. 核心不变量 ---------- */
const result = AXIOM.runChecks();
console.log('════════════════════════════════════════════════════════════');
console.log(' AXIOM 核心不变量自检  v' + AXIOM.version);
console.log('════════════════════════════════════════════════════════════');
for (const r of result.results) {
  const mark = r.pass ? '✅' : '❌';
  if (!r.pass) failures++;
  console.log('  ' + mark + ' ' + r.name);
  console.log('      残差 ' + fmt(r.residual) + '   容差 ' + fmt(r.tol) + (r.error ? '   异常: ' + r.error : ''));
}
console.log('────────────────────────────────────────────────────────────');
console.log('  核心不变量: ' + result.passed + '/' + result.total + ' PASS');

/* ---------- 2. 注册表完整性 ---------- */
const regChecks = [];
regChecks.push(['指令总数 = 1024', REGISTRY.length === 1024]);
regChecks.push(['ID 唯一', new Set(REGISTRY.map(e => e.id)).size === 1024]);
regChecks.push(['ID 连续且格式化', REGISTRY.every((e, i) => e.id === 'L10.' + String(i + 1).padStart(4, '0'))]);
regChecks.push(['每族恰 64 条', [...new Set(REGISTRY.map(e => e.group))].every(g => REGISTRY.filter(e => e.group === g).length === 64)]);
regChecks.push(['每算子恰 4 变体', [...new Set(REGISTRY.map(e => e.group + '|' + e.op))].every(k => REGISTRY.filter(e => e.group + '|' + e.op === k).length === 4)]);
regChecks.push(['变体 ∈ {base,batched,fused,inplace}', REGISTRY.every(e => ['base', 'batched', 'fused', 'inplace'].includes(e.variant))]);
regChecks.push(['全部含数学不变量', REGISTRY.every(e => e.invariant && e.invariant.length > 0)]);
regChecks.push(['verified 项 impl 均为 core.js 真实导出', REGISTRY.filter(e => e.status === 'verified').every(e => typeof AXIOM[e.impl] !== 'undefined')]);
regChecks.push(['仅 base 变体可为 verified', REGISTRY.filter(e => e.status === 'verified').every(e => e.variant === 'base')]);
const verifiedCount = REGISTRY.filter(e => e.status === 'verified').length;
regChecks.push(['verified 数 > 0（当前 ' + verifiedCount + '）', verifiedCount > 0]);

console.log('────────────────────────────────────────────────────────────');
console.log('  注册表完整性:');
for (const [name, ok] of regChecks) {
  if (!ok) failures++;
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + name);
}

/* ---------- 3. 汇总 ---------- */
console.log('════════════════════════════════════════════════════════════');
const total = result.total + regChecks.length;
const passed = result.passed + regChecks.filter(c => c[1]).length;
console.log('  总计: ' + passed + '/' + total + ' PASS   指令集: 1024 条（verified=' + verifiedCount + '）');
console.log(failures === 0 ? '  🟢 全绿 —— AXIOM 自检通过' : '  🔴 存在失败项');
console.log('════════════════════════════════════════════════════════════');
process.exit(failures === 0 ? 0 : 1);
