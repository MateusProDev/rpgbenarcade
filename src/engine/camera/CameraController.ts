/**
 * CameraController — manages camera position and controls.
 *
 * Provides presets for different game views:
 * - Village view (isometric-like)
 * - World map (top-down)
 * - Battle (cinematic)
 */

import * as THREE from 'three';

export interface CameraPreset {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  village: {
    position: [30, 40, 30],
    lookAt: [0, 0, 0],
    fov: 45,
  },
  worldMap: {
    position: [0, 100, 0],
    lookAt: [0, 0, 0],
    fov: 60,
  },
  battle: {
    position: [20, 15, 20],
    lookAt: [0, 2, 0],
    fov: 50,
  },
};

export const CameraController = {
  /**
   * Creates a PerspectiveCamera with a preset.
   */
  createCamera(presetName: string, aspect: number): THREE.PerspectiveCamera {
    const preset = CAMERA_PRESETS[presetName] ?? CAMERA_PRESETS.village;
    const camera = new THREE.PerspectiveCamera(preset.fov, aspect, 0.1, 1000);
    camera.position.set(...preset.position);
    camera.lookAt(new THREE.Vector3(...preset.lookAt));
    return camera;
  },

  /**
   * Smoothly transitions camera to a new position (for animations).
   * Returns an interpolation function to call per frame.
   */
  createTransition(
    camera: THREE.PerspectiveCamera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 1.0,
  ): (deltaTime: number) => boolean {
    const startPos = camera.position.clone();
    const startLookAt = new THREE.Vector3();
    camera.getWorldDirection(startLookAt).add(camera.position);

    let elapsed = 0;

    return (deltaTime: number) => {
      elapsed += deltaTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, targetPosition, ease);
      const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, ease);
      camera.lookAt(currentLookAt);

      return t >= 1; // true when transition is complete
    };
  },
};
