import type { VoxelBlock, SceneParameters, AtomDef } from '../types';

// CPK element color palette
const ELEMENT_COLORS: Record<string, string> = {
  H:  '#e2e8f0', // white-ish
  C:  '#374151', // dark gray
  N:  '#3b82f6', // blue
  O:  '#ef4444', // red
  P:  '#f97316', // orange
  S:  '#eab308', // yellow
  Cl: '#22c55e', // green
  Na: '#a78bfa', // violet
  Fe: '#b45309', // rust
  Ca: '#14b8a6', // teal
  Mg: '#34d399', // emerald
  Zn: '#94a3b8', // slate
};

const BOND_COLOR = '#94a3b8'; // neutral gray for bond blocks

function getElementColor(el: string): string {
  return ELEMENT_COLORS[el] ?? '#a78bfa';
}

/** Fill a line of blocks from (ax, ay, az) to (bx, by, bz) */
function blockLine(
  voxels: VoxelBlock[],
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  color: string,
  label: string
) {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az), 1);
  for (let s = 1; s < steps; s++) {
    voxels.push({
      x: Math.round(ax + ((bx - ax) * s) / steps),
      y: Math.round(ay + ((by - ay) * s) / steps),
      z: Math.round(az + ((bz - az) * s) / steps),
      color,
      label,
    });
  }
}

/** Add atom block(s) at position — heavier atoms are 2x2x2 */
function addAtom(
  voxels: VoxelBlock[],
  el: string, x: number, y: number, z: number,
  size: number = 1
) {
  const color = getElementColor(el);
  if (size === 1) {
    voxels.push({ x, y, z, color, label: el });
  } else {
    // 2x2x2 block for heavier atoms
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        for (let dz = 0; dz < size; dz++) {
          voxels.push({
            x: x + dx - Math.floor(size / 2),
            y: y + dy - Math.floor(size / 2),
            z: z + dz - Math.floor(size / 2),
            color,
            label: el,
          });
        }
      }
    }
  }
}

// Pre-built molecule layouts (scaled to voxel grid)
const MOLECULES: Record<string, { atoms: AtomDef[]; bonds: [number, number][] }> = {
  H2O: {
    atoms: [
      { element: 'O', x: 0,  y: 0, z: 0 },
      { element: 'H', x: -3, y: 2, z: 0 },
      { element: 'H', x:  3, y: 2, z: 0 },
    ],
    bonds: [[0, 1], [0, 2]],
  },
  CO2: {
    atoms: [
      { element: 'C', x:  0, y: 0, z: 0 },
      { element: 'O', x: -4, y: 0, z: 0 },
      { element: 'O', x:  4, y: 0, z: 0 },
    ],
    bonds: [[0, 1], [0, 2]],
  },
  CH4: {
    atoms: [
      { element: 'C', x:  0, y:  0, z:  0 },
      { element: 'H', x:  3, y:  3, z:  0 },
      { element: 'H', x: -3, y:  3, z:  0 },
      { element: 'H', x:  0, y: -2, z:  3 },
      { element: 'H', x:  0, y: -2, z: -3 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },
  NH3: {
    atoms: [
      { element: 'N', x:  0, y:  0, z:  0 },
      { element: 'H', x:  3, y:  2, z:  0 },
      { element: 'H', x: -3, y:  2, z:  0 },
      { element: 'H', x:  0, y:  2, z:  3 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },
  adenine: {
    atoms: [
      // Pyrimidine ring
      { element: 'N', x:  0, y:  0, z:  0 },
      { element: 'C', x:  3, y:  0, z:  0 },
      { element: 'N', x:  4, y:  3, z:  0 },
      { element: 'C', x:  1, y:  4, z:  0 },
      { element: 'C', x: -2, y:  3, z:  0 },
      { element: 'C', x: -2, y:  0, z:  0 },
      // Imidazole ring
      { element: 'N', x:  2, y:  6, z:  0 },
      { element: 'C', x:  4, y:  7, z:  0 },
      { element: 'N', x:  3, y: 10, z:  0 },
      // Amino group
      { element: 'N', x: -5, y:  4, z:  0 },
      { element: 'H', x: -7, y:  2, z:  0 },
      { element: 'H', x: -7, y:  6, z:  0 },
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0], [3,6],[6,7],[7,8],[8,2], [4,9],[9,10],[9,11]],
  },
  glucose: {
    // Simplified pyranose ring
    atoms: [
      { element: 'O', x:  0, y:  4, z:  0 }, // ring oxygen
      { element: 'C', x:  3, y:  3, z:  0 },
      { element: 'C', x:  4, y:  0, z:  0 },
      { element: 'C', x:  2, y: -3, z:  0 },
      { element: 'C', x: -2, y: -3, z:  0 },
      { element: 'C', x: -4, y:  0, z:  0 },
      // Exocyclic C6
      { element: 'C', x:  6, y:  5, z:  0 },
      // OH groups (simplified)
      { element: 'O', x:  6, y: -1, z:  0 },
      { element: 'O', x:  3, y: -6, z:  0 },
      { element: 'O', x: -3, y: -6, z:  0 },
      { element: 'O', x: -7, y:  1, z:  0 },
      { element: 'O', x:  8, y:  7, z:  0 },
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0], [1,6],[2,7],[3,8],[4,9],[5,10],[6,11]],
  },
};

export function generateMolecule(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const formula = params.formula ?? 'H2O';

  const template = MOLECULES[formula];

  if (template) {
    // Render from hard-coded layout
    template.atoms.forEach((a, i) => {
      const isHeavy = !['H'].includes(a.element);
      addAtom(voxels, a.element, a.x, a.y, a.z, isHeavy ? 2 : 1);
    });
    template.bonds.forEach(([i, j]) => {
      const a = template.atoms[i];
      const b = template.atoms[j];
      blockLine(voxels, a.x, a.y, a.z, b.x, b.y, b.z, BOND_COLOR, 'Bond');
    });
  } else if (params.atoms && params.bonds) {
    // Render from AI-provided layout (scaled by 3 for voxel readability)
    params.atoms.forEach((a: AtomDef) => {
      addAtom(voxels, a.element, a.x * 3, a.y * 3, a.z * 3, 1);
    });
    params.bonds.forEach((b: { from: number; to: number }) => {
      const a1 = params.atoms![b.from];
      const a2 = params.atoms![b.to];
      blockLine(
        voxels,
        a1.x * 3, a1.y * 3, a1.z * 3,
        a2.x * 3, a2.y * 3, a2.z * 3,
        BOND_COLOR, 'Bond'
      );
    });
  }

  return voxels;
}

/** NaCl crystal lattice */
export function generateCrystal(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const size = 5;
  for (let x = -size; x <= size; x++) {
    for (let y = -size; y <= size; y++) {
      for (let z = -size; z <= size; z++) {
        if ((x + y + z) % 2 === 0) {
          voxels.push({ x: x * 2, y: y * 2, z: z * 2, color: '#60a5fa', label: 'Na⁺' });
        } else {
          voxels.push({ x: x * 2, y: y * 2, z: z * 2, color: '#facc15', label: 'Cl⁻' });
        }
      }
    }
  }
  return voxels;
}
