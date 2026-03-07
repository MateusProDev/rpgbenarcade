import React, { useState } from 'react';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ─── Posições dos edifícios na cena (% da largura/altura do container) ─────── */
interface BuildingSpot {
  type: BuildingType;
  label: string;
  icon: string;
  x: number; // % left
  y: number; // % top
  inside: boolean; // dentro ou fora da muralha
}

const SPOTS: BuildingSpot[] = [
  // Dentro da muralha
  { type: 'barracks',  label: 'Quartel',     icon: '⚔️',  x: 44, y: 52, inside: true },
  { type: 'academy',   label: 'Academia',    icon: '📚',  x: 56, y: 52, inside: true },
  // Fora — esquerda (recursos)
  { type: 'farm',      label: 'Fazenda',     icon: '🌾',  x: 10, y: 72, inside: false },
  { type: 'sawmill',   label: 'Serraria',    icon: '🪵',  x: 22, y: 68, inside: false },
  { type: 'warehouse', label: 'Armazém',     icon: '🏚️',  x: 10, y: 57, inside: false },
  // Fora — direita (extração)
  { type: 'quarry',    label: 'Pedreira',    icon: '🪨',  x: 78, y: 68, inside: false },
  { type: 'ironMine',  label: 'Mina de Ferro', icon: '⚙️', x: 88, y: 57, inside: false },
];

/* ─── Componente de uma árvore SVG ──────────────────────────────────────── */
function Tree({ x, y, h, color }: { x: number; y: number; h: number; color: string }) {
  const w = h * 0.55;
  return (
    <g>
      <rect x={x - 2} y={y} width={4} height={h * 0.35} fill="#5c3d1e" />
      <polygon points={`${x},${y - h * 0.7} ${x - w / 2},${y + h * 0.1} ${x + w / 2},${y + h * 0.1}`} fill={color} />
      <polygon points={`${x},${y - h} ${x - w * 0.4},${y - h * 0.4} ${x + w * 0.4},${y - h * 0.4}`} fill={color} opacity={0.85} />
    </g>
  );
}

/* ─── Componente de montanha SVG ─────────────────────────────────────────── */
function Mountain({ x, y, w, h, fill, snowH }: { x: number; y: number; w: number; h: number; fill: string; snowH?: number }) {
  const peak = snowH ?? h * 0.18;
  return (
    <g>
      <polygon points={`${x},${y} ${x + w / 2},${y - h} ${x + w},${y}`} fill={fill} />
      {/* neve no topo */}
      <polygon
        points={`${x + w / 2},${y - h} ${x + w / 2 - peak * 1.2},${y - h + peak * 2} ${x + w / 2 + peak * 1.2},${y - h + peak * 2}`}
        fill="rgba(255,255,255,0.85)"
      />
    </g>
  );
}

/* ─── Painel lateral de edifício ─────────────────────────────────────────── */
function BuildingPanel({ type, onClose }: { type: BuildingType; onClose: () => void }) {
  return (
    <div
      className="absolute top-0 right-0 h-full w-72 flex flex-col z-30"
      style={{ background: 'linear-gradient(135deg,rgba(20,14,5,0.97) 0%,rgba(36,24,8,0.97) 100%)', borderLeft: '2px solid #b8860b' }}
    >
      <div className="flex items-center justify-between p-3 border-b border-castle-gold/40">
        <span className="font-medieval text-castle-gold text-lg">Edifício</span>
        <button onClick={onClose} className="text-parchment-400 hover:text-white text-xl leading-none px-1">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <BuildingCard buildingType={type} />
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export const CastleView: React.FC = () => {
  const castle    = useGameStore((s) => s.castle);
  const resources = useResources();
  const [selected, setSelected] = useState<BuildingType | null>(null);

  if (!castle) return (
    <div className="flex items-center justify-center h-64 text-parchment-400">Carregando castelo…</div>
  );

  const res = resources ?? castle.resources;

  return (
    <div className="relative w-full select-none" style={{ fontFamily: 'inherit' }}>

      {/* ── HUD — Recursos ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
        style={{ background: 'linear-gradient(90deg,rgba(10,8,4,0.92) 0%,rgba(26,18,6,0.92) 100%)', borderBottom: '1px solid #b8860b55' }}
      >
        <span className="font-medieval text-castle-gold text-base mr-2">🏰 Nível {castle.level}</span>
        <span className="text-amber-300">🌾 {Math.floor(res.food).toLocaleString()}</span>
        <span className="text-green-300">🪵 {Math.floor(res.wood).toLocaleString()}</span>
        <span className="text-stone-300">🪨 {Math.floor(res.stone).toLocaleString()}</span>
        <span className="text-blue-300">⚙️ {Math.floor(res.iron).toLocaleString()}</span>
        <span className="ml-auto text-parchment-500 text-xs">[{castle.mapX}, {castle.mapY}]</span>
      </div>

      {/* ── Cena principal ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ height: '72vh', minHeight: 460, maxHeight: 760 }}
      >

        {/* == CAMADA 0 — Céu == */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg,#0d1b3e 0%,#1a3a6b 18%,#3b6abf 38%,#c97c3a 62%,#e8a24b 80%,#f5c97a 100%)',
          }}
        />

        {/* == CAMADA 1 — Nuvens == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          {[
            { cx: 120, cy: 80, rx: 80, ry: 28 },
            { cx: 340, cy: 60, rx: 110, ry: 32 },
            { cx: 700, cy: 95, rx: 90, ry: 26 },
            { cx: 980, cy: 70, rx: 120, ry: 34 },
          ].map((c, i) => (
            <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="rgba(255,255,255,0.18)" />
          ))}
          {/* nuvens escuras de tempestade */}
          <ellipse cx={500} cy={55} rx={160} ry={38} fill="rgba(80,80,100,0.22)" />
          <ellipse cx={850} cy={40} rx={140} ry={30} fill="rgba(80,80,100,0.18)" />
        </svg>

        {/* == CAMADA 2 — Montanhas fundas (azuladas) == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          <Mountain x={0}   y={380} w={280} h={260} fill="#1e2d52" snowH={42} />
          <Mountain x={180} y={390} w={320} h={300} fill="#1a2848" snowH={50} />
          <Mountain x={450} y={370} w={260} h={270} fill="#1e2d52" snowH={38} />
          <Mountain x={680} y={380} w={300} h={280} fill="#1a2848" snowH={46} />
          <Mountain x={920} y={375} w={290} h={265} fill="#1e2d52" snowH={40} />
          {/* CACHOEIRA principal — rampa esquerda */}
          <defs>
            <linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8d8ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7ab6e8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* trilha da cachoeira */}
          <path d="M310 130 Q320 200 305 280 Q295 340 310 390" stroke="url(#wfGrad)" strokeWidth="14" fill="none" opacity="0.7" />
          <path d="M310 130 Q318 200 302 280 Q292 340 308 390" stroke="white" strokeWidth="3" fill="none" opacity="0.5" />
          {/* névoa da cachoeira */}
          <ellipse cx={310} cy={395} rx={30} ry={12} fill="rgba(180,210,255,0.35)" />
          {/* detalhe: streams laterais */}
          <path d="M314 160 Q325 220 312 290" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
        </svg>

        {/* == CAMADA 3 — Montanhas médias (mais escuras) == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          <Mountain x={-40}  y={450} w={240} h={200} fill="#2a3d28" />
          <Mountain x={160}  y={460} w={200} h={180} fill="#243522" />
          <Mountain x={900}  y={445} w={250} h={210} fill="#2a3d28" />
          <Mountain x={1050} y={455} w={220} h={195} fill="#243522" />
        </svg>

        {/* == CAMADA 4 — Floresta de fundo (fileiras de árvores) == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          {/* Fila traseira — árvores escuras/distantes */}
          {Array.from({ length: 28 }, (_, i) => (
            <Tree key={`bt${i}`} x={i * 44 + 10} y={480} h={90} color="#1e3520" />
          ))}
          {/* Fila do meio */}
          {Array.from({ length: 22 }, (_, i) => (
            <Tree key={`mt${i}`} x={i * 55 + 20} y={510} h={75} color="#2a4a28" />
          ))}
          {/* Tufos de árvores esquerda */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Tree key={`lt${i}`} x={30 + i * 30} y={530} h={65} color="#2e5230" />
          ))}
          {/* Tufos de árvores direita */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Tree key={`rt${i}`} x={1060 + i * 30} y={530} h={65} color="#2e5230" />
          ))}
        </svg>

        {/* == CAMADA 5 — Rio + Ponte == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a6495" />
              <stop offset="100%" stopColor="#1a3d5c" />
            </linearGradient>
            <linearGradient id="riverShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(100,180,255,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* leito do rio */}
          <path d="M0 590 Q200 575 350 580 Q500 585 600 578 Q700 571 900 580 Q1050 587 1200 578 L1200 630 Q1000 618 800 626 Q600 634 400 622 Q200 614 0 625 Z" fill="url(#riverGrad)" />
          {/* reflexo */}
          <path d="M0 590 Q200 575 350 580 Q500 585 600 578 Q700 571 900 580 Q1050 587 1200 578 L1200 598 Q1000 587 800 595 Q600 603 400 591 Q200 583 0 593 Z" fill="url(#riverShine)" />
          {/* ondas */}
          {[80, 220, 410, 600, 790, 980, 1120].map((x, i) => (
            <path key={i} d={`M${x} ${595 + (i % 2) * 8} Q${x + 20} ${590 + (i % 2) * 8} ${x + 40} ${595 + (i % 2) * 8}`}
              stroke="rgba(180,220,255,0.4)" strokeWidth="1.5" fill="none" />
          ))}
          {/* PONTE principal — pedra, 3 arcos */}
          <g>
            {/* base/tabuleiro */}
            <rect x={520} y={570} width={160} height={22} fill="#7a6040" rx="2" />
            {/* parapeitos */}
            <rect x={518} y={563} width={164} height={10} fill="#8a7050" rx="2" />
            {/* merlões espaçados */}
            {[522, 534, 546, 558, 570, 582, 594, 606, 618, 630, 642, 654, 666].map((bx, bi) => (
              <rect key={bi} x={bx} y={556} width={8} height={8} fill="#9a8060" rx="1" />
            ))}
            {/* arcos da ponte */}
            <path d="M522 592 Q560 575 598 592" stroke="#5a4830" strokeWidth="4" fill="none" />
            <path d="M598 592 Q636 575 674 592" stroke="#5a4830" strokeWidth="4" fill="none" />
            {/* pilares */}
            <rect x={595} y={580} width={8} height={30} fill="#6a5840" />
          </g>
          {/* PONTE LATERAL (fora — passagem recursos) */}
          <g>
            <rect x={180} y={572} width={90} height={18} fill="#6a5030" rx="2" />
            <rect x={178} y={566} width={94} height={8} fill="#7a6040" rx="2" />
            {[182, 192, 202, 212, 222, 232, 242, 252, 262].map((bx, bi) => (
              <rect key={bi} x={bx} y={560} width={6} height={7} fill="#8a7050" rx="1" />
            ))}
            <path d="M182 590 Q225 576 268 590" stroke="#4a3820" strokeWidth="3" fill="none" />
          </g>
        </svg>

        {/* == CAMADA 6 — Muralha + Torres == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4a3828" />
              <stop offset="50%" stopColor="#5a4838" />
              <stop offset="100%" stopColor="#4a3828" />
            </linearGradient>
            <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6a5848" />
              <stop offset="100%" stopColor="#3a2818" />
            </linearGradient>
          </defs>

          {/* == Parede TRASEIRA da muralha (mais alta) == */}
          <rect x={350} y={390} width={500} height={200} fill="url(#wallGrad)" />
          {/* ameias topo traseiro */}
          {Array.from({ length: 33 }, (_, i) => (
            <rect key={`bt${i}`} x={350 + i * 15} y={382} width={10} height={14} fill="#5a4838" />
          ))}
          {/* textura de pedra */}
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 17 }, (_, col) => (
              <rect key={`s${row}-${col}`}
                x={350 + col * 30 + (row % 2 === 0 ? 0 : 15)}
                y={395 + row * 25}
                width={28} height={22}
                fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            ))
          )}
          {/* sombra interna */}
          <rect x={350} y={390} width={500} height={30} fill="rgba(0,0,0,0.25)" />

          {/* == Parede LATERAL ESQUERDA == */}
          <polygon points="350,390 350,590 250,610 250,450" fill="#4a3828" />
          {/* ameias lateral esquerda */}
          {Array.from({ length: 7 }, (_, i) => (
            <polygon key={`le${i}`}
              points={`${250 + i * 14},${450 - i * 5} ${250 + i * 14 + 10},${450 - i * 5} ${250 + i * 14 + 10},${450 - i * 5 - 13} ${250 + i * 14},${450 - i * 5 - 13}`}
              fill="#5a4838" />
          ))}

          {/* == Parede LATERAL DIREITA == */}
          <polygon points="850,390 850,590 950,610 950,450" fill="#4a3828" />
          {Array.from({ length: 7 }, (_, i) => (
            <polygon key={`re${i}`}
              points={`${950 - i * 14},${450 - i * 5} ${950 - i * 14 + 10},${450 - i * 5} ${950 - i * 14 + 10},${450 - i * 5 - 13} ${950 - i * 14},${450 - i * 5 - 13}`}
              fill="#5a4838" />
          ))}

          {/* == Parede FRONTAL == */}
          <rect x={250} y={545} width={700} height={55} fill="url(#wallShade)" />
          {/* ameias frente */}
          {Array.from({ length: 46 }, (_, i) => {
            if (i >= 19 && i <= 26) return null; // espaço do portão
            return <rect key={`wm${i}`} x={250 + i * 15} y={537} width={10} height={14} fill="#6a5848" />;
          })}
          {/* textura pedra frente */}
          {Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 23 }, (_, col) => (
              <rect key={`fw${row}-${col}`}
                x={250 + col * 30 + (row % 2 === 0 ? 0 : 15)}
                y={554 + row * 18}
                width={28} height={16}
                fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.7" />
            ))
          )}

          {/* == TORRES DO CANTO == */}
          {/* Torre esquerda-frente */}
          <rect x={230} y={490} width={55} height={110} fill="url(#wallShade)" />
          <rect x={225} y={480} width={65} height={15} fill="#5a4838" />
          {[227, 239, 251, 263, 275, 279].map((tx, ti) => (
            <rect key={ti} x={tx} y={468} width={9} height={14} fill="#6a5848" />
          ))}
          <polygon points="258,390 230,490 286,490" fill="#4a3828" />
          {/* janelas torre */}
          <rect x={250} y={510} width={12} height={18} fill="#1a0e06" rx="1" />
          <rect x={250} y={538} width={12} height={18} fill="#1a0e06" rx="1" />

          {/* Torre direita-frente */}
          <rect x={915} y={490} width={55} height={110} fill="url(#wallShade)" />
          <rect x={910} y={480} width={65} height={15} fill="#5a4838" />
          {[912, 924, 936, 948, 960, 964].map((tx, ti) => (
            <rect key={ti} x={tx} y={468} width={9} height={14} fill="#6a5848" />
          ))}
          <polygon points="942,390 915,490 970,490" fill="#4a3828" />
          <rect x={938} y={510} width={12} height={18} fill="#1a0e06" rx="1" />
          <rect x={938} y={538} width={12} height={18} fill="#1a0e06" rx="1" />

          {/* Torre esquerda-traseira */}
          <rect x={340} y={340} width={48} height={80} fill="#3a2818" />
          <rect x={336} y={330} width={56} height={13} fill="#4a3828" />
          {[338, 348, 358, 368, 378, 382].map((tx, ti) => (
            <rect key={ti} x={tx} y={319} width={8} height={13} fill="#5a4838" />
          ))}
          <rect x={355} y={355} width={10} height={16} fill="#1a0e06" rx="1" />

          {/* Torre direita-traseira */}
          <rect x={812} y={340} width={48} height={80} fill="#3a2818" />
          <rect x={808} y={330} width={56} height={13} fill="#4a3828" />
          {[810, 820, 830, 840, 850, 854].map((tx, ti) => (
            <rect key={ti} x={tx} y={319} width={8} height={13} fill="#5a4838" />
          ))}
          <rect x={828} y={355} width={10} height={16} fill="#1a0e06" rx="1" />

          {/* == PORTÃO PRINCIPAL == */}
          {/* Arco do portão */}
          <rect x={548} y={492} width={104} height={68} fill="#2a1c0e" />
          <path d="M548 492 Q600 455 652 492" fill="#3a2818" />
          {/* gradil/portcullis */}
          {[555, 569, 583, 597, 611, 625, 639].map((gx, gi) => (
            <rect key={gi} x={gx} y={494} width={4} height={62} fill="#5a4020" opacity="0.7" />
          ))}
          {[504, 518, 532, 546].map((gy, gi) => (
            <rect key={gi} x={549} y={gy} width={102} height={3} fill="#5a4020" opacity="0.7" />
          ))}
          {/* brasão sobre o portão */}
          <polygon points="600,442 613,455 610,472 600,478 590,472 587,455" fill="#8a6020" stroke="#b8860b" strokeWidth="1.5" />
          <text x={598} y={467} fontSize="11" textAnchor="middle" fill="#f0d080">⚜</text>
          {/* Torres do portão */}
          <rect x={490} y={460} width={58} height={100} fill="#3a2818" />
          <rect x={652} y={460} width={58} height={100} fill="#3a2818" />
          {[492, 504, 516, 528, 540].map((tx, ti) => (
            <rect key={ti} x={tx} y={448} width={9} height={14} fill="#5a4838" />
          ))}
          {[654, 666, 678, 690, 702].map((tx, ti) => (
            <rect key={ti} x={tx} y={448} width={9} height={14} fill="#5a4838" />
          ))}
          {/* janelas torres do portão */}
          <rect x={508} y={480} width={11} height={20} fill="#1a0e06" rx="1" />
          <rect x={671} y={480} width={11} height={20} fill="#1a0e06" rx="1" />

          {/* == TORRE CENTRAL / KEEP == */}
          <rect x={565} y={310} width={70} height={190} fill="#3a2818" />
          {/* detalhes keep */}
          {Array.from({ length: 6 }, (_, row) =>
            Array.from({ length: 2 }, (_, col) => (
              <rect key={`k${row}-${col}`}
                x={570 + col * 35}
                y={320 + row * 28}
                width={8} height={14}
                fill="#1a0e06" rx="1" />
            ))
          )}
          {/* topo keep com ameias */}
          <rect x={558} y={300} width={84} height={15} fill="#4a3828" />
          {[560, 572, 584, 596, 608, 620, 626].map((tx, ti) => (
            <rect key={ti} x={tx} y={287} width={9} height={15} fill="#5a4838" />
          ))}
          {/* bandeira no keep */}
          <line x1={600} y1={287} x2={600} y2={250} stroke="#6a5030" strokeWidth="2.5" />
          <polygon points="600,250 630,260 600,270" fill="#c00020" opacity="0.9" />
          <polygon points="600,250 630,260 600,270" fill="none" stroke="#ff3050" strokeWidth="0.7" />

          {/* == Estrada de terra dentro da muralha == */}
          <ellipse cx={600} cy={530} rx={160} ry={18} fill="rgba(100,75,40,0.4)" />
        </svg>

        {/* == CAMADA 7 — Chão (grama, terra) == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          {/* grama fora muralha */}
          <rect x={0} y={600} width={1200} height={120} fill="#2d4a20" />
          <rect x={0} y={600} width={1200} height={30} fill="#3a5e28" />
          {/* texturas de grama */}
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1={i * 20 + 5} y1={604} x2={i * 20 + 10} y2={596} stroke="#4a7030" strokeWidth="1.5" />
          ))}
          {/* caminho de terra para o portão */}
          <path d="M540 720 Q570 670 580 600 Q590 570 600 565 Q610 570 620 600 Q630 670 660 720 Z" fill="#8a6030" opacity="0.7" />
          {/* grama interna */}
          <ellipse cx={600} cy={510} rx={210} ry={55} fill="#2a4018" opacity="0.7" />
        </svg>

        {/* == CAMADA 8 — Árvores frontais (mais vívidas) == */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
          {/* clusters de árvores fora da muralha */}
          {[55, 100, 145, 185].map((x, i) => (
            <Tree key={`fl${i}`} x={x} y={608} h={88} color={i % 2 === 0 ? '#2e5228' : '#386030'} />
          ))}
          {[1015, 1055, 1100, 1145].map((x, i) => (
            <Tree key={`fr${i}`} x={x} y={608} h={88} color={i % 2 === 0 ? '#2e5228' : '#386030'} />
          ))}
          {/* arbustos variegados */}
          {[70, 130, 200, 1000, 1070, 1140].map((x, i) => (
            <ellipse key={`sh${i}`} cx={x} cy={615} rx={18} ry={10} fill="#3a6025" />
          ))}
        </svg>

        {/* == CAMADA 9 — Edifícios clicáveis (posicionados na cena) == */}
        {SPOTS.map((spot) => {
          const isSelected = selected === spot.type;
          return (
            <button
              key={spot.type}
              onClick={() => setSelected(isSelected ? null : spot.type)}
              className="absolute flex flex-col items-center gap-0.5 group cursor-pointer"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%,-50%)',
                zIndex: 20,
              }}
            >
              {/* sombra no chão */}
              <div
                className="absolute -bottom-1 rounded-full opacity-40"
                style={{ width: 44, height: 10, background: 'radial-gradient(#000,transparent)', left: '50%', transform: 'translateX(-50%)' }}
              />
              {/* prédio */}
              <div
                className="flex items-center justify-center rounded-lg transition-all duration-200"
                style={{
                  width: spot.inside ? 54 : 48,
                  height: spot.inside ? 54 : 48,
                  background: isSelected
                    ? 'linear-gradient(135deg,#b8860b,#7a5010)'
                    : spot.inside
                      ? 'linear-gradient(135deg,#4a3418,#2a1e10)'
                      : 'linear-gradient(135deg,#3a4a28,#222e18)',
                  border: isSelected ? '2px solid #f0d080' : '1.5px solid rgba(180,150,80,0.5)',
                  boxShadow: isSelected ? '0 0 16px #f0d08066' : '0 4px 12px rgba(0,0,0,0.6)',
                  fontSize: spot.inside ? 26 : 22,
                }}
              >
                {spot.icon}
              </div>
              {/* tooltip label */}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.75)', color: '#f0d080', fontSize: 10 }}
              >
                {spot.label}
              </span>
              {/* indicador selecionado */}
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-castle-gold animate-pulse mt-0.5" />
              )}
            </button>
          );
        })}

        {/* == CAMADA 10 — Painel lateral do edifício == */}
        {selected && (
          <BuildingPanel type={selected} onClose={() => setSelected(null)} />
        )}

        {/* == Legenda de instruções == */}
        {!selected && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#c8a860', border: '1px solid rgba(184,134,11,0.3)' }}
          >
            Clique em um edifício para gerenciar
          </div>
        )}
      </div>
    </div>
  );
};

