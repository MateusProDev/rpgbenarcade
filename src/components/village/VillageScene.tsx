/**
 * VillageScene â€” Professional isometric 3D village (Clash of Kings style).
 *
 * Uses Three.js via @react-three/fiber.
 * - Castle GLB model at center
 * - Tree GLB models around edges
 * - Stylized placeholder bases for other buildings (ready for Blender imports)
 * - Lush terrain filling the entire viewport
 * - River, paths, decorations
 */

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { City } from '../../types/city';
import type { BuildingInstance, BuildingType } from '../../types/buildings';
import { BUILDING_DEFINITIONS } from '../../game/config/buildings.config';
import { ASSET_MANIFEST } from '../../engine/rendering/assetManifest';
import { ErrorBoundary } from '../../ui/ErrorBoundary';

/* â•â•â• Props â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
interface VillageSceneProps {
  city: City;
  onBuildingClick?: (buildingId: string) => void;
}

/* â•â•â• Layout â€” Circular ring around castle (slot 0 = center) â• */
const RING_RADIUS = 18;

function getSlotPosition(slotIndex: number, total: number): [number, number, number] {
  if (slotIndex === 0) return [0, 0, 0]; // Castle at center
  const count = Math.max(total - 1, 1);
  const angle = ((slotIndex - 1) / count) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * RING_RADIUS,
    0,
    Math.sin(angle) * RING_RADIUS,
  ];
}

/* â•â•â• Building visual config â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
interface BuildingStyle {
  color: string;
  roofColor: string;
  height: number;
  width: number;
  icon: string;
}

const BUILDING_STYLES: Record<BuildingType, BuildingStyle> = {
  castle:     { color: '#8a8a8a', roofColor: '#b22222', height: 6, width: 5, icon: 'ðŸ°' },
  house:      { color: '#deb887', roofColor: '#d2691e', height: 3, width: 3, icon: 'ðŸ ' },
  farm:       { color: '#8fbc8f', roofColor: '#8b4513', height: 2.5, width: 4, icon: 'ðŸŒ¾' },
  lumbermill: { color: '#d2b48c', roofColor: '#654321', height: 3.5, width: 3.5, icon: 'ðŸªµ' },
  quarry:     { color: '#b0b0b0', roofColor: '#696969', height: 3, width: 3.5, icon: 'ðŸª¨' },
  ironmine:   { color: '#708090', roofColor: '#2f4f4f', height: 3, width: 3.5, icon: 'â›ï¸' },
  barracks:   { color: '#cd853f', roofColor: '#8b0000', height: 4, width: 4, icon: 'âš”ï¸' },
  stable:     { color: '#deb887', roofColor: '#a0522d', height: 3, width: 4.5, icon: 'ðŸ´' },
  market:     { color: '#ffd700', roofColor: '#daa520', height: 3.5, width: 4, icon: 'ðŸª™' },
  warehouse:  { color: '#d2b48c', roofColor: '#8b7355', height: 4, width: 4.5, icon: 'ðŸ“¦' },
  wall:       { color: '#808080', roofColor: '#696969', height: 5, width: 2.5, icon: 'ðŸ§±' },
  tower:      { color: '#808080', roofColor: '#b22222', height: 6, width: 2.5, icon: 'ðŸ—¼' },
};

/* â•â•â• Terrain â€” lush isometric ground â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Terrain() {
  const grassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5a9e3e'),
      roughness: 0.85,
      metalness: 0,
      flatShading: false,
    });
  }, []);

  const dirtMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8B7355'),
      roughness: 0.9,
      metalness: 0,
    });
  }, []);

  return (
    <group>
      {/* Main grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[65, 64]} />
        <primitive object={grassMaterial} attach="material" />
      </mesh>

      {/* Darker grass ring (outer) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <ringGeometry args={[55, 80, 64]} />
        <meshStandardMaterial color="#4a8732" roughness={0.9} />
      </mesh>

      {/* Far terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[120, 64]} />
        <meshStandardMaterial color="#3d7a2a" roughness={0.95} />
      </mesh>

      {/* Central platform (castle area) */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[8, 9, 0.4, 32]} />
        <primitive object={dirtMaterial} attach="material" />
      </mesh>

      {/* Stone foundation ring */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <torusGeometry args={[9, 0.5, 8, 48]} />
        <meshStandardMaterial color="#999" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* â•â•â• River â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function River() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-60, 0.05, -20),
      new THREE.Vector3(-30, 0.05, -15),
      new THREE.Vector3(-10, 0.05, -8),
      new THREE.Vector3(5, 0.05, 2),
      new THREE.Vector3(20, 0.05, 12),
      new THREE.Vector3(40, 0.05, 20),
      new THREE.Vector3(65, 0.05, 28),
    ]);
  }, []);

  const tubeGeom = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 2.5, 8, false);
  }, [curve]);

  return (
    <group>
      <mesh ref={ref} geometry={tubeGeom} receiveShadow>
        <meshStandardMaterial
          color="#3b7dd8"
          roughness={0.2}
          metalness={0.1}
          emissive="#1a4a8a"
          emissiveIntensity={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* River banks */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 3.5, 8, false)} position={[0, -0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#6b5b3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* â•â•â• Bridge â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function WoodBridge() {
  return (
    <group position={[-2, 0.3, -3]} rotation={[0, 0.5, 0]}>
      {/* Planks */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color="#a0522d" roughness={0.8} />
      </mesh>
      {/* Rails */}
      {[-1.8, 1.8].map((z, i) => (
        <group key={i}>
          <mesh position={[-2, 0.5, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 1, 6]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[2, 0.5, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 1, 6]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[0, 0.9, z]} castShadow>
            <boxGeometry args={[5, 0.1, 0.12]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* â•â•â• Dirt Paths â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function DirtPaths({ positions }: { positions: [number, number, number][] }) {
  return (
    <group>
      {positions.map((pos, i) => {
        if (pos[0] === 0 && pos[2] === 0) return null;
        const dir = new THREE.Vector3(pos[0], 0, pos[2]).normalize();
        const len = new THREE.Vector3(pos[0], 0, pos[2]).length() - 3;
        const mid = dir.clone().multiplyScalar(len / 2 + 1.5);
        const angle = Math.atan2(dir.x, dir.z);
        return (
          <mesh key={i} position={[mid.x, 0.02, mid.z]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
            <planeGeometry args={[2.2, len]} />
            <meshStandardMaterial color="#a0926b" roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

/* â•â•â• GLB Model Loader â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function GLBModel({ url, position, scale = 1, rotation = 0, onClick }: {
  url: string;
  position: [number, number, number];
  scale?: number;
  rotation?: number;
  onClick?: () => void;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[0, rotation, 0]}
      onClick={onClick}
    />
  );
}

/* â•â•â• Placeholder Building (base + label â€” ready for GLB swap) */
function PlaceholderBuilding({ building, position, onClick }: {
  building: BuildingInstance;
  position: [number, number, number];
  onClick?: () => void;
}) {
  const style = BUILDING_STYLES[building.type] ?? BUILDING_STYLES.house;
  const def = BUILDING_DEFINITIONS[building.type];
  const h = style.height * (1 + building.level * 0.08);
  const w = style.width;
  const upgrading = building.upgradeStartedAt != null;

  return (
    <group position={position} onClick={onClick}>
      {/* Foundation platform */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.7, w * 0.75, 0.3, 16]} />
        <meshStandardMaterial color="#8a7d6b" roughness={0.9} />
      </mesh>

      {/* Building body */}
      <mesh position={[0, h / 2 + 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={style.color} roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, h + 0.25, 0]} castShadow>
        <coneGeometry args={[w * 0.75, h * 0.4, 4]} />
        <meshStandardMaterial color={style.roofColor} roughness={0.6} />
      </mesh>

      {/* Level indicator ring */}
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[w * 0.75, 0.15, 6, 24]} />
        <meshStandardMaterial color="#d4a827" emissive="#d4a827" emissiveIntensity={0.3} />
      </mesh>

      {/* Upgrade spinning indicator */}
      {upgrading && <UpgradeIndicator y={h + h * 0.4 + 1} />}

      {/* HTML overlay label */}
      <Html position={[0, h + h * 0.4 + 0.5, 0]} center distanceFactor={50} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none text-center whitespace-nowrap">
          <div className="text-xs font-medieval text-white bg-black/60 rounded px-1.5 py-0.5 backdrop-blur-sm">
            {def?.name ?? building.type} <span className="text-castle-gold font-bold">Lv.{building.level}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* Spinning golden ring for upgrades */
function UpgradeIndicator({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 2;
      ref.current.rotation.x = Math.sin(clock.elapsedTime) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <torusGeometry args={[1, 0.12, 8, 24]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.5} />
    </mesh>
  );
}

/* â•â•â• Decorative Trees (from GLB) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const TREE_POSITIONS: [number, number, number][] = [
  [-35, 0, -25], [-28, 0, -30], [-40, 0, -10], [-38, 0, 5],
  [-32, 0, 18], [-25, 0, 28], [-15, 0, 32],
  [35, 0, -22], [30, 0, -28], [40, 0, -5], [38, 0, 10],
  [28, 0, 22], [20, 0, 30], [10, 0, 35],
  [-20, 0, -33], [0, 0, -38], [18, 0, -35],
  [-10, 0, 38], [5, 0, 40], [15, 0, -40],
  [-45, 0, -18], [45, 0, 15], [-42, 0, 22], [42, 0, -18],
];

function ForestRing() {
  const treeAsset = ASSET_MANIFEST.tree;
  if (!treeAsset) return <FallbackTrees />;

  return (
    <Suspense fallback={<FallbackTrees />}>
      {TREE_POSITIONS.map((pos, i) => (
        <GLBModel
          key={i}
          url={treeAsset.url}
          position={pos}
          scale={1.2 + Math.sin(i * 7) * 0.4}
          rotation={i * 1.3}
        />
      ))}
    </Suspense>
  );
}

function FallbackTrees() {
  return (
    <group>
      {TREE_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 3, 6]} />
            <meshStandardMaterial color="#8B5E3C" />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <sphereGeometry args={[2 + Math.sin(i) * 0.5, 8, 8]} />
            <meshStandardMaterial color="#2d8a4e" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* â•â•â• Decorative rocks & bushes â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Decorations() {
  return (
    <group>
      {/* Rocks */}
      {[
        [-22, 0, -18], [25, 0, 16], [-18, 0, 20], [20, 0, -22],
        [-30, 0, 2], [32, 0, -8], [8, 0, -28], [-8, 0, 30],
      ].map((pos, i) => (
        <mesh key={`rock-${i}`} position={pos as [number, number, number]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.8 + Math.sin(i * 3) * 0.4, 0]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#888' : '#999'} roughness={0.9} />
        </mesh>
      ))}

      {/* Bushes */}
      {[
        [-15, 0.4, -12], [16, 0.4, 14], [-12, 0.4, 16], [14, 0.4, -14],
        [-24, 0.4, -6], [26, 0.4, 4], [4, 0.4, -24], [-6, 0.4, 26],
        [-20, 0.4, 14], [22, 0.4, -12],
      ].map((pos, i) => (
        <mesh key={`bush-${i}`} position={pos as [number, number, number]} castShadow>
          <sphereGeometry args={[1 + Math.sin(i * 5) * 0.3, 6, 6]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#3a8f3a' : '#2d7a2d'} roughness={0.85} />
        </mesh>
      ))}

      {/* Flower patches */}
      {[
        [-14, 0.15, -8, '#ff69b4'], [12, 0.15, 10, '#ffb347'],
        [-10, 0.15, 14, '#dda0dd'], [8, 0.15, -16, '#87ceeb'],
        [-26, 0.15, 10, '#ff6b6b'], [28, 0.15, -6, '#ffd700'],
      ].map((p, i) => (
        <mesh key={`flower-${i}`} position={[p[0] as number, p[1] as number, p[2] as number]} castShadow>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial color={p[3] as string} emissive={p[3] as string} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* â•â•â• Lighting (warm, bright, friendly) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function VillageLighting() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#ffeedd" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.8}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-30, 40, -20]} intensity={0.4} color="#b0d0ff" />
      <hemisphereLight args={['#87ceeb', '#5a9e3e', 0.4]} />
    </group>
  );
}

/* â•â•â• Main Scene Content â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SceneContent({ city, onBuildingClick }: VillageSceneProps) {
  const castleAsset = ASSET_MANIFEST.castle;

  const buildingPositions = useMemo(() => {
    return city.buildings.map((b) => getSlotPosition(b.slotIndex, city.buildings.length));
  }, [city.buildings]);

  return (
    <>
      <VillageLighting />
      <Sky sunPosition={[60, 30, 40]} turbidity={2} rayleigh={0.5} />

      <Terrain />
      <River />
      <WoodBridge />
      <DirtPaths positions={buildingPositions} />
      <Decorations />
      <ForestRing />

      {/* Buildings */}
      <Suspense fallback={null}>
        {city.buildings.map((building, idx) => {
          const pos = buildingPositions[idx];
          const isCastle = building.type === 'castle';

          if (isCastle && castleAsset) {
            return (
              <group key={building.id}>
                <GLBModel
                  url={castleAsset.url}
                  position={pos}
                  scale={2.5}
                  onClick={() => onBuildingClick?.(building.id)}
                />
                {building.upgradeStartedAt != null && (
                  <UpgradeIndicator y={8} />
                )}
                <Html position={[pos[0], 9, pos[2]]} center distanceFactor={50}>
                  <div className="pointer-events-none select-none text-center whitespace-nowrap">
                    <div className="text-sm font-medieval text-white bg-black/60 rounded-lg px-2 py-1 backdrop-blur-sm border border-castle-gold/30">
                      ðŸ° Castelo <span className="text-castle-gold font-bold">Lv.{building.level}</span>
                    </div>
                  </div>
                </Html>
              </group>
            );
          }

          return (
            <PlaceholderBuilding
              key={building.id}
              building={building}
              position={pos}
              onClick={() => onBuildingClick?.(building.id)}
            />
          );
        })}
      </Suspense>

      {/* Camera controls â€” isometric-like angle, limited zoom */}
      <OrbitControls
        target={[0, 0, 0]}
        minDistance={25}
        maxDistance={90}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}

/* â•â•â• Exported Component â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function VillageScene({ city, onBuildingClick }: VillageSceneProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full h-full bg-castle-dark flex items-center justify-center">
          <p className="font-medieval text-parchment-300">Erro ao carregar cena 3D. Verifique se WebGL estÃ¡ habilitado.</p>
        </div>
      }
    >
      <Canvas
        shadows
        camera={{ position: [45, 50, 45], fov: 35, near: 1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', background: '#1a3a1a' }}
      >
        <Suspense fallback={null}>
          <SceneContent city={city} onBuildingClick={onBuildingClick} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}
