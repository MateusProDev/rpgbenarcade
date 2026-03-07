import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { MapTile } from '../../types';
import { useWorldMap, useNearbyPlayers } from '../../hooks/useWorld';

const TILE_SIZE = 24;
const VIEWPORT  = 25; // tiles visíveis

const TILE_COLORS: Record<string, string> = {
  grass:          '#2d5a27',
  forest:         '#1e4d2b',
  mountain:       '#4a3728',
  water:          '#1a3a5c',
  resource:       '#8b7355',
  base:           '#8b6914',
  castle_central: '#9b1c1c',
  player_castle:  '#1e3a8a',
};

const TILE_EMOJI: Record<string, string> = {
  resource:       '💎',
  base:           '🏰',
  castle_central: '👑',
  player_castle:  '🛡',
  forest:         '🌲',
  mountain:       '⛰',
  water:          '🌊',
};

interface WorldMapProps {
  worldId:  string;
  myX:      number;
  myY:      number;
  onTileClick?: (tile: MapTile) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ worldId, myX, myY, onTileClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewX, setViewX] = useState(myX);
  const [viewY, setViewY] = useState(myY);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 });

  const tiles   = useWorldMap(worldId, viewX, viewY);
  useNearbyPlayers(worldId, myX, myY); // registra listener de jogadores próximos

  const tileMap = React.useMemo(() => {
    const m = new Map<string, MapTile>();
    tiles.forEach((t) => m.set(`${t.x},${t.y}`, t));
    return m;
  }, [tiles]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = viewX - Math.floor(VIEWPORT / 2);
    const startY = viewY - Math.floor(VIEWPORT / 2);

    for (let dy = 0; dy < VIEWPORT; dy++) {
      for (let dx = 0; dx < VIEWPORT; dx++) {
        const tx = startX + dx;
        const ty = startY + dy;
        const tile = tileMap.get(`${tx},${ty}`);

        const px = dx * TILE_SIZE;
        const py = dy * TILE_SIZE;

        // Fundo do tile
        ctx.fillStyle = tile ? (TILE_COLORS[tile.type] ?? TILE_COLORS.grass) : '#111';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Borda do tile
        ctx.strokeStyle = '#1a1208';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Destaque do castelo do jogador
        if (tx === myX && ty === myY) {
          ctx.strokeStyle = '#d4a827';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }

        // Emoji em tiles especiais
        if (tile && TILE_EMOJI[tile.type]) {
          ctx.font = `${TILE_SIZE * 0.6}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(TILE_EMOJI[tile.type], px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        }
      }
    }

    // Mini-indicador de posição central
    const cx = Math.floor(VIEWPORT / 2) * TILE_SIZE;
    const cy = Math.floor(VIEWPORT / 2) * TILE_SIZE;
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.stroke();
  }, [tileMap, viewX, viewY, myX, myY]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = Math.floor((dragStart.x - e.clientX) / TILE_SIZE);
    const dy = Math.floor((dragStart.y - e.clientY) / TILE_SIZE);
    if (dx !== 0 || dy !== 0) {
      setViewX((v) => Math.max(0, Math.min(49, v + dx)));
      setViewY((v) => Math.max(0, Math.min(49, v + dy)));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const cx    = e.clientX - rect.left;
    const cy    = e.clientY - rect.top;
    const dx    = Math.floor(cx / TILE_SIZE);
    const dy    = Math.floor(cy / TILE_SIZE);
    const tileX = viewX - Math.floor(VIEWPORT / 2) + dx;
    const tileY = viewY - Math.floor(VIEWPORT / 2) + dy;
    const tile  = tileMap.get(`${tileX},${tileY}`);
    if (tile && onTileClick) onTileClick(tile);
  };

  const size = TILE_SIZE * VIEWPORT;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-parchment-400 text-xs">
        Vista: [{viewX}, {viewY}] • Arraste para navegar
      </div>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg border border-castle-gold cursor-grab active:cursor-grabbing"
        style={{ imageRendering: 'pixelated' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      <div className="flex gap-3 text-xs text-parchment-400 flex-wrap justify-center">
        {Object.entries(TILE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: color }} />
            {type.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
};
