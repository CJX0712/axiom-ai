// Git Data API 推送（github.com 不可达时的闭环通道）
// 流程：blob(逐文件校验 sha) → tree(校验 == 本地 tree) → commit → PATCH ref
//
// 适用场景：本机网络下 github.com:443 不可达（仅 api.github.com 可达），
//           而 git 的 https 传输需要 github.com → `git push` 必然失败。
//           本工具改走 GitHub REST 的 Git Data API（api.github.com），
//           逐层构造 blob / tree / commit / ref，等价于一次完整推送。
//
//   node tools/push-api.js
//
// 自校验：每个 blob 的 sha 必须与 git 本地 blob sha 一致（内容逐字节相同）；
//         生成的 tree sha 必须与本地 HEAD 的 tree sha 一致（树结构完全相同）。
//         任一不符即中止，不会推送半成品。
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'CJX0712/axiom-ai';
const API = 'https://api.github.com';
const ROOT = path.join(__dirname, '..');

const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'axiom-push',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(method + ' ' + endpoint + ' → ' + res.status + ' ' + txt.slice(0, 500));
  return JSON.parse(txt);
}

(async () => {
  const localHead = sh('git rev-parse HEAD');
  const localTree = sh('git cat-file -p HEAD').split('\n')[0].trim().split(/\s+/)[1];
  const remoteRef = await api('GET', '/repos/' + REPO + '/git/ref/heads/main');
  const remoteHead = remoteRef.object.sha;
  const remoteCommit = await api('GET', '/repos/' + REPO + '/git/commits/' + remoteHead);
  const remoteTree = remoteCommit.tree.sha;
  console.log('local head : ' + localHead);
  console.log('local tree : ' + localTree);
  console.log('remote head: ' + remoteHead);
  console.log('remote tree: ' + remoteTree);

  if (remoteHead === localHead) { console.log('远端已是最新，无需推送。'); return; }

  const changed = sh('git diff --name-only ' + remoteHead + ' ' + localHead).split('\n').filter(Boolean);
  console.log('changed files (' + changed.length + '): ' + changed.join(', '));

  // 1) blobs（逐个校验 sha 与 git 本地一致 → 内容逐字节一致）
  const entries = [];
  for (const rel of changed) {
    const buf = fs.readFileSync(path.join(ROOT, rel));
    const mode = sh('git ls-tree -r ' + localHead + ' -- ' + JSON.stringify(rel)).split(/\s+/)[0];
    const localBlobSha = sh('git rev-parse ' + localHead + ':' + rel);
    const b = await api('POST', '/repos/' + REPO + '/git/blobs', {
      content: buf.toString('base64'), encoding: 'base64'
    });
    if (b.sha !== localBlobSha) throw new Error('blob sha 不一致: ' + rel + ' api=' + b.sha + ' local=' + localBlobSha);
    entries.push({ path: rel, mode: mode, type: 'blob', sha: b.sha });
    console.log('  blob OK  ' + b.sha.slice(0, 10) + '  ' + rel);
  }

  // 2) tree（校验 == 本地 tree sha → 树结构逐字节一致）
  const t = await api('POST', '/repos/' + REPO + '/git/trees', {
    base_tree: remoteTree, tree: entries
  });
  if (t.sha !== localTree) throw new Error('tree sha 不一致: api=' + t.sha + ' local=' + localTree);
  console.log('  tree OK  ' + t.sha + '  (== 本地 tree)');

  // 3) commit
  //    ⚠️ `git log --format=%B` 的输出 = 提交正文 + 一个格式终止符（即比 commit 对象里的正文多 1 个 '\n'）。
  //    GitHub REST **原样存储**提交上来的 message，故此处必须**恰好去掉 1 个**尾部换行，
  //    使 GitHub 存储的 message 与本地 commit 对象正文逐字节相同 → commit SHA 直接一致。
  //    （去掉全部尾部换行会导致远端正文少一个 '\n'，SHA 与本地不符。）
  const meta = sh('git log -1 --format=%an%n%ae%n%aI%n%cn%n%ce%n%cI').split('\n');
  const message = execSync('git log -1 --format=%B', { cwd: ROOT, encoding: 'utf8' }).replace(/\n$/, '');
  const c = await api('POST', '/repos/' + REPO + '/git/commits', {
    message: message,
    tree: t.sha,
    parents: [remoteHead],
    author: { name: meta[0], email: meta[1], date: meta[2] },
    committer: { name: meta[3], email: meta[4], date: meta[5] }
  });
  console.log('  commit   api=' + c.sha + '  local=' + localHead + (c.sha === localHead ? '  ✓ SHA 一致' : '  ✗ SHA 不同 → 跑 node tools/align-commit.js ' + c.sha));

  // 4) 更新 ref
  const ref = await api('PATCH', '/repos/' + REPO + '/git/refs/heads/main', { sha: c.sha, force: false });
  console.log('  ref updated: ' + ref.object.sha);
  console.log('\nDONE remote main = ' + ref.object.sha);
})().catch(e => { console.error('PUSH FAILED: ' + e.message); process.exit(1); });
