/**
 * TreeViewer — exibe o modelo arvoreum.glb em 3D com React Three Fiber + Drei.
 * Ao carregar, percorre os meshes e aplica materiais PBR customizados:
 *   • Malhas cujo nome contém "leaf/folha/copa/leave/crown/top" → verde floresta
 *   • Restante (tronco/raiz/branch) → marrom madeira
 * Se o modelo já tiver texturas embutidas, elas são mantidas mas turbinadas
 * com roughness/metalness corrigidos para look medieval de floresta.
 */
import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/* ── paleta de materiais ─────────────────────────────────────────────────── */
const MAT_FOLIAGE = new THREE.MeshStandardMaterial({
  color:     new THREE.Color('#2d6a2d'),
  roughness: 0.85,
  metalness: 0.0,
  envMapIntensity: 0.6,
});

const MAT_TRUNK = new THREE.MeshStandardMaterial({
  color:     new THREE.Color('#5c3a1e'),
  roughness: 0.9,
  metalness: 0.0,
  envMapIntensity: 0.3,
});

const MAT_GROUND = new THREE.MeshStandardMaterial({
  color:     new THREE.Color('#3a5c2a'),
  roughness: 1.0,
  metalness: 0.0,
});

/* ── regex para identificar malhas de folhagem ────────────────────────────── */
const FOLIAGE_RE = /leaf|leave|folha|copa|crown|top|canopy|foliage|branch|galho/i;

/* ── componente interno que carrega o GLB ───────────────────────────────── */
function TreeModel({ autoRotate }: { autoRotate: boolean }) {
  const { scene } = useGLTF('/arvoreum.glb');
  const groupRef  = useRef<THREE.Group>(null!);

  /* Clona a cena e aplica materiais customizados uma única vez */
  const cloned = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      const isFoliage = FOLIAGE_RE.test(obj.name);

      /* Se o modelo já tem textura de cor (map), mantém a textura mas
         corrige roughness/metalness para look PBR realista */
      const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;

      if (src instanceof THREE.MeshStandardMaterial && src.map) {
        // modelo já texturizado → apenas aprimora PBR
        const enhanced = src.clone();
        enhanced.roughness    = isFoliage ? 0.85 : 0.9;
        enhanced.metalness    = 0.0;
        enhanced.envMapIntensity = 0.5;
        obj.material = enhanced;
      } else {
        // sem textura → aplica paleta customizada
        obj.material = isFoliage ? MAT_FOLIAGE.clone() : MAT_TRUNK.clone();
      }

      obj.castShadow    = true;
      obj.receiveShadow = true;
    });

    /* Centraliza e escala o modelo para caber na cena */
    const box    = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale  = 3.5 / maxDim;

    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);

    return clone;
  }, [scene]);

  /* Rotação suave opcional */
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return <group ref={groupRef}><primitive object={cloned} /></group>;
}

/* ── tipo das props públicas ─────────────────────────────────────────────── */
export interface TreeViewerProps {
  /** altura do container (padrão: 320px) */
  height?:     number | string;
  /** rotaciona a árvore automaticamente */
  autoRotate?: boolean;
  /** classe CSS adicional no wrapper */
  className?:  string;
}

/* ── componente de fallback enquanto carrega o GLB ──────────────────────── */
function LoadingTree() {
  return (
    <mesh>
      <cylinderGeometry args={[0.1, 0.3, 2, 8]} />
      <meshStandardMaterial color="#5c3a1e" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL (exportado)
═══════════════════════════════════════════════════════════════════════════ */
export const TreeViewer: React.FC<TreeViewerProps> = ({
  height     = 320,
  autoRotate = true,
  className  = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ height, background: 'radial-gradient(ellipse at top, #0d1f0d 0%, #060e06 100%)' }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 6], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Iluminação ambiente floresta medieval */}
        <ambientLight intensity={0.4} color="#c8e8b0" />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={30}
          color="#ffe8b0"
        />
        <directionalLight position={[-3, 4, -3]} intensity={0.4} color="#80c0ff" />
        <pointLight position={[0, 3, 2]} intensity={0.3} color="#80ff80" />

        {/* Chão */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[5, 32]} />
          <primitive object={MAT_GROUND} attach="material" />
        </mesh>

        {/* Modelo 3D da árvore */}
        <Suspense fallback={<LoadingTree />}>
          <TreeModel autoRotate={autoRotate} />
          {/* Sombra suave no chão */}
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={6}
            blur={2}
            far={4}
            color="#001000"
          />
        </Suspense>

        {/* HDRI de floresta para reflections */}
        <Environment preset="forest" />

        {/* Controles de câmera */}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-xs text-green-400/70 font-medieval tracking-wide">🌲 Floresta Medieval</span>
      </div>
    </div>
  );
};

/* pré-carrega o GLB assim que o módulo é importado */
useGLTF.preload('/arvoreum.glb');
