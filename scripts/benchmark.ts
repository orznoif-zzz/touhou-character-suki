import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { newSession, evaluate, applyAction } from '../src/domain/engine.ts';
const dataset=JSON.parse(await readFile(new URL('../src/data/characters.json',import.meta.url),'utf8'));
const results=[];
for(const n of [dataset.report.defaultCount,dataset.report.total]) for(const k of [3,5,10,20,50]) {
  const samples=[];
  for(let seed=0;seed<20;seed++) {
    const ids=Array.from({length:n},(_,i)=>String(i));let s=newSession(ids,k,[],dataset.version,seed);
    while(true){const e=evaluate(s);if(!e.pair){assert.deepEqual(e.ranked.flatMap(g=>g.ids),ids.slice(0,k));samples.push(e.comparisons);break;}const [a,b]=e.pair;s=applyAction(s,{type:'prefer',winner:Number(a)<Number(b)?a:b,loser:Number(a)<Number(b)?b:a});}
  }
  const bound=n-1+(k-1)*Math.ceil(Math.log2(n));assert(Math.max(...samples)<=bound);
  results.push({candidates:n,top:k,seeds:20,min:Math.min(...samples),max:Math.max(...samples),mean:Number((samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(1)),upperBound:bound});
}
await writeFile(new URL('../docs/benchmarks.json',import.meta.url),JSON.stringify({datasetVersion:dataset.version,assumption:'固定严格全序，20 个均匀打乱种子，无排除、并列、跳过、反悔',results},null,2));
console.table(results);
// Test-only UI fixtures: named sample candidates, no preferences attributed to the user.
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
const sampleNames=['博丽灵梦','雾雨魔理沙','十六夜咲夜','八云紫','古明地恋','宇佐见莲子'];
const fixture=newSession(sampleNames.map(name=>dataset.characters.find((c:{name:string})=>c.name===name).id),3,['windows','decimal','music'],dataset.version,777);
await writeFile(new URL('../artifacts/test-session.json',import.meta.url),JSON.stringify(fixture,null,2));
