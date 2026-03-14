/**
 * Asset manifest — maps model keys to their GLB URLs.
 *
 * Pipeline: Blender → GLB export → Cloudinary (or public/) → URL here.
 *
 * For local dev, models in public/ are served by Vite.
 * For production, replace URLs with Cloudinary CDN paths.
 */

export interface AssetEntry {
  key: string;
  url: string;
  /** Optional LOD variants (low, medium, high) */
  lod?: {
    low?: string;
    medium?: string;
    high?: string;
  };
}

/**
 * To use Cloudinary in production, set VITE_ASSET_BASE_URL in .env
 * e.g. VITE_ASSET_BASE_URL=https://res.cloudinary.com/your-cloud/raw/upload/v1/models
 */
const BASE = import.meta.env.VITE_ASSET_BASE_URL ?? '';

export const ASSET_MANIFEST: Record<string, AssetEntry> = {
  castle: {
    key: 'castle',
    url: `${BASE}/casteloteste.glb`,
  },
  tree: {
    key: 'tree',
    url: `${BASE}/arvoreum.glb`,
  },
  // Add more models as they're created in Blender:
  // house:    { key: 'house',    url: `${BASE}/house.glb` },
  // farm:     { key: 'farm',     url: `${BASE}/farm.glb` },
  // barracks: { key: 'barracks', url: `${BASE}/barracks.glb` },
};
