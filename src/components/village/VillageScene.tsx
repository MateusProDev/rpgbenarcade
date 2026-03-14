/**
 * VillageScene — Isometric medieval village rendered as interactive SVG.
 *
 * Cartoon mobile-game style: bright colors, simple shapes, 45° iso angle.
 * Fully self-contained — no external assets needed (MVP).
 */

import { useMemo } from 'react';
import type { City } from '../../types/city';
import type { BuildingInstance, BuildingType } from '../../types/buildings';
import { BUILDING_DEFINITIONS } from '../../game/config/buildings.config';

interface VillageSceneProps {
  city: City;
  onBuildingClick?: (buildingId: string) => void;
}

/* ── Isometric helpers ─────────────────────────────────────── */
const ISO_ANGLE = Math.PI / 6; // 30°
const COS = Math.cos(ISO_ANGLE);
const SIN = Math.sin(ISO_ANGLE);

function toIso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * COS * 40,
    y: (gx + gy) * SIN * 40 * 0.6,
  };
}

/* ── Circular layout around center (slot 0 = castle) ──────── */
function getSlotPos(slotIndex: number, total: number): { gx: number; gy: number } {
  if (slotIndex === 0) return { gx: 0, gy: 0 };
  const ringSize = Math.min(total - 1, 12);
  const angle = ((slotIndex - 1) / Math.max(ringSize, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 2.6;
  return {
    gx: Math.cos(angle) * radius,
    gy: Math.sin(angle) * radius,
  };
}

/* ── Building palette ─────────────────────────────────────── */
interface BuildingVisual {
  baseColor: string;
  roofColor: string;
  accent: string;
  icon: string;
  w: number;
  h: number;
}

const BUILDING_VISUALS: Record<BuildingType, BuildingVisual> = {
  castle:     { baseColor: '#8a8a8a', roofColor: '#b22222', accent: '#d4a827', icon: '🏰', w: 52, h: 58 },
  house:      { baseColor: '#deb887', roofColor: '#d2691e', accent: '#8b4513', icon: '🏠', w: 32, h: 34 },
  farm:       { baseColor: '#90ee90', roofColor: '#8b4513', accent: '#228b22', icon: '🌾', w: 36, h: 32 },
  lumbermill: { baseColor: '#deb887', roofColor: '#654321', accent: '#8b4513', icon: '🪵', w: 34, h: 34 },
  quarry:     { baseColor: '#b0b0b0', roofColor: '#696969', accent: '#808080', icon: '🪨', w: 34, h: 32 },
  ironmine:   { baseColor: '#708090', roofColor: '#2f4f4f', accent: '#4682b4', icon: '⛏️', w: 34, h: 34 },
  barracks:   { baseColor: '#cd853f', roofColor: '#8b0000', accent: '#b22222', icon: '⚔️', w: 38, h: 36 },
  stable:     { baseColor: '#deb887', roofColor: '#a0522d', accent: '#8b4513', icon: '🐴', w: 36, h: 34 },
  market:     { baseColor: '#ffd700', roofColor: '#daa520', accent: '#b8860b', icon: '🪙', w: 36, h: 34 },
  warehouse:  { baseColor: '#d2b48c', roofColor: '#8b7355', accent: '#a0522d', icon: '📦', w: 38, h: 36 },
  wall:       { baseColor: '#808080', roofColor: '#696969', accent: '#a9a9a9', icon: '🧱', w: 30, h: 28 },
  tower:      { baseColor: '#808080', roofColor: '#b22222', accent: '#a9a9a9', icon: '🗼', w: 28, h: 42 },
};

/* ── Decorative elements ──────────────────────────────────── */
const TREES = [
  { gx: -4.5, gy: -3 }, { gx: -5, gy: 0 }, { gx: -4.2, gy: 2.5 },
  { gx: 4.5, gy: -2.5 }, { gx: 5, gy: 1 }, { gx: 4.2, gy: 3 },
  { gx: -3.5, gy: -4.5 }, { gx: 3.5, gy: -4 }, { gx: 0, gy: 5 },
  { gx: -2, gy: 5 }, { gx: 2, gy: -5 }, { gx: -5, gy: -2 },
];

const FLOWERS = [
  { gx: -3.8, gy: -1.5, c: '#ff69b4' }, { gx: 3.2, gy: -1, c: '#ffb347' },
  { gx: -1, gy: 4, c: '#ff69b4' }, { gx: 2, gy: 3.8, c: '#87ceeb' },
  { gx: -4, gy: 3.5, c: '#dda0dd' }, { gx: 4, gy: -3.5, c: '#ffb347' },
  { gx: 0.5, gy: -4.5, c: '#ff69b4' }, { gx: -2.5, gy: -4, c: '#98fb98' },
];

const ROCKS = [
  { gx: -4.8, gy: 1.5, s: 0.8 }, { gx: 4.6, gy: -0.5, s: 1 },
  { gx: 3, gy: 4.5, s: 0.6 }, { gx: -3, gy: -3.8, s: 0.9 },
];

/* ── SVG sub-components ───────────────────────────────────── */
function IsoTree({ gx, gy }: { gx: number; gy: number }) {
  const { x, y } = toIso(gx, gy);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-2} y={-8} width={4} height={12} rx={1} fill="#8B5E3C" />
      <ellipse cx={0} cy={-14} rx={10} ry={8} fill="#2d8a4e" />
      <ellipse cx={-4} cy={-11} rx={7} ry={6} fill="#34a853" />
      <ellipse cx={4} cy={-12} rx={7} ry={6} fill="#27ae60" />
      <ellipse cx={0} cy={-18} rx={6} ry={5} fill="#2ecc71" />
    </g>
  );
}

function IsoFlower({ gx, gy, color }: { gx: number; gy: number; color: string }) {
  const { x, y } = toIso(gx, gy);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-5} stroke="#228b22" strokeWidth={1.5} />
      <circle cx={0} cy={-6} r={3} fill={color} />
      <circle cx={0} cy={-6} r={1.2} fill="#fff4b0" />
    </g>
  );
}

function IsoRock({ gx, gy, scale }: { gx: number; gy: number; scale: number }) {
  const { x, y } = toIso(gx, gy);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={-2} rx={6} ry={4} fill="#999" />
      <ellipse cx={-1} cy={-3} rx={4} ry={3} fill="#aaa" />
    </g>
  );
}

/* River path (diagonal through village) */
function River() {
  // River goes from top-right to bottom-left in iso
  const points: { gx: number; gy: number }[] = [
    { gx: 6, gy: -2 }, { gx: 3.5, gy: -1.5 }, { gx: 1, gy: -0.3 },
    { gx: -1.5, gy: 0.8 }, { gx: -3.5, gy: 1.5 }, { gx: -6, gy: 2.5 },
  ];
  const isoPoints = points.map(p => toIso(p.gx, p.gy));
  const d = isoPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <g>
      {/* Water */}
      <path d={d} fill="none" stroke="#4a90d9" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <path d={d} fill="none" stroke="#5da5e8" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      <path d={d} fill="none" stroke="#7ec8f0" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
      {/* Bridge */}
      <Bridge />
    </g>
  );
}

function Bridge() {
  const p = toIso(-0.3, 0.3);
  return (
    <g transform={`translate(${p.x}, ${p.y})`}>
      <rect x={-14} y={-4} width={28} height={10} rx={2} fill="#a0522d" stroke="#8b4513" strokeWidth={1.5} />
      <rect x={-12} y={-3} width={5} height={8} rx={1} fill="#cd853f" />
      <rect x={-5} y={-3} width={5} height={8} rx={1} fill="#cd853f" />
      <rect x={3} y={-3} width={5} height={8} rx={1} fill="#cd853f" />
      {/* Railings */}
      <line x1={-14} y1={-4} x2={14} y2={-4} stroke="#8b4513" strokeWidth={2} />
      <line x1={-14} y1={6} x2={14} y2={6} stroke="#8b4513" strokeWidth={2} />
    </g>
  );
}

/* Dirt paths from center to each building */
function DirtPaths({ buildings }: { buildings: BuildingInstance[] }) {
  const center = toIso(0, 0);
  return (
    <g>
      {buildings.filter((_, i) => i > 0).map((b) => {
        const pos = getSlotPos(b.slotIndex, buildings.length);
        const iso = toIso(pos.gx, pos.gy);
        return (
          <line
            key={`path-${b.id}`}
            x1={center.x} y1={center.y}
            x2={iso.x} y2={iso.y}
            stroke="#c4a76c"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.5}
          />
        );
      })}
    </g>
  );
}

/* ── Building SVG rendering ───────────────────────────────── */
function IsoBuildingSprite({
  building,
  gx,
  gy,
  onClick,
  selected,
}: {
  building: BuildingInstance;
  gx: number;
  gy: number;
  onClick?: () => void;
  selected: boolean;
}) {
  const visual = BUILDING_VISUALS[building.type] ?? BUILDING_VISUALS.house;
  const def = BUILDING_DEFINITIONS[building.type];
  const { x, y } = toIso(gx, gy);
  const levelScale = 1 + building.level * 0.06;
  const isCastle = building.type === 'castle';
  const w = visual.w * levelScale;
  const h = visual.h * levelScale;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${def?.name ?? building.type} nível ${building.level}`}
    >
      {/* Selection glow */}
      {selected && (
        <ellipse cx={0} cy={4} rx={w * 0.5 + 6} ry={h * 0.2 + 4} fill="none" stroke="#d4a827" strokeWidth={2.5} opacity={0.8} style={{ animation: 'slotPulse 1.5s ease-in-out infinite' }} />
      )}

      {/* Shadow */}
      <ellipse cx={0} cy={4} rx={w * 0.45} ry={h * 0.15} fill="rgba(0,0,0,0.2)" />

      {/* Building body */}
      {isCastle ? (
        <CastleBuilding w={w} h={h} level={building.level} visual={visual} />
      ) : (
        <GenericBuilding w={w} h={h} visual={visual} />
      )}

      {/* Level badge */}
      <circle cx={w * 0.35} cy={-h * 0.7} r={8} fill="#d4a827" stroke="#8b6914" strokeWidth={1.5} />
      <text x={w * 0.35} y={-h * 0.7 + 1} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="bold" fill="#1a1208">
        {building.level}
      </text>

      {/* Upgrade indicator */}
      {building.upgradeStartedAt != null && (
        <g>
          <circle cx={-w * 0.35} cy={-h * 0.7} r={7} fill="#2ecc71" opacity={0.9}>
            <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x={-w * 0.35} y={-h * 0.7 + 1} textAnchor="middle" dominantBaseline="central" fontSize={8}>⚒️</text>
        </g>
      )}

      {/* Icon label */}
      <text x={0} y={-h * 0.3} textAnchor="middle" fontSize={isCastle ? 20 : 15}>
        {visual.icon}
      </text>
    </g>
  );
}

function CastleBuilding({ w, h, level, visual }: { w: number; h: number; level: number; visual: BuildingVisual }) {
  const tw = 10; // tower width
  return (
    <g>
      {/* Main body */}
      <rect x={-w * 0.35} y={-h * 0.55} width={w * 0.7} height={h * 0.65} rx={3} fill={visual.baseColor} stroke="#666" strokeWidth={1.5} />
      {/* Windows */}
      <rect x={-w * 0.15} y={-h * 0.4} width={6} height={8} rx={3} fill="#2c3e50" />
      <rect x={w * 0.08} y={-h * 0.4} width={6} height={8} rx={3} fill="#2c3e50" />
      {/* Gate */}
      <rect x={-5} y={-h * 0.1} width={10} height={14} rx={5} fill="#4a3520" />
      {/* Left tower */}
      <rect x={-w * 0.42} y={-h * 0.75} width={tw} height={h * 0.85} rx={2} fill="#999" stroke="#666" strokeWidth={1} />
      <rect x={-w * 0.42 - 2} y={-h * 0.78} width={tw + 4} height={5} fill="#888" />
      {/* Right tower */}
      <rect x={w * 0.42 - tw} y={-h * 0.75} width={tw} height={h * 0.85} rx={2} fill="#999" stroke="#666" strokeWidth={1} />
      <rect x={w * 0.42 - tw - 2} y={-h * 0.78} width={tw + 4} height={5} fill="#888" />
      {/* Crenellations */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((frac, i) => (
        <rect key={i} x={w * frac - 2.5} y={-h * 0.58} width={5} height={5} fill="#777" />
      ))}
      {/* Flag */}
      <line x1={0} y1={-h * 0.55} x2={0} y2={-h * 0.85} stroke="#8b4513" strokeWidth={2} />
      <polygon points={`0,${-h * 0.85} 12,${-h * 0.80} 0,${-h * 0.75}`} fill={visual.roofColor}>
        <animateTransform attributeName="transform" type="rotate" values="-3,0,${-h * 0.80};3,0,${-h * 0.80};-3,0,${-h * 0.80}" dur="2s" repeatCount="indefinite" />
      </polygon>
      {/* Gold trim based on level */}
      {level >= 2 && <rect x={-w * 0.35} y={-h * 0.56} width={w * 0.7} height={3} fill={visual.accent} opacity={0.8} />}
      {level >= 3 && (
        <>
          <circle cx={-w * 0.37} cy={-h * 0.75} r={3} fill={visual.accent} />
          <circle cx={w * 0.37} cy={-h * 0.75} r={3} fill={visual.accent} />
        </>
      )}
    </g>
  );
}

function GenericBuilding({ w, h, visual }: { w: number; h: number; visual: BuildingVisual }) {
  return (
    <g>
      {/* Walls */}
      <rect x={-w * 0.4} y={-h * 0.35} width={w * 0.8} height={h * 0.5} rx={2} fill={visual.baseColor} stroke={visual.accent} strokeWidth={1.5} />
      {/* Roof */}
      <polygon
        points={`${-w * 0.48},${-h * 0.35} 0,${-h * 0.7} ${w * 0.48},${-h * 0.35}`}
        fill={visual.roofColor}
        stroke={visual.accent}
        strokeWidth={1}
      />
      {/* Door */}
      <rect x={-3} y={-h * 0.05} width={6} height={10} rx={3} fill="#4a3520" />
      {/* Window */}
      <rect x={-w * 0.22} y={-h * 0.2} width={5} height={5} rx={1} fill="#87ceeb" stroke={visual.accent} strokeWidth={0.5} />
      <rect x={w * 0.12} y={-h * 0.2} width={5} height={5} rx={1} fill="#87ceeb" stroke={visual.accent} strokeWidth={0.5} />
    </g>
  );
}

/* ── Villagers (tiny animated people) ─────────────────────── */
function Villagers() {
  const villagers = useMemo(() => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 1.2 + Math.random() * 1.5;
      v.push({
        gx: Math.cos(angle) * r,
        gy: Math.sin(angle) * r,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'][i],
        speed: 8 + Math.random() * 6,
      });
    }
    return v;
  }, []);

  return (
    <g>
      {villagers.map((v, i) => {
        const { x, y } = toIso(v.gx, v.gy);
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <animateTransform attributeName="transform" type="translate"
              values={`${x},${y}; ${x + 8},${y + 4}; ${x - 5},${y + 2}; ${x},${y}`}
              dur={`${v.speed}s`} repeatCount="indefinite" />
            {/* Body */}
            <circle cx={0} cy={-3} r={2.5} fill={v.color} />
            {/* Head */}
            <circle cx={0} cy={-7} r={2} fill="#fdd9b5" />
          </g>
        );
      })}
    </g>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export function VillageScene({ city, onBuildingClick }: VillageSceneProps) {
  const sortedBuildings = useMemo(() => {
    return [...city.buildings].sort((a, b) => {
      const posA = getSlotPos(a.slotIndex, city.buildings.length);
      const posB = getSlotPos(b.slotIndex, city.buildings.length);
      return (posA.gx + posA.gy) - (posB.gx + posB.gy);
    });
  }, [city.buildings]);

  return (
    <svg
      viewBox="-320 -240 640 480"
      className="w-full h-full select-none"
      style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #b5e3f5 40%, #90c695 40%, #6aaa5e 100%)' }}
    >
      <defs>
        {/* Grass pattern */}
        <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#6aaa5e" />
          <circle cx="5" cy="8" r="1" fill="#5d9952" opacity={0.5} />
          <circle cx="15" cy="4" r="0.8" fill="#7dbd6f" opacity={0.4} />
          <circle cx="10" cy="16" r="1" fill="#5d9952" opacity={0.3} />
        </pattern>
      </defs>

      {/* Ground — isometric diamond */}
      <g>
        <polygon
          points={`0,-200 300,0 0,200 -300,0`}
          fill="url(#grass)"
          stroke="#5d9952"
          strokeWidth={2}
        />
        {/* Outer dirt ring */}
        <ellipse cx={0} cy={0} rx={200} ry={120} fill="none" stroke="#c4a76c" strokeWidth={4} strokeDasharray="8 6" opacity={0.3} />
      </g>

      {/* River */}
      <River />

      {/* Dirt paths */}
      <DirtPaths buildings={city.buildings} />

      {/* Decorations (behind buildings) */}
      {ROCKS.map((r, i) => <IsoRock key={`r${i}`} gx={r.gx} gy={r.gy} scale={r.s} />)}
      {FLOWERS.map((f, i) => <IsoFlower key={`f${i}`} gx={f.gx} gy={f.gy} color={f.c} />)}

      {/* Trees (back) */}
      {TREES.filter((_, i) => i < 6).map((t, i) => <IsoTree key={`tb${i}`} gx={t.gx} gy={t.gy} />)}

      {/* Buildings — sorted by iso depth */}
      {sortedBuildings.map((building) => {
        const pos = getSlotPos(building.slotIndex, city.buildings.length);
        return (
          <IsoBuildingSprite
            key={building.id}
            building={building}
            gx={pos.gx}
            gy={pos.gy}
            onClick={() => onBuildingClick?.(building.id)}
            selected={false}
          />
        );
      })}

      {/* Trees (front) */}
      {TREES.filter((_, i) => i >= 6).map((t, i) => <IsoTree key={`tf${i}`} gx={t.gx} gy={t.gy} />)}

      {/* Villagers */}
      <Villagers />

      {/* Village name banner */}
      <g transform="translate(0, -210)">
        <rect x={-80} y={-12} width={160} height={24} rx={12} fill="rgba(26,18,8,0.7)" />
        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontFamily='"Cinzel", serif' fontSize={13} fill="#d4a827" fontWeight="bold">
          {city.name}
        </text>
      </g>
    </svg>
  );
}
