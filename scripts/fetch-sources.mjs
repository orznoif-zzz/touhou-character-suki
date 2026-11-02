// Explicit, serial, cached research downloads. Never used by the running app.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = new URL('../.cache/sources/', import.meta.url);
await mkdir(dir, { recursive: true });
const names = process.argv.slice(2);
if (names[0] === '--roster') {
  const roster = await readFile(new URL('官方角色列表.md', dir), 'utf8');
  names.splice(0, names.length, ...new Set(roster.split('\n').filter(l => l.startsWith('| [')).map(l => l.match(/^\| \[[^\]]+\]\(\.\/(.*?)\.md/)[1]).filter(n => !n.includes('#'))));
}
const defaults = ['官方角色列表', '官方角色列表-纯文字列表', '碎片角色列表', '官方游戏', '官方出版物', '官方音乐CD'];
for (const name of names.length ? names : defaults) {
  const file = new URL(encodeURIComponent(name) + '.md', dir);
  try { await readFile(file); console.log('cached', name); continue; } catch {}
  const url = 'https://raw.githubusercontent.com/Delsin-Yu/THBWiki-Markdown/main/sources/' + encodeURIComponent(name) + '.md';
  const response = await fetch(url, { headers: { 'User-Agent': 'GensokyoPreferenceJournal/1.0 (research; cached serial requests)' } });
  if (response.status === 403 || response.status === 429) throw Error('Access limited: stop, do not bypass');
  if (!response.ok) { console.log(response.status, name); continue; }
  const body = await response.text();
  await writeFile(file, body);
  await writeFile(new URL(encodeURIComponent(name) + '.source.json', dir), JSON.stringify({ url, retrievedAt: new Date().toISOString(), sha256: createHash('sha256').update(body).digest('hex') }, null, 2));
  console.log(name, body.length);
  await new Promise(resolve => setTimeout(resolve, 1200));
}
