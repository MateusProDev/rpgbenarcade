// ============================================
// Pause Menu — settings, logout, resume
// ============================================
import { useGameStore } from '@/store/gameStore';
import { getEngine, setEngine } from '@/engine/GameEngine';
import { signOut } from '@/services/firebase/auth';

export function PauseMenu({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const ui = useGameStore((s) => s.ui);
  const setPlayer = useGameStore((s) => s.setPlayer);

  const handleLogout = async () => {
    const engine = getEngine();
    if (engine) {
      engine.destroy();
      setEngine(null);
    }
    setPlayer(null);
    await signOut();
  };

  const toggleSetting = (key: 'showDamageNumbers' | 'showNames' | 'screenShake') => {
    const state = useGameStore.getState();
    useGameStore.setState({
      ui: { ...state.ui, [key]: !state.ui[key] },
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="glass-panel w-80 p-5 space-y-4">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gold-accent">⚙️ Menu</h2>
          {player && (
            <p className="text-xs text-text-dim mt-1">
              {player.name} · Lv.{player.level} {player.className}
            </p>
          )}
        </div>

        <div className="h-px bg-border-dim" />

        {/* Settings toggles */}
        <div className="space-y-2">
          <h3 className="text-xs text-text-dim uppercase tracking-wider">Configurações</h3>

          <ToggleRow
            label="Números de dano"
            enabled={ui.showDamageNumbers}
            onChange={() => toggleSetting('showDamageNumbers')}
          />
          <ToggleRow
            label="Nomes dos jogadores"
            enabled={ui.showNames}
            onChange={() => toggleSetting('showNames')}
          />
          <ToggleRow
            label="Tremor de tela"
            enabled={ui.screenShake}
            onChange={() => toggleSetting('screenShake')}
          />
        </div>

        <div className="h-px bg-border-dim" />

        {/* Stats summary */}
        {player && (
          <div className="space-y-1">
            <h3 className="text-xs text-text-dim uppercase tracking-wider">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
              <StatRow label="Ataque" value={player.stats.attack} />
              <StatRow label="Defesa" value={player.stats.defense} />
              <StatRow label="Velocidade" value={player.stats.speed} />
              <StatRow label="Crit" value={`${(player.stats.critRate * 100).toFixed(0)}%`} />
              <StatRow label="Crit Dano" value={`${player.stats.critDamage}x`} />
              <StatRow label="PvP Rating" value={player.pvpRating} />
            </div>
          </div>
        )}

        <div className="h-px bg-border-dim" />

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-bold rounded bg-glow-gold text-gold-accent border border-border-gold hover:bg-gold-accent/30 transition-colors"
          >
            ▶ Continuar jogando
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm font-bold rounded bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors"
          >
            🚪 Sair
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Toggle row ---- */
function ToggleRow({
  label, enabled, onChange,
}: {
  label: string; enabled: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-light">{label}</span>
      <button
        onClick={onChange}
        className={`w-9 h-5 rounded-full transition-colors relative ${
          enabled ? 'bg-accent-green' : 'bg-border-dim'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/* ---- Stat row ---- */
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <span className="text-text-dim">{label}</span>
      <span className="text-text-light text-right">{value}</span>
    </>
  );
}
