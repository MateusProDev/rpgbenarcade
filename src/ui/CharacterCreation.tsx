// ============================================
// Character Creation — class selection + name
// ============================================
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { savePlayer } from '@/services/firebase/firestore';
import { CLASS_BASE_STATS, type PlayerClass, type PlayerData } from '@/store/types';
import { getClassSkills } from '@/data/skills';

const classes: { id: PlayerClass; label: string; icon: string; desc: string }[] = [
  { id: 'warrior', label: 'Guerreiro', icon: '⚔️', desc: 'Alta defesa e HP. Combate corpo-a-corpo devastador.' },
  { id: 'mage', label: 'Mago', icon: '🔮', desc: 'Alto dano mágico em área. Suporte com cura.' },
  { id: 'archer', label: 'Arqueiro', icon: '🏹', desc: 'Longo alcance com alta precisão e mobilidade.' },
  { id: 'assassin', label: 'Assassino', icon: '🗡️', desc: 'Dano explosivo e maior velocidade. Crits letais.' },
];

export function CharacterCreation({ onComplete }: { onComplete: () => void }) {
  const user = useAuthStore((s) => s.user);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('warrior');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stats = CLASS_BASE_STATS[selectedClass];

  const handleCreate = async () => {
    if (!user) return;
    if (name.trim().length < 3) {
      setError('Nome precisa ter pelo menos 3 caracteres');
      return;
    }
    if (name.trim().length > 16) {
      setError('Nome pode ter no máximo 16 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const initialSkills = getClassSkills(selectedClass, 1).slice(0, 3).map((s) => s.id);

      const playerData: PlayerData = {
        uid: user.uid,
        name: name.trim(),
        level: 1,
        xp: 0,
        xpToNext: 100,
        gold: 50,
        stats: { ...stats },
        className: selectedClass,
        zone: 'town',
        position: { x: 800, y: 640 },
        direction: 'down',
        inventory: [],
        equippedSkills: initialSkills,
        allianceId: null,
        pvpRating: 1000,
        titles: ['Novato'],
        activeTitle: 'Novato',
        createdAt: Date.now(),
      };

      await savePlayer(user.uid, playerData);
      setPlayer(playerData);
      onComplete();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar personagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-bg-dark">
      <div className="glass-panel p-8 w-[480px] animate-fade-in">
        <h2 className="text-2xl font-bold text-gold-accent text-center mb-6 font-display">
          Criar Personagem
        </h2>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-text-dim text-xs mb-1 uppercase tracking-wider">
            Nome do Personagem
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-border-gold rounded-md text-text-light focus:outline-none focus:border-gold-accent"
            placeholder="Seu nome no mundo..."
            maxLength={16}
          />
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-text-dim text-xs mb-2 uppercase tracking-wider">
            Classe
          </label>
          <div className="grid grid-cols-2 gap-3">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedClass === c.id
                    ? 'border-gold-accent bg-glow-gold'
                    : 'border-border-dim hover:border-border-gold'
                }`}
              >
                <div className="text-lg">{c.icon} {c.label}</div>
                <div className="text-text-dim text-xs mt-1">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mb-6 p-3 bg-black/30 rounded-lg">
          <div className="text-xs text-text-dim uppercase tracking-wider mb-2">
            Atributos Base
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Stat label="HP" value={stats.maxHp} color="var(--color-hp)" />
            <Stat label="Mana" value={stats.maxMana} color="var(--color-mana)" />
            <Stat label="Ataque" value={stats.attack} color="var(--color-accent-red)" />
            <Stat label="Defesa" value={stats.defense} color="var(--color-accent-blue)" />
            <Stat label="Velocidade" value={stats.speed} color="var(--color-accent-green)" />
            <Stat label="Crítico" value={`${(stats.critRate * 100).toFixed(0)}%`} color="var(--color-gold-accent)" />
          </div>
        </div>

        {error && (
            <div className="text-accent-red text-sm bg-red-900/20 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || name.trim().length < 3}
          className="w-full py-3 bg-gradient-to-r from-gold-accent to-yellow-600 text-black font-bold rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? '⏳ Criando...' : '✨ Criar Personagem'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-dim">{label}</span>
      <span style={{ color }} className="font-bold">{value}</span>
    </div>
  );
}
