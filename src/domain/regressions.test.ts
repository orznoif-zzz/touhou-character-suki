import { expect, it } from 'vitest';
import fc from 'fast-check';
import { applyAction, evaluate, newSession, PreferenceGraph, undo } from './engine';
import { explainPreference } from './evidence';
import type { Session } from './types';
const ids=(n:number)=>Array.from({length:n},(_,i)=>String(i));
function answer(s:Session) {
  const [a,b]=evaluate(s).pair!;
  return applyAction(s,{type:'prefer',winner:+a<+b?a:b,loser:+a<+b?b:a});
}
it('exclusion does not reshuffle unrelated pending pairs or reset progress',()=>{
  let s=newSession(ids(126),10,[],'test',123);
  for(let i=0;i<30;i++)s=answer(s);
  const before=evaluate(s), remove=before.pair![0];
  const after=evaluate(applyAction(s,{type:'exclude',id:remove}));
  expect(after.estimatedRemaining).toBeLessThanOrEqual(before.estimatedRemaining + Math.ceil(Math.log2(126)));
  expect(after.comparisons).toBe(before.comparisons);
  expect(after.active).not.toContain(remove);
  expect(applyAction(s,{type:'exclude',id:remove}).actions.slice(0,-1)).toEqual(s.actions);
});
it('random mid-session exclusions preserve exact top K and only locally repair the tree',()=>{
  fc.assert(fc.property(fc.integer({min:12,max:45}),fc.integer({min:1,max:999999}),(n,seed)=>{
    let s=newSession(ids(n),Math.min(10,n),[],'test',seed), steps=0;
    while(evaluate(s).pair){
      const before=evaluate(s);
      if(steps%7===3&&before.active.length>12){
        const next=applyAction(s,{type:'exclude',id:before.pair![0]});
        expect(evaluate(next).estimatedRemaining).toBeLessThanOrEqual(before.estimatedRemaining+Math.ceil(Math.log2(n)));
        expect(evaluate(undo(next))).toEqual(before);s=next;
      }else{
        s=answer(s);
        expect(evaluate(s).estimatedRemaining).toBeLessThan(before.estimatedRemaining);
      }
      expect(++steps).toBeLessThan(500);
    }
    const result=evaluate(s);
    expect(result.ranked.flatMap(g=>g.ids)).toEqual(result.active.sort((a,b)=>+a-+b).slice(0,10));
  }),{numRuns:40});
});
it('recognizes proved ranks from arbitrary old tree layouts without asking irrelevant low comparisons',()=>{
  let s=newSession(ids(15),5,[],'test',17);
  // Prove 0 > 1 > ... > 4 and 4 > everyone else, without ordering lower ranks.
  for(let i=0;i<4;i++)s=applyAction(s,{type:'prefer',winner:String(i),loser:String(i+1)});
  for(let i=5;i<15;i++)s=applyAction(s,{type:'prefer',winner:'4',loser:String(i)});
  const e=evaluate(s);expect(e.status).toBe('complete');expect(e.estimatedRemaining).toBe(0);
  expect(e.ranked.flatMap(g=>g.ids)).toEqual(ids(5));
  s=applyAction(s,{type:'target',value:10});expect(evaluate(s).pair).not.toBeNull();
});
it('every displayed rank has graph evidence against every lower or unranked candidate',()=>{
  let s=newSession(ids(31),20,[],'test',88);
  while(true){
    const e=evaluate(s),graph=new PreferenceGraph(s.candidates,s.actions);
    const ordered=e.ranked.flatMap(g=>g.ids);
    for(let i=0;i<ordered.length;i++)for(const other of e.active.filter(x=>!ordered.slice(0,i+1).includes(x))){
      expect(graph.compare(ordered[i],other)).toBe(-1);
      expect(explainPreference(s,ordered[i],other)?.length).toBeGreaterThan(0);
    }
    if(!e.pair)break;
    expect(e.estimatedRemaining).toBeGreaterThan(0);s=answer(s);
  }
});
it('explains direct, transitive and tied witnesses with original event numbers',()=>{
  let s=newSession(ids(5),3,[],'test',1);
  s=applyAction(s,{type:'prefer',winner:'0',loser:'1'});
  s=applyAction(s,{type:'tie',pair:['1','2']});
  s=applyAction(s,{type:'prefer',winner:'2',loser:'3'});
  s=applyAction(s,{type:'exclude',id:'1'});
  expect(explainPreference(s,'0','3')?.map(x=>x.event)).toEqual([1,2,3]);
  expect(explainPreference(s,'3','0')).toBeNull();
  expect(explainPreference(s,'0','4')).toBeNull();
  expect(explainPreference(s,'2','1')?.[0].relation).toBe('tie');
});
