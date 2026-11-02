import assets from '../../data/assets.json';
import { characters as characterData, works as workData, version, report } from './characters.json';
import type { Character, Scope, Work } from '../domain/types';
export const characters: Character[] = (characterData as Character[]).map(c=>({...c,image:assets.find(a=>a.characterId===c.id)?.path ?? c.image}));
export const works = workData as Work[];
export const datasetVersion = version;
export const coverage = report;
export const byId = new Map(characters.map(c => [c.id, c]));
export const workById = new Map(works.map(w => [w.id, w]));
export const scopeOptions: { id: Scope; name: string; subtitle: string; number: string }[] = [
  {id:'windows',name:'整数正作',subtitle:'红魔乡至锦上京 · Windows',number:'01'},
  {id:'decimal',name:'小数点作品',subtitle:'外传、格斗与弹幕的另一面',number:'02'},
  {id:'books',name:'官方出版物',subtitle:'从纸页走入幻想的原创角色',number:'03'},
  {id:'pc98',name:'旧作时代',subtitle:'灵异传至怪绮谈 · PC-98',number:'04'},
  {id:'music',name:'音乐与其他',subtitle:'秘封俱乐部与其他官方故事',number:'05'},
];
export const selectCharacters = (scopes: Scope[]) => characters.filter(c=>c.scopes.some(s=>scopes.includes(s)));
export const firstWorkName = (c: Character) => workById.get(c.firstWork)?.name ?? '来源待核验';
