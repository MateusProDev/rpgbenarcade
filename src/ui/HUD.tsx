// ============================================
// HUD — HP, Mana, XP bars + player info + action bar
// ============================================
import { useGameStore } from '@/store/gameStore';

export function HUD() {
  const player = useGameStore((s) => s.player);
  const openPanel = useGameStore((s) => s.openPanel);
  const currentZone = useGameStore((s) => s.currentZone);
  const engineReady = useGameStore((s) => s.engineReady);

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

      {/* Bottom-left: Quick action buttons */}
      <div className="absolute bottom-20 left-3 z-10 flex gap-2">
        <ActionButton icon="🎒" label="Inventário" shortcut="I" onClick={() => openPanel('inventory')} />
        <ActionButton icon="👥" label="Aliança" shortcut="G" onClick={() => openPanel('alliance')} />
        <ActionButton icon="📜" label="Quests" shortcut="Q" onClick={() => openPanel('quest')} />
        <ActionButton icon="⚒️" label="Crafting" shortcut="C" onClick={() => openPanel('crafting')} />
        <ActionButton icon="⚙️" label="Config" shortcut="Esc" onClick={() => openPanel('settings')} />
      </div>

      {/* Bottom-center: Control hints (show only first 20 seconds) */}
      <ControlHints />
    </>
  );
}

/* ---- Control Hints (fade out after some seconds) ---- */
function ControlHints() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      <div className="glass-panel px-4 py-2 flex gap-4 text-text-dim text-[10px]">
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">WASD</kbd> Mover</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">E</kbd> Interagir</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">1-5</kbd> Skills</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">I</kbd> Inventário</span>
        <span><kbd className="text-gold-accent bg-black/40 px-1 rounded">ESC</kbd> Menu</span>
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

/* ---- Quick Action Button ---- */
function ActionButton({
  icon, label, shortcut, onClick,
}: {
  icon: string; label: string; shortcut: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel w-10 h-10 flex items-center justify-center text-lg hover:bg-glow-gold transition-all active:scale-95 relative group"
      title={`${label} (${shortcut})`}
    >
      {icon}
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-text-dim bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label} [{shortcut}]
      </span>
    </button>
  );
}
