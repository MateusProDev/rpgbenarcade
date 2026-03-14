/**
 * WorldMapView — renders the world map using canvas (2D overview).
 *
 * This component renders a 2D tile map for strategic overview.
 * The 3D world map view can be added later using Three.js.
 */

import { useEffect, useRef } from 'react';
import type { MapTile } from '../../types/map';
import { MapSystem } from '../../game/systems/MapSystem';

interface WorldMapViewProps {
  tiles: MapTile[];
  centerX: number;
  centerY: number;
  onTileClick?: (tile: MapTile) => void;
}

const TILE_SIZE = 10;

export function WorldMapView({ tiles, centerX, centerY, onTileClick }: WorldMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Compute viewport
    const halfW = Math.floor(width / TILE_SIZE / 2);
    const halfH = Math.floor(height / TILE_SIZE / 2);
    const viewport = MapSystem.getViewportTiles(tiles, centerX, centerY, halfW, halfH);

    for (const tile of viewport) {
      const px = (tile.x - centerX + halfW) * TILE_SIZE;
      const py = (tile.y - centerY + halfH) * TILE_SIZE;
      ctx.fillStyle = MapSystem.getTileColor(tile.type);
      ctx.fillRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);

      if (tile.occupiedBy) {
        ctx.fillStyle = '#d4a827';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [tiles, centerX, centerY]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !onTileClick) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const halfW = Math.floor(canvas.width / TILE_SIZE / 2);
    const halfH = Math.floor(canvas.height / TILE_SIZE / 2);

    const tileX = Math.floor(mx / TILE_SIZE) - halfW + centerX;
    const tileY = Math.floor(my / TILE_SIZE) - halfH + centerY;

    const tile = tiles.find((t) => t.x === tileX && t.y === tileY);
    if (tile) onTileClick(tile);
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onClick={handleClick}
      className="border border-castle-wall/30 rounded-lg cursor-pointer"
    />
  );
}
