export type Scope = 'windows' | 'decimal' | 'books' | 'pc98' | 'music';
export interface SourceRecord { id: string; url: string; retrievedAt: string; license: string; revision?: string; sha256?: string }
export interface Work { id: string; name: string; scope: Scope; source: string }
export interface Appearance { workId: string; kind: 'appearance' | 'mentioned' | 'unconfirmed'; source: string }
export interface Character { id: string; name: string; japanese: string; aliases: string[]; firstWork: string; appearances: Appearance[]; scopes: Scope[]; image: string | null; sources: string[]; verification: string }
export interface AssetRecord { characterId: string; path: string; author: string; source: string; permission: string; credit: string }
export type Pair = [string, string];
export type Action =
  | { type: 'prefer'; winner: string; loser: string }
  | { type: 'tie'; pair: Pair }
  | { type: 'feeling'; pair: Pair; feeling: 'like' | 'dislike' }
  | { type: 'exclude' | 'skip' | 'restore'; id: string }
  | { type: 'revisit' }
  | { type: 'target'; value: number };
export interface Session {
  version: 1; id: string; createdAt: string; datasetVersion: string;
  candidates: string[]; scopes: Scope[]; seed: number; initialTarget: number; actions: Action[];
}
export interface RankGroup { rank: number; ids: string[] }
export interface Evaluation {
  target: number; ranked: RankGroup[]; pair: Pair | null;
  status: 'comparing' | 'blocked' | 'complete' | 'empty';
  excluded: string[]; skipped: string[]; active: string[];
  comparisons: number; feelings: number; pendingPairs: Pair[];
  estimatedRemaining: number; conditional: boolean;
}
