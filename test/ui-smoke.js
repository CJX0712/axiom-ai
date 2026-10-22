#!/usr/bin/env node
/* ============================================================================
 * UI 冒烟测试：用最小 DOM 垫片在 Node 中执行 ui.js 的全部渲染路径
 * 验证：外壳渲染、Tab 切换、ISA 表格/分页、自检运行、算法库 63 组演示、
 *       管线编排、三个演示计算路径、导出报告生成。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- 最小 DOM 垫片 ---------- */
function makeClassList() {
  var set = {};
  return {
    add: function (c) { set[c] = 1; },
    remove: function (c) { delete set[c]; },
    toggle: function (c, on) { if (on === undefined) on = !set[c]; if (on) set[c] = 1; else delete set[c]; },
    contains: function (c) { return !!set[c]; },
    _set: set
  };
}
function classListFromString(str) {
  var cl = makeClassList();
  String(str || '').split(/\s+/).forEach(function (c) { if (c) cl.add(c); });
  return cl;
}
function makeElement(tag) {
  var e = {
    tagName: String(tag).toUpperCase(),
    children: [], style: {}, dataset: {}, _listeners: {},
    _cn: '', _cls: makeClassList(),
    innerHTML: '', textContent: '', value: '',
    setAttribute: function (k, v) { this['attr_' + k] = v; },
    getAttribute: function (k) { return this['attr_' + k]; },
    appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove: function () { if (this.parentNode) this.parentNode.removeChild(this); },
    addEventListener: function (type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
    dispatch: function (type, ev) { (this._listeners[type] || []).forEach(function (fn) { fn(ev || { target: this }); }, this); },
    querySelectorAll: function () { return []; },
    getContext: function () {
      return new Proxy({}, { get: function (t, k) { if (k === 'canvas') return {}; return function () {}; } });
    },
    click: function () { this.dispatch('click'); },
    focus: function () {}
  };
  Object.defineProperty(e, 'classList', { get: function () { return this._cls; } });
  Object.defineProperty(e, 'className', {
    get: function () { return this._cn; },
    set: function (v) { this._cn = v; this._cls = classListFromString(v); }
  });
  Object.defineProperty(e, 'innerHTML', {
    get: function () { return this._html || ''; },
    set: function (v) { this._html = v; if (v === '') this.children.length = 0; }  // 模拟浏览器：置空即清空子节点
  });
  Object.defineProperty(e, 'firstChild', { get: function () { return this.children[0]; } });
  return e;
}
var appEl = makeElement('div'); appEl.id = 'app';
var headEl = makeElement('head');
var bodyEl = makeElement('body');
var documentStub = {
  createElement: makeElement,
  createDocumentFragment: function () { return makeElement('fragment'); },
  getElementById: function (id) { return id === 'app' ? appEl : null; },
  head: headEl,
  body: bodyEl,
  title: '',
  addEventListener: function () {},
  querySelectorAll: function () { return []; }
};
var sandbox = {
  document: documentStub,
  window: { devicePixelRatio: 1 },
  navigator: { userAgent: 'node-smoke-test' },
  URL: { createObjectURL: function () { return 'blob:fake'; }, revokeObjectURL: function () {} },
  Blob: function () {},
  setTimeout: function (fn) { fn(); },
  clearTimeout: function () {},
  console: console,
  Math: Math, JSON: JSON, isFinite: isFinite, Set: Set, Object: Object, Array: Array, String: String, Number: Number
};
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* ---------- 加载三个脚本（与 axiom.html 内联顺序一致） ---------- */
const root = path.join(__dirname, '..');
['src/core.js', 'src/registry.js', 'src/ui.js'].forEach(function (f) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
});

/* ---------- 断言辅助 ---------- */
var failures = 0;
function ok(cond, name) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name);
  if (!cond) failures++;
}
function walk(root, fn) { (function rec(n) { fn(n); (n.children || []).forEach(rec); })(root); }
function findAll(root, pred) { var out = []; walk(root, function (n) { if (pred(n)) out.push(n); }); return out; }
function viewEl() { return findAll(appEl, function (n) { return n._cls.contains('view'); })[0]; }
function clickTab(name) {
  var t = findAll(appEl, function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-tab') === name; })[0];
  if (!t) throw new Error('tab not found: ' + name);
  t.dispatch('click');
}

console.log('════════════════════════════════════════════');
console.log(' AXIOM UI 冒烟测试（Node DOM 垫片）');
console.log('════════════════════════════════════════════');

ok(appEl.children.length > 0, '应用挂载到 #app');
ok(documentStub.title === 'AXIOM · 自验证 AI 微指令操作系统', 'document.title 已设置');
ok(headEl.children.length > 0, 'CSS 已注入 head');
ok(sandbox.AXIOM.runChecks().passed === sandbox.AXIOM.checks.length, 'core.js 在垫片环境中 ' + sandbox.AXIOM.checks.length + '/' + sandbox.AXIOM.checks.length + ' 通过');
ok(sandbox.AXIOM_REGISTRY.length === 1024, 'registry.js 1024 条已加载');

var tabs = findAll(appEl, function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-tab'); });
ok(tabs.length === 7, '7 个 Tab 渲染（实际 ' + tabs.length + '）');
ok(findAll(appEl, function (n) { return n._cls.contains('layer'); }).length === 10, '架构视图 10 层卡片');

/* Tab 1 → 指令集 */
clickTab('isa');
var vt = viewEl();
var tables = findAll(vt, function (n) { return n.tagName === 'TABLE'; });
ok(tables.length === 1, '指令集表格渲染（实际 ' + tables.length + '）');
var rows = tables.length ? findAll(tables[0], function (n) { return n.tagName === 'TR'; }).length : 0;
ok(rows === 50, 'ISA 数据行 50 行（实际 ' + rows + '）');
ok(tables.length && tables[0].innerHTML.indexOf('<thead>') !== -1, 'ISA 表头已渲染');
var pagerBtns = findAll(vt, function (n) { return n.tagName === 'BUTTON'; });
ok(pagerBtns.length === 2, '分页按钮 2 个（上一页/下一页）');
var nextBtn = pagerBtns.filter(function (b) { return b.innerHTML.indexOf('下一页') !== -1; })[0];
if (nextBtn) nextBtn.dispatch('click');
var rows2 = findAll(viewEl(), function (n) { return n.tagName === 'TR'; }).length;
ok(rows2 === 50, '翻页后仍 50 行（第 2 页，实际 ' + rows2 + '）');

/* Tab 2 → 实时自检 */
clickTab('verify');
var runBtn = findAll(viewEl(), function (n) { return n.tagName === 'BUTTON' && n._cls.contains('runbtn'); })[0];
ok(!!runBtn, '自检运行按钮存在');
runBtn.dispatch('click');
var summaries = findAll(viewEl(), function (n) { return n._cls.contains('summary'); });
ok(summaries.length === 2, '自检后渲染 2 个汇总条（实际 ' + summaries.length + '）');
ok(summaries.filter(function (s) { return s._cls.contains('ok'); }).length === 2, '两个汇总条均全绿');
var verifyRows = findAll(viewEl(), function (n) { return n.tagName === 'TR'; }).length;
ok(verifyRows >= sandbox.AXIOM.checks.length, '自检结果表 ≥ ' + sandbox.AXIOM.checks.length + ' 行（实际 ' + verifyRows + '）');

/* Tab → 算法库（63 组旗舰级算法参考实现，ISA 之外） */
clickTab('algo');
var algoTables = findAll(viewEl(), function (n) { return n.tagName === 'TABLE'; });
ok(algoTables.length === 1, '算法库表格渲染（实际 ' + algoTables.length + '）');
var algoRows = algoTables.length ? findAll(algoTables[0], function (n) { return n.tagName === 'TR'; }).length : 0;
ok(algoRows === 63, '算法库 63 数据行（实际 ' + algoRows + '）');
ok(algoTables.length && algoTables[0].innerHTML.indexOf('<thead>') !== -1, '算法库表头已渲染');
var algoBtns = findAll(viewEl(), function (n) { return n.tagName === 'BUTTON'; });
ok(algoBtns.length === 64, '算法库按钮：1 个「运行全部」+ 63 个单组演示（实际 ' + algoBtns.length + '）');
var algoThrew = false;
try { algoBtns.forEach(function (b) { b.dispatch('click'); }); } catch (e) { algoThrew = true; console.log(e); }
ok(!algoThrew, '算法库 63 组演示 + 运行全部：点击全部无异常');
var algoSums = findAll(viewEl(), function (n) { return n._cls.contains('summary'); });
ok(algoSums.length >= 73, '算法库演示汇总条 ≥ 73（63 组各 ≥1 + 运行全部，实际 ' + algoSums.length + '）');
ok(algoSums.length > 0 && algoSums.filter(function (s) { return s._cls.contains('ok'); }).length === algoSums.length,
  '算法库演示汇总全绿（' + algoSums.length + ' 条）');

/* Tab → 管线编排（L9 组合应用层） */
clickTab('pipeline');
var presetBtns = findAll(viewEl(), function (n) { return n.tagName === 'BUTTON'; });
ok(presetBtns.length >= 4, '管线视图：3 预设 + 加入 + 执行按钮（实际 ' + presetBtns.length + '）');
var presetRun = presetBtns.filter(function (b) { return b.innerHTML.indexOf('运行预设') !== -1; })[0];
if (presetRun) presetRun.dispatch('click');
var pipeTables = findAll(viewEl(), function (n) { return n.tagName === 'TABLE'; });
ok(pipeTables.length === 1, '预设管线执行后渲染步骤表（实际 ' + pipeTables.length + '）');
var pipeRows = pipeTables.length ? findAll(pipeTables[0], function (n) { return n.tagName === 'TR'; }).length : 0;
ok(pipeRows >= 2, '管线数据行 ≥ 2（2 步预设，实际 ' + pipeRows + '）');
ok(pipeTables.length && pipeTables[0].innerHTML.indexOf('<thead>') !== -1, '管线表头已渲染');
var pipeSummaries = findAll(viewEl(), function (n) { return n._cls.contains('summary'); });
ok(pipeSummaries.length === 1 && pipeSummaries[0]._cls.contains('ok'), '管线执行汇总全绿');

/* Tab 3 → 演示实验室 */
clickTab('lab');
var demoBtns = findAll(viewEl(), function (n) { return n.tagName === 'BUTTON'; });
ok(demoBtns.length === 3, '3 个演示按钮（实际 ' + demoBtns.length + '）');
demoBtns.forEach(function (b) { b.dispatch('click'); });
var canvases = findAll(viewEl(), function (n) { return n.tagName === 'CANVAS'; });
ok(canvases.length === 4, 'canvas 已绘制：逻辑回归 2（散点+损失曲线）+ GMM 1 + PCA 1（实际 ' + canvases.length + '）');

/* Tab 4 → 导出 */
clickTab('export');
var expBtns = findAll(viewEl(), function (n) { return n.tagName === 'BUTTON'; });
ok(expBtns.length === 2, '导出视图 2 个按钮（实际 ' + expBtns.length + '）');
var threw = false;
try { expBtns.forEach(function (b) { b.dispatch('click'); }); } catch (e) { threw = true; console.log(e); }
ok(!threw, '导出按钮点击无异常（JSON / Markdown 报告生成）');

console.log('────────────────────────────────────────────');
console.log(failures === 0 ? '  🟢 UI 冒烟测试全部通过' : '  🔴 失败 ' + failures + ' 项');
console.log('════════════════════════════════════════════');
process.exit(failures === 0 ? 0 : 1);
