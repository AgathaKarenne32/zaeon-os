import type { VoxelBlock, SceneParameters } from '../types';

// ─── Color helpers ────────────────────────────────────────────────────────────
function hsl(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return `#${f(0).toString(16).padStart(2,'0')}${f(8).toString(16).padStart(2,'0')}${f(4).toString(16).padStart(2,'0')}`;
}

function rainbow(t: number): string { return hsl((1 - t) * 240, 90, 60); }

function dedup(vs: VoxelBlock[]): VoxelBlock[] {
  const s = new Set<string>();
  return vs.filter(v => { const k = `${v.x},${v.y},${v.z}`; if (s.has(k)) return false; s.add(k); return true; });
}

function line(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string, label: string): VoxelBlock[] {
  const vs: VoxelBlock[] = [];
  const steps = Math.max(Math.abs(x2-x1),Math.abs(y2-y1),Math.abs(z2-z1),1)*2;
  for (let i = 0; i <= steps; i++)
    vs.push({ x: Math.round(x1+(x2-x1)*i/steps), y: Math.round(y1+(y2-y1)*i/steps), z: Math.round(z1+(z2-z1)*i/steps), color, label });
  return vs;
}

function sphere(cx: number, cy: number, cz: number, r: number, color: string, label: string): VoxelBlock[] {
  const vs: VoxelBlock[] = [];
  for (let x=-r;x<=r;x++) for (let y=-r;y<=r;y++) for (let z=-r;z<=r;z++)
    if (x*x+y*y+z*z<=r*r+0.5) vs.push({x:cx+x,y:cy+y,z:cz+z,color,label});
  return vs;
}

// ─── Bubble Chamber — Curved particle tracks in magnetic field ────────────────
function bubbleChamber(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];

  // Primary interaction vertex
  vs.push({ x: 0, y: 0, z: 0, color: '#ffffff', label: 'Interaction vertex' });

  // Track type definitions: [radius of curvature, turns, color, label, plane]
  const tracks: Array<{ R: number; turns: number; color: string; label: string; plane: 'xz'|'xy'|'yz'; offset: number; dir: 1|-1 }> = [
    { R: 8,  turns: 1.8, color: '#60a5fa', label: 'e⁻ (electron)',  plane: 'xz', offset: 0,  dir:  1 },
    { R: 6,  turns: 1.4, color: '#f472b6', label: 'e⁺ (positron)', plane: 'xz', offset: 0,  dir: -1 },
    { R: 14, turns: 0.6, color: '#34d399', label: 'μ⁻ (muon)',     plane: 'xy', offset: 0,  dir:  1 },
    { R: 20, turns: 0.3, color: '#fbbf24', label: 'π⁺ (pion)',     plane: 'yz', offset: 0,  dir:  1 },
    { R: 10, turns: 1.0, color: '#f87171', label: 'p⁺ (proton)',   plane: 'xy', offset: 3,  dir: -1 },
    { R: 7,  turns: 2.0, color: '#a78bfa', label: 'γ→e⁺e⁻',       plane: 'xz', offset: 5,  dir:  1 },
  ];

  tracks.forEach(({ R, turns, color, label, plane, offset, dir }) => {
    const steps = Math.round(turns * 40);
    for (let i = 0; i <= steps; i++) {
      const a = dir * (i / steps) * Math.PI * 2 * turns;
      const spiral_r = R * (1 - i / steps * 0.3); // spiraling inward (energy loss)
      let x = 0, y = 0, z = 0;
      if (plane === 'xz') { x = Math.round(Math.cos(a) * spiral_r - R); z = Math.round(Math.sin(a) * spiral_r); y = offset; }
      if (plane === 'xy') { x = Math.round(Math.cos(a) * spiral_r - R); y = Math.round(Math.sin(a) * spiral_r) + offset; z = 0; }
      if (plane === 'yz') { y = Math.round(Math.cos(a) * spiral_r - R) + offset; z = Math.round(Math.sin(a) * spiral_r); x = 0; }
      vs.push({ x, y, z, color, label });
    }
  });

  // Secondary vertex (π decay) at x=-12
  vs.push({ x: -12, y: 3, z: 0, color: '#ffffff', label: 'Secondary decay vertex' });
  vs.push(...line(-12,3,0,-18,7,-3,'#fb923c','μ from π decay'));
  vs.push(...line(-12,3,0,-16,-2,4,'#6ee7b7','ν (neutrino approx)'));

  return dedup(vs);
}

// ─── Proton — Quark model with gluon field ────────────────────────────────────
function protonQuarks(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];

  // Proton boundary (sea quark cloud)
  for (let x=-6;x<=6;x++) for (let y=-6;y<=6;y++) for (let z=-6;z<=6;z++) {
    const d = Math.sqrt(x*x+y*y+z*z);
    if (d >= 4.5 && d <= 5.5 && Math.random() > 0.65)
      vs.push({ x, y, z, color: '#1e293b', label: 'Quark sea' });
    if (d < 4.5 && d > 2 && Math.random() > 0.8)
      vs.push({ x, y, z, color: '#0f2744', label: 'Gluon field' });
  }

  // Three valence quarks in colour charges (RGB)
  const quarks = [
    { x: 0, y: 4, z: 0, color: '#ef4444', label: 'u quark (red charge)'   },
    { x: 3, y:-2, z: 2, color: '#22c55e', label: 'u quark (green charge)' },
    { x:-3, y:-2, z: 2, color: '#3b82f6', label: 'd quark (blue charge)'  },
  ];
  quarks.forEach(q => {
    vs.push(...sphere(q.x, q.y, q.z, 2, q.color, q.label));
    // Bright core
    vs.push({ x: q.x, y: q.y, z: q.z, color: '#ffffff', label: q.label + ' (core)' });
  });

  // Gluon exchange lines between quarks
  const gluonColors = ['#fbbf24','#a78bfa','#34d399'];
  quarks.forEach((a, i) => {
    const b = quarks[(i+1)%3];
    const gc = gluonColors[i];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const t = s/steps;
      const wobble = Math.sin(t * Math.PI * 3) * 1.2;
      vs.push({
        x: Math.round(a.x + (b.x-a.x)*t + wobble),
        y: Math.round(a.y + (b.y-a.y)*t),
        z: Math.round(a.z + (b.z-a.z)*t + wobble),
        color: gc, label: 'Gluon',
      });
    }
  });

  return dedup(vs);
}

// ─── Wave Packet — Gaussian envelope × carrier wave ──────────────────────────
function wavePacket(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];
  const sigma = 6; // spatial spread
  const k = 0.8;   // wave number
  const A = 5;     // amplitude

  for (let x = -16; x <= 16; x++) {
    for (let z = -8; z <= 8; z++) {
      // Gaussian envelope
      const envelope = Math.exp(-(x*x) / (2*sigma*sigma));
      // Real part of wave function
      const psi = envelope * Math.cos(k * x + z * 0.1);
      const y = Math.round(psi * A);

      // Height map block
      const t = (envelope + 1) / 2;
      vs.push({ x, y, z, color: rainbow(t), label: `ψ(x,z)=${psi.toFixed(2)}` });

      // Probability density |ψ|²
      if (Math.abs(z) <= 1) {
        const prob = envelope * envelope;
        const ph = Math.round(prob * A * 0.8);
        if (ph > 0) vs.push({ x, y: -8, z, color: `rgba(251,191,36,${prob.toFixed(2)})`, label: '|ψ|² density' });
      }
    }
  }

  // Phase velocity arrow
  vs.push(...line(-16,0,0,16,0,0,'#ffffff','Phase velocity'));
  vs.push({ x: 17, y: 0, z: 0, color: '#ffffff', label: '→' });

  // Uncertainty envelope outline
  for (let x=-sigma; x<=sigma; x++) {
    const env = Math.exp(-0.5);
    vs.push({ x, y: Math.round(env*A)+1, z: -9, color: '#fbbf24', label: 'Δx uncertainty' });
  }

  return dedup(vs);
}

// ─── Photon — Electromagnetic wave ───────────────────────────────────────────
function photon(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];
  const lambda = 8; // wavelength in voxels
  const amp = 4;

  for (let x = -20; x <= 20; x++) {
    const phase = (x / lambda) * Math.PI * 2;
    // E field (vertical oscillation — yellow/white)
    const Ey = Math.round(Math.sin(phase) * amp);
    vs.push({ x, y: Ey, z: 0, color: '#fbbf24', label: 'E-field' });
    // B field (perpendicular — cyan, in z direction)
    const Bz = Math.round(Math.cos(phase) * amp);
    vs.push({ x, y: 0, z: Bz, color: '#22d3ee', label: 'B-field' });
    // Propagation axis
    vs.push({ x, y: 0, z: 0, color: '#ffffff', label: 'Propagation axis (k)' });
    // Fill E-field line down to axis
    if (Ey !== 0) {
      const step = Ey > 0 ? 1 : -1;
      for (let y = step; Math.abs(y) < Math.abs(Ey); y += step)
        vs.push({ x, y, z: 0, color: '#fde68a', label: 'E-field' });
    }
  }

  // Labels / arrows at edges
  vs.push(...line(0,0,0,0,6,0,'#fbbf24','E axis'));
  vs.push(...line(0,0,0,0,0,6,'#22d3ee','B axis'));
  vs.push(...line(0,0,0,5,0,0,'#f8fafc','k vector'));

  return dedup(vs);
}

// ─── Particle Decay Shower ────────────────────────────────────────────────────
function particleShower(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];
  const colors = ['#ef4444','#60a5fa','#22c55e','#fbbf24','#f472b6','#a78bfa','#34d399'];

  function branch(x: number, y: number, z: number, dx: number, dy: number, dz: number, depth: number, energy: number) {
    if (depth === 0 || energy < 0.1) return;
    const len = Math.round(energy * 8);
    for (let s = 0; s < len; s++) {
      vs.push({ x: x+dx*s, y: y+dy*s, z: z+dz*s, color: colors[depth%colors.length], label: `Track d=${depth}` });
    }
    const ex = x+dx*len, ey = y+dy*len, ez = z+dz*len;
    // Split into 2 daughters
    const spread = 0.5;
    branch(ex,ey,ez, dx+spread,  dy+spread, dz,        depth-1, energy*0.55);
    branch(ex,ey,ez, dx-spread,  dy-spread, dz+spread, depth-1, energy*0.45);
  }

  // Primary particle (top → down)
  branch(0, 20, 0, 0,-1,0, 5, 1.0);

  return dedup(vs);
}

// ─── Uncertainty Principle visualisation ──────────────────────────────────────
function uncertainty(): VoxelBlock[] {
  const vs: VoxelBlock[] = [];

  // Two Gaussians in phase space (x × p)
  // Well-localised state: narrow in x, broad in p
  for (let x = -5; x <= 5; x++) {
    const px = Math.round(12 * Math.exp(-(x*x)/2)); // large spread in p
    for (let p = -px; p <= px; p++)
      vs.push({ x, y: 0, z: p, color: '#60a5fa', label: `Well-localised: Δx small` });
  }
  // Momentum eigenstate: broad in x, narrow in p
  for (let x = -12; x <= 12; x++) {
    const px = Math.round(2 * Math.exp(-(x*x)/40));
    for (let p = -px; p <= px; p++)
      vs.push({ x, y: 6, z: p, color: '#f472b6', label: `Momentum eigenstate: Δp small` });
  }

  // Axes
  vs.push(...line(-14,0,0,14,0,0,'#ffffff','Position (x)'));
  vs.push(...line(-14,6,0,14,6,0,'#ffffff','Position (x)'));
  vs.push(...line(0,0,-13,0,0,13,'#fbbf24','Momentum (p)'));
  vs.push(...line(0,6,-13,0,6,13,'#fbbf24','Momentum (p)'));

  return dedup(vs);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
export function generateParticle(params: SceneParameters): VoxelBlock[] {
  switch (params.physicsType) {
    case 'bubbleChamber': return bubbleChamber();
    case 'proton':        return protonQuarks();
    case 'wavePacket':    return wavePacket();
    case 'photon':        return photon();
    case 'particleDecay': return particleShower();
    case 'uncertainty':   return uncertainty();
    default:              return bubbleChamber();
  }
}
