import { expect, it } from 'vitest';
import { characters, coverage, selectCharacters } from './index';
it('filters by union, never subtraction or duplicate identities',()=>{
  const all=selectCharacters(['windows','decimal','books','pc98','music']);expect(all).toHaveLength(coverage.total);
  const basic=selectCharacters(['windows','decimal']);expect(basic).toHaveLength(coverage.defaultCount);expect(new Set(basic.map(c=>c.id)).size).toBe(basic.length);
  expect(basic.some(c=>c.name==='绵月丰姬')).toBe(true);
  expect(basic.some(c=>c.name==='桑尼米尔克')).toBe(true);
  expect(selectCharacters([])).toEqual([]);
  expect(new Set(characters.map(c=>c.id)).size).toBe(characters.length);
});
