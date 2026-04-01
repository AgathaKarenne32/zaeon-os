import type { VoxelBlock, SceneParameters } from '../types';

// CPK-like nucleotide colors
const BASE_COLORS: Record<string, string> = {
  A: '#ef4444', // Adenine  — red
  T: '#3b82f6', // Thymine  — blue
  G: '#22c55e', // Guanine  — green
  C: '#f59e0b', // Cytosine — amber
  U: '#f97316', // Uracil   — orange (RNA)
};

const BACKBONE_1 = '#22d3ee'; // cyan strand
const BACKBONE_2 = '#f472b6'; // pink strand

/** Lerp a fractional path from (x1,z1) to (x2,z2) and fill with blocks */
function fillGap(
  voxels: VoxelBlock[],
  x1: number, y: number, z1: number,
  x2: number, z2: number,
  color: string,
  label: string
) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(z2 - z1), 1);
  for (let s = 1; s < steps; s++) {
    voxels.push({
      x: Math.round(x1 + ((x2 - x1) * s) / steps),
      y,
      z: Math.round(z1 + ((z2 - z1) * s) / steps),
      color,
      label,
    });
  }
}

export function generateDNA(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];

  const height    = params.helixHeight  ?? 24;
  const radius    = params.helixRadius  ?? 3;
  const turns     = params.helixTurns   ?? 2.5;
  const sequence  = params.sequence     ?? '';

  const baseKeys = Object.keys(BASE_COLORS).filter(k => k !== 'U');

  for (let y = 0; y < height; y++) {
    const angle1 = (y / height) * Math.PI * 2 * turns;
    const angle2 = angle1 + Math.PI; // opposite strand

    // Backbone block — strand 1
    const x1 = Math.round(Math.cos(angle1) * radius);
    const z1 = Math.round(Math.sin(angle1) * radius);
    voxels.push({ x: x1, y, z: z1, color: BACKBONE_1, label: 'Backbone 5′→3′' });

    // Backbone block — strand 2
    const x2 = Math.round(Math.cos(angle2) * radius);
    const z2 = Math.round(Math.sin(angle2) * radius);
    voxels.push({ x: x2, y, z: z2, color: BACKBONE_2, label: 'Backbone 3′→5′' });

    // Base pair every 2 steps
    if (y % 2 === 0) {
      const baseIndex = (y / 2) % baseKeys.length;
      const base = sequence[y / 2] ?? baseKeys[baseIndex];
      const color = BASE_COLORS[base] ?? BASE_COLORS.A;
      const complementColor = {
        A: BASE_COLORS.T, T: BASE_COLORS.A,
        G: BASE_COLORS.C, C: BASE_COLORS.G,
      }[base] ?? BASE_COLORS.T;

      // Fill inward from strand1 position — half way to center
      fillGap(voxels, x1, y, z1, 0, 0, color, `Base: ${base}`);
      fillGap(voxels, x2, y, z2, 0, 0, complementColor, `Base: complement`);
    }
  }

  return voxels;
}

/** Single-stranded RNA — no second backbone, Uracil instead of Thymine */
export function generateRNA(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];

  const height  = params.helixHeight ?? 20;
  const radius  = params.helixRadius ?? 2.5;
  const turns   = params.helixTurns  ?? 2;

  const bases = ['A', 'U', 'C', 'G'];

  for (let y = 0; y < height; y++) {
    const angle = (y / height) * Math.PI * 2 * turns;
    const x = Math.round(Math.cos(angle) * radius);
    const z = Math.round(Math.sin(angle) * radius);

    voxels.push({ x, y, z, color: BACKBONE_1, label: 'RNA Backbone' });

    // Hanging base (inward, shorter)
    if (y % 2 === 0) {
      const base = bases[Math.floor(y / 2) % bases.length];
      const color = BASE_COLORS[base];
      voxels.push({
        x: Math.round(x * 0.5),
        y,
        z: Math.round(z * 0.5),
        color,
        label: `Base: ${base}`,
      });
    }
  }

  return voxels;
}
