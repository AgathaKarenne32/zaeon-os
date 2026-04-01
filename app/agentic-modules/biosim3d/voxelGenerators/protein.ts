import type { VoxelBlock, SceneParameters } from '../types';

// Amino acid residue colors (by polarity / nature)
const RESIDUE_COLORS: Record<string, string> = {
  nonpolar: '#94a3b8',
  polar:    '#67e8f9',
  positive: '#60a5fa',
  negative: '#f87171',
  special:  '#d8b4fe',
  aromatic: '#fbbf24',
};

const RESIDUE_ORDER = [
  RESIDUE_COLORS.nonpolar, RESIDUE_COLORS.polar, RESIDUE_COLORS.nonpolar,
  RESIDUE_COLORS.positive, RESIDUE_COLORS.aromatic, RESIDUE_COLORS.nonpolar,
  RESIDUE_COLORS.negative, RESIDUE_COLORS.polar, RESIDUE_COLORS.special,
  RESIDUE_COLORS.nonpolar, RESIDUE_COLORS.positive, RESIDUE_COLORS.aromatic,
  RESIDUE_COLORS.nonpolar, RESIDUE_COLORS.polar, RESIDUE_COLORS.negative,
  RESIDUE_COLORS.special, RESIDUE_COLORS.nonpolar, RESIDUE_COLORS.polar,
];

export function generateProtein(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const length = params.chainLength ?? 36;

  // ─── Alpha-helix backbone ─────────────────────────────────────────────────
  // 3.6 residues per turn in a real helix → we approximate with 4 per "floor"
  const HELIX_RADIUS = 2.5;
  const RISE_PER_RESIDUE = 1.5; // Å → voxel units

  for (let i = 0; i < length; i++) {
    const angle = (i / 3.6) * Math.PI * 2;
    const x = Math.round(HELIX_RADIUS * Math.cos(angle));
    const y = Math.round(i * RISE_PER_RESIDUE);
    const z = Math.round(HELIX_RADIUS * Math.sin(angle));
    const color = RESIDUE_ORDER[i % RESIDUE_ORDER.length];

    voxels.push({ x, y, z, color, label: `Residue ${i + 1}` });

    // H-bond to residue i+4 (backbone)
    if (i < length - 4 && i % 4 === 0) {
      const targetAngle = ((i + 4) / 3.6) * Math.PI * 2;
      const tx = Math.round(HELIX_RADIUS * Math.cos(targetAngle));
      const ty = Math.round((i + 4) * RISE_PER_RESIDUE);
      const tz = Math.round(HELIX_RADIUS * Math.sin(targetAngle));

      // Draw H-bond as lighter blocks
      const steps = 5;
      for (let s = 1; s < steps; s++) {
        voxels.push({
          x: Math.round(x + ((tx - x) * s) / steps),
          y: Math.round(y + ((ty - y) * s) / steps),
          z: Math.round(z + ((tz - z) * s) / steps),
          color: '#334155',
          label: 'H-bond',
        });
      }
    }
  }

  return voxels;
}
