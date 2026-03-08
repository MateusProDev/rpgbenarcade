/**
 * CastleView — Vila Medieval 3D Realista (React Three Fiber)
 * 
 * Mapa totalmente em 3D com terreno realista, muralhas volumétricas,
 * edifícios modelados, vegetação variada e porto animado.
 * Substitui completamente o antigo SVG isométrico.
 */

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Html, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ─────────────────────────────────────────────────────────────────────────────
   TIPOS E CONFIGURAÇÕES
───────────────────────────────────────────────────────────────────────────── */

interface Slot {
  type: BuildingType;
  label: string;
  icon: string;
  x: number;   // coordenada X no mundo 3D
  z: number;   // coordenada Z no mundo 3D
  width: number;
  depth: number;
}

const SLOTS: Slot[] = [
  { type: 'sawmill',   label: 'Serraria', icon: '🪵', x: 620,  z: 430, width: 1.2, depth: 1.0 },
  { type: 'ironMine',  label: 'Mina de Ferro', icon: '⚙️', x: 1180, z: 430, width: 1.3, depth: 1.1 },
  { type: 'farm',      label: 'Fazenda', icon: '🌾', x: 460,  z: 620, width: 1.8, depth: 1.4 },
  { type: 'quarry',    label: 'Pedreira', icon: '🪨', x: 760,  z: 660, width: 1.5, depth: 1.2 },
  { type: 'barracks',  label: 'Quartel', icon: '⚔️', x: 1080, z: 595, width: 1.6, depth: 1.3 },
  { type: 'warehouse', label: 'Armazém', icon: '🏚️', x: 1280, z: 620, width: 1.4, depth: 1.2 },
  { type: 'academy',   label: 'Academia', icon: '📚', x: 900,  z: 740, width: 1.5, depth: 1.2 },
];

const MAP_SCALE = 0.0055;  // Escala para converter coordenadas SVG para mundo 3D
const MAP_CENTER_X = 900;   // Centro do mapa original
const MAP_CENTER_Z = 600;
const WORLD_SIZE = 12;      // Tamanho do mundo em unidades 3D

// Função para converter coordenadas SVG para mundo 3D
const svgToWorld = (x: number, z: number): [number, number, number] => {
  const worldX = (x - MAP_CENTER_X) * MAP_SCALE;
  const worldZ = (z - MAP_CENTER_Z) * MAP_SCALE;
  return [worldX, 0, worldZ];
};

/* ─────────────────────────────────────────────────────────────────────────────
   TERREMO COM RELEVO E TEXTURAS
───────────────────────────────────────────────────────────────────────────── */

/** Gera uma textura de grama procedural via Canvas 2D (sem arquivos externos) */
function makeGrassTex(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base verde
  ctx.fillStyle = '#5a7a3a';
  ctx.fillRect(0, 0, size, size);

  // Manchas de variação de cor
  const rng = (seed: number) => ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1;
  for (let i = 0; i < 800; i++) {
    const rx = rng(i * 3.1) * size;
    const ry = rng(i * 7.3) * size;
    const rr = 2 + rng(i * 13.7) * 10;
    const bright = rng(i * 5.9) > 0.5;
    ctx.fillStyle = bright ? '#6a8a48' : '#4a6a2a';
    ctx.globalAlpha = 0.35 + rng(i * 2.3) * 0.3;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fios de grama
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 300; i++) {
    const gx = rng(i * 4.7) * size;
    const gy = rng(i * 8.1) * size;
    ctx.strokeStyle = rng(i) > 0.5 ? '#7a9a50' : '#3a5a20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (rng(i * 2) - 0.5) * 6, gy - 5 - rng(i * 3) * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(30, 30);
  return tex;
}

function Terrain() {
  // Textura procedural criada uma única vez
  const grassTex = useMemo(() => makeGrassTex(), []);

  // Geometria com relevo calculada uma única vez (useMemo, não useFrame)
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      WORLD_SIZE * 1.8, WORLD_SIZE * 1.8, 128, 128
    );
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // PlaneGeometry usa Y antes de rotacionar
      const noise1 = Math.sin(x * 2.5) * Math.cos(z * 2.3) * 0.08;
      const noise2 = Math.sin(x * 5.0) * Math.cos(z * 4.8) * 0.03;
      const noise3 = Math.sin(x * 1.2 + 1.5) * Math.cos(z * 1.4 - 0.7) * 0.12;
      const dist   = Math.sqrt(x * x + z * z);
      const hill   = Math.max(0, 1 - dist / 4) * 0.25;
      const wall   = Math.max(0, 1 - Math.min(Math.abs(x), Math.abs(z)) / 2) * 0.1;
      pos.setZ(i, noise1 + noise2 + noise3 + hill + wall);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.2, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        map={grassTex}
        roughness={0.85}
        metalness={0.0}
        color="#8a9a6a"
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MURALHAS REALISTAS COM AMEIAS
───────────────────────────────────────────────────────────────────────────── */

function WallSection({ start, end, height = 1.2 }: { start: [number, number]; end: [number, number]; height?: number }) {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + 
    Math.pow(end[1] - start[1], 2)
  );
  
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const wallWidth = 0.25;
  const numCrenellations = Math.floor(length / 0.25);
  
  return (
    <group position={[midX, height/2, midZ]} rotation={[0, -angle, 0]}>
      {/* Corpo principal da muralha */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, wallWidth]} />
        <meshStandardMaterial color="#948470" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Base da muralha (pedras mais escuras) */}
      <mesh position={[0, -height/2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[length + 0.1, 0.2, wallWidth + 0.2]} />
        <meshStandardMaterial color="#6a5e4e" roughness={0.9} />
      </mesh>
      
      {/* Ameias no topo */}
      {Array.from({ length: numCrenellations }).map((_, i) => {
        const t = (i + 0.5) / numCrenellations - 0.5;
        const xPos = t * length;
        return (
          <group key={i} position={[xPos, height/2 + 0.15, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.15, 0.3, wallWidth + 0.1]} />
              <meshStandardMaterial color="#a5947a" roughness={0.7} />
            </mesh>
          </group>
        );
      })}
      
      {/* Textura de pedra (detalhes com linhas) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const yPos = -height/2 + (i + 0.5) * height/8;
        return (
          <mesh key={i} position={[0, yPos, wallWidth/2 + 0.01]} rotation={[0, 0, 0]}>
            <planeGeometry args={[length, 0.02]} />
            <meshStandardMaterial color="#3a3228" emissive="#181410" />
          </mesh>
        );
      })}
    </group>
  );
}

function VillageWalls() {
  // Pontos do perímetro da vila (em coordenadas mundo)
  const wallPoints: [number, number][] = [
    [-4.5, -3.2], [-1.5, -4.0], [1.8, -3.8], [4.8, -2.8],
    [5.2, 0.5], [4.5, 3.2], [1.8, 4.2], [-1.2, 4.5],
    [-4.2, 3.8], [-5.0, 0.8], [-4.5, -3.2]
  ];
  
  return (
    <group>
      {wallPoints.map((point, i) => {
        if (i === wallPoints.length - 1) return null;
        const start = point;
        const end = wallPoints[i + 1];
        return (
          <WallSection 
            key={i} 
            start={start} 
            end={end} 
            height={1.0 + Math.sin(i) * 0.2} 
          />
        );
      })}
      
      {/* Torres nos vértices */}
      {wallPoints.slice(0, -1).map((point, i) => (
        <group key={`tower-${i}`} position={[point[0], 0, point[1]]}>
          {/* Base da torre */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.6, 1.6, 8]} />
            <meshStandardMaterial color="#7a6e5a" roughness={0.8} />
          </mesh>
          {/* Topo da torre */}
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 8]} />
            <meshStandardMaterial color="#8a7e64" roughness={0.7} />
          </mesh>
          {/* Telhado cônico */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.4, 0.5, 8]} />
            <meshStandardMaterial color="#6a4e2e" roughness={0.6} />
          </mesh>
          {/* Bandeira */}
          <mesh position={[0.3, 1.3, 0.2]} rotation={[0, 0.2, 0.1]} castShadow>
            <boxGeometry args={[0.05, 0.3, 0.2]} />
            <meshStandardMaterial color="#b82" />
          </mesh>
        </group>
      ))}
      
      {/* Portão principal */}
      <group position={[0, 0, -3.2]}>
        {/* Arco do portão */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.6, 0.4]} />
          <meshStandardMaterial color="#6a5a42" />
        </mesh>
        {/* Abertura (porta) */}
        <mesh position={[0, 0.5, 0.21]} castShadow>
          <boxGeometry args={[1.2, 1.2, 0.1]} />
          <meshStandardMaterial color="#4a3a28" />
        </mesh>
        {/* Reforços de ferro */}
        <mesh position={[-0.4, 0.5, 0.27]} castShadow>
          <boxGeometry args={[0.1, 1.0, 0.05]} />
          <meshStandardMaterial color="#aa9" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.4, 0.5, 0.27]} castShadow>
          <boxGeometry args={[0.1, 1.0, 0.05]} />
          <meshStandardMaterial color="#aa9" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EDIFÍCIOS DETALHADOS
───────────────────────────────────────────────────────────────────────────── */

function Building({ slot, isSelected, onClick }: { slot: Slot; isSelected: boolean; onClick: () => void }) {
  const [worldX, , worldZ] = svgToWorld(slot.x, slot.z);
  const meshRef = useRef<THREE.Group>(null);
  
  // Animação de seleção
  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
    } else if (meshRef.current) {
      meshRef.current.position.y = 0;
    }
  });
  
  // Cores baseadas no tipo de construção
  const getColors = () => {
    switch(slot.type) {
      case 'sawmill': return { wood: '#8b5a2b', roof: '#5d3a1a' };
      case 'ironMine': return { wood: '#5a4a3a', roof: '#3a2a1a', stone: '#6a5a4a' };
      case 'farm': return { wood: '#a57c52', roof: '#7a5a32', walls: '#c09a6a' };
      case 'quarry': return { wood: '#6a5e4a', roof: '#4a3e2a', stone: '#8a7e6a' };
      case 'barracks': return { wood: '#5a4a32', roof: '#3a2a18', walls: '#8a7a5a' };
      case 'warehouse': return { wood: '#7a623a', roof: '#5a421a', walls: '#9a825a' };
      case 'academy': return { wood: '#6a523a', roof: '#4a321a', walls: '#b89a6a', trim: '#c8a86a' };
      default: return { wood: '#8b5a2b', roof: '#5d3a1a' };
    }
  };
  
  const colors = getColors();
  
  return (
    <group 
      ref={meshRef}
      position={[worldX, 0, worldZ]} 
      onClick={onClick}
      onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = 'pointer'))}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Sombra projetada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[slot.width * 1.5, slot.depth * 1.5]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
      
      {/* Base/Piso */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[slot.width * 1.1, 0.1, slot.depth * 1.1]} />
        <meshStandardMaterial color="#6a5a42" roughness={0.9} />
      </mesh>
      
      {/* Paredes */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[slot.width, 0.8, slot.depth]} />
        <meshStandardMaterial color={colors.walls || colors.wood} roughness={0.7} />
      </mesh>
      
      {/* Detalhes das paredes (janelas/portas) */}
      {slot.type === 'academy' && (
        <>
          <mesh position={[0.3, 0.5, slot.depth/2 + 0.05]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.05]} />
            <meshStandardMaterial color="#c8b07a" emissive="#321" />
          </mesh>
          <mesh position={[-0.3, 0.5, slot.depth/2 + 0.05]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.05]} />
            <meshStandardMaterial color="#c8b07a" emissive="#321" />
          </mesh>
        </>
      )}
      
      {/* Telhado */}
      <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[slot.width * 0.7, 0.6, 4]} />
        <meshStandardMaterial color={colors.roof} roughness={0.8} />
      </mesh>
      
      {/* Chaminé (para alguns edifícios) */}
      {(slot.type === 'sawmill' || slot.type === 'ironMine') && (
        <mesh position={[0.3, 0.7, -0.2]} castShadow>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color="#6a5a42" roughness={0.9} />
        </mesh>
      )}
      
      {/* Indicador de seleção (anel brilhante) */}
      {isSelected && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[slot.width * 0.8, slot.width * 0.9, 32]} />
            <meshStandardMaterial color="#ffaa00" emissive="#442200" transparent opacity={0.6} />
          </mesh>
          <Html position={[0, 1.5, 0]} center>
            <div className="bg-amber-900/90 text-amber-100 px-3 py-1 rounded-full border border-amber-500 shadow-lg text-sm whitespace-nowrap">
              {slot.icon} {slot.label}
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CASTELO PRINCIPAL (DETALHADO)
───────────────────────────────────────────────────────────────────────────── */

function Castle() {
  return (
    <group position={[0, 0.2, 0.8]}>
      {/* Plataforma da colina */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.4, 16]} />
        <meshStandardMaterial color="#6a5e4a" roughness={0.9} />
      </mesh>
      
      {/* Torre principal */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.0, 2.0, 8]} />
        <meshStandardMaterial color="#8a7a68" roughness={0.8} />
      </mesh>
      
      {/* Topo da torre principal */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.3, 8]} />
        <meshStandardMaterial color="#9a8a72" roughness={0.7} />
      </mesh>
      
      {/* Telhado da torre principal */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <coneGeometry args={[0.7, 0.8, 8]} />
        <meshStandardMaterial color="#6a4e2e" roughness={0.6} />
      </mesh>
      
      {/* Torres laterais */}
      {[-1.2, 1.2].map((x, i) => (
        <group key={i} position={[x, 0.5, 0.7]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.55, 1.2, 6]} />
            <meshStandardMaterial color="#7a6e5a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.4, 0.5, 6]} />
            <meshStandardMaterial color="#5d3a1a" roughness={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* Muralha conectando as torres */}
      <mesh position={[0, 0.7, 1.1]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.8, 0.4]} />
        <meshStandardMaterial color="#8a7a68" roughness={0.8} />
      </mesh>
      
      {/* Bandeira no topo */}
      <mesh position={[0.4, 2.7, 0.1]} rotation={[0, 0.2, 0.1]} castShadow>
        <boxGeometry args={[0.05, 0.4, 0.2]} />
        <meshStandardMaterial color="#c82" />
      </mesh>
      
      {/* Entrada principal */}
      <mesh position={[0, 0.5, 1.3]} castShadow>
        <boxGeometry args={[0.8, 1.0, 0.2]} />
        <meshStandardMaterial color="#4a3a28" />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PORTO COM ÁGUA ANIMADA
───────────────────────────────────────────────────────────────────────────── */

function Harbor() {
  const waterRef = useRef<THREE.Mesh>(null);
  
  // Animação da água
  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime;
      }
    }
  });
  
  // Shader personalizado para água
  const waterShader = {
    uniforms: {
      time: { value: 0 },
      colorDeep: { value: new THREE.Color('#1a4a6a') },
      colorShallow: { value: new THREE.Color('#3a8ab0') }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vElevation;
      void main() {
        vUv = uv;
        vec3 pos = position;
        vElevation = sin(pos.x * 2.0 + time * 2.0) * cos(pos.z * 1.5 + time) * 0.03;
        pos.y += vElevation;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorDeep;
      uniform vec3 colorShallow;
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        float mixFactor = (sin(vUv.x * 20.0 + time * 3.0) * cos(vUv.y * 15.0 + time * 2.0) + 1.0) * 0.5;
        vec3 color = mix(colorDeep, colorShallow, mixFactor);
        float alpha = 0.85 + vElevation * 2.0;
        gl_FragColor = vec4(color, alpha);
      }
    `
  };
  
  return (
    <group position={[0, -0.1, 3.5]}>
      {/* Água com shader */}
      <mesh 
        ref={waterRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[8, 5, 32, 32]} />
        <shaderMaterial 
          args={[waterShader]} 
          transparent 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Docas de madeira */}
      {[-2, 0, 2].map((x, i) => (
        <group key={i} position={[x, 0.1, -0.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.15, 4.0]} />
            <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
          </mesh>
          {/* Pilares */}
          {[-1.5, 0, 1.5].map((z, j) => (
            <mesh key={j} position={[0, -0.3, z]} castShadow receiveShadow>
              <cylinderGeometry args={[0.15, 0.2, 0.6, 6]} />
              <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Barco 1 */}
      <group position={[1.5, 0.2, 0.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.2, 0.4]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.2, 0.5, 6]} />
          <meshStandardMaterial color="#a57c52" roughness={0.6} />
        </mesh>
        <mesh position={[0.3, 0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.3]} />
          <meshStandardMaterial color="#8b6b4b" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Barco 2 */}
      <group position={[-1.2, 0.15, 1.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.15, 0.35]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <coneGeometry args={[0.15, 0.4, 6]} />
          <meshStandardMaterial color="#a57c52" roughness={0.6} />
        </mesh>
      </group>
      
      {/* Farol/Poste na ponta do cais */}
      <group position={[2.8, 0.4, -1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
          <meshStandardMaterial color="#6a5a42" />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="#ffaa30" emissive="#442200" />
        </mesh>
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   VEGETAÇÃO VARIADA
───────────────────────────────────────────────────────────────────────────── */

function Tree({ x, z, type = 'oak' }: { x: number; z: number; type?: 'oak' | 'cypress' | 'pine' }) {
  const [worldX, , worldZ] = svgToWorld(x, z);
  const scale = 0.3 + Math.random() * 0.2;
  const treeRef = useRef<THREE.Group>(null);
  
  // Pequena animação de balanço
  useFrame((state) => {
    if (treeRef.current) {
      treeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + x) * 0.02;
    }
  });
  
  if (type === 'cypress') {
    return (
      <group ref={treeRef} position={[worldX, 0, worldZ]} scale={[scale, scale, scale]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.2, 1.4]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <coneGeometry args={[0.5, 1.0, 6]} />
          <meshStandardMaterial color="#1e4a1a" roughness={0.7} emissive="#0a1a0a" />
        </mesh>
      </group>
    );
  } else if (type === 'pine') {
    return (
      <group ref={treeRef} position={[worldX, 0, worldZ]} scale={[scale, scale, scale]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.25, 1.6]} />
          <meshStandardMaterial color="#4a321a" roughness={0.9} />
        </mesh>
        {[0.4, 0.7, 1.0].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <coneGeometry args={[0.6 - i * 0.15, 0.4, 6]} />
            <meshStandardMaterial color="#2a5e1a" roughness={0.7} />
          </mesh>
        ))}
      </group>
    );
  } else { // oak
    return (
      <group ref={treeRef} position={[worldX, 0, worldZ]} scale={[scale, scale, scale]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.3, 1.2]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.7]} />
          <meshStandardMaterial color="#3a7a2a" roughness={0.6} emissive="#1a3a1a" />
        </mesh>
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="#2a6a1a" roughness={0.7} />
          </mesh>
        ))}
      </group>
    );
  }
}

function Bush({ x, z }: { x: number; z: number }) {
  const [worldX, , worldZ] = svgToWorld(x, z);
  const scale = 0.2 + Math.random() * 0.15;
  
  return (
    <group position={[worldX, 0, worldZ]} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.6]} />
        <meshStandardMaterial color="#3a7228" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.1]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#4a8a32" roughness={0.7} />
      </mesh>
      <mesh position={[-0.2, 0.1, -0.2]} castShadow>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#2a5e1a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ELEMENTOS DE CENA (NUVENS, PASSAROS, ETC)
───────────────────────────────────────────────────────────────────────────── */

function Clouds() {
  return (
    <>
      <Cloud position={[-3, 4, -2]} opacity={0.5} speed={0.2} />
      <Cloud position={[2, 5, 1]} opacity={0.6} speed={0.15} />
      <Cloud position={[4, 4.5, -3]} opacity={0.4} speed={0.25} />
    </>
  );
}

function Birds() {
  const birdsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (birdsRef.current) {
      birdsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.2) * 2;
      birdsRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.3) * 2;
      birdsRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={birdsRef} position={[2, 3, 1]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} position={[i * 0.2, Math.sin(i) * 0.1, i * 0.1]}>
          <mesh rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.05, 0.15, 3]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0.1, 0, 0]} rotation={[0, 0, -0.3]} castShadow>
            <coneGeometry args={[0.05, 0.15, 3]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ILUMINAÇÃO E ATMOSFERA
───────────────────────────────────────────────────────────────────────────── */

function SceneLights() {
  return (
    <>
      {/* Luz ambiente suave */}
      <ambientLight intensity={0.3} color="#b0b8d0" />
      
      {/* Luz solar principal */}
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        color="#faf0d0"
      />
      
      {/* Preenchimento lateral (luz do céu) */}
      <directionalLight position={[-5, 5, 10]} intensity={0.4} color="#a0b0d0" />
      
      {/* Luz de fundo (contraluz) */}
      <directionalLight position={[-5, 2, -10]} intensity={0.2} color="#7080a0" />
      
      {/* Tochas/lanternas (pontos de luz quente) */}
      <pointLight position={[2.5, 1.2, -1.5]} intensity={0.5} color="#ffa050" distance={4} />
      <pointLight position={[-2.2, 1.2, 2.0]} intensity={0.4} color="#ffa050" distance={4} />
      <pointLight position={[1.0, 1.5, 3.2]} intensity={0.3} color="#ffa050" distance={5} />
      
      {/* Névoa */}
      <fog attach="fog" args={['#1a1a2e', 12, 25]} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CENA PRINCIPAL
───────────────────────────────────────────────────────────────────────────── */

function Scene({ selectedSlot, onSlotClick }: {
  selectedSlot: BuildingType | null;
  onSlotClick: (type: BuildingType) => void;
}) {
  return (
    <>
      <SceneLights />
      <Terrain />
      <VillageWalls />
      <Castle />
      <Harbor />
      <Clouds />
      <Birds />
      
      {/* ÁRVORES - Posicionadas conforme o mapa SVG original */}
      {/* Ciprestes nas muralhas norte */}
      <Tree x={420} z={254} type="cypress" />
      <Tree x={490} z={238} type="cypress" />
      <Tree x={1310} z={238} type="cypress" />
      <Tree x={1382} z={254} type="cypress" />
      <Tree x={560} z={250} type="pine" />
      <Tree x={1242} z={250} type="pine" />
      
      {/* Carvalhos na colina do castelo */}
      <Tree x={520} z={432} type="oak" />
      <Tree x={560} z={408} type="oak" />
      <Tree x={1280} z={432} type="oak" />
      <Tree x={1240} z={408} type="oak" />
      <Tree x={620} z={382} type="oak" />
      <Tree x={1180} z={382} type="oak" />
      
      {/* Árvores ao redor da plataforma do castelo */}
      <Tree x={640} z={470} type="oak" />
      <Tree x={1160} z={468} type="oak" />
      
      {/* Vegetação no distrito central */}
      <Tree x={380} z={540} type="oak" />
      <Tree x={340} z={570} type="pine" />
      <Tree x={308} z={530} type="cypress" />
      <Tree x={1420} z={540} type="oak" />
      <Tree x={1460} z={568} type="pine" />
      <Tree x={1492} z={528} type="cypress" />
      
      {/* Árvores entre as fundações */}
      <Tree x={536} z={555} type="oak" />
      <Tree x={1268} z={552} type="oak" />
      
      {/* Vegetação na área sul (perto do porto) */}
      <Tree x={380} z={720} type="oak" />
      <Tree x={420} z={750} type="pine" />
      <Tree x={1420} z={718} type="oak" />
      <Tree x={1460} z={748} type="pine" />
      <Tree x={352} z={718} type="cypress" />
      <Tree x={1448} z={716} type="cypress" />
      
      {/* Árvores fora das muralhas */}
      <Tree x={100} z={480} type="oak" />
      <Tree x={155} z={510} type="pine" />
      <Tree x={60} z={460} type="cypress" />
      <Tree x={120} z={420} type="cypress" />
      <Tree x={1650} z={480} type="oak" />
      <Tree x={1700} z={512} type="pine" />
      <Tree x={1740} z={456} type="cypress" />
      
      {/* Arbustos */}
      <Bush x={680} z={490} />
      <Bush x={750} z={480} />
      <Bush x={1050} z={478} />
      <Bush x={1120} z={490} />
      <Bush x={560} z={578} />
      <Bush x={508} z={562} />
      <Bush x={1300} z={575} />
      <Bush x={355} z={738} />
      <Bush x={455} z={760} />
      <Bush x={1488} z={736} />
      <Bush x={680} z={858} />
      <Bush x={720} z={870} />
      <Bush x={1082} z={858} />
      <Bush x={1120} z={870} />
      <Bush x={80} z={540} />
      <Bush x={180} z={580} />
      <Bush x={1622} z={545} />
      <Bush x={1720} z={572} />
      <Bush x={280} z={888} />
      <Bush x={320} z={904} />
      <Bush x={1478} z={888} />
      <Bush x={1520} z={904} />
      
      {/* FUNDAÇÕES / EDIFÍCIOS CONSTRUÍVEIS */}
      {SLOTS.map((slot) => (
        <Building
          key={slot.type}
          slot={slot}
          isSelected={selectedSlot === slot.type}
          onClick={() => onSlotClick(slot.type)}
        />
      ))}
      
      {/* Chão invisível para capturar cliques fora dos objetos */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.3, 0]} 
        onClick={() => onSlotClick(null as any)}
        visible={false}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL (com HUD e Canvas)
═══════════════════════════════════════════════════════════════════════════ */

export const CastleView: React.FC = () => {
  const castle = useGameStore((s) => s.castle);
  const resources = useResources();
  const [selected, setSelected] = useState<BuildingType | null>(null);

  if (!castle) {
    return (
      <div className="flex items-center justify-center h-screen text-stone-400 text-sm bg-stone-950">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏰</div>
          <div>Carregando vila medieval...</div>
        </div>
      </div>
    );
  }

  const res = resources ?? castle.resources;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-950">
      {/* HUD de recursos (estilo original) */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center gap-2 px-4 py-2 text-sm"
        style={{
          background: 'linear-gradient(90deg, rgba(8,5,2,0.97), rgba(22,14,5,0.97))',
          borderBottom: '1px solid #b8860b44',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span className="font-medieval text-yellow-500 text-base mr-1 flex items-center">
          🏰 Nível {castle.level}
        </span>
        <span className="text-amber-300 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>🌾</span> {Math.floor(res.food).toLocaleString()}
        </span>
        <span className="text-green-300 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>🪵</span> {Math.floor(res.wood).toLocaleString()}
        </span>
        <span className="text-stone-300 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>🪨</span> {Math.floor(res.stone).toLocaleString()}
        </span>
        <span className="text-sky-300 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>⚙️</span> {Math.floor(res.iron).toLocaleString()}
        </span>
        <span className="ml-auto text-stone-500 text-xs bg-black/30 px-2 py-0.5 rounded">
          [{castle.mapX},{castle.mapY}]
        </span>
      </div>

      {/* MINIMAP (canto inferior direito) */}
      <div className="absolute bottom-4 right-4 z-20 w-48 h-48 bg-stone-900/80 rounded-lg border border-amber-700/50 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-1 left-1 text-amber-500 text-xs">MINIMAP</div>
        <div className="w-full h-full relative">
          {/* Representação simples do mapa */}
          <div className="absolute inset-2 bg-stone-800 rounded">
            {/* Posição do jogador */}
            <div className="absolute w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ left: '50%', top: '50%' }}></div>
          </div>
        </div>
      </div>

      {/* CANVAS 3D */}
      <Canvas
        shadows
        camera={{ 
          position: [6, 5, 10], 
          fov: 50,
          near: 0.1,
          far: 50
        }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <Sky 
          distance={450000} 
          sunPosition={[5, 30, 10]} 
          inclination={0.5} 
          azimuth={0.25}
          turbidity={8}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Environment preset="forest" background={false} />
        
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.2}
          maxDistance={18}
          minDistance={4}
          target={[0, 0.5, 0]}
          makeDefault
        />
        
        <Scene selectedSlot={selected} onSlotClick={setSelected} />
      </Canvas>

      {/* Painel do Edifício Selecionado */}
      {selected && (
        <div className="absolute bottom-4 left-4 md:left-auto md:right-4 md:w-96 z-20 animate-slideUp">
          <div className="relative">
            <BuildingCard buildingType={selected} />
            <button
              className="absolute top-2 right-2 text-stone-400 hover:text-amber-300 text-xl leading-none w-8 h-8 rounded-full bg-black/50 flex items-center justify-center transition-colors"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* INSTRUÇÕES */}
      <div className="absolute bottom-4 left-4 z-20 text-stone-400 text-xs bg-black/50 px-3 py-1 rounded-full">
        🖱️ Arraste para rotacionar | Scroll para zoom | Clique nos edifícios
      </div>
    </div>
  );
};