/**
 * CastleView — Vila medieval isométrica ultra-detalhada
 * Pôr do sol cinematográfico · Muralhas de pedra · Fogueira central · RTS-style
 * Grade isométrica: iso(gx,gy,gz) — OX=580 OY=270 TW=28 TH=16 EH=26
 */
import React, { useState } from 'react';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ─── projeção isométrica ────────────────────────────────────────────────── */
const OX=580,OY=270,TW=28,TH=16,EH=26;
function iso(gx:number,gy:number,gz:number=0){return{x:OX+(gx-gy)*TW,y:OY+(gx+gy)*TH-gz*EH};}
function pt(gx:number,gy:number,gz:number=0){const p=iso(gx,gy,gz);return`${p.x},${p.y}`;}
const f=(p:{x:number,y:number})=>`${p.x},${p.y}`;

/* ─── zonas de edifícios ─────────────────────────────────────────────────── */
const ZONES:{type:BuildingType;label:string;icon:string}[]=[
  {type:'barracks',  label:'Quartel',        icon:'⚔️'},
  {type:'academy',   label:'Academia',       icon:'📚'},
  {type:'farm',      label:'Fazenda',        icon:'🌾'},
  {type:'sawmill',   label:'Serraria',       icon:'🪵'},
  {type:'warehouse', label:'Armazém',        icon:'🏚️'},
  {type:'quarry',    label:'Pedreira',       icon:'🪨'},
  {type:'ironMine',  label:'Mina de Ferro',  icon:'⚙️'},
];
const CENTRES:Record<BuildingType,[number,number]>={
  barracks:  [iso(3,7).x,  iso(3,7).y-20],
  academy:   [iso(10,2).x, iso(10,2).y-20],
  farm:      [iso(2.5,2).x,iso(2.5,2).y-20],
  sawmill:   [iso(1.5,6).x,iso(1.5,6).y-20],
  warehouse: [iso(6,4.5).x,iso(6,4.5).y-20],
  quarry:    [iso(12,3).x, iso(12,3).y-20],
  ironMine:  [iso(12.5,1).x,iso(12.5,1).y-20],
};

/* ─── painel lateral ─────────────────────────────────────────────────────── */
function BuildingPanel({type,onClose}:{type:BuildingType;onClose:()=>void}){
  return(
    <div className="absolute inset-y-0 right-0 w-72 flex flex-col z-40 shadow-2xl"
      style={{background:'linear-gradient(160deg,#12100aee,#1e1608f5)',borderLeft:'2px solid #b8860b'}}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-900/40">
        <span className="text-yellow-500 text-lg font-semibold" style={{fontFamily:'Cinzel,serif'}}>
          Gerenciar Edifício
        </span>
        <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3"><BuildingCard buildingType={type}/></div>
    </div>
  );
}

/* ─── Caixa isométrica 3D ────────────────────────────────────────────────── */
function IsoBox({gx,gy,gz=0,w,d,h,top,left,right,stroke='rgba(0,0,0,0.35)',sw=0.8}:{
  gx:number;gy:number;gz?:number;w:number;d:number;h:number;
  top:string;left:string;right:string;stroke?:string;sw?:number;}){
  const tl=iso(gx,gy,gz+h),tr=iso(gx+w,gy,gz+h);
  const tbl=iso(gx,gy+d,gz+h),tbr=iso(gx+w,gy+d,gz+h);
  const bl=iso(gx,gy,gz),br=iso(gx+w,gy,gz);
  const bbl=iso(gx,gy+d,gz),bbr=iso(gx+w,gy+d,gz);
  return(
    <g>
      <polygon points={`${f(tl)} ${f(tr)} ${f(tbr)} ${f(tbl)}`} fill={top}  stroke={stroke} strokeWidth={sw}/>
      <polygon points={`${f(tl)} ${f(tbl)} ${f(bbl)} ${f(bl)}`} fill={left} stroke={stroke} strokeWidth={sw}/>
      <polygon points={`${f(tr)} ${f(tbr)} ${f(bbr)} ${f(br)}`} fill={right}stroke={stroke} strokeWidth={sw}/>
    </g>
  );
}

/* ─── Casa com telhado inclinado ─────────────────────────────────────────── */
function IsoHouse({gx,gy,gz=0,w,d,wh,rh,wL,wR,rL,rR,children}:{
  gx:number;gy:number;gz?:number;w:number;d:number;
  wh:number;rh:number;wL:string;wR:string;rL:string;rR:string;children?:React.ReactNode;}){
  const A=iso(gx,gy,gz+wh),B=iso(gx+w,gy,gz+wh);
  const C=iso(gx+w,gy+d,gz+wh),D=iso(gx,gy+d,gz+wh);
  const bl=iso(gx,gy,gz),br=iso(gx+w,gy,gz);
  const bbl=iso(gx,gy+d,gz),bbr=iso(gx+w,gy+d,gz);
  const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-rh*EH};
  const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-rh*EH};
  const outline='rgba(0,0,0,0.4)';
  return(
    <g>
      {/* paredes */}
      <polygon points={`${f(A)} ${f(B)} ${f(br)} ${f(bl)}`}  fill="#9a8870" stroke={outline} strokeWidth="0.7"/>
      <polygon points={`${f(A)} ${f(D)} ${f(bbl)} ${f(bl)}`} fill={wL} stroke={outline} strokeWidth="0.7"/>
      <polygon points={`${f(B)} ${f(C)} ${f(bbr)} ${f(br)}`} fill={wR} stroke={outline} strokeWidth="0.7"/>
      {/* telhado */}
      <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill={rR} stroke={outline} strokeWidth="0.6"/>
      <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill={rL} stroke={outline} strokeWidth="0.6"/>
      <polygon points={`${f(B)} ${f(C)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill={rR} opacity="0.78" stroke={outline} strokeWidth="0.6"/>
      <polygon points={`${f(D)} ${f(C)} ${rB.x},${rB.y}`} fill={rL} opacity="0.55"/>
      <line x1={rF.x} y1={rF.y} x2={rB.x} y2={rB.y} stroke="rgba(0,0,0,0.5)" strokeWidth="1.1"/>
      {children}
    </g>
  );
}

/* ─── Árvore de pinheiro ─────────────────────────────────────────────────── */
function PineTree({gx,gy,h=3,tint='#2a6030'}:{gx:number;gy:number;h?:number;tint?:string}){
  const base=iso(gx,gy,0);
  const tip ={x:base.x,y:base.y-h*EH};
  return(
    <g>
      <line x1={base.x} y1={base.y} x2={base.x} y2={base.y-h*EH*0.4} stroke="#5a3810" strokeWidth="3"/>
      <polygon points={`${base.x-18},${tip.y+h*EH*.55} ${base.x+18},${tip.y+h*EH*.55} ${base.x},${tip.y+h*EH*.1}`} fill={tint} opacity="0.95"/>
      <polygon points={`${base.x-14},${tip.y+h*EH*.35} ${base.x+14},${tip.y+h*EH*.35} ${base.x},${tip.y+h*EH*.0}`} fill={tint} opacity="0.9"/>
      <polygon points={`${base.x-9}, ${tip.y+h*EH*.18} ${base.x+9}, ${tip.y+h*EH*.18} ${base.x},${tip.y}`}  fill={tint} opacity="0.85"/>
    </g>
  );
}

/* ─── Aldeão ─────────────────────────────────────────────────────────────── */
function Villager({x,y,col='#8a6840'}:{x:number;y:number;col?:string}){
  return(
    <g>
      <ellipse cx={x} cy={y+1} rx={5} ry={2} fill="rgba(0,0,0,0.3)"/>
      <rect x={x-4} y={y-16} width={8} height={14} fill={col} rx="2"/>
      <ellipse cx={x} cy={y-18} rx={5} ry={5.5} fill="#d4a870"/>
      <ellipse cx={x} cy={y-23} rx={4.5} ry={2.5} fill="#5a3810"/>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export const CastleView:React.FC=()=>{
  const castle=useGameStore(s=>s.castle);
  const resources=useResources();
  const [selected,setSelected]=useState<BuildingType|null>(null);

  if(!castle)return(
    <div className="flex items-center justify-center h-64 text-stone-400">Carregando…</div>
  );
  const res=resources??castle.resources;

  return(
    <div className="relative w-full bg-black" style={{userSelect:'none'}}>

      {/* ── HUD ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
        style={{background:'linear-gradient(90deg,rgba(10,6,2,.97),rgba(24,14,4,.97))',borderBottom:'1px solid rgba(184,134,11,.4)'}}>
        <span style={{fontFamily:'Cinzel,serif',color:'#f0c040',fontSize:'1rem'}}>🏰 Nível {castle.level}</span>
        <span className="text-amber-300">🌾 {Math.floor(res.food).toLocaleString()}</span>
        <span className="text-green-300">🪵 {Math.floor(res.wood).toLocaleString()}</span>
        <span className="text-stone-300">🪨 {Math.floor(res.stone).toLocaleString()}</span>
        <span className="text-sky-300">⚙️ {Math.floor(res.iron).toLocaleString()}</span>
        <span className="ml-auto text-stone-500 text-xs">[{castle.mapX},{castle.mapY}]</span>
      </div>

      {/* ── CENA ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{height:'78vh',minHeight:500,maxHeight:860}}>
        <svg viewBox="0 0 1200 860" preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full" style={{display:'block'}}>
          <defs>
            {/* céu pôr do sol */}
            <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0d0820"/>
              <stop offset="28%"  stopColor="#3a1040"/>
              <stop offset="55%"  stopColor="#c04010"/>
              <stop offset="78%"  stopColor="#e07020"/>
              <stop offset="100%" stopColor="#f0a030"/>
            </linearGradient>
            {/* nuvens */}
            <linearGradient id="vCloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e89060" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#c04818" stopOpacity="0.1"/>
            </linearGradient>
            {/* chão fora das muralhas */}
            <linearGradient id="vGround" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6a8840"/>
              <stop offset="100%" stopColor="#4a6028"/>
            </linearGradient>
            {/* chão interior */}
            <linearGradient id="vInside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#8a7055"/>
              <stop offset="100%" stopColor="#6a5540"/>
            </linearGradient>
            {/* rio */}
            <linearGradient id="vRiver" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1840a0" stopOpacity="0.7"/>
              <stop offset="40%"  stopColor="#4090e0" stopOpacity="0.8"/>
              <stop offset="70%"  stopColor="#e09040" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#c06820" stopOpacity="0.6"/>
            </linearGradient>
            {/* pedra da muralha */}
            <linearGradient id="vWallTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#c8b898"/>
              <stop offset="100%" stopColor="#a09070"/>
            </linearGradient>
            <linearGradient id="vWallLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#686050"/>
              <stop offset="100%" stopColor="#504840"/>
            </linearGradient>
            <linearGradient id="vWallRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#807868"/>
              <stop offset="100%" stopColor="#605850"/>
            </linearGradient>
            {/* fogueira */}
            <radialGradient id="vFireGlow" cx="50%" cy="100%" r="80%">
              <stop offset="0%"   stopColor="#ff8020" stopOpacity="0.65"/>
              <stop offset="100%" stopColor="#e05010" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="vFireGlow2" cx="50%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="#ffb040" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#ff6010" stopOpacity="0"/>
            </radialGradient>
            {/* sol */}
            <radialGradient id="vSun" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#fff8e0" stopOpacity="1"/>
              <stop offset="30%"  stopColor="#f0c040" stopOpacity="0.9"/>
              <stop offset="70%"  stopColor="#e07010" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#c04010" stopOpacity="0"/>
            </radialGradient>
            {/* vinheta */}
            <radialGradient id="vVig" cx="50%" cy="50%" r="65%">
              <stop offset="50%" stopColor="transparent"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0.75)"/>
            </radialGradient>
            {/* textura pedra muralha */}
            <pattern id="vStonePat" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
              <rect width="48" height="24" fill="#8a7860"/>
              <rect x="0" y="0"  width="23" height="11" fill="#907e6a" stroke="#6a5a48" strokeWidth="0.8" rx="0.5"/>
              <rect x="24" y="0" width="23" height="11" fill="#887668" stroke="#6a5a48" strokeWidth="0.8" rx="0.5"/>
              <rect x="0" y="12" width="23" height="11" fill="#887668" stroke="#6a5a48" strokeWidth="0.8" rx="0.5"/>
              <rect x="24" y="12" width="23" height="11" fill="#907e6a" stroke="#6a5a48" strokeWidth="0.8" rx="0.5"/>
            </pattern>
            {/* piso de pedra interior */}
            <pattern id="vDirtPat" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#7a6850"/>
              <circle cx="8"  cy="8"  r="3" fill="#6a5840" opacity="0.4"/>
              <circle cx="24" cy="20" r="4" fill="#8a7860" opacity="0.3"/>
              <circle cx="16" cy="28" r="2" fill="#6a5840" opacity="0.35"/>
            </pattern>
            <filter id="vGlow">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="vSoftBlur">
              <feGaussianBlur stdDeviation="12"/>
            </filter>
            <filter id="vMist">
              <feGaussianBlur stdDeviation="18"/>
            </filter>
          </defs>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 1: CÉU + SOL ──────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <rect x="0" y="0" width="1200" height="860" fill="url(#vSky)"/>

          {/* sol (pôr do sol, lado direito) */}
          <ellipse cx="960" cy="195" rx="90" ry="90" fill="url(#vSun)" opacity="0.85"/>
          <ellipse cx="960" cy="195" rx="140" ry="130" fill="url(#vSun)" opacity="0.25"/>
          <ellipse cx="960" cy="195" rx="200" ry="180" fill="url(#vSun)" opacity="0.1"/>

          {/* raios de luz volumétricos */}
          {[[-30,40],[0,25],[-15,60],[20,35],[8,50]].map(([angle,op],i)=>(
            <g key={i} style={{opacity:op/100}}>
              <polygon
                points={`960,195 ${960+Math.cos((angle+i*22)*Math.PI/180)*600},860 ${960+Math.cos((angle+i*22+8)*Math.PI/180)*600},860`}
                fill="#f0a030" opacity="0.07"
                style={{animation:`lightRay ${3+i*.7}s ease-in-out infinite ${i*.4}s`}}/>
            </g>
          ))}

          {/* nuvens */}
          {[{x:80,y:38,rx:120,ry:28},{x:310,y:55,rx:160,ry:32},{x:560,y:30,rx:140,ry:24},{x:750,y:60,rx:100,ry:22},{x:1050,y:45,rx:130,ry:28}].map((c,i)=>(
            <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill="url(#vCloud)" opacity={0.35+i*.04}/>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 2: MONTANHAS ──────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* montanhas distantes (azul-lilás) */}
          <path d="M0,260 Q120,130 240,200 Q330,150 420,180 Q510,120 580,170 Q650,130 720,165 Q800,110 880,155 Q950,130 1020,160 Q1090,120 1160,150 Q1200,140 1200,200 L1200,300 L0,300 Z"
            fill="#4a3870" opacity="0.6"/>
          <path d="M0,260 Q120,130 240,198 Q330,150 420,180 Q510,120 578,168 Q648,130 718,165 Q798,112 878,156 Q948,130 1018,160 Q1088,120 1158,150 L1200,145 L1200,265 L0,265 Z"
            fill="#6a4890" opacity="0.35"/>

          {/* montanhas médias (azul-verde escuro) */}
          <path d="M0,288 Q80,220 160,255 Q220,210 300,245 Q380,215 450,248 Q500,218 560,240 Q610,215 670,242 Q730,210 800,240 Q860,215 940,245 Q1010,215 1080,250 Q1140,220 1200,248 L1200,310 L0,310 Z"
            fill="#2a4428" opacity="0.85"/>

          {/* névoa nas montanhas */}
          <rect x="0" y="255" width="1200" height="55" fill="rgba(200,150,80,0.12)" filter="url(#vMist)"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 3: FLORESTA DENSA (FUNDO) ───────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* floresta silhueta esquerda */}
          <path d="M0,310 Q20,278 40,295 Q55,270 70,285 Q85,262 105,280 Q120,255 140,272 Q158,250 178,268 Q195,248 215,265 Q235,252 250,268 L250,320 L0,320 Z"
            fill="#18380f" opacity="0.9"/>
          <path d="M0,308 Q25,285 45,300 Q60,278 80,293 Q95,268 115,286 Q130,264 150,278 Q168,258 185,274 Q200,256 218,272 Q238,258 252,274 L252,318 L0,318 Z"
            fill="#264a1a" opacity="0.8"/>
          {/* floresta densa direita */}
          <path d="M950,310 Q970,275 990,292 Q1010,262 1030,282 Q1050,255 1075,275 Q1095,252 1120,272 Q1140,258 1160,274 Q1180,258 1200,270 L1200,318 L950,318 Z"
            fill="#18380f" opacity="0.9"/>
          <path d="M945,308 Q966,280 988,298 Q1008,265 1028,285 Q1048,258 1072,278 Q1092,255 1118,274 L1200,265 L1200,316 L945,316 Z"
            fill="#264a1a" opacity="0.75"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 4: CHÃO DO VALE ──────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <path d="M0,308 L1200,308 L1200,860 L0,860 Z" fill="url(#vGround)"/>

          {/* colinas enroladas */}
          <path d="M0,310 Q150,290 300,305 Q450,295 580,308" stroke="rgba(80,100,40,0.6)" strokeWidth="2" fill="none"/>
          <path d="M620,308 Q750,295 900,305 Q1050,295 1200,310" stroke="rgba(80,100,40,0.6)" strokeWidth="2" fill="none"/>

          {/* campos externos à esquerda */}
          {[0,1,2,3,4].map(row=>(
            <g key={row}>
              <IsoBox gx={-2} gy={row*2} gz={0} w={1.5} d={1.8} h={0.05}
                top={row%2===0?'#7a9050':'#6a8040'} left="#4a6030" right="#5a7038"/>
            </g>
          ))}
          {/* campos externos à direita */}
          {[0,1,2].map(row=>(
            <IsoBox key={row} gx={15} gy={row*2+1} gz={0} w={1.5} d={1.8} h={0.05}
              top={row%2===0?'#8a9860':'#7a8850'} left="#506030" right="#607038"/>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 5: RIO (LADO ESQUERDO) ──────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <path d="M55,308 Q45,360 60,420 Q40,480 70,540 Q50,600 65,680 Q55,740 70,860"
            stroke="url(#vRiver)" strokeWidth="32" fill="none" opacity="0.85" strokeLinecap="round"/>
          {/* reflexos */}
          {[350,420,500,570,640,720].map((ry,i)=>(
            <line key={i} x1={46+i*3} y1={ry} x2={65+i*2} y2={ry+12}
              stroke="rgba(255,220,140,0.4)" strokeWidth="1.5+i*0.3" strokeLinecap="round"/>
          ))}
          {/* pedras no rio */}
          <ellipse cx="58" cy="390" rx="9" ry="5" fill="#6a6050" opacity="0.8"/>
          <ellipse cx="52" cy="480" rx="7" ry="4" fill="#5a5040" opacity="0.75"/>
          <ellipse cx="64" cy="560" rx="10" ry="5" fill="#6a6050" opacity="0.7"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 6: CHÃO INTERIOR DA VILA ───────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* plano do chão dentro das muralhas */}
          <polygon
            points={`${pt(0,0,0)} ${pt(14,0,0)} ${pt(14,10,0)} ${pt(0,10,0)}`}
            fill="url(#vInside)" opacity="0.95"/>
          {/* linhas de grade do chão - gy */}
          {[0,1,2,3,4,5,6,7,8,9,10].map(gy=>{
            const a=iso(0,gy,0),b=iso(14,gy,0);
            return <line key={gy} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.1)" strokeWidth="0.6"/>;
          })}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(gx=>{
            const a=iso(gx,0,0),b=iso(gx,10,0);
            return <line key={gx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.1)" strokeWidth="0.6"/>;
          })}

          {/* estradas de pedra internas */}
          {/* estrada central N-S */}
          <polygon points={`${pt(6.4,0,0.02)} ${pt(7.6,0,0.02)} ${pt(7.6,10,0.02)} ${pt(6.4,10,0.02)}`}
            fill="#9a8c78" opacity="0.9"/>
          {/* estrada E-W */}
          <polygon points={`${pt(0,4.4,0.02)} ${pt(14,4.4,0.02)} ${pt(14,5.6,0.02)} ${pt(0,5.6,0.02)}`}
            fill="#9a8c78" opacity="0.85"/>
          {/* detalhe pedras na estrada */}
          {[1,2,3,4,5,6,8,9,10,11,12,13].map(gx=>{
            const a=iso(gx,4.9,0.025);
            return <ellipse key={gx} cx={a.x} cy={a.y} rx={8} ry={4} fill="#8a7c68" opacity="0.5"/>;
          })}
          {[1,2,3,4,5,6,7,8,9].map(gy=>{
            const a=iso(7,gy,0.025);
            return <ellipse key={gy} cx={a.x} cy={a.y} rx={5} ry={3} fill="#8a7c68" opacity="0.45"/>;
          })}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 7: MURALHAS DE PEDRA ────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}

          {/* MURALHA NORTE (gy=0, gx 0→14) — face visível de cima */}
          <polygon points={`${pt(0,0,0)} ${pt(14,0,0)} ${pt(14,0,3.5)} ${pt(0,0,3.5)}`}
            fill="url(#vWallRight)" opacity="0.9"/>
          <polygon points={`${pt(0,-0.7,0)} ${pt(14,-0.7,0)} ${pt(14,0,0)} ${pt(0,0,0)}`}
            fill="url(#vWallLeft)" opacity="0.75"/>
          <polygon points={`${pt(0,-0.7,0)} ${pt(14,-0.7,0)} ${pt(14,-0.7,3.5)} ${pt(0,-0.7,3.5)}`}
            fill="url(#vWallTop)" opacity="0.7"/>
          {/* merlões norte */}
          {Array.from({length:14},(_,i)=>{
            const base=iso(i+0.1,-0.65,3.4);
            return <rect key={i} x={base.x-4} y={base.y-18} width={8} height={18}
              fill="#b0a090" stroke="#6a5a48" strokeWidth="0.8" rx="1" opacity="0.85"/>;
          })}

          {/* MURALHA OESTE (gx=0, gy 0→10) — face visível lateral */}
          <polygon points={`${pt(0,0,0)} ${pt(0,10,0)} ${pt(0,10,3.5)} ${pt(0,0,3.5)}`}
            fill="url(#vWallLeft)" opacity="0.96"/>
          <polygon points={`${pt(-0.7,0,0)} ${pt(-0.7,10,0)} ${pt(0,10,0)} ${pt(0,0,0)}`}
            fill="url(#vWallLeft)" opacity="0.6"/>
          <polygon points={`${pt(-0.7,0,0)} ${pt(-0.7,10,0)} ${pt(-0.7,10,3.5)} ${pt(-0.7,0,3.5)}`}
            fill="url(#vWallTop)" opacity="0.55"/>
          {/* merlões oeste */}
          {Array.from({length:9},(_,i)=>{
            const base=iso(-0.65,i*1.1+0.1,3.4);
            return <rect key={i} x={base.x-4} y={base.y-18} width={7} height={18}
              fill="#b0a090" stroke="#6a5a48" strokeWidth="0.8" rx="1" opacity="0.8"/>;
          })}

          {/* MURALHA LESTE (gx=14, gy 0→10) */}
          <polygon points={`${pt(14,0,0)} ${pt(14,10,0)} ${pt(14,10,3.5)} ${pt(14,0,3.5)}`}
            fill="url(#vWallRight)" opacity="0.96"/>
          <polygon points={`${pt(14.7,0,0)} ${pt(14.7,10,0)} ${pt(14,10,0)} ${pt(14,0,0)}`}
            fill="url(#vWallRight)" opacity="0.55"/>
          <polygon points={`${pt(14.7,0,0)} ${pt(14.7,10,0)} ${pt(14.7,10,3.5)} ${pt(14.7,0,3.5)}`}
            fill="url(#vWallTop)" opacity="0.5"/>
          {Array.from({length:9},(_,i)=>{
            const base=iso(14.65,i*1.1+0.1,3.4);
            return <rect key={i} x={base.x-4} y={base.y-18} width={7} height={18}
              fill="#b0a090" stroke="#6a5a48" strokeWidth="0.8" rx="1" opacity="0.8"/>;
          })}

          {/* MURALHA SUL (gy=10, gx 0→6 e 8→14) COM PORTAL */}
          {/* lado esquerdo */}
          <polygon points={`${pt(0,10,0)} ${pt(6,10,0)} ${pt(6,10,3.5)} ${pt(0,10,3.5)}`}
            fill="url(#vWallLeft)" opacity="0.96"/>
          <polygon points={`${pt(0,10.7,0)} ${pt(6,10.7,0)} ${pt(6,10,0)} ${pt(0,10,0)}`}
            fill="url(#vWallLeft)" opacity="0.7"/>
          <polygon points={`${pt(0,10.7,3.5)} ${pt(6,10.7,3.5)} ${pt(6,10,3.5)} ${pt(0,10,3.5)}`}
            fill="#d4c8a8" opacity="0.75"/>
          {/* lado direito */}
          <polygon points={`${pt(8,10,0)} ${pt(14,10,0)} ${pt(14,10,3.5)} ${pt(8,10,3.5)}`}
            fill="url(#vWallLeft)" opacity="0.96"/>
          <polygon points={`${pt(8,10.7,0)} ${pt(14,10.7,0)} ${pt(14,10,0)} ${pt(8,10,0)}`}
            fill="url(#vWallLeft)" opacity="0.7"/>
          <polygon points={`${pt(8,10.7,3.5)} ${pt(14,10.7,3.5)} ${pt(14,10,3.5)} ${pt(8,10,3.5)}`}
            fill="#d4c8a8" opacity="0.75"/>
          {/* merlões sul */}
          {[0,1,2,3,4,5,8,9,10,11,12,13].map(gx=>{
            const base=iso(gx+0.1,10.65,3.4);
            return <rect key={gx} x={base.x-4} y={base.y-18} width={8} height={18}
              fill="#b8a888" stroke="#6a5a48" strokeWidth="0.8" rx="1" opacity="0.9"/>;
          })}

          {/* ── PORTAL / PORTÃO ─────────────────────────────────────── */}
          {/* Torres do portão */}
          <IsoBox gx={5.5} gy={9.8} gz={0} w={1.2} d={1.4} h={5.2}
            top="#c8b898" left="url(#vStonePat)" right="#a09070" stroke="rgba(0,0,0,0.4)" sw={0.8}/>
          <IsoBox gx={7.3} gy={9.8} gz={0} w={1.2} d={1.4} h={5.2}
            top="#c8b898" left="url(#vStonePat)" right="#a09070" stroke="rgba(0,0,0,0.4)" sw={0.8}/>
          {/* Arco do portão */}
          {(()=>{
            const gL=iso(6,10.7,0),gR=iso(8,10.7,0),gT=iso(7,10.7,3.8);
            return(
              <g>
                <path d={`M${gL.x},${gL.y} Q${gT.x},${gT.y} ${gR.x},${gR.y}`}
                  fill="none" stroke="#3a3228" strokeWidth="28" opacity="0.9"/>
                <path d={`M${gL.x+6},${gL.y} Q${gT.x},${gT.y+5} ${gR.x-6},${gR.y}`}
                  fill="none" stroke="#1a1410" strokeWidth="18"/>
                {/* grade do portão */}
                {[0,1,2,3,4].map(j=>{
                  const mx=gL.x+(gR.x-gL.x)*(j+1)/6;
                  return(
                    <g key={j}>
                      <line x1={mx} y1={gL.y} x2={mx} y2={gL.y-44}
                        stroke="#5a4828" strokeWidth="4" opacity="0.85"/>
                      <line x1={gL.x+6} y1={gL.y-12-j*8} x2={gR.x-6} y2={gR.y-12-j*8}
                        stroke="#5a4828" strokeWidth="2" opacity={0.6-j*.08}/>
                    </g>
                  );
                })}
                {/* cravos na grade */}
                {[0,1,2,3,4].map(j=>{
                  const mx=gL.x+(gR.x-gL.x)*(j+1)/6;
                  return <polygon key={j} points={`${mx-3},${gL.y-46} ${mx+3},${gL.y-46} ${mx},${gL.y-52}`} fill="#5a4828"/>;
                })}
              </g>
            );
          })()}
          {/* ameias nas torres do portão */}
          {[[5.5,1.2],[7.3,1.2]].map(([tx,td],ti)=>(
            [0,1,2].map(i=>{
              const base=iso(tx+i*(td/3),9.8,5.2);
              return <rect key={`${ti}-${i}`} x={base.x-5} y={base.y-24} width={10} height={24}
                fill="#c8b898" stroke="#6a5a48" strokeWidth="0.8" rx="1"/>;
            })
          ))}

          {/* TORRES NOS CANTOS */}
          {[{gx:-0.6,gy:-0.6},{gx:13.4,gy:-0.6},{gx:-0.6,gy:9.4},{gx:13.4,gy:9.4}].map(({gx,gy},i)=>(
            <g key={i}>
              <IsoBox gx={gx} gy={gy} gz={0} w={1.2} d={1.2} h={5}
                top="#d4c8a8" left="url(#vStonePat)" right="#b0a888" stroke="rgba(0,0,0,0.35)" sw={0.9}/>
              {/* capitel cônico */}
              {[0,1,2].map(j=>{
                const cp=iso(gx+0.1+j*.35,gy,5+j*.3);
                return <ellipse key={j} cx={cp.x} cy={cp.y} rx={22-j*6} ry={12-j*3} fill="#c8b898" opacity={0.7-j*.1}/>;
              })}
              <ellipse cx={iso(gx+0.6,gy+0.6,5.9).x} cy={iso(gx+0.6,gy+0.6,5.9).y}
                rx={14} ry={7} fill="#8a7040"/>
              {/* merlões da torre */}
              {[0,1,2,3].map(j=>{
                const bp=iso(gx+0.1+j*.28,gy+0.3*Math.sin(j),5);
                return <rect key={j} x={bp.x-4} y={bp.y-20} width={8} height={20}
                  fill="#c8b898" stroke="#6a5a48" strokeWidth="0.7" rx="1" opacity="0.9"/>;
              })}
            </g>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 8: CAMPOS E CERCAS INTERNAS ─────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* campos de fazenda (NO) */}
          {[0,1,2].map(row=>(
            <g key={row}>
              <IsoBox gx={1} gy={row*1.4} gz={0} w={2} d={1.2} h={0.08}
                top={row%2===0?'#7a9850':'#689040'} left="#4a6830" right="#5a7838"/>
              {/* linhas de plantio */}
              {[0,1,2,3].map(r=>{
                const a=iso(1,row*1.4+r*.3,0.09),b=iso(3,row*1.4+r*.3,0.09);
                return <line key={r} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="#608030" strokeWidth="1" opacity="0.7"/>;
              })}
            </g>
          ))}
          {/* cerca da fazenda */}
          {[0.5,1.0,1.5,2.0,2.5].map((gy,i)=>{
            const a=iso(0.1,gy,0.4),b=iso(0.1,gy+0.5,0.4);
            return(
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8a6030" strokeWidth="2.5"/>
                {i<4&&<line x1={a.x-8} y1={a.y+2} x2={b.x+8} y2={b.y-2} stroke="#6a4820" strokeWidth="1.5" opacity="0.6"/>}
              </g>
            );
          })}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 9: CASAS MEDIEVAIS ──────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}

          {/* Casa 1 — NO (fazenda) */}
          <IsoHouse gx={1.3} gy={0.6} w={1.8} d={1.4} wh={1.4} rh={1.1}
            wL="#9a8060" wR="#b09070" rL="#8b5a2a" rR="#7a4e22">
            <circle cx={iso(1.8,0.6,1.4).x-5} cy={iso(1.8,0.6,1.4).y-18} r={6} fill="#3a1c08" opacity="0.9"/>
            <circle cx={iso(1.8,0.6,1.4).x-5} cy={iso(1.8,0.6,1.4).y-18} r={4}fill="#60380e"/>
          </IsoHouse>

          {/* Casa 2 — N centro-esquerda */}
          <IsoHouse gx={3} gy={0.5} w={2.2} d={1.6} wh={1.6} rh={1.2}
            wL="#8a7558" wR="#a08868" rL="#963c18" rR="#822e10">
            {/* janela */}
            {(()=>{const w=iso(4.2,0.5,1.0);return<rect x={w.x-8} y={w.y-22} width={12} height={14} fill="#f0c870" opacity="0.8" rx="1"/>;})()}
          </IsoHouse>

          {/* Casa 3 — O lateral */}
          <IsoHouse gx={0.8} gy={3} w={1.6} d={1.4} wh={1.3} rh={1.0}
            wL="#8a7558" wR="#a09068" rL="#7a4a1a" rR="#6a3e14"/>

          {/* Casa 4 — SO perto do quartel */}
          <IsoHouse gx={1.3} gy={5.5} w={2} d={1.5} wh={1.5} rh={1.1}
            wL="#9a8060" wR="#b09070" rL="#8b4820" rR="#7a3e18">
            {(()=>{const w=iso(3.3,5.5,0.9);return<rect x={w.x-6} y={w.y-18} width={10} height={12} fill="#f0c870" opacity="0.75" rx="1"/>;})()}
          </IsoHouse>

          {/* Casa 5 — S próxima ao portão */}
          <IsoHouse gx={3.5} gy={8} w={1.8} d={1.3} wh={1.3} rh={1.0}
            wL="#8a7558" wR="#a09068" rL="#903c14" rR="#7a3010"/>

          {/* Casa 6 — SE */}
          <IsoHouse gx={9.5} gy={6.5} w={2} d={1.5} wh={1.4} rh={1.0}
            wL="#9a8060" wR="#b09070" rL="#9a4218" rR="#873610"/>

          {/* Casa 7 — E grande */}
          <IsoHouse gx={11} gy={5} w={2.5} d={1.8} wh={1.6} rh={1.2}
            wL="#8a7558" wR="#a09068" rL="#8b3e18" rR="#7a3210">
            {(()=>{const w=iso(13.5,5,1.0);return<rect x={w.x-7} y={w.y-22} width={11} height={14} fill="#f0c870" opacity="0.8" rx="1"/>;})()}
          </IsoHouse>

          {/* Casa 8 — NE canto */}
          <IsoHouse gx={12.5} gy={0.8} w={1.6} d={1.2} wh={1.3} rh={1.0}
            wL="#9a8060" wR="#b09070" rL="#7a3a14" rR="#6a3010"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 10: QUARTEL ─────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <IsoBox gx={2} gy={7} gz={0} w={2.5} d={2} h={2}
            top="#b0a890" left="#686050" right="#807868" stroke="rgba(0,0,0,0.4)" sw={1}/>
          {/* teto do quartel */}
          {(()=>{
            const A=iso(2,7,2),B=iso(4.5,7,2),C=iso(4.5,9,2),D=iso(2,9,2);
            const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-28};
            const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-28};
            return(
              <g>
                <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill="#963c18"/>
                <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#7a3010"/>
                <polygon points={`${f(B)} ${f(C)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#8b3814" opacity="0.75"/>
                <line x1={rF.x} y1={rF.y} x2={rB.x} y2={rB.y} stroke="rgba(0,0,0,0.5)" strokeWidth="1.2"/>
              </g>
            );
          })()}
          {/* estandarte do quartel */}
          {(()=>{
            const top=iso(3.25,7,3.8),mid=iso(3.25,7,2.6);
            return(
              <g>
                <line x1={top.x} y1={top.y} x2={mid.x} y2={mid.y} stroke="#4a3010" strokeWidth="2"/>
                <polygon points={`${top.x},${top.y} ${top.x+20},${top.y} ${top.x+20},${top.y+35} ${top.x},${top.y+35}`}
                  fill="#8b0018" opacity="0.92" style={{animation:'bannerSway 3s ease-in-out infinite'}}/>
                <text x={top.x+10} y={top.y+22} fontSize="9" textAnchor="middle" fill="#f0d060">⚔</text>
              </g>
            );
          })()}
          {/* treino no pátio do quartel */}
          <Villager x={iso(3,8.2,0).x}  y={iso(3,8.2,0).y}   col="#4a5878"/>
          <Villager x={iso(3.8,8.5,0).x} y={iso(3.8,8.5,0).y} col="#3a4868"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 11: ACADEMIA / BIBLIOTECA ──────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <IsoBox gx={9} gy={1} gz={0} w={2.8} d={2.2} h={2.2}
            top="#c8b898" left="url(#vStonePat)" right="#a09070" stroke="rgba(0,0,0,0.4)" sw={0.9}/>
          {/* teto academia */}
          {(()=>{
            const A=iso(9,1,2.2),B=iso(11.8,1,2.2),C=iso(11.8,3.2,2.2),D=iso(9,3.2,2.2);
            const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-32};
            const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-32};
            return(
              <g>
                <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill="#7a5530"/>
                <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#614420"/>
                <polygon points={`${f(B)} ${f(C)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#704e28" opacity="0.75"/>
                <line x1={rF.x} y1={rF.y} x2={rB.x} y2={rB.y} stroke="rgba(0,0,0,0.45)" strokeWidth="1.2"/>
              </g>
            );
          })()}
          {/* janelas */}
          {[1.5,3.0].map((gy,j)=>{
            const w=iso(11.8,gy,1.4);
            return <rect key={j} x={w.x-6} y={w.y-16} width={10} height={14} fill="#f0c870" opacity="0.8" rx="1"/>;
          })}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 12: SERRARIA ────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <IsoBox gx={0.8} gy={5.5} gz={0} w={1.8} d={1.5} h={1.5}
            top="#b0a070" left="#686050" right="#807868"/>
          {(()=>{
            const A=iso(0.8,5.5,1.5),B=iso(2.6,5.5,1.5),C=iso(2.6,7,1.5),D=iso(0.8,7,1.5);
            const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-22};
            const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-22};
            return(
              <g>
                <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill="#7a4818"/>
                <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#613e14"/>
              </g>
            );
          })()}
          {/* troncos */}
          {(()=>{const b=iso(2,6,0.1);return(
            <g>
              {[0,8,16].map(dx=>(
                <ellipse key={dx} cx={b.x+dx} cy={b.y+5} rx={5} ry={3} fill="#8a5820"/>
              ))}
              {[0,8,16].map(dx=>(
                <rect key={dx} x={b.x+dx-5} y={b.y-3} width={10} height={6} fill="#7a4e18"/>
              ))}
            </g>
          );})()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 13: ARMAZÉM ─────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <IsoBox gx={5.5} gy={3.5} gz={0} w={2} d={1.8} h={1.8}
            top="#c8b898" left="#807058" right="#9a8868"/>
          {(()=>{
            const A=iso(5.5,3.5,1.8),B=iso(7.5,3.5,1.8),C=iso(7.5,5.3,1.8),D=iso(5.5,5.3,1.8);
            const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-26};
            const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-26};
            return(
              <g>
                <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill="#603814"/>
                <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#503010"/>
              </g>
            );
          })()}
          {/* barris */}
          {(()=>{return[iso(5.8,5.4,0.1),iso(6.4,5.4,0.1),iso(7,5.4,0.1)].map((b,i)=>(
            <g key={i}>
              <ellipse cx={b.x} cy={b.y} rx={9}  ry={5}  fill="#7a4818"/>
              <rect   x={b.x-9} y={b.y-12} width={18} height={12} fill="#8a5820"/>
              <ellipse cx={b.x} cy={b.y-12} rx={9} ry={5} fill="#9a6030"/>
              {[-4,0,4].map(dy=><line key={dy} x1={b.x-9} y1={b.y+dy} x2={b.x+9} y2={b.y+dy} stroke="#5a3810" strokeWidth="0.8"/>)}
            </g>
          ));})()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 14: PEDREIRA ────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <IsoBox gx={11.5} gy={2.5} gz={0} w={2} d={1.6} h={1}
            top="#d0c8b0" left="#8a8070" right="#a09880"/>
          {/* pedras espalhadas */}
          {[iso(11.8,4.2,0.1),iso(12.8,4,0.1),iso(13.2,4.4,0.1)].map((s,i)=>(
            <g key={i}>
              <ellipse cx={s.x} cy={s.y} rx={12+i*3} ry={7+i*2} fill="#b0a890" opacity="0.9"/>
              <ellipse cx={s.x-2} cy={s.y-3} rx={8+i*2} ry={5+i} fill="#c8c0a8" opacity="0.7"/>
            </g>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 15: MINA DE FERRO ───────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(()=>{
            const entry=iso(12.5,0.8,0.5);
            return(
              <g>
                <IsoBox gx={12} gy={0} gz={0} w={1.8} d={1.4} h={0.8}
                  top="#b0a890" left="#807060" right="#9a8870"/>
                {/* entrada da mina */}
                <path d={`M${entry.x-16},${entry.y} Q${entry.x},${entry.y-22} ${entry.x+16},${entry.y}`}
                  fill="none" stroke="#2a2018" strokeWidth="20"/>
                <path d={`M${entry.x-13},${entry.y} Q${entry.x},${entry.y-18} ${entry.x+13},${entry.y}`}
                  fill="none" stroke="#0a0806" strokeWidth="12"/>
                {/* escoras de madeira */}
                <line x1={entry.x-12} y1={entry.y} x2={entry.x-10} y2={entry.y-18} stroke="#6a4010" strokeWidth="3"/>
                <line x1={entry.x+12} y1={entry.y} x2={entry.x+10} y2={entry.y-18} stroke="#6a4010" strokeWidth="3"/>
                <line x1={entry.x-10} y1={entry.y-18} x2={entry.x+10} y2={entry.y-18} stroke="#6a4010" strokeWidth="2.5"/>
              </g>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 16: IGREJA COM TORRE SINEIRA ────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* nave */}
          <IsoBox gx={8.5} gy={4} gz={0} w={3} d={2.5} h={2.5}
            top="#d4c8a8" left="url(#vStonePat)" right="#c0b090" stroke="rgba(0,0,0,0.4)" sw={0.9}/>
          {/* teto da nave */}
          {(()=>{
            const A=iso(8.5,4,2.5),B=iso(11.5,4,2.5),C=iso(11.5,6.5,2.5),D=iso(8.5,6.5,2.5);
            const rF={x:(A.x+B.x)/2,y:(A.y+B.y)/2-34};
            const rB={x:(D.x+C.x)/2,y:(D.y+C.y)/2-34};
            return(
              <g>
                <polygon points={`${f(A)} ${f(B)} ${rF.x},${rF.y}`} fill="#808080"/>
                <polygon points={`${f(A)} ${f(D)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#686868"/>
                <polygon points={`${f(B)} ${f(C)} ${rB.x},${rB.y} ${rF.x},${rF.y}`} fill="#747474" opacity="0.75"/>
              </g>
            );
          })()}
          {/* TORRE SINEIRA */}
          <IsoBox gx={8.5} gy={4} gz={0} w={1.2} d={1.2} h={5.5}
            top="#d4c8a8" left="url(#vStonePat)" right="#c0b090" stroke="rgba(0,0,0,0.35)" sw={0.8}/>
          {/* teto cônico da torre */}
          {(()=>{
            const base=iso(9.1,4.6,5.5);
            return(
              <g>
                <polygon points={`${f(iso(8.5,4,5.5))} ${f(iso(9.7,4,5.5))} ${f(iso(9.7,5.2,5.5))} ${f(iso(8.5,5.2,5.5))}`} fill="#808080"/>
                <polygon points={`${f(iso(8.5,4,5.5))} ${f(iso(9.7,4,5.5))} ${base.x},${base.y-50}`} fill="#989898"/>
                <polygon points={`${f(iso(8.5,4,5.5))} ${f(iso(8.5,5.2,5.5))} ${base.x},${base.y-50}`} fill="#686868"/>
                <polygon points={`${f(iso(9.7,4,5.5))} ${f(iso(9.7,5.2,5.5))} ${base.x},${base.y-50}`} fill="#787878" opacity="0.7"/>
                {/* Cruz */}
                <line x1={base.x} y1={base.y-52} x2={base.x} y2={base.y-94} stroke="#e0d8c0" strokeWidth="3"/>
                <line x1={base.x-12} y1={base.y-78} x2={base.x+12} y2={base.y-78} stroke="#e0d8c0" strokeWidth="3"/>
              </g>
            );
          })()}
          {/* janelas góticas da torre */}
          {[1.8,3.4].map((gz,j)=>{
            const w=iso(9.7,4.6,gz);
            return(
              <g key={j}>
                <rect x={w.x-5} y={w.y-22} width={8} height={16} fill="#f0c870" opacity="0.75" rx="1"/>
                <path d={`M${w.x-5},${w.y-14} Q${w.x-1},${w.y-24} ${w.x+3},${w.y-14}`}
                  fill="#f0c870" opacity="0.7"/>
              </g>
            );
          })}
          {/* sino */}
          {(()=>{const b=iso(9.1,4.6,4.5);return(
            <g>
              <ellipse cx={b.x} cy={b.y-8} rx={10} ry={6} fill="#c8a830"/>
              <path d={`M${b.x-10},${b.y-8} Q${b.x},${b.y+2} ${b.x+10},${b.y-8}`} fill="#a88820"/>
            </g>
          );})()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 17: MOINHO DE VENTO ─────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(()=>{
            const base=iso(12.2,0.6,0);
            return(
              <g>
                {/* colina pequena */}
                <ellipse cx={base.x} cy={base.y+5} rx={48} ry={20} fill="#7a8a50" opacity="0.85"/>
                {/* corpo do moinho */}
                <IsoBox gx={11.8} gy={0.3} gz={0} w={1.2} d={1} h={3.5}
                  top="#c8b898" left="#808878" right="#9a9870"/>
                {/* teto cônico */}
                {(()=>{
                  const b=iso(12.4,0.8,3.5);
                  return(
                    <g>
                      <polygon points={`${f(iso(11.8,0.3,3.5))} ${f(iso(13,0.3,3.5))} ${f(iso(13,1.3,3.5))} ${f(iso(11.8,1.3,3.5))}`} fill="#a09070"/>
                      <polygon points={`${f(iso(11.8,0.3,3.5))} ${f(iso(13,0.3,3.5))} ${b.x},${b.y-36}`} fill="#b0a080"/>
                      <polygon points={`${f(iso(11.8,0.3,3.5))} ${f(iso(11.8,1.3,3.5))} ${b.x},${b.y-36}`} fill="#888060"/>
                    </g>
                  );
                })()}
                {/* haste das pás */}
                <circle cx={base.x+8} cy={base.y-52} r={4} fill="#5a4020"/>
                {/* 4 pás */}
                {[0,90,180,270].map((angle,i)=>{
                  const rad=angle*Math.PI/180;
                  const ex=base.x+8+Math.cos(rad)*44;
                  const ey=base.y-52+Math.sin(rad)*44;
                  return(
                    <g key={i}>
                      <line x1={base.x+8} y1={base.y-52} x2={ex} y2={ey} stroke="#7a5828" strokeWidth="2.5"/>
                      <polygon points={`${ex-7},${ey-10} ${ex+7},${ey+10} ${base.x+6},${base.y-44} ${base.x+10},${base.y-60}`}
                        fill="#c8a868" stroke="#8a6830" strokeWidth="0.8" opacity="0.9"/>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 18: BARRACAS DE MERCADO ─────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {[{gx:5,gy:6.5,col:'#c83030'},{gx:6.5,gy:6.8,col:'#2858a8'},{gx:8,gy:6.5,col:'#2a8a38'}].map(({gx,gy,col},i)=>{
            const peak=iso(gx+0.7,gy+0.6,1.6);
            const A=iso(gx,gy,0.85),B=iso(gx+1.4,gy,0.85);
            const C=iso(gx+1.4,gy+1.2,0.85),D=iso(gx,gy+1.2,0.85);
            const frm=iso(gx,gy,0),bac=iso(gx,gy+1.2,0);
            return(
              <g key={i}>
                {/* postes */}
                <line x1={iso(gx,gy,0).x} y1={iso(gx,gy,0).y} x2={A.x} y2={A.y} stroke="#5a3810" strokeWidth="3"/>
                <line x1={iso(gx+1.4,gy+1.2,0).x} y1={iso(gx+1.4,gy+1.2,0).y} x2={C.x} y2={C.y} stroke="#5a3810" strokeWidth="3"/>
                {/* cobertura */}
                <polygon points={`${f(A)} ${f(B)} ${peak.x},${peak.y}`} fill={col} opacity="0.9"/>
                <polygon points={`${f(A)} ${f(D)} ${peak.x},${peak.y}`} fill={col} opacity="0.75"/>
                <polygon points={`${f(B)} ${f(C)} ${peak.x},${peak.y}`} fill={col} opacity="0.7"/>
                <polygon points={`${f(D)} ${f(C)} ${peak.x},${peak.y}`} fill={col} opacity="0.65"/>
                {/* franja */}
                {[0,.25,.5,.75,1].map(t=>{
                  const fx=A.x+(B.x-A.x)*t,fy=A.y+(B.y-A.y)*t;
                  return <line key={t} x1={fx} y1={fy} x2={fx} y2={fy+8} stroke={col} strokeWidth="2.5" opacity="0.7"/>;
                })}
                {/* mercadoria */}
                <ellipse cx={(frm.x+bac.x)/2} cy={(frm.y+bac.y)/2+5} rx={14} ry={8} fill="#e8d090" opacity="0.8"/>
              </g>
            );
          })}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 19: ÁRVORES INTERNAS ────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <PineTree gx={4.5} gy={1.5} h={2.8} tint="#2a6030"/>
          <PineTree gx={5}   gy={2.5} h={2.4} tint="#336a38"/>
          <PineTree gx={4}   gy={3}   h={2.6} tint="#2a5828"/>
          <PineTree gx={12}  gy={5}   h={2.5} tint="#2a6030"/>
          <PineTree gx={13}  gy={6}   h={2.2} tint="#336a38"/>
          <PineTree gx={0.5} gy={8.5} h={2.3} tint="#284e28"/>
          <PineTree gx={1.5} gy={9}   h={2.0} tint="#2a5828"/>
          <PineTree gx={9}   gy={8}   h={2.4} tint="#2a6030"/>
          <PineTree gx={10}  gy={8.5} h={2.1} tint="#336a38"/>

          {/* árvores externas (floresta densa ao redor das muralhas) */}
          {[[-3,2],[-3,4],[-3,6],[-3,8],[15,1],[15,4],[16,6],[15,8],
            [1,-2],[3,-2],[5,-2],[8,-2],[11,-2],[13,-2],
            [2,12],[5,12],[8,12],[11,12]].map(([gx,gy],i)=>(
            <PineTree key={i} gx={gx} gy={gy} h={3+Math.sin(i)*0.5}
              tint={i%3===0?'#1e4a20':i%3===1?'#264e28':'#1a4020'}/>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 20: PRAÇA CENTRAL + FOGUEIRA ────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* pavimentação circular */}
          {(()=>{
            const center=iso(7,5,0.03);
            return(
              <g>
                <ellipse cx={center.x} cy={center.y} rx={75} ry={42} fill="#b0a280" opacity="0.85"/>
                <ellipse cx={center.x} cy={center.y} rx={68} ry={38} fill="none" stroke="#8a7860" strokeWidth="2.5"/>
                <ellipse cx={center.x} cy={center.y} rx={55} ry={31} fill="none" stroke="#8a7860" strokeWidth="1.5" strokeDasharray="5,4"/>
                {/* pedras da praça */}
                {Array.from({length:12},(_,i)=>{
                  const angle=i*30*Math.PI/180;
                  return <ellipse key={i}
                    cx={center.x+Math.cos(angle)*55} cy={center.y+Math.sin(angle)*30}
                    rx={8} ry={5} fill="#c8b898" opacity="0.7"/>;
                })}
              </g>
            );
          })()}

          {/* FOGUEIRA */}
          {(()=>{
            const fire=iso(7,5,0.1);
            return(
              <g>
                {/* glow ambiente */}
                <ellipse cx={fire.x} cy={fire.y} rx={90} ry={55} fill="url(#vFireGlow)" opacity="0.8"
                  style={{animation:'isoPulse 2.5s ease-in-out infinite'}}/>
                <ellipse cx={fire.x} cy={fire.y} rx={55} ry={34} fill="url(#vFireGlow2)" opacity="0.6"
                  style={{animation:'isoPulse 1.8s ease-in-out infinite 0.4s'}}/>
                {/* pedras */}
                {Array.from({length:8},(_,i)=>{
                  const angle=i*45*Math.PI/180;
                  return <ellipse key={i}
                    cx={fire.x+Math.cos(angle)*22} cy={fire.y+Math.sin(angle)*12}
                    rx={7} ry={4} fill="#706050"/>;
                })}
                {/* troncos */}
                <line x1={fire.x-16} y1={fire.y+4} x2={fire.x+12} y2={fire.y-8} stroke="#6a3810" strokeWidth="5" strokeLinecap="round"/>
                <line x1={fire.x+16} y1={fire.y+4} x2={fire.x-10} y2={fire.y-8} stroke="#5a3010" strokeWidth="5" strokeLinecap="round"/>
                {/* chamas principais */}
                <g style={{animation:`flicker 0.5s ease-in-out infinite`}}>
                  <ellipse cx={fire.x}    cy={fire.y-18} rx={13} ry={22} fill="#e05010" opacity="0.95"/>
                  <ellipse cx={fire.x-6}  cy={fire.y-24} rx={9}  ry={18} fill="#f07020" opacity="0.9"/>
                  <ellipse cx={fire.x+7}  cy={fire.y-22} rx={8}  ry={16} fill="#f07020" opacity="0.88"/>
                </g>
                <g style={{animation:`flicker 0.7s ease-in-out infinite 0.12s`}}>
                  <ellipse cx={fire.x}    cy={fire.y-32} rx={9}  ry={18} fill="#f08020" opacity="0.85"/>
                  <ellipse cx={fire.x-3}  cy={fire.y-42} rx={6}  ry={14} fill="#f0a030" opacity="0.8"/>
                  <ellipse cx={fire.x+5}  cy={fire.y-38} rx={5}  ry={12} fill="#ffb040" opacity="0.75"/>
                </g>
                <g style={{animation:`flicker 0.45s ease-in-out infinite 0.08s`}}>
                  <ellipse cx={fire.x} cy={fire.y-50} rx={4} ry={10} fill="#ffcc50" opacity="0.7"/>
                  <ellipse cx={fire.x} cy={fire.y-58} rx={2.5} ry={7} fill="#ffee80" opacity="0.55"/>
                </g>
                {/* brasas */}
                {[[-8,3],[5,2],[0,5],[-12,6],[10,4]].map(([dx,dy],i)=>(
                  <circle key={i} cx={fire.x+dx} cy={fire.y+dy}
                    r={2} fill="#ff6020" opacity="0.8"
                    style={{animation:`floatUp ${1.2+i*.3}s ease-out infinite ${i*.25}s`}}/>
                ))}
                {/* faíscas */}
                {[[-5,-18],[3,-22],[-8,-26],[9,-20],[-2,-30]].map(([dx,dy],i)=>(
                  <circle key={i} cx={fire.x+dx} cy={fire.y+dy}
                    r={1.5} fill="#ffcc40" opacity="0.9"
                    style={{animation:`floatUp ${0.8+i*.2}s ease-out infinite ${i*.15}s`}}/>
                ))}
              </g>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 21: ALDEÕES ──────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* ao redor da fogueira */}
          {[0,60,120,180,240,300].map((angle,i)=>{
            const rad=angle*Math.PI/180;
            const center=iso(7,5,0);
            const x=center.x+Math.cos(rad)*55;
            const y=center.y+Math.sin(rad)*30;
            const cols=['#8a6840','#7a5830','#9a5838','#6a5848','#8a7048','#7a6040'];
            return <Villager key={i} x={x} y={y} col={cols[i]}/>;
          })}
          {/* na estrada */}
          <Villager x={iso(7,7.5,0).x}  y={iso(7,7.5,0).y}  col="#8a6030"/>
          <Villager x={iso(7,8.5,0).x}  y={iso(7,8.5,0).y}  col="#7a5828"/>
          <Villager x={iso(5.5,5,0).x}  y={iso(5.5,5,0).y}  col="#6a5048"/>
          <Villager x={iso(9,5,0).x}    y={iso(9,5,0).y}    col="#9a7048"/>
          <Villager x={iso(6,2.5,0).x}  y={iso(6,2.5,0).y}  col="#8a6838"/>
          <Villager x={iso(10,4,0).x}   y={iso(10,4,0).y}   col="#7a5830"/>
          {/* guarda na porta */}
          {[iso(6.2,10.2,0),iso(7.8,10.2,0)].map((g,i)=>(
            <g key={i}>
              <ellipse cx={g.x} cy={g.y+2} rx={6} ry={2.5} fill="rgba(0,0,0,0.3)"/>
              <rect x={g.x-5} y={g.y-20} width={10} height={18} fill="#4a5870" rx="2"/>
              <ellipse cx={g.x} cy={g.y-22} rx={6} ry={6.5} fill="#d4b888"/>
              <path d={`M${g.x-6},${g.y-22} Q${g.x-6},${g.y-32} ${g.x},${g.y-35} Q${g.x+6},${g.y-32} ${g.x+6},${g.y-22}`}
                fill="#5a6878" stroke="#404858" strokeWidth="0.8"/>
              <line x1={g.x+(i===0?8:-8)} y1={g.y} x2={g.x+(i===0?10:-10)} y2={g.y-48}
                stroke="#7a6040" strokeWidth="2.5"/>
              <polygon points={`${g.x+(i===0?7:-7)},${g.y-46} ${g.x+(i===0?13:-13)},${g.y-46} ${g.x+(i===0?10:-10)},${g.y-62}`}
                fill="#a0a8b0"/>
            </g>
          ))}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 22: PROPS (carroças, barris extras, lenha) ────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* carroça */}
          {(()=>{
            const cart=iso(8.5,9,0.1);
            return(
              <g>
                <rect x={cart.x-20} y={cart.y-12} width={38} height={12} fill="#8a5820" rx="2"/>
                {/* rodas */}
                <circle cx={cart.x-12} cy={cart.y+2}  r={10} fill="none" stroke="#5a3810" strokeWidth="4"/>
                <circle cx={cart.x+14} cy={cart.y+2}  r={10} fill="none" stroke="#5a3810" strokeWidth="4"/>
                {[0,45,90,135].map(a=>{
                  const rad2=a*Math.PI/180;
                  return(
                    <g key={a}>
                      <line x1={cart.x-12} y1={cart.y+2}
                        x2={cart.x-12+Math.cos(rad2)*9} y2={cart.y+2+Math.sin(rad2)*9}
                        stroke="#5a3810" strokeWidth="2"/>
                      <line x1={cart.x+14} y1={cart.y+2}
                        x2={cart.x+14+Math.cos(rad2)*9} y2={cart.y+2+Math.sin(rad2)*9}
                        stroke="#5a3810" strokeWidth="2"/>
                    </g>
                  );
                })}
                {/* vara */}
                <line x1={cart.x+18} y1={cart.y-4} x2={cart.x+52} y2={cart.y-10}
                  stroke="#7a5020" strokeWidth="3"/>
              </g>
            );
          })()}
          {/* pilhas de lenha */}
          {[iso(4.5,8.5,0.1),iso(5,8.8,0.1)].map((p,i)=>(
            <g key={i}>
              {[0,4,8].map(dx=>(
                <g key={dx}>
                  <rect x={p.x+dx-18} y={p.y-8} width={12} height={7} fill="#7a5020"/>
                  <rect x={p.x+dx-16} y={p.y-13} width={12} height={7} fill="#8a5a28"/>
                </g>
              ))}
            </g>
          ))}
          {/* escadas de madeira */}
          {(()=>{
            const lad=iso(9.5,9.5,0.1);
            return(
              <g>
                <line x1={lad.x-6} y1={lad.y} x2={lad.x-8} y2={lad.y-40} stroke="#8a5820" strokeWidth="3" strokeLinecap="round"/>
                <line x1={lad.x+6} y1={lad.y} x2={lad.x+8} y2={lad.y-40} stroke="#8a5820" strokeWidth="3" strokeLinecap="round"/>
                {[0,1,2,3,4].map(j=>(
                  <line key={j} x1={lad.x-7+j*.4} y1={lad.y-8-j*8} x2={lad.x+7-j*.4} y2={lad.y-8-j*8}
                    stroke="#7a5020" strokeWidth="2.5" strokeLinecap="round"/>
                ))}
              </g>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 23: RAIOS DE LUZ DO PÔR DO SOL ─────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {/* feixe dourado sobre o castelo */}
          <polygon points="960,195 400,860 700,860" fill="rgba(255,170,40,0.04)"
            style={{animation:'lightRay 5s ease-in-out infinite'}}/>
          <polygon points="960,195 550,860 760,860" fill="rgba(255,190,60,0.05)"
            style={{animation:'lightRay 6s ease-in-out infinite 1s'}}/>
          <polygon points="960,195 280,860 500,860" fill="rgba(255,150,20,0.03)"
            style={{animation:'lightRay 7s ease-in-out infinite 0.5s'}}/>

          {/* névoa de pôr do sol no horizonte */}
          <rect x="0" y="295" width="1200" height="40"
            fill="rgba(240,130,30,0.12)" filter="url(#vSoftBlur)"/>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 24: ZONAS CLICÁVEIS ────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          {ZONES.map(({type,label,icon})=>{
            const [cx,cy]=CENTRES[type];
            const isSel=selected===type;
            return(
              <g key={type} onClick={()=>setSelected(isSel?null:type)} style={{cursor:'pointer'}}>
                <ellipse cx={cx} cy={cy} rx={38} ry={22}
                  fill={isSel?'rgba(240,200,30,0.22)':'rgba(0,0,0,0)'}
                  stroke={isSel?'#f0c820':'rgba(240,200,30,0.44)'}
                  strokeWidth={isSel?2.2:1.3} strokeDasharray={isSel?'none':'5,4'}
                  style={{filter:isSel?'drop-shadow(0 0 10px #f0c82099)':'none',transition:'all .2s'}}/>
                <text x={cx} y={cy-12} fontSize="18" textAnchor="middle">{icon}</text>
                <text x={cx} y={cy+8} fontSize="9"  textAnchor="middle"
                  fill={isSel?'#f0d040':'#e8d080'}
                  stroke="rgba(0,0,0,0.85)" strokeWidth="3" paintOrder="stroke"
                  fontWeight="700" fontFamily="Cinzel,serif">{label}</text>
                {isSel&&(
                  <ellipse cx={cx} cy={cy} rx={38} ry={22}
                    fill="none" stroke="#f0d040" strokeWidth="1.5"
                    strokeDasharray="3,3" opacity="0.8"
                    style={{animation:'isoPulse 1.5s ease-in-out infinite'}}/>
                )}
              </g>
            );
          })}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* CAMADA 25: VINHETA FINAL ───────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════ */}
          <rect x="0" y="0" width="1200" height="860" fill="url(#vVig)" pointerEvents="none"/>
          {/* gradiente de neblina na base */}
          <rect x="0" y="760" width="1200" height="100"
            fill="rgba(0,0,0,0.4)" filter="url(#vSoftBlur)" pointerEvents="none"/>
        </svg>

        {/* painel lateral */}
        {selected&&<BuildingPanel type={selected} onClose={()=>setSelected(null)}/>}

        {!selected&&(
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-4 py-1.5 rounded-full pointer-events-none"
            style={{background:'rgba(0,0,0,.65)',color:'#d4a820',border:'1px solid rgba(184,134,11,.4)'}}>
            Selecione um edifício para gerenciar
          </div>
        )}
      </div>
    </div>
  );
};

