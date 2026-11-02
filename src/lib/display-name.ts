// Explicit family-name list: do not guess by truncating a fixed character count.
const families='宇佐见 比那名居 丁礼田 尔子田 西行寺 上白泽 四季映姬 苏我 丰聪耳 少名针 玉造 依神 摩多罗 戎 豪德寺 庭渡 天弓 豫母都 宫出口 奥野田 三头 天火人 磐永 十六夜 博丽 雾雨 风见 红 蕾蒂 露娜萨 梅露兰 莉莉卡 魂魄 八云 伊吹 莉格露 米斯蒂娅 因幡 八意 蓬莱山 藤原 射命丸 小野塚 秋 键山 河城 犬走 东风谷 八坂 洩矢 永江 黑谷 水桥 星熊 古明地 火焰猫 灵乌 多多良 云居 村纱 寅丸 圣 封兽 姬海棠 幽谷 宫古 霍 物部 二岩 九十九 鬼人 堀川 稀神 坂田 高丽野 矢田寺 牛崎 吉吊 杖刀偶 埴安神 骊驹 饕餮 山城 驹草 菅牧 饭纲丸 姬虫 孙 日白 森近 绵月 稗田 茨木 本居 尘塚 道神 渡里'.split(' ').sort((a,b)=>b.length-a.length);
export function displayName(name:string):string {
  const special:Record<string,string>={'四季映姬·夜摩仙那度':'映姬','铃仙·优昙华院·因幡':'铃仙','少名针妙丸':'针妙丸'};
  if(special[name])return special[name];
  if(name.includes('·'))return name.split('·')[0];
  const family=families.find(f=>name.startsWith(f)&&name.length>f.length);
  return family?name.slice(family.length):name;
}
