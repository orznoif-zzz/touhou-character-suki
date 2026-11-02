import fs from 'node:fs';
import { evaluate, PreferenceGraph } from '../src/domain/engine.ts';
const input=process.argv[2];
if(!input)throw Error('Usage: node --experimental-transform-types scripts/audit-user-session.ts <session.json> [report.json]');
const s=JSON.parse(fs.readFileSync(input,'utf8'));
const data=JSON.parse(fs.readFileSync('src/data/characters.json','utf8'));
const names=new Map(data.characters.map(c=>[c.id,c.name]));
const counts={}; const exclusions=[]; const jumps=[];let prev=evaluate({...s,actions:[]});
for(let i=0;i<s.actions.length;i++){
 const a=s.actions[i]; counts[a.type]=(counts[a.type]??0)+1;
 const e=evaluate({...s,actions:s.actions.slice(0,i+1)});
 if(a.type==='exclude')exclusions.push({step:i+1,name:names.get(a.id),before:prev.estimatedRemaining,after:e.estimatedRemaining,comparisons:e.comparisons});
 if(e.ranked.flatMap(g=>g.ids).length-prev.ranked.flatMap(g=>g.ids).length>1)jumps.push({step:i+1,before:prev.ranked,after:e.ranked,action:a});
 prev=e;
}
const graph=new PreferenceGraph(s.candidates,s.actions);const violations=[];
const ranked=prev.ranked;
for(const g of ranked)for(const id of g.ids)for(const other of prev.active){const og=ranked.find(x=>x.ids.includes(other)); if(other!==id&&(!og||og.rank>g.rank)&&graph.compare(id,other)!==-1)violations.push([id,other]);}
const report={candidates:s.candidates.length,initialTarget:s.initialTarget,counts,final:prev,ranking:ranked.map(g=>({rank:g.rank,names:g.ids.map(id=>names.get(id))})),exclusions,jumps,violations};
fs.writeFileSync(process.argv[3] ?? 'artifacts/session-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({candidates:report.candidates,counts,ranking:report.ranking,exclusions,jumps:jumps.map(j=>({step:j.step,before:j.before.length,after:j.after.length})),violations},null,2));
