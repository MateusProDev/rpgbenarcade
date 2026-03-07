/**
 * CastleView — Interior isométrico 3D do castelo
 * Projeção: iso(gx,gy,gz) = { x: 580+(gx-gy)*40, y: 195+(gx+gy)*22−gz*30 }
 * Grid 10×8, gx cresce para direita-frente, gy cresce para esquerda-frente
 */
import React, { useState } from 'react';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ─── projeção isométrica ────────────────────────────────────────────────── */
function iso(gx: number, gy: number, gz = 0) {
  return { x: 580 + (gx - gy) * 40, y: 195 + (gx + gy) * 22 - gz * 30 };
}
function pt(gx: number, gy: number, gz = 0) {
  const p = iso(gx, gy, gz); return `${p.x},${p.y}`;
}

/* ─── centros das zonas clicáveis ───────────────────────────────────────── */
const CENTRES: Record<BuildingType, [number, number]> = {
  barracks:  [iso(4,3.5).x, iso(4,3.5).y],
  academy:   [iso(7.5,5).x, iso(7.5,5).y],
  farm:      [iso(1,6).x,   iso(1,6).y],
  sawmill:   [iso(2.5,7).x, iso(2.5,7).y],
  warehouse: [iso(1.5,4).x, iso(1.5,4).y],
  quarry:    [iso(8,6).x,   iso(8,6).y],
  ironMine:  [iso(9,5).x,   iso(9,5).y],
};

const ZONES: { type: BuildingType; label: string; icon: string }[] = [
  { type: 'barracks',  label: 'Quartel',       icon: '⚔️' },
  { type: 'academy',   label: 'Academia',      icon: '📚' },
  { type: 'farm',      label: 'Fazenda',       icon: '🌾' },
  { type: 'sawmill',   label: 'Serraria',      icon: '🪵' },
  { type: 'warehouse', label: 'Armazém',       icon: '🏚️' },
  { type: 'quarry',    label: 'Pedreira',      icon: '🪨' },
  { type: 'ironMine',  label: 'Mina de Ferro', icon: '⚙️' },
];

/* ─── caixa isométrica 3D ───────────────────────────────────────────────── */
function IsoBox({ gx,gy,gz,w,d,h,topFill,leftFill,rightFill }: {
  gx:number;gy:number;gz:number;w:number;d:number;h:number;
  topFill:string;leftFill:string;rightFill:string;
}) {
  const tl=iso(gx,gy,gz+h);   const tr=iso(gx+w,gy,gz+h);
  const tbl=iso(gx,gy+d,gz+h);const tbr=iso(gx+w,gy+d,gz+h);
  const bl=iso(gx,gy,gz);     const br=iso(gx+w,gy,gz);
  const bbl=iso(gx,gy+d,gz);  const bbr=iso(gx+w,gy+d,gz);
  const tp=(p:{x:number,y:number})=>`${p.x},${p.y}`;
  return (
    <g>
      <polygon points={`${tp(tl)} ${tp(tr)} ${tp(tbr)} ${tp(tbl)}`} fill={topFill}/>
      <polygon points={`${tp(tl)} ${tp(tbl)} ${tp(bbl)} ${tp(bl)}`}  fill={leftFill}/>
      <polygon points={`${tp(tr)} ${tp(tbr)} ${tp(bbr)} ${tp(br)}`}  fill={rightFill}/>
    </g>
  );
}

/* ─── painel lateral do edifício ───────────────────────────────────────── */
function BuildingPanel({ type, onClose }: { type: BuildingType; onClose: () => void }) {
  return (
    <div className="absolute inset-y-0 right-0 w-72 flex flex-col z-40 shadow-2xl"
      style={{background:'linear-gradient(160deg,#1a0e05ee,#2a1808f5)',borderLeft:'2px solid #b8860b'}}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-900/40">
        <span className="font-medieval text-yellow-500 text-lg">Gerenciar Edifício</span>
        <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <BuildingCard buildingType={type}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export const CastleView: React.FC = () => {
  const castle    = useGameStore((s) => s.castle);
  const resources = useResources();
  const [selected, setSelected] = useState<BuildingType | null>(null);

  if (!castle) return (
    <div className="flex items-center justify-center h-64 text-stone-400">Carregando castelo…</div>
  );

  const res = resources ?? castle.resources;

  return (
    <div className="relative w-full bg-black" style={{userSelect:'none'}}>

      {/* HUD top bar */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
        style={{background:'linear-gradient(90deg,rgba(8,5,2,.96),rgba(22,14,5,.96))',borderBottom:'1px solid #b8860b55'}}>
        <span className="font-medieval text-yellow-500 text-base mr-1">🏰 Nível {castle.level}</span>
        <span className="text-amber-300">🌾 {Math.floor(res.food).toLocaleString()}</span>
        <span className="text-green-300">🪵 {Math.floor(res.wood).toLocaleString()}</span>
        <span className="text-stone-300">🪨 {Math.floor(res.stone).toLocaleString()}</span>
        <span className="text-sky-300">⚙️ {Math.floor(res.iron).toLocaleString()}</span>
        <span className="ml-auto text-stone-500 text-xs">[{castle.mapX},{castle.mapY}]</span>
      </div>

      {/* CENA ISOMÉTRICA */}
      <div className="relative overflow-hidden" style={{height:'74vh',minHeight:480,maxHeight:800}}>
        <svg viewBox="0 0 1160 820" preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full" style={{display:'block'}}>
          <defs>
            <linearGradient id="cvSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#08041a"/>
              <stop offset="40%" stopColor="#140c28"/>
              <stop offset="100%" stopColor="#28180a"/>
            </linearGradient>
            <linearGradient id="cvWallBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#181410"/><stop offset="100%" stopColor="#382e22"/>
            </linearGradient>
            <linearGradient id="cvWallLeft" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#201810"/><stop offset="100%" stopColor="#100e0a"/>
            </linearGradient>
            <linearGradient id="cvWallRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#201810"/><stop offset="100%" stopColor="#100e0a"/>
            </linearGradient>
            <linearGradient id="cvCarpet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b0018"/><stop offset="100%" stopColor="#4c000e"/>
            </linearGradient>
            <linearGradient id="cvGold"  x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f0d060">
                <animate attributeName="stop-color" values="#f0d060;#ffe090;#f0d060" dur="2.5s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor="#8a6010"/>
            </linearGradient>
            <linearGradient id="cvPillar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#18140e"/>
              <stop offset="45%" stopColor="#38322a"/>
              <stop offset="100%" stopColor="#18140e"/>
            </linearGradient>
            <radialGradient id="cvTorch1" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ff9030" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#ff6010" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvTorch2" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffb040" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#ff7020" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvWin1" cx="50%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#4080ff" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#2040a0" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvWin2" cx="50%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#ff6040" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#a02010" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvWin3" cx="50%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#60f060" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#108010" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvThroneAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0c030" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#a08020" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="cvVignette" cx="50%" cy="50%" r="70%">
              <stop offset="50%" stopColor="transparent"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0.85)"/>
            </radialGradient>
            <filter id="cvGlow">
              <feGaussianBlur stdDeviation="5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="cvSoftGlow">
              <feGaussianBlur stdDeviation="10" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <pattern id="cvFloor" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse"
              patternTransform="matrix(1,0.55,-1,0.55,580,195)">
              <rect width="80" height="40" fill="#484038"/>
              <rect x="0"  y="0"  width="39" height="19" fill="#444038" stroke="#2e2820" strokeWidth="0.8"/>
              <rect x="40" y="0"  width="39" height="19" fill="#504844" stroke="#2e2820" strokeWidth="0.8"/>
              <rect x="0"  y="20" width="39" height="19" fill="#504844" stroke="#2e2820" strokeWidth="0.8"/>
              <rect x="40" y="20" width="39" height="19" fill="#444038" stroke="#2e2820" strokeWidth="0.8"/>
            </pattern>
            <pattern id="cvWallPat" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
              <rect width="60" height="30" fill="#302820"/>
              <rect x="0" y="0" width="29" height="14" fill="#2c2418" stroke="#1e1810" strokeWidth="0.6"/>
              <rect x="30" y="0" width="29" height="14" fill="#342e24" stroke="#1e1810" strokeWidth="0.6"/>
              <rect x="0" y="15" width="29" height="14" fill="#342e24" stroke="#1e1810" strokeWidth="0.6"/>
              <rect x="30" y="15" width="29" height="14" fill="#2c2418" stroke="#1e1810" strokeWidth="0.6"/>
            </pattern>
          </defs>

          {/* ── 0. FUNDO / TECTO ──────────────────────────────────────── */}
          <rect x="0" y="0" width="1160" height="820" fill="url(#cvSky)"/>

          {/* Arcos góticos superiores */}
          {[140,300,460,580,700,860,1020].map((ax,i)=>(
            <g key={i}>
              <path d={`M${ax-55},0 Q${ax},90 ${ax+55},0`}
                stroke="#302820" strokeWidth="16" fill="none" opacity="0.7"/>
              <path d={`M${ax-50},0 Q${ax},85 ${ax+50},0`}
                stroke="#443820" strokeWidth="7" fill="none" opacity="0.45"/>
              <ellipse cx={ax} cy={88} rx={13} ry={8} fill="#504028" opacity="0.7"/>
              <ellipse cx={ax} cy={88} rx={9}  ry={5} fill="#8a7040"/>
            </g>
          ))}
          {/* nervuras do tecto */}
          {[130,290,450,710,870,1030].map((x,i)=>(
            <g key={i}>
              <line x1={x} y1={0} x2={580} y2={195} stroke="#201a12" strokeWidth="3" opacity="0.4"/>
            </g>
          ))}

          {/* ── 1. PAREDE TRASEIRA (gy=0) ────────────────────────────── */}
          <polygon
            points={`${pt(0,0,0)} ${pt(10,0,0)} ${pt(10,0,10)} ${pt(0,0,10)}`}
            fill="url(#cvWallBack)"/>
          {/* pedras horizontais */}
          {[0,1,2,3,4,5,6,7,8,9,10].map(gz=>{
            const a=iso(0,0,gz),b=iso(10,0,gz);
            return <line key={gz} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={gz%2===0?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.2)'} strokeWidth={gz%2===0?1.5:1}/>;
          })}
          {/* pedras verticais */}
          {[0,1,2,3,4,5,6,7,8,9,10].map(gx=>{
            const a=iso(gx,0,0),b=iso(gx,0,10);
            return <line key={gx} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>;
          })}
          {/* merlões no topo */}
          {Array.from({length:22},(_,i)=>{
            const gx=i*10/21;
            const a=iso(gx,0,10);
            return <rect key={i} x={a.x-5} y={a.y-20} width={a.x-iso(gx+0.3,0,10).x+10} height={18}
              fill="#302818" stroke="#201a10" strokeWidth="0.5" rx="1"/>;
          })}

          {/* VITRAIS na parede traseira */}
          {/* central azul */}
          <g>
            <polygon points={`${pt(4,0,3)} ${pt(5,0,3)} ${pt(5,0,9.2)} ${pt(4,0,9.2)}`} fill="#080e20"/>
            <polygon points={`${pt(4,0,3)} ${pt(5,0,3)} ${pt(5,0,9.2)} ${pt(4,0,9.2)}`} fill="url(#cvWin1)" opacity="0.9"/>
            {[4.33,4.67].map((gx,j)=>{const a=iso(gx,0,3),b=iso(gx,0,9.2);return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5a4820" strokeWidth="2"/>;}) }
            {[4.5,5.5,6.5,7.5,8.5].map((gz,j)=>{const a=iso(4,0,gz),b=iso(5,0,gz);return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5a4820" strokeWidth="2"/>;}) }
            <path d={`M${iso(4,0,8.8).x},${iso(4,0,8.8).y} Q${iso(4.5,0,9.6).x},${iso(4.5,0,9.6).y} ${iso(5,0,8.8).x},${iso(5,0,8.8).y}`} stroke="#5a4820" strokeWidth="3" fill="none"/>
            {/* raio de luz */}
            <polygon points={`${pt(4.1,0,7)} ${pt(4.9,0,7)} ${pt(6.5,2,1)} ${pt(3.5,2,1)}`}
              fill="url(#cvWin1)" opacity="0.13" style={{animation:'lightRay 4s ease-in-out infinite'}}/>
          </g>
          {/* esquerda vermelho */}
          <g>
            <polygon points={`${pt(1.5,0,4)} ${pt(2.5,0,4)} ${pt(2.5,0,9)} ${pt(1.5,0,9)}`} fill="#180608"/>
            <polygon points={`${pt(1.5,0,4)} ${pt(2.5,0,4)} ${pt(2.5,0,9)} ${pt(1.5,0,9)}`} fill="url(#cvWin2)" opacity="0.85"/>
            {[1.83,2.17].map((gx,j)=>{const a=iso(gx,0,4),b=iso(gx,0,9);return<line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#7a3020" strokeWidth="1.5"/>;}) }
            {[5,6,7,8].map((gz,j)=>{const a=iso(1.5,0,gz),b=iso(2.5,0,gz);return<line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#7a3020" strokeWidth="1.5"/>;}) }
            <path d={`M${iso(1.5,0,8.5).x},${iso(1.5,0,8.5).y} Q${iso(2,0,9.3).x},${iso(2,0,9.3).y} ${iso(2.5,0,8.5).x},${iso(2.5,0,8.5).y}`} stroke="#7a3020" strokeWidth="2.5" fill="none"/>
            <polygon points={`${pt(1.6,0,7)} ${pt(2.4,0,7)} ${pt(3.5,2,1)} ${pt(1.5,2,1)}`}
              fill="url(#cvWin2)" opacity="0.11" style={{animation:'lightRay 5s ease-in-out infinite 1s'}}/>
          </g>
          {/* direita verde */}
          <g>
            <polygon points={`${pt(7,0,4)} ${pt(8,0,4)} ${pt(8,0,9)} ${pt(7,0,9)}`} fill="#060e06"/>
            <polygon points={`${pt(7,0,4)} ${pt(8,0,4)} ${pt(8,0,9)} ${pt(7,0,9)}`} fill="url(#cvWin3)" opacity="0.85"/>
            {[7.33,7.67].map((gx,j)=>{const a=iso(gx,0,4),b=iso(gx,0,9);return<line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#186010" strokeWidth="1.5"/>;}) }
            {[5,6,7,8].map((gz,j)=>{const a=iso(7,0,gz),b=iso(8,0,gz);return<line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#186010" strokeWidth="1.5"/>;}) }
            <path d={`M${iso(7,0,8.5).x},${iso(7,0,8.5).y} Q${iso(7.5,0,9.3).x},${iso(7.5,0,9.3).y} ${iso(8,0,8.5).x},${iso(8,0,8.5).y}`} stroke="#186010" strokeWidth="2.5" fill="none"/>
            <polygon points={`${pt(7.1,0,7)} ${pt(7.9,0,7)} ${pt(9,2,1)} ${pt(6.5,2,1)}`}
              fill="url(#cvWin3)" opacity="0.09" style={{animation:'lightRay 6s ease-in-out infinite 0.5s'}}/>
          </g>

          {/* Estandartes na parede traseira */}
          {[{gx:0.2,col:'#8b0018'},{gx:2.8,col:'#003090'},{gx:5.5,col:'#8b0018'},{gx:7.8,col:'#003090'},{gx:9.8,col:'#8b0018'}].map((b,i)=>{
            const top=iso(b.gx,0,9.2),bot=iso(b.gx,0,6.5),wp=iso(b.gx+.75,0,9.2),wb=iso(b.gx+.75,0,6.5);
            return (
              <g key={i} style={{animation:`bannerSway 3.5s ease-in-out infinite ${i*0.55}s`,transformOrigin:`${top.x}px ${top.y}px`}}>
                <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke="#4a3810" strokeWidth="2.5"/>
                <polygon points={`${top.x},${top.y} ${wp.x},${wp.y} ${wb.x},${wb.y} ${bot.x},${bot.y}`}
                  fill={b.col} opacity="0.92"/>
                <text x={(top.x+wp.x)/2} y={(top.y+wb.y)/2+4} fontSize="12" textAnchor="middle" fill="#f0d060" fontWeight="bold">⚜</text>
                {[0,.2,.4,.6,.8,1].map((t,j)=>{
                  const fx=wb.x+(top.x-wb.x)*t,fy=wb.y+(top.y-wb.y)*t;
                  return <line key={j} x1={fx} y1={fy} x2={fx} y2={fy+8} stroke="#c09020" strokeWidth="1.5"/>;
                })}
              </g>
            );
          })}

          {/* ── 2. PAREDE ESQUERDA (gx=0) ────────────────────────────── */}
          <polygon points={`${pt(0,0,0)} ${pt(0,8,0)} ${pt(0,8,10)} ${pt(0,0,10)}`} fill="url(#cvWallLeft)"/>
          {[0,1.5,3,4.5,6,7.5].map(gz=>{const a=iso(0,0,gz),b=iso(0,8,gz);return<line key={gz} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.22)" strokeWidth="1.2"/>;}) }
          {[0,2,4,6,8].map(gy=>{const a=iso(0,gy,0),b=iso(0,gy,10);return<line key={gy} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>;}) }
          {/* Escada esquerda */}
          {[0,1,2,3,4].map(s=>(
            <g key={s}>
              <IsoBox gx={0} gy={7.4-s*0.65} gz={s*0.5}
                w={1.5} d={0.6} h={0.5}
                topFill="#504030" leftFill="#2a2018" rightFill="#3a3028"/>
            </g>
          ))}

          {/* ── 3. PAREDE DIREITA (gx=10) ────────────────────────────── */}
          <polygon points={`${pt(10,0,0)} ${pt(10,8,0)} ${pt(10,8,10)} ${pt(10,0,10)}`} fill="url(#cvWallRight)"/>
          {[0,1.5,3,4.5,6,7.5].map(gz=>{const a=iso(10,0,gz),b=iso(10,8,gz);return<line key={gz} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.22)" strokeWidth="1.2"/>;}) }
          {[0,2,4,6,8].map(gy=>{const a=iso(10,gy,0),b=iso(10,gy,10);return<line key={gy} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>;}) }

          {/* ── 4. CHÃO ───────────────────────────────────────────────── */}
          <polygon points={`${pt(0,0,0)} ${pt(10,0,0)} ${pt(10,8,0)} ${pt(0,8,0)}`} fill="url(#cvFloor)"/>
          {[0,1,2,3,4,5,6,7,8,9,10].map(gx=>{const a=iso(gx,0,0),b=iso(gx,8,0);return<line key={gx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>;}) }
          {[0,1,2,3,4,5,6,7,8].map(gy=>{const a=iso(0,gy,0),b=iso(10,gy,0);return<line key={gy} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>;}) }

          {/* TAPETE REAL */}
          <polygon points={`${pt(4.3,1,.05)} ${pt(5.7,1,.05)} ${pt(5.7,8,.05)} ${pt(4.3,8,.05)}`}
            fill="url(#cvCarpet)" opacity="0.93"/>
          {[4.3,5.7].map((gx,si)=>{const a=iso(gx,1,.06),b=iso(gx,8,.06);return<line key={si} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d4a820" strokeWidth="2"/>;}) }
          {[2,3.5,5,6.5].map((gy,j)=>{const c=iso(5,gy,.07);return<text key={j} x={c.x} y={c.y} fontSize="10" textAnchor="middle" fill="#e0c040" opacity="0.75">✦</text>;}) }

          {/* ── 5. PILARES ───────────────────────────────────────────── */}
          {[{gx:1,gy:2},{gx:1,gy:5},{gx:9,gy:2},{gx:9,gy:5}].map(({gx,gy},i)=>{
            const b=iso(gx,gy,0);
            return (
              <g key={i}>
                {/* halo de tocha */}
                <ellipse cx={b.x} cy={b.y-95} rx={55} ry={38}
                  fill={i%2===0?'url(#cvTorch1)':'url(#cvTorch2)'}
                  style={{animation:`torchGlow ${1.8+i*.3}s ease-in-out infinite ${i*.4}s`}}/>
                {/* base */}
                <IsoBox gx={gx-.3} gy={gy-.3} gz={0} w={.6} d={.6} h={.4}
                  topFill="#504038" leftFill="#302820" rightFill="#403830"/>
                {/* fuste */}
                <ellipse cx={b.x} cy={b.y-2}   rx={14} ry={7}  fill="#3c3428"/>
                <rect x={b.x-13} y={b.y-175} width={26} height={173} fill="url(#cvPillar)"/>
                {[-5,0,5].map((dx,j)=><line key={j} x1={b.x+dx} y1={b.y-2} x2={b.x+dx} y2={b.y-170} stroke="rgba(0,0,0,0.28)" strokeWidth="2"/>)}
                {/* capital */}
                <polygon points={`${b.x-22},${b.y-168} ${b.x+22},${b.y-171} ${b.x+27},${b.y-183} ${b.x-27},${b.y-180}`} fill="#5a5040"/>
                <polygon points={`${b.x-27},${b.y-180} ${b.x+27},${b.y-183} ${b.x+22},${b.y-196} ${b.x-22},${b.y-193}`} fill="#4a4030"/>
                {/* TOCHA */}
                <rect x={b.x+(i<2?14:-18)} y={b.y-120} width={6} height={22} fill="#5a3810" rx="1"/>
                <ellipse cx={b.x+(i<2?17:-15)} cy={b.y-120} rx={4} ry={3} fill="#8a5020"/>
                <g style={{animation:`flicker ${.7+i*.15}s ease-in-out infinite ${i*.18}s`}}>
                  <ellipse cx={b.x+(i<2?17:-15)} cy={b.y-128} rx={4.5} ry={8} fill="#ff8020" opacity="0.96"/>
                  <ellipse cx={b.x+(i<2?17:-15)} cy={b.y-134} rx={3}   ry={5} fill="#ffb040" opacity="0.82"/>
                  <ellipse cx={b.x+(i<2?17:-15)} cy={b.y-139} rx={1.5} ry={3} fill="#ffff80" opacity="0.6"/>
                </g>
              </g>
            );
          })}

          {/* ── 6. TRONO REAL ────────────────────────────────────────── */}
          {(()=>{
            const throne=iso(4.5,1.2,0);
            return (
              <g filter="url(#cvSoftGlow)" style={{animation:'isoPulse 3s ease-in-out infinite'}}>
                {/* aura dourada */}
                <ellipse cx={throne.x+20} cy={throne.y-65} rx={80} ry={55} fill="url(#cvThroneAura)" opacity="0.65"/>
                {/* degraus */}
                <IsoBox gx={4.1} gy={1}   gz={0}   w={1.8} d={1}   h={.45} topFill="#8a6020" leftFill="#5a4010" rightFill="#6a5018"/>
                <IsoBox gx={4.3} gy={1.1} gz={.45} w={1.4} d={.8}  h={.35} topFill="#a07030" leftFill="#704818" rightFill="#806020"/>
                {/* assento */}
                <IsoBox gx={4.5} gy={1.2} gz={.8}  w={1}   d={.85} h={.6}  topFill="#8b0018" leftFill="#5c0010" rightFill="#6c0014"/>
                {/* encosto */}
                <IsoBox gx={4.5} gy={1.2} gz={1.4} w={1}   d={.18} h={2.2} topFill="#a07030" leftFill="#704818" rightFill="#806020"/>
                {/* ornamentos dourados no encosto */}
                {[1.6,2.4,3.2].map((gz,j)=>{
                  const p=iso(4.5,1.2,gz);
                  return <ellipse key={j} cx={p.x+20} cy={p.y} rx={5} ry={3} fill="url(#cvGold)"/>;
                })}
                {/* braços do trono */}
                {[0,1].map(side=>{
                  const bgx=side===0?4.35:5.55;
                  return (
                    <g key={side}>
                      <IsoBox gx={bgx} gy={1.2} gz={.8} w={.15} d={.85} h={.75}
                        topFill="#a07030" leftFill="#704818" rightFill="#806020"/>
                    </g>
                  );
                })}
                {/* coroa no topo */}
                {(()=>{
                  const cn=iso(5,1.2,3.8);
                  return (
                    <g>
                      <polygon points={`${cn.x-15},${cn.y} ${cn.x+15},${cn.y-3} ${cn.x+12},${cn.y-16} ${cn.x+5},${cn.y-10} ${cn.x},${cn.y-20} ${cn.x-5},${cn.y-10} ${cn.x-12},${cn.y-16}`}
                        fill="url(#cvGold)" stroke="#a07010" strokeWidth="0.8"/>
                      {[-9,0,9].map((dx,j)=><circle key={j} cx={cn.x+dx} cy={cn.y-9} r={2.5}
                        fill={['#ff2040','#4080ff','#40c040'][j]}/>)}
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* ── 7. MESA DA SALA DE GUERRA ────────────────────────────── */}
          {(()=>{
            const dt=iso(2.2,5,.55);
            return (
              <g>
                <IsoBox gx={1.2} gy={4.5} gz={0} w={2} d={1.8} h={.55} topFill="#6a4820" leftFill="#3a2810" rightFill="#4a3818"/>
                {/* mapa */}
                <ellipse cx={dt.x} cy={dt.y-4} rx={33} ry={18} fill="#d4b870" opacity="0.9"/>
                <path d={`M${dt.x-22},${dt.y-8} L${dt.x+10},${dt.y-12} L${dt.x+24},${dt.y-2} L${dt.x},${dt.y+6} Z`}
                  fill="#4a8040" stroke="#2a5020" strokeWidth=".8" opacity=".8"/>
                <path d={`M${dt.x-20},${dt.y-6} Q${dt.x-8},${dt.y+2} ${dt.x-22},${dt.y-8}`} fill="#2060a0" opacity=".6"/>
                {[[-8,-4],[2,-8],[12,0],[-4,4]].map(([dx,dy],j)=>(
                  <g key={j}>
                    <circle cx={dt.x+dx} cy={dt.y+dy-8} r={3} fill={j%2===0?'#e02020':'#2040e0'}/>
                    <line x1={dt.x+dx} y1={dt.y+dy-5} x2={dt.x+dx} y2={dt.y+dy} stroke={j%2===0?'#e02020':'#2040e0'} strokeWidth="1.5"/>
                  </g>
                ))}
                {/* cadeiras */}
                {[{gx:1,gy:4.2},{gx:2.8,gy:4.2},{gx:1,gy:6},{gx:2.8,gy:6}].map((c,j)=>(
                  <IsoBox key={j} gx={c.gx} gy={c.gy} gz={0} w={.6} d={.6} h={.9}
                    topFill="#8b0018" leftFill="#5c0010" rightFill="#6c0014"/>
                ))}
              </g>
            );
          })()}

          {/* ── 8. ACADEMIA / BIBLIOTECA ─────────────────────────────── */}
          {(()=>{
            const desk=iso(7.7,5.1,.5);
            return (
              <g>
                {/* Estante */}
                <IsoBox gx={8.6} gy={5} gz={0} w={.15} d={1.4} h={3.2}
                  topFill="#8a5820" leftFill="#5a3810" rightFill="#6a4818"/>
                {[.85,1.7,2.55].map((gz,j)=>(
                  <IsoBox key={j} gx={8.6} gy={5} gz={gz} w={.15} d={1.4} h={.08}
                    topFill="#a07030" leftFill="#704818" rightFill="#805020"/>
                ))}
                {[5.1,5.35,5.6,5.85,6.1,6.35,6.6].map((gy,j)=>{
                  const bk=iso(8.6,gy,.4+Math.floor(j/3)*.9);
                  const cols=['#8b0018','#00308f','#1a6018','#8a5018','#602060','#184060','#605818'];
                  return <rect key={j} x={bk.x-3} y={bk.y-19} width={6} height={19} fill={cols[j]} rx="1" stroke="#1a0a04" strokeWidth=".5"/>;
                })}
                {/* Mesa */}
                <IsoBox gx={7.2} gy={4.8} gz={0} w={1} d={1.5} h={.5}
                  topFill="#8a6828" leftFill="#5a3810" rightFill="#6a4818"/>
                {/* pergaminho */}
                <ellipse cx={desk.x} cy={desk.y-4} rx={18} ry={10} fill="#e8d8a0"/>
                {[0,3.5,7].map((dy,j)=>(
                  <line key={j} x1={desk.x-13} y1={desk.y-9+dy} x2={desk.x+13} y2={desk.y-7+dy}
                    stroke="#5a3810" strokeWidth=".9" opacity=".6"/>
                ))}
                <ellipse cx={desk.x-15} cy={desk.y-4} rx={4} ry={9} fill="#c8a860"/>
                <ellipse cx={desk.x+15} cy={desk.y-4} rx={4} ry={9} fill="#c8a860"/>
                {/* tinteiro e pena */}
                <ellipse cx={desk.x+10} cy={desk.y-5} rx={5} ry={4} fill="#1a1a28"/>
                <path d={`M${desk.x+12},${desk.y-9} Q${desk.x+22},${desk.y-22} ${desk.x+16},${desk.y-32}`}
                  stroke="#e8e0c0" strokeWidth="1.5" fill="none"/>
              </g>
            );
          })()}

          {/* ── 9. ARSENAL (armaduras e espadas) ─────────────────────── */}
          {(()=>{
            const base=iso(4,3.5,0);
            return (
              <g>
                {/* suporte de armadura */}
                <IsoBox gx={3.8} gy={3.5} gz={0} w={1.4} d={1} h={.5}
                  topFill="#6a4820" leftFill="#3a2810" rightFill="#4a3818"/>
                {/* manequim */}
                <rect x={base.x-9}  y={base.y-55} width={18} height={30} fill="#5a6070" rx="4"/>
                <ellipse cx={base.x} cy={base.y-62} rx={10} ry={11} fill="#8a9098"/>
                {/* elmo */}
                <path d={`M${base.x-10},${base.y-62} Q${base.x-10},${base.y-77} ${base.x},${base.y-80} Q${base.x+10},${base.y-77} ${base.x+10},${base.y-62}`}
                  fill="#7a8898" stroke="#5a6878" strokeWidth="1"/>
                <rect x={base.x-7} y={base.y-71} width={14} height={3} fill="#4a5870" rx="1"/>
                {/* abdómen dourado */}
                <ellipse cx={base.x} cy={base.y-45} rx={7} ry={9} fill="#c09030" opacity=".8"/>
                {/* legs */}
                <rect x={base.x-8} y={base.y-28} width={7} height={26} fill="#5a6070" rx="2"/>
                <rect x={base.x+1} y={base.y-28} width={7} height={26} fill="#5a6070" rx="2"/>
                {/* escudo */}
                <ellipse cx={base.x-30} cy={base.y-48} rx={16} ry={21} fill="#1a3060"/>
                <path d={`M${base.x-30},${base.y-67} L${base.x-16},${base.y-43} L${base.x-30},${base.y-30} L${base.x-44},${base.y-43} Z`}
                  fill="none" stroke="#d4a820" strokeWidth="1.5"/>
                <text x={base.x-30} y={base.y-47} fontSize="9" textAnchor="middle" fill="#d4a820">⚜</text>
                {/* espada */}
                <line x1={base.x+28} y1={base.y-5}  x2={base.x+24} y2={base.y-95}
                  stroke="#8898a8" strokeWidth="4" strokeLinecap="round"/>
                <polygon points={`${base.x+21},${base.y-93} ${base.x+27},${base.y-93} ${base.x+24},${base.y-112}`} fill="#a0a8b8"/>
                <rect x={base.x+19} y={base.y-96} width={12} height={5} fill="#c09030" rx="1"/>
              </g>
            );
          })()}

          {/* ── 10. GUARDAS REAIS ─────────────────────────────────────── */}
          {[{gx:3.8,gy:2.2},{gx:6.2,gy:2.2}].map(({gx,gy},i)=>{
            const f=iso(gx,gy,0);
            const mx=i===1?-1:1; // espelha o segundo guarda
            const ox=i===1? f.x*2 :0;
            return (
              <g key={i} transform={i===1?`scale(-1,1) translate(${-ox},0)`:''}>
                <ellipse cx={f.x} cy={f.y-2} rx={14} ry={5} fill="rgba(0,0,0,0.4)"/>
                {/* pernas */}
                <rect x={f.x-8} y={f.y-36} width={7}  height={34} fill={mx>0?'#3a4858':'#3a5048'} rx="2"/>
                <rect x={f.x+1} y={f.y-36} width={7}  height={34} fill={mx>0?'#3a4858':'#3a5048'} rx="2"/>
                <ellipse cx={f.x-4}  cy={f.y-2} rx={7} ry={3} fill="#1a1410"/>
                <ellipse cx={f.x+5}  cy={f.y-2} rx={7} ry={3} fill="#1a1410"/>
                {/* torso */}
                <rect x={f.x-12} y={f.y-82} width={24} height={48} fill="#6a7888" rx="4"/>
                <ellipse cx={f.x}      cy={f.y-60} rx={8} ry={10} fill="#c09030" opacity=".8"/>
                {/* ombros */}
                <ellipse cx={f.x-14} cy={f.y-76} rx={7} ry={4} fill="#7a8898"/>
                <ellipse cx={f.x+14} cy={f.y-76} rx={7} ry={4} fill="#7a8898"/>
                {/* braços */}
                <rect x={f.x-18} y={f.y-74} width={6} height={30} fill="#5a6878" rx="2"/>
                <rect x={f.x+12} y={f.y-74} width={6} height={30} fill="#5a6878" rx="2"/>
                <ellipse cx={f.x-15} cy={f.y-43} rx={5} ry={4} fill="#3a3020"/>
                <ellipse cx={f.x+15} cy={f.y-43} rx={5} ry={4} fill="#3a3020"/>
                {/* cabeça */}
                <ellipse cx={f.x} cy={f.y-92} rx={10} ry={11} fill="#d4b890"/>
                {/* elmo */}
                <path d={`M${f.x-11},${f.y-92} Q${f.x-11},${f.y-108} ${f.x},${f.y-112} Q${f.x+11},${f.y-108} ${f.x+11},${f.y-92}`}
                  fill="#6a7888" stroke="#5a6878" strokeWidth="1"/>
                <rect x={f.x-8} y={f.y-101} width={16} height={4} fill="#4a5870" rx="1"/>
                {/* penacho */}
                <line x1={f.x} y1={f.y-112} x2={f.x-5} y2={f.y-132} stroke="#c00020" strokeWidth="3"/>
                {/* lança */}
                <line x1={f.x+20} y1={f.y-5}  x2={f.x+16} y2={f.y-145}
                  stroke="#8a6c40" strokeWidth="3"/>
                <polygon points={`${f.x+13},${f.y-143} ${f.x+19},${f.y-143} ${f.x+16},${f.y-162}`} fill="#a0b0c0"/>
                {/* espada no cinto */}
                <line x1={f.x-14} y1={f.y-55} x2={f.x-20} y2={f.y-12}
                  stroke="#8898a8" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
            );
          })}

          {/* ── 11. TOCHAS NA PAREDE TRASEIRA ────────────────────────── */}
          {[1,2.8,5,7.2,9].map((gx,i)=>{
            const p=iso(gx,0,5);
            return (
              <g key={i}>
                <ellipse cx={p.x} cy={p.y-32} rx={32} ry={24}
                  fill={i%2===0?'url(#cvTorch1)':'url(#cvTorch2)'}
                  style={{animation:`torchGlow ${1.4+i*.28}s ease-in-out infinite ${i*.32}s`}}/>
                <rect x={p.x-3} y={p.y-20} width={6} height={18} fill="#5a3810" rx="1"/>
                <ellipse cx={p.x} cy={p.y-20} rx={4} ry={3} fill="#8a5020"/>
                {/* suporte */}
                <line x1={p.x} y1={p.y-2}  x2={p.x}   y2={p.y+10} stroke="#4a3010" strokeWidth="2"/>
                <line x1={p.x} y1={p.y+10} x2={p.x+10} y2={p.y+5}  stroke="#4a3010" strokeWidth="2"/>
                <g style={{animation:`flicker ${.65+i*.13}s ease-in-out infinite ${i*.2}s`}}>
                  <ellipse cx={p.x} cy={p.y-27} rx={4.5} ry={8}  fill="#ff8020" opacity=".96"/>
                  <ellipse cx={p.x} cy={p.y-33} rx={3}   ry={5}  fill="#ffb040" opacity=".82"/>
                  <ellipse cx={p.x} cy={p.y-38} rx={1.5} ry={3}  fill="#ffff80" opacity=".65"/>
                </g>
              </g>
            );
          })}

          {/* ── 12. CANDELABRO CENTRAL ────────────────────────────────── */}
          {(()=>{
            const c=iso(5,4,4);
            return (
              <g>
                {[-22,-8,8,22].map((dx,i)=>(
                  <line key={i} x1={c.x+dx} y1={0} x2={c.x+dx/4} y2={c.y}
                    stroke="#8a6820" strokeWidth="1.5" opacity=".55"/>
                ))}
                <ellipse cx={c.x} cy={c.y}    rx={42} ry={15} fill="none" stroke="#8a6820" strokeWidth="3"/>
                <ellipse cx={c.x} cy={c.y}    rx={42} ry={15} fill="none" stroke="#c09030" strokeWidth={1}/>
                {[-34,-18,0,18,34].map((dx,j)=>(
                  <g key={j}>
                    <rect x={c.x+dx-3} y={c.y} width={6} height={11} fill="#e8e0d0" rx="1"/>
                    <g style={{animation:`flicker ${.55+j*.14}s ease-in-out infinite ${j*.16}s`}}>
                      <ellipse cx={c.x+dx} cy={c.y-1} rx={3} ry={5.5} fill="#ff8030" opacity=".9"/>
                      <ellipse cx={c.x+dx} cy={c.y-5} rx={1.5} ry={3.5} fill="#ffb050" opacity=".8"/>
                    </g>
                  </g>
                ))}
              </g>
            );
          })()}

          {/* ── 13. ZONAS CLICÁVEIS (edifícios) ─────────────────────── */}
          {ZONES.map(({type,label,icon})=>{
            const [cx,cy]=CENTRES[type];
            const isSel=selected===type;
            return (
              <g key={type} onClick={()=>setSelected(isSel?null:type)} style={{cursor:'pointer'}}>
                <ellipse cx={cx} cy={cy-22} rx={40} ry={22}
                  fill={isSel?'rgba(240,200,30,0.2)':'rgba(0,0,0,0)'}
                  stroke={isSel?'#f0c820':'rgba(240,200,30,0.4)'}
                  strokeWidth={isSel?2:1.2} strokeDasharray={isSel?'none':'5,4'}
                  style={{filter:isSel?'drop-shadow(0 0 8px #f0c820)':'none',transition:'all .2s'}}/>
                <text x={cx} y={cy-34} fontSize="19" textAnchor="middle">{icon}</text>
                <text x={cx} y={cy-12} fontSize="9.5" textAnchor="middle"
                  fill={isSel?'#f0d040':'#d4b870'}
                  stroke="rgba(0,0,0,.85)" strokeWidth="3" paintOrder="stroke"
                  fontWeight="600" fontFamily="Cinzel,serif">{label}</text>
                {isSel&&(
                  <ellipse cx={cx} cy={cy-22} rx={40} ry={22}
                    fill="none" stroke="#f0d040" strokeWidth="1.5"
                    strokeDasharray="3,3" opacity=".8"
                    style={{animation:'isoPulse 1.5s ease-in-out infinite'}}/>
                )}
              </g>
            );
          })}

          {/* vinheta de bordas */}
          <rect x="0" y="0" width="1160" height="820" fill="url(#cvVignette)" pointerEvents="none"/>

        </svg>

        {/* painel lateral */}
        {selected&&<BuildingPanel type={selected} onClose={()=>setSelected(null)}/>}

        {/* legenda */}
        {!selected&&(
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-4 py-1.5 rounded-full pointer-events-none"
            style={{background:'rgba(0,0,0,.6)',color:'#c8a860',border:'1px solid rgba(184,134,11,.35)'}}>
            Clique em um edifício para gerenciar
          </div>
        )}
      </div>
    </div>
  );
};

