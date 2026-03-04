// ============================================
// HUD — HP, Mana, XP bars + player info + action bar
// ============================================
import type React from 'react';
import { useGameStore } from '@/store/gameStore';

export function HUD() {
  const player = useGameStore((s) => s.player);
  const openPanel = useGameStore((s) => s.openPanel);
  const currentZone = useGameStore((s) => s.currentZone);

  if (!player) return null;

  const hpRatio = player.stats.hp / player.stats.maxHp;
  const manaRatio = player.stats.mana / player.stats.maxMana;
  const xpRatio = player.stats.hp > 0 ? player.xp / player.xpToNext : 0;

  return (
    <>
      {/* Top-left: Player info + bars */}
      <div className="absolute top-3 left-3 z-10 animate-fade-in">
        <div className="glass-panel p-3 w-64">
          {/* Player name + level */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-gold-accent font-bold text-sm">
                Lv.{player.level}
              </span>
              <span className="text-text-light font-bold text-sm truncate">
                {player.name}
              </span>
            </div>
            <span className="text-text-dim text-xs capitalize">
              {player.className}
            </span>
          </div>

          {/* HP Bar */}
          <ResourceBar
            label="HP"
            current={player.stats.hp}
            max={player.stats.maxHp}
            ratio={hpRatio}
            color="var(--color-hp)"
            bgColor="rgba(204, 51, 68, 0.15)"
          />

          {/* Mana Bar */}
          <ResourceBar
            label="MP"
            current={player.stats.mana}
            max={player.stats.maxMana}
            ratio={manaRatio}
            color="var(--color-mana)"
            bgColor="rgba(51, 136, 221, 0.15)"
          />

          {/* XP Bar */}
          <ResourceBar
            label="XP"
            current={player.xp}
            max={player.xpToNext}
            ratio={xpRatio}
            color="var(--color-xp)"
            bgColor="rgba(204, 170, 68, 0.1)"
            thin
          />

          {/* Gold */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-text-dim text-xs">🪙 {player.gold}</span>
            <span className="text-text-dim text-xs">⚔️ {player.pvpRating}</span>
          </div>
        </div>
      </div>

      {/* Top-center: Zone name */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="glass-panel px-4 py-1.5">
          <span className="text-text-dim text-xs uppercase tracking-wider">
            {currentZone.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Bottom-left: Quick action buttons (same row as SkillBar) */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
        <ActionButton icon="inventory" label="Inventário" shortcut="I" onClick={() => openPanel('inventory')} />
        <ActionButton icon="alliance"  label="Aliança"   shortcut="G" onClick={() => openPanel('alliance')} />
        <ActionButton icon="quests"    label="Quests"    shortcut="Q" onClick={() => openPanel('quest')} />
        <ActionButton icon="crafting"  label="Crafting"  shortcut="C" onClick={() => openPanel('crafting')} />
        <ActionButton icon="settings"  label="Config"    shortcut="Esc" onClick={() => openPanel('settings')} />
      </div>

      {/* Bottom-right: tiny control hints */}
      <ControlHints />
    </>
  );
}

/* ---- Control Hints — bottom-right, compact ---- */
function ControlHints() {
  return (
    <div className="absolute bottom-4 right-3 z-10">
      <div className="glass-panel px-3 py-1.5 flex gap-3 text-text-dim text-[9px]">
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">WASD</kbd> Mover</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">E</kbd> Interagir</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">1-5</kbd> Skills</span>
      </div>
    </div>
  );
}

/* ---- Resource Bar ---- */
function ResourceBar({
  label, current, max, ratio, color, bgColor, thin = false,
}: {
  label: string; current: number; max: number; ratio: number;
  color: string; bgColor: string; thin?: boolean;
}) {
  const height = thin ? 'h-2' : 'h-4';
  return (
    <div className={`relative ${height} w-full rounded-full overflow-hidden mb-1.5`} style={{ background: bgColor }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
        style={{ width: `${Math.max(0, ratio * 100)}%`, background: color }}
      />
      {!thin && (
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="text-[9px] font-bold text-white/90 drop-shadow">{label}</span>
          <span className="text-[9px] font-bold text-white/90 drop-shadow">
            {Math.floor(current)}/{max}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---- Quick Action Button with SVG medieval icons ---- */
const ICONS: Record<string, React.ReactNode> = {
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {/* Medieval leather satchel/backpack */}
      <path d="M8 6V5a2 2 0 014 0v1" />
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <path d="M4 11h16" />
      <path d="M9 11v4m6-4v4" />
      <circle cx="12" cy="8.5" r="1" fill="currentColor" />
    </svg>
  ),
  alliance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {/* Two crossed swords */}
      <line x1="5" y1="19" x2="19" y2="5" />
      <line x1="19" y1="19" x2="5" y2="5" />
      <line x1="8" y1="5" x2="5" y2="5" /><line x1="5" y1="8" x2="5" y2="5" />
      <line x1="16" y1="19" x2="19" y2="19" /><line x1="19" y1="16" x2="19" y2="19" />
    </svg>
  ),
  quests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {/* Scroll / parchment */}
      <path d="M6 3h12a1 1 0 011 1v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a1 1 0 011-1z" />
      <path d="M7 3v2a1 1 0 001 1h8a1 1 0 001-1V3" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="15" x2="13" y2="15" />
      <line x1="9" y1="9"  x2="15" y2="9"  />
    </svg>
  ),
  crafting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {/* Hammer + anvil */}
      <rect x="4" y="14" width="12" height="6" rx="1" />
      <path d="M7 14v-2h6v2" />
      <rect x="12" y="4" width="5" height="3" rx="0.5" />
      <line x1="14.5" y1="7" x2="14.5" y2="12" />
      <line x1="12" y1="5.5" x2="10" y2="8" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {/* Gear */}
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

function ActionButton({
  icon, label, shortcut, onClick,
}: {
  icon: string; label: string; shortcut: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel w-10 h-10 flex items-center justify-center text-text-dim hover:text-gold-accent hover:bg-glow-gold transition-all active:scale-95 relative group"
      title={`${label} (${shortcut})`}
    >
      {ICONS[icon]}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-text-dim bg-black/90 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label} [{shortcut}]
      </span>
    </button>
  );
}
