import { byId, firstWorkName, scopeOptions } from '../data';
import { evaluate } from '../domain/engine';
import type { Session } from '../domain/types';
export function downloadBlob(blob: Blob, filename: string) {
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function exportJSON(session: Session) { downloadBlob(new Blob([JSON.stringify(session,null,2)],{type:'application/json'}),`幻想乡偏爱录-${session.id.slice(0,8)}.json`); }
export const resultLabel = (s: Session) => { const e=evaluate(s); return e.status==='complete' ? e.conditional?'仅已评范围确定':'全范围已确定' : '暂定 · 尚未完成'; };
export async function renderPosters(session: Session): Promise<Blob[]> {
  await document.fonts.ready;
  const state=evaluate(session), rows=state.ranked.flatMap(g=>g.ids.map(id=>({id,rank:g.rank,tied:g.ids.length>1})));
  if (!rows.length) throw Error('还没有确定名次，先完成一些比较吧。');
  const pages:Blob[]=[]; const pageSize=20;
  for(let start=0;start<rows.length;start+=pageSize) {
    const slice=rows.slice(start,start+pageSize), canvas=document.createElement('canvas'); canvas.width=1080; canvas.height=560+slice.length*100;
    const ctx=canvas.getContext('2d'); if(!ctx) throw Error('浏览器不支持图片导出');
    const gradient=ctx.createLinearGradient(0,0,1080,canvas.height);gradient.addColorStop(0,'#1b2c36');gradient.addColorStop(1,'#10171e');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,canvas.height);
    ctx.strokeStyle='#6f614b';ctx.lineWidth=1;ctx.strokeRect(30,30,1020,canvas.height-60);
    ctx.fillStyle='#c8aa75';ctx.font='20px sans-serif';ctx.fillText('G E N S O K Y O   /   P R E F E R E N C E   J O U R N A L',75,90);
    ctx.fillStyle='#f1e6d2';ctx.font='58px "Songti SC", SimSun, serif';ctx.fillText('幻想乡偏爱录',75,175);
    ctx.font='25px sans-serif';ctx.fillStyle='#c9b38e';ctx.fillText(`心之所向 · TOP ${state.target}  /  ${resultLabel(session)}`,75,230);
    ctx.font='20px sans-serif';ctx.fillStyle='#a6b0b4';ctx.fillText(`参与 ${session.candidates.length} 人 · 比较 ${state.comparisons} 次 · 排除 ${state.excluded.length} 人 · 待评 ${state.skipped.length} 人`,75,276);
    const range=scopeOptions.filter(x=>session.scopes.includes(x.id)).map(x=>x.name).join(' / ');
    ctx.fillText(range,75,314);
    slice.forEach((r,i)=>{
      const y=365+i*100,ch=byId.get(r.id)!;
      ctx.fillStyle=r.rank<=3?'#28383d':'#19262f';ctx.fillRect(65,y,950,85);
      ctx.fillStyle=r.rank<=3?'#d8b779':'#81949e';ctx.font='34px Georgia';ctx.fillText(String(r.rank).padStart(2,'0'),90,y+51);
      ctx.fillStyle='#ede4d3'; let size=30;ctx.font=`${size}px "Songti SC", SimSun, serif`;while(ctx.measureText(ch.name).width>670){size--;ctx.font=`${size}px "Songti SC", SimSun, serif`;}
      ctx.fillText(ch.name,175,y+37);ctx.font='16px sans-serif';ctx.fillStyle='#9eabb2';ctx.fillText(firstWorkName(ch),175,y+65);
      if(r.tied){ctx.fillStyle='#c8aa75';ctx.fillText('并列',940,y+49);}
    });
    ctx.fillStyle='#99a5a9';ctx.font='18px sans-serif';const bottom=canvas.height-90;
    ctx.fillText('个人偏好记录 · 非官方同人项目 · 角色原作 © 上海爱丽丝幻乐团',75,bottom);
    ctx.fillText(`数据参考 THBWiki · ${session.createdAt.slice(0,10)} · 第 ${start/pageSize+1} / ${Math.ceil(rows.length/pageSize)} 页`,75,bottom+32);
    pages.push(await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片生成失败')),'image/png')));
  }
  return pages;
}
