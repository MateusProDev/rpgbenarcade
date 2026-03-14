/**
 * VillageScene — 3D village rendering using @react-three/fiber.
 *
 * Renders the player's city buildings in a 3D scene.
 * Uses the asset loader to dynamically load GLB models.
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import type { City } from '../../types/city';
import { BuildingModel } from './BuildingModel';
import { ErrorBoundary } from '../../ui/ErrorBoundary';

interface VillageSceneProps {
  city: City;
  onBuildingClick?: (buildingId: string) => void;
}

export function VillageScene({ city, onBuildingClick }: VillageSceneProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full h-full bg-castle-dark flex items-center justify-center">
          <p className="font-medieval text-parchment-300">Erro ao carregar cena 3D. Verifique se WebGL está habilitado.</p>
        </div>
      }
    >
    <Canvas
      shadows
      camera={{ position: [30, 40, 30], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
      <hemisphereLight args={['#87ceeb', '#3d2817', 0.3]} />

      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 32, 32]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>

      {/* Buildings */}
      <Suspense fallback={null}>
        {city.buildings.map((building) => (
          <BuildingModel
            key={building.id}
            building={building}
            onClick={() => onBuildingClick?.(building.id)}
          />
        ))}
      </Suspense>

      <OrbitControls
        target={[0, 0, 0]}
        minDistance={15}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.5}
        enablePan
      />
      <Environment preset="sunset" />
      <fog attach="fog" args={['#1a1208', 80, 200]} />
    </Canvas>
    </ErrorBoundary>
  );
}
