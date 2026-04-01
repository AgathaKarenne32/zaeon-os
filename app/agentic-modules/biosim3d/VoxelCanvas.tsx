"use client";

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { VoxelBlock } from './types';

// ─── Single color group rendered as InstancedMesh ─────────────────────────────
interface VoxelGroupProps {
  color: string;
  blocks: VoxelBlock[];
}

function VoxelGroup({ color, blocks }: VoxelGroupProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);

  const material = useMemo(() => {
    // Parse emissive intensity based on warm/cool
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.12,
      roughness: 0.35,
      metalness: 0.4,
    });
  }, [color]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [blocks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, blocks.length]}
      castShadow
      receiveShadow
    />
  );
}

// ─── Scene root with auto-rotation ───────────────────────────────────────────
interface VoxelSceneProps {
  voxels: VoxelBlock[];
  autoRotate: boolean;
  rotateSpeed: number;
}

function VoxelScene({ voxels, autoRotate, rotateSpeed }: VoxelSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Center voxels around origin
  const centeredVoxels = useMemo(() => {
    if (!voxels.length) return voxels;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    voxels.forEach(v => {
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    return voxels.map(v => ({ ...v, x: v.x - cx, y: v.y - cy, z: v.z - cz }));
  }, [voxels]);

  // Group voxels by color for batched rendering
  const colorGroups = useMemo(() => {
    const map = new Map<string, VoxelBlock[]>();
    centeredVoxels.forEach(v => {
      if (!map.has(v.color)) map.set(v.color, []);
      map.get(v.color)!.push(v);
    });
    return Array.from(map.entries());
  }, [centeredVoxels]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotateSpeed;
    }
  });

  if (!voxels.length) return null;

  return (
    <group ref={groupRef}>
      {colorGroups.map(([color, blocks]) => (
        <VoxelGroup key={color} color={color} blocks={blocks} />
      ))}
    </group>
  );
}

// ─── Camera auto-fit ─────────────────────────────────────────────────────────
function CameraRig({ voxelCount }: { voxelCount: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = voxelCount > 5000 ? 45 : voxelCount > 1000 ? 35 : 25;
    camera.position.set(dist * 0.8, dist * 0.5, dist * 0.8);
    camera.lookAt(0, 0, 0);
  }, [voxelCount, camera]);
  return null;
}

// ─── Grid floor ──────────────────────────────────────────────────────────────
function GridFloor({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <gridHelper
      args={[40, 40, '#1e293b', '#0f172a']}
      position={[0, -14, 0]}
    />
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────
export interface VoxelCanvasProps {
  voxels: VoxelBlock[];
  backgroundColor?: string;
  autoRotate?: boolean;
  rotateSpeed?: number;
  showGrid?: boolean;
  accentColor?: string;
}

export default function VoxelCanvas({
  voxels,
  backgroundColor = '#030014',
  autoRotate = true,
  rotateSpeed = 0.35,
  showGrid = true,
  accentColor = '#22d3ee',
}: VoxelCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [25, 18, 25], fov: 45, near: 0.1, far: 500 }}
      style={{ background: backgroundColor, borderRadius: '1.5rem' }}
    >
      {/* Lighting setup */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.35}
        color={accentColor}
      />
      <pointLight position={[0, 15, 0]} intensity={0.6} color="#ffffff" />
      <pointLight position={[0, -10, 0]} intensity={0.2} color={accentColor} />

      {/* Fog for depth */}
      <fog attach="fog" args={[backgroundColor, 40, 120]} />

      {/* Voxels */}
      <VoxelScene
        voxels={voxels}
        autoRotate={autoRotate}
        rotateSpeed={rotateSpeed}
      />

      {/* Camera auto-fit */}
      <CameraRig voxelCount={voxels.length} />

      {/* Floor grid */}
      <GridFloor show={showGrid} />

      {/* Orbit controls for manual pan/zoom/rotate */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={100}
        dampingFactor={0.12}
        enableDamping
      />
    </Canvas>
  );
}
