import { readFile, writeFile, mkdir } from 'node:fs/promises';
const base = new URL('../.cache/sources/', import.meta.url);
const read = name => readFile(new URL(encodeURIComponent(name) + '.md', base), 'utf8');
const strip = s => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').trim();
const rows = (await read('官方角色列表')).split('\n').filter(l => /^\| (\[|后羿|石长姬|木花|瑞江|盐家|小丑|正直)/.test(l));
const facts = [], sources = [];
for (const line of rows) {
  const cells = line.split('|').slice(1, -1).map(c => c.trim());
  if (cells.length !== 8) throw Error('Unexpected table shape: ' + line);
  const key = cells[0].match(/\.\/(.*?)\.md/)?.[1] ?? strip(cells[0]);
  let body = ''; try { body = await read(key); } catch {}
  const section = body.split('### 官作出场记录')[1]?.split('## 一设资料')[0] ?? '';
  const appearances = [];
  // Only the explicit work-name and position columns, never navigation or theme-song links.
  for (const m of section.matchAll(/<td\s+rowspan="\d+"\s+style="width:120px"><b><a[^>]*href="\.\/(.*?)\.md"[^>]*>(.*?)<\/a><\/b><\/td><td[^>]*>([\s\S]*?)<\/td>/g)) {
    const pos = m[3], withoutMentions = strip(pos.replace(/<font color="#a9a9a9">[\s\S]*?<\/font>/gi, ''));
    const mentionedOnly = /#a9a9a9/i.test(pos) && !/[\d\p{L}]/u.test(withoutMentions.replace(/第|话|页|、|，|章|部|卷|,|\s/g, ''));
    appearances.push({ work: m[1].replaceAll('_', ' '), label: strip(m[2]), kind: mentionedOnly ? 'mentioned' : 'appearance' });
  }
  const first = cells[4].match(/\.\/(.*?)\.md/)?.[1]?.replaceAll('_', ' ') ?? strip(cells[4]);
  facts.push({ key, name: strip(cells[0]), japanese: strip(cells[1]), aliases: strip(cells[3]).split(/[，,]/).filter(Boolean), first, category: cells[6], appearances, hasAppearanceTable: !!section, stub: body.includes('missing from dump') });
  try { sources.push({ name: key, ...JSON.parse(await readFile(new URL(encodeURIComponent(key) + '.source.json', base), 'utf8')) }); } catch {}
}
// Pure-text index is independently reconciled during audit, rather than silently discarded.
const textIndex = [...(await read('官方角色列表-纯文字列表')).matchAll(/^- (?:\[([^\]]+)\]\([^\n]*?\)|([^\n／]+) \(未找到链接\))/gm)].map(m => m[1] ?? m[2]).filter(name => !/^\d+ /.test(name));
await mkdir(new URL('../data/', import.meta.url), {recursive:true});
await writeFile(new URL('../data/source-facts.json', import.meta.url), JSON.stringify({ facts, sources, textIndex }, null, 2) + '\n');
console.log('Extracted', facts.length, 'table records; names-only / structured appearance facts, no article prose.');
