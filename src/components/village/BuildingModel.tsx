/**
 * BuildingModel — renders a single building's 3D model.
 *
 * Loads GLTF models from the asset manifest based on building type.
 * Falls back to a placeholder box if the model isn't available.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { BuildingInstance } from '../../types/buildings';
import { BUILDING_DEFINITIONS } from '../../game/config/buildings.config';
import { ASSET_MANIFEST } from '../../engine/rendering/assetManifest';

interface BuildingModelProps {
  building: BuildingInstance;
  onClick?: () => void;
}

// Grid layout: place buildings in a grid pattern
const SLOT_SPACING = 8;
const GRID_COLS = 5;

function getSlotPosition(slotIndex: number): [number, number, number] {
  const col = slotIndex % GRID_COLS;
  const row = Math.floor(slotIndex / GRID_COLS);
  return [col * SLOT_SPACING - (GRID_COLS * SLOT_SPACING) / 2, 0, row * SLOT_SPACING - 10];
}

export function BuildingModel({ building, onClick }: BuildingModelProps) {
  const def = BUILDING_DEFINITIONS[building.type];
  const modelKey = def?.modelKey ?? building.type;
  const asset = ASSET_MANIFEST[modelKey];
  const position = getSlotPosition(building.slotIndex);

  if (!asset) {
    // Placeholder box when model is not yet in manifest
    return (
      <mesh position={position} onClick={onClick} castShadow>
        <boxGeometry args={[3, 2 + building.level * 0.5, 3]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
    );
  }

  return <LoadedModel url={asset.url} position={position} onClick={onClick} />;
}

function LoadedModel({
  url,
  position,
  onClick,
}: {
  url: string;
  position: [number, number, number];
  onClick?: () => void;
}) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  return (
    <primitive
      object={clonedScene}
      position={position}
      onClick={onClick}
      castShadow
      receiveShadow
    />
  );
}
