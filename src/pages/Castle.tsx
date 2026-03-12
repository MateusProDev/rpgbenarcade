import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CastleView } from '../components/castle/CastleView';
import { ResourceBar } from '../components/ui/ResourceBar';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { loadCastle } from '../modules/castle/castleLogic';
import { useResources } from '../hooks/useResources';

export const Castle: React.FC = () => {
  const navigate  = useNavigate();
  const player    = useAuthStore((s) => s.player);
  const { setCastle } = useGameStore();
  const resources = useResources();

  useEffect(() => {
    if (!player) { navigate('/login'); return; }
    if (!player.castleId) return;
    loadCastle(player.castleId).then((c) => { if (c) setCastle(c); });
  }, [player]);

  return (
    <div className="min-h-screen bg-castle-dark text-parchment-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-castle-dark/95 border-b border-castle-wall backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <Link to="/" className="font-medieval text-castle-gold text-lg">🏰 Bentropy</Link>
        <div className="flex items-center gap-2 flex-wrap">
          {resources && <ResourceBar resources={resources} compact />}
        </div>
        <div className="flex gap-2">
          <Link to="/world"    className="text-parchment-400 hover:text-parchment-100 text-sm">🗺 Mapa</Link>
          <Link to="/alliance" className="text-parchment-400 hover:text-parchment-100 text-sm">🤝 Aliança</Link>
          <Link to="/profile"  className="text-parchment-400 hover:text-parchment-100 text-sm">👤 Perfil</Link>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="pb-0 overflow-hidden h-[calc(100vh-56px)]">
        {!player ? (
          <div className="flex justify-center items-center h-64 text-parchment-400">
            Faça login para continuar...
          </div>
        ) : !player.castleId ? (
          <div className="flex justify-center items-center h-64 text-parchment-400">
            Configurando seu castelo... aguarde um momento.
          </div>
        ) : (
          <CastleView />
        )}
      </main>
    </div>
  );
};
