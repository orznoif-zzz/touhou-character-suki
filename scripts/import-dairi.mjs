import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const data=JSON.parse(await fs.readFile('src/data/characters.json','utf8'));
const assets=[],missing=[];
for(const c of data.characters){
 const filename=`${c.name==='因幡帝'?'因幡天为':c.name==='铃仙二号'?'铃仙':c.name}（dairi绘）.png`;
 const hash=crypto.createHash('md5').update(filename).digest('hex');
 const url=`https://upload.thwiki.cc/${hash[0]}/${hash.slice(0,2)}/${encodeURIComponent(filename)}`;
 const path=`assets/characters/${c.id}.png`;
 try{
  let bytes;
  try{bytes=await fs.readFile('public/'+path);}catch{
   const r=await fetch(url);if(r.status===403||r.status===429)throw Error('STOP '+r.status);
   if(!r.ok){missing.push({id:c.id,name:c.name,reason:`source HTTP ${r.status}`,source:url});continue;}
   bytes=Buffer.from(await r.arrayBuffer());
   if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('not PNG');
   await fs.writeFile('public/'+path,bytes);
  }
  assets.push({characterId:c.id,path,author:'dairi / はるか',source:url,sourcePage:'https://thwiki.cc/文件:'+filename,permission:'用户于 2026-10-31 确认已获作者非商业使用许可；不代表向第三方授予再分发权',credit:'立绘 © dairi / はるか',sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }catch(e){missing.push({id:c.id,name:c.name,reason:String(e)});if(String(e).includes('STOP'))break;}
 finally{await fs.writeFile('data/assets.json',JSON.stringify(assets,null,2));await fs.writeFile('data/missing-art.json',JSON.stringify(missing,null,2));await new Promise(r=>setTimeout(r,1000));}
 console.log(`${assets.length} imported: ${c.name}`);
}
console.log({imported:assets.length,missing:missing.length});
