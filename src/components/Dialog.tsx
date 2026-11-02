import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({title,onClose,children}: {title:string;onClose:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null; const el=ref.current!; el.focus();
    const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab') {const focusable=[...el.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')]; const first=focusable[0],last=focusable.at(-1); if(e.shiftKey&&(document.activeElement===first||document.activeElement===el)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===el)){e.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',listener);return()=>{document.removeEventListener('keydown',listener);previous?.focus();};
  },[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button></div>{children}</div></div>;
}
