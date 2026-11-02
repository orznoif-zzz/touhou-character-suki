import { useMemo, useState } from 'react';
import { ArrowRight, Check, Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { characters, coverage, firstWorkName, scopeOptions, selectCharacters } from '../data';
import type { Scope } from '../domain/types';
export function Setup({onStart,onBack}: {onStart:(scopes:Scope[],target:number)=>void;onBack:()=>void}) {
  const [scopes,setScopes]=useState<Scope[]>(()=>{try{const v=JSON.parse(localStorage.getItem('gpj-scopes')??'null');if(Array.isArray(v)&&v.every(s=>scopeOptions.some(x=>x.id===s)))return v;}catch{}return ['windows','decimal'];});
  const [target,setTarget]=useState('10'),[search,setSearch]=useState(''),[open,setOpen]=useState(false);
  const selected=useMemo(()=>selectCharacters(scopes),[scopes]);
  const filtered=selected.filter(c=>[c.name,c.japanese,...c.aliases].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const n=Number(target),valid=Number.isInteger(n)&&n>=1&&n<=selected.length;
  function toggle(s:Scope){const next=scopes.includes(s)?scopes.filter(x=>x!==s):[...scopes,s];setScopes(next);try{localStorage.setItem('gpj-scopes',JSON.stringify(next));}catch{}}
  return <section className="page setup-page"><button className="text-button back-link" onClick={onBack}><ArrowLeft size={16}/> 返回庭院</button>
    <div className="section-heading"><span className="eyebrow">01 / WRITE YOUR OWN STORY</span><h1>这一次，想与谁相遇？</h1><p>圈定你的幻想乡。熟悉的面孔，或尚未听过的名字。</p></div>
    <div className="setup-layout"><div><div className="label-row"><h2>选择角色范围</h2><span>可多选 · 自动去重</span></div>
      <div className="scope-list">{scopeOptions.map(s=><button key={s.id} className={`scope-option ${scopes.includes(s.id)?'selected':''}`} onClick={()=>toggle(s.id)} aria-pressed={scopes.includes(s.id)}><span className="scope-number">{s.number}</span><span className="scope-copy"><strong>{s.name}</strong><small>{s.subtitle}</small></span><span className="scope-count">{coverage.counts[s.id]}<small>人</small></span><span className="check-box">{scopes.includes(s.id)&&<Check size={15}/>}</span></button>)}</div>
      <div className="roster-box"><button className="roster-toggle" onClick={()=>setOpen(!open)} aria-expanded={open}><span>查看本次角色名单 <b>{selected.length}</b></span><ChevronDown size={18} style={{transform:open?'rotate(180deg)':undefined}}/></button>{open&&<div className="roster-body"><label className="search-box"><Search size={17}/><input aria-label="搜索角色" placeholder="搜索中文名、日文名或别名…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="roster-results">{filtered.map(c=><div className="roster-person" key={c.id}><strong>{c.name}</strong><small>{firstWorkName(c)}</small></div>)}{!filtered.length&&<p>没有找到符合条件的角色。</p>}</div></div>}</div>
    </div><aside className="setup-summary"><span className="eyebrow">YOUR JOURNAL</span><h2>留给心动的位置</h2><p>无需排完所有人，找到最偏爱的前几位。</p><div className="target-grid">{[3,5,10,20,50].map(k=><button key={k} disabled={k>selected.length} className={n===k?'active':''} onClick={()=>setTarget(String(k))}>Top {k}</button>)}</div><label className="custom-target">自定义 Top N<input type="number" min="1" max={selected.length} value={target} onChange={e=>setTarget(e.target.value)} aria-label="自定义排名人数"/></label><div className="summary-line"><span>本次相遇</span><strong>{selected.length}<small> 位角色</small></strong></div><div className="summary-line"><span>严格选择时比较上界</span><strong>{valid?Math.max(0,selected.length-1)+(n-1)*Math.ceil(Math.log2(selected.length)):'—'}<small> 次</small></strong></div><p className="fine-print">估计基于稳定且不并列的偏好。跳过、暂缓和修改会影响实际次数。</p><button className="primary-button wide" disabled={!valid} onClick={()=>onStart(scopes,n)}>展开偏爱录 <ArrowRight size={18}/></button>{!valid&&<p className="validation">请选择至少一位角色，Top N 须为 1 至 {selected.length} 的整数。</p>}<div className="privacy-note">✦  无需登录 · 进度仅保存在此浏览器</div></aside></div>
    <p className="data-note">当前收录 {characters.length} 位独立角色。范围可重叠；资料快照存在部分登场记录缺口，详见「收录说明」。</p>
  </section>;
}
