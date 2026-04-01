import type { VoxelBlock, SceneParameters } from '../types';

// ─── Tissue color palette (CPK-biological) ────────────────────────────────────
const T = {
  bone:     '#e2e8f0', marrow:   '#fde68a', cartilage:'#86efac',
  periost:  '#cbd5e1', muscle:   '#ef4444', cardiac:  '#991b1b',
  skin_e:   '#fcd34d', skin_d:   '#f87171', skin_h:   '#fef3c7',
  nerve:    '#fbbf24', soma:     '#ddd6fe', dendrite: '#a78bfa',
  axon:     '#22d3ee', myelin:   '#f8fafc', synapse:  '#f472b6',
  artery:   '#dc2626', vein:     '#3b82f6', capillary:'#f97316',
  oxy:      '#ef4444', deoxy:    '#60a5fa', valve:    '#fbbf24',
  bronchi:  '#94a3b8', alveoli:  '#fecaca', gas:      '#bae6fd',
  rbc:      '#dc2626', wbc:      '#f1f5f9', platelet: '#fde68a',
  sclera:   '#f8fafc', cornea:   '#bae6fd', iris:     '#1d4ed8',
  pupil:    '#0f172a', lens:     '#e0f2fe', retina:   '#a78bfa',
  myosin:   '#7f1d1d', actin:    '#fca5a5', hair:     '#374151',
  sweat:    '#a7f3d0', sebum:    '#fef9c3',
};

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function sphere(cx: number, cy: number, cz: number, r: number, color: string, label: string, hollow = false): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  for (let x = -r - 1; x <= r + 1; x++)
    for (let y = -r - 1; y <= r + 1; y++)
      for (let z = -r - 1; z <= r + 1; z++) {
        const d = Math.sqrt(x * x + y * y + z * z);
        if (hollow ? (d >= r - 1 && d <= r + 0.5) : d <= r + 0.3)
          v.push({ x: cx + x, y: cy + y, z: cz + z, color, label });
      }
  return v;
}

function ellipsoid(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, color: string, label: string, hollow = false): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  for (let x = -rx - 1; x <= rx + 1; x++)
    for (let y = -ry - 1; y <= ry + 1; y++)
      for (let z = -rz - 1; z <= rz + 1; z++) {
        const d = (x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2;
        const di = ((x / (rx - 1)) ** 2 + (y / (ry - 1)) ** 2 + (z / (rz - 1)) ** 2);
        if (hollow ? (d <= 1 && di >= 1) : d <= 1)
          v.push({ x: cx + x, y: cy + y, z: cz + z, color, label });
      }
  return v;
}

function box(cx: number, cy: number, cz: number, w: number, h: number, d: number, color: string, label: string): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++)
        v.push({ x: cx + x - Math.floor(w / 2), y: cy + y - Math.floor(h / 2), z: cz + z - Math.floor(d / 2), color, label });
  return v;
}

function line(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string, label: string, r = 0): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const cx = Math.round(x1 + (x2 - x1) * i / steps);
    const cy = Math.round(y1 + (y2 - y1) * i / steps);
    const cz = Math.round(z1 + (z2 - z1) * i / steps);
    if (r === 0) { v.push({ x: cx, y: cy, z: cz, color, label }); continue; }
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++)
        if (dx * dx + dz * dz <= r * r + 0.5)
          v.push({ x: cx + dx, y: cy, z: cz + dz, color, label });
  }
  return v;
}

function dedup(vs: VoxelBlock[]): VoxelBlock[] {
  const s = new Set<string>();
  return vs.filter(v => { const k = `${v.x},${v.y},${v.z}`; if (s.has(k)) return false; s.add(k); return true; });
}

// ─── Body Part: Full Skeleton ─────────────────────────────────────────────────
function skeleton(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Skull (hollow ellipsoid)
  v.push(...ellipsoid(0, 24, 0, 4, 5, 4, T.bone, 'Cranium', true));
  v.push(...box(0, 19, 1, 6, 2, 3, T.bone, 'Mandible'));
  v.push(...box(4, 22, 3, 2, 1, 1, T.bone, 'Zygomatic'));
  v.push(...box(-4, 22, 3, 2, 1, 1, T.bone, 'Zygomatic'));
  // Spine
  for (let y = 1; y <= 18; y++) {
    const w = y > 14 ? 2 : y > 6 ? 3 : 4;
    v.push(...box(0, y, 0, w, 1, 2, T.bone, y > 14 ? 'Cervical' : y > 6 ? 'Thoracic' : 'Lumbar'));
    v.push({ x: 0, y, z: -2, color: T.cartilage, label: 'IV Disc' });
  }
  v.push(...box(0, 0, 0, 5, 2, 3, T.bone, 'Sacrum'));
  // Sternum
  for (let y = 8; y <= 14; y++) v.push({ x: 0, y, z: 4, color: T.bone, label: 'Sternum' });
  // Ribs (12 pairs)
  for (let rb = 0; rb < 12; rb++) {
    const cy = 14 - rb; const rr = 4 + rb * 0.3;
    for (let s = 1; s <= 10; s++) {
      const a = (s / 11) * Math.PI;
      const rx = Math.round(Math.sin(a) * rr);
      const rz = Math.round((1 - Math.cos(a)) * rr * 0.5);
      const col = rb >= 10 ? T.cartilage : T.bone;
      v.push({ x: rx, y: cy, z: rz, color: col, label: rb < 7 ? 'True rib' : 'False rib' });
      v.push({ x: -rx, y: cy, z: rz, color: col, label: rb < 7 ? 'True rib' : 'False rib' });
    }
  }
  // Clavicles
  v.push(...line(1, 15, 1, 8, 15, 0, T.bone, 'Clavicle'));
  v.push(...line(-1, 15, 1, -8, 15, 0, T.bone, 'Clavicle'));
  // Scapulae
  v.push(...box(9, 12, -2, 3, 5, 1, T.bone, 'Scapula'));
  v.push(...box(-9, 12, -2, 3, 5, 1, T.bone, 'Scapula'));
  // Humerus
  v.push(...line(8, 14, 0, 11, 7, 1, T.bone, 'Humerus'));
  v.push(...line(-8, 14, 0, -11, 7, 1, T.bone, 'Humerus'));
  // Radius + Ulna
  v.push(...line(11, 7, 1, 13, 1, 1, T.bone, 'Radius'));
  v.push(...line(-11, 7, 1, -13, 1, 1, T.bone, 'Radius'));
  v.push(...line(11, 7, -1, 13, 1, -1, T.bone, 'Ulna'));
  v.push(...line(-11, 7, -1, -13, 1, -1, T.bone, 'Ulna'));
  // Hands (simplified)
  v.push(...box(13, -1, 0, 4, 3, 2, T.bone, 'Carpals/Hand'));
  v.push(...box(-13, -1, 0, 4, 3, 2, T.bone, 'Carpals/Hand'));
  // Pelvis
  v.push(...ellipsoid(0, 2, 0, 7, 3, 4, T.bone, 'Pelvis', true));
  v.push(...box(0, 0, 3, 4, 1, 2, T.cartilage, 'Pubic Symphysis'));
  // Femora
  v.push(...sphere(5, 3, 0, 2, T.bone, 'Femoral head'));
  v.push(...sphere(-5, 3, 0, 2, T.bone, 'Femoral head'));
  v.push(...line(5, 2, 0, 3, -11, 0, T.bone, 'Femur', 1));
  v.push(...line(-5, 2, 0, -3, -11, 0, T.bone, 'Femur', 1));
  // Patella
  v.push(...sphere(3, -12, 2, 1, T.cartilage, 'Patella'));
  v.push(...sphere(-3, -12, 2, 1, T.cartilage, 'Patella'));
  // Tibia + Fibula
  v.push(...line(3, -12, 0, 2, -23, 1, T.bone, 'Tibia'));
  v.push(...line(-3, -12, 0, -2, -23, 1, T.bone, 'Tibia'));
  v.push(...line(4, -13, -1, 3, -23, -1, T.bone, 'Fibula'));
  v.push(...line(-4, -13, -1, -3, -23, -1, T.bone, 'Fibula'));
  // Feet
  v.push(...box(2, -25, 2, 5, 2, 4, T.bone, 'Foot bones'));
  v.push(...box(-2, -25, 2, 5, 2, 4, T.bone, 'Foot bones'));
  return dedup(v);
}

// ─── Body Part: Heart ─────────────────────────────────────────────────────────
function heart(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Pericardium shell
  v.push(...ellipsoid(0, 0, 0, 7, 8, 5, T.periost, 'Pericardium', true));
  // Myocardium (heart wall)
  v.push(...ellipsoid(0, 0, 0, 6, 7, 4, T.cardiac, 'Myocardium', true));
  // Left ventricle (thick wall, oxygenated)
  for (let y = -6; y <= 2; y++) {
    const r = Math.max(1, Math.round(3 - y * 0.2));
    for (let x = -r; x <= 0; x++)
      for (let z = -r; z <= r; z++)
        if (x * x + z * z <= r * r + 0.5)
          v.push({ x, y, z, color: y > -2 ? '#b91c1c' : T.oxy, label: y > -2 ? 'L. Ventricle wall' : 'L. Ventricle blood' });
  }
  // Right ventricle (thinner wall, deoxygenated)
  for (let y = -4; y <= 3; y++) {
    const r = Math.max(1, Math.round(2 - y * 0.15));
    for (let x = 0; x <= r + 2; x++)
      for (let z = -r; z <= r; z++)
        if ((x - 2) * (x - 2) * 0.5 + z * z <= r * r + 0.5)
          v.push({ x: x + 2, y, z, color: y > 0 ? '#dc2626' : T.deoxy, label: y > 0 ? 'R. Ventricle wall' : 'R. Ventricle blood' });
  }
  // Atria (top)
  v.push(...ellipsoid(-2, 5, 0, 3, 2, 3, '#b91c1c', 'L. Atrium'));
  v.push(...ellipsoid(3, 5, 0, 3, 2, 3, '#dc2626', 'R. Atrium'));
  // Valves
  v.push(...box(-1, 2, 0, 2, 1, 3, T.valve, 'Mitral valve'));
  v.push(...box(3, 2, 0, 2, 1, 3, T.valve, 'Tricuspid valve'));
  // Aortic arch (curves up and over)
  for (let i = 0; i < 8; i++) {
    const a = i / 7 * Math.PI * 0.8;
    v.push({ x: Math.round(-3 + Math.sin(a) * 4), y: Math.round(7 + Math.cos(a) * i * 0.5), z: 0, color: T.artery, label: 'Aorta' });
  }
  // Pulmonary artery
  v.push(...line(4, 6, 0, 6, 10, 0, T.vein, 'Pulmonary artery'));
  v.push(...line(6, 10, 0, 8, 8, -2, T.vein, 'Pulmonary artery'));
  // Coronary arteries (surface)
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI;
    v.push({ x: Math.round(Math.cos(a) * 6), y: -1, z: Math.round(Math.sin(a) * 4), color: T.capillary, label: 'Coronary artery' });
  }
  return dedup(v);
}

// ─── Body Part: Neuron ────────────────────────────────────────────────────────
function neuron(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Soma (cell body)
  v.push(...sphere(0, 0, 0, 4, T.soma, 'Soma'));
  // Nucleolus
  v.push(...sphere(0, 0, 0, 2, '#7c3aed', 'Nucleus'));
  v.push({ x: 0, y: 0, z: 0, color: '#c4b5fd', label: 'Nucleolus' });
  // Axon (extends in +x direction)
  v.push(...line(4, 0, 0, 24, 0, 0, T.axon, 'Axon'));
  // Myelin sheath segments (every 4 units, 3 wide)
  for (let s = 0; s < 5; s++) {
    const sx = 6 + s * 4;
    for (let dx = 0; dx < 3; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
          if (dy * dy + dz * dz <= 1)
            v.push({ x: sx + dx, y: dy, z: dz, color: T.myelin, label: 'Myelin sheath' });
  }
  // Nodes of Ranvier (gaps — dark dot)
  [9, 13, 17, 21].forEach(nx => v.push({ x: nx, y: 0, z: 0, color: '#1e293b', label: 'Node of Ranvier' }));
  // Axon hillock
  v.push(...box(5, 0, 0, 2, 2, 2, '#06b6d4', 'Axon hillock'));
  // Synaptic terminal
  v.push(...sphere(26, 0, 0, 2, T.synapse, 'Synaptic terminal'));
  // Synaptic vesicles
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    v.push({ x: 26 + Math.round(Math.cos(a)), y: Math.round(Math.sin(a)), z: 0, color: '#fda4af', label: 'Vesicle' });
  }
  // Dendrites (branching from soma)
  const dendriticDirs = [[-1,1,0],[-2,0,1],[-1,-1,0],[0,1,2],[0,-1,2],[-1,0,-2]];
  dendriticDirs.forEach(([dx, dy, dz]) => {
    for (let s = 1; s <= 6; s++) {
      v.push({ x: dx*s, y: dy*s, z: dz*s, color: T.dendrite, label: 'Dendrite' });
      // Dendritic spines
      if (s > 3) v.push({ x: dx*s+1, y: dy*s, z: dz*s, color: '#c4b5fd', label: 'Dendritic spine' });
    }
  });
  return dedup(v);
}

// ─── Body Part: Skin Cross-Section ───────────────────────────────────────────
function skinCrossSection(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  const W = 20; // width
  // Layer heights:  y=-12 to -9: hypodermis, y=-9 to -2: dermis, y=-2 to 0: epidermis, y=0 to 1: stratum corneum
  for (let x = -W/2; x <= W/2; x++) {
    for (let z = -3; z <= 3; z++) {
      // Stratum corneum (very outer)
      v.push({ x, y: 1, z, color: '#d97706', label: 'Stratum corneum' });
      // Epidermis (4 sub-layers)
      for (let y = -2; y <= 0; y++) v.push({ x, y, z, color: T.skin_e, label: 'Epidermis' });
      // Dermis (papillary + reticular)
      for (let y = -8; y <= -3; y++) {
        const col = y > -5 ? '#fca5a5' : T.skin_d;
        v.push({ x, y, z, color: col, label: y > -5 ? 'Papillary dermis' : 'Reticular dermis' });
      }
      // Hypodermis / fat lobules
      for (let y = -12; y <= -9; y++) v.push({ x, y, z, color: '#fef3c7', label: 'Hypodermis' });
    }
  }
  // Hair follicles (3 of them)
  [-6, 0, 6].forEach(hx => {
    for (let y = -10; y <= 2; y++) v.push({ x: hx, y, z: 0, color: T.hair, label: 'Hair follicle' });
    // Hair shaft above surface
    for (let y = 2; y <= 6; y++) v.push({ x: hx, y, z: 0, color: '#6b7280', label: 'Hair shaft' });
    // Sebaceous gland
    v.push(...sphere(hx + 2, -4, 0, 2, T.sebum, 'Sebaceous gland'));
    // Arrector pili muscle
    v.push(...line(hx, -8, 0, hx - 3, -2, 0, T.muscle, 'Arrector pili'));
  });
  // Sweat gland (coiled) at x=4
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 4;
    v.push({ x: Math.round(4 + Math.cos(a)), y: Math.round(-10 + i * 0.3), z: Math.round(Math.sin(a)), color: T.sweat, label: 'Sweat gland' });
  }
  // Blood vessels in dermis
  v.push(...line(-8, -6, 0, 8, -6, 0, T.artery, 'Dermal artery'));
  v.push(...line(-8, -7, 0, 8, -7, 0, T.vein, 'Dermal vein'));
  // Capillary loops in papillary dermis
  [-4, 0, 4].forEach(bx => {
    v.push(...line(bx, -4, 0, bx, -2, 0, T.capillary, 'Capillary loop'));
  });
  // Nerve ending (Meissner's corpuscle)
  v.push(...sphere(-3, -2, 0, 1, T.nerve, "Meissner's corpuscle"));
  v.push(...line(-3, -7, 0, -3, -3, 0, T.nerve, 'Sensory nerve'));
  return dedup(v);
}

// ─── Body Part: Lung Alveoli ───────────────────────────────────────────────────
function lungAlveoli(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Main bronchus (thick)
  v.push(...line(0, -10, 0, 0, 0, 0, T.bronchi, 'Main bronchus', 2));
  // Secondary bronchi
  const br2 = [[4,4,0],[-4,4,0],[0,4,4],[0,4,-4]];
  br2.forEach(([x,y,z]) => {
    v.push(...line(0,0,0,x,y,z, T.bronchi, 'Secondary bronchus', 1));
    // Tertiary bronchioles
    const terDirs = [[x+2,y+4,z],[x-2,y+4,z],[x,y+4,z+2],[x,y+4,z-2]];
    terDirs.slice(0,2).forEach(([tx,ty,tz]) => {
      v.push(...line(x,y,z,tx,ty,tz, '#b0bec5', 'Bronchiole'));
      // Alveolar sac cluster at each terminal
      for (let i = 0; i < 5; i++) {
        const a = (i/5)*Math.PI*2;
        const ax = Math.round(tx + Math.cos(a)*2);
        const ay = ty + 2;
        const az = Math.round(tz + Math.sin(a)*2);
        v.push(...sphere(ax, ay, az, 2, T.alveoli, 'Alveolus', true));
        v.push(...sphere(ax, ay, az, 1, T.gas, 'Air space'));
        // Capillary network around alveolus
        v.push(...sphere(ax, ay, az, 2, T.capillary, 'Capillary', true));
      }
    });
  });
  return dedup(v);
}

// ─── Body Part: Blood Cells ───────────────────────────────────────────────────
function bloodCells(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Plasma background
  for (let x = -10; x <= 10; x++)
    for (let z = -10; z <= 10; z++)
      v.push({ x, y: -1, z, color: '#fffbeb', label: 'Plasma' });
  // Red blood cells (biconcave discs) — 8 of them
  const rbcPos = [[0,0,0],[5,1,3],[-5,0,2],[3,2,-4],[-3,1,-3],[7,0,-2],[-7,2,1],[0,1,6]];
  rbcPos.forEach(([cx,cy,cz]) => {
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++) {
        const r2 = x*x + z*z;
        if (r2 <= 4) {
          // biconcave: thicker at rim, depressed in center
          const h = r2 > 2 ? 1 : 0;
          for (let y = h; y >= -h; y--)
            v.push({ x: cx+x, y: cy+y, z: cz+z, color: T.rbc, label: 'Erythrocyte' });
        }
      }
  });
  // White blood cells (3) — larger, irregular
  [[-6,2,-6],[4,2,-5],[-2,2,5]].forEach(([cx,cy,cz]) => {
    v.push(...sphere(cx,cy,cz,3,T.wbc,'Leukocyte'));
    v.push(...sphere(cx+1,cy,cz,2,'#ddd6fe','Nucleus (WBC)'));
  });
  // Platelets (6) — tiny irregular
  const pltPos = [[2,2,2],[-3,2,4],[6,2,0],[-1,2,-2],[4,2,5],[-5,2,-1]];
  pltPos.forEach(([cx,cy,cz]) => {
    v.push({ x: cx, y: cy, z: cz, color: T.platelet, label: 'Thrombocyte' });
    v.push({ x: cx+1, y: cy, z: cz, color: T.platelet, label: 'Thrombocyte' });
  });
  return dedup(v);
}

// ─── Body Part: Eye (cross-section) ──────────────────────────────────────────
function eye(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Sclera (outer white shell)
  v.push(...ellipsoid(0,0,0,8,7,7,T.sclera,'Sclera',true));
  // Choroid (vascular layer inside sclera)
  v.push(...ellipsoid(0,0,0,7,6,6,'#7f1d1d','Choroid',true));
  // Retina (innermost sensory layer)
  v.push(...ellipsoid(0,0,0,6,5,5,T.retina,'Retina',true));
  // Vitreous humor (inside)
  v.push(...ellipsoid(0,0,0,5,4,4,T.lens,'Vitreous humor'));
  // Lens (biconvex)
  v.push(...ellipsoid(-2,0,0,2,2,2,'#bfdbfe','Crystalline lens'));
  // Iris (coloured annulus)
  for (let y = -2; y <= 2; y++)
    for (let z = -4; z <= 4; z++) {
      const d = Math.sqrt(y*y + z*z);
      if (d >= 1.5 && d <= 3.5) v.push({ x: -5, y, z, color: T.iris, label: 'Iris' });
    }
  // Pupil (dark opening)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      v.push({ x: -5, y, z, color: T.pupil, label: 'Pupil' });
  // Cornea (clear curved front)
  for (let y = -3; y <= 3; y++)
    for (let z = -3; z <= 3; z++) {
      if (y*y + z*z <= 9) v.push({ x: -6, y, z, color: '#e0f2fe', label: 'Cornea' });
    }
  // Optic nerve stalk
  v.push(...line(7,0,0,13,0,0,T.nerve,'Optic nerve',1));
  // Fovea (centre of retina — highest acuity)
  v.push({ x: 4, y: 0, z: 0, color: '#fbbf24', label: 'Fovea centralis' });
  // Blood vessels on retina
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*Math.PI*2;
    v.push(...line(4,0,0,Math.round(4+Math.cos(a)*4),Math.round(Math.sin(a)*4),Math.round(Math.sin(a+0.5)*3),T.capillary,'Retinal vessel'));
  }
  return dedup(v);
}

// ─── Body Part: Skull (detailed) ─────────────────────────────────────────────
function skull(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Neurocranium (hollow)
  v.push(...ellipsoid(0,3,0,7,8,7,T.bone,'Neurocranium',true));
  // Inner surface (cancellous bone)
  v.push(...ellipsoid(0,3,0,5,6,5,'#fef3c7','Diploe',true));
  // Frontal bone
  v.push(...box(0,8,5,8,3,2,T.bone,'Frontal bone'));
  // Orbital ridges
  v.push(...box(4,5,5,2,1,2,T.bone,'Orbital ridge'));
  v.push(...box(-4,5,5,2,1,2,T.bone,'Orbital ridge'));
  // Orbital cavities
  v.push(...ellipsoid(4,4,4,3,2,2,'#1e293b','Orbit R'));
  v.push(...ellipsoid(-4,4,4,3,2,2,'#1e293b','Orbit L'));
  // Nasal bones
  v.push(...box(0,3,6,3,2,2,T.bone,'Nasal bone'));
  v.push({ x: 0, y: 1, z: 7, color: '#94a3b8', label: 'Anterior nasal spine' });
  // Zygomatic arches (cheekbones)
  v.push(...line(5,4,4,8,2,2,T.bone,'Zygomatic arch'));
  v.push(...line(-5,4,4,-8,2,2,T.bone,'Zygomatic arch'));
  // Temporal bones
  v.push(...box(8,3,0,2,5,5,T.bone,'Temporal bone R'));
  v.push(...box(-8,3,0,2,5,5,T.bone,'Temporal bone L'));
  // Mastoid process
  v.push(...sphere(7,-2,1,2,T.bone,'Mastoid process'));
  v.push(...sphere(-7,-2,1,2,T.bone,'Mastoid process'));
  // Mandible (jaw)
  v.push(...box(0,-3,4,10,3,4,T.bone,'Mandible body'));
  // Mandibular rami
  v.push(...line(5,-3,2,6,2,0,T.bone,'Mandibular ramus'));
  v.push(...line(-5,-3,2,-6,2,0,T.bone,'Mandibular ramus'));
  // Condylar process (jaw joint)
  v.push(...sphere(6,3,0,2,T.cartilage,'TMJ condyle'));
  v.push(...sphere(-6,3,0,2,T.cartilage,'TMJ condyle'));
  // Teeth row (simplified)
  for (let t = -4; t <= 4; t++) {
    if (t === 0) continue;
    v.push({ x: t, y: -3, z: 5, color: '#f8fafc', label: 'Upper tooth' });
    v.push({ x: t, y: -4, z: 5, color: '#f8fafc', label: 'Lower tooth' });
  }
  // Foramen magnum (opening at base)
  v.push(...ellipsoid(0,-5,0,3,1,2,'#0f172a','Foramen magnum'));
  return dedup(v);
}

// ─── Body Part: Muscle Fiber Cross-Section ───────────────────────────────────
function muscleFiber(): VoxelBlock[] {
  const v: VoxelBlock[] = [];
  // Epimysium (outer sheath)
  v.push(...ellipsoid(0,0,0,12,8,12,T.periost,'Epimysium',true));
  // 3 fascicles (bundles)
  const fasciclePos = [[0,0,0],[5,0,5],[-5,0,5]];
  fasciclePos.forEach(([fx,fy,fz]) => {
    // Perimysium around fascicle
    v.push(...ellipsoid(fx,fy,fz,4,7,4,'#fca5a5','Perimysium',true));
    // Individual muscle fibers (myocytes) within fascicle
    const fiberPos = [[0,0,0],[2,0,2],[-2,0,2],[0,0,-2],[2,0,-2]];
    fiberPos.forEach(([mx,my,mz]) => {
      v.push(...ellipsoid(fx+mx,fy+my,fz+mz,1,6,1,'#fecaca','Endomysium',true));
      // Sarcomere bands along y axis
      for (let y = -5; y <= 5; y++) {
        const col = y % 2 === 0 ? T.myosin : T.actin;
        const label = y % 2 === 0 ? 'A-band (myosin)' : 'I-band (actin)';
        v.push({ x: fx+mx, y: y, z: fz+mz, color: col, label });
      }
      // Nucleus (positioned under sarcolemma)
      v.push(...sphere(fx+mx,fy+my-3,fz+mz,1,'#7c3aed','Myonucleus'));
    });
  });
  // Capillary between fascicles
  v.push(...line(3,-7,0,3,7,0,T.capillary,'Capillary',1));
  v.push(...line(-3,-7,3,-3,7,3,T.capillary,'Capillary',1));
  return dedup(v);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
export function generateAnatomy(params: SceneParameters): VoxelBlock[] {
  switch (params.bodyPart) {
    case 'skeleton':   return skeleton();
    case 'heart':      return heart();
    case 'neuron':     return neuron();
    case 'skin':       return skinCrossSection();
    case 'lung':       return lungAlveoli();
    case 'bloodCells': return bloodCells();
    case 'eye':        return eye();
    case 'skull':      return skull();
    case 'muscle':     return muscleFiber();
    default:           return skeleton();
  }
}
