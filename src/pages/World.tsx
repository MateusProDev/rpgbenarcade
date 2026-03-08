import React, { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorldMap } from '../components/world/WorldMap';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import type { MapTile } from '../types';

const TreeViewer = lazy(() =>
  import('../components/world/TreeViewer').then((m) => ({ default: m.TreeViewer }))
);

export const World: React.FC = () => {
  const navigate   = useNavigate();
  const player     = useAuthStore((s) => s.player);
  const castle     = useGameStore((s) => s.castle);
  const [selected, setSelected] = useState<MapTile | null>(null);

  if (!player?.worldId) {
    return (
      <div className="min-h-screen bg-castle-dark flex items-center justify-center text-parchment-400">
        <div className="text-center">
          <p className="mb-4">Você ainda não está em nenhum mundo.</p>
          <Button onClick={() => navigate('/login')}>Entrar no Jogo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-castle-dark text-parchment-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-castle-dark/95 border-b border-castle-wall px-4 py-2 flex items-center justify-between">
        <Link to="/" className="font-medieval text-castle-gold text-lg">🏰 Bentropy</Link>
        <span className="text-parchment-400 text-sm">Mundo: {player.worldId}</span>
        <div className="flex gap-2">
          <Link to="/castle"   className="text-parchment-400 hover:text-parchment-100 text-sm">🏰 Castelo</Link>
          <Link to="/alliance" className="text-parchment-400 hover:text-parchment-100 text-sm">🤝 Aliança</Link>
        </div>
      </nav>

      <main className="p-4 flex flex-col items-center gap-4">
        <h1 className="font-medieval text-2xl text-castle-gold">Mapa do Mundo</h1>

        <WorldMap
          worldId={player.worldId}
          myX={castle?.mapX ?? 25}
          myY={castle?.mapY ?? 25}
          onTileClick={setSelected}
        />

        {/* Painel de informações do tile selecionado */}
        {selected && (
          <div className="bg-castle-stone border border-castle-wall rounded-xl p-4 max-w-sm w-full">
            <h3 className="font-medieval text-parchment-100 mb-2">
              Tile [{selected.x}, {selected.y}]
            </h3>
            <p className="text-parchment-400 text-sm">Tipo: {selected.type.replace('_', ' ')}</p>
            <p className="text-parchment-400 text-sm">Nível de recurso: {selected.level}</p>

            {/* ── Visualizador 3D para tiles de floresta ── */}
            {selected.type === 'forest' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-40 text-green-500/60 text-sm">
                    🌲 Carregando floresta…
                  </div>
                }
              >
                <TreeViewer height={240} autoRotate className="mt-3" />
              </Suspense>
            )}

            {selected.type === 'resource' && (
              <p className="text-parchment-400 text-sm">
                Recurso: {selected.resourceType} × {selected.resourceAmount}
              </p>
            )}
            {selected.ownerId && (
              <p className="text-parchment-400 text-sm">Dono: {selected.ownerId}</p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {selected.type === 'resource' && (
                <Button size="sm" variant="secondary">⛏ Coletar</Button>
              )}
              {selected.type === 'player_castle' && selected.ownerId !== player.uid && (
                <Button size="sm" variant="danger">⚔️ Atacar</Button>
              )}
              {selected.type === 'base' && (
                <Button size="sm" variant="primary">🏴 Conquistar</Button>
              )}
            </div>
          </div>
        )}
      </main>

      <Modal open={false} onClose={() => {}} title="Marcha">
        {/* TODO: modal de envio de tropas */}
        <div />
      </Modal>
    </div>
  );
};
