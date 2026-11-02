import { expect, it } from 'vitest';
import { displayName } from './display-name';
it.each([['博丽灵梦','灵梦'],['十六夜咲夜','咲夜'],['红美铃','美铃'],['比那名居天子','天子'],['古明地觉','觉'],['少名针妙丸','针妙丸'],['铃仙·优昙华院·因幡','铃仙'],['蕾米莉亚·斯卡蕾特','蕾米莉亚'],['琪露诺','琪露诺'],['无名的读书妖怪','无名的读书妖怪']])('uses the given name for %s',(full,given)=>expect(displayName(full)).toBe(given));
