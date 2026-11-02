import type { Action, Session } from './types';

export interface EvidenceStep { from: string; to: string; relation: 'prefer' | 'tie'; event: number }
/** Shortest witness in original choices, not synthetic transitive edges. */
export function explainPreference(session: Session, from: string, to: string): EvidenceStep[] | null {
  if (from === to) return [];
  const edges = new Map<string, EvidenceStep[]>();
  const add = (step: EvidenceStep) => edges.set(step.from, [...(edges.get(step.from) ?? []), step]);
  session.actions.forEach((a, i) => {
    if (a.type === 'prefer') add({from:a.winner,to:a.loser,relation:'prefer',event:i+1});
    if (a.type === 'tie') {
      add({from:a.pair[0],to:a.pair[1],relation:'tie',event:i+1});
      add({from:a.pair[1],to:a.pair[0],relation:'tie',event:i+1});
    }
  });
  const queue = [from], seen = new Set([from]), previous = new Map<string, EvidenceStep>();
  for (let i=0; i<queue.length; i++) for (const edge of edges.get(queue[i]) ?? []) {
    if (seen.has(edge.to)) continue;
    seen.add(edge.to); previous.set(edge.to,edge); queue.push(edge.to);
    if (edge.to === to) {
      const path: EvidenceStep[]=[]; let id=to;
      while(id!==from) { const step=previous.get(id)!; path.push(step); id=step.from; }
      return path.reverse();
    }
  }
  return null;
}
export function actionCharacters(a: Action): string[] {
  return a.type==='prefer'?[a.winner,a.loser]:'pair' in a?a.pair:'id' in a?[a.id]:[];
}
