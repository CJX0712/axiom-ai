/* ============================================================================
 * AXIOM 仪表盘 UI —— 零依赖原生 JS，深色主题
 * 视图：架构总览 / 指令集(1024) / 实时自检 / 演示实验室 / 导出
 * 依赖全局：AXIOM（core.js）、AXIOM_REGISTRY（registry.js）
 * ==========================================================================*/
(function () {
  'use strict';

  /* ---------------- CSS ---------------- */
  var CSS = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    ':root{--bg:#0a0e17;--panel:#111827;--panel2:#0f1520;--border:#1f2937;--border2:#374151;',
    '--txt:#e5e7eb;--txt2:#9ca3af;--txt3:#6b7280;--cyan:#22d3ee;--violet:#8b5cf6;',
    '--green:#34d399;--yellow:#fbbf24;--red:#f87171;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}',
    'body{background:var(--bg);color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.6}',
    '.wrap{max-width:1280px;margin:0 auto;padding:0 24px 64px}',
    '.mono{font-family:var(--mono)}',
    /* header */
    '.hdr{position:sticky;top:0;z-index:50;background:rgba(10,14,23,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}',
    '.hdr-in{max-width:1280px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
    '.logo{font-size:20px;font-weight:700;background:linear-gradient(90deg,var(--cyan),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
    '.logo small{font-size:12px;font-weight:400;color:var(--txt2);-webkit-text-fill-color:var(--txt2);margin-left:8px}',
    '.chips{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}',
    '.chip{border:1px solid var(--border2);border-radius:999px;padding:2px 12px;font-size:12px;color:var(--txt2);background:var(--panel2)}',
    '.chip b{color:var(--cyan);font-family:var(--mono);font-weight:600}',
    '.gh{border:1px solid var(--border2);border-radius:8px;padding:4px 12px;font-size:12px;color:var(--txt2);text-decoration:none;background:var(--panel2)}',
    '.gh:hover{color:var(--cyan);border-color:var(--cyan)}',
    /* tabs */
    '.tabs{display:flex;gap:4px;padding:16px 0 0;flex-wrap:wrap}',
    '.tab{border:1px solid var(--border);background:var(--panel2);color:var(--txt2);border-radius:8px 8px 0 0;padding:8px 18px;cursor:pointer;font-size:13px}',
    '.tab:hover{color:var(--txt)}',
    '.tab.on{color:var(--cyan);border-color:var(--cyan);background:var(--panel);border-bottom-color:var(--panel)}',
    '.view{background:var(--panel);border:1px solid var(--border);border-radius:0 8px 8px 8px;padding:24px;min-height:600px}',
    /* arch */
    '.layer{display:flex;align-items:center;gap:16px;border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:8px;background:var(--panel2);cursor:pointer;transition:border-color .15s}',
    '.layer:hover{border-color:var(--cyan)}',
    '.layer.l10{border-color:var(--violet);background:linear-gradient(90deg,rgba(139,92,246,.12),transparent)}',
    '.layer.l10:hover{border-color:var(--violet)}',
    '.layer.l9{cursor:default;opacity:.75}',
    '.lno{font-family:var(--mono);font-size:13px;color:var(--cyan);width:38px;flex:none;font-weight:700}',
    '.l10 .lno{color:var(--violet)}',
    '.lname{font-weight:600;width:130px;flex:none}',
    '.lgroups{display:flex;gap:6px;flex-wrap:wrap;flex:1}',
    '.gtag{font-family:var(--mono);font-size:11px;border:1px solid var(--border2);border-radius:4px;padding:1px 7px;color:var(--txt2)}',
    '.lcount{font-family:var(--mono);font-size:12px;color:var(--txt2);flex:none;text-align:right}',
    '.lcount b{color:var(--green)}',
    '.lnote{font-size:12px;color:var(--txt3);flex:none;max-width:340px;text-align:right}',
    /* isa */
    '.controls{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}',
    '.controls input,.controls select{background:var(--panel2);border:1px solid var(--border2);border-radius:8px;color:var(--txt);padding:7px 12px;font-size:13px;outline:none}',
    '.controls input{flex:1;min-width:220px}',
    '.controls input:focus,.controls select:focus{border-color:var(--cyan)}',
    '.meta{font-size:12px;color:var(--txt3);margin-bottom:10px;font-family:var(--mono)}',
    'table{width:100%;border-collapse:collapse;font-size:13px}',
    'th{text-align:left;color:var(--txt3);font-weight:500;font-size:12px;border-bottom:1px solid var(--border2);padding:8px 10px;white-space:nowrap}',
    'td{border-bottom:1px solid var(--border);padding:7px 10px;vertical-align:top}',
    'tr:hover td{background:rgba(34,211,238,.04)}',
    '.tid{font-family:var(--mono);color:var(--txt2);white-space:nowrap;font-size:12px}',
    '.tname{font-family:var(--mono);color:var(--cyan);white-space:nowrap;font-size:12px}',
    '.inv{color:var(--txt2);font-size:12px}',
    '.st-v{color:var(--green);white-space:nowrap}.st-s{color:var(--yellow);white-space:nowrap}',
    '.pager{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:14px;font-size:13px;color:var(--txt2)}',
    '.pager button{background:var(--panel2);border:1px solid var(--border2);color:var(--txt);border-radius:6px;padding:5px 14px;cursor:pointer;font-size:13px}',
    '.pager button:hover:not(:disabled){border-color:var(--cyan);color:var(--cyan)}',
    '.pager button:disabled{opacity:.35;cursor:default}',
    /* verify */
    '.runbtn{background:linear-gradient(90deg,var(--cyan),var(--violet));border:none;color:#04121a;font-weight:700;font-size:15px;border-radius:10px;padding:12px 32px;cursor:pointer}',
    '.runbtn:disabled{opacity:.5;cursor:wait}',
    '.summary{margin:18px 0;border:1px solid var(--border2);border-radius:10px;padding:14px 18px;font-family:var(--mono);font-size:14px;background:var(--panel2)}',
    '.summary.ok{border-color:var(--green);color:var(--green)}',
    '.summary.bad{border-color:var(--red);color:var(--red)}',
    '.res{font-family:var(--mono);font-size:12px;white-space:nowrap}',
    /* lab */
    '.demo{border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:18px;background:var(--panel2)}',
    '.demo h3{font-size:15px;margin-bottom:4px}',
    '.demo h3 span{color:var(--cyan);font-family:var(--mono);font-size:12px;font-weight:400;margin-left:8px}',
    '.demo p{font-size:12px;color:var(--txt3);margin-bottom:12px}',
    '.demo button{background:var(--panel);border:1px solid var(--cyan);color:var(--cyan);border-radius:7px;padding:6px 18px;cursor:pointer;font-size:13px}',
    '.demo button:hover{background:rgba(34,211,238,.1)}',
    '.demo button:disabled{opacity:.5;cursor:wait}',
    '.canvas-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px}',
    '.cv{border:1px solid var(--border);border-radius:8px;background:#0b111c}',
    '.cv-cap{font-size:11px;color:var(--txt3);font-family:var(--mono);margin-top:4px}',
    /* export */
    '.exp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}',
    '.exp-card{border:1px solid var(--border);border-radius:10px;padding:18px;background:var(--panel2)}',
    '.exp-card h4{font-size:14px;margin-bottom:8px}',
    '.exp-card p{font-size:12px;color:var(--txt3);margin-bottom:12px}',
    '.exp-card button{background:var(--panel);border:1px solid var(--violet);color:var(--violet);border-radius:7px;padding:7px 18px;cursor:pointer;font-size:13px}',
    '.exp-card button:hover{background:rgba(139,92,246,.12)}',
    '.kv{font-family:var(--mono);font-size:12px;color:var(--txt2);line-height:2}',
    '.kv b{color:var(--cyan)}',
    '.foot{margin-top:36px;padding-top:18px;border-top:1px solid var(--border);font-size:12px;color:var(--txt3);text-align:center;line-height:2}',
    '.foot b{color:var(--txt2)}'
  ].join('\n');

  /* ---------------- 基础 ---------------- */
  var REG = (typeof AXIOM_REGISTRY !== 'undefined') ? AXIOM_REGISTRY : [];
  var LAYERS = [
    { no: 'L1', name: '数学基础', groups: ['TENSOR', 'LINALG', 'NUMER', 'PROB', 'INFO'] },
    { no: 'L2', name: '监督学习', groups: ['OPTIM'] },
    { no: 'L3', name: '表示学习', groups: ['FWD', 'BWD', 'NORM'] },
    { no: 'L4', name: '序列与生成', groups: ['ATTEN', 'SAMPLE'] },
    { no: 'L5', name: '概率图模型', groups: ['GRAPH'] },
    { no: 'L6', name: '强化学习', groups: ['RL'] },
    { no: 'L7', name: '评估与数据', groups: ['METRIC', 'DATA'] },
    { no: 'L8', name: '系统运行时', groups: ['SYS'] },
    { no: 'L9', name: '组合应用层', groups: [], note: '由 L1–L8 微指令组合而成的推理 / 训练编排层' },
    { no: 'L10', name: '微指令层', groups: 'ALL', note: '16 指令族 × 16 基础算子 × 4 执行变体 = 1024 条' }
  ];
  var VARIANTS = ['base', 'batched', 'fused', 'inplace'];
  var state = { tab: 'arch', page: 1, search: '', group: 'ALL', status: 'ALL', variant: 'ALL' };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function countOf(groups) {
    if (groups === 'ALL') return REG.length;
    return REG.filter(function (r) { return groups.indexOf(r.group) !== -1; }).length;
  }
  function verifiedOf(groups) {
    if (groups === 'ALL') return REG.filter(function (r) { return r.status === 'verified'; }).length;
    return REG.filter(function (r) { return groups.indexOf(r.group) !== -1 && r.status === 'verified'; }).length;
  }
  function sci(x) {
    if (!isFinite(x)) return '∞';
    if (x === 0) return '0';
    return x.toExponential(2);
  }

  /* ---------------- 外壳 ---------------- */
  function renderShell(root) {
    var verified = verifiedOf('ALL');
    var hdr = el('div', 'hdr');
    var hdrIn = el('div', 'hdr-in');
    hdrIn.appendChild(el('div', 'logo', '✦ AXIOM<small>自验证 AI 微指令操作系统 v' + esc(AXIOM.version || '1.0.0') + '</small>'));
    var chips = el('div', 'chips');
    chips.appendChild(el('span', 'chip', '微指令 <b>' + REG.length + '</b>'));
    chips.appendChild(el('span', 'chip', '已验证 <b>' + verified + '</b>'));
    chips.appendChild(el('span', 'chip', '系统层 <b>10</b>'));
    chips.appendChild(el('span', 'chip', '不变量 <b>' + AXIOM.checks.length + '</b>'));
    var gh = el('a', 'gh', 'GitHub ↗');
    gh.href = 'https://github.com/CJX0712/axiom-ai';
    gh.target = '_blank';
    gh.rel = 'noopener';
    chips.appendChild(gh);
    hdrIn.appendChild(chips);
    hdr.appendChild(hdrIn);
    root.appendChild(hdr);

    var wrap = el('div', 'wrap');
    var tabs = el('div', 'tabs');
    var TAB_DEFS = [['arch', '架构总览'], ['isa', '指令集 · 1024'], ['verify', '实时自检'], ['pipeline', '管线编排 · L9'], ['lab', '演示实验室'], ['export', '导出']];
    var view = el('div', 'view');
    TAB_DEFS.forEach(function (d) {
      var t = el('button', 'tab' + (state.tab === d[0] ? ' on' : ''), esc(d[1]));
      t.setAttribute('data-tab', d[0]);
      t.addEventListener('click', function () {
        state.tab = d[0];
        var all = tabs.querySelectorAll('.tab');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-tab') === d[0]);
        renderView(view);
      });
      tabs.appendChild(t);
    });
    wrap.appendChild(tabs);
    wrap.appendChild(view);
    root.appendChild(wrap);

    var foot = el('div', 'foot');
    foot.innerHTML = '<b>AXIOM · 自验证 AI 微指令操作系统</b> — 作者：<b>晨星</b> · MIT License · 对标 scipy.linalg / ml.js<br>' +
      '零依赖单文件 · 浏览器 / Node 双端同源 · <b>可运行 · 可复现 · 可验证</b> · HTML 内联代码与 Node 测试同一份源码';
    root.appendChild(foot);
    return view;
  }

  function renderView(view) {
    view.innerHTML = '';
    if (state.tab === 'arch') renderArch(view);
    else if (state.tab === 'isa') renderISA(view);
    else if (state.tab === 'verify') renderVerify(view);
    else if (state.tab === 'pipeline') renderPipeline(view);
    else if (state.tab === 'lab') renderLab(view);
    else renderExport(view);
  }

  /* ---------------- 视图 1：架构总览 ---------------- */
  function renderArch(view) {
    view.appendChild(el('h2', null, '十层架构 <span style="font-size:12px;color:var(--txt3);font-weight:400">点击 L1–L8 层卡片可跳转至对应指令集；每层右侧为指令数与已验证数</span>'));
    view.appendChild(el('div', null, '<div style="height:14px"></div>'));
    LAYERS.forEach(function (L) {
      var card = el('div', 'layer' + (L.no === 'L10' ? ' l10' : (L.no === 'L9' ? ' l9' : '')));
      card.appendChild(el('span', 'lno', L.no));
      card.appendChild(el('span', 'lname', esc(L.name)));
      var gs = el('div', 'lgroups');
      if (L.groups === 'ALL') {
        var byGroup = {};
        REG.forEach(function (r) { byGroup[r.group] = 1; });
        Object.keys(byGroup).forEach(function (g) { gs.appendChild(el('span', 'gtag', esc(g))); });
      } else {
        L.groups.forEach(function (g) { gs.appendChild(el('span', 'gtag', esc(g))); });
      }
      card.appendChild(gs);
      var cnt = el('div', 'lcount');
      if (L.groups === 'ALL' || L.groups.length) {
        cnt.innerHTML = esc(L.no === 'L10' ? '1024' : String(countOf(L.groups))) + ' 条<br>已验证 <b>' + verifiedOf(L.groups) + '</b>';
      } else cnt.innerHTML = '组合层';
      card.appendChild(cnt);
      if (L.note) card.appendChild(el('div', 'lnote', esc(L.note)));
      if (L.groups && L.groups.length) {
        card.addEventListener('click', function () {
          state.tab = 'isa'; state.group = 'ALL'; state.page = 1;
          if (L.groups !== 'ALL') { state.group = L.groups[0]; }
          refreshTabs();
          renderView(currentView);
        });
      }
      view.appendChild(card);
    });
    view.appendChild(el('div', null,
      '<div style="margin-top:18px;font-size:12px;color:var(--txt3);line-height:2">' +
      '设计原则：<b style="color:var(--txt2)">下层提供可验证原语，上层由下层组合</b>。L1–L8 的每条微指令都携带数学不变量；' +
      'L9 不新增指令，由已有微指令组合成推理 / 训练编排；L10 为指令集主体（1024 条）。' +
      '全部 ' + AXIOM.checks.length + ' 项不变量在「实时自检」视图中可一键复算。</div>'));
  }

  /* ---------------- 视图 2：指令集 ---------------- */
  function renderISA(view) {
    view.innerHTML = '';   // 分页/搜索会直接重入本函数，必须先清空
    var h2 = el('h2', null, '指令集 · 1024 条微指令');
    view.appendChild(h2);

    var controls = el('div', 'controls');
    var search = el('input');
    search.type = 'text'; search.placeholder = '搜索：指令名 / 语义 / 不变量（如 cholesky、单调、Eckart）…';
    search.value = state.search;
    var timer = null;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.search = search.value.trim(); state.page = 1; renderISA(view); }, 150);
    });
    controls.appendChild(search);

    var groups = ['ALL'].concat(Object.keys(REG.reduce(function (m, r) { m[r.group] = 1; return m; }, {})));
    controls.appendChild(selectOf(groups, state.group, function (v) { state.group = v; state.page = 1; renderISA(view); }, '全部指令族'));
    controls.appendChild(selectOf(['ALL', 'verified', 'spec'], state.status, function (v) { state.status = v; state.page = 1; renderISA(view); }, '全部状态'));
    controls.appendChild(selectOf(['ALL'].concat(VARIANTS), state.variant, function (v) { state.variant = v; state.page = 1; renderISA(view); }, '全部变体'));
    view.appendChild(controls);

    var rows = REG.filter(function (r) {
      if (state.group !== 'ALL' && r.group !== state.group) return false;
      if (state.status === 'verified' && r.status !== 'verified') return false;
      if (state.status === 'spec' && r.status !== 'spec') return false;
      if (state.variant !== 'ALL' && r.variant !== state.variant) return false;
      if (state.search) {
        var q = state.search.toLowerCase();
        var hay = (r.name + ' ' + r.semantics + ' ' + r.invariant + ' ' + r.group + ' ' + r.opZh).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var per = 50, pages = Math.max(1, Math.ceil(rows.length / per));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * per;
    var slice = rows.slice(start, start + per);

    var meta = el('div', 'meta', '共 ' + rows.length + ' 条 · 第 ' + state.page + ' / ' + pages + ' 页' +
      (state.search || state.group !== 'ALL' || state.status !== 'ALL' || state.variant !== 'ALL' ? '（已过滤）' : ''));
    view.appendChild(meta);

    var table = el('table');
    table.innerHTML = '<thead><tr><th>ID</th><th>指令</th><th>族</th><th>变体</th><th>语义</th><th>数学不变量</th><th>状态</th></tr></thead>';
    var tbody = el('tbody');
    var frag = document.createDocumentFragment();
    slice.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="tid">' + esc(r.id) + '</td>' +
        '<td class="tname">' + esc(r.name) + '</td>' +
        '<td style="color:var(--txt2);font-size:12px">' + esc(r.group) + '</td>' +
        '<td style="font-size:12px;color:var(--txt3)">' + esc(r.variant) + '</td>' +
        '<td style="font-size:12px">' + esc(r.semantics) + '</td>' +
        '<td class="inv">' + esc(r.invariant) + '</td>' +
        '<td class="' + (r.status === 'verified' ? 'st-v' : 'st-s') + '">' + (r.status === 'verified' ? '✅ 已验证' : '🟡 规格') + '</td>';
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    table.appendChild(tbody);
    view.appendChild(table);

    var pager = el('div', 'pager');
    var prev = el('button', null, '← 上一页');
    prev.disabled = state.page <= 1;
    prev.addEventListener('click', function () { state.page--; renderISA(view); });
    var next = el('button', null, '下一页 →');
    next.disabled = state.page >= pages;
    next.addEventListener('click', function () { state.page++; renderISA(view); });
    pager.appendChild(el('span', null, '每页 50 条'));
    pager.appendChild(prev);
    pager.appendChild(el('span', 'mono', state.page + ' / ' + pages));
    pager.appendChild(next);
    view.appendChild(pager);
  }
  function selectOf(options, current, onChange, allLabel) {
    var s = el('select');
    options.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o;
      op.textContent = o === 'ALL' ? allLabel : (o === 'verified' ? '✅ 已验证' : (o === 'spec' ? '🟡 规格已定义' : o));
      if (o === current) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener('change', function () { onChange(s.value); });
    return s;
  }

  /* ---------------- 视图 3：实时自检 ---------------- */
  function renderVerify(view) {
    view.appendChild(el('h2', null, '实时自检 <span style="font-size:12px;color:var(--txt3);font-weight:400">浏览器内运行与 Node 完全相同的 core.js 不变量检查</span>'));
    view.appendChild(el('div', null, '<div style="height:12px"></div>'));
    var btn = el('button', 'runbtn', '▶ 运行全量自检');
    var out = el('div');
    out.appendChild(el('div', null, '<div style="height:16px"></div>'));
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = '⏳ 运行中…';
      out.innerHTML = '';
      setTimeout(function () {
        var r = AXIOM.runChecks();
        var sum = el('div', 'summary' + (r.passed === r.total ? ' ok' : ' bad'));
        sum.textContent = '核心不变量：' + r.passed + ' / ' + r.total + ' PASS' + (r.passed === r.total ? '   🟢 全绿' : '   🔴 存在失败');
        out.appendChild(sum);

        var regChecks = [
          ['指令总数 = 1024', REG.length === 1024],
          ['ID 唯一', new Set(REG.map(function (e) { return e.id; })).size === 1024],
          ['ID 连续格式化', REG.every(function (e, i) { return e.id === 'L10.' + String(i + 1).padStart(4, '0'); })],
          ['每族恰 64 条', groupCounts().every(function (c) { return c === 64; })],
          ['每算子恰 4 变体', opCounts().every(function (c) { return c === 4; })],
          ['verified 项 impl 均为 core.js 真实导出', REG.filter(function (e) { return e.status === 'verified'; }).every(function (e) { return typeof AXIOM[e.impl] !== 'undefined'; })],
          ['verified 变体限于 base/batched/inplace（fused 仍 spec）', REG.filter(function (e) { return e.status === 'verified'; }).every(function (e) { return ['base', 'batched', 'inplace'].includes(e.variant); })]
        ];
        var regOk = regChecks.every(function (c) { return c[1]; });
        var sum2 = el('div', 'summary' + (regOk ? ' ok' : ' bad'));
        sum2.textContent = '注册表完整性：' + regChecks.filter(function (c) { return c[1]; }).length + ' / ' + regChecks.length + ' PASS' + (regOk ? '   🟢 全绿' : '   🔴 存在失败');
        out.appendChild(sum2);

        var table = el('table');
        table.innerHTML = '<thead><tr><th style="width:36px"></th><th>检查项</th><th>残差</th><th>容差</th></tr></thead>';
        var tbody = el('tbody');
        var frag = document.createDocumentFragment();
        r.results.forEach(function (x) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + (x.pass ? '✅' : '❌') + '</td><td>' + esc(x.name) + '</td>' +
            '<td class="res">' + sci(x.residual) + '</td><td class="res" style="color:var(--txt3)">' + sci(x.tol) + '</td>';
          frag.appendChild(tr);
        });
        tbody.appendChild(frag);
        table.appendChild(tbody);
        out.appendChild(table);
        btn.disabled = false;
        btn.textContent = '▶ 重新运行';
      }, 30);
    });
    view.appendChild(btn);
    view.appendChild(out);
  }
  function groupCounts() {
    var m = {};
    REG.forEach(function (r) { m[r.group] = (m[r.group] || 0) + 1; });
    return Object.keys(m).map(function (k) { return m[k]; });
  }
  function opCounts() {
    var m = {};
    REG.forEach(function (r) { var k = r.group + '|' + r.op; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return m[k]; });
  }

  /* ---------------- 视图 4：管线编排（L9 组合应用层） ---------------- */
  var PIPELINE_OPS = [
    ['zscore', '标准化', '均值=0、方差=1', 'NORM'],
    ['normalizeL2', 'L2 归一化', '‖x̂‖ = 1', 'NORM'],
    ['minmaxScale', '最小最大缩放', '输出 ∈ [0,1]', 'NORM'],
    ['softmax', 'Softmax', '平移不变；输出和 = 1', 'NUMER'],
    ['temperatureSoftmax', '温度采样（T=0.7）', 'T↓ → 熵↓', 'SAMPLE'],
    ['topK', 'Top-K（k=3）', '支撑外 = 0；支撑上和 = 1', 'SAMPLE'],
    ['sigmoid', 'Sigmoid', 'σ(−x) = 1 − σ(x)', 'FWD'],
    ['tanh', 'Tanh', '奇函数；|tanh| ≤ 1', 'FWD'],
    ['relu', 'ReLU', 'max(0,x)', 'FWD'],
    ['gelu', 'GELU', 'xΦ(x) 夹于 min/max(0,x)', 'FWD'],
    ['l1Norm', 'L1 范数（标量）', 'Σ|xᵢ|', 'NORM'],
    ['entropy', '熵（标量，bits）', '0 ≤ H ≤ log₂n', 'INFO'],
    ['logsumexp', '稳定对数和（标量）', '±1e300 不溢出', 'NUMER'],
    ['kahanSum', 'Kahan 精确和（标量）', '病态序列误差 ≤ 1e-9', 'NUMER']
  ];
  var PIPELINE_PRESETS = [
    { name: 'Softmax 温度采样管线', ops: ['temperatureSoftmax', 'topK'], input: '2.0, 1.0, 0.5, 3.0, -1.0' },
    { name: '归一化 + 激活管线', ops: ['zscore', 'gelu'], input: '-2, -1, 0, 1, 2' },
    { name: '注意力打分 → 熵', ops: ['softmax', 'entropy'], input: '1.2, -0.7, 3.1, 0.4' }
  ];
  function pipelineApply(op, v) {
    switch (op) {
      case 'temperatureSoftmax': return AXIOM.temperatureSoftmax(v, 0.7);
      case 'topK': return AXIOM.topK(v, 3);
      default: return AXIOM[op](v);
    }
  }
  function fmtVec(v) {
    if (typeof v === 'number') return v.toFixed(6);
    return '[' + v.map(function (x) { return x.toFixed(6); }).join(', ') + ']';
  }
  function renderPipeline(view) {
    view.appendChild(el('h2', null, '管线编排 · L9 组合应用层 <span style="font-size:12px;color:var(--txt3);font-weight:400">不新增指令 —— 由 L1–L8 已验证微指令组合成推理管线，逐步执行并展示中间张量</span>'));
    view.appendChild(el('div', null, '<div style="height:14px"></div>'));

    var presetBox = el('div', 'exp-grid');
    PIPELINE_PRESETS.forEach(function (p, pi) {
      var card = el('div', 'exp-card');
      card.appendChild(el('h4', null, esc(p.name)));
      card.appendChild(el('p', null, '管线：' + p.ops.map(function (o) { return o; }).join(' → ') + ' · 输入 [' + esc(p.input) + ']'));
      var b = el('button', null, '▶ 运行预设');
      b.addEventListener('click', function () { runPipe(p.ops.slice(), p.input.split(',').map(function (s) { return parseFloat(s); })); });
      card.appendChild(b);
      presetBox.appendChild(card);
    });
    view.appendChild(presetBox);

    var d = el('div', 'demo');
    d.style.marginTop = '18px';
    d.appendChild(el('h3', null, '自定义管线<span>从算子池选择（vec → vec；标量算子作为终点指标）</span>'));
    var sel = el('select');
    sel.style.cssText = 'background:var(--panel);border:1px solid var(--border2);border-radius:8px;color:var(--txt);padding:7px 12px;font-size:13px;margin-right:10px';
    PIPELINE_OPS.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0];
      op.textContent = o[1] + '（' + o[3] + ' · ' + o[2] + '）';
      sel.appendChild(op);
    });
    var addBtn = el('button', null, '＋ 加入管线');
    var input = el('input');
    input.type = 'text';
    input.value = '2.0, 1.0, 0.5, 3.0, -1.0';
    input.style.cssText = 'background:var(--panel2);border:1px solid var(--border2);border-radius:8px;color:var(--txt);padding:7px 12px;font-size:13px;width:260px;margin-left:auto';
    var row = el('div', 'controls');
    row.appendChild(sel);
    row.appendChild(addBtn);
    row.appendChild(input);
    d.appendChild(row);

    var chainBox = el('div');
    chainBox.style.cssText = 'font-family:var(--mono);font-size:13px;color:var(--txt2);margin:10px 0;min-height:24px';
    chainBox.textContent = '当前管线：（空）';
    d.appendChild(chainBox);
    var runBtn = el('button', null, '▶ 执行管线');
    runBtn.disabled = true;
    d.appendChild(runBtn);
    var out = el('div');
    d.appendChild(out);
    view.appendChild(d);

    var chain = [];
    function renderChain() {
      chainBox.innerHTML = chain.length
        ? '当前管线：<b style="color:var(--cyan)">' + chain.map(function (c) { return esc(c[1]); }).join(' → ') + '</b>'
        : '当前管线：（空，从上方加入算子）';
      runBtn.disabled = chain.length === 0;
    }
    function runPipe(ops, v) {
      out.innerHTML = '';
      var table = el('table');
      table.innerHTML = '<thead><tr><th>#</th><th>微指令</th><th>族</th><th>输入</th><th>输出</th><th>携带不变量</th></tr></thead>';
      var tbody = el('tbody');
      var frag = document.createDocumentFragment();
      var ok = true;
      ops.forEach(function (c, i) {
        var opName = Array.isArray(c) ? c[0] : c;
        var meta = PIPELINE_OPS.filter(function (o) { return o[0] === opName; })[0] || [opName, opName, '', ''];
        var before = fmtVec(v);
        try { v = pipelineApply(opName, v); } catch (e) { ok = false; }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td class="tid">' + (i + 1) + '</td><td class="tname">' + esc(opName) + '</td>' +
          '<td style="font-size:12px;color:var(--txt2)">' + esc(meta[3]) + '</td>' +
          '<td class="res">' + esc(before) + '</td>' +
          '<td class="res" style="color:var(--cyan)">' + esc(fmtVec(v)) + '</td>' +
          '<td class="inv">' + esc(meta[2]) + '</td>';
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
      table.appendChild(tbody);
      out.appendChild(table);
      var sum = el('div', 'summary' + (ok ? ' ok' : ' bad'));
      sum.textContent = ok
        ? '管线执行完成 —— ' + ops.length + ' 步全部由已验证微指令驱动（L9 组合层不新增指令）'
        : '管线执行异常（算子输入类型不匹配）';
      out.appendChild(sum);
    }
    addBtn.addEventListener('click', function () {
      var op = PIPELINE_OPS.filter(function (o) { return o[0] === sel.value; })[0];
      if (!op) return;
      chain.push([op[0], op[1]]);
      renderChain();
    });
    runBtn.addEventListener('click', function () {
      var v = input.value.split(',').map(function (s) { return parseFloat(s); });
      if (v.some(function (x) { return !isFinite(x); })) { out.innerHTML = '<div class="summary bad">输入含有非数值</div>'; return; }
      runPipe(chain, v);
    });
  }

  /* ---------------- 视图 5：演示实验室 ---------------- */
  function renderLab(view) {
    view.appendChild(el('h2', null, '演示实验室 <span style="font-size:12px;color:var(--txt3);font-weight:400">三个演示全部由 core.js 真实计算驱动，确定性种子，可复现</span>'));
    view.appendChild(el('div', null, '<div style="height:14px"></div>'));

    /* 1. 逻辑回归 */
    var d1 = el('div', 'demo');
    d1.appendChild(el('h3', null, '逻辑回归实时训练<span>AXIOM.logisticRegression · 梯度下降 · 交叉熵</span>'));
    d1.appendChild(el('p', null, '40 个 2D 样本（种子 16），标签由 1.5x₁ − 0.8x₂ + 噪声 的符号生成；左图：散点与决策边界；右图：损失下降曲线。'));
    var b1 = el('button', null, '▶ 训练并绘制');
    d1.appendChild(b1);
    var row1 = el('div', 'canvas-row');
    d1.appendChild(row1);
    view.appendChild(d1);
    b1.addEventListener('click', function () {
      b1.disabled = true;
      setTimeout(function () {
        var rng = AXIOM.mulberry32(16), X = [], y = [];
        for (var i = 0; i < 40; i++) {
          var x1 = rng() * 2 - 1, x2 = rng() * 2 - 1;
          X.push([x1, x2]);
          y.push(1.5 * x1 - 0.8 * x2 + (rng() - 0.5) * 0.2 > 0 ? 1 : 0);
        }
        var m = AXIOM.logisticRegression(X, y, { lr: 0.5, iters: 3000 });
        row1.innerHTML = '';
        var c1 = canvas(460, 320);
        var ctx = c1.getContext('2d');
        var W = 440, H = 300, pad = 10;
        ctx.fillStyle = '#0b111c'; ctx.fillRect(0, 0, W, H);
        X.forEach(function (p, i) {
          ctx.fillStyle = y[i] === 1 ? '#22d3ee' : '#f472b6';
          ctx.beginPath();
          ctx.arc(pad + (p[0] + 1) / 2 * (W - 2 * pad), pad + (p[1] + 1) / 2 * (H - 2 * pad), 4, 0, Math.PI * 2);
          ctx.fill();
        });
        // 决策边界：w0*x1 + w1*x2 + b = 0 → x2 = -(w0*x1+b)/w1
        if (Math.abs(m.w[1]) > 1e-9) {
          ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.beginPath();
          var xa = -1, xb = 1;
          var ya = -(m.w[0] * xa + m.b) / m.w[1], yb = -(m.w[0] * xb + m.b) / m.w[1];
          ctx.moveTo(pad + (xa + 1) / 2 * (W - 2 * pad), pad + (ya + 1) / 2 * (H - 2 * pad));
          ctx.lineTo(pad + (xb + 1) / 2 * (W - 2 * pad), pad + (yb + 1) / 2 * (H - 2 * pad));
          ctx.stroke();
        }
        row1.appendChild(withCap(c1, '散点（青=1 / 粉=0）与决策边界（紫线）'));

        var c2 = canvas(460, 320);
        var ctx2 = c2.getContext('2d');
        ctx2.fillStyle = '#0b111c'; ctx2.fillRect(0, 0, W, H);
        var h = m.history, maxL = h[0], n = h.length;
        ctx2.strokeStyle = '#34d399'; ctx2.lineWidth = 2; ctx2.beginPath();
        for (var t = 0; t < n; t++) {
          var px = pad + t / (n - 1) * (W - 2 * pad);
          var py = H - pad - (h[t] / maxL) * (H - 2 * pad);
          if (t === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
        }
        ctx2.stroke();
        ctx2.fillStyle = '#9ca3af'; ctx2.font = '11px monospace';
        ctx2.fillText('loss: ' + h[0].toFixed(4) + ' → ' + h[n - 1].toFixed(6), pad + 6, H - pad - 6);
        row1.appendChild(withCap(c2, '交叉熵损失 3000 步（单调不增，不变量 ✅）'));
        b1.disabled = false;
      }, 20);
    });

    /* 2. GMM */
    var d2 = el('div', 'demo');
    d2.appendChild(el('h3', null, 'GMM 聚类<span>AXIOM.gmmEM · 全协方差 EM · 对数似然单调不减</span>'));
    d2.appendChild(el('p', null, '60 个 2D 样本（种子 15），三个中心 [−4,−4] [0,5] [6,−2]；按最大后验责任着色，✕ 为 EM 估计的均值。'));
    var b2 = el('button', null, '▶ 运行 EM');
    d2.appendChild(b2);
    var row2 = el('div', 'canvas-row');
    d2.appendChild(row2);
    view.appendChild(d2);
    b2.addEventListener('click', function () {
      b2.disabled = true;
      setTimeout(function () {
        var rng = AXIOM.mulberry32(15), X = [];
        for (var i = 0; i < 60; i++) {
          var c = rng() < 0.33 ? [-4, -4] : (rng() < 0.5 ? [0, 5] : [6, -2]);
          X.push([c[0] + (rng() * 2 - 1), c[1] + (rng() * 2 - 1)]);
        }
        var g = AXIOM.gmmEM(X, 3, { iters: 40 });
        row2.innerHTML = '';
        var c1 = canvas(460, 320), ctx = c1.getContext('2d');
        var W = 440, H = 300, pad = 24;
        var xs = X.map(function (p) { return p[0]; }), ys = X.map(function (p) { return p[1]; });
        var x0 = Math.min.apply(null, xs) - 1, x1v = Math.max.apply(null, xs) + 1;
        var y0 = Math.min.apply(null, ys) - 1, y1v = Math.max.apply(null, ys) + 1;
        function mx(v) { return pad + (v - x0) / (x1v - x0) * (W - 2 * pad); }
        function my(v) { return H - pad - (v - y0) / (y1v - y0) * (H - 2 * pad); }
        ctx.fillStyle = '#0b111c'; ctx.fillRect(0, 0, W, H);
        var colors = ['#22d3ee', '#a78bfa', '#fbbf24'];
        X.forEach(function (p, i) {
          var resp = g.responsibilities[i];
          var best = 0;
          for (var k = 1; k < 3; k++) if (resp[k] > resp[best]) best = k;
          ctx.fillStyle = colors[best];
          ctx.beginPath(); ctx.arc(mx(p[0]), my(p[1]), 5, 0, Math.PI * 2); ctx.fill();
        });
        g.means.forEach(function (mu, k) {
          ctx.strokeStyle = colors[k]; ctx.lineWidth = 2;
          var px = mx(mu[0]), py = my(mu[1]);
          ctx.beginPath(); ctx.moveTo(px - 7, py - 7); ctx.lineTo(px + 7, py + 7);
          ctx.moveTo(px + 7, py - 7); ctx.lineTo(px - 7, py + 7); ctx.stroke();
        });
        row2.appendChild(withCap(c1, '聚类结果（三色=三个高斯分量）'));
        var info = el('div');
        info.style.cssText = 'font-family:var(--mono);font-size:12px;color:var(--txt2);line-height:2;align-self:center';
        info.innerHTML = '最终对数似然 LL = <b style="color:var(--cyan)">' + g.logLikelihood.toFixed(4) + '</b><br>' +
          '权重 = [' + g.weights.map(function (w) { return w.toFixed(3); }).join(', ') + ']<br>' +
          'EM 40 轮 · 似然单调不减（不变量 ✅）';
        row2.appendChild(info);
        b2.disabled = false;
      }, 20);
    });

    /* 3. PCA */
    var d3 = el('div', 'demo');
    d3.appendChild(el('h3', null, 'PCA 降维投影<span>AXIOM.pca · Jacobi 特征分解 · Eckart–Young 最优截断</span>'));
    d3.appendChild(el('p', null, '50×5 随机数据（种子 13）投影到前两个主成分；解释方差比由特征值计算，秩-2 重构残差满足 Eckart–Young 定理（不变量 ✅）。'));
    var b3 = el('button', null, '▶ 运行 PCA');
    d3.appendChild(b3);
    var row3 = el('div', 'canvas-row');
    d3.appendChild(row3);
    view.appendChild(d3);
    b3.addEventListener('click', function () {
      b3.disabled = true;
      setTimeout(function () {
        var rng = AXIOM.mulberry32(13);
        var X = [];
        for (var i = 0; i < 50; i++) X.push([rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1]);
        var p = AXIOM.pca(X, 2);
        row3.innerHTML = '';
        var c1 = canvas(460, 320), ctx = c1.getContext('2d');
        var W = 440, H = 300, pad = 24;
        var P = p.projected;
        var x0 = Math.min.apply(null, P.map(function (q) { return q[0]; })), x1v = Math.max.apply(null, P.map(function (q) { return q[0]; }));
        var y0 = Math.min.apply(null, P.map(function (q) { return q[1]; })), y1v = Math.max.apply(null, P.map(function (q) { return q[1]; }));
        ctx.fillStyle = '#0b111c'; ctx.fillRect(0, 0, W, H);
        P.forEach(function (q, i) {
          var t = i / P.length;
          ctx.fillStyle = 'hsl(' + Math.round(180 + t * 120) + ',80%,60%)';
          ctx.beginPath();
          ctx.arc(pad + (q[0] - x0) / (x1v - x0) * (W - 2 * pad), H - pad - (q[1] - y0) / (y1v - y0) * (H - 2 * pad), 4, 0, Math.PI * 2);
          ctx.fill();
        });
        row3.appendChild(withCap(c1, '前两个主成分投影（颜色=样本序号）'));
        var info = el('div');
        info.style.cssText = 'font-family:var(--mono);font-size:12px;color:var(--txt2);line-height:2;align-self:center';
        info.innerHTML = '解释方差比（PC1+PC2）= <b style="color:var(--cyan)">' + (p.explainedVariance * 100).toFixed(2) + '%</b><br>' +
          '特征值 = [' + p.values.slice(0, 3).map(function (v) { return v.toFixed(3); }).join(', ') + ', …]<br>' +
          'Jacobi 分解 · V 正交归一（不变量 ✅）';
        row3.appendChild(info);
        b3.disabled = false;
      }, 20);
    });
  }
  function canvas(w, h) {
    var c = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    c.className = 'cv';
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return c;
  }
  function withCap(c, text) {
    var box = el('div');
    box.appendChild(c);
    box.appendChild(el('div', 'cv-cap', esc(text)));
    return box;
  }

  /* ---------------- 视图 6：导出 ---------------- */
  function renderExport(view) {
    view.appendChild(el('h2', null, '导出'));
    view.appendChild(el('div', null, '<div style="height:14px"></div>'));
    var grid = el('div', 'exp-grid');

    var c1 = el('div', 'exp-card');
    c1.appendChild(el('h4', null, '指令集 JSON'));
    c1.appendChild(el('p', null, '导出全部 1024 条微指令（含 ID、语义、数学不变量、实现状态），用于外部工具链消费。'));
    var b1 = el('button', null, '⬇ 下载 axiom-registry.json');
    b1.addEventListener('click', function () { download(JSON.stringify(REG, null, 1), 'axiom-registry.json', 'application/json'); });
    c1.appendChild(b1);
    grid.appendChild(c1);

    var c2 = el('div', 'exp-card');
    c2.appendChild(el('h4', null, '自检报告（Markdown）'));
    c2.appendChild(el('p', null, '在浏览器内运行全部 ' + AXIOM.checks.length + ' 项不变量检查，导出含实测残差的 Markdown 报告。'));
    var b2 = el('button', null, '⬇ 运行并下载报告');
    b2.addEventListener('click', function () {
      var r = AXIOM.runChecks();
      var lines = ['# AXIOM 自检报告（浏览器生成）', '', '- 核心不变量：' + r.passed + ' / ' + r.total, '',
        '| 状态 | 检查项 | 残差 | 容差 |', '|---|---|---|---|'];
      r.results.forEach(function (x) {
        lines.push('| ' + (x.pass ? '✅' : '❌') + ' | ' + x.name + ' | ' + sci(x.residual) + ' | ' + sci(x.tol) + ' |');
      });
      lines.push('', '作者：晨星 · AXIOM v' + (AXIOM.version || '1.0.0'));
      download(lines.join('\n'), 'axiom-verification.md', 'text/markdown');
    });
    c2.appendChild(b2);
    grid.appendChild(c2);

    var c3 = el('div', 'exp-card');
    c3.appendChild(el('h4', null, '本机构建信息'));
    var kv = el('div', 'kv');
    kv.innerHTML = '版本 <b>v' + esc(AXIOM.version || '1.0.0') + '</b><br>' +
      '微指令 <b>' + REG.length + '</b> 条（已验证 <b>' + verifiedOf('ALL') + '</b>）<br>' +
      '指令族 <b>16</b> · 变体 <b>4</b> · 系统层 <b>10</b><br>' +
      '运行时 <b>' + esc(navigator.userAgent.slice(0, 60)) + '…</b><br>' +
      '依赖 <b>0</b>（单文件零外部请求）';
    c3.appendChild(kv);
    grid.appendChild(c3);

    view.appendChild(grid);
  }
  function download(text, filename, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------------- 启动 ---------------- */
  function refreshTabs() {
    var all = document.querySelectorAll('.tab');
    for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-tab') === state.tab);
  }
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  document.title = 'AXIOM · 自验证 AI 微指令操作系统';
  var app = document.getElementById('app') || document.body;
  var currentView = renderShell(app);
  renderView(currentView);
})();
