import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const readJSON = async p => JSON.parse(await readFile(new URL(p, root), 'utf8'));
const c = await readJSON('data/curation.json'), input = await readJSON('data/source-facts.json');
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 12);
const windows = '东方红魔乡 东方妖妖梦 东方永夜抄 东方花映塚 东方风神录 东方地灵殿 东方星莲船 东方神灵庙 东方辉针城 东方绀珠传 东方天空璋 东方鬼形兽 东方虹龙洞 东方兽王园 东方锦上京'.split(' ');
const decimal = '东方萃梦想 东方绯想天 东方非想天则 东方心绮楼 东方深秘录 东方凭依华 东方刚欲异闻 东方文花帖 东方文花帖DS 妖精大战争 弹幕天邪鬼 秘封噩梦日记 弹幕狂们的黑市'.split(' ');
const pc98 = '东方灵异传 东方封魔录 东方梦时空 东方幻想乡 东方怪绮谈'.split(' ');
const scopeOf = (name, fallback = 'books') => windows.includes(name) ? 'windows' : decimal.includes(name) ? 'decimal' : pc98.includes(name) ? 'pc98' : fallback;
const canonical = key => c.merges[key] ?? key;
const wiki = s => 'https://thwiki.cc/' + s;
const works = new Map(), characters = new Map(), decisions = [], gaps = [];
function work(name, scope = scopeOf(name)) { const id = 'work-' + hash(name); works.set(id, { id, name, scope, source: wiki(name) }); return id; }
function addAppearance(char, name, scope, kind, source) {
  const workId = work(name, scope);
  const old = char.appearances.find(a => a.workId === workId);
  if (!old) char.appearances.push({ workId, kind, source });
  else if (kind === 'appearance') old.kind = kind;
  if (kind === 'appearance' && ['windows', 'decimal', 'pc98'].includes(scope) && !char.scopes.includes(scope)) char.scopes.push(scope);
}
for (const f of input.facts) {
  if (c.excluded[f.name]) { decisions.push({ name: f.name, status: 'excluded', reason: c.excluded[f.name] }); continue; }
  const key = canonical(f.key), name = c.displayNames[f.name] ?? (f.key in c.merges ? c.merges[f.key] : f.name);
  const originScope = scopeOf(f.first, f.category === '其他' ? 'music' : 'books');
  let ch = characters.get(key);
  if (!ch) { ch = { id: 'char-' + hash(key), name, japanese: f.japanese, aliases: [], firstWork: work(f.first, originScope), appearances: [], scopes: [], image: null, sources: [], verification: '来源快照已核对；登场记录可能不完整' }; characters.set(key, ch); }
  if (!(f.key in c.merges)) { ch.name = name; ch.japanese = f.japanese; }
  ch.aliases = [...new Set([...ch.aliases, ...f.aliases, ...(name !== f.name ? [f.name] : [])])];
  // PC-98 identity is earliest for the four explicitly merged characters.
  if (originScope === 'pc98') ch.firstWork = work(f.first, originScope);
  if (!ch.scopes.includes(originScope)) ch.scopes.push(originScope);
  ch.sources.push(wiki(f.key.replaceAll('-', '/')));
  addAppearance(ch, f.first, originScope, c.mentionedOrigins.includes(f.name) ? 'mentioned' : 'appearance', wiki('官方角色列表'));
  for (const a of f.appearances) addAppearance(ch, a.work, scopeOf(a.work, /CD|秘封|蓬莱人形|莲台野|梦违|卯酉|大空|鸟船|伊奘诺|燕石|旧约|虹色/.test(a.work) ? 'music' : 'books'), a.kind, wiki(f.key));
  decisions.push({ name: f.name, sourceKey: f.key, status: f.key in c.merges ? 'merged' : 'included', id: ch.id });
  if (!f.hasAppearanceTable) gaps.push({ name: f.name, reason: f.stub ? '镜像仅有摘要，无出场表' : '无可解析出场表，仅保留已确认来源' });
}
const fragmentSource = 'https://thwiki.cc/index.php?title=碎片角色列表&oldid=937844';
for (const f of c.supplements) {
  let ch = characters.get(f.name); const source = f.source ?? fragmentSource;
  if (!ch) { ch = { id: 'char-' + hash(f.name), name: f.name, japanese: f.japanese, aliases: [], firstWork: work(f.work, f.scope), appearances: [], scopes: [f.scope], image: null, sources: [source], verification: '补充条目：来源网页已核对' }; characters.set(f.name, ch); }
  addAppearance(ch, f.work, f.scope, f.kind ?? 'appearance', source);
  for (const name of f.extraWorks ?? []) addAppearance(ch, name, scopeOf(name), 'appearance', source);
  decisions.push({ name: f.name, status: 'included-supplement', id: ch.id, source });
}
for (const row of c.extraAppearances) for (const name of row.names) addAppearance(characters.get(name), row.work, scopeOf(row.work), 'appearance', row.source);
const result = [...characters.values()];
// Grouped source row has Japanese names joined; the two people are separate identities.
const ichirin = result.find(x => x.name === '云居一轮'); if (ichirin) ichirin.japanese = '雲居 一輪';
const scopes = ['windows','decimal','books','pc98','music'];
const counts = Object.fromEntries(scopes.map(s => [s, result.filter(ch => ch.scopes.includes(s)).length]));
const textIndexUnmatched = input.textIndex.filter(n => !decisions.some(d => d.name === n) && !['主角二人组'].includes(n));
const report = { total: result.length, counts, defaultCount: result.filter(ch => ch.scopes.some(s => s === 'windows' || s === 'decimal')).length,
  intersections: Object.fromEntries(scopes.flatMap((s,i) => scopes.slice(i+1).map(t => [s+'+'+t, result.filter(ch => ch.scopes.includes(s) && ch.scopes.includes(t)).length]))),
  byWork: [...works.values()].map(w => ({...w, count: result.filter(ch => ch.appearances.some(a => a.workId === w.id)).length})),
  decisions, fragmentBoundary: c.fragmentNotIncluded.map(name => ({ name, status: 'excluded-or-pending', reason: '无名次要个体、群体、未实装或种族性称呼；当前不纳入，待新增官方身份依据复核' })),
  gaps, textIndexUnmatched, limitations: c.limitations };
const payload = { version: '2026-10-30-' + hash(JSON.stringify(result)), characters: result, works: [...works.values()], assets: [],
  sources: input.sources.map(s => ({ id: hash(s.url), url: s.url.replace('/main/', '/'+c.mirrorCommit+'/'), retrievedAt: s.retrievedAt, revision: c.mirrorCommit, sha256: s.sha256, license: 'CC BY-NC-SA 3.0 (source text; link mismatch documented)' })), report };
await mkdir(new URL('src/data/', root), { recursive: true });
await mkdir(new URL('docs/', root), { recursive: true });
await writeFile(new URL('src/data/characters.json', root), JSON.stringify(payload, null, 2) + '\n');
await writeFile(new URL('docs/coverage.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ total: report.total, counts, default: report.defaultCount, missingTables: gaps.length, unmatched: textIndexUnmatched }, null, 2));
