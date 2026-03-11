/**
 * CastleView — Vila Medieval Isométrica Realista
 *
 * Câmera ortográfica isométrica fixa (sem rotação)
 * Muralha circular perfeita com 8 torres simétricas
 * Texturas procedurais realistas com simplex-noise
 * Iluminação de fim de tarde com sombras suaves
 * 8 slots de construção em layout radial simétrico
 */

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  MapControls,
  Environment,
  Html,
  useGLTF,
} from '@react-three/drei';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ============================================================================
   CONSTANTES
   ========================================================================= */

const WALL_RADIUS = 5.2;
const TOWER_COUNT = 8;
const SLOT_RADIUS = 3.4;

const SLOT_TYPES: { type: BuildingType; label: string; icon: string }[] = [
  { type: 'sawmill',   label: 'Serraria',      icon: '🪵' },
  { type: 'ironMine',  label: 'Mina de Ferro',  icon: '⚙️' },
  { type: 'farm',      label: 'Fazenda',        icon: '🌾' },
  { type: 'quarry',    label: 'Pedreira',       icon: '🪨' },
  { type: 'barracks',  label: 'Quartel',        icon: '⚔️' },
  { type: 'warehouse', label: 'Armazém',        icon: '🏚️' },
  { type: 'academy',   label: 'Academia',       icon: '📚' },
  { type: 'sawmill',   label: 'Serraria II',    icon: '🪵' },
];

/* ============================================================================
   TEXTURAS PROCEDURAIS REALISTAS
   ========================================================================= */

function createRealisticStoneTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#8a8070';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n =
        noise2D(x / 120, y / 120) * 0.5 +
        noise2D(x / 40,  y / 40)  * 0.3 +
        noise2D(x / 15,  y / 15)  * 0.2;
      const br = Math.floor(128 + n * 55);
      const i = (y * size + x) * 4;
      d[i]     = THREE.MathUtils.clamp(br + 10, 80,  200);
      d[i + 1] = THREE.MathUtils.clamp(br,      70,  185);
      d[i + 2] = THREE.MathUtils.clamp(br - 15, 55,  165);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const rowHeights = [48, 52, 44, 56, 50, 46, 54, 48, 58, 42, 50, 52, 46, 54, 48];
  const stoneHues  = [0, 4, -3, 6, -5, 8, -2, 5, -6, 3];
  let ry = 0;
  for (let row = 0; row < rowHeights.length && ry < size; row++) {
    const rh = rowHeights[row];
    const offsetX = (row % 2) * (45 + Math.sin(row) * 12);
    let rx = -offsetX;
    while (rx < size) {
      const rw = 60 + (stoneHues[row % stoneHues.length] + 6) * 5 + 20;
      const hShift = stoneHues[row % stoneHues.length];
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = `hsl(${30 + hShift},${25 + Math.abs(hShift) * 2}%,${52 + hShift}%)`;
      ctx.fillRect(rx + 2, ry + 2, rw - 3, rh - 3);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + 2, ry + 2, rw - 4, 2);
      ctx.fillRect(rx + 2, ry + 2, 2, rh - 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx + 2, ry + rh - 4, rw - 4, 2);
      ctx.fillRect(rx + rw - 4, ry + 2, 2, rh - 4);
      rx += rw;
    }
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#4a3e30';
    ctx.fillRect(0, ry + rh - 3, size, 5);
    ry += rh;
  }

  ry = 0;
  for (let row = 0; row < rowHeights.length && ry < size; row++) {
    const rh = rowHeights[row];
    const offsetX = (row % 2) * (45 + Math.sin(row) * 12);
    let rx = -offsetX;
    while (rx < size) {
      const rw = 60 + (stoneHues[row % stoneHues.length] + 6) * 5 + 20;
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#3e3228';
      ctx.fillRect(rx + rw - 3, ry, 5, rh - 2);
      rx += rw;
    }
    ry += rh;
  }

  const mossGrad = ctx.createLinearGradient(0, size * 0.6, 0, size);
  mossGrad.addColorStop(0, 'rgba(40,80,30,0)');
  mossGrad.addColorStop(1, 'rgba(40,75,25,0.32)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = mossGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 14; i++) {
    const fx = Math.random() * size;
    const fy = Math.random() * size;
    ctx.strokeStyle = `hsl(25,20%,${10 + Math.random() * 12}%)`;
    ctx.lineWidth = 0.8 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    let cx2 = fx; let cy2 = fy;
    for (let s = 0; s < 10; s++) {
      cx2 += (Math.random() - 0.5) * 20;
      cy2 += Math.random() * 16;
      ctx.lineTo(cx2, cy2);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  return tex;
}

function createRealisticGroundTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5a8040';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const px = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n =
        noise2D(x / 80, y / 80) * 0.6 +
        noise2D(x / 25, y / 25) * 0.3 +
        noise2D(x / 8,  y / 8)  * 0.1;
      const g = 75 + Math.floor(n * 40);
      const i = (y * size + x) * 4;
      px[i]     = THREE.MathUtils.clamp((30 + g * 0.3) | 0, 20,  80);
      px[i + 1] = THREE.MathUtils.clamp((55 + g * 0.7) | 0, 50, 160);
      px[i + 2] = THREE.MathUtils.clamp((20 + g * 0.1) | 0, 15,  55);
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 400; i++) {
    const px2 = Math.random() * size;
    const py2 = Math.random() * size;
    const r   = 2 + Math.random() * 5;
    ctx.fillStyle = `hsl(${30 + Math.random() * 20},${15 + Math.random() * 20}%,${50 + Math.random() * 30}%)`;
    ctx.beginPath();
    ctx.ellipse(px2, py2, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 1200; i++) {
    const gx = Math.random() * size;
    const gy = Math.random() * size;
    const h  = 8 + Math.random() * 18;
    ctx.strokeStyle = `hsl(${100 + Math.random() * 30},${50 + Math.random() * 30}%,${25 + Math.random() * 20}%)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (Math.random() - 0.5) * 8, gy - h);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.anisotropy = 16;
  return tex;
}

function createRoofTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row * 12 < size; row++) {
    const y2  = row * 12;
    const off = (row % 2) * 30;
    let x2 = -off;
    while (x2 < size) {
      const w  = 35 + Math.random() * 20;
      const nv = noise2D(x2 / 60, y2 / 60);
      const lt = 30 + nv * 15;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = `hsl(20,${40 + nv * 15}%,${lt}%)`;
      ctx.fillRect(x2 + 1, y2 + 1, w - 1, 10);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#1a0e08';
      ctx.fillRect(x2 + w - 1, y2, 2, 12);
      x2 += w;
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(0, y2 + 11, size, 2);
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  return tex;
}

function createDirtPathTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const px = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = noise2D(x / 60, y / 60) * 0.7 + noise2D(x / 20, y / 20) * 0.3;
      const v = THREE.MathUtils.clamp(Math.floor(105 + n * 40), 70, 160);
      const i = (y * size + x) * 4;
      px[i]     = v;
      px[i + 1] = Math.floor(v * 0.82);
      px[i + 2] = Math.floor(v * 0.55);
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 80; i++) {
    const tx = Math.random() * size;
    const ty = Math.random() * size;
    ctx.fillStyle = '#3a2810';
    ctx.beginPath();
    ctx.ellipse(tx, ty, 6 + Math.random() * 8, 4 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  return tex;
}

/* ============================================================================
   CÂMERA ISOMÉTRICA — fixa no ângulo, sem rotação
   ========================================================================= */

function IsometricCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      const aspect = size.width / size.height;
      const f = 10;
      camera.left   = -f * aspect;
      camera.right  =  f * aspect;
      camera.top    =  f;
      camera.bottom = -f;
      camera.near   = 0.1;
      camera.far    = 200;
      camera.position.set(12, 10, 12);
      camera.lookAt(0, 0.5, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  useFrame(({ camera, size: s }) => {
    if (camera instanceof THREE.OrthographicCamera) {
      const aspect = s.width / s.height;
      const f = 10;
      camera.left   = -f * aspect;
      camera.right  =  f * aspect;
      camera.top    =  f;
      camera.bottom = -f;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/* ============================================================================
   TERRENO
   ========================================================================= */

function Terrain() {
  const groundTex = useMemo(() => createRealisticGroundTex(), []);
  const noise2D   = useMemo(() => createNoise2D(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 30, 80, 80);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const n =
        noise2D(x / 8, z / 8) * 0.12 +
        noise2D(x / 3, z / 3) * 0.04;
      const dist = Math.sqrt(x * x + z * z);
      const hill = Math.max(0, 1 - dist / 5) * 0.25;
      pos.setZ(i, n + hill);
    }
    geo.computeVertexNormals();
    return geo;
  }, [noise2D]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial map={groundTex} roughness={0.95} color="#b8c8a0" />
    </mesh>
  );
}

/* ============================================================================
   TORRE DA MURALHA
   ========================================================================= */

function WallTower({ angle }: { angle: number }) {
  const stoneTex = useMemo(() => createRealisticStoneTex(), []);
  const roofTex  = useMemo(() => createRoofTex(), []);
  const x = Math.cos(angle) * WALL_RADIUS;
  const z = Math.sin(angle) * WALL_RADIUS;
  const isGateS = Math.abs(angle + Math.PI / 2) < 0.05;
  const isGateN = Math.abs(angle - Math.PI / 2) < 0.05;

  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.9, 2.0, 0.9]} />
        <meshStandardMaterial map={stoneTex} roughness={0.85} color="#9a8e7c" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.3, 0]}>
        <boxGeometry args={[1.1, 0.6, 1.1]} />
        <meshStandardMaterial map={stoneTex} roughness={0.8} color="#a09484" />
      </mesh>
      <mesh castShadow position={[0, 2.85, 0]}>
        <coneGeometry args={[0.72, 0.8, 8]} />
        <meshStandardMaterial map={roofTex} roughness={0.7} color="#5a3820" />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.45, 2.75, Math.sin(a) * 0.45]}>
            <boxGeometry args={[0.18, 0.22, 0.18]} />
            <meshStandardMaterial map={stoneTex} roughness={0.9} color="#8a8070" />
          </mesh>
        );
      })}
      <pointLight position={[0, 2.5, 0]} intensity={0.6} color="#ff9040" distance={5} />
      <mesh position={[0.25, 2.1, 0.25]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
        <meshStandardMaterial color="#5a3010" roughness={1} />
      </mesh>
      {(isGateS || isGateN) && (
        <Html center position={[0, 3.6, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#ffe8a0', fontSize: 11, fontWeight: 700,
            textShadow: '0 1px 3px #000', whiteSpace: 'nowrap',
          }}>
            {isGateS ? '🏰 Portão Sul' : '⚓ Porto Norte'}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ============================================================================
   MURALHA CIRCULAR
   ========================================================================= */

function CircularWall() {
  const stoneTex = useMemo(() => createRealisticStoneTex(), []);
  const SEGMENTS = 64;
  const wallH     = 1.8;

  const wallMeshes = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a0 = (i / SEGMENTS)       * Math.PI * 2;
      const a1 = ((i + 1) / SEGMENTS) * Math.PI * 2;
      const x0 = Math.cos(a0) * WALL_RADIUS, z0 = Math.sin(a0) * WALL_RADIUS;
      const x1 = Math.cos(a1) * WALL_RADIUS, z1 = Math.sin(a1) * WALL_RADIUS;
      const mx  = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ang = Math.atan2(z1 - z0, x1 - x0);
      out.push(
        <mesh key={`w${i}`} position={[mx, wallH / 2, mz]} rotation={[0, -ang, 0]} castShadow receiveShadow>
          <boxGeometry args={[len + 0.02, wallH, 0.45]} />
          <meshStandardMaterial map={stoneTex} roughness={0.88} color="#9a8e7c"
            emissive="#100a04" emissiveIntensity={0.15} />
        </mesh>
      );
      if (i % 2 === 0) {
        out.push(
          <mesh key={`am${i}`} position={[mx, wallH + 0.12, mz]} rotation={[0, -ang, 0]} castShadow>
            <boxGeometry args={[0.22, 0.24, 0.5]} />
            <meshStandardMaterial map={stoneTex} roughness={0.9} color="#8a8070" />
          </mesh>
        );
      }
    }
    return out;
  }, [stoneTex]);

  const towers = useMemo(() =>
    Array.from({ length: TOWER_COUNT }, (_, i) => {
      const angle = (i / TOWER_COUNT) * Math.PI * 2 - Math.PI / 2;
      return <WallTower key={i} angle={angle} />;
    }), []);

  return <group>{wallMeshes}{towers}</group>;
}

/* ============================================================================
   CASTELO CENTRAL (GLB)
   ========================================================================= */

function CastleModel() {
  const stoneTex = useMemo(() => createRealisticStoneTex(), []);
  const { scene } = useGLTF('/casteloteste.glb');

  const model = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const sz  = new THREE.Vector3();
    box.getSize(sz);
    const maxDim = Math.max(sz.x, sz.y, sz.z);
    clone.scale.setScalar(2.8 / maxDim);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box2.min.y;
    clone.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow     = true;
      mesh.receiveShadow  = true;
      const name = mesh.name.toLowerCase();
      const apply = (mat: THREE.MeshStandardMaterial) => {
        if (name.includes('wall') || name.includes('stone') || name.includes('tower')) {
          mat.map = stoneTex;
          mat.color.set('#9e9080');
          mat.roughness = 0.85;
        }
      };
      if (Array.isArray(mesh.material)) {
        (mesh.material as THREE.MeshStandardMaterial[]).forEach(apply);
      } else {
        apply(mesh.material as THREE.MeshStandardMaterial);
      }
    });
    return clone;
  }, [scene, stoneTex]);

  return <primitive object={model} position={[0, 0, 0]} />;
}

/* ============================================================================
   ÁRVORES (GLB)
   ========================================================================= */

const TREE_POSITIONS: [number, number, number, number][] = [
  [ 7.5, 0,  7.5, 0.0],
  [-7.5, 0,  7.5, 1.1],
  [ 7.5, 0, -7.5, 2.3],
  [-7.5, 0, -7.5, 3.4],
  [ 9.0, 0,  0.0, 0.5],
  [-9.0, 0,  0.0, 1.6],
  [ 0.0, 0,  9.0, 2.7],
  [ 0.0, 0, -9.0, 3.8],
  [ 8.0, 0,  4.0, 1.0],
  [-8.0, 0,  4.0, 2.0],
  [ 8.0, 0, -4.0, 0.8],
  [-8.0, 0, -4.0, 2.9],
];

function TreeModel({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const { scene } = useGLTF('/arvoreum.glb');
  const model = useMemo(() => {
    const clone = scene.clone();
    const box  = new THREE.Box3().setFromObject(clone);
    const sz   = new THREE.Vector3();
    box.getSize(sz);
    const maxD = Math.max(sz.x, sz.y, sz.z);
    clone.scale.setScalar((1.4 + Math.sin(rotation) * 0.3) / maxD);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box2.min.y;
    clone.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      const mat    = mesh.material as THREE.MeshStandardMaterial;
      const isLeaf = /leaf|folha|foliage/i.test(mesh.name);
      mat.color.set(isLeaf ? `hsl(${110 + Math.sin(rotation) * 20},55%,28%)` : '#5c3a1e');
      mat.roughness = isLeaf ? 0.85 : 0.95;
    });
    return clone;
  }, [scene, rotation]);

  return <primitive object={model} position={position} rotation={[0, rotation, 0]} />;
}

/* ============================================================================
   ESTRADAS SIMÉTRICAS
   ========================================================================= */

function Roads() {
  const dirtTex = useMemo(() => createDirtPathTex(), []);
  return (
    <group>
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, rot]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[1.4, 12]} />
          <meshStandardMaterial map={dirtTex} roughness={0.95} color="#a09070" transparent opacity={0.95} />
        </mesh>
      ))}
      {Array.from({ length: 32 }, (_, i) => {
        const a  = (i / 32) * Math.PI * 2;
        const a1 = ((i + 1) / 32) * Math.PI * 2;
        const r  = 2.6;
        const mx = ((Math.cos(a) + Math.cos(a1)) / 2) * r;
        const mz = ((Math.sin(a) + Math.sin(a1)) / 2) * r;
        const rl = 2 * r * Math.sin(Math.PI / 32);
        const ag = Math.atan2(Math.sin(a1) - Math.sin(a), Math.cos(a1) - Math.cos(a));
        return (
          <mesh key={`ring${i}`} position={[mx, 0.01, mz]} rotation={[-Math.PI / 2, 0, -ag]} receiveShadow>
            <planeGeometry args={[rl + 0.02, 0.9]} />
            <meshStandardMaterial map={dirtTex} roughness={0.9} color="#a09068" transparent opacity={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================================
   SLOT DE CONSTRUÇÃO
   ========================================================================= */

interface SlotProps {
  slotIndex: number;
  type: BuildingType;
  label: string;
  icon: string;
  selected: boolean;
  built: boolean;
  onClick: () => void;
}

function BuildingSlot({ slotIndex, label, icon, selected, built, onClick }: SlotProps) {
  const stoneTex = useMemo(() => createRealisticStoneTex(), []);
  const roofTex  = useMemo(() => createRoofTex(), []);
  const meshRef  = useRef<THREE.Mesh>(null);
  const angle    = (slotIndex / SLOT_TYPES.length) * Math.PI * 2 - Math.PI / 2;
  const sx       = Math.cos(angle) * SLOT_RADIUS;
  const sz       = Math.sin(angle) * SLOT_RADIUS;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (selected) {
      meshRef.current.position.y = 0.18 + Math.sin(clock.getElapsedTime() * 3) * 0.06;
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y, built ? 0 : 0.05, 0.12,
      );
    }
  });

  return (
    <group position={[sx, 0, sz]} onClick={onClick}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.22, 0.85]} />
        <meshStandardMaterial
          map={stoneTex} roughness={0.9}
          color={selected ? '#d4c090' : built ? '#9a9080' : '#7a7870'}
          emissive={selected ? '#604820' : '#000000'}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>
      {built ? (
        <>
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[0.7, 0.5, 0.7]} />
            <meshStandardMaterial map={stoneTex} roughness={0.85} color="#8a8272" />
          </mesh>
          <mesh castShadow position={[0, 0.78, 0]}>
            <coneGeometry args={[0.52, 0.5, 4]} />
            <meshStandardMaterial map={roofTex} roughness={0.7} color="#4a2c14" />
          </mesh>
        </>
      ) : (
        <Html center position={[0, 0.5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: selected ? 'rgba(60,40,10,0.85)' : 'rgba(20,15,8,0.72)',
            border: `1.5px solid ${selected ? '#d4a840' : '#6a5a30'}`,
            borderRadius: 8, padding: '3px 7px',
            color: selected ? '#ffe8a0' : '#c8b878',
            fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap',
            boxShadow: selected ? '0 0 10px #d4a84055' : 'none',
          }}>
            <span>{icon}</span>
            <span style={{ fontSize: 10 }}>{label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ============================================================================
   PORTO AO NORTE
   ========================================================================= */

function Harbor() {
  const stoneTex = useMemo(() => createRealisticStoneTex(), []);
  const timeRef  = useRef(0);

  const waterMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time:   { value: 0 },
      colorA: { value: new THREE.Color('#1a5a8a') },
      colorB: { value: new THREE.Color('#2a7aaa') },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.z += sin(p.x * 2.5 + time * 1.8) * 0.04 + sin(p.y * 2.0 + time * 2.2) * 0.03;
        vElevation = p.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vUv;
      varying float vElevation;
      void main() {
        float t   = vElevation * 6.0 + 0.5;
        vec3  col = mix(colorA, colorB, clamp(t, 0.0, 1.0));
        float spec = pow(max(0.0, vElevation * 8.0), 2.0);
        col += vec3(spec * 0.15);
        gl_FragColor = vec4(col, 0.88);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    waterMat.uniforms.time.value = timeRef.current;
  });

  return (
    <group position={[0, 0, -8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[8, 4, 30, 15]} />
        <primitive object={waterMat} attach="material" />
      </mesh>
      {[-1.2, 0, 1.2].map((ox, i) => (
        <group key={i} position={[ox, 0.12, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.14, 3.5]} />
            <meshStandardMaterial color="#6b4a28" roughness={0.95} />
          </mesh>
          {[-1.4, 0, 1.4].map((oz, j) => (
            <mesh key={j} position={[0, -0.22, oz]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.12, 0.5, 6]} />
              <meshStandardMaterial map={stoneTex} color="#5a4a38" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.9, -0.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color="#4a3018" roughness={1} />
      </mesh>
    </group>
  );
}

/* ============================================================================
   ELEMENTOS DE ESCALA (barris, pessoas, lenha)
   ========================================================================= */

function ScaleElements() {
  const barrels = [
    [2.0, 0.22, 2.0], [-2.0, 0.22, 2.0], [2.0, 0.22, -2.0], [-2.0, 0.22, -2.0],
  ] as [number, number, number][];

  const people = [
    [1.2, 0, 1.2, 0.5], [-1.2, 0, 1.2, 2.1], [1.2, 0, -1.2, 4.0], [-1.2, 0, -1.2, 1.3],
  ] as [number, number, number, number][];

  return (
    <group>
      {barrels.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.35, 8]} />
            <meshStandardMaterial color="#6a4020" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.04, 8]} />
            <meshStandardMaterial color="#3a1e08" roughness={1} />
          </mesh>
        </group>
      ))}
      {people.map(([x, y, z, rot], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, rot, 0]}>
          <mesh castShadow position={[0, 0.38, 0]}>
            <boxGeometry args={[0.16, 0.32, 0.1]} />
            <meshStandardMaterial color={`hsl(${20 + i * 40},40%,40%)`} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#d4a878" roughness={0.85} />
          </mesh>
          {([-0.06, 0.06] as number[]).map((lx, j) => (
            <mesh key={j} castShadow position={[lx, 0.12, 0]}>
              <boxGeometry args={[0.07, 0.24, 0.08]} />
              <meshStandardMaterial color={`hsl(${210 + i * 20},30%,30%)`} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {[0, 1, 2].map(i => (
        <mesh key={i} castShadow receiveShadow position={[3.5, 0.1 + i * 0.14, 0]}>
          <boxGeometry args={[0.6, 0.12, 0.14]} />
          <meshStandardMaterial color="#5a3a18" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================================
   ILUMINAÇÃO
   ========================================================================= */

function Lights() {
  return (
    <>
      <directionalLight
        position={[15, 12, 8]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
        color="#ffe8b0"
      />
      <ambientLight intensity={0.28} color="#90b0d0" />
      <hemisphereLight args={['#c8d8b0', '#6a5038', 0.25]} />
    </>
  );
}

/* ============================================================================
   CENA INTERNA
   ========================================================================= */

function VillageScene({
  selectedSlot,
  onSelectSlot,
  builtBuildings,
}: {
  selectedSlot: number | null;
  onSelectSlot: (i: number) => void;
  builtBuildings: Set<BuildingType>;
}) {
  return (
    <>
      <IsometricCamera />
      <Lights />
      <Environment preset="forest" />
      <fog attach="fog" args={['#c8d8c0', 35, 70]} />
      <Terrain />
      <Roads />
      <CircularWall />
      <Suspense fallback={null}>
        <CastleModel />
        {TREE_POSITIONS.map(([x, y, z, rot], i) => (
          <TreeModel key={i} position={[x, y, z]} rotation={rot} />
        ))}
      </Suspense>
      <Harbor />
      <ScaleElements />
      {SLOT_TYPES.map((slot, i) => (
        <BuildingSlot
          key={i}
          slotIndex={i}
          type={slot.type}
          label={slot.label}
          icon={slot.icon}
          selected={selectedSlot === i}
          built={builtBuildings.has(slot.type)}
          onClick={() => onSelectSlot(i)}
        />
      ))}
      <MapControls
        enableRotate={false}
        enablePan
        enableZoom
        minDistance={6}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2}
        panSpeed={0.8}
        zoomSpeed={0.8}
        screenSpacePanning
      />
    </>
  );
}

/* ============================================================================
   HUD
   ========================================================================= */

function HUD({ resources }: { resources: ReturnType<typeof useResources> }) {
  const items = [
    { icon: '🪵', label: 'Madeira', value: resources?.wood  ?? 0 },
    { icon: '🪨', label: 'Pedra',   value: resources?.stone ?? 0 },
    { icon: '⚙️', label: 'Ferro',   value: resources?.iron  ?? 0 },
    { icon: '🌾', label: 'Comida',  value: resources?.food  ?? 0 },
  ];
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      display: 'flex', gap: 8, zIndex: 10, pointerEvents: 'none',
    }}>
      {items.map(({ icon, label, value }) => (
        <div key={label} style={{
          background: 'rgba(12,8,4,0.78)',
          border: '1px solid rgba(200,160,80,0.45)',
          borderRadius: 8, padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
          color: '#e8d090', fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <span>{icon}</span>
          <span style={{ color: '#fff', fontSize: 12 }}>{Math.floor(value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   COMPONENTE PRINCIPAL
   ========================================================================= */

export function CastleView() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const resources = useResources();
  const buildings = useGameStore(s => s.castle?.buildings);

  const builtBuildings = useMemo(
    () => new Set(Object.keys(buildings || {}) as BuildingType[]),
    [buildings],
  );

  const selectedSlotData = selectedSlot !== null ? SLOT_TYPES[selectedSlot] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <HUD resources={resources} />
      <Canvas
        shadows
        orthographic
        camera={{ position: [12, 10, 12], zoom: 55, near: 0.1, far: 200 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: '#a8c4a0' }}
      >
        <Suspense fallback={null}>
          <VillageScene
            selectedSlot={selectedSlot}
            onSelectSlot={i => setSelectedSlot(prev => (prev === i ? null : i))}
            builtBuildings={builtBuildings}
          />
        </Suspense>
      </Canvas>
      {selectedSlotData && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)', zIndex: 20,
        }}>
          <BuildingCard buildingType={selectedSlotData.type} />
        </div>
      )}
    </div>
  );
}

export default CastleView;

useGLTF.preload('/casteloteste.glb');
useGLTF.preload('/arvoreum.glb');
