// 将本地 commit 对象重建为与 GitHub 远端完全一致（当 API 推送产生的 commit SHA 与本地不一致时使用）
//
// 背景：GitHub REST 的 commit 对象与本地 git 存在细微差异 ——
//   ① 时区表示：GitHub 存 UTC（+0000），本地 git 存本地时区（如 +0800）；
//   ② 消息尾部：`git log --format=%B` 比 commit 对象正文多 1 个 '\n'（格式终止符），
//      而 GitHub **原样存储**提交上来的 message —— 故须按「发送前裁剪几个换行」对齐。
// 本工具按「时区 × 消息尾换行」六变体逐一重算 sha1，命中远端 sha 后把对象写入本地库并对齐 ref。
//
//   node tools/align-commit.js <remote-sha>
'use strict';
const { execSync } = require('child_process');
const crypto = require('crypto');
const TARGET = process.argv[2];
if (!TARGET) { console.error('用法: node tools/align-commit.js <remote-sha>'); process.exit(1); }
const ROOT = require('path').join(__dirname, '..');

const raw = execSync('git cat-file commit HEAD', { cwd: ROOT, encoding: 'buffer' });
const sep = raw.indexOf(Buffer.from('\n\n'));
const header = raw.slice(0, sep);
const message = raw.slice(sep + 2);

const shaOf = (content) => crypto.createHash('sha1')
  .update(Buffer.from('commit ' + content.length + '\0', 'binary')).update(content).digest('hex');

// 变体候选：时区 (+0800 / +0000) × 消息尾部 (原样 / +1 换行 / −1 换行)
// 结构：<header> + "\n\n" + <message>（header 本身不含尾换行）
// 实测：GitHub REST **原样存储**提交上来的 message —— 故差异只来自发送前如何裁剪 %B 的格式终止符。
const msgVariants = {
  'msg=原样': message,
  'msg=+1换行': Buffer.concat([message, Buffer.from('\n')]),
  'msg=-1换行': Buffer.from(message.toString('utf8').replace(/\n$/, ''), 'utf8')
};
const variants = [];
for (const tz of ['+0800', '+0000']) {
  const h = Buffer.from(header.toString('utf8').replace(/([+-]\d{4})$/gm, tz), 'utf8');
  for (const [mk, mv] of Object.entries(msgVariants)) {
    variants.push({ tag: 'tz=' + tz + ' ' + mk, content: Buffer.concat([h, Buffer.from('\n\n'), mv]) });
  }
}
let hit = null;
for (const v of variants) { if (shaOf(v.content) === TARGET) { hit = v; break; } }
if (!hit) {
  console.error('✗ 无匹配变体，远端 sha=' + TARGET);
  variants.forEach(v => console.log('   ' + shaOf(v.content) + '  ' + v.tag));
  process.exit(1);
}
console.log('匹配变体: ' + hit.tag);
execSync('git hash-object -t commit -w --stdin', { cwd: ROOT, input: hit.content });
const old = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
execSync('git update-ref refs/heads/main ' + TARGET + ' ' + old, { cwd: ROOT });
execSync('git update-ref refs/remotes/origin/main ' + TARGET, { cwd: ROOT });
console.log('✓ 本地 main / origin/main 已对齐 ' + TARGET);
