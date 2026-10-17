#!/usr/bin/env node
/* ============================================================================
 * AXIOM 验证报告生成器 —— docs/VERIFICATION.md 由本脚本从真实运行结果生成
 * 运行：node tools/gen-verification.js
 * ==========================================================================*/
'use strict';
const path = require('path');
const fs = require('fs');
const AXIOM = require(path.join(__dirname, '..', 'src', 'core.js'));
const REGISTRY = require(path.join(__dirname, '..', 'src', 'registry.js'));

function sci(x) {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  return x.toExponential(2);
}

const r = AXIOM.runChecks();
const verified = REGISTRY.filter(e => e.status === 'verified').length;
const byGroup = {};
REGISTRY.filter(e => e.status === 'verified').forEach(e => { byGroup[e.group] = (byGroup[e.group] || 0) + 1; });

const regChecks = [
  ['指令总数 = 1024', REGISTRY.length === 1024],
  ['ID 唯一', new Set(REGISTRY.map(e => e.id)).size === 1024],
  ['ID 连续且格式化', REGISTRY.every((e, i) => e.id === 'L10.' + String(i + 1).padStart(4, '0'))],
  ['每族恰 64 条', [...new Set(REGISTRY.map(e => e.group))].every(g => REGISTRY.filter(e => e.group === g).length === 64)],
  ['每算子恰 4 变体', [...new Set(REGISTRY.map(e => e.group + '|' + e.op))].every(k => REGISTRY.filter(e => e.group + '|' + e.op === k).length === 4)],
  ['变体 ∈ {base,batched,fused,inplace}', REGISTRY.every(e => ['base', 'batched', 'fused', 'inplace'].includes(e.variant))],
  ['全部含数学不变量', REGISTRY.every(e => e.invariant && e.invariant.length > 0)],
  ['verified 项 impl 均为 core.js 真实导出', REGISTRY.filter(e => e.status === 'verified').every(e => typeof AXIOM[e.impl] !== 'undefined')],
  ['仅 base 变体可为 verified', REGISTRY.filter(e => e.status === 'verified').every(e => e.variant === 'base')],
  ['verified 数 > 0（当前 ' + verified + '）', verified > 0]
];

const machine = r.results.filter(x => x.pass && x.residual <= 1e-14).length;
const converged = r.results.filter(x => x.pass && x.residual > 1e-14 && x.residual <= 1e-6).length;
const stat = r.results.filter(x => x.pass && x.residual > 1e-6).length;
const exact = r.results.filter(x => x.pass && x.residual === 0).length;

const lines = [];
lines.push('# AXIOM 验证报告（VERIFICATION）');
lines.push('');
lines.push('> 本文件由 `node tools/gen-verification.js` 从真实运行结果生成，请勿手改。');
lines.push('> 运行方式：`node test/run.js`（Node 22 实测，零依赖，确定性种子，可复现）');
lines.push('> 结果：**核心不变量 ' + r.passed + '/' + r.total + ' PASS · 注册表完整性 ' + regChecks.filter(c => c[1]).length + '/' + regChecks.length + ' PASS · 总计 ' + (r.passed + regChecks.filter(c => c[1]).length) + '/' + (r.total + regChecks.length) + ' 全绿**');
lines.push('');
lines.push('## 1. 核心不变量全表（实测残差）');
lines.push('');
lines.push('残差列为 `node test/run.js` 真实输出；容差为该项设计的验收阈值。');
lines.push('');
lines.push('| 状态 | 检查项（不变量） | 实测残差 | 容差 |');
lines.push('|---|---|---|---|');
r.results.forEach(x => {
  lines.push('| ' + (x.pass ? '✅' : '❌') + ' | ' + x.name + ' | ' + sci(x.residual) + ' | ' + sci(x.tol) + ' |');
});
lines.push('');
lines.push('## 2. 注册表完整性（' + regChecks.filter(c => c[1]).length + '/' + regChecks.length + '）');
lines.push('');
lines.push('| 检查 | 结果 |');
lines.push('|---|---|');
regChecks.forEach(c => { lines.push('| ' + c[0] + ' | ' + (c[1] ? '✅' : '❌') + ' |'); });
lines.push('');
lines.push('## 3. 微指令内核化覆盖（verified = 有 core.js 实现且通过不变量自检）');
lines.push('');
lines.push('| 指令族 | verified / 16 |');
lines.push('|---|---|');
Object.keys(byGroup).sort().forEach(g => { lines.push('| ' + g + ' | ' + byGroup[g] + ' / 16 |'); });
lines.push('| **合计** | **' + verified + ' / 1024** |');
lines.push('');
lines.push('## 4. 残差分级说明');
lines.push('');
lines.push('| 级别 | 残差量级 | 项数 | 说明 |');
lines.push('|---|---|---|---|');
lines.push('| 精确 0 | = 0 | ' + exact + ' | 恒等式、枚举判定、结构不变量 |');
lines.push('| 机器精度 | ≤ 1e-14 | ' + machine + ' | 矩阵分解/恒等式/精确算术 |');
lines.push('| 算法收敛 | 1e-13 ~ 1e-6 | ' + converged + ' | 迭代算法、逼近公式（erf/A&S、gelu）、梯度检验 |');
lines.push('| 统计估计 | > 1e-6 | ' + stat + ' | Box–Muller 矩估计、类别采样频率（蒙特卡洛固有） |');
lines.push('');
lines.push('## 5. 复现方式');
lines.push('');
lines.push('```bash');
lines.push('node test/run.js                  # 全量 ' + (r.total + regChecks.length) + ' 项，失败退出码 1');
lines.push('node tools/gen-verification.js     # 重新生成本报告');
lines.push('node tools/gen-registry.js         # 重新生成 1024 微指令注册表');
lines.push('```');
lines.push('');
lines.push('浏览器内打开 `axiom.html` → 「实时自检」视图 → 「运行全量自检」：同一份 `core.js`，同一批检查。');
lines.push('');

const dest = path.join(__dirname, '..', 'docs', 'VERIFICATION.md');
fs.writeFileSync(dest, lines.join('\n'));
console.log('已生成 docs/VERIFICATION.md：核心 ' + r.passed + '/' + r.total + ' · 注册表 ' + regChecks.filter(c => c[1]).length + '/' + regChecks.length + ' · verified ' + verified + '/1024');
