/**
 * CastleView — Mapa Isométrico Medieval Premium
 *
 * Mapa ilustrado em estilo hand-painted de jogo de estratégia medieval.
 * Câmera isométrica a ~35°, visão ampla da cidade inteira.
 *
 * Layout (topo → base):
 *   Colina do Castelo → elevação máxima, plataforma de pedra
 *   Distritos da Cidade → fundações para edifícios futuros
 *   Porto Medieval → costa, docas, barcos
 *   Muralhas Defensivas → cercam toda a cidade
 */
import React, { useState } from 'react';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ─────────────────────────────────────────────────────────────────────────────
   SLOTS DE FUNDAÇÃO — coordenadas no SVG (cx, cy = centro do slot)
───────────────────────────────────────────────────────────────────────────── */
interface Slot { type: BuildingType; label: string; icon: string; cx: number; cy: number; rx: number; ry: number; }
const SLOTS: Slot[] = [
  { type: 'sawmill',   label: 'Serraria',      icon: '🪵', cx: 620,  cy: 430, rx: 90, ry: 55 },
  { type: 'ironMine',  label: 'Mina de Ferro', icon: '⚙️', cx: 1180, cy: 430, rx: 90, ry: 55 },
  { type: 'farm',      label: 'Fazenda',        icon: '🌾', cx: 460,  cy: 620, rx: 100,ry: 62 },
  { type: 'quarry',    label: 'Pedreira',       icon: '🪨', cx: 760,  cy: 660, rx: 90, ry: 55 },
  { type: 'barracks',  label: 'Quartel',        icon: '⚔️', cx: 1080, cy: 595, rx: 100,ry: 62 },
  { type: 'warehouse', label: 'Armazém',        icon: '🏚️',cx: 1280, cy: 620, rx: 90, ry: 55 },
  { type: 'academy',   label: 'Academia',       icon: '📚', cx: 900,  cy: 740, rx: 95, ry: 58 },
];

/* ─── Árvore Cipreste ───────────────────────────────────────────────────── */
function CypressTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const h = 110 * s, w = 26 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={0} rx={w * 0.7} ry={9 * s} fill="rgba(0,0,0,0.18)" />
      <polygon points={`0,${-h} ${-w},${-h * 0.22} 0,${-h * 0.12} ${w},${-h * 0.22}`}
        fill="url(#gCypTop)" />
      <polygon points={`0,${-h * 0.62} ${-w * 1.15},${-h * 0.08} 0,${-h * 0.04} ${w * 1.15},${-h * 0.08}`}
        fill="url(#gCypMid)" />
      <polygon points={`0,${-h * 0.32} ${-w * 1.3},${h * 0.04} 0,${h * 0.08} ${w * 1.3},${h * 0.04}`}
        fill="url(#gCypBot)" />
      <rect x={-4 * s} y={-h * 0.18} width={8 * s} height={h * 0.18} fill="#5c3a1e" rx={2} />
    </g>
  );
}

/* ─── Árvore Carvalho ───────────────────────────────────────────────────── */
function OakTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const r = 44 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={8 * s} rx={r * 0.85} ry={10 * s} fill="rgba(0,0,0,0.20)" />
      <rect x={-7 * s} y={-r * 0.5} width={14 * s} height={r * 0.6} fill="#5c3a1e" rx={3} />
      <circle cx={-14 * s} cy={-r * 0.55} r={r * 0.72} fill="#235a1e" />
      <circle cx={14 * s}  cy={-r * 0.6}  r={r * 0.68} fill="#2a6423" />
      <circle cx={0}       cy={-r * 0.78} r={r * 0.78} fill="url(#gOak)" />
      <circle cx={-8 * s}  cy={-r * 0.55} r={r * 0.32} fill="#3a7a2a" opacity={0.6} />
    </g>
  );
}

/* ─── Arbusto ───────────────────────────────────────────────────────────── */
function Bush({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={5 * s} rx={22 * s} ry={7 * s} fill="rgba(0,0,0,0.15)" />
      <circle cx={-12 * s} cy={-8 * s} r={14 * s} fill="#2a5e1a" />
      <circle cx={10 * s}  cy={-9 * s} r={13 * s} fill="#305f1e" />
      <circle cx={0}       cy={-14 * s} r={15 * s} fill="#3a7228" />
      <circle cx={-6 * s}  cy={-6 * s} r={7 * s}  fill="#4a8a32" opacity={0.55} />
    </g>
  );
}

/* ─── Torre Defensiva ────────────────────────────────────────────────────── */
function Tower({ x, y, s = 1, lit = false }: { x: number; y: number; s?: number; lit?: boolean }) {
  const w = 54 * s, h = 90 * s, rw = 60 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* sombra */}
      <ellipse cx={6 * s} cy={6 * s} rx={rw * 0.7} ry={20 * s} fill="rgba(0,0,0,0.22)" />
      {/* corpo */}
      <rect x={-w / 2} y={-h} width={w} height={h} fill="url(#gTowerFace)" rx={3} />
      {/* face lateral esquerda (iluminação 3d) */}
      <polygon points={`${-w / 2},${-h} ${-w / 2 - 10 * s},${-h + 16 * s} ${-w / 2 - 10 * s},${10 * s} ${-w / 2},${0}`}
        fill="url(#gTowerSide)" />
      {/* topo */}
      <rect x={-rw / 2} y={-h - 12 * s} width={rw} height={14 * s} fill="url(#gBattlement)" rx={2} />
      {/* ameias */}
      {[-20, -6, 8, 22].map((dx, i) => (
        <rect key={i} x={(dx - 5) * s + (-rw / 2) + rw / 2 - 10} y={-h - 26 * s}
          width={10 * s} height={16 * s} fill="#8a7a60" rx={1} />
      ))}
      {/* janela */}
      <ellipse cx={0} cy={-h * 0.55} rx={7 * s} ry={11 * s} fill={lit ? '#ffa020' : '#1a1208'} />
      {lit && <ellipse cx={0} cy={-h * 0.55} rx={12 * s} ry={18 * s} fill="#ff8000" opacity={0.18} />}
      {/* aro da janela */}
      <ellipse cx={0} cy={-h * 0.55} rx={8 * s} ry={12 * s} fill="none"
        stroke="#a08050" strokeWidth={2 * s} />
    </g>
  );
}

/* ─── Plataforma de Fundação ─────────────────────────────────────────────── */
function Foundation({ slot, selected, onClick }: {
  slot: Slot; selected: boolean; onClick: (t: BuildingType) => void;
}) {
  const { cx, cy, rx, ry } = slot;
  const pulse = selected ? 'url(#gSlotSel)' : 'url(#gSlot)';
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(slot.type)}
    >
      {/* sombra suave */}
      <ellipse cx={cx + 8} cy={cy + 14} rx={rx * 1.1} ry={ry * 0.85} fill="rgba(0,0,0,0.22)" />
      {/* plataforma superior */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={pulse} />
      {/* borda de pedra */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none"
        stroke={selected ? '#d4c870' : '#9a8860'} strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={selected ? undefined : '6 4'} />
      {/* face frontal 3D */}
      <path d={`M${cx - rx},${cy} Q${cx},${cy + ry * 0.5} ${cx + rx},${cy} L${cx + rx},${cy + 16} Q${cx},${cy + ry * 0.5 + 16} ${cx - rx},${cy + 16} Z`}
        fill="url(#gFoundSide)" />
      {/* cross pattern decorativo */}
      <line x1={cx - rx * 0.6} y1={cy} x2={cx + rx * 0.6} y2={cy} stroke="#a09070" strokeWidth={1} opacity={0.4} />
      <line x1={cx} y1={cy - ry * 0.6} x2={cx} y2={cy + ry * 0.6} stroke="#a09070" strokeWidth={1} opacity={0.4} />
      {/* label do slot */}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fill={selected ? '#ffeea0' : '#d4c870'}
        fontFamily="'Cinzel', 'Georgia', serif" fontWeight="600" opacity={0.92}>
        {slot.icon} {slot.label}
      </text>
      {selected && (
        <ellipse cx={cx} cy={cy} rx={rx + 6} ry={ry + 4}
          fill="none" stroke="#ffe060" strokeWidth={2}
          style={{ animation: 'slotPulse 1.6s ease-in-out infinite' }} />
      )}
    </g>
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
    <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
      Carregando castelo…
    </div>
  );

  const res = resources ?? castle.resources;
  const toggleSlot = (t: BuildingType) => setSelected(p => p === t ? null : t);

  return (
    <div className="relative w-full overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg,#08051a 0%,#0d0a1e 100%)' }}>

      {/* ── HUD de Recursos ─────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-wrap items-center gap-2 px-4 py-2 text-sm"
        style={{ background: 'linear-gradient(90deg,rgba(8,5,2,.97),rgba(22,14,5,.97))',
          borderBottom: '1px solid #b8860b44' }}>
        <span className="font-medieval text-yellow-500 text-base mr-1">🏰 Nível {castle.level}</span>
        <span className="text-amber-300 bg-black/30 px-2 py-0.5 rounded">🌾 {Math.floor(res.food).toLocaleString()}</span>
        <span className="text-green-300 bg-black/30 px-2 py-0.5 rounded">🪵 {Math.floor(res.wood).toLocaleString()}</span>
        <span className="text-stone-300 bg-black/30 px-2 py-0.5 rounded">🪨 {Math.floor(res.stone).toLocaleString()}</span>
        <span className="text-sky-300 bg-black/30 px-2 py-0.5 rounded">⚙️ {Math.floor(res.iron).toLocaleString()}</span>
        <span className="ml-auto text-stone-500 text-xs">[{castle.mapX},{castle.mapY}]</span>
      </div>

      {/* ── MAPA ISOMÉTRICO SVG ─────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '78vh', minHeight: 520, maxHeight: 860 }}>

        <svg viewBox="0 0 1800 1230" preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>

          {/* ══ DEFS ════════════════════════════════════════════════════ */}
          <defs>

            {/* ── Gradientes de ambiente ─────────────────────────────── */}
            <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#070514" />
              <stop offset="55%" stopColor="#0e1030" />
              <stop offset="100%" stopColor="#1a2040" />
            </linearGradient>
            <linearGradient id="gOcean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a2240" />
              <stop offset="40%" stopColor="#0c2a4e" />
              <stop offset="100%" stopColor="#060f1e" />
            </linearGradient>
            <linearGradient id="gOceanShallow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a4060" />
              <stop offset="100%" stopColor="#0c2a4e" />
            </linearGradient>
            <linearGradient id="gShoreLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a3820" />
              <stop offset="100%" stopColor="#0c2a4e" />
            </linearGradient>
            <linearGradient id="gGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a4820" />
              <stop offset="60%" stopColor="#233a1a" />
              <stop offset="100%" stopColor="#1a2c14" />
            </linearGradient>
            <linearGradient id="gGrassInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#304a24" />
              <stop offset="100%" stopColor="#263c1c" />
            </linearGradient>
            <linearGradient id="gDirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a3820" />
              <stop offset="100%" stopColor="#382a16" />
            </linearGradient>
            <linearGradient id="gClifTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a6848" />
              <stop offset="100%" stopColor="#5c4e34" />
            </linearGradient>
            <linearGradient id="gClifFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a3e2c" />
              <stop offset="50%" stopColor="#3a3020" />
              <stop offset="100%" stopColor="#1e1a10" />
            </linearGradient>
            <linearGradient id="gCastleHill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a7a5a" />
              <stop offset="35%" stopColor="#6e6244" />
              <stop offset="100%" stopColor="#54483a" />
            </linearGradient>
            <linearGradient id="gCastlePlatTop" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#a09070" />
              <stop offset="40%" stopColor="#8a7a5c" />
              <stop offset="100%" stopColor="#6e6248" />
            </linearGradient>
            <linearGradient id="gCastleCourtyard" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a8a6a" />
              <stop offset="100%" stopColor="#7a6e52" />
            </linearGradient>

            {/* ── Gradientes de muro ────────────────────────────────── */}
            <linearGradient id="gWallTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a8a6a" />
              <stop offset="100%" stopColor="#7a6a4e" />
            </linearGradient>
            <linearGradient id="gWallFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a5040" />
              <stop offset="50%" stopColor="#4a4232" />
              <stop offset="100%" stopColor="#2e2a1e" />
            </linearGradient>
            <linearGradient id="gWallSide" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#3e3828" />
              <stop offset="100%" stopColor="#2a2418" />
            </linearGradient>
            <linearGradient id="gBattlement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a7a5c" />
              <stop offset="100%" stopColor="#6a5e44" />
            </linearGradient>
            <linearGradient id="gTowerFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a6e54" />
              <stop offset="40%" stopColor="#5e5440" />
              <stop offset="100%" stopColor="#3a3224" />
            </linearGradient>
            <linearGradient id="gTowerSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3426" />
              <stop offset="100%" stopColor="#1e1c12" />
            </linearGradient>

            {/* ── Gradientes de estrada ─────────────────────────────── */}
            <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a6e56" />
              <stop offset="100%" stopColor="#5e5440" />
            </linearGradient>
            <linearGradient id="gCobble" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8a7e64" />
              <stop offset="50%" stopColor="#6e6450" />
              <stop offset="100%" stopColor="#5a5040" />
            </linearGradient>
            <linearGradient id="gStair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a09070" />
              <stop offset="100%" stopColor="#5a5040" />
            </linearGradient>

            {/* ── Fundações ────────────────────────────────────────── */}
            <radialGradient id="gSlot" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#8a7e62" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#6a6048" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#4a4232" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="gSlotSel" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#b0a478" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#8a7c58" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#5e5438" stopOpacity="0.90" />
            </radialGradient>
            <linearGradient id="gFoundSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a4030" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e1c14" stopOpacity="0.9" />
            </linearGradient>

            {/* ── Porto / madeira ──────────────────────────────────── */}
            <linearGradient id="gDock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6a4e30" />
              <stop offset="100%" stopColor="#3a2c1c" />
            </linearGradient>
            <linearGradient id="gHarborWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#54483a" />
              <stop offset="100%" stopColor="#2e2820" />
            </linearGradient>
            <linearGradient id="gBoatHull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c4228" />
              <stop offset="100%" stopColor="#3a2818" />
            </linearGradient>

            {/* ── Vegetação ────────────────────────────────────────── */}
            <linearGradient id="gCypTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e4a1a" />
              <stop offset="100%" stopColor="#2a5e22" />
            </linearGradient>
            <linearGradient id="gCypMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#245820" />
              <stop offset="100%" stopColor="#306828" />
            </linearGradient>
            <linearGradient id="gCypBot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c6226" />
              <stop offset="100%" stopColor="#3a7432" />
            </linearGradient>
            <radialGradient id="gOak" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#4a8c38" />
              <stop offset="50%" stopColor="#307028" />
              <stop offset="100%" stopColor="#1e4c18" />
            </radialGradient>

            {/* ── Efeito Luz Ambiental ──────────────────────────────── */}
            <radialGradient id="gAmbient" cx="50%" cy="0%" r="75%">
              <stop offset="0%" stopColor="#e8d090" stopOpacity="0.14" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="gVignette" cx="50%" cy="50%" r="70%">
              <stop offset="40%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.70)" />
            </radialGradient>
            <radialGradient id="gMoonlight" cx="70%" cy="5%" r="45%">
              <stop offset="0%" stopColor="#b8c8e8" stopOpacity="0.10" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* ── Filtro hand-painted ───────────────────────────────── */}
            <filter id="fPaint" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.022" numOctaves="4" seed="8" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="fSoftShadow">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="fDrop">
              <feDropShadow dx="3" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.35" />
            </filter>
            <filter id="fGlow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="fWater">
              <feTurbulence type="turbulence" baseFrequency="0.025 0.008" numOctaves="3" seed="12" result="wn">
                <animate attributeName="baseFrequency" values="0.025 0.008;0.028 0.010;0.025 0.008" dur="8s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="wn" scale="8" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* ── Padrão pedra de calçada ───────────────────────────── */}
            <pattern id="pCobble" x="0" y="0" width="28" height="18" patternUnits="userSpaceOnUse">
              <rect width="28" height="18" fill="#6e6450" />
              <rect x="1" y="1" width="11" height="7" rx="1" fill="#7e7460" />
              <rect x="14" y="1" width="13" height="7" rx="1" fill="#786e58" />
              <rect x="1" y="10" width="13" height="7" rx="1" fill="#7a7060" />
              <rect x="16" y="10" width="11" height="7" rx="1" fill="#746a54" />
            </pattern>

            {/* ── Padrão pedra da muralha ───────────────────────────── */}
            <pattern id="pStone" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
              <rect width="40" height="24" fill="#5a5040" />
              <rect x="1" y="1" width="17" height="10" rx="1" fill="#645a48" opacity="0.9" />
              <rect x="20" y="1" width="19" height="10" rx="1" fill="#5e5444" opacity="0.9" />
              <rect x="1" y="13" width="20" height="10" rx="1" fill="#625848" opacity="0.9" />
              <rect x="23" y="13" width="16" height="10" rx="1" fill="#5c5242" opacity="0.9" />
            </pattern>

            {/* ── Padrão tábua de madeira ───────────────────────────── */}
            <pattern id="pPlank" x="0" y="0" width="20" height="80" patternUnits="userSpaceOnUse">
              <rect width="20" height="80" fill="#5c4430" />
              <rect x="1" y="0" width="8" height="80" fill="#644c38" />
              <rect x="11" y="0" width="8" height="80" fill="#5a4030" />
              <line x1="0" y1="20" x2="20" y2="20" stroke="#3a2c1c" strokeWidth="1" opacity="0.6" />
              <line x1="0" y1="40" x2="20" y2="40" stroke="#3a2c1c" strokeWidth="1" opacity="0.6" />
              <line x1="0" y1="60" x2="20" y2="60" stroke="#3a2c1c" strokeWidth="1" opacity="0.6" />
            </pattern>

            {/* ── Padrão grama ─────────────────────────────────────── */}
            <pattern id="pGrass" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#2a4820" />
              <circle cx="6"  cy="9"  r="3"  fill="#304e24" opacity="0.6" />
              <circle cx="20" cy="5"  r="4"  fill="#2c4a22" opacity="0.5" />
              <circle cx="14" cy="22" r="3"  fill="#325224" opacity="0.6" />
              <circle cx="28" cy="18" r="2.5" fill="#2e5020" opacity="0.5" />
              <circle cx="4"  cy="26" r="3.5" fill="#284618" opacity="0.5" />
            </pattern>

            {/* ── Cortina de névoa ─────────────────────────────────── */}
            <linearGradient id="gFog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1e40" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* ── Gradiente água rasa do porto ──────────────────────── */}
            <linearGradient id="gHarborWater" x1="0" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#183858" />
              <stop offset="100%" stopColor="#0a1e38" />
            </linearGradient>

          </defs>

          {/* ═══ 1. FUNDO / CÉU ═══════════════════════════════════════════ */}
          <rect x="0" y="0" width="1800" height="1230" fill="url(#gSky)" />

          {/* Estrelas */}
          {[
            [120,45],[350,22],[580,60],[820,18],[1040,42],[1280,28],[1520,55],[1740,20],
            [200,88],[460,75],[700,90],[960,68],[1180,82],[1420,72],[1660,88],
            [80,120],[310,105],[550,130],[790,108],[1030,118],[1270,100],[1510,125],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.5 : 1}
              fill="white" opacity={0.4 + (i % 4) * 0.12}
              style={{ animation: `starTwinkle ${2.5 + (i % 4) * 0.7}s ease-in-out infinite ${(i % 5) * 0.5}s` }} />
          ))}

          {/* Lua crescente */}
          <circle cx={1560} cy={65} r={44} fill="#e8dfc0" opacity={0.82} filter="url(#fGlow)" />
          <circle cx={1580} cy={58} r={40} fill="#1a1e3a" />

          {/* Nuvens de névoa */}
          <ellipse cx={320} cy={140} rx={280} ry={68} fill="#1e224a" opacity={0.38} filter="url(#fSoftShadow)" />
          <ellipse cx={900} cy={108} rx={350} ry={60} fill="#22264e" opacity={0.32} filter="url(#fSoftShadow)" />
          <ellipse cx={1500} cy={130} rx={260} ry={65} fill="#1e224a" opacity={0.35} filter="url(#fSoftShadow)" />
          <rect x="0" y="0" width="1800" height="210" fill="url(#gFog)" />

          {/* ═══ 2. OCEANO / PORTO ════════════════════════════════════════ */}
          {/* Oceano fundo */}
          <rect x="0" y="870" width="1800" height="360" fill="url(#gOcean)" />
          {/* Água animada com filtro */}
          <rect x="0" y="870" width="1800" height="360" fill="url(#gOcean)" filter="url(#fWater)" opacity={0.7} />

          {/* Reflexos de lua na água */}
          <ellipse cx={900} cy={1020} rx={80} ry={18} fill="#c8c0a0" opacity={0.08} />
          <ellipse cx={900} cy={1060} rx={50} ry={10} fill="#c8c0a0" opacity={0.06} />
          <ellipse cx={1400} cy={980} rx={60} ry={12} fill="#8090b0" opacity={0.06} />

          {/* Linhas de ondas */}
          {[920, 960, 1000, 1055, 1110, 1170, 1230].map((wy, i) => (
            <path key={i}
              d={`M${80 + i * 15},${wy} Q${480},${wy - 9} ${900},${wy} Q${1320},${wy + 9} ${1720 - i * 15},${wy}`}
              fill="none" stroke="#2a5070" strokeWidth={1.2} opacity={0.22 + i * 0.028}
              style={{ animation: `waveMove ${4 + i * 0.6}s ease-in-out infinite ${i * 0.4}s` }} />
          ))}

          {/* Água rasa do porto (interior) */}
          <path d="M260,872 Q460,858 700,864 Q900,856 1100,864 Q1340,858 1540,872 L1540,930 Q1300,940 900,938 Q500,940 260,930 Z"
            fill="url(#gOceanShallow)" opacity={0.92} />

          {/* ═══ 3. TERRENO EXTERIOR (fora das muralhas) ══════════════════ */}
          {/* Grama fora das muralhas */}
          <path d="M0,165 Q300,145 600,160 Q900,148 1200,160 Q1500,148 1800,165 L1800,880 Q1300,860 900,858 Q500,860 0,880 Z"
            fill="url(#pGrass)" opacity={0.82} filter="url(#fPaint)" />
          <path d="M0,165 Q300,145 600,160 Q900,148 1200,160 Q1500,148 1800,165 L1800,880 Q1300,860 900,858 Q500,860 0,880 Z"
            fill="url(#gGrass)" opacity={0.35} />

          {/* Colinas externas */}
          <ellipse cx={180} cy={550} rx={260} ry={95} fill="#263820" opacity={0.55} filter="url(#fPaint)" />
          <ellipse cx={1620} cy={520} rx={250} ry={90} fill="#263820" opacity={0.52} filter="url(#fPaint)" />
          <ellipse cx={300} cy={800} rx={180} ry={60} fill="#1e3016" opacity={0.45} filter="url(#fPaint)" />
          <ellipse cx={1500} cy={810} rx={190} ry={58} fill="#1e3016" opacity={0.45} filter="url(#fPaint)" />

          {/* ═══ 4. MURALHAS DEFENSIVAS ═══════════════════════════════════ */}
          {/* ── sombra projetada das muralhas ── */}
          <path d="M355,215 Q580,168 900,152 Q1220,168 1445,215 L1620,580 L1540,886 Q1200,918 900,924 Q600,918 260,886 L180,580 Z"
            fill="rgba(0,0,0,0.40)" filter="url(#fSoftShadow)" transform="translate(12,18)" />

          {/* ── chão interior da cidade ── */}
          <path d="M355,215 Q580,168 900,152 Q1220,168 1445,215 L1620,580 L1540,886 Q1200,918 900,924 Q600,918 260,886 L180,580 Z"
            fill="url(#pGrass)" opacity={0.75} filter="url(#fPaint)" />
          <path d="M355,215 Q580,168 900,152 Q1220,168 1445,215 L1620,580 L1540,886 Q1200,918 900,924 Q600,918 260,886 L180,580 Z"
            fill="url(#gGrassInner)" opacity={0.50} />

          {/* ── Face frontal/esterna da Muralha Norte ── */}
          <path d="M355,215 Q580,168 900,152 Q1220,168 1445,215 L1445,262 Q1220,212 900,196 Q580,212 355,262 Z"
            fill="url(#pStone)" opacity={0.94} />
          <path d="M355,215 Q580,168 900,152 Q1220,168 1445,215 L1445,262 Q1220,212 900,196 Q580,212 355,262 Z"
            fill="url(#gWallTop)" opacity={0.60} />

          {/* ── Muralha Oeste ── */}
          {/* Topo */}
          <path d="M180,580 L260,886 L310,886 L228,580 Z" fill="url(#gWallTop)" opacity={0.85} />
          <path d="M180,580 L260,886 L310,886 L228,580 Z" fill="url(#pStone)" opacity={0.55} />
          {/* Face externa */}
          <path d="M140,575 L180,580 L260,886 L218,886 Z" fill="url(#gWallSide)" opacity={0.88} />
          {/* Face interna vista */}
          <path d="M355,215 L355,262 L260,886 L228,580 Z" fill="url(#gWallFront)" opacity={0.90} />
          <path d="M355,215 L355,262 L260,886 L228,580 Z" fill="url(#pStone)" opacity={0.50} />

          {/* ── Muralha Leste ── */}
          {/* Topo */}
          <path d="M1620,580 L1572,580 L1490,886 L1540,886 Z" fill="url(#gWallTop)" opacity={0.85} />
          <path d="M1620,580 L1572,580 L1490,886 L1540,886 Z" fill="url(#pStone)" opacity={0.55} />
          {/* Face externa */}
          <path d="M1660,575 L1620,580 L1540,886 L1582,886 Z" fill="url(#gWallSide)" opacity={0.88} />
          {/* Face interna vista */}
          <path d="M1445,215 L1445,262 L1540,886 L1572,580 Z" fill="url(#gWallFront)" opacity={0.90} />
          <path d="M1445,215 L1445,262 L1540,886 L1572,580 Z" fill="url(#pStone)" opacity={0.50} />

          {/* ── Ameias Norte ── */}
          {Array.from({ length: 24 }).map((_, i) => {
            const t = i / 23;
            const cx = 355 + (1090) * t;
            const baseY = 215 + (47) * t - 28;
            return (
              <g key={i}>
                <rect x={cx - 10} y={baseY - 20} width={18} height={22}
                  fill="#8a7a5e" rx={2} opacity={0.95} />
              </g>
            );
          })}

          {/* ── Ameias Oeste ── */}
          {Array.from({ length: 14 }).map((_, i) => {
            const t = i / 13;
            const px = 355 + (260 - 355) * t;
            const py = 215 + (886 - 215) * t - 28;
            return (
              <g key={i} transform={`translate(${px},${py})`}>
                <rect x={-9} y={-22} width={17} height={22} fill="#8a7a5e" rx={2} opacity={0.92} />
              </g>
            );
          })}

          {/* ── Ameias Leste ── */}
          {Array.from({ length: 14 }).map((_, i) => {
            const t = i / 13;
            const px = 1445 + (1540 - 1445) * t;
            const py = 215 + (886 - 215) * t - 28;
            return (
              <g key={i} transform={`translate(${px},${py})`}>
                <rect x={-9} y={-22} width={17} height={22} fill="#8a7a5e" rx={2} opacity={0.92} />
              </g>
            );
          })}

          {/* ═══ 5. TORRES DEFENSIVAS ═════════════════════════════════════ */}
          {/* NW */}
          <Tower x={352} y={218} s={1.20} lit />
          {/* N Centro */}
          <Tower x={900} y={155} s={1.05} lit />
          {/* NE */}
          <Tower x={1448} y={218} s={1.20} lit />
          {/* W Centro */}
          <Tower x={218} y={580} s={0.95} />
          {/* E Centro */}
          <Tower x={1582} y={580} s={0.95} />
          {/* SW */}
          <Tower x={260} y={882} s={1.10} />
          {/* SE */}
          <Tower x={1540} y={882} s={1.10} />

          {/* ═══ 6. PORTÃO PRINCIPAL (Sul → Porto) ═══════════════════════ */}
          <g filter="url(#fDrop)">
            {/* Arco do portão */}
            <path d="M760,890 L760,845 Q760,810 800,808 L900,805 Q940,808 940,845 L940,890 Z"
              fill="url(#pStone)" />
            <path d="M760,890 L760,845 Q760,810 800,808 L900,805 Q940,808 940,845 L940,890 Z"
              fill="url(#gWallFront)" opacity={0.7} />
            {/* Abertura do portão */}
            <path d="M798,888 L798,845 Q798,822 825,820 L975,820 Q1002,822 1002,845 L1002,888 Z"
              fill="#080604" />
            <path d="M798,888 L798,845 Q798,822 825,820 L975,820 Q1002,822 1002,845 L1002,888 Z"
              fill="#201508" opacity={0.5} />
            {/* Arco decorativo */}
            <path d="M810,888 Q810,828 900,822 Q990,828 990,888"
              fill="none" stroke="#a09070" strokeWidth={3} opacity={0.7} />
            {/* Torres flanqueando */}
            <Tower x={758} y={888} s={0.92} />
            <Tower x={1042} y={888} s={0.92} />
            {/* Escudo heráldico */}
            <ellipse cx={900} cy={790} rx={18} ry={22} fill="#8a6028" stroke="#c8a040" strokeWidth={2} />
            <text x={900} y={793} textAnchor="middle" dominantBaseline="middle" fontSize={18} fill="#d4a020">🏰</text>
            {/* Correntes do portão */}
            <line x1={840} y1={820} x2={840} y2={888} stroke="#685040" strokeWidth={3} strokeDasharray="4 3" opacity={0.7} />
            <line x1={960} y1={820} x2={960} y2={888} stroke="#685040" strokeWidth={3} strokeDasharray="4 3" opacity={0.7} />
          </g>

          {/* ═══ 7. COLINA DO CASTELO ══════════════════════════════════════ */}
          {/* Talude lateral da colina */}
          <path d="M420,260 Q560,220 720,210 Q900,202 1080,210 Q1240,220 1380,260 L1360,420 Q1240,380 900,370 Q560,380 440,420 Z"
            fill="url(#gClifFace)" opacity={0.95} filter="url(#fPaint)" />
          <path d="M420,260 Q560,220 720,210 Q900,202 1080,210 Q1240,220 1380,260 L1360,420 Q1240,380 900,370 Q560,380 440,420 Z"
            fill="url(#pStone)" opacity={0.35} />

          {/* Topo da colina (plataforma base) */}
          <path d="M440,420 Q560,380 900,370 Q1240,380 1360,420 Q1340,480 1180,500 Q1060,512 900,514 Q740,512 620,500 Q460,480 440,420 Z"
            fill="url(#gCastleHill)" filter="url(#fPaint)" />

          {/* Pátio de pedra do castelo */}
          <ellipse cx={900} cy={460} rx={390} ry={118} fill="url(#gCastlePlatTop)" opacity={0.95} />
          <ellipse cx={900} cy={460} rx={390} ry={118} fill="url(#pStone)" opacity={0.38} />
          <ellipse cx={900} cy={460} rx={360} ry={108} fill="none" stroke="#c8a860" strokeWidth={2.5} opacity={0.55} />

          {/* Decoração de paralelepípedos no pátio */}
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse key={i} cx={900} cy={460} rx={80 + i * 62} ry={24 + i * 18}
              fill="none" stroke="#a09060" strokeWidth={0.8} opacity={0.22} />
          ))}

          {/* Slot CASTELO (plataforma central elevada) */}
          <g>
            <ellipse cx={900} cy={450} rx={230} ry={72} fill="url(#gCastleCourtyard)" opacity={0.92} />
            <ellipse cx={900} cy={450} rx={230} ry={72} fill="none"
              stroke="#d4a820" strokeWidth={3} opacity={0.7} />
            <ellipse cx={900} cy={450} rx={218} ry={66} fill="none"
              stroke="#c89820" strokeWidth={1} strokeDasharray="8 6" opacity={0.5} />
            <text x={900} y={444} textAnchor="middle" dominantBaseline="middle"
              fontSize={17} fill="#f0d070" fontFamily="'Cinzel','Georgia',serif" fontWeight="700">
              🏰 CASTELO Nv.{castle.level}
            </text>
            <text x={900} y={466} textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fill="#c8a840" fontFamily="'Cinzel','Georgia',serif" opacity={0.8}>
              Fundação Principal
            </text>
          </g>

          {/* Escadaria principal descendo da colina */}
          {Array.from({ length: 9 }).map((_, i) => {
            const t   = i / 8;
            const ey  = 512 + t * 68;
            const ew  = 180 - t * 30;
            return (
              <ellipse key={i} cx={900} cy={ey} rx={ew} ry={9 - t * 2}
                fill={i % 2 === 0 ? '#8a7a5a' : '#7a6a4e'}
                opacity={0.88 - i * 0.04} />
            );
          })}

          {/* Mureta da escadaria */}
          <path d="M730,512 Q820,520 860,580 L840,588 Q800,530 712,520 Z" fill="#6a5e44" opacity={0.8} />
          <path d="M1070,512 Q980,520 940,580 L960,588 Q1000,530 1088,520 Z" fill="#6a5e44" opacity={0.8} />

          {/* Lanternas na escadaria */}
          {[0.25, 0.55, 0.80].map((t, i) => {
            const lx = 730 + t * 340;
            const ly = 516 + t * 70;
            return (
              <g key={i}>
                <line x1={lx} y1={ly - 18} x2={lx} y2={ly - 8} stroke="#6a5040" strokeWidth={2} />
                <rect x={lx - 5} y={ly - 26} width={10} height={12} rx={2} fill="#8a6030" />
                <ellipse cx={lx} cy={ly - 20} rx={8} ry={5} fill="#ffa030" opacity={0.65}
                  style={{ animation: `torchFlicker ${1.3 + i * 0.4}s ease-in-out infinite ${i * 0.3}s` }} />
              </g>
            );
          })}

          {/* ═══ 8. ESTRADAS E CAMINHOS ═══════════════════════════════════ */}
          {/* Estrada principal (portão → escada do castelo) */}
          <path d="M900,884 Q898,820 896,755 Q894,700 898,640 Q900,600 902,582"
            fill="none" stroke="url(#pCobble)" strokeWidth={58} opacity={0.88} strokeLinecap="round" />
          <path d="M900,884 Q898,820 896,755 Q894,700 898,640 Q900,600 902,582"
            fill="none" stroke="url(#gRoad)" strokeWidth={58} opacity={0.45} strokeLinecap="round" />
          {/* Bordas da estrada principal */}
          <path d="M900,884 Q898,820 896,755 Q894,700 898,640 Q900,600 902,582"
            fill="none" stroke="#504838" strokeWidth={62} opacity={0.30} strokeLinecap="round" />

          {/* Estrada para Serraria (esquerda superior) */}
          <path d="M896,640 Q800,610 700,550 Q650,510 622,490"
            fill="none" stroke="url(#pCobble)" strokeWidth={38} opacity={0.80} strokeLinecap="round" />
          <path d="M896,640 Q800,610 700,550 Q650,510 622,490"
            fill="none" stroke="url(#gRoad)" strokeWidth={38} opacity={0.42} strokeLinecap="round" />

          {/* Estrada para Mina de Ferro (direita superior) */}
          <path d="M900,640 Q1000,610 1100,555 Q1148,510 1178,490"
            fill="none" stroke="url(#pCobble)" strokeWidth={38} opacity={0.80} strokeLinecap="round" />
          <path d="M900,640 Q1000,610 1100,555 Q1148,510 1178,490"
            fill="none" stroke="url(#gRoad)" strokeWidth={38} opacity={0.42} strokeLinecap="round" />

          {/* Estrada para Fazenda (esquerda) */}
          <path d="M898,755 Q750,730 600,700 Q520,685 462,658"
            fill="none" stroke="url(#pCobble)" strokeWidth={34} opacity={0.78} strokeLinecap="round" />
          <path d="M898,755 Q750,730 600,700 Q520,685 462,658"
            fill="none" stroke="url(#gRoad)" strokeWidth={34} opacity={0.40} strokeLinecap="round" />

          {/* Estrada para Quartel (direita) */}
          <path d="M900,755 Q1020,730 1080,690 Q1108,660 1082,628"
            fill="none" stroke="url(#pCobble)" strokeWidth={34} opacity={0.78} strokeLinecap="round" />
          <path d="M900,755 Q1020,730 1080,690 Q1108,660 1082,628"
            fill="none" stroke="url(#gRoad)" strokeWidth={34} opacity={0.40} strokeLinecap="round" />

          {/* Estrada para Pedreira */}
          <path d="M898,755 Q848,750 800,730 Q778,710 760,690"
            fill="none" stroke="url(#pCobble)" strokeWidth={30} opacity={0.75} strokeLinecap="round" />

          {/* Estrada para Armazém (direita baixo) */}
          <path d="M900,755 Q1100,740 1240,680 Q1272,655 1280,640"
            fill="none" stroke="url(#pCobble)" strokeWidth={30} opacity={0.75} strokeLinecap="round" />

          {/* Estrada para Academia */}
          <path d="M900,820 Q900,790 900,770"
            fill="none" stroke="url(#pCobble)" strokeWidth={36} opacity={0.80} strokeLinecap="round" />
          <path d="M898,770 Q900,760 900,750"
            fill="none" stroke="url(#pCobble)" strokeWidth={36} opacity={0.78} strokeLinecap="round" />

          {/* Pequenas vielas internas */}
          <path d="M622,490 Q660,600 762,666"
            fill="none" stroke="#5e5440" strokeWidth={18} opacity={0.50} strokeLinecap="round" />
          <path d="M1178,490 Q1140,600 1076,660"
            fill="none" stroke="#5e5440" strokeWidth={18} opacity={0.50} strokeLinecap="round" />

          {/* Canteiro central na intersecção */}
          <ellipse cx={900} cy={660} rx={38} ry={22} fill="#304820" opacity={0.8} />
          <ellipse cx={900} cy={660} rx={30} ry={17} fill="#3a5a26" opacity={0.9} />
          <circle cx={900} cy={656} r={6} fill="#c89030" opacity={0.75} />

          {/* ═══ 9. FUNDAÇÕES DOS EDIFÍCIOS ═══════════════════════════════ */}
          {SLOTS.map(slot => (
            <Foundation
              key={slot.type}
              slot={slot}
              selected={selected === slot.type}
              onClick={toggleSlot}
            />
          ))}

          {/* ═══ 10. PORTO MEDIEVAL ═══════════════════════════════════════ */}
          {/* Muralha do porto */}
          <path d="M260,886 Q400,908 620,916 L620,940 Q400,932 240,910 Z"
            fill="url(#gHarborWall)" opacity={0.95} />
          <path d="M1540,886 Q1400,908 1180,916 L1180,940 Q1400,932 1560,910 Z"
            fill="url(#gHarborWall)" opacity={0.95} />

          {/* Doca principal (madeira) */}
          <path d="M700,920 L700,1040 L1100,1040 L1100,920 Z" fill="url(#pPlank)" opacity={0.88} />
          <path d="M700,920 L700,1040 L1100,1040 L1100,920 Z" fill="url(#gDock)" opacity={0.45} />
          {/* Bordas da doca */}
          <rect x={697} y={918} width={9} height={124} rx={2} fill="#4a3220" />
          <rect x={1094} y={918} width={9} height={124} rx={2} fill="#4a3220" />
          {/* Pranchas transversais */}
          {[940, 960, 980, 1000, 1020].map((dy, i) => (
            <line key={i} x1={700} x2={1100} y1={dy} y2={dy} stroke="#3a2818" strokeWidth={3} opacity={0.5} />
          ))}
          {/* Pilares da doca */}
          {[730, 790, 860, 940, 1010, 1070].map((px, i) => (
            <g key={i}>
              <rect x={px - 5} y={930} width={10} height={100} rx={3} fill="#3a2810" opacity={0.8} />
              <ellipse cx={px} cy={930} rx={8} ry={3} fill="#4a3620" opacity={0.7} />
            </g>
          ))}

          {/* Docas laterais menores */}
          <path d="M380,900 L380,980 L520,980 L520,900" fill="url(#pPlank)" opacity={0.78} />
          <path d="M380,900 L380,980 L520,980 L520,900" fill="url(#gDock)" opacity={0.40} />
          <path d="M1280,900 L1280,980 L1420,980 L1420,900" fill="url(#pPlank)" opacity={0.78} />
          <path d="M1280,900 L1280,980 L1420,980 L1420,900" fill="url(#gDock)" opacity={0.40} />

          {/* Barco Medieval 1 — doca principal */}
          <g transform="translate(750, 985)">
            <ellipse cx={0} cy={8} rx={115} ry={14} fill="rgba(0,0,0,0.25)" />
            <path d="M-115,0 Q-100,-28 0,-32 Q100,-28 115,0 Q80,8 0,10 Q-80,8 -115,0 Z"
              fill="url(#gBoatHull)" />
            <path d="M-100,0 Q-85,-25 0,-28 Q85,-25 100,0 Z" fill="#4a3220" opacity={0.5} />
            <line x1={0} y1={-28} x2={0} y2={-110} stroke="#3a2818" strokeWidth={4} />
            <path d="M0,-110 L55,-75 L0,-42 Z" fill="#c8b070" opacity={0.85} />
            <path d="M0,-110 L-42,-80 L0,-52 Z" fill="#b0985e" opacity={0.75} />
            <line x1={-115} y1={0} x2={-130} y2={14} stroke="#5a4030" strokeWidth={2} opacity={0.6} />
          </g>

          {/* Barco Medieval 2 — doca lateral esq */}
          <g transform="translate(450, 968)">
            <ellipse cx={0} cy={6} rx={78} ry={10} fill="rgba(0,0,0,0.22)" />
            <path d="M-78,0 Q-65,-20 0,-22 Q65,-20 78,0 Q50,6 0,8 Q-50,6 -78,0 Z"
              fill="url(#gBoatHull)" />
            <line x1={0} y1={-20} x2={0} y2={-75} stroke="#3a2818" strokeWidth={3} />
            <path d="M0,-75 L38,-52 L0,-30 Z" fill="#b0985e" opacity={0.80} />
          </g>

          {/* Barco Medieval 3 — doca lateral dir */}
          <g transform="translate(1350, 970)">
            <ellipse cx={0} cy={6} rx={82} ry={10} fill="rgba(0,0,0,0.22)" />
            <path d="M-82,0 Q-68,-22 0,-24 Q68,-22 82,0 Q54,7 0,8 Q-54,7 -82,0 Z"
              fill="url(#gBoatHull)" />
            <line x1={0} y1={-22} x2={0} y2={-80} stroke="#3a2818" strokeWidth={3} />
            <path d="M0,-80 L40,-55 L0,-33 Z" fill="#c8b070" opacity={0.82} />
          </g>

          {/* Escadas do porto para a cidade */}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={870} y={870 + i * 10} width={60} height={9}
              rx={1} fill={i % 2 === 0 ? '#8a7a5a' : '#7a6a4a'} opacity={0.85 - i * 0.05} />
          ))}

          {/* Lanternas do porto */}
          {[420, 580, 760, 960, 1130, 1320, 1480].map((lx, i) => (
            <g key={i} transform={`translate(${lx}, 892)`}>
              <line x1={0} y1={-25} x2={0} y2={-12} stroke="#5a4030" strokeWidth={2.5} />
              <rect x={-6} y={-36} width={12} height={14} rx={2} fill="#7a5830" />
              <ellipse cx={0} cy={-30} rx={10} ry={6} fill="#ff9020" opacity={0.55}
                style={{ animation: `torchFlicker ${1.5 + i * 0.3}s ease-in-out infinite ${i * 0.25}s` }} />
            </g>
          ))}

          {/* ═══ 11. VEGETAÇÃO ════════════════════════════════════════════ */}
          {/* Ciprestes ao longo das muralhas internas Norte */}
          <CypressTree x={420} y={254} s={0.75} />
          <CypressTree x={490} y={238} s={0.70} />
          <CypressTree x={1310} y={238} s={0.72} />
          <CypressTree x={1382} y={254} s={0.76} />
          <CypressTree x={560} y={250} s={0.65} />
          <CypressTree x={1242} y={250} s={0.66} />

          {/* Carvalhos na colina do castelo */}
          <OakTree x={520} y={432} s={0.90} />
          <OakTree x={560} y={408} s={0.80} />
          <OakTree x={1280} y={432} s={0.88} />
          <OakTree x={1240} y={408} s={0.82} />
          <OakTree x={620} y={382} s={0.72} />
          <OakTree x={1180} y={382} s={0.70} />

          {/* Jardim ao redor da plataforma do castelo */}
          <OakTree x={640} y={470} s={0.65} />
          <OakTree x={1160} y={468} s={0.68} />
          <Bush x={680} y={490} />
          <Bush x={750} y={480} />
          <Bush x={1050} y={478} />
          <Bush x={1120} y={490} />

          {/* Vegetação no distrito central */}
          <OakTree x={380} y={540} s={0.88} />
          <OakTree x={340} y={570} s={0.78} />
          <CypressTree x={308} y={530} s={0.82} />
          <OakTree x={1420} y={540} s={0.85} />
          <OakTree x={1460} y={568} s={0.78} />
          <CypressTree x={1492} y={528} s={0.80} />

          {/* Árvores entre as fundações */}
          <OakTree x={536} y={555} s={0.72} />
          <Bush x={560} y={578} />
          <Bush x={508} y={562} />
          <OakTree x={1268} y={552} s={0.70} />
          <Bush x={1300} y={575} />

          {/* Vegetação na área sul (perto do porto) */}
          <OakTree x={380} y={720} s={0.82} />
          <OakTree x={420} y={750} s={0.74} />
          <Bush x={355} y={738} />
          <Bush x={455} y={760} />
          <OakTree x={1420} y={718} s={0.80} />
          <OakTree x={1460} y={748} s={0.76} />
          <Bush x={1488} y={736} />
          <CypressTree x={352} y={718} s={0.70} />
          <CypressTree x={1448} y={716} s={0.68} />

          {/* Jardim em frente ao portão */}
          <Bush x={680} y={858} />
          <Bush x={720} y={870} />
          <OakTree x={650} y={842} s={0.60} />
          <Bush x={1082} y={858} />
          <Bush x={1120} y={870} />
          <OakTree x={1152} y={842} s={0.60} />

          {/* Vegetação fora das muralhas */}
          <OakTree x={100} y={480} s={1.0} />
          <OakTree x={155} y={510} s={0.88} />
          <CypressTree x={60} y={460} s={0.95} />
          <CypressTree x={120} y={420} s={0.85} />
          <OakTree x={1650} y={480} s={0.98} />
          <OakTree x={1700} y={512} s={0.88} />
          <CypressTree x={1740} y={456} s={0.92} />
          <Bush x={80} y={540} s={1.1} />
          <Bush x={180} y={580} s={1.0} />
          <Bush x={1622} y={545} s={1.1} />
          <Bush x={1720} y={572} s={1.0} />

          {/* Vegetação costa */}
          <Bush x={280} y={888} />
          <Bush x={320} y={904} />
          <Bush x={1478} y={888} />
          <Bush x={1520} y={904} />

          {/* ═══ 12. POÇO CENTRAL ════════════════════════════════════════ */}
          <g transform="translate(900, 810)">
            <ellipse cx={0} cy={8} rx={38} ry={12} fill="rgba(0,0,0,0.25)" />
            <ellipse cx={0} cy={0} rx={32} ry={10} fill="#3a3228" />
            <ellipse cx={0} cy={0} rx={28} ry={8} fill="#0a1828" />
            <rect x={-34} y={-28} width={12} height={30} rx={2} fill="#6a5a40" />
            <rect x={22} y={-28} width={12} height={30} rx={2} fill="#6a5a40" />
            <rect x={-38} y={-34} width={76} height={9} rx={2} fill="#8a7a5a" />
            <line x1={0} y1={-25} x2={0} y2={-4} stroke="#4a3820" strokeWidth={2.5} />
            <ellipse cx={0} cy={-26} rx={9} ry={5} fill="#5a4820" />
          </g>

          {/* ═══ 13. NÉVOA E ATMOSFERA ════════════════════════════════════ */}
          {/* Névoa no fundo do porto */}
          <rect x={0} y={880} width={1800} height={80} fill="url(#gFog)" opacity={0.22} />

          {/* Luz ambiente dourada (luz da lua / tochas) */}
          <rect x={0} y={0} width={1800} height={1230} fill="url(#gAmbient)" />
          <rect x={0} y={0} width={1800} height={1230} fill="url(#gMoonlight)" />

          {/* Vignet */}
          <rect x={0} y={0} width={1800} height={1230} fill="url(#gVignette)" />

          {/* Partículas de faísca (tochas) */}
          {[352, 900, 1448, 218, 1582].map((px, i) => (
            <g key={i}>
              {[0, 1, 2].map((j) => (
                <circle key={j} cx={px + (j - 1) * 6} cy={-90 - j * 8}
                  r={1.5} fill="#ffb030" opacity={0.6}
                  style={{ animation: `sparkFloat ${1.8 + j * 0.5}s ease-in-out infinite ${i * 0.4 + j * 0.2}s` }} />
              ))}
            </g>
          ))}

        </svg>
      </div>

      {/* ── Painel do Edifício Selecionado ───────────────────────────── */}
      {selected && (
        <div className="relative z-20 px-4 pb-4">
          <BuildingCard buildingType={selected} />
          <button
            className="absolute top-0 right-6 text-stone-400 hover:text-parchment-100 text-xl leading-none"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
