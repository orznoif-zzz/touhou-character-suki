import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const d=JSON.parse(await readFile(new URL('../src/data/characters.json',import.meta.url),'utf8'));
assert.equal(new Set(d.characters.map(c=>c.id)).size,d.characters.length,'duplicate ID');
assert.equal(new Set(d.characters.map(c=>c.name)).size,d.characters.length,'duplicate identity');
const works=new Set(d.works.map(w=>w.id));
for(const c of d.characters){assert(c.name&&c.sources.length&&c.scopes.length);assert(works.has(c.firstWork));for(const a of c.appearances)assert(works.has(a.workId)&&a.source);assert(c.image===null||c.image.startsWith('assets/characters/'));}
assert.equal(d.report.textIndexUnmatched.length,0,'unreconciled text-index entry');
for(const name of ['博丽灵梦','雾雨魔理沙','风见幽香','爱丽丝·玛格特洛依德']){const c=d.characters.find(c=>c.name===name);assert(c.scopes.includes('windows')&&c.scopes.includes('pc98'));}
for(const name of ['桑尼米尔克','露娜切露德','斯塔萨菲雅','茨木华扇','万岁乐']){const c=d.characters.find(c=>c.name===name);assert(c.scopes.includes('books')&&c.scopes.includes('decimal'));}
for(const name of ['绵月丰姬','尘塚姥芽','封兽魑魅','道神驯子','维缦·浅间','磐永阿梨夜','渡里贝子'])assert(d.characters.find(c=>c.name===name)?.scopes.includes('windows'));
assert(d.characters.find(c=>c.name==='云山')?.id!==d.characters.find(c=>c.name==='云居一轮')?.id);
assert(d.characters.find(c=>c.name==='石长姬')?.id!==d.characters.find(c=>c.name==='磐永阿梨夜')?.id);
const scopeNames={windows:'Windows 整数正作',decimal:'小数点作品',books:'出版物原创',pc98:'PC-98',music:'音乐及其他独有'};
const text=`# 数据覆盖报告\n\n快照版本：${d.version}。构建日期：2026-10-30。\n\n## 实际人数\n\n去重总数 **${d.characters.length}**；默认整数作 + 小数作范围 **${d.report.defaultCount}**。\n\n| 范围 | 人数（可重叠） |\n|---|---:|\n${Object.entries(d.report.counts).map(([s,n])=>`| ${scopeNames[s]} | ${n} |`).join('\n')}\n\n## 验证口径\n\n- 主表 ${d.report.decisions.filter(x=>x.status!=='included-supplement').length} 条记录全部有收录、合并或排除结论；纯文字索引未对齐项：${d.report.textIndexUnmatched.length}。\n- 分类按照首发来源及已核对的实际游戏登场取并集；具名设定角色保留 mentioned 标记。出版物范围只表示原创来源，不因在漫画出现就将全部角色纳入该范围。\n- 共 ${d.works.length} 个作品条目，${d.characters.reduce((n,c)=>n+c.appearances.length,0)} 条作品关联。来源条目缺少登场表不等于缺少角色本身。\n- 所有唯一 ID、身份去重、作品引用、范围交集、锦上京角色、跨新旧作合并与一轮／云山拆分已通过自动核验。\n\n## 已知限制\n\n${d.report.limitations.map(l=>'- '+l).join('\n')}\n\n## 出场记录缺口\n\n${d.report.gaps.map(g=>'- '+g.name+'：'+g.reason).join('\n')}\n\n## 边界与合并\n\n${d.report.decisions.filter(d=>d.status==='excluded'||d.status==='merged').map(d=>'- '+d.name+'：'+(d.reason??'合并至 '+d.id)).join('\n')}\n\n## 详细机器可读报告\n\n[coverage.json](./coverage.json) 包含分类交集、各作品人数、逐条收录决策和碎片角色边界清单。不是截至当前所有出版章节的完整性证明。\n`;
await writeFile(new URL('../docs/DATA_COVERAGE.md',import.meta.url),text);
console.log('Data checks passed:',d.characters.length,'characters;',d.works.length,'works;',d.report.defaultCount,'default candidates.');
