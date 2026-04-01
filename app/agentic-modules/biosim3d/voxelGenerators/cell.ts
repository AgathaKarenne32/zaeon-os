import type { VoxelBlock, SceneParameters } from '../types';

/** Fill surface of a sphere at center (cx, cy, cz) with given radius and thickness */
function sphereShell(
  cx: number, cy: number, cz: number,
  radius: number,
  thickness: number,
  color: string,
  label: string
): VoxelBlock[] {
  const blocks: VoxelBlock[] = [];
  const r = radius;
  for (let x = -r - 1; x <= r + 1; x++) {
    for (let y = -r - 1; y <= r + 1; y++) {
      for (let z = -r - 1; z <= r + 1; z++) {
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist >= r - thickness && dist <= r) {
          blocks.push({ x: cx + x, y: cy + y, z: cz + z, color, label });
        }
      }
    }
  }
  return blocks;
}

/** Filled sphere */
function solidSphere(
  cx: number, cy: number, cz: number,
  radius: number, color: string, label: string
): VoxelBlock[] {
  const blocks: VoxelBlock[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        if (Math.sqrt(x * x + y * y + z * z) <= radius) {
          blocks.push({ x: cx + x, y: cy + y, z: cz + z, color, label });
        }
      }
    }
  }
  return blocks;
}

/** Box of filled blocks */
function box(
  cx: number, cy: number, cz: number,
  w: number, h: number, d: number,
  color: string, label: string
): VoxelBlock[] {
  const blocks: VoxelBlock[] = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        blocks.push({
          x: cx + x - Math.floor(w / 2),
          y: cy + y - Math.floor(h / 2),
          z: cz + z - Math.floor(d / 2),
          color, label,
        });
      }
    }
  }
  return blocks;
}

export function generateCell(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const cellType = params.cellType ?? 'animal';
  const showOrganelles = params.showOrganelles !== false;

  // ─── Outer membrane / cell wall ──────────────────────────────────────────
  const membraneColor = cellType === 'plant' ? '#86efac' : '#fca5a5'; // green-ish vs red-ish
  const membraneLabel = cellType === 'plant' ? 'Cell Wall' : 'Plasma Membrane';
  voxels.push(...sphereShell(0, 0, 0, 9, 1, membraneColor, membraneLabel));

  // ─── Nucleus ─────────────────────────────────────────────────────────────
  voxels.push(...sphereShell(0, 0, 0, 3, 1, '#a78bfa', 'Nuclear Envelope'));
  voxels.push(...solidSphere(0, 0, 0, 1, '#7c3aed', 'Nucleolus'));

  if (!showOrganelles) return voxels;

  // ─── Mitochondria (2 of them) ─────────────────────────────────────────────
  voxels.push(...box(5, 2, 0, 4, 2, 2, '#f97316', 'Mitochondrion'));
  voxels.push(...box(-4, -3, 2, 3, 2, 2, '#fb923c', 'Mitochondrion'));

  // ─── Endoplasmic Reticulum (flat stack) ──────────────────────────────────
  for (let i = 0; i < 4; i++) {
    voxels.push(...box(-2, 4 + i * 2, 0, 5, 1, 1, '#67e8f9', 'Rough ER'));
  }

  // ─── Golgi Apparatus (curved stack) ──────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    voxels.push(...box(2, -5, i - 1, 4 - i, 1, 1, '#fcd34d', 'Golgi'));
  }

  // ─── Ribosomes (scattered dots) ──────────────────────────────────────────
  const ribosomePositions = [
    [-5, 1, 3], [4, -2, -3], [-3, 3, -4], [6, 0, -2], [-6, -1, 1],
    [2, 5, 3], [-4, 5, -1], [3, -4, 4],
  ];
  ribosomePositions.forEach(([x, y, z]) => {
    voxels.push({ x, y, z, color: '#fbbf24', label: 'Ribosome' });
  });

  // ─── Plant-specific organelles ────────────────────────────────────────────
  if (cellType === 'plant') {
    // Chloroplasts (2)
    voxels.push(...box(-5, 4, 0, 4, 2, 2, '#22c55e', 'Chloroplast'));
    voxels.push(...box(4, -4, -2, 3, 2, 2, '#16a34a', 'Chloroplast'));
    // Central vacuole (hollow sphere, inner)
    voxels.push(...sphereShell(0, 0, 0, 5, 1, '#bae6fd', 'Central Vacuole'));
  }

  return voxels;
}
