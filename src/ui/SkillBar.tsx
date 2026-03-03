// ============================================
// Skill Bar — bottom-center skill slots with cooldown
// ============================================
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SKILL_DEFS } from '@/data/skills';

const SLOT_KEYS = ['1', '2', '3', '4', '5'];

export function SkillBar() {
  const player = useGameStore((s) => s.player);
  const skillCooldowns = useGameStore((s) => s.skillCooldowns);
  const [now, setNow] = useState(Date.now());

  // Tick for cooldown display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  if (!player) return null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      <div className="glass-panel p-2 flex gap-1.5">
        {player.equippedSkills.map((skillId, idx) => {
          const skill = SKILL_DEFS[skillId];
          const cd = skillCooldowns.find((c) => c.skillId === skillId);
          const remaining = cd ? Math.max(0, (cd.readyAt - now) / 1000) : 0;
          const isOnCd = remaining > 0;

          return (
            <div key={idx} className="relative group">
              <button
                className={`w-12 h-12 rounded-lg border flex items-center justify-center text-xl transition-all ${
                  isOnCd
                    ? 'border-[var(--color-border-dim)] opacity-50 cursor-not-allowed'
                    : 'border-[var(--color-border-gold)] hover:border-[var(--color-gold-accent)] hover:bg-[var(--color-glow-gold)] active:scale-90'
                }`}
                disabled={isOnCd}
              >
                {skill?.icon ?? '❓'}

                {/* Cooldown overlay */}
                {isOnCd && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {remaining.toFixed(1)}
                    </span>
                  </div>
                )}
              </button>

              {/* Hotkey label */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 rounded text-[9px] flex items-center justify-center text-[var(--color-text-dim)]">
                {SLOT_KEYS[idx]}
              </div>

              {/* Tooltip */}
              {skill && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-panel p-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="text-sm font-bold text-[var(--color-gold-accent)]">
                    {skill.icon} {skill.name}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
                    {skill.description}
                  </div>
                  <div className="flex gap-3 mt-1.5 text-[10px]">
                    <span className="text-[var(--color-mana)]">💧 {skill.manaCost}</span>
                    <span className="text-[var(--color-text-dim)]">⏱️ {skill.cooldown}s</span>
                    <span className="text-[var(--color-accent-red)]">⚔️ {skill.baseDamage}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Fill remaining slots */}
        {Array.from({ length: Math.max(0, 5 - player.equippedSkills.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-12 h-12 rounded-lg border border-[var(--color-border-dim)] flex items-center justify-center text-[var(--color-text-dim)] opacity-30"
          >
            <span className="text-xs">—</span>
          </div>
        ))}
      </div>
    </div>
  );
}
