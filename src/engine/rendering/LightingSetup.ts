/**
 * LightingSetup — creates standard medieval-themed lighting for scenes.
 */

import * as THREE from 'three';

export interface LightingOptions {
  ambientIntensity?: number;
  sunIntensity?: number;
  sunColor?: number;
  sunPosition?: [number, number, number];
  enableShadows?: boolean;
}

const DEFAULTS: Required<LightingOptions> = {
  ambientIntensity: 0.4,
  sunIntensity: 1.2,
  sunColor: 0xfff4e0,
  sunPosition: [50, 80, 30],
  enableShadows: true,
};

export const LightingSetup = {
  /**
   * Creates ambient + directional (sun) lights and returns them as a group.
   */
  create(options: LightingOptions = {}): THREE.Group {
    const opts = { ...DEFAULTS, ...options };
    const group = new THREE.Group();
    group.name = 'LightingSetup';

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, opts.ambientIntensity);
    group.add(ambient);

    // Directional sun light
    const sun = new THREE.DirectionalLight(opts.sunColor, opts.sunIntensity);
    sun.position.set(...opts.sunPosition);

    if (opts.enableShadows) {
      sun.castShadow = true;
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 200;
      sun.shadow.camera.left = -50;
      sun.shadow.camera.right = 50;
      sun.shadow.camera.top = 50;
      sun.shadow.camera.bottom = -50;
    }

    group.add(sun);

    // Hemisphere light for subtle sky/ground color variation
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x3d2817, 0.3);
    group.add(hemisphere);

    return group;
  },
};
