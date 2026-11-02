import type { Action, Evaluation, Pair, RankGroup, Session } from './types';

export const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());
export class PreferenceConflict extends Error {
  constructor(public related: Action[]) { super('这次选择与已有偏好冲突。请撤销或修正相关历史选择后再继续。'); }
}

/** Equivalence classes + a DAG of strict preferences. Excluded IDs remain valid witnesses. */
export class PreferenceGraph {
  private parent = new Map<string, string>();
  private edges = new Map<string, Set<string>>();
  private closure = new Map<string, Set<string>>();
  constructor(ids: string[], actions: Action[]) {
    ids.forEach(id => this.parent.set(id, id));
    for (const a of actions) if (a.type === 'tie') {
      const x = this.root(a.pair[0]), y = this.root(a.pair[1]);
      if (x !== y) this.parent.set(y, x);
    }
    for (const a of actions) if (a.type === 'prefer') {
      const x = this.root(a.winner), y = this.root(a.loser);
      if (x === y) throw new PreferenceConflict(actions.filter(a => a.type === 'prefer' || a.type === 'tie'));
      if (!this.edges.has(x)) this.edges.set(x, new Set());
      this.edges.get(x)!.add(y);
    }
    const visiting = new Set<string>();
    const walk = (id: string): Set<string> => {
      if (visiting.has(id)) throw new PreferenceConflict(actions.filter(a => a.type === 'prefer' || a.type === 'tie'));
      if (this.closure.has(id)) return this.closure.get(id)!;
      visiting.add(id);
      const found = new Set<string>();
      for (const child of this.edges.get(id) ?? []) {
        found.add(child); walk(child).forEach(x => found.add(x));
      }
      visiting.delete(id); this.closure.set(id, found); return found;
    };
    for (const id of this.parent.keys()) walk(this.root(id));
  }
  root(id: string): string {
    const p = this.parent.get(id);
    if (p === undefined) throw Error('未知角色 ID');
    if (p === id) return id;
    const r = this.root(p); this.parent.set(id, r); return r;
  }
  compare(a: string, b: string): -1 | 0 | 1 | null {
    const x = this.root(a), y = this.root(b);
    if (x === y) return 0;
    if (this.closure.get(x)?.has(y)) return -1;
    if (this.closure.get(y)?.has(x)) return 1;
    return null;
  }
}

export function shuffled<T>(list: T[], seed: number): T[] {
  const result = [...list]; let x = seed >>> 0;
  const random = () => { x += 0x6d2b79f5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function evaluate(session: Session): Evaluation {
  const excluded = new Set<string>(), skipped = new Set<string>(), deferred = new Set<string>();
  let target = session.initialTarget, comparisons = 0, feelings = 0;
  for (const a of session.actions) {
    if (a.type === 'exclude') { excluded.add(a.id); skipped.delete(a.id); }
    if (a.type === 'skip' && !excluded.has(a.id)) skipped.add(a.id);
    if (a.type === 'restore') { excluded.delete(a.id); skipped.delete(a.id); }
    if (a.type === 'target') target = a.value;
    if (a.type === 'prefer' || a.type === 'tie') comparisons++;
    if (a.type === 'feeling') { deferred.add(pairKey(...a.pair)); feelings++; }
    if (a.type === 'revisit') deferred.clear();
  }
  const active = session.candidates.filter(id => !excluded.has(id) && !skipped.has(id));
  const graph = new PreferenceGraph(session.candidates, session.actions);
  const groups = new Map<string, string[]>();
  for (const id of active) { const root = graph.root(id); groups.set(root, [...(groups.get(root) ?? []), id]); }
  // Shuffle the original roster ONCE. Removing a candidate leaves a hole instead
  // of reshuffling every survivor (which discarded the tournament's structure).
  // Anchor a tie group to its first original slot, even if that member is inactive.
  const anchored = new Set<string>();
  const leaves = shuffled(session.candidates, session.seed).map(id => {
    const root = graph.root(id);
    if (anchored.has(root)) return [];
    anchored.add(root); return groups.get(root) ?? [];
  });
  const ranked: RankGroup[] = [];
  let size = 1; while (size < leaves.length) size *= 2;
  // undefined = unresolved, null = empty branch, number = winning leaf index.
  const tree: (number | null | undefined)[] = Array(size * 2).fill(undefined);
  for (let i = 0; i < size; i++) tree[size + i] = leaves[i]?.length ? i : null;
  let pairs: Pair[] = [];
  const resolve = (node: number): number | null | undefined => {
    if (tree[node] !== undefined || node >= size) return tree[node];
    const l = resolve(node * 2), r = resolve(node * 2 + 1);
    if (l === undefined || r === undefined) return undefined;
    if (l === null) return tree[node] = r;
    if (r === null) return tree[node] = l;
    const a = leaves[l][0], b = leaves[r][0], cmp = graph.compare(a, b);
    if (cmp === null) { pairs.push([a, b]); return undefined; }
    return tree[node] = cmp <= 0 ? l : r;
  };
  let count = 0;
  while (count < Math.min(target, active.length)) {
    pairs = [];
    let winner = resolve(1);
    // Imported sessions may have been compared under an older tree layout.
    // A globally proved maximum must not wait on unrelated lower branches.
    if (winner === undefined) {
      const remaining = leaves.map((ids,i)=>({ids,i})).filter(x=>x.ids.length && tree[size+x.i] !== null);
      winner = remaining.find(a=>remaining.every(b=>a.i===b.i || graph.compare(a.ids[0],b.ids[0])===-1))?.i;
    }
    if (winner === undefined || winner === null) break;
    ranked.push({ rank: count + 1, ids: [...leaves[winner]].sort() }); count += leaves[winner].length;
    // Remove the entire equivalence class. Only its ancestors need replay.
    let node = size + winner; tree[node] = null;
    while (node > 1) { node = Math.floor(node / 2); tree[node] = undefined; }
  }
  const complete = count >= Math.min(target, active.length);
  if (complete) pairs = [];
  const pair = pairs.find(p => !deferred.has(pairKey(...p))) ?? null;
  const pendingPairs = pairs.filter(p => deferred.has(pairKey(...p)));
  const remainingLeaves = Math.max(0, groups.size - ranked.length);
  // Empty branches never require a human choice. Count only unresolved nodes
  // that actually join two nonempty subtrees, including unvisited ancestors.
  let unresolvedNodes = 0;
  const countLive = (node: number): boolean => {
    if (node >= size) return tree[node] !== null;
    const l = countLive(node * 2), r = countLive(node * 2 + 1);
    if (l && r && tree[node] === undefined) unresolvedNodes++;
    return l || r;
  };
  countLive(1);
  const estimatedRemaining = complete ? 0 : unresolvedNodes + Math.max(0, Math.min(target - count, remainingLeaves) - 1) * Math.ceil(Math.log2(Math.max(1, leaves.length)));
  return { target, ranked, pair, status: !active.length ? 'empty' : complete ? 'complete' : pair ? 'comparing' : 'blocked',
    active, excluded: [...excluded], skipped: [...skipped], comparisons, feelings, pendingPairs, estimatedRemaining, conditional: skipped.size > 0 };
}

export function applyAction(session: Session, action: Action): Session {
  const state = evaluate(session);
  if ('id' in action && !session.candidates.includes(action.id)) throw Error('未知角色');
  if (action.type === 'target' && (!Number.isInteger(action.value) || action.value < 1 || action.value > session.candidates.length)) throw Error('排名人数超出范围');
  const pair = action.type === 'prefer' ? [action.winner, action.loser] : 'pair' in action ? action.pair : null;
  if (pair && (pair[0] === pair[1] || pair.some(id => !state.active.includes(id)))) throw Error('比较双方必须是不同的有效候选');
  const next = { ...session, actions: [...session.actions, action] };
  new PreferenceGraph(next.candidates, next.actions);
  return next;
}
export function undo(session: Session): Session { return { ...session, actions: session.actions.slice(0, -1) }; }
export function newSession(candidates: string[], target: number, scopes: Session['scopes'], datasetVersion: string, seed = Math.floor(Math.random() * 0xffffffff)): Session {
  if (!candidates.length || new Set(candidates).size !== candidates.length || target < 1 || !Number.isInteger(target) || target > candidates.length) throw Error('请选择有效的角色范围及排名人数');
  return { version: 1, id: crypto.randomUUID(), createdAt: new Date().toISOString(), datasetVersion, candidates: [...candidates], scopes: [...scopes], seed, initialTarget: target, actions: [] };
}
