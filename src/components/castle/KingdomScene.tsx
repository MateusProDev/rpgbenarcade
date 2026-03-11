/**
 * KingdomScene — Cena 3D isométrica estilo "Class of Kings"
 * Câmera fixa, modelos GLB, névoa, sombras e ambiente floresta.
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================================
   POSIÇÕES DAS ÁRVORES
   ========================================================================= */

const TREE_POSITIONS: [number, number, number][] = [
  [5, 0, 5],
  [-5, 0, -5],
  [3, 0, -4],
  [-3, 0, 4],
  [6, 0, -2],
];

/* ============================================================================
   MODELOS GLB
   ========================================================================= */

function CastleModel() {
  const { scene } = useGLTF('/models/castle.glb');
  return <primitive object={scene} position={[0, 0, 0]} />;
}

function TreeModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/models/tree.glb');
  const cloned = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} position={position} />;
}

/* ============================================================================
   CHÃO (GRAMA)
   ========================================================================= */

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#3a9e3a" roughness={0.9} />
    </mesh>
  );
}

/* ============================================================================
   ILUMINAÇÃO
   ========================================================================= */

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
}

/* ============================================================================
   CENA INTERNA (dentro do Suspense)
   ========================================================================= */

function SceneContent() {
  return (
    <>
      <Lights />
      <Ground />
      <CastleModel />
      {TREE_POSITIONS.map((pos, i) => (
        <TreeModel key={i} position={pos} />
      ))}
      <Environment preset="forest" />
      <OrbitControls
        enableRotate={false}
        enablePan
        enableZoom
        minDistance={10}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

/* ============================================================================
   COMPONENTE PRINCIPAL
   ========================================================================= */

export default function KingdomScene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [12.25, 10, 12.25],
        fov: 30,
        near: 0.1,
        far: 200,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(new THREE.Vector3(0, 0, 0));
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Névoa */}
      <fog attach="fog" args={['#a0c0a0', 20, 40]} />

      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}

/* ============================================================================
   PRÉ-CARREGAMENTO
   ========================================================================= */

useGLTF.preload('/models/castle.glb');
useGLTF.preload('/models/tree.glb');
