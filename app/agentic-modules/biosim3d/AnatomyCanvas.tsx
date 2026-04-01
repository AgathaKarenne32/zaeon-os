"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

export interface AnatomyAsset {
  id: string;
  file_glb: string;
  unit_scale: number;
  position?: [number, number, number];
  category: string;
}

interface AnatomyCanvasProps {
  assets: AnatomyAsset[];
  autoRotate?: boolean;
}

function AnatomyModel({ asset }: { asset: AnatomyAsset }) {
  const { scene } = useGLTF(asset.file_glb);
  // Clone the scene to avoid sharing mutations if the same model is loaded twice
  const clonedScene = scene.clone();
  
  const s = asset.unit_scale || 1.0;
  clonedScene.scale.set(s, s, s);
  
  if (asset.position) {
    clonedScene.position.set(...asset.position);
  }

  return <primitive object={clonedScene} />;
}

export default function AnatomyCanvas({ assets, autoRotate = true }: AnatomyCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 3], fov: 45 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['transparent']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <group position={[0, -1, 0]}>
          {assets.map((asset) => (
            <AnatomyModel key={asset.id} asset={asset} />
          ))}
        </group>
      </Suspense>

      <OrbitControls
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={1.0}
        enableDamping
      />
    </Canvas>
  );
}
