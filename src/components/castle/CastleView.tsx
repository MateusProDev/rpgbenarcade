/**
 * CastleView — Terreno RTS Medieval Isométrico
 *
 * Layout de nível profissional para jogo de estratégia
 * Câmera ortográfica isométrica fixa (45° horizontal + 35° vertical)
 * Sem UI, sem construções, sem personagens — terreno base para RTS
 *
 * Elementos:
 *  - Plataforma central do castelo (pedra elevada + escadas)
 *  - 6 pads de construção com bordas de pedra/madeira
 *  - Sistema de caminhos (paralelepípedo + terra batida)
 *  - Lago com shader de água
 *  - Zona agrícola com cerca de madeira
 *  - Árvores GLB nas bordas
 *  - Rochas, arbustos, vegetação de preenchimento
 *  - Iluminação cinemática com sombras suaves
 */

import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

/* ============================================================================
   TEXTURAS PROCEDURAIS
   ========================================================================= */

function makeGrassTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  // Base verde terrosa
  const grd = ctx.createLinearGradient(0, 0, S, S);
  grd.addColorStop(0,   '#4a6b2a');
  grd.addColorStop(0.5, '#3d5c22');
  grd.addColorStop(1,   '#526e2f');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, S, S);

  const img = ctx.getImageData(0, 0, S, S);
  const d   = img.data;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n =
        noise2D(x / 80,  y / 80)  * 0.45 +
        noise2D(x / 25,  y / 25)  * 0.30 +
        noise2D(x / 8,   y / 8)   * 0.15 +
        noise2D(x / 180, y / 180) * 0.10;
      const micro = noise2D(x / 4, y / 4) * 0.04;
      const br = Math.floor(60 + n * 38 + micro * 20);
      const i  = (y * S + x) * 4;
      const rBase = d[i], gBase = d[i+1], bBase = d[i+2];
      // variação de cor (manchas secas, sombra, musgo)
      const mossN = noise2D(x / 60 + 3, y / 60 + 3);
      const moss  = mossN > 0.35 ? 12 : 0;
      const dry   = noise2D(x / 45 - 2, y / 45 - 2) > 0.5 ? 10 : 0;
      d[i]   = THREE.MathUtils.clamp(rBase + br - 55 + dry,      25,  120);
      d[i+1] = THREE.MathUtils.clamp(gBase + br - 15 + moss + 8, 55,  175);
      d[i+2] = THREE.MathUtils.clamp(bBase + br - 60,            10,   90);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Linhas de grama finas
  ctx.strokeStyle = 'rgba(100,160,40,0.15)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3200; i++) {
    const gx = Math.random() * S;
    const gy = Math.random() * S;
    const h  = 6 + Math.random() * 10;
    const tilt = (Math.random() - 0.5) * 6;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + tilt, gy - h);
    ctx.stroke();
  }

  // Seixos e detritos
  for (let i = 0; i < 250; i++) {
    const px = Math.random() * S;
    const py = Math.random() * S;
    const r  = 1.5 + Math.random() * 2.5;
    const shade = Math.floor(110 + Math.random() * 60);
    ctx.fillStyle = `rgba(${shade},${shade-10},${shade-25},0.45)`;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.65 + Math.random(), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = 16;
  return tex;
}

function makeStoneTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#7a7060';
  ctx.fillRect(0, 0, S, S);

  const img = ctx.getImageData(0, 0, S, S);
  const d   = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n =
        noise2D(x / 100, y / 100) * 0.5 +
        noise2D(x / 30,  y / 30)  * 0.3 +
        noise2D(x / 10,  y / 10)  * 0.2;
      const br = Math.floor(115 + n * 45);
      const i  = (y * S + x) * 4;
      d[i]   = THREE.MathUtils.clamp(br + 8,  65, 195);
      d[i+1] = THREE.MathUtils.clamp(br,      60, 180);
      d[i+2] = THREE.MathUtils.clamp(br - 15, 45, 160);
      d[i+3] = 255;
    }
  }

  // Pedras individuais e juntas
  const stoneH = [18, 20, 22, 18, 24, 20];
  let gy = 0;
  let row = 0;
  while (gy < S) {
    const sh = stoneH[row % stoneH.length] * (S / 256);
    let gx = (row % 2 === 0) ? 0 : -18 * (S / 256);
    const stoneW = [42, 38, 48, 36, 44] ;
    let col = 0;
    while (gx < S) {
      const sw = stoneW[col % stoneW.length] * (S / 256);
      const bevel = 2;
      ctx.strokeStyle = 'rgba(40,32,24,0.55)';
      ctx.lineWidth   = 2.2;
      ctx.strokeRect(gx + bevel, gy + bevel, sw - bevel * 2, sh - bevel * 2);
      const lightN = (Math.random() - 0.5) * 18;
      ctx.fillStyle = `rgba(${200 + lightN},${185 + lightN},${155 + lightN},0.06)`;
      ctx.fillRect(gx + bevel, gy + bevel, sw - bevel * 2, sh - bevel * 2);
      gx += sw;
      col++;
    }
    gy += sh;
    row++;
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 16;
  return tex;
}

function makeCobbleTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#6a6258';
  ctx.fillRect(0, 0, S, S);

  const img = ctx.getImageData(0, 0, S, S);
  const d   = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n = noise2D(x / 20, y / 20) * 0.6 + noise2D(x / 7, y / 7) * 0.4;
      const br = Math.floor(105 + n * 35);
      const i  = (y * S + x) * 4;
      d[i]   = THREE.MathUtils.clamp(br + 5,  50, 180);
      d[i+1] = THREE.MathUtils.clamp(br - 2,  48, 168);
      d[i+2] = THREE.MathUtils.clamp(br - 12, 38, 148);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Padrão de paralelelepípedos
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 14; col++) {
      const offset = row % 2 === 0 ? 0 : 18;
      const px = col * 36 + offset;
      const py = row * 28;
      const n  = noise2D(px / 50, py / 50);
      const shade = Math.floor(85 + n * 30);
      ctx.fillStyle = `rgba(${shade+8},${shade},${shade-8},0.35)`;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, 32, 24, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,24,18,0.6)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // Brilho no topo
      ctx.fillStyle = 'rgba(255,245,220,0.12)';
      ctx.fillRect(px + 3, py + 3, 29, 5);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

function makeDirtTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(S, S);
  const d   = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n =
        noise2D(x / 70, y / 70) * 0.5 +
        noise2D(x / 22, y / 22) * 0.3 +
        noise2D(x / 8,  y / 8)  * 0.2;
      const br = Math.floor(108 + n * 42);
      const i  = (y * S + x) * 4;
      d[i]   = THREE.MathUtils.clamp(br + 18, 80, 210);
      d[i+1] = THREE.MathUtils.clamp(br + 4,  62, 175);
      d[i+2] = THREE.MathUtils.clamp(br - 22, 38, 125);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Pegadas e sulcos de carroça
  ctx.strokeStyle = 'rgba(60,40,20,0.22)';
  for (let i = 0; i < 8; i++) {
    const y0 = Math.random() * S;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(
      S * 0.25, y0 + (Math.random() - 0.5) * 30,
      S * 0.75, y0 + (Math.random() - 0.5) * 30,
      S, y0 + (Math.random() - 0.5) * 20,
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

function makeFarmTex(): THREE.CanvasTexture {
  const noise2D = createNoise2D();
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(S, S);
  const d   = img.data;
  for (let y = 0; y < S; y++) {
    const rowNoise = noise2D(0, y / 30) * 0.3;
    for (let x = 0; x < S; x++) {
      const n = noise2D(x / 40, y / 40) * 0.5 + rowNoise + noise2D(x / 12, y / 12) * 0.2;
      const stripBr = Math.abs(Math.sin((y / S) * Math.PI * 18)) * 22;
      const br = Math.floor(98 + n * 35 + stripBr);
      const i  = (y * S + x) * 4;
      d[i]   = THREE.MathUtils.clamp(br + 25, 90,  215);
      d[i+1] = THREE.MathUtils.clamp(br + 8,  68,  180);
      d[i+2] = THREE.MathUtils.clamp(br - 20, 35,  120);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  return tex;
}

/* ============================================================================
   TERRENO PRINCIPAL COM VARIAÇÃO DE ALTURA
   ========================================================================= */

function Terrain() {
  const grassTex = useMemo(() => makeGrassTex(), []);
  const geoRef   = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    const geo = geoRef.current;
    if (!geo) return;
    const noise2D  = createNoise2D();
    const posAttr  = geo.attributes.position as THREE.BufferAttribute;
    const count    = posAttr.count;
    const normAttr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Evita elevar a area central do castelo
      const distCenter = Math.sqrt(x * x + z * z);
      const centerFlat = THREE.MathUtils.smoothstep(distCenter, 3.5, 7.0);
      const h =
        (noise2D(x / 9,  z / 9)  * 0.38 +
         noise2D(x / 3,  z / 3)  * 0.14 +
         noise2D(x / 20, z / 20) * 0.55) * centerFlat * 0.45;
      posAttr.setY(i, h);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
  }, []);

  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry ref={geoRef} args={[34, 34, 180, 180]} />
      <meshStandardMaterial
        map={grassTex}
        roughness={0.92}
        metalness={0.0}
        color="#c8e0a0"
      />
    </mesh>
  );
}

/* ============================================================================
   PLATAFORMA CENTRAL DO CASTELO
   ========================================================================= */

function CastleFoundation() {
  const stoneTex = useMemo(() => makeStoneTex(), []);
  
  // Carrega e ajusta o modelo 3D do castelo (já inserido no projeto)
  const { scene } = useGLTF('/casteloteste.glb');
  const castleModel = useMemo(() => {
    const c = scene.clone(true);
    c.scale.set(1.5, 1.5, 1.5);
    // Ajuste fino para encaixar no topo da plataforma
    c.position.set(0, 0.70, 0); 
    // Pode ser necessário ajustar a rotação:
    c.rotation.y = Math.PI / 4; 
    c.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  // Degraus de acesso (Norte, Sul, Leste, Oeste)
  const stairs = useMemo(() => {
    const dirs: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    return dirs.map(([dx, dz]) => ({
      x: dx * 3.58,
      z: dz * 3.58,
      ry: Math.atan2(dx, dz),
    }));
  }, []);

  return (
    <group>
      {/* Base elevada circular — empilhada em 3 camadas decrescentes */}
      {[
        { r: 3.85, h: 0.30, y: 0.00, col: '#9a8f7e' },
        { r: 3.50, h: 0.22, y: 0.28, col: '#8e8372' },
        { r: 3.15, h: 0.18, y: 0.48, col: '#847868' },
      ].map(({ r, h, y, col }, i) => (
        <mesh key={i} position={[0, y, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[r, r + 0.12, h, 64]} />
          <meshStandardMaterial map={stoneTex} color={col} roughness={0.88} metalness={0.02} />
        </mesh>
      ))}

      {/* Superfície superior */}
      <mesh position={[0, 0.66, 0]} receiveShadow>
        <cylinderGeometry args={[3.15, 3.15, 0.06, 64]} />
        <meshStandardMaterial map={stoneTex} color="#7a7060" roughness={0.85} />
      </mesh>

      {/* Degraus nos 4 pontos cardeais */}
      {stairs.map(({ x, z, ry }, i) => (
        <group key={i} position={[x, 0, z]} rotation-y={ry}>
          {[0, 1, 2].map((step) => (
            <mesh key={step} position={[0, step * 0.22, -(step * 0.18)]} receiveShadow castShadow>
              <boxGeometry args={[1.1, 0.24, 0.22]} />
              <meshStandardMaterial map={stoneTex} color="#8a8070" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Bordas de pedra retentoras ao redor */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 3.92, 0.22, Math.sin(angle) * 3.92]}
            rotation-y={-angle}
            castShadow
          >
            <boxGeometry args={[0.32, 0.45, 0.32]} />
            <meshStandardMaterial map={stoneTex} color="#706860" roughness={0.92} />
          </mesh>
        );
      })}

      {/* O modelo GLB do Castelo */}
      <primitive object={castleModel} />
    </group>
  );
}

/* ============================================================================
   PADS DE CONSTRUÇÃO (sem construções)
   ========================================================================= */

const PAD_POSITIONS: { x: number; z: number; w: number; d: number; label: string }[] = [
  { x: -5.0, z: -5.0, w: 2.8, d: 2.8, label: 'Casa' },
  { x:  0.0, z: -6.0, w: 2.8, d: 2.8, label: 'Casa' },
  { x:  5.0, z: -5.0, w: 2.8, d: 2.8, label: 'Casa' },
  { x: -5.5, z:  4.5, w: 2.8, d: 2.8, label: 'Moinho' },
  { x:  0.0, z:  5.5, w: 3.5, d: 3.5, label: 'Praça' },
  { x:  5.5, z:  4.5, w: 2.8, d: 2.8, label: 'Casa' },
];

function BuildingPads() {
  const stoneTex = useMemo(() => makeStoneTex(), []);
  const dirtTex  = useMemo(() => makeDirtTex(),  []);

  return (
    <group>
      {PAD_POSITIONS.map(({ x, z, w, d }, i) => (
        <group key={i} position={[x, 0.02, z]}>
          {/* Plataforma de terra compactada */}
          <mesh receiveShadow rotation-x={-Math.PI / 2}>
            <planeGeometry args={[w + 0.3, d + 0.3]} />
            <meshStandardMaterial map={dirtTex} roughness={0.95} color="#b09878" />
          </mesh>

          {/* Bordas de pedra */}
          {[
            { px:  0,          pz: -(d / 2 + 0.08), rw: w + 0.24, rh: 0.18 },
            { px:  0,          pz:  (d / 2 + 0.08), rw: w + 0.24, rh: 0.18 },
            { px: -(w / 2 + 0.08), pz: 0,           rw: 0.18,     rh: d + 0.24, rot: Math.PI / 2 },
            { px:  (w / 2 + 0.08), pz: 0,           rw: 0.18,     rh: d + 0.24, rot: Math.PI / 2 },
          ].map(({ px, pz, rw, rh }, bi) => (
            <mesh key={bi} position={[px, 0.09, pz]} castShadow receiveShadow>
              <boxGeometry args={[rw, 0.18, rh]} />
              <meshStandardMaterial map={stoneTex} roughness={0.9} color="#7e7462" />
            </mesh>
          ))}

          {/* Cantoneiras de pedra */}
          {[
            [-w / 2 - 0.06, -d / 2 - 0.06],
            [ w / 2 + 0.06, -d / 2 - 0.06],
            [-w / 2 - 0.06,  d / 2 + 0.06],
            [ w / 2 + 0.06,  d / 2 + 0.06],
          ].map(([cx, cz], ci) => (
            <mesh key={ci} position={[cx, 0.18, cz]} castShadow>
              <boxGeometry args={[0.22, 0.36, 0.22]} />
              <meshStandardMaterial map={stoneTex} roughness={0.88} color="#6e6454" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ============================================================================
   SISTEMA DE CAMINHOS
   ========================================================================= */

function PathSystem() {
  const cobbleTex = useMemo(() => makeCobbleTex(), []);
  const dirtTex   = useMemo(() => makeDirtTex(),   []);

  // Caminhos radiais do castelo para cada pad
  const radialPaths = useMemo(() => {
    return PAD_POSITIONS.map(({ x, z }) => {
      const angle  = Math.atan2(z, x);
      const dist   = Math.sqrt(x * x + z * z);
      const cx     = x / 2;
      const cz     = z / 2;
      return { cx, cz, angle, dist };
    });
  }, []);

  return (
    <group position={[0, 0.03, 0]}>
      {/* Cruzamento central cobblestone — Cruz */}
      {[0, Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={ry} receiveShadow>
          <planeGeometry args={[1.4, 7.5]} />
          <meshStandardMaterial map={cobbleTex} roughness={0.9} color="#a09080" />
        </mesh>
      ))}

      {/* Anel de caminho circular ao redor da plataforma */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <ringGeometry args={[3.9, 5.0, 64]} />
        <meshStandardMaterial map={cobbleTex} roughness={0.88} color="#a09282" transparent opacity={0.85} />
      </mesh>

      {/* Caminhos de terra para cada pad */}
      {radialPaths.map(({ cx, cz, angle, dist }, i) => (
        <mesh
          key={i}
          position={[cx, 0, cz]}
          rotation-x={-Math.PI / 2}
          rotation-z={-angle}
          receiveShadow
        >
          <planeGeometry args={[0.9, dist - 4.8]} />
          <meshStandardMaterial map={dirtTex} roughness={0.95} color="#b09070" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================================
   LAGO COM SHADER DE ÁGUA
   ========================================================================= */

function Pond() {
  const stoneTex = useMemo(() => makeStoneTex(), []);
  const timeRef  = useRef(0);

  const waterMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time:   { value: 0 },
      colorA: { value: new THREE.Color('#1a547a') },
      colorB: { value: new THREE.Color('#2a7aaa') },
      colorC: { value: new THREE.Color('#4aA0c8') },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 2.8 + time * 1.6) * 0.028;
        pos.z += cos(pos.y * 3.2 + time * 1.1) * 0.022;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      varying vec2 vUv;
      void main() {
        float ripple = sin(vUv.x * 14.0 + time * 2.2) * cos(vUv.y * 12.0 + time * 1.8) * 0.5 + 0.5;
        float edge   = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x)
                     * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        vec3 col     = mix(colorA, mix(colorB, colorC, ripple * 0.65), ripple * 0.8);
        gl_FragColor = vec4(col, 0.82 * edge + 0.08);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  }), []);

  useFrame(({ clock }) => {
    waterMat.uniforms.time.value = clock.getElapsedTime();
    timeRef.current = clock.getElapsedTime();
  });

  // Rochas ao redor do lago
  const pondRocks = useMemo(() => {
    const pts: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.25;
      const r     = 2.25 + Math.sin(i * 1.7) * 0.4 + Math.random() * 0.5;
      pts.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        s: 0.18 + Math.random() * 0.28,
        ry: Math.random() * Math.PI,
      });
    }
    return pts;
  }, []);

  return (
    <group position={[6.5, 0.04, 8.5]}>
      {/* Buraco do lago — terra escura */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[2.0, 48]} />
        <meshStandardMaterial color="#2a3018" roughness={1} />
      </mesh>

      {/* Água */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[1.9, 48]} />
        <primitive object={waterMat} />
      </mesh>

      {/* Rochas nas bordas */}
      {pondRocks.map(({ x, z, s, ry }, i) => (
        <mesh key={i} position={[x, s * 0.3, z]} rotation-y={ry} castShadow>
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial map={stoneTex} roughness={0.95} color="#6a6258" />
        </mesh>
      ))}

      {/* Vegetação de borda do lago */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r     = 2.05 + Math.random() * 0.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.28, Math.sin(angle) * r]}
          >
            <coneGeometry args={[0.12, 0.55 + Math.random() * 0.35, 5]} />
            <meshStandardMaterial color={`hsl(${100 + Math.random() * 30},55%,28%)`} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================================
   ZONA AGRÍCOLA COM CERCA
   ========================================================================= */

function Farmland() {
  const farmTex  = useMemo(() => makeFarmTex(),  []);
  const dirtTex  = useMemo(() => makeDirtTex(),  []);
  const stoneTex = useMemo(() => makeStoneTex(), []);

  // Posts de cerca
  const fencePostsX = useMemo(() => {
    const posts: { x: number; z: number; ry: number; isCorner: boolean }[] = [];
    const W = 6.0, D = 4.5;
    const spacing = 1.0;

    for (let i = 0; i <= Math.ceil(W / spacing); i++) {
      const t = i * spacing - W / 2;
      posts.push({ x: t, z: -D / 2, ry: 0, isCorner: i === 0 || i === Math.ceil(W / spacing) });
      posts.push({ x: t, z:  D / 2, ry: 0, isCorner: i === 0 || i === Math.ceil(W / spacing) });
    }
    for (let i = 1; i < Math.ceil(D / spacing); i++) {
      const t = i * spacing - D / 2;
      posts.push({ x: -W / 2, z: t, ry: Math.PI / 2, isCorner: false });
      posts.push({ x:  W / 2, z: t, ry: Math.PI / 2, isCorner: false });
    }
    return posts;
  }, []);

  return (
    <group position={[-5.0, 0.02, 9.0]}>
      {/* Solo da fazenda */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[6.2, 4.7]} />
        <meshStandardMaterial map={farmTex} roughness={0.96} color="#c8a870" />
      </mesh>

      {/* Bordas de terra levantada */}
      {[
        { x: 0,    z: -2.45, w: 6.2,  d: 0.14 },
        { x: 0,    z:  2.45, w: 6.2,  d: 0.14 },
        { x:-3.12, z: 0,     w: 0.14, d: 4.7  },
        { x: 3.12, z: 0,     w: 0.14, d: 4.7  },
      ].map(({ x, z, w, d }, i) => (
        <mesh key={i} position={[x, 0.07, z]} castShadow>
          <boxGeometry args={[w, 0.14, d]} />
          <meshStandardMaterial map={dirtTex} roughness={0.97} color="#8a6840" />
        </mesh>
      ))}

      {/* Posts de cerca e réguas horizontais */}
      {fencePostsX.map(({ x, z, ry, isCorner }, i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Post vertical */}
          <mesh position={[0, 0.38, 0]} castShadow>
            <boxGeometry args={[isCorner ? 0.12 : 0.09, isCorner ? 0.78 : 0.65, isCorner ? 0.12 : 0.09]} />
            <meshStandardMaterial color="#7a5530" roughness={0.96} />
          </mesh>
          {/* Régua superior */}
          <mesh position={[0, 0.52, 0]} rotation-y={ry} castShadow>
            <boxGeometry args={[0.95, 0.05, 0.04]} />
            <meshStandardMaterial color="#906040" roughness={0.95} />
          </mesh>
          {/* Régua inferior */}
          <mesh position={[0, 0.28, 0]} rotation-y={ry} castShadow>
            <boxGeometry args={[0.95, 0.05, 0.04]} />
            <meshStandardMaterial color="#906040" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================================
   ELEMENTOS NATURAIS — ROCHAS E ARBUSTOS
   ========================================================================= */

function NaturalElements() {
  const stoneTex = useMemo(() => makeStoneTex(), []);

  const rocks = useMemo(() => {
    const seed: { x: number; z: number; s: number; ry: number; type: number }[] = [];
    const positions: [number, number][] = [
      [-6, -8], [-4.5, -9], [2, -11], [5, -10], [11, -5],
      [12, 2],  [11,  8],   [7,  10], [-3, 12], [-8,  10],
      [-11, 3], [-12, -4],  [-5, 4],  [4, 5],   [-3, -6],
      [6, -3],  [-7, -5],   [8, -8],  [3, 8],   [-9, 8],
    ];
    for (const [x, z] of positions) {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) {
        seed.push({
          x: x + (Math.random() - 0.5) * 1.2,
          z: z + (Math.random() - 0.5) * 1.2,
          s: 0.12 + Math.random() * 0.28,
          ry: Math.random() * Math.PI * 2,
          type: Math.floor(Math.random() * 3),
        });
      }
    }
    return seed;
  }, []);

  const bushes = useMemo(() => {
    const pts: { x: number; z: number; s: number; hue: number }[] = [];
    const bases: [number, number][] = [
      [-5, -7], [0, -10], [6, -9], [10, -3], [11, 5],
      [7,  11], [0, 12],  [-7, 9], [-11, 2], [-10, -6],
      [-3, -8], [4, -5],  [-6, 5], [8, 3],   [-4, 10],
    ];
    for (const [bx, bz] of bases) {
      const c = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < c; j++) {
        pts.push({
          x: bx + (Math.random() - 0.5) * 1.5,
          z: bz + (Math.random() - 0.5) * 1.5,
          s: 0.25 + Math.random() * 0.35,
          hue: 95 + Math.floor(Math.random() * 30),
        });
      }
    }
    return pts;
  }, []);

  const grassClumps = useMemo(() => {
    const pts: { x: number; z: number; h: number; tilt: number }[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 5.5 + Math.random() * 9;
      pts.push({
        x:    Math.cos(angle) * r + (Math.random() - 0.5) * 1.5,
        z:    Math.sin(angle) * r + (Math.random() - 0.5) * 1.5,
        h:    0.15 + Math.random() * 0.28,
        tilt: (Math.random() - 0.5) * 0.5,
      });
    }
    return pts;
  }, []);

  return (
    <group>
      {/* Rochas */}
      {rocks.map(({ x, z, s, ry, type }, i) => (
        <mesh key={`r${i}`} position={[x, s * 0.38, z]} rotation-y={ry} castShadow>
          {type === 0 && <dodecahedronGeometry args={[s, 0]} />}
          {type === 1 && <boxGeometry args={[s * 1.6, s * 0.8, s * 1.2]} />}
          {type === 2 && <sphereGeometry args={[s * 0.9, 5, 4]} />}
          <meshStandardMaterial map={stoneTex} roughness={0.95} color={`hsl(38,${12 + Math.floor(s * 30)}%,${36 + Math.floor(s * 40)}%)`} />
        </mesh>
      ))}

      {/* Arbustos */}
      {bushes.map(({ x, z, s, hue }, i) => (
        <group key={`b${i}`} position={[x, 0, z]}>
          <mesh position={[0, s * 0.6, 0]} castShadow>
            <sphereGeometry args={[s, 7, 5]} />
            <meshStandardMaterial color={`hsl(${hue},45%,22%)`} roughness={0.95} />
          </mesh>
          <mesh position={[0, s * 0.22, 0]} castShadow>
            <sphereGeometry args={[s * 0.7, 6, 4]} />
            <meshStandardMaterial color={`hsl(${hue + 8},42%,18%)`} roughness={0.97} />
          </mesh>
        </group>
      ))}

      {/* Touceiras de grama alta */}
      {grassClumps.map(({ x, z, h, tilt }, i) => (
        <group key={`g${i}`} position={[x, 0, z]} rotation-z={tilt}>
          {Array.from({ length: 5 }).map((_, j) => {
            const a = (j / 5) * Math.PI * 2;
            const r = h * 0.3;
            return (
              <mesh
                key={j}
                position={[Math.cos(a) * r * 0.5, h / 2, Math.sin(a) * r * 0.5]}
                rotation-z={(Math.random() - 0.5) * 0.6}
              >
                <boxGeometry args={[0.030, h, 0.018]} />
                <meshStandardMaterial color={`hsl(${105 + Math.random() * 20},52%,${20 + Math.random() * 18}%)`} roughness={0.95} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* ============================================================================
   ÁRVORES GLB
   ========================================================================= */

const TREE_POSITIONS: [number, number, number, number][] = [
  // [x, y, z, scale]
  [-12, 0, -8,  1.0], [-10, 0, -10, 1.2], [-14, 0, -4,  0.9],
  [-13, 0,  2,  1.1], [-12, 0,  8,  1.0], [-10, 0,  11, 1.3],
  [ -6, 0,  14, 0.95],[ 0,  0,  14, 1.1], [ 5,  0,  13, 1.0],
  [ 9,  0,  11, 1.2], [ 13, 0,  7,  0.9], [ 13, 0,  2,  1.1],
  [ 14, 0, -4,  1.0], [ 12, 0, -9,  1.2], [ 8,  0, -12, 0.95],
  [ 2,  0, -13, 1.1], [-4,  0, -13, 1.0], [-8,  0, -11, 1.15],
  [ 4,  0, -7,  0.7], [-5,  0,  10, 0.8], [ 11, 0, -2,  0.85],
  [-13, 0, -1,  1.05],
];

function TreeModel({ position, scale }: { position: [number, number, number]; scale: number }) {
  const { scene } = useGLTF('/arvoreum.glb');
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    // Normalizar altura
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetH = 3.8 * scale;
    const s = targetH / (size.y || 1);
    c.scale.set(s, s, s);
    const box2 = new THREE.Box3().setFromObject(c);
    c.position.y = -box2.min.y;
    return c;
  }, [scene, scale]);

  return <primitive object={cloned} position={position} castShadow receiveShadow />;
}

function Trees() {
  return (
    <group>
      {TREE_POSITIONS.map(([x, y, z, s], i) => (
        <TreeModel key={i} position={[x, y, z]} scale={s} />
      ))}
    </group>
  );
}

/* ============================================================================
   CÂMERA ISOMÉTRICA FIXA (45° H + ~35° V, ortográfica)
   ========================================================================= */

function IsometricCameraController() {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const aspect = size.width / size.height;
    const frustum = 16;
    cam.left   = -frustum * aspect;
    cam.right  =  frustum * aspect;
    cam.top    =  frustum;
    cam.bottom = -frustum;
    cam.near   = 0.1;
    cam.far    = 300;
    cam.position.set(22, 18, 22);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);

  // Mantém câmera bloqueada se o usuário tentar mexer, ajustando zoom para mobile e desktop
  useFrame(({ camera: cam, size }) => {
    cam.position.set(22, 18, 22);
    // Para ver cerca de 22 ~ 24 unidades do mapa na tela em todas as resoluções
    const targetMapWidth = 24; 
    const calculatedZoom = size.width / targetMapWidth;
    
    // Deixa um mínimo de 12 para não ficar absurdamente pequeno em telas muito finas, 
    // e na vertical também garante que não fuja muito
    (cam as THREE.OrthographicCamera).zoom = Math.max(12, calculatedZoom);
    cam.updateProjectionMatrix();
  });

  return null;
}

/* ============================================================================
   ILUMINAÇÃO CINEMÁTICA
   ========================================================================= */

function Lights() {
  const dirRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const light = dirRef.current;
    if (!light?.shadow) return;
    light.shadow.mapSize.width  = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near    = 0.1;
    light.shadow.camera.far     = 80;
    light.shadow.camera.left    = -22;
    light.shadow.camera.right   =  22;
    light.shadow.camera.top     =  22;
    light.shadow.camera.bottom  = -22;
    light.shadow.bias           = -0.0005;
    light.shadow.radius         = 3;
  }, []);

  return (
    <>
      {/* Sol da tarde — dourado e quente */}
      <directionalLight
        ref={dirRef}
        position={[18, 22, 12]}
        intensity={2.8}
        color="#ffe8c0"
        castShadow
      />
      {/* Preenchimento suave azulado */}
      <directionalLight position={[-10, 8, -12]} intensity={0.6} color="#b8cce8" />
      {/* Hemisférico — céu + chão */}
      <hemisphereLight args={['#a8d4f8', '#4a7828', 0.9]} />
      {/* Ambiente global */}
      <ambientLight intensity={0.35} color="#ffeedd" />
      {/* Pontos de brilho ao redor do castelo */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <pointLight
            key={i}
            position={[Math.cos(angle) * 4.5, 1.8, Math.sin(angle) * 4.5]}
            intensity={0.35}
            color="#ffd080"
            distance={6}
          />
        );
      })}
    </>
  );
}

/* ============================================================================
   NEBLINA DE BORDA DO MAPA
   ========================================================================= */

function MapFogPlanes() {
  const fogTex = useMemo(() => {
    const c   = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const grd = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
    grd.addColorStop(0,   'rgba(180,200,160,0)');
    grd.addColorStop(0.6, 'rgba(160,190,140,0.15)');
    grd.addColorStop(1,   'rgba(140,175,120,0.75)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);

  return (
    <mesh position={[0, 0.5, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[36, 36]} />
      <meshBasicMaterial map={fogTex} transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}

/* ============================================================================
   CENA COMPLETA
   ========================================================================= */

function TerrainScene() {
  return (
    <>
      <IsometricCameraController />
      <Lights />
      <fog attach="fog" args={['#c8d8b0', 38, 80]} />
      <Environment preset="forest" background={false} />

      <Terrain />
      <CastleFoundation />
      <BuildingPads />
      <PathSystem />
      <Pond />
      <Farmland />
      <NaturalElements />
      <Suspense fallback={null}>
        <Trees />
      </Suspense>
    </>
  );
}

/* ============================================================================
   EXPORT PRINCIPAL
   ========================================================================= */

export function CastleView() {
  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <Canvas
        orthographic
        shadows
        camera={{ position: [22, 18, 22], zoom: 38, near: 0.1, far: 300 }}
        gl={{
          antialias:            true,
          toneMapping:          THREE.ACESFilmicToneMapping,
          toneMappingExposure:  1.15,
          shadowMapType:        THREE.PCFSoftShadowMap,
        } as any}
        style={{ background: '#8ab888' }}
      >
        <Suspense fallback={null}>
          <TerrainScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default CastleView;

useGLTF.preload('/arvoreum.glb');
useGLTF.preload('/casteloteste.glb');
