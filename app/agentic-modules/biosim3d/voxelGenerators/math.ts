import type { VoxelBlock, SceneParameters } from '../types';

/** Map a value t ∈ [0,1] to a rainbow-gradient hex color */
function rainbowColor(t: number): string {
  // Blue → Cyan → Green → Yellow → Red
  const hue = Math.round((1 - t) * 240); // 240 (blue) → 0 (red)
  return hslToHex(hue, 90, 60);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── Math surface generators ─────────────────────────────────────────────────

function ripple(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const res = params.resolution ?? 12;
  let minZ = Infinity, maxZ = -Infinity;

  const points: { gx: number; gz: number; gy: number }[] = [];

  for (let gx = -res; gx <= res; gx++) {
    for (let gz = -res; gz <= res; gz++) {
      const r = Math.sqrt(gx * gx + gz * gz);
      const gy = r === 0 ? 3 : Math.round(3 * Math.sin(r) / (r / 2));
      minZ = Math.min(minZ, gy);
      maxZ = Math.max(maxZ, gy);
      points.push({ gx, gz, gy });
    }
  }

  points.forEach(({ gx, gz, gy }) => {
    const t = maxZ === minZ ? 0.5 : (gy - minZ) / (maxZ - minZ);
    voxels.push({ x: gx, y: gy, z: gz, color: rainbowColor(t), label: `f(x,y)=${gy}` });
  });

  return voxels;
}

function saddle(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const res = params.resolution ?? 10;
  let minY = Infinity, maxY = -Infinity;

  const points: { gx: number; gz: number; gy: number }[] = [];

  for (let gx = -res; gx <= res; gx++) {
    for (let gz = -res; gz <= res; gz++) {
      const gy = Math.round((gx * gx - gz * gz) / (res / 3));
      minY = Math.min(minY, gy);
      maxY = Math.max(maxY, gy);
      points.push({ gx, gz, gy });
    }
  }

  points.forEach(({ gx, gz, gy }) => {
    const t = maxY === minY ? 0.5 : (gy - minY) / (maxY - minY);
    voxels.push({ x: gx, y: gy, z: gz, color: rainbowColor(t), label: `f(x,y)=${gy}` });
  });

  return voxels;
}

function paraboloid(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const res = params.resolution ?? 10;

  for (let gx = -res; gx <= res; gx++) {
    for (let gz = -res; gz <= res; gz++) {
      const gy = Math.round((gx * gx + gz * gz) / (res / 4)) - res;
      const t = (gx * gx + gz * gz) / (res * res * 2);
      voxels.push({
        x: gx, y: gy, z: gz,
        color: rainbowColor(Math.min(1, t)),
        label: `f(x,y)=x²+y²`,
      });
    }
  }

  return voxels;
}

function torus(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const R = 7; // major radius
  const r = 3; // tube radius

  const steps = 80;
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    for (let j = 0; j < steps; j++) {
      const phi = (j / steps) * 2 * Math.PI;
      const x = Math.round((R + r * Math.cos(phi)) * Math.cos(theta));
      const y = Math.round(r * Math.sin(phi));
      const z = Math.round((R + r * Math.cos(phi)) * Math.sin(theta));
      const t = (i / steps);
      voxels.push({ x, y, z, color: rainbowColor(t), label: 'Torus surface' });
    }
  }

  return deduplicateVoxels(voxels);
}

function deduplicateVoxels(voxels: VoxelBlock[]): VoxelBlock[] {
  const seen = new Set<string>();
  return voxels.filter(v => {
    const key = `${v.x},${v.y},${v.z}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Lorenz Attractor ─────────────────────────────────────────────────────────
function lorenz(): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const σ = 10, ρ = 28, β = 8 / 3;
  let x = 0.1, y = 0, z = 0;
  const dt = 0.008, steps = 3500, scale = 0.55;
  for (let i = 0; i < steps; i++) {
    const dx = σ * (y - x); const dy = x * (ρ - z) - y; const dz = x * y - β * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    const t = i / steps;
    voxels.push({ x: Math.round(x * scale), y: Math.round((z - ρ / 2) * scale), z: Math.round(y * scale), color: rainbowColor(t), label: 'Lorenz attractor' });
  }
  return deduplicateVoxels(voxels);
}

// ─── Möbius Strip ──────────────────────────────────────────────────────────────
function mobius(): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const R = 8;
  const uSteps = 120, vSteps = 8;
  for (let ui = 0; ui < uSteps; ui++) {
    const u = (ui / uSteps) * 2 * Math.PI;
    for (let vi = 0; vi < vSteps; vi++) {
      const v = (vi / vSteps - 0.5) * 3;
      const x = Math.round((R + v * Math.cos(u / 2)) * Math.cos(u));
      const y = Math.round(v * Math.sin(u / 2));
      const z = Math.round((R + v * Math.cos(u / 2)) * Math.sin(u));
      const t = ui / uSteps;
      voxels.push({ x, y, z, color: rainbowColor(t), label: 'Möbius strip' });
    }
  }
  return deduplicateVoxels(voxels);
}

// ─── Fourier Series Decomposition ────────────────────────────────────────────
function fourier(): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const res = 24;
  const harmonics = [1, 3, 5, 7, 9]; // odd harmonics (square wave approx)
  const colors = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa'];
  let sumY: Record<string, number> = {};

  harmonics.forEach((n, hi) => {
    for (let x = -res; x <= res; x++) {
      const y = Math.round((4 / (Math.PI * n)) * Math.sin(n * x * 0.4) * 5);
      // Individual harmonic (offset by z)
      voxels.push({ x, y, z: hi * 6 - 12, color: colors[hi], label: `Harmonic n=${n}` });
      // Cumulative sum
      sumY[x] = (sumY[x] ?? 0) + y;
    }
  });
  // Sum (superposition) at z=16
  Object.entries(sumY).forEach(([x, y]) => {
    const t = (parseInt(x) + res) / (2 * res);
    voxels.push({ x: parseInt(x), y: Math.round(y / harmonics.length), z: 17, color: rainbowColor(t), label: 'Sum (square wave)' });
  });
  return deduplicateVoxels(voxels);
}

// ─── Network / Graph ──────────────────────────────────────────────────────────
function network(): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  // 12 nodes placed on a sphere
  const nodes: [number,number,number][] = [];
  for (let i = 0; i < 12; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / 12);
    const phi   = Math.PI * (1 + Math.sqrt(5)) * i;
    nodes.push([Math.round(Math.sin(theta)*Math.cos(phi)*10), Math.round(Math.cos(theta)*10), Math.round(Math.sin(theta)*Math.sin(phi)*10)]);
  }
  // Node blocks (spheres)
  nodes.forEach(([x,y,z],i) => {
    const col = rainbowColor(i/12);
    for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) for (let dz=-1;dz<=1;dz++)
      if (dx*dx+dy*dy+dz*dz<=2) voxels.push({x:x+dx,y:y+dy,z:z+dz,color:col,label:`Node ${i+1}`});
  });
  // Edges (connect nearest neighbours)
  nodes.forEach(([x1,y1,z1],i) => {
    nodes.forEach(([x2,y2,z2],j) => {
      if (j <= i) return;
      const d = Math.sqrt((x2-x1)**2+(y2-y1)**2+(z2-z1)**2);
      if (d < 12) {
        const steps = Math.round(d)*2;
        for (let s=1;s<steps;s++)
          voxels.push({x:Math.round(x1+(x2-x1)*s/steps),y:Math.round(y1+(y2-y1)*s/steps),z:Math.round(z1+(z2-z1)*s/steps),color:'#334155',label:`Edge ${i}-${j}`});
      }
    });
  });
  return deduplicateVoxels(voxels);
}

export function generateMath(params: SceneParameters): VoxelBlock[] {
  const fn = params.mathFunction ?? 'ripple';
  switch (fn) {
    case 'ripple':     return ripple(params);
    case 'saddle':     return saddle(params);
    case 'paraboloid': return paraboloid(params);
    case 'torus':      return torus(params);
    case 'lorenz':     return lorenz();
    case 'mobius':     return mobius();
    case 'fourier':    return fourier();
    case 'network':    return network();
    default:           return ripple(params);
  }
}
