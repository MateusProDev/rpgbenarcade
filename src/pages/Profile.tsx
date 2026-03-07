import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { signOut } from '../services/auth';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, player } = useAuthStore();
  const castle            = useGameStore((s) => s.castle);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || !player) return (
    <div className="min-h-screen bg-castle-dark flex items-center justify-center text-parchment-400">
      <Button onClick={() => navigate('/login')}>Fazer Login</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-castle-dark text-parchment-100">
      <nav className="sticky top-0 z-40 bg-castle-dark/95 border-b border-castle-wall px-4 py-2 flex items-center justify-between">
        <Link to="/" className="font-medieval text-castle-gold text-lg">🏰 Bentropy</Link>
        <div className="flex gap-2">
          <Link to="/castle"   className="text-parchment-400 hover:text-parchment-100 text-sm">🏰</Link>
          <Link to="/world"    className="text-parchment-400 hover:text-parchment-100 text-sm">🗺</Link>
          <Link to="/alliance" className="text-parchment-400 hover:text-parchment-100 text-sm">🤝</Link>
        </div>
      </nav>

      <main className="p-4 max-w-lg mx-auto">
        <h1 className="font-medieval text-2xl text-castle-gold mb-6">Perfil</h1>

        <div className="bg-castle-stone border border-castle-gold rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-castle-gold" />
            )}
            <div>
              <h2 className="font-medieval text-xl text-parchment-100">{player.displayName}</h2>
              <p className="text-parchment-400 text-sm">{user.email}</p>
              {player.vip && (
                <span className="bg-castle-gold/20 border border-castle-gold rounded px-2 py-0.5 text-xs text-castle-gold">
                  ⭐ VIP {player.vipLevel}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-castle-dark rounded-lg p-3">
              <p className="text-parchment-500 text-xs">Castelo</p>
              <p className="text-parchment-200 font-bold">Nível {castle?.level ?? '—'}</p>
            </div>
            <div className="bg-castle-dark rounded-lg p-3">
              <p className="text-parchment-500 text-xs">Mundo</p>
              <p className="text-parchment-200 font-bold truncate">{player.worldId ?? '—'}</p>
            </div>
            <div className="bg-castle-dark rounded-lg p-3">
              <p className="text-parchment-500 text-xs">Aliança</p>
              <p className="text-parchment-200 font-bold">{player.allianceId ? '✅ Sim' : 'Nenhuma'}</p>
            </div>
            <div className="bg-castle-dark rounded-lg p-3">
              <p className="text-parchment-500 text-xs">Posição</p>
              <p className="text-parchment-200 font-bold">
                [{castle?.mapX ?? '—'}, {castle?.mapY ?? '—'}]
              </p>
            </div>
          </div>

          <Button variant="danger" onClick={handleLogout} className="w-full">
            🚪 Sair
          </Button>
        </div>
      </main>
    </div>
  );
};
