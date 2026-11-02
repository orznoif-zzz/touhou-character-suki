import { useMemo, useState } from 'react';
import { byId } from '../data';
import { evaluate, PreferenceGraph } from '../domain/engine';
import { actionCharacters, explainPreference } from '../domain/evidence';
import type { Action, Session } from '../domain/types';

const name=(id:string)=>byId.get(id)?.name??id;
function describe(a:Action) {
  if(a.type==='prefer')return `${name(a.winner)} ＞ ${name(a.loser)}`;
  if(a.type==='tie')return `${name(a.pair[0])} ＝ ${name(a.pair[1])}`;
  if(a.type==='feeling')return `${a.pair.map(name).join(' / ')}：${a.feeling==='like'?'都喜欢':'都不喜欢'}，暂缓（不生成胜负）`;
  if(a.type==='target')return `目标调整至 Top ${a.value}`;
  if(a.type==='revisit')return '重新考虑暂缓比较';
  return `${a.type==='exclude'?'排除':a.type==='skip'?'暂时跳过':'恢复'} ${name(a.id)}`;
}
export function ChoiceAudit({session,onRewind}:{session:Session;onRewind:(index:number)=>void}) {
  const [character,setCharacter]=useState(''),[other,setOther]=useState(''),[query,setQuery]=useState('');
  const state=useMemo(()=>evaluate(session),[session]);
  const graph=useMemo(()=>new PreferenceGraph(session.candidates,session.actions),[session]);
  const records=session.actions.map((action,index)=>({action,index})).filter(({action})=>(!character||actionCharacters(action).includes(character))&&(!query||describe(action).includes(query)));
  const relation=character&&other?graph.compare(character,other):null;
  const path=character&&other?explainPreference(session,relation===1?other:character,relation===1?character:other):null;
  const rank=state.ranked.find(g=>g.ids.includes(character));
  const above=character?state.active.filter(id=>graph.compare(id,character)===-1):[];
  const below=character?state.active.filter(id=>graph.compare(character,id)===-1):[];
  const unknown=character?state.active.filter(id=>graph.compare(character,id)===null):[];
  return <section className="choice-audit">
    <p className="fine-print">记录保留每次明确选择、暂缓、排除及目标调整。排名使用稳定、可传递的偏好；没有直接对决时，可查看推导链。排除角色的历史选择仍可作为证据。</p>
    <label>筛选角色<select aria-label="筛选角色选择记录" value={character} onChange={e=>{setCharacter(e.target.value);setOther('');}}><option value="">全部角色</option>{session.candidates.map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label>
    <label>搜索记录<input aria-label="搜索选择记录" placeholder="输入姓名或操作，例如：排除" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {character&&<div className="notice"><h3>{name(character)} · {state.excluded.includes(character)?'已排除':state.skipped.includes(character)?'暂时待评':rank?`已证明第 ${rank.rank} 名`:'名次尚未确定'}</h3><p>有效候选中：{above.length} 位有证据排在其前，{below.length} 位有证据排在其后，{unknown.length} 位关系未定。并列不计入前后人数。</p>
      <label>与哪位角色核对？<select aria-label="核对另一位角色" value={other} onChange={e=>setOther(e.target.value)}><option value="">选择角色查看依据</option>{session.candidates.filter(id=>id!==character).map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label>
      {other&&other!==character&&<div aria-live="polite"><p><strong>{relation===null?'两者关系尚未确定；没有足够证据。':relation===0?'两者明确并列。':`${name(relation===-1?character:other)} 排在 ${name(relation===-1?other:character)} 前。`}</strong></p>{path&&path.length>0&&<><p>{path.length===1?'直接选择依据':'由以下历史选择传递推导，不代表每两人都直接比较过'}：</p><ol>{path.map((step,i)=><li key={i}>第 {step.event} 步：{name(step.from)} {step.relation==='tie'?'＝':'＞'} {name(step.to)}</li>)}</ol></>}</div>}
    </div>}
    <p>匹配 {records.length} 条 / 共 {session.actions.length} 条操作，含 {state.comparisons} 次有效比较。编号为原始操作序号。</p>
    <p className="fine-print">“回到此前”会撤销该操作及之后的全部操作。可先导出 JSON 保存完整记录。</p>
    <div className="action-log">{records.slice().reverse().map(({action,index})=><div className="log-row" key={index}><span>{index+1}. {describe(action)}</span><button className="text-button" onClick={()=>onRewind(index)}>回到此前</button></div>)}{!records.length&&<p>没有匹配的选择记录。</p>}</div>
  </section>;
}
