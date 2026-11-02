import argparse,json,re,hashlib,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
parser=argparse.ArgumentParser(description='Import selected dairi portraits from an authorized local full-body collection.')
parser.add_argument('source',type=Path,help='Path to the authorized full-body collection')
root=parser.parse_args().source
data=json.loads(Path('src/data/characters.json').read_text(encoding='utf8'))['characters'];sel=json.loads(Path('data/local-art-selection.json').read_text(encoding='utf8'))
Path('artifacts').mkdir(exist_ok=True)
Path('data/local-art-selection.json').write_text(json.dumps(sel,ensure_ascii=False,indent=2),encoding='utf8')
assets=[];missing=[]
for c in data:
 if c['id'] not in sel:missing.append({'id':c['id'],'name':c['name'],'reason':'用户全图包中尚未确认对应的普通比例角色素材；保留占位'});continue
 item=sel[c['id']];src=root/item['relative'];dest='assets/characters/'+c['id']+'.png';blob=src.read_bytes();Image.open(src).verify();shutil.copyfile(src,'public/'+dest)
 artid=re.search(r'(\d+)_p\d+',src.name).group(1)
 assets.append({'characterId':c['id'],'path':dest,'author':'dairi / はるか','source':'https://www.pixiv.net/artworks/'+artid,'localSource':item['relative'],'permission':'用户提供素材并于2026-10-31确认作者允许非商业使用','credit':'立绘 © dairi / はるか','sha256':hashlib.sha256(blob).hexdigest()})
Path('data/assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf8');Path('data/missing-art.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2),encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',15)
for page in range((len(assets)+29)//30):
 sheet=Image.new('RGB',(1200,1000),'#25323c');d=ImageDraw.Draw(sheet)
 for i,a in enumerate(assets[page*30:page*30+30]):
  im=Image.open('public/'+a['path']).convert('RGBA');im.thumbnail((190,165));x=(i%6)*200;y=(i//6)*200;sheet.paste(im,(x+(200-im.width)//2,y),im);d.text((x+4,y+170),sel[a['characterId']]['name'],font=font,fill='white')
 sheet.save(f'artifacts/art-sheet-{page}.jpg')
print('imported',len(assets),'missing',len(missing));print(' / '.join(c['name'] for c in missing))
