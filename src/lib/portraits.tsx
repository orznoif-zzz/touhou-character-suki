import { useSyncExternalStore } from 'react';
const key='gensokyo-portraits';
let enabled=true;
let zoom=1;
try { enabled=localStorage.getItem(key)!=='off'; } catch { /* Memory-only preference remains available. */ }
try { const saved=Number(localStorage.getItem(key+'-zoom')); if(saved>=1&&saved<=3) zoom=saved; } catch { /* Use default framing. */ }
const listeners=new Set<()=>void>();
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const usePortraits=()=>useSyncExternalStore(subscribe,()=>enabled,()=>true);
export const usePortraitZoom=()=>useSyncExternalStore(subscribe,()=>zoom,()=>1);
function setZoom(value:number){
  zoom=value;
  try{localStorage.setItem(key+'-zoom',String(zoom));}catch{}
  listeners.forEach(fn=>fn());
}
export function PortraitToggle(){
  const on=usePortraits();
  const scale=usePortraitZoom();
  return <details className="portrait-settings" onKeyDown={event=>{if(event.key==='Escape')event.currentTarget.open=false;}}>
    <summary>立绘{on?'':'：关'} <span aria-hidden="true">⌄</span></summary>
    <div className="portrait-panel">
      <div className="portrait-panel-heading"><span>立绘显示</span><button aria-pressed={on} onClick={()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}listeners.forEach(fn=>fn());}}>{on?'立绘：开':'立绘：关'}</button></div>
      <div className="portrait-presets" role="group" aria-label="立绘取景">
        {([[1,'全身'],[1.7,'半身'],[2.6,'近景']] as const).map(([value,label])=><button key={value} disabled={!on} aria-pressed={scale===value} onClick={()=>setZoom(value)}>{label}</button>)}
      </div>
      <label className="portrait-zoom">缩放 <output>{Math.round(scale*100)}%</output><input aria-label="立绘缩放" type="range" min="1" max="3" step="0.05" value={scale} disabled={!on} onChange={event=>setZoom(Number(event.target.value))}/></label>
      <p>全站同步，自动记住。近景放大原立绘，部分姿势取景会有差异。</p>
    </div>
  </details>;
}
