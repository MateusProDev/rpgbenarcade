/**
 * VillageScene — Professional isometric 3D village (Clash of Kings style).
 *
 * - Castle at center with stone textures
 * - Textured trees around edges
 * - Cobblestone roads connecting all structures
 * - Building base platforms (ready for future structures)
 * - Lush terrain with procedural grass
 * - Flat river with animated water
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

/* ══ Props ══════════════════════════════════════════ */
interface VillageSceneProps {
  city: City;
  onBuildingClick?: (buildingId: string) => void;
}

/* ══ Layout — Circular ring around castle (slot 0 = center) ═ */
const RING_RADIUS = 18;
const TOTAL_SLOTS = 12;

function getSlotPosition(slotIndex: number, total: number): [number, number, number] {
  if (slotIndex === 0) return [0, 0, 0];
  const count = Math.max(total - 1, 1);
  const angle = ((slotIndex - 1) / count) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * RING_RADIUS,
    0,
    Math.sin(angle) * RING_RADIUS,
  ];
}

function getAllSlotPositions(): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    positions.push(getSlotPosition(i, TOTAL_SLOTS));
  }
  return positions;
}

/* ══ Building visual config ══════════════════════════ */
interface BuildingStyle {
  color: string;
  roofColor: string;
  height: number;
  width: number;
  icon: string;
}

const BUILDING_STYLES: Record<BuildingType, BuildingStyle> = {
  castle:     { color: '#8a8a8a', roofColor: '#b22222', height: 6, width: 5, icon: '🏰' },
  house:      { color: '#deb887', roofColor: '#d2691e', height: 3, width: 3, icon: '🏠' },
  farm:       { color: '#8fbc8f', roofColor: '#8b4513', height: 2.5, width: 4, icon: '🌾' },
  lumbermill: { color: '#d2b48c', roofColor: '#654321', height: 3.5, width: 3.5, icon: '🪵' },
  quarry:     { color: '#b0b0b0', roofColor: '#696969', height: 3, width: 3.5, icon: '🪨' },
  ironmine:   { color: '#708090', roofColor: '#2f4f4f', height: 3, width: 3.5, icon: '⛏️' },
  barracks:   { color: '#cd853f', roofColor: '#8b0000', height: 4, width: 4, icon: '⚔️' },
  stable:     { color: '#deb887', roofColor: '#a0522d', height: 3, width: 4.5, icon: '🐴' },
  market:     { color: '#ffd700', roofColor: '#daa520', height: 3.5, width: 4, icon: '🪙' },
  warehouse:  { color: '#d2b48c', roofColor: '#8b7355', height: 4, width: 4.5, icon: '📦' },
  wall:       { color: '#808080', roofColor: '#696969', height: 5, width: 2.5, icon: '🧱' },
  tower:      { color: '#808080', roofColor: '#b22222', height: 6, width: 2.5, icon: '🗼' },
};

/* ══ Procedural Texture Generators ═══════════════════ */

function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7a7568';
  ctx.fillRect(0, 0, 512, 512);
  const bw = 64, bh = 32;
  for (let row = 0; row < 16; row++) {
    const off = row % 2 === 0 ? 0 : bw / 2;
    for (let col = -1; col < 9; col++) {
      const x = col * bw + off;
      const y = row * bh;
      const s = 100 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${s + Math.floor(Math.random() * 15)}, ${s + Math.floor(Math.random() * 10)}, ${s - 5 + Math.floor(Math.random() * 10)})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      ctx.strokeStyle = '#5a5548';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + bw - 3, y + 3);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8b2020';
  ctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++) {
    const off = row % 2 === 0 ? 0 : 8;
    for (let col = 0; col < 16; col++) {
      const x = col * 16 + off, y = row * 16;
      const s = 120 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${s + 20}, ${Math.floor(s * 0.3)}, ${Math.floor(s * 0.3)})`;
      ctx.beginPath();
      ctx.arc(x + 8, y + 12, 7, Math.PI, 0, false);
      ctx.fill();
      ctx.fillRect(x + 1, y + 4, 14, 8);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 128;
    const w = 1 + Math.random() * 4;
    const h = 30 + Math.random() * 100;
    const y = Math.random() * 256;
    const s = 60 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${s + 20}, ${s - 10}, ${Math.floor(s * 0.4)})`;
    ctx.fillRect(x, y, w, h);
  }
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(20 + Math.random() * 88, 20 + Math.random() * 216, 3 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2210';
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2d7a2d';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const sz = 4 + Math.random() * 12;
    const g = 80 + Math.floor(Math.random() * 100);
    ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 40)}, ${g}, ${20 + Math.floor(Math.random() * 30)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, sz, sz * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(180, 255, 100, ${0.1 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4a4035';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 130; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const w = 12 + Math.random() * 20, h = 10 + Math.random() * 16;
    const s = 130 + Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgb(${s}, ${s - 5}, ${s - 15})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4a8e32';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const h = 3 + Math.random() * 8;
    const g = 100 + Math.floor(Math.random() * 80);
    ctx.strokeStyle = `rgb(${30 + Math.floor(Math.random() * 30)}, ${g}, ${20 + Math.floor(Math.random() * 20)})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

function createDirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const r = 1 + Math.random() * 3;
    const s = 100 + Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgb(${s + 20}, ${s}, ${s - 30})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/* ══ Flat Ribbon Geometry (for river/road curves) ═══ */
function createRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  segments: number
): THREE.BufferGeometry {
  const points = curve.getPoints(segments);
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    let tan: THREE.Vector3;
    if (i < points.length - 1) {
      tan = points[i + 1].clone().sub(pt).normalize();
    } else {
      tan = pt.clone().sub(points[i - 1]).normalize();
    }
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(tan, up).normalize().multiplyScalar(width / 2);

    verts.push(pt.x - perp.x, pt.y, pt.z - perp.z);
    verts.push(pt.x + perp.x, pt.y, pt.z + perp.z);

    const t = i / (points.length - 1);
    uvs.push(0, t);
    uvs.push(1, t);

    if (i < points.length - 1) {
      const b = i * 2;
      idx.push(b, b + 1, b + 2);
      idx.push(b + 1, b + 3, b + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return geom;
}

/* ══ Terrain — lush textured ground ══════════════════ */
function Terrain() {
  const grassTex = useMemo(() => createGrassTexture(), []);
  const dirtTex = useMemo(() => createDirtTexture(), []);

  return (
    <group>
      {/* Main grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[65, 64]} />
        <meshStandardMaterial map={grassTex} color="#5a9e3e" roughness={0.85} metalness={0} />
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

      {/* Central stone plaza (castle area) — flat octagonal platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[8, 9, 0.35, 8]} />
        <meshStandardMaterial map={dirtTex} color="#9e9080" roughness={0.85} />
      </mesh>

      {/* Stone edge trim — low flat ring (no visible torus) */}
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <cylinderGeometry args={[9.1, 9.3, 0.08, 32]} />
        <meshStandardMaterial color="#807060" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ══ River — flat ribbon with animated water ═════════ */
function River() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 1.5) * 0.06;
    }
  });

  const riverCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-60, 0.06, -20),
      new THREE.Vector3(-30, 0.06, -15),
      new THREE.Vector3(-10, 0.06, -8),
      new THREE.Vector3(5, 0.06, 2),
      new THREE.Vector3(20, 0.06, 12),
      new THREE.Vector3(40, 0.06, 20),
      new THREE.Vector3(65, 0.06, 28),
    ]);
  }, []);

  const waterGeom = useMemo(() => createRibbonGeometry(riverCurve, 5, 80), [riverCurve]);
  const bankGeom = useMemo(() => createRibbonGeometry(riverCurve, 7, 80), [riverCurve]);
  const outerBankGeom = useMemo(() => createRibbonGeometry(riverCurve, 8.5, 80), [riverCurve]);

  return (
    <group>
      {/* Outer grass-to-dirt transition */}
      <mesh geometry={outerBankGeom} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#6b7b3a" roughness={0.9} />
      </mesh>

      {/* River banks (dirt/mud) */}
      <mesh geometry={bankGeom} position={[0, 0.03, 0]} receiveShadow>
        <meshStandardMaterial color="#6b5b3a" roughness={0.9} />
      </mesh>

      {/* Water surface — flat ribbon */}
      <mesh geometry={waterGeom} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial
          ref={matRef}
          color="#3b7dd8"
          roughness={0.15}
          metalness={0.15}
          emissive="#1a4a8a"
          emissiveIntensity={0.12}
          transparent
          opacity={0.82}
        />
      </mesh>
    </group>
  );
}

/* ══ Bridge ══════════════════════════════════════════ */
function WoodBridge() {
  return (
    <group position={[-2, 0.15, -3]} rotation={[0, 0.5, 0]}>
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

/* ══ Cobblestone Roads ═══════════════════════════════ */
function StoneRoads() {
  const cobbleTex = useMemo(() => createCobblestoneTexture(), []);

  const allSlots = useMemo(() => getAllSlotPositions(), []);

  // Radial roads: from center to each slot
  const radialRoads = useMemo(() => {
    return allSlots.slice(1).map((pos) => {
      const dir = new THREE.Vector3(pos[0], 0, pos[2]).normalize();
      const len = new THREE.Vector3(pos[0], 0, pos[2]).length();
      const mid = dir.clone().multiplyScalar(len / 2);
      const angle = Math.atan2(dir.x, dir.z);
      return { mid, angle, len };
    });
  }, [allSlots]);

  // Ring road: circular arc connecting slot positions
  const ringRoadSegments = useMemo(() => {
    const segments: { mid: THREE.Vector3; angle: number; len: number }[] = [];
    const outerSlots = allSlots.slice(1);
    for (let i = 0; i < outerSlots.length; i++) {
      const a = outerSlots[i];
      const b = outerSlots[(i + 1) % outerSlots.length];
      const mx = (a[0] + b[0]) / 2;
      const mz = (a[2] + b[2]) / 2;
      // Push midpoint outward to follow the ring
      const mDir = new THREE.Vector3(mx, 0, mz).normalize().multiplyScalar(RING_RADIUS);
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      segments.push({ mid: mDir, angle, len: dist });
    }
    return segments;
  }, [allSlots]);

  return (
    <group>
      {/* Radial roads from castle to each building slot */}
      {radialRoads.map((road, i) => (
        <group key={`radial-${i}`}>
          {/* Road surface */}
          <mesh
            position={[road.mid.x, 0.04, road.mid.z]}
            rotation={[-Math.PI / 2, 0, -road.angle]}
            receiveShadow
          >
            <planeGeometry args={[2.8, road.len]} />
            <meshStandardMaterial map={cobbleTex} color="#b0a898" roughness={0.85} />
          </mesh>
          {/* Road border left */}
          <mesh
            position={[
              road.mid.x + Math.cos(road.angle + Math.PI / 2) * 1.5,
              0.06,
              road.mid.z + Math.sin(road.angle + Math.PI / 2) * 1.5,
            ]}
            rotation={[-Math.PI / 2, 0, -road.angle]}
            receiveShadow
          >
            <planeGeometry args={[0.25, road.len]} />
            <meshStandardMaterial color="#706050" roughness={0.9} />
          </mesh>
          {/* Road border right */}
          <mesh
            position={[
              road.mid.x - Math.cos(road.angle + Math.PI / 2) * 1.5,
              0.06,
              road.mid.z - Math.sin(road.angle + Math.PI / 2) * 1.5,
            ]}
            rotation={[-Math.PI / 2, 0, -road.angle]}
            receiveShadow
          >
            <planeGeometry args={[0.25, road.len]} />
            <meshStandardMaterial color="#706050" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Ring road connecting all outer slots */}
      {ringRoadSegments.map((seg, i) => (
        <mesh
          key={`ring-${i}`}
          position={[seg.mid.x, 0.035, seg.mid.z]}
          rotation={[-Math.PI / 2, 0, -seg.angle]}
          receiveShadow
        >
          <planeGeometry args={[2.4, seg.len]} />
          <meshStandardMaterial map={cobbleTex} color="#a09888" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

/* ══ Building Slot Bases (empty platforms for future structures) ═ */
function BuildingSlotBases({ occupiedSlots }: { occupiedSlots: Set<number> }) {
  const cobbleTex = useMemo(() => createCobblestoneTexture(), []);
  const allSlots = useMemo(() => getAllSlotPositions(), []);

  return (
    <group>
      {allSlots.map((pos, i) => {
        if (i === 0) return null; // Castle slot handled separately
        if (occupiedSlots.has(i)) return null; // Has a building already

        return (
          <group key={`slot-${i}`} position={pos}>
            {/* Stone foundation */}
            <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[3.2, 3.4, 0.18, 8]} />
              <meshStandardMaterial map={cobbleTex} color="#8a8070" roughness={0.88} />
            </mesh>

            {/* Corner marker stones */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, j) => (
              <mesh
                key={j}
                position={[Math.cos(a) * 2.8, 0.2, Math.sin(a) * 2.8]}
                castShadow
              >
                <boxGeometry args={[0.4, 0.25, 0.4]} />
                <meshStandardMaterial color="#706050" roughness={0.9} />
              </mesh>
            ))}

            {/* Construction marker label */}
            <Html position={[0, 1.2, 0]} center distanceFactor={50} zIndexRange={[10, 0]}>
              <div className="pointer-events-none select-none text-center whitespace-nowrap">
                <div className="text-xs text-gray-400 bg-black/40 rounded px-1.5 py-0.5 backdrop-blur-sm border border-gray-600/30">
                  ⚒️ Vazio
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ══ GLB Model Loader ════════════════════════════════ */
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

/* ══ Placeholder Building (textured — ready for GLB swap) ═ */
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

  const stoneTex = useMemo(() => createStoneTexture(), []);
  const roofTex = useMemo(() => createRoofTexture(), []);

  return (
    <group position={position} onClick={onClick}>
      {/* Foundation platform */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.75, w * 0.8, 0.22, 8]} />
        <meshStandardMaterial map={stoneTex} color="#8a7d6b" roughness={0.88} />
      </mesh>

      {/* Building body — textured stone walls */}
      <mesh position={[0, h / 2 + 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial map={stoneTex} color={style.color} roughness={0.65} />
      </mesh>

      {/* Window details (dark insets) */}
      {[
        [w / 2 + 0.01, h * 0.5 + 0.2, 0],
        [-w / 2 - 0.01, h * 0.5 + 0.2, 0],
        [0, h * 0.5 + 0.2, w / 2 + 0.01],
        [0, h * 0.5 + 0.2, -w / 2 - 0.01],
      ].map((wPos, wi) => (
        <mesh key={wi} position={wPos as [number, number, number]} castShadow>
          <boxGeometry args={[wi < 2 ? 0.05 : w * 0.2, h * 0.18, wi < 2 ? w * 0.2 : 0.05]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[w / 2 + 0.02, 0.2 + h * 0.2, 0]} castShadow>
        <boxGeometry args={[0.06, h * 0.35, w * 0.25]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>

      {/* Roof — textured */}
      <mesh position={[0, h + 0.2, 0]} castShadow>
        <coneGeometry args={[w * 0.75, h * 0.4, 4]} />
        <meshStandardMaterial map={roofTex} color={style.roofColor} roughness={0.55} />
      </mesh>

      {/* Chimney */}
      {building.type !== 'wall' && building.type !== 'tower' && (
        <mesh position={[w * 0.25, h + h * 0.2, w * 0.2]} castShadow>
          <boxGeometry args={[0.5, h * 0.2, 0.5]} />
          <meshStandardMaterial color="#6a5a4a" roughness={0.85} />
        </mesh>
      )}

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

/* ══ Decorative Trees (textured fallback + GLB) ══════ */
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
  const barkTex = useMemo(() => createBarkTexture(), []);
  const leafTex = useMemo(() => createLeafTexture(), []);

  return (
    <group>
      {TREE_POSITIONS.map((pos, i) => {
        const trunkH = 2.5 + Math.sin(i * 3) * 0.8;
        const crownR = 2 + Math.sin(i) * 0.5;
        const lean = Math.sin(i * 5) * 0.05;
        return (
          <group key={i} position={pos} rotation={[lean, i * 1.1, 0]}>
            {/* Roots flare */}
            <mesh position={[0, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.7, 0.4, 6]} />
              <meshStandardMaterial map={barkTex} color="#5c3a1e" roughness={0.9} />
            </mesh>

            {/* Trunk — textured */}
            <mesh position={[0, trunkH / 2 + 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.4, trunkH, 8]} />
              <meshStandardMaterial map={barkTex} color="#6b4226" roughness={0.85} />
            </mesh>

            {/* Branch stubs */}
            <mesh position={[0.4, trunkH * 0.6, 0.2]} rotation={[0.3, 0, 0.8]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 1, 4]} />
              <meshStandardMaterial map={barkTex} color="#5c3a1e" roughness={0.9} />
            </mesh>
            <mesh position={[-0.3, trunkH * 0.75, -0.15]} rotation={[-0.2, 0, -0.7]} castShadow>
              <cylinderGeometry args={[0.06, 0.1, 0.8, 4]} />
              <meshStandardMaterial map={barkTex} color="#5c3a1e" roughness={0.9} />
            </mesh>

            {/* Main leaf canopy — textured sphere */}
            <mesh position={[0, trunkH + crownR * 0.6, 0]} castShadow>
              <sphereGeometry args={[crownR, 10, 10]} />
              <meshStandardMaterial map={leafTex} color="#2d8a4e" roughness={0.75} />
            </mesh>

            {/* Secondary leaf cluster (offset) */}
            <mesh position={[crownR * 0.4, trunkH + crownR * 0.3, crownR * 0.3]} castShadow>
              <sphereGeometry args={[crownR * 0.65, 8, 8]} />
              <meshStandardMaterial map={leafTex} color="#35974a" roughness={0.78} />
            </mesh>

            {/* Top tuft */}
            <mesh position={[-crownR * 0.2, trunkH + crownR * 1.1, -crownR * 0.15]} castShadow>
              <sphereGeometry args={[crownR * 0.45, 7, 7]} />
              <meshStandardMaterial map={leafTex} color="#248f3e" roughness={0.72} />
            </mesh>

            {/* Shadow disk at base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
              <circleGeometry args={[crownR * 0.9, 12]} />
              <meshStandardMaterial color="#1a4a1a" transparent opacity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ══ Decorative rocks & bushes ═══════════════════════ */
function Decorations() {
  return (
    <group>
      {/* Rocks */}
      {[
        [-22, 0.2, -18], [25, 0.2, 16], [-18, 0.2, 20], [20, 0.2, -22],
        [-30, 0.2, 2], [32, 0.2, -8], [8, 0.2, -28], [-8, 0.2, 30],
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
          <sphereGeometry args={[1 + Math.sin(i * 5) * 0.3, 8, 8]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#3a8f3a' : '#2d7a2d'} roughness={0.82} />
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

      {/* Grass tufts near buildings */}
      {Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const r = 12 + Math.sin(i * 7) * 6;
        return (
          <mesh key={`tuft-${i}`} position={[Math.cos(a) * r, 0.1, Math.sin(a) * r]} castShadow>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#4a9e3e' : '#3d8a2e'} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ══ Lighting (warm, bright, friendly) ═══════════════ */
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

/* ══ Main Scene Content ══════════════════════════════ */
function SceneContent({ city, onBuildingClick }: VillageSceneProps) {
  const castleAsset = ASSET_MANIFEST.castle;

  const buildingPositions = useMemo(() => {
    return city.buildings.map((b) => getSlotPosition(b.slotIndex, city.buildings.length));
  }, [city.buildings]);

  const occupiedSlots = useMemo(() => {
    return new Set(city.buildings.map((b) => b.slotIndex));
  }, [city.buildings]);

  return (
    <>
      <VillageLighting />
      <Sky sunPosition={[60, 30, 40]} turbidity={2} rayleigh={0.5} />

      <Terrain />
      <River />
      <WoodBridge />
      <StoneRoads />
      <BuildingSlotBases occupiedSlots={occupiedSlots} />
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
                      🏰 Castelo <span className="text-castle-gold font-bold">Lv.{building.level}</span>
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

      {/* Camera controls — isometric-like angle, limited zoom */}
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

/* ══ Exported Component ══════════════════════════════ */
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
