const BASE = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;

type Transformation = {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'png';
};

function buildUrl(path: string, t: Transformation = {}): string {
  const parts: string[] = [];
  if (t.width)   parts.push(`w_${t.width}`);
  if (t.height)  parts.push(`h_${t.height}`);
  if (t.quality) parts.push(`q_${t.quality}`);
  if (t.format)  parts.push(`f_${t.format}`);
  const transform = parts.length ? parts.join(',') + '/' : '';
  return `${BASE}/${transform}${path}`;
}

// Assets do jogo
export const assets = {
  castleLevel: (level: number) =>
    buildUrl(`bentropy/castles/castle_lv${level}.webp`, { width: 256, quality: 'auto', format: 'auto' }),
  building: (type: string, level: number) =>
    buildUrl(`bentropy/buildings/${type}_lv${level}.webp`, { width: 128, quality: 'auto', format: 'auto' }),
  troop: (type: string) =>
    buildUrl(`bentropy/troops/${type}.webp`, { width: 64, quality: 'auto', format: 'auto' }),
  mapTile: (tileType: string) =>
    buildUrl(`bentropy/tiles/${tileType}.webp`, { width: 64, quality: 'auto', format: 'auto' }),
  icon: (name: string) =>
    buildUrl(`bentropy/icons/${name}.webp`, { width: 32, quality: 'auto', format: 'auto' }),
  placeholder: (text: string) =>
    `https://placehold.co/128x128/3d3327/d4a827?text=${encodeURIComponent(text)}`,
};

export default assets;
