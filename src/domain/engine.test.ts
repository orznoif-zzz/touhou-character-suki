import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { applyAction, evaluate, newSession, pairKey, PreferenceConflict, undo } from './engine';
import { parseSession } from './serialization';
import type { Session } from './types';
const ids = (n: number) => Array.from({length:n}, (_,i) => String(i));
function finish(s: Session, rank = (id: string) => Number(id)) {
  const seen = new Set<string>();
  for (let i = 0; i < 15000; i++) {
    const e = evaluate(s); if (!e.pair) return s;
    const [a,b] = e.pair; const key = pairKey(a,b);
    expect(seen.has(key)).toBe(false); seen.add(key);
    s = applyAction(s, rank(a) === rank(b) ? {type:'tie', pair:[a,b]} : {type:'prefer',winner:rank(a)<rank(b)?a:b,loser:rank(a)<rank(b)?b:a});
  }
  throw Error('did not terminate');
}
const flat = (s: Session) => evaluate(s).ranked.flatMap(g=>g.ids);
describe('exact tournament extraction', () => {
  it('matches a hidden total order for arbitrary seeds, odd sizes and targets', () => {
    fc.assert(fc.property(fc.integer({min:1,max:65}), fc.integer({min:0,max:0xffffffff}), fc.integer({min:1,max:65}), (n,seed,k0) => {
      const k=Math.min(k0,n), s=finish(newSession(ids(n),k,[],'test',seed));
      expect(flat(s)).toEqual(ids(k));
      expect(evaluate(s).comparisons).toBeLessThanOrEqual(n-1+(k-1)*Math.ceil(Math.log2(n)));
    }), {numRuns:80});
  }, 60000);
  it.each([3,5,10,20,50])('gets Top %i without full sorting', k => {
    const s=finish(newSession(ids(160),k,[],'test',20261030));
    expect(flat(s)).toEqual(ids(k)); expect(evaluate(s).comparisons).toBeLessThanOrEqual(159+(k-1)*8);
  });
  it('extends a finished prefix and keeps previous decisions', () => {
    const s=finish(newSession(ids(50),3,[],'test',42));
    const more=finish(applyAction(s,{type:'target',value:10}));
    expect(flat(more)).toEqual(ids(10)); expect(more.actions.slice(0,s.actions.length)).toEqual(s.actions);
  });
});
describe('preference state semantics', () => {
  it('removes a champion or loser without losing other candidates; undo restores exactly', () => {
    const s=finish(newSession(ids(17),5,[],'test',7));
    for(const id of ['0','4','16']) {
      const changed=applyAction(s,{type:'exclude',id});
      expect(flat(finish(changed))).toEqual(ids(17).filter(x=>x!==id).slice(0,5));
      expect(undo(changed)).toEqual(s); expect(evaluate(undo(changed))).toEqual(evaluate(s));
    }
  });
  it('defers ambiguous feelings without inferring a winner and does not loop', () => {
    let s=newSession(ids(8),3,[],'test',2);
    for(let i=0;i<4;i++) { const pair=evaluate(s).pair!; expect(pair).toBeTruthy(); s=applyAction(s,{type:'feeling',pair,feeling:i%2?'like':'dislike'}); }
    expect(evaluate(s).status).toBe('blocked'); expect(flat(s)).toEqual([]); expect(evaluate(s).comparisons).toBe(0);
    s=applyAction(s,{type:'revisit'}); expect(flat(finish(s))).toEqual(ids(3));
  });
  it('skips are conditional, restoration recovers the true top and can be undone', () => {
    const s=applyAction(newSession(ids(9),3,[],'test',5),{type:'skip',id:'0'});
    const conditional=finish(s); expect(flat(conditional)).toEqual(['1','2','3']); expect(evaluate(conditional).conditional).toBe(true);
    const restored=finish(applyAction(conditional,{type:'restore',id:'0'})); expect(flat(restored)).toEqual(ids(3)); expect(evaluate(restored).conditional).toBe(false);
  });
  it('returns complete tie groups across the boundary with competition ranks', () => {
    const s=finish(newSession(ids(13),4,[],'test',4),id=>Math.floor(Number(id)/3));
    expect(evaluate(s).ranked.map(g=>({rank:g.rank,ids:g.ids.map(Number).sort((a,b)=>a-b)}))).toEqual([{rank:1,ids:[0,1,2]},{rank:4,ids:[3,4,5]}]);
  });
  it('matches randomized weak orders with ties', () => {
    fc.assert(fc.property(fc.integer({min:2,max:35}),fc.integer({min:1,max:5}),fc.integer({min:0,max:99999}),(n,width,seed)=>{
      const k=Math.min(10,n), s=finish(newSession(ids(n),k,[],'test',seed),id=>Math.floor(Number(id)/width));
      const got=flat(s).map(Number).sort((a,b)=>a-b); const end=Math.min(n,Math.ceil(k/width)*width);
      expect(got).toEqual(ids(end).map(Number));
    }),{numRuns:40});
  },60000);
  it('rejects cycles, contradictory ties, inactive and self comparisons', () => {
    let s=newSession(ids(3),3,[],'test');
    s=applyAction(s,{type:'prefer',winner:'0',loser:'1'}); s=applyAction(s,{type:'prefer',winner:'1',loser:'2'});
    expect(()=>applyAction(s,{type:'prefer',winner:'2',loser:'0'})).toThrow(PreferenceConflict);
    expect(()=>applyAction(s,{type:'tie',pair:['0','2']})).toThrow(PreferenceConflict);
    expect(()=>applyAction(s,{type:'tie',pair:['0','0']})).toThrow();
    expect(()=>applyAction(applyAction(s,{type:'skip',id:'0'}),{type:'tie',pair:['0','2']})).toThrow();
  });
  it('handles all skipped/excluded and a single candidate', () => {
    let s=newSession(ids(3),3,[],'test'); for(const id of ids(3)) s=applyAction(s,{type:'skip',id});
    expect(evaluate(s).status).toBe('empty'); expect(evaluate(s).conditional).toBe(true);
    for(const id of ids(3)) s=applyAction(s,{type:'exclude',id});
    expect(evaluate(s).conditional).toBe(false); expect(flat(newSession(['x'],1,[],'test'))).toEqual(['x']);
  });
  it('replays a serialized session and rejects corrupt or incompatible data', () => {
    const s=finish(newSession(ids(20),5,[],'test',9));
    expect(evaluate(parseSession(JSON.parse(JSON.stringify(s)),ids(20),'test'))).toEqual(evaluate(s));
    expect(()=>parseSession({...s,version:2},ids(20),'test')).toThrow();
    expect(()=>parseSession({...s,candidates:['bogus']},ids(20),'test')).toThrow();
    expect(()=>parseSession({...s,actions:[{type:'tie',pair:['0','0']}]},ids(20),'test')).toThrow();
    expect(()=>parseSession(s,ids(20),'different')).toThrow();
  });
});
