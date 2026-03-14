/**
 * SceneManager — manages Three.js scene lifecycle.
 *
 * Handles creating, populating and disposing scenes.
 * Used by React components via hooks, not directly.
 */

import * as THREE from 'three';
import { LightingSetup } from '../rendering/LightingSetup';

export const SceneManager = {
  /**
   * Creates a new scene with default settings (background, fog, lighting).
   */
  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0xc8dbe0, 0.008);

    // Default lighting
    const lights = LightingSetup.create();
    scene.add(lights);

    return scene;
  },

  /**
   * Creates a basic ground plane (terrain placeholder).
   */
  createTerrain(width = 200, depth = 200): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, depth, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a7c3f,
      roughness: 0.9,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.name = 'Terrain';
    return mesh;
  },

  /**
   * Disposes all objects in a scene to free memory.
   */
  disposeScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    scene.clear();
  },
};
