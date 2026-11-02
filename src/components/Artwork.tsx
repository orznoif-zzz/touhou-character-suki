import { useState, useEffect } from 'react';
import { usePortraits, usePortraitZoom } from '../lib/portraits';
import { displayName } from '../lib/display-name';
import type { Character } from '../domain/types';

export function ShrineArtwork() {
  return <svg className="shrine-art" viewBox="0 0 1000 780" fill="none" aria-hidden="true">
    <defs><radialGradient id="moon"><stop stopColor="#f2dfb6"/><stop offset=".72" stopColor="#d5b981"/><stop offset="1" stopColor="#b18e5c"/></radialGradient><radialGradient id="halo"><stop stopColor="#cda569" stopOpacity=".17"/><stop offset="1" stopColor="#cda569" stopOpacity="0"/></radialGradient><linearGradient id="mount" x2="0" y2="1"><stop stopColor="#29383e"/><stop offset="1" stopColor="#15232b"/></linearGradient><pattern id="moonLines" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L18 0" stroke="#5d614f" strokeOpacity=".12"/></pattern></defs>
    <circle cx="550" cy="305" r="335" fill="url(#halo)"/><circle cx="550" cy="305" r="213" stroke="#bda06c" strokeOpacity=".22"/>
    <circle cx="550" cy="305" r="184" fill="url(#moon)"/><circle cx="550" cy="305" r="184" fill="url(#moonLines)"/>
    <path d="M90 520L290 302 410 452 510 370 755 565 920 460 1000 650H0Z" fill="url(#mount)"/>
    <path d="M288 302L271 364 293 351 312 378 303 345 329 365Z" fill="#85938d" opacity=".36"/>
    <path d="M0 623Q190 470 371 555T730 560T1000 620V780H0Z" fill="#101c24"/>
    <g fill="#10171b" stroke="#b38c57" strokeWidth="1.2"><path d="M315 364Q540 422 773 358L757 389Q540 445 333 395Z"/><path d="M348 412L744 412 738 429 354 429Z"/><path d="M393 397H416L409 679H382Z"/><path d="M675 397H698L710 679H684Z"/><path d="M535 408H555V470H535Z"/></g>
    <path d="M409 452Q548 493 683 452" stroke="#c5ae7c" strokeWidth="3"/>
    <g fill="#dbd2b6"><path d="M460 465l-9 19 9 5-10 20 20-18-9-7 9-17Z"/><path d="M514 476l-9 19 9 5-10 20 20-18-9-7 9-17Z"/><path d="M574 476l-9 19 9 5-10 20 20-18-9-7 9-17Z"/><path d="M631 466l-9 19 9 5-10 20 20-18-9-7 9-17Z"/></g>
    <g stroke="#587079" opacity=".25"><path d="M0 642H1000M25 658H950M80 676H870M190 700H820M250 729H760"/><path d="M420 750L480 635M680 750L612 635"/></g>
    <path d="M800 0Q780 150 902 266M823 168Q748 131 716 62M819 154Q881 117 930 132M872 230Q938 209 995 239" stroke="#111b21" strokeWidth="12"/>
    <g fill="#334347"><ellipse cx="765" cy="113" rx="47" ry="11" transform="rotate(28 765 113)"/><ellipse cx="902" cy="132" rx="57" ry="12"/><ellipse cx="947" cy="227" rx="57" ry="14"/></g>
    <g fill="#d2b179"><circle cx="295" cy="556" r="2"/><circle cx="736" cy="501" r="2"/><circle cx="460" cy="590" r="1.5"/><circle cx="811" cy="621" r="2"/><circle cx="344" cy="234" r="1.6"/></g>
    <g stroke="#d6c39b" strokeWidth="2" opacity=".6"><path d="M620 180q8-10 16 0q8-10 16 0M669 205q6-8 12 0q6-8 12 0"/></g>
  </svg>;
}

export function CharacterArtwork({character, small=false}: {character: Character; small?:boolean}) {
  const [broken,setBroken]=useState(false);
  const enabled=usePortraits();
  const zoom=usePortraitZoom();
  const portrait=character.image;
  useEffect(()=>setBroken(false),[portrait,character.id]);
  const monogram=displayName(character.name);
  const hue = parseInt(character.id.slice(-4),16)%60+165;
  return <div className={`character-art ${small?'small-art':''}`} data-zoomed={zoom>1} style={{'--card-hue':hue,'--portrait-zoom':zoom} as React.CSSProperties}>
    {enabled && portrait && !broken ? <img loading="lazy" decoding="async" src={import.meta.env.BASE_URL+portrait.replace(/^\//,'')} alt={character.name} onError={()=>setBroken(true)}/> : <>
      <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
      <svg viewBox="0 0 280 330" className="card-glyph" aria-hidden="true"><path d="M140 30L246 165 140 300 34 165Z"/><path d="M140 53L225 165 140 277 55 165Z"/><circle cx="140" cy="165" r="74"/><path d="M140 91a37 37 0 0 1 0 74 37 37 0 0 0 0 74 74 74 0 0 0 0-148Z" fill="currentColor" opacity=".22"/><circle cx="140" cy="128" r="8"/><circle cx="140" cy="202" r="8"/></svg>
      <span className="character-monogram" data-length={Math.min(5,Array.from(monogram).length)}>{monogram}</span>
      {!small&&<><span className="vertical-caption">幻想郷にて、また逢う。</span><span className="art-label">CHARACTER ARCHIVE / 幻想绘札</span><i className="card-star star-one">✦</i><i className="card-star star-two">✧</i></>}
    </>}
  </div>;
}
