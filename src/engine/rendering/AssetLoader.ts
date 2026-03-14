/**
 * AssetLoader — GLTF/GLB model loading with caching and lazy loading.
 *
 * Uses Three.js GLTFLoader. Implements:
 * - Lazy loading (load on demand)
 * - In-memory cache (avoid re-downloading)
 * - LOD support (load different quality levels)
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_MANIFEST, type AssetEntry } from './assetManifest';

const loader = new GLTFLoader();
const cache = new Map<string, GLTF>();
const pendingLoads = new Map<string, Promise<GLTF>>();

export const AssetLoader = {
  /**
   * Load a model by its manifest key. Returns cached version if available.
   */
  async load(key: string, lod?: 'low' | 'medium' | 'high'): Promise<GLTF> {
    const cacheKey = lod ? `${key}_${lod}` : key;

    // Return from cache
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Return pending load (deduplication)
    const pending = pendingLoads.get(cacheKey);
    if (pending) return pending;

    const entry = ASSET_MANIFEST[key];
    if (!entry) throw new Error(`Asset key "${key}" not found in manifest.`);

    const url = this._resolveUrl(entry, lod);
    const promise = this._loadGLTF(url).then((gltf) => {
      cache.set(cacheKey, gltf);
      pendingLoads.delete(cacheKey);
      return gltf;
    });

    pendingLoads.set(cacheKey, promise);
    return promise;
  },

  /**
   * Preload multiple models in parallel.
   */
  async preload(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.load(k)));
  },

  /**
   * Clone a loaded model for placing multiple instances.
   */
  async cloneModel(key: string): Promise<THREE.Group> {
    const gltf = await this.load(key);
    return gltf.scene.clone(true);
  },

  /**
   * Clears the asset cache (e.g. on scene change).
   */
  clearCache(): void {
    for (const [, gltf] of cache) {
      gltf.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    cache.clear();
  },

  /** @internal */
  _resolveUrl(entry: AssetEntry, lod?: 'low' | 'medium' | 'high'): string {
    if (lod && entry.lod?.[lod]) return entry.lod[lod];
    return entry.url;
  },

  /** @internal */
  _loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  },
};
