import { beforeEach, expect, it, vi } from 'vitest';
import { newSession } from '../domain/engine';
const mock = vi.hoisted(()=>({put:vi.fn(),get:vi.fn(),getAll:vi.fn(),delete:vi.fn()}));
vi.mock('idb',()=>({openDB:vi.fn(async()=>mock)}));
import { saveActive, loadActive, saveResult, loadResults } from './storage';
beforeEach(()=>{vi.clearAllMocks();mock.put.mockResolvedValue(undefined);});
it('surfaces quota failures and allows the next write to recover',async()=>{
  const s=newSession(['a','b'],1,[],'test');mock.put.mockRejectedValueOnce(new Error('QuotaExceededError'));
  await expect(saveActive(s)).rejects.toThrow('QuotaExceededError');
  await expect(saveActive(s)).resolves.toBeUndefined();expect(mock.put).toHaveBeenCalledTimes(2);
});
it('serializes queued writes and snapshots input before asynchronous save',async()=>{
  const s=newSession(['a','b'],1,[],'test');const first=saveActive(s);s.actions.push({type:'skip',id:'a'});const second=saveActive(s);
  await Promise.all([first,second]);expect(mock.put.mock.calls[0][1].actions).toHaveLength(0);expect(mock.put.mock.calls[1][1].actions).toHaveLength(1);
});
it('persists history separately and returns newest first',async()=>{
  const s=newSession(['a'],1,[],'test');await saveResult(s);expect(mock.put.mock.calls[0][0]).toBe('results');
  mock.get.mockResolvedValue(s);expect(await loadActive()).toEqual(s);
  mock.getAll.mockResolvedValue([{session:s,savedAt:'2026-01-01'},{session:s,savedAt:'2026-02-01'}]);expect((await loadResults())[0].savedAt).toBe('2026-02-01');
});
