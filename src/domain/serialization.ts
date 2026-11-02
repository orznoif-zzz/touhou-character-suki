import { PreferenceGraph } from './engine';
import type { Action, Session } from './types';
const scopes = ['windows', 'decimal', 'books', 'pc98', 'music'];
/** Validate an untrusted JSON backup before touching the existing saved session. */
export function parseSession(value: unknown, knownIds: string[], datasetVersion: string): Session {
  const s = value as Session;
  if (!s || s.version !== 1 || s.datasetVersion !== datasetVersion) throw Error('存档版本或角色数据库版本不匹配，请保留原文件。');
  if (typeof s.id !== 'string' || s.id.length > 100 || typeof s.createdAt !== 'string' || !Number.isFinite(Date.parse(s.createdAt))) throw Error('存档信息损坏');
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) throw Error('存档随机种子无效');
  if (!Array.isArray(s.candidates) || !s.candidates.length || s.candidates.length > 1000 || s.candidates.some(id => !knownIds.includes(id)) || new Set(s.candidates).size !== s.candidates.length) throw Error('存档角色列表无效');
  if (!Array.isArray(s.scopes) || s.scopes.some(x => !scopes.includes(x))) throw Error('存档范围无效');
  const validTarget = (n: number) => Number.isInteger(n) && n >= 1 && n <= s.candidates.length;
  if (!validTarget(s.initialTarget) || !Array.isArray(s.actions) || s.actions.length > 50000) throw Error('存档操作记录无效');
  const inactive = new Set<string>();
  for (const a of s.actions as Action[]) {
    if (!a || typeof a !== 'object') throw Error('操作记录损坏');
    if (a.type === 'prefer' || a.type === 'tie' || a.type === 'feeling') {
      const p = a.type === 'prefer' ? [a.winner, a.loser] : a.pair;
      if (!Array.isArray(p) || p.length !== 2 || p[0] === p[1] || p.some(id => !s.candidates.includes(id) || inactive.has(id))) throw Error('无效比较记录');
      if (a.type === 'feeling' && a.feeling !== 'like' && a.feeling !== 'dislike') throw Error('无效感受记录');
    } else if (a.type === 'exclude' || a.type === 'skip' || a.type === 'restore') {
      if (!s.candidates.includes(a.id)) throw Error('未知角色');
      if (a.type === 'restore') inactive.delete(a.id); else inactive.add(a.id);
    } else if (a.type === 'target') { if (!validTarget(a.value)) throw Error('无效排名目标'); }
    else if (a.type !== 'revisit') throw Error('未知操作类型');
  }
  new PreferenceGraph(s.candidates, s.actions);
  return structuredClone(s);
}
