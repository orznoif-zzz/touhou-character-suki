import { openDB } from 'idb';
import type { Session } from '../domain/types';
export interface SavedResult { session: Session; savedAt: string }
const db = () => openDB('gensokyo-preference-journal', 1, { upgrade(database) { database.createObjectStore('session'); database.createObjectStore('results', { keyPath: 'session.id' }); } });
export async function loadActive(): Promise<unknown> { return (await db()).get('session', 'active'); }
// Serialize writes so a slower previous write can never replace newer state.
let pending = Promise.resolve();
export function saveActive(session: Session): Promise<void> {
  const snapshot = structuredClone(session);
  const write = pending.catch(() => {}).then(async () => { await (await db()).put('session', snapshot, 'active'); });
  pending = write; return write;
}
export async function saveResult(session: Session): Promise<void> { await (await db()).put('results', { session: structuredClone(session), savedAt: new Date().toISOString() }); }
export async function loadResults(): Promise<SavedResult[]> { return (await (await db()).getAll('results')).sort((a, b) => b.savedAt.localeCompare(a.savedAt)); }
export async function deleteResult(id: string): Promise<void> { await (await db()).delete('results', id); }
