"use client";
/**
 * Energy Level Diagram — SVG renderer
 *
 * Draws quantised energy levels for:
 *  - Hydrogen atom: E_n = −13.6 / n² eV
 *  - Particle in a box: E_n = n² π² ℏ² / (2mL²) (ℏ=m=L=1)
 *  - Quantum harmonic oscillator: E_n = ℏω(n + ½)
 *
 * Highlights the selected level with an arrow + label.
 * Draws transition arrows between levels.
 */

import React from 'react';

export type EnergySystem = 'hydrogen' | 'box' | 'harmonic';

export interface EnergyLevelDiagramProps {
  system:   EnergySystem;
  nLevels?: number;     // show this many levels (default 6)
  nActive?: number;     // currently active / highlighted level (1-indexed)
  width?:   number;
  height?:  number;
}

// ─── Energy functions ─────────────────────────────────────────────────────────
const eHydrogen = (n: number) => -13.6 / (n * n);        // eV
const eBox      = (n: number) => n * n * 1.234;           // relative units
const eHarmonic = (n: number) => (n + 0.5) * 2.5;        // ℏω = 2.5 arbitrary

const SYSTEM_LABELS: Record<EnergySystem, string> = {
  hydrogen: 'Hydrogen Atom',
  box:      'Particle in a Box',
  harmonic: 'Quantum Harmonic Oscillator',
};
const SYSTEM_UNITS: Record<EnergySystem, string> = {
  hydrogen: 'eV',
  box:      'arb. units',
  harmonic: 'ℏω',
};

// ─── Level colors ─────────────────────────────────────────────────────────────
const LEVEL_COLORS = [
  '#818cf8','#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe',
];

export default function EnergyLevelDiagram({
  system = 'hydrogen',
  nLevels = 6,
  nActive = 1,
  width = 280,
  height = 320,
}: EnergyLevelDiagramProps) {
  const energyFn = system === 'hydrogen' ? eHydrogen : system === 'box' ? eBox : eHarmonic;

  const energies = Array.from({ length: nLevels }, (_, i) => ({
    n: i + 1,
    E: energyFn(i + 1),
  }));

  const Emin = energies[0].E;
  const Emax = energies[nLevels - 1].E;
  const Erange = Emax - Emin || 1;

  // Map energy → Y coordinate (lower energy = lower y)
  const toY = (E: number) => {
    const t = (E - Emin) / Erange;
    return height - 30 - t * (height - 60);
  };

  const levelX1 = 60;
  const levelX2 = width - 60;
  const midX = (levelX1 + levelX2) / 2;
  const arrowX = width - 40;

  // Active level
  const activeE = energyFn(nActive);

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: '#030014', borderRadius: 12 }}
      aria-label={`Energy level diagram: ${SYSTEM_LABELS[system]}`}
    >
      {/* Title */}
      <text x={midX} y={15} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace" fontWeight="bold">
        {SYSTEM_LABELS[system]}
      </text>

      {/* Y-axis */}
      <line x1={50} y1={20} x2={50} y2={height - 20} stroke="#334155" strokeWidth={1} />
      <text x={14} y={height/2} textAnchor="middle" fill="#64748b" fontSize={8} fontFamily="monospace"
        transform={`rotate(-90, 14, ${height/2})`}>
        Energy ({SYSTEM_UNITS[system]})
      </text>

      {/* Energy level lines */}
      {energies.map(({ n, E }) => {
        const y   = toY(E);
        const col = LEVEL_COLORS[(n - 1) % LEVEL_COLORS.length];
        const isActive = n === nActive;
        const eLabel = Math.abs(E) < 100 ? E.toFixed(2) : E.toFixed(0);

        return (
          <g key={n}>
            {/* Level line */}
            <line x1={levelX1} y1={y} x2={levelX2} y2={y}
              stroke={isActive ? '#fbbf24' : col}
              strokeWidth={isActive ? 2.5 : 1.5}
              opacity={isActive ? 1 : 0.7}
            />
            {/* Quantum number label */}
            <text x={levelX1 - 8} y={y + 4} textAnchor="end"
              fill={isActive ? '#fbbf24' : '#94a3b8'}
              fontSize={isActive ? 9 : 8} fontFamily="monospace" fontWeight={isActive ? 'bold' : 'normal'}>
              n={n}
            </text>
            {/* Energy label */}
            <text x={levelX2 + 6} y={y + 4} textAnchor="start"
              fill={isActive ? '#fbbf24' : '#475569'}
              fontSize={7} fontFamily="monospace">
              {eLabel}
            </text>

            {/* Electron dot on active level */}
            {isActive && (
              <circle cx={midX} cy={y} r={5} fill="#fbbf24"
                filter="url(#glow)">
                <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Transition arrow for emission from nActive to ground */}
      {nActive > 1 && (() => {
        const y1 = toY(activeE);
        const y0 = toY(energyFn(1));
        const dE = Math.abs(activeE - energyFn(1));
        return (
          <g>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" />
              </marker>
            </defs>
            <line x1={arrowX} y1={y1} x2={arrowX} y2={y0 + 6}
              stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 2"
              markerEnd="url(#arrow)" />
            <text x={arrowX + 5} y={(y1 + y0) / 2} fill="#22d3ee" fontSize={7} fontFamily="monospace">
              ΔE={dE.toFixed(2)}
            </text>
          </g>
        );
      })()}

      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}
