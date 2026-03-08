/**
 * CastleView — Vila Medieval 3D com Estilo Pintado à Mão (VERSÃO COMPLETA)
 * 
 * - Neblina e nuvens removidas
 * - Castelo principal: casteloteste.glb com texturas pintadas
 * - Árvores: arvoreum.glb
 * - Muralhas de pedra realistas com textura pintada
 * - Estradas de terra com textura pintada
 * - Vegetação variada com modelos GLB
 * - Porto com água animada
 * - Edifícios construíveis com seleção e feedback visual
 * - HUD completo com recursos e minimapa
 * - Iluminação suave estilo pintura antiga
 */

import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Html, useGLTF, Loader } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingType } from '../../types';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import { BuildingCard } from './BuildingCard';

/* ============================================================================
   TIPOS E CONFIGURAÇÕES
   ========================================================================= */

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

/* ============================================================================
   TEXTURAS PINTADAS À MÃO (geradas via Canvas 2D)
   ========================================================================= */

/**
 * Cria textura de grama com estilo aquarela/pinceladas
 */
function createHandPaintedGrassTex(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base verde pastel
  ctx.fillStyle = '#8ba87a';
  ctx.fillRect(0, 0, size, size);

  // Pinceladas suaves com variação de cor
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 15 + Math.random() * 50;
    const hue = 90 + (Math.random() * 40 - 20);
    const sat = 30 + Math.random() * 40;
    const light = 50 + Math.random() * 30;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
    ctx.globalAlpha = 0.1 + Math.random() * 0.2;
    ctx.fill();
  }

  // Traços de grama
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#5a724a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 30, y - 15 - Math.random() * 30);
    ctx.stroke();
  }

  // Pequenas flores silvestres
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `hsl(${Math.random() * 60 + 300}, 80%, 70%)`; // tons de rosa/lilás
    ctx.beginPath();
    ctx.arc(x, y, 3 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = `hsl(50, 80%, 60%)`; // centro amarelo
    ctx.beginPath();
    ctx.arc(x - 1, y - 1, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(25, 25);
  return tex;
}

/**
 * Cria textura de pedra com aparência envelhecida e pintada
 */
function createStoneTex(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base de pedra
  ctx.fillStyle = '#8a7a6a';
  ctx.fillRect(0, 0, size, size);

  // Manchas de musgo e desgaste
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 20 + Math.random() * 100;
    const h = 15 + Math.random() * 80;
    const hue = 60 + Math.random() * 40;
    ctx.fillStyle = `hsl(${hue}, 30%, ${30 + Math.random() * 30}%)`;
    ctx.globalAlpha = 0.2 + Math.random() * 0.3;
    ctx.fillRect(x, y, w, h);
  }

  // Linhas de argamassa
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.3;
  
  // Linhas horizontais
  for (let i = 0; i < 20; i++) {
    const y = i * 45 + (Math.random() * 10 - 5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 60) {
      ctx.lineTo(x + 30, y + (Math.random() * 8 - 4));
    }
    ctx.lineTo(size, y + (Math.random() * 8 - 4));
    ctx.stroke();
  }

  // Linhas verticais
  for (let i = 0; i < 15; i++) {
    const x = i * 70 + (Math.random() * 15 - 7.5);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < size; y += 50) {
      ctx.lineTo(x + (Math.random() * 10 - 5), y + 25);
    }
    ctx.lineTo(x + (Math.random() * 10 - 5), size);
    ctx.stroke();
  }

  // Sombras nas pedras
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 5, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * Cria textura de terra para estradas
 */
function createRoadTex(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base terrosa
  ctx.fillStyle = '#6a5a42';
  ctx.fillRect(0, 0, size, size);

  // Textura de terra batida
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 5 + Math.random() * 20;
    const h = 3 + Math.random() * 15;
    const dark = Math.random() > 0.5;
    ctx.fillStyle = dark ? '#4a3a2a' : '#8a7a5a';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, w, h);
  }

  // Pegadas e marcas de carroça
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 4;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40, y + 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 10, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1a0a';
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * Cria textura para telhados (estilo madeira pintada)
 */
function createRoofTex(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(0, 0, size, size);

  // Textura de madeira
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 30 + Math.random() * 80;
    const h = 5 + Math.random() * 15;
    ctx.fillStyle = `hsl(${20 + Math.random() * 20}, 60%, ${30 + Math.random() * 20}%)`;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, w, h);
  }

  // Linhas de telhas
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 30; i++) {
    const y = i * 20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 25) {
      ctx.lineTo(x + 12, y + 5);
    }
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

/* ============================================================================
   TERRENO COM RELEVO E TEXTURA PINTADA
   ========================================================================= */

function Terrain() {
  const grassTex = useMemo(() => createHandPaintedGrassTex(), []);

  // Geometria com relevo calculada uma única vez
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2, 128, 128);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // PlaneGeometry usa Y antes de rotacionar
      
      // Ruído senoidal para colinas suaves
      const noise1 = Math.sin(x * 1.5) * Math.cos(z * 1.3) * 0.15;
      const noise2 = Math.sin(x * 3.0) * Math.cos(z * 2.8) * 0.08;
      const noise3 = Math.sin(x * 0.8) * Math.cos(z * 0.9) * 0.2;
      
      // Elevação central (colina do castelo)
      const dist = Math.sqrt(x * x + z * z);
      const hill = Math.max(0, 1 - dist / 6) * 0.35;
      
      // Pequenas elevações perto das muralhas
      const wallDistX = Math.min(Math.abs(x + 4.5), Math.abs(x - 4.5));
      const wallDistZ = Math.min(Math.abs(z + 4.2), Math.abs(z - 4.2));
      const wallHill = Math.max(0, 0.8 - Math.min(wallDistX, wallDistZ)) * 0.1;
      
      pos.setZ(i, noise1 + noise2 + noise3 + hill + wallHill);
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
        roughness={0.9}
        color="#b0c09a"
        emissive="#2a3a1a"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

/* ============================================================================
   MURALHAS DE PEDRA REALISTAS
   ========================================================================= */

function StoneWallSegment({ 
  start, 
  end, 
  height = 1.4
}: { 
  start: [number, number]; 
  end: [number, number]; 
  height?: number;
  hasTower?: boolean;
}) {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const stoneTex = useMemo(() => createStoneTex(), []);

  const numCrenellations = Math.floor(length / 0.35);
  const numDetails = Math.floor(length / 0.5);

  return (
    <group position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]}>
      {/* Corpo principal da muralha */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, 0.5]} />
        <meshStandardMaterial 
          map={stoneTex} 
          roughness={0.8} 
          color="#948470"
          emissive="#322a22"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Base da muralha (mais larga) */}
      <mesh position={[0, -height / 2 + 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length + 0.2, 0.3, 0.7]} />
        <meshStandardMaterial 
          map={stoneTex} 
          roughness={0.9} 
          color="#6a5e4a"
        />
      </mesh>
      
      {/* Topo da muralha (caminho de ronda) */}
      <mesh position={[0, height / 2 - 0.1, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.15, 0.6]} />
        <meshStandardMaterial 
          map={stoneTex} 
          roughness={0.7} 
          color="#a5947a"
        />
      </mesh>
      
      {/* Ameias */}
      {Array.from({ length: numCrenellations }).map((_, i) => {
        const t = (i + 0.5) / numCrenellations - 0.5;
        const xPos = t * length;
        const gap = i % 2 === 0; // alterna para criar ameias e gaps
        
        if (gap) {
          return (
            <mesh key={i} position={[xPos, height / 2 + 0.25, 0.15]} castShadow receiveShadow>
              <boxGeometry args={[0.25, 0.4, 0.65]} />
              <meshStandardMaterial 
                map={stoneTex} 
                roughness={0.7} 
                color="#a5947a"
              />
            </mesh>
          );
        }
        return null;
      })}
      
      {/* Detalhes de pedra (protuberâncias) */}
      {Array.from({ length: numDetails }).map((_, i) => {
        const t = (i + 0.5) / numDetails - 0.5;
        const xPos = t * length;
        const yPos = -height/2 + 0.3 + Math.random() * height * 0.6;
        if (Math.random() > 0.7) {
          return (
            <mesh key={i} position={[xPos, yPos, 0.26]} castShadow>
              <boxGeometry args={[0.15, 0.1 + Math.random()*0.1, 0.1]} />
              <meshStandardMaterial color="#6a5a42" roughness={0.9} />
            </mesh>
          );
        }
        return null;
      })}
      
      {/* Musgo */}
      {Array.from({ length: 8 }).map((_, i) => {
        const xPos = (i / 7 - 0.5) * length * 0.8;
        const yPos = -height/2 + 0.2 + Math.random() * height * 0.6;
        if (Math.random() > 0.6) {
          return (
            <mesh key={i} position={[xPos, yPos, 0.27]} castShadow>
              <sphereGeometry args={[0.1 + Math.random()*0.15]} />
              <meshStandardMaterial color="#3a7228" roughness={0.9} emissive="#1a3a0a" emissiveIntensity={0.1} />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}

function Tower({ position, height = 2.0 }: { position: [number, number, number]; height?: number }) {
  const stoneTex = useMemo(() => createStoneTex(), []);
  const roofTex = useMemo(() => createRoofTex(), []);
  
  return (
    <group position={position}>
      {/* Base da torre */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, height, 8]} />
        <meshStandardMaterial map={stoneTex} roughness={0.8} color="#7a6e5a" />
      </mesh>
      
      {/* Topo da torre (merlões) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 0.7;
        const z = Math.sin(angle) * 0.7;
        return (
          <mesh key={i} position={[x, height/2, z]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.2]} />
            <meshStandardMaterial map={stoneTex} color="#8a7e64" />
          </mesh>
        );
      })}
      
      {/* Telhado cônico */}
      <mesh position={[0, height/2 + 0.4, 0]} castShadow>
        <coneGeometry args={[0.6, 0.7, 8]} />
        <meshStandardMaterial map={roofTex} color="#6a4e2e" emissive="#321" emissiveIntensity={0.1} />
      </mesh>
      
      {/* Bandeira */}
      <group position={[0.4, height/2 + 0.6, 0.2]} rotation={[0, 0.2, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.4, 0.02]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0.2, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.2, 0.02]} />
          <meshStandardMaterial color="#b82" emissive="#420" emissiveIntensity={0.3} />
        </mesh>
      </group>
      
      {/* Janelas/Setas */}
      {[0.3, 0.7].map((y, i) => (
        <mesh key={i} position={[0.5, y, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.25, 0.1]} />
          <meshStandardMaterial color="#321" emissive="#210" />
        </mesh>
      ))}
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
      {/* Muralhas entre os pontos */}
      {wallPoints.map((point, i) => {
        if (i === wallPoints.length - 1) return null;
        const start = point;
        const end = wallPoints[i + 1];
        return (
          <StoneWallSegment 
            key={i} 
            start={start} 
            end={end} 
            height={1.3 + Math.sin(i) * 0.1} 
          />
        );
      })}
      
      {/* Torres nos vértices */}
      {wallPoints.slice(0, -1).map((point, i) => (
        <Tower 
          key={`tower-${i}`} 
          position={[point[0], 0, point[1]]} 
          height={2.0 + Math.sin(i) * 0.3}
        />
      ))}
      
      {/* Torres adicionais nos portões */}
      <Tower position={[0.8, 0, -3.0]} height={2.2} />
      <Tower position={[-0.8, 0, -3.0]} height={2.2} />
      
      {/* Portão principal */}
      <group position={[0, 0, -3.2]}>
        {/* Arco do portão */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 2.0, 0.6]} />
          <meshStandardMaterial map={createStoneTex()} color="#6a5a42" />
        </mesh>
        
        {/* Abertura em arco */}
        <mesh position={[0, 0.8, 0.31]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.8, 16, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#321" emissive="#210" />
        </mesh>
        
        {/* Portas de madeira */}
        <mesh position={[-0.5, 0.5, 0.35]} castShadow>
          <boxGeometry args={[0.9, 1.4, 0.1]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0.5, 0.5, 0.35]} castShadow>
          <boxGeometry args={[0.9, 1.4, 0.1]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
        </mesh>
        
        {/* Reforços de ferro */}
        <mesh position={[-0.5, 0.5, 0.41]} castShadow>
          <boxGeometry args={[0.1, 1.2, 0.05]} />
          <meshStandardMaterial color="#aa9" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.5, 0.5, 0.41]} castShadow>
          <boxGeometry args={[0.1, 1.2, 0.05]} />
          <meshStandardMaterial color="#aa9" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.9, 0.41]} castShadow>
          <boxGeometry args={[1.6, 0.1, 0.05]} />
          <meshStandardMaterial color="#aa9" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================================
   ESTRADA DE TERRA
   ========================================================================= */

function Road() {
  const roadTex = useMemo(() => createRoadTex(), []);
  
  // Pontos da estrada principal
  const points: [number, number][] = [
    [-4, -2], [-2, -3], [0, -3.5], [2, -3], [4, -2],
    [5, 0], [4, 2], [2, 3], [0, 3.5], [-2, 3], [-4, 2], [-5, 0], [-4, -2]
  ];

  return (
    <group>
      {points.map((_p, i) => {
        if (i === points.length - 1) return null;
        const start = points[i];
        const end = points[i + 1];
        const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const midX = (start[0] + end[0]) / 2;
        const midZ = (start[1] + end[1]) / 2;
        
        return (
          <mesh
            key={i}
            position={[midX, 0.02, midZ]}
            rotation={[0, -angle, 0]}
            receiveShadow
          >
            <planeGeometry args={[length, 1.8]} />
            <meshStandardMaterial 
              map={roadTex} 
              transparent 
              opacity={0.95} 
              roughness={0.9}
              color="#8a7a5a"
            />
          </mesh>
        );
      })}
      
      {/* Praça central */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.5, 16]} />
        <meshStandardMaterial map={roadTex} roughness={0.9} color="#7a6a4a" />
      </mesh>
      
      {/* Poço na praça */}
      <group position={[0.5, 0.1, 0.3]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.45, 0.5, 8]} />
          <meshStandardMaterial map={createStoneTex()} color="#7a6e5a" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.1, 8]} />
          <meshStandardMaterial color="#5d3a1a" />
        </mesh>
        <mesh position={[0.2, 0.4, 0]} castShadow>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial color="#8b5e3c" />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================================
   CASTELO PRINCIPAL (MODELO GLB)
   ========================================================================= */

function CastleModel() {
  const { scene } = useGLTF('/models/casteloteste.glb');
  const model = useMemo(() => scene.clone(), [scene]);
  const stoneTex = useMemo(() => createStoneTex(), []);
  const roofTex = useMemo(() => createRoofTex(), []);

  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Aplicar texturas pintadas baseado no nome ou posição
        if (mesh.name.toLowerCase().includes('wall') || mesh.name.toLowerCase().includes('stone')) {
          if (Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshStandardMaterial[]).forEach(mat => {
              mat.map = stoneTex;
              mat.color.setHex(0x948470);
            });
          } else {
            (mesh.material as THREE.MeshStandardMaterial).map = stoneTex;
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x948470);
          }
        } else if (mesh.name.toLowerCase().includes('roof') || mesh.name.toLowerCase().includes('top')) {
          if (Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshStandardMaterial[]).forEach(mat => {
              mat.map = roofTex;
              mat.color.setHex(0x7a4a2a);
            });
          } else {
            (mesh.material as THREE.MeshStandardMaterial).map = roofTex;
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x7a4a2a);
          }
        }
      }
    });
  }, [model, stoneTex, roofTex]);

  return <primitive object={model} position={[0, 0.3, 0.8]} scale={1.5} rotation={[0, 0.2, 0]} />;
}

/* ============================================================================
   ÁRVORES (MODELO GLB) COM VARIAÇÕES
   ========================================================================= */

function TreeModel({ 
  x, 
  z, 
  scale = 1,
  rotation = 0 
}: { 
  x: number; 
  z: number; 
  scale?: number;
  rotation?: number;
}) {
  const { scene } = useGLTF('/models/arvoreum.glb');
  const model = useMemo(() => scene.clone(), [scene]);
  const [worldX, , worldZ] = svgToWorld(x, z);

  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [model]);

  return (
    <primitive 
      object={model} 
      position={[worldX, 0, worldZ]} 
      scale={scale} 
      rotation={[0, rotation, 0]} 
    />
  );
}

function Vegetation() {
  // Posições das árvores com variações
  const treePositions = useMemo(() => [
    // Ciprestes/árvores altas nas muralhas norte
    { x: 420, z: 254, scale: 1.2, rot: 0.3 }, { x: 490, z: 238, scale: 1.0, rot: 0.7 },
    { x: 1310, z: 238, scale: 1.2, rot: 0.2 }, { x: 1382, z: 254, scale: 1.0, rot: 0.5 },
    { x: 560, z: 250, scale: 1.1, rot: 0.1 }, { x: 1242, z: 250, scale: 1.1, rot: 0.8 },
    
    // Carvalhos na colina do castelo
    { x: 520, z: 432, scale: 0.9, rot: 0.4 }, { x: 560, z: 408, scale: 1.0, rot: 0.6 },
    { x: 1280, z: 432, scale: 0.9, rot: 0.3 }, { x: 1240, z: 408, scale: 1.0, rot: 0.7 },
    { x: 620, z: 382, scale: 0.8, rot: 0.2 }, { x: 1180, z: 382, scale: 0.8, rot: 0.5 },
    { x: 640, z: 470, scale: 1.1, rot: 0.1 }, { x: 1160, z: 468, scale: 1.1, rot: 0.9 },
    
    // Vegetação no distrito central
    { x: 380, z: 540, scale: 1.0, rot: 0.4 }, { x: 340, z: 570, scale: 0.9, rot: 0.2 },
    { x: 308, z: 530, scale: 1.0, rot: 0.6 }, { x: 1420, z: 540, scale: 1.0, rot: 0.3 },
    { x: 1460, z: 568, scale: 0.9, rot: 0.7 }, { x: 1492, z: 528, scale: 1.0, rot: 0.1 },
    
    // Árvores entre fundações
    { x: 536, z: 555, scale: 0.9, rot: 0.5 }, { x: 1268, z: 552, scale: 0.9, rot: 0.8 },
    
    // Vegetação sul (perto do porto)
    { x: 380, z: 720, scale: 1.0, rot: 0.2 }, { x: 420, z: 750, scale: 1.1, rot: 0.4 },
    { x: 1420, z: 718, scale: 1.0, rot: 0.6 }, { x: 1460, z: 748, scale: 1.1, rot: 0.3 },
    { x: 352, z: 718, scale: 1.0, rot: 0.7 }, { x: 1448, z: 716, scale: 1.0, rot: 0.1 },
    
    // Árvores fora das muralhas
    { x: 100, z: 480, scale: 1.2, rot: 0.3 }, { x: 155, z: 510, scale: 1.1, rot: 0.5 },
    { x: 60, z: 460, scale: 1.0, rot: 0.2 }, { x: 120, z: 420, scale: 1.0, rot: 0.8 },
    { x: 1650, z: 480, scale: 1.2, rot: 0.4 }, { x: 1700, z: 512, scale: 1.1, rot: 0.6 },
    { x: 1740, z: 456, scale: 1.0, rot: 0.7 },
  ], []);

  return (
    <>
      {treePositions.map((pos, i) => (
        <TreeModel 
          key={i} 
          x={pos.x} 
          z={pos.z} 
          scale={pos.scale} 
          rotation={pos.rot} 
        />
      ))}
    </>
  );
}

/* ============================================================================
   ARBUSTOS E FLORES (PROCEDURAIS)
   ========================================================================= */

function Bush({ x, z }: { x: number; z: number }) {
  const [worldX, , worldZ] = svgToWorld(x, z);
  const scale = 0.15 + Math.random() * 0.1;
  
  return (
    <group position={[worldX, 0, worldZ]} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.8]} />
        <meshStandardMaterial color="#3a7228" roughness={0.8} emissive="#1a3a0a" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0.3, 0.2, 0.2]} castShadow>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#4a8a32" roughness={0.7} />
      </mesh>
      <mesh position={[-0.3, 0.1, -0.3]} castShadow>
        <sphereGeometry args={[0.6]} />
        <meshStandardMaterial color="#2a5e1a" roughness={0.8} />
      </mesh>
      
      {/* Flores */}
      {Array.from({ length: 5 }).map((_, i) => {
        const fx = (Math.random() - 0.5) * 1.2;
        const fz = (Math.random() - 0.5) * 1.2;
        const color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        return (
          <mesh key={i} position={[fx, 0.5, fz]} castShadow>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color={color} emissive="#321" emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

function Undergrowth() {
  const positions = useMemo(() => [
    { x: 680, z: 490 }, { x: 750, z: 480 }, { x: 1050, z: 478 }, { x: 1120, z: 490 },
    { x: 560, z: 578 }, { x: 508, z: 562 }, { x: 1300, z: 575 }, { x: 355, z: 738 },
    { x: 455, z: 760 }, { x: 1488, z: 736 }, { x: 680, z: 858 }, { x: 720, z: 870 },
    { x: 1082, z: 858 }, { x: 1120, z: 870 }, { x: 80, z: 540 }, { x: 180, z: 580 },
    { x: 1622, z: 545 }, { x: 1720, z: 572 }, { x: 280, z: 888 }, { x: 320, z: 904 },
    { x: 1478, z: 888 }, { x: 1520, z: 904 },
  ], []);

  return (
    <>
      {positions.map((pos, i) => (
        <Bush key={i} x={pos.x} z={pos.z} />
      ))}
    </>
  );
}

/* ============================================================================
   PORTO COM ÁGUA ANIMADA
   ========================================================================= */

function Harbor() {
  const waterRef = useRef<THREE.Mesh>(null);
  
  // Animação da água
  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Pequena ondulação (mexendo a posição)
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });
  
  return (
    <group position={[0, -0.1, 3.5]}>
      {/* Água */}
      <mesh 
        ref={waterRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[8, 5, 16, 16]} />
        <meshStandardMaterial 
          color="#2a6a8a" 
          emissive="#0a3a5a" 
          transparent 
          opacity={0.9}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      
      {/* Docas de madeira */}
      {[-2, 0, 2].map((x, i) => (
        <group key={i} position={[x, 0.15, -0.5]}>
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
          {/* Barris */}
          {i === 1 && (
            <group position={[0.3, 0.2, 0.8]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 6]} />
                <meshStandardMaterial color="#8b5e3c" />
              </mesh>
            </group>
          )}
        </group>
      ))}
      
      {/* Barcos */}
      <group position={[1.5, 0.2, 0.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.2, 0.4]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.2, 0.5, 6]} />
          <meshStandardMaterial color="#a57c52" roughness={0.7} />
        </mesh>
        <mesh position={[0.3, 0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.3]} />
          <meshStandardMaterial color="#8b6b4b" />
        </mesh>
      </group>
      
      <group position={[-1.2, 0.15, 1.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.15, 0.35]} />
          <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <coneGeometry args={[0.15, 0.4, 6]} />
          <meshStandardMaterial color="#a57c52" />
        </mesh>
      </group>
      
      {/* Farol */}
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
      
      {/* Peixes (pequenos pontos) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[Math.random()*4-2, -0.1, Math.random()*3+1]} rotation={[0, Math.random()*Math.PI*2, 0]}>
          <coneGeometry args={[0.05, 0.1, 3]} />
          <meshStandardMaterial color="#c0a040" emissive="#321" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================================
   EDIFÍCIOS CONSTRUÍVEIS
   ========================================================================= */

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
  const colors = useMemo(() => {
    switch(slot.type) {
      case 'sawmill': return { wood: '#8b5a2b', roof: '#5d3a1a', walls: '#a57c52' };
      case 'ironMine': return { wood: '#5a4a3a', roof: '#3a2a1a', stone: '#6a5a4a', walls: '#6a5a4a' };
      case 'farm': return { wood: '#a57c52', roof: '#7a5a32', walls: '#c09a6a' };
      case 'quarry': return { wood: '#6a5e4a', roof: '#4a3e2a', stone: '#8a7e6a', walls: '#8a7e6a' };
      case 'barracks': return { wood: '#5a4a32', roof: '#3a2a18', walls: '#8a7a5a' };
      case 'warehouse': return { wood: '#7a623a', roof: '#5a421a', walls: '#9a825a' };
      case 'academy': return { wood: '#6a523a', roof: '#4a321a', walls: '#b89a6a', trim: '#c8a86a' };
      default: return { wood: '#8b5a2b', roof: '#5d3a1a', walls: '#a57c52' };
    }
  }, [slot.type]);
  
  const stoneTex = useMemo(() => createStoneTex(), []);
  const roofTex = useMemo(() => createRoofTex(), []);
  
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
        <meshStandardMaterial 
          color={colors.walls || colors.wood} 
          roughness={0.7}
          emissive="#221"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Detalhes das paredes (janelas) */}
      {Math.random() > 0.3 && (
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
        <meshStandardMaterial 
          map={roofTex}
          color={colors.roof} 
          roughness={0.8}
          emissive="#221"
        />
      </mesh>
      
      {/* Chaminé (para alguns edifícios) */}
      {(slot.type === 'sawmill' || slot.type === 'ironMine' || slot.type === 'barracks') && (
        <mesh position={[0.3, 0.7, -0.2]} castShadow>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial map={stoneTex} color="#6a5a42" roughness={0.9} />
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

/* ============================================================================
   ELEMENTOS DECORATIVOS (FOGUEIRAS, BANDEIRAS)
   ========================================================================= */

function Campfire({ x, z }: { x: number; z: number }) {
  const [worldX, , worldZ] = svgToWorld(x, z);
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.8 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
    }
  });
  
  return (
    <group position={[worldX, 0.1, worldZ]}>
      <pointLight ref={lightRef} color="#ff6600" intensity={1} distance={5} />
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 6]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <coneGeometry args={[0.2, 0.3, 6]} />
        <meshStandardMaterial color="#ff8800" emissive="#442200" />
      </mesh>
      <mesh position={[0.1, 0.15, 0.1]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.05]} />
        <meshStandardMaterial color="#5d3a1a" />
      </mesh>
    </group>
  );
}

function Flags() {
  return (
    <>
      {/* Bandeiras nas torres */}
      <group position={[-4.2, 2.2, 3.8]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.4, 0.25, 0.02]} />
          <meshStandardMaterial color="#b82" emissive="#420" />
        </mesh>
      </group>
      <group position={[4.5, 2.2, 3.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.4, 0.25, 0.02]} />
          <meshStandardMaterial color="#28b" emissive="#124" />
        </mesh>
      </group>
    </>
  );
}

/* ============================================================================
   ILUMINAÇÃO E ATMOSFERA
   ========================================================================= */

function SceneLights() {
  return (
    <>
      {/* Luz ambiente suave */}
      <ambientLight intensity={0.4} color="#d0c8b0" />
      
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
      
      {/* Preenchimento lateral */}
      <directionalLight position={[-5, 5, 10]} intensity={0.5} color="#b0c0d0" />
      
      {/* Luz de fundo */}
      <directionalLight position={[-5, 2, -10]} intensity={0.3} color="#7080a0" />
      
      {/* Pontos de luz quente (tochas) */}
      <pointLight position={[2.5, 1.2, -1.5]} intensity={0.6} color="#ffb070" distance={6} />
      <pointLight position={[-2.2, 1.2, 2.0]} intensity={0.5} color="#ffb070" distance={6} />
      <pointLight position={[1.0, 1.5, 3.2]} intensity={0.4} color="#ffa050" distance={5} />
      <pointLight position={[3.8, 1.0, -2.5]} intensity={0.4} color="#ffa050" distance={5} />
      <pointLight position={[-3.5, 1.0, -2.0]} intensity={0.4} color="#ffa050" distance={5} />
    </>
  );
}

/* ============================================================================
   CENA PRINCIPAL
   ========================================================================= */

function Scene({ selectedSlot, onSlotClick }: {
  selectedSlot: BuildingType | null;
  onSlotClick: (type: BuildingType) => void;
}) {
  return (
    <Suspense fallback={null}>
      <SceneLights />
      <Terrain />
      <Road />
      <VillageWalls />
      <Flags />
      <CastleModel />
      <Harbor />
      <Vegetation />
      <Undergrowth />
      
      {/* Fogueiras */}
      <Campfire x={650} z={550} />
      <Campfire x={1150} z={550} />
      <Campfire x={400} z={680} />
      <Campfire x={1400} z={680} />
      
      {/* Fundações / Edifícios construíveis */}
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
    </Suspense>
  );
}

/* ============================================================================
   COMPONENTE PRINCIPAL (com HUD e Canvas)
   ========================================================================= */

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
          <Loader />
        </div>
      </div>
    );
  }

  const res = resources ?? castle.resources;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-950">
      {/* HUD de recursos */}
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

      {/* MINIMAP */}
      <div className="absolute bottom-4 right-4 z-20 w-48 h-48 bg-stone-900/80 rounded-lg border border-amber-700/50 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-1 left-1 text-amber-500 text-xs">MINIMAP</div>
        <div className="w-full h-full relative">
          <div className="absolute inset-2 bg-stone-800 rounded">
            {/* Representação simplificada do mapa */}
            <div 
              className="absolute w-2 h-2 bg-amber-500 rounded-full animate-pulse" 
              style={{ left: '50%', top: '50%' }}
            />
            {/* Pontos dos edifícios */}
            {SLOTS.map((slot, i) => {
              const left = ((slot.x - 300) / 1500) * 100;
              const top = ((slot.z - 200) / 800) * 100;
              return (
                <div 
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full"
                  style={{ left: `${left}%`, top: `${top}%` }}
                />
              );
            })}
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
          turbidity={10}
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

// Pré-carregar modelos para evitar delay
useGLTF.preload('/models/casteloteste.glb');
useGLTF.preload('/models/arvoreum.glb');