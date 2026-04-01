import type { VoxelBlock, SceneParameters } from '../types';

/** Linear interpolation of two hex colors by t ∈ [0,1] */
function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (rr << 16) | (rg << 8) | rb).toString(16).slice(1)}`;
}

/** 1s orbital — spherical probability cloud */
function orbital1s(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const a0 = 4; // Bohr radius in voxels
  const maxR = 10;

  for (let x = -maxR; x <= maxR; x++) {
    for (let y = -maxR; y <= maxR; y++) {
      for (let z = -maxR; z <= maxR; z++) {
        const r = Math.sqrt(x * x + y * y + z * z);
        const prob = Math.exp(-2 * r / a0);
        // Include block stochastically based on probability
        if (prob > 0.05 && Math.random() < prob * 0.8) {
          const t = 1 - r / maxR;
          voxels.push({
            x, y, z,
            color: lerpColor('#0ea5e9', '#e0f2fe', 1 - t),
            label: `Electron density (ψ²=${prob.toFixed(2)})`,
            opacity: t,
          });
        }
      }
    }
  }
  // Nucleus
  voxels.push({ x: 0, y: 0, z: 0, color: '#ef4444', label: 'Proton (nucleus)', opacity: 1 });

  return voxels;
}

/** 2p orbital — two lobes along z-axis */
function orbital2p(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const maxR = 12;

  for (let x = -maxR; x <= maxR; x++) {
    for (let y = -maxR; y <= maxR; y++) {
      for (let z = -maxR; z <= maxR; z++) {
        const r = Math.sqrt(x * x + y * y + z * z);
        if (r === 0 || r > maxR) continue;

        const cosTheta = z / r;
        // |ψ|² ∝ r² e^{-r} cos²θ
        const prob = r * r * Math.exp(-r / 3) * cosTheta * cosTheta;

        if (prob > 0.15 && Math.random() < prob * 0.4) {
          const isPositiveLobe = z > 0;
          voxels.push({
            x, y, z,
            color: isPositiveLobe ? '#818cf8' : '#f472b6',
            label: isPositiveLobe ? '+lobe' : '−lobe',
          });
        }
      }
    }
  }

  // Node plane at z=0
  voxels.push({ x: 0, y: 0, z: 0, color: '#1e293b', label: 'Node (nucleus)' });

  return voxels;
}

/** 3d orbital — four-lobed clover */
function orbital3d(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const maxR = 14;

  for (let x = -maxR; x <= maxR; x++) {
    for (let y = -maxR; y <= maxR; y++) {
      for (let z = -maxR; z <= maxR; z++) {
        const r = Math.sqrt(x * x + y * y + z * z);
        if (r === 0 || r > maxR) continue;

        const cosTheta = z / r;
        // |ψ|² ∝ r^4 e^{-r} (3cos²θ - 1)²
        const legendre = (3 * cosTheta * cosTheta - 1);
        const prob = Math.pow(r, 1.5) * Math.exp(-r / 4) * legendre * legendre * 0.01;

        if (prob > 0.1 && Math.random() < prob * 0.5) {
          const quadrant = (x > 0 ? 0 : 1) + (z > 0 ? 0 : 2);
          const colors = ['#c084fc', '#818cf8', '#f472b6', '#38bdf8'];
          voxels.push({ x, y, z, color: colors[quadrant % 4], label: '3d_z² orbital' });
        }
      }
    }
  }

  voxels.push({ x: 0, y: 0, z: 0, color: '#ef4444', label: 'Nucleus' });
  return voxels;
}

export function generateQuantum(params: SceneParameters): VoxelBlock[] {
  const n       = params.principalN ?? 1;
  const orbital = params.orbital    ?? 's';

  if (orbital === 's') return orbital1s(params);
  if (orbital === 'p') return orbital2p(params);
  if (orbital === 'd') return orbital3d(params);

  return orbital1s(params);
}

/** Hydrogen atom structure (nucleus + electron shell) */
export function generateAtom(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const Z = params.atomicNumber ?? 1;

  // Nucleus protons (red) and neutrons (blue) packed together
  let n = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (n < Z) {
          voxels.push({ x, y, z, color: n % 2 === 0 ? '#ef4444' : '#60a5fa', label: n % 2 === 0 ? 'Proton' : 'Neutron' });
          n++;
        }
      }
    }
  }

  // Electron shells — 1s for now
  return [...voxels, ...orbital1s({ ...params, principalN: 1 })];
}
