"use client";
/**
 * Bloch Sphere renderer using @react-three/fiber (already installed)
 *
 * A qubit state |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
 * is represented as a unit vector on the Bloch sphere.
 */

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

export interface BlochState {
  theta: number;  // polar  [0, π]
  phi:   number;  // azimuth [0, 2π]
  label?: string;
}

// ─── State vector arrow ───────────────────────────────────────────────────────
function StateVector({ theta, phi }: BlochState) {
  const tipRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (tipRef.current) {
      tipRef.current.position.set(
        Math.sin(theta) * Math.cos(phi + clock.getElapsedTime() * 0.3),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi + clock.getElapsedTime() * 0.3)
      );
    }
  });

  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);

  return (
    <group>
      {/* Arrow shaft */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]}
        color="#f59e0b"
        lineWidth={3}
      />
      {/* Arrow tip */}
      <mesh ref={tipRef} position={[x, y, z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Equator circle ───────────────────────────────────────────────────────────
function EquatorCircle({ color = '#334155', tilt = 0 }) {
  const pts = Array.from({ length: 65 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a), Math.sin(a) * Math.sin(tilt), Math.sin(a) * Math.cos(tilt));
  });
  return <Line points={pts} color={color} lineWidth={1} />;
}

// ─── Axes ────────────────────────────────────────────────────────────────────
function Axes() {
  const axes = [
    { start: [-1.4, 0, 0] as [number,number,number], end: [1.4, 0, 0]  as [number,number,number], color: '#ef4444', label: 'x', labelPos: [1.5, 0, 0] },
    { start: [0, -1.4, 0] as [number,number,number], end: [0, 1.4, 0]  as [number,number,number], color: '#22c55e', label: 'z', labelPos: [0, 1.55, 0] },
    { start: [0, 0, -1.4] as [number,number,number], end: [0, 0, 1.4]  as [number,number,number], color: '#3b82f6', label: 'y', labelPos: [0, 0, 1.55] },
  ];
  return (
    <group>
      {axes.map(({ start, end, color, label, labelPos }) => (
        <group key={label}>
          <Line points={[new THREE.Vector3(...start), new THREE.Vector3(...end)]} color={color} lineWidth={1} opacity={0.6} />
          <Html position={labelPos as [number,number,number]} style={{ color, fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', userSelect: 'none' }}>
            {label}
          </Html>
        </group>
      ))}
      {/* Pole labels */}
      <Html position={[0, 1.15, 0]} style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>|0⟩</Html>
      <Html position={[0,-1.15, 0]} style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>|1⟩</Html>
      <Html position={[1.15, 0, 0]} style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>|+⟩</Html>
      <Html position={[-1.15,0, 0]} style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>|−⟩</Html>
    </group>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface BlochSphereProps {
  state: BlochState;
  height?: number;
}

export default function BlochSphere({ state, height = 320 }: BlochSphereProps) {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden bg-[#030014]">
      <Canvas camera={{ position: [2, 1.5, 2], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={0.8} color="#818cf8" />
        <pointLight position={[-3,-3,-3]} intensity={0.4} color="#22d3ee" />

        {/* Transparent sphere shell */}
        <Sphere args={[1, 48, 48]}>
          <meshStandardMaterial
            color="#1e1b4b"
            transparent opacity={0.12}
            wireframe={false}
            side={THREE.DoubleSide}
          />
        </Sphere>

        {/* Wireframe overlay */}
        <Sphere args={[1, 12, 12]}>
          <meshBasicMaterial color="#334155" wireframe transparent opacity={0.25} />
        </Sphere>

        {/* Equatorial circles */}
        <EquatorCircle color="#334155" tilt={0} />
        <EquatorCircle color="#334155" tilt={Math.PI / 2} />

        {/* Axes + labels */}
        <Axes />

        {/* State vector */}
        <StateVector {...state} />

        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}
