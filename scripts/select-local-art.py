from pathlib import Path
import json,re
chars=json.loads(Path('src/data/characters.json').read_text(encoding='utf8'))['characters']; paths=json.loads(Path('.cache/standard-art.json').read_text(encoding='utf8'))
manual={'博丽灵梦':'39486261','雾雨魔理沙':'39261304','十六夜咲夜':'39547480','藤原妹红':'35581867','八意永琳':'34199683','米斯蒂娅·萝蕾拉':'36956948','上白泽慧音':'37725138','古明地觉':'37179537','古明地恋':'36080352','灵乌路空':'132550396','火焰猫燐':'36921045','娜兹玲':'36207805','霍青娥':'36732834','封兽鵺':'65173764','射命丸文':'33858946','姬海棠果':'57886956','高丽野阿吽':'64751064','坂田合欢':'64733323','冈崎梦美':'46178351','玛艾露贝莉·赫恩':'42759455','因幡帝':'40190956','蕾米莉亚·斯卡蕾特':'71407907','芙兰朵露·斯卡蕾特':'40346048','八云紫':'40272628','八云蓝':'33718126','宇佐见堇子':'50686999','少名针妙丸':'65630015','稀神探女':'52376610','神玉':'54951994','幽幻魔眼':'60089622','非想天则':'56574987','爱丽丝·玛格特洛依德':'55306217','稗田阿求':'37422815','大妖精':'39785627','洩矢诹访子':'41296540','铃仙·优昙华院·因幡':'67252239','四季映姬·夜摩仙那度':'63428536','莉莉霍瓦特':'37413503','风见幽香':'41646587'}
# Selected normal costumes, no damage/chibi/gender swaps or unofficial extra characters.
paths=[p for p in paths if not re.search('やら|男性|擬人化|旧作|モブ|鬼華扇|影華扇|ここぁ|衣装|ver|ポーズ差分',p.split('\\')[-1]) or re.match('|'.join(manual.values()),p.split('\\')[-1])]
def norm(s):return re.sub(r'[\s・·～〜]','',s)
chosen={}
for c in chars:
 keys=[c['name'],c['japanese']]+re.split('[\s　]+',c['japanese'])
 keys=[norm(k) for k in keys if len(norm(k))>=2]
 options=[]
 for p in paths:
  title=re.sub(r'^\d+_p0-?','',p.split('\\')[-1]).split('立ち絵')[0]
  if c['name'] in manual:
   if p.split('\\')[-1].startswith(manual[c['name']]+'_'):options=[p];break
  elif any(norm(title)==k or norm(title) in [k+'様',k+'さん',k+'ちゃん'] for k in keys):options.append(p)
 if options:chosen[c['id']]={'name':c['name'],'relative':max(options,key=lambda p:int(re.search(r'(\d+)_p0',p).group(1)))}
Path('data/local-art-selection.json').write_text(json.dumps(chosen,ensure_ascii=False,indent=2),encoding='utf8')
print('selected',len(chosen));print('missing:', ' / '.join(c['name']+'('+c['japanese']+')' for c in chars if c['id'] not in chosen))
