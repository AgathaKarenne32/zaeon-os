import type { VoxelBlock, SceneParameters } from '../types';

const BONE  = '#f1f5f9';
const FLESH = '#fda4af';
const DARK  = '#334155';

function box(
  cx: number, cy: number, cz: number,
  w: number, h: number, d: number,
  color: string,
  label: string
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

function line(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  color: string, label: string
): VoxelBlock[] {
  const blocks: VoxelBlock[] = [];
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az), 1);
  for (let s = 0; s <= steps; s++) {
    blocks.push({
      x: Math.round(ax + ((bx - ax) * s) / steps),
      y: Math.round(ay + ((by - ay) * s) / steps),
      z: Math.round(az + ((bz - az) * s) / steps),
      color, label,
    });
  }
  return blocks;
}

export function generateAnimal(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const animalType   = params.animalType   ?? 'horse';
  const showSkeleton = params.showSkeleton  ?? true;

  const boneColor = showSkeleton ? BONE : FLESH;

  if (animalType === 'horse') {
    // ── Body (torso) ──
    voxels.push(...box(0, 0, 0, 10, 5, 4, boneColor, 'Torso / Thoracic vertebrae'));
    // Ribcage lines (skeleton mode)
    if (showSkeleton) {
      [-4, -2, 0, 2, 4].forEach(rib => {
        voxels.push(...line(rib, -2, -2, rib, -2, 2, '#cbd5e1', 'Rib'));
        voxels.push(...line(rib, 2, -2, rib, 2, 2, '#cbd5e1', 'Rib'));
      });
    }

    // ── Neck ──
    voxels.push(...box(6, 3, 0, 3, 5, 3, boneColor, 'Cervical vertebrae'));

    // ── Head ──
    voxels.push(...box(9, 5, 0, 5, 4, 3, boneColor, 'Skull'));
    // Jaw
    voxels.push(...box(11, 3, 0, 3, 1, 2, boneColor, 'Mandible'));
    // Eye sockets
    voxels.push({ x: 10, y: 6, z: 1, color: DARK, label: 'Eye socket' });
    voxels.push({ x: 10, y: 6, z: -1, color: DARK, label: 'Eye socket' });

    // ── Legs (4) ──
    [[-4, -2], [-2, -2], [2, -2], [4, -2]].forEach(([x, dz]) => {
      // Upper leg (femur/humerus)
      voxels.push(...line(x, -2, dz, x, -7, dz, boneColor, 'Upper leg'));
      // Lower leg (tibia/radius)
      voxels.push(...line(x, -7, dz, x + 1, -12, dz, boneColor, 'Lower leg'));
      // Hoof
      voxels.push(...box(x + 1, -13, dz, 2, 1, 2, '#374151', 'Hoof'));
    });

    // ── Spine line ──
    voxels.push(...line(-5, 2, 0, 5, 2, 0, '#e2e8f0', 'Spine'));

    // ── Tail ──
    voxels.push(...line(-5, 0, 0, -7, -4, 0, boneColor, 'Coccyx / Tail'));
    voxels.push(...line(-7, -4, 0, -10, -6, 0, '#94a3b8', 'Tail hair'));
    voxels.push(...line(-7, -4, 0, -10, -7, 1, '#94a3b8', 'Tail hair'));

  } else if (animalType === 'dog') {
    // ── Torso ──
    voxels.push(...box(0, 0, 0, 8, 4, 3, boneColor, 'Torso'));
    // ── Head ──
    voxels.push(...box(5, 2, 0, 4, 4, 3, boneColor, 'Skull'));
    // Snout
    voxels.push(...box(8, 0, 0, 4, 2, 2, boneColor, 'Muzzle'));
    voxels.push({ x: 9, y: 3, z: 1, color: DARK, label: 'Eye' });
    voxels.push({ x: 9, y: 3, z: -1, color: DARK, label: 'Eye' });
    // Ears (floppy)
    voxels.push(...box(5, 4, 2, 1, 3, 1, '#6b7280', 'Ear'));
    voxels.push(...box(5, 4, -2, 1, 3, 1, '#6b7280', 'Ear'));
    // ── Legs ──
    [[-3, -1], [-2, -1], [2, -1], [3, -1]].forEach(([x, dz]) => {
      voxels.push(...line(x, -2, dz, x, -7, dz, boneColor, 'Leg'));
      voxels.push(...box(x, -7, dz, 2, 1, 2, '#374151', 'Paw'));
    });
    // ── Tail ──
    voxels.push(...line(-4, 1, 0, -6, 4, 0, boneColor, 'Tail'));
    voxels.push(...line(-6, 4, 0, -7, 6, 1, boneColor, 'Tail tip'));

  } else if (animalType === 'human') {
    // ── Skull ──
    voxels.push(...box(0, 14, 0, 4, 4, 4, boneColor, 'Skull'));
    // ── Jaw ──
    voxels.push(...box(0, 12, 0, 3, 1, 3, boneColor, 'Mandible'));
    // ── Spine ──
    voxels.push(...line(0, 0, 0, 0, 11, 0, boneColor, 'Vertebral column'));
    // ── Ribcage ──
    for (let i = 0; i < 6; i++) {
      const y = 5 + i;
      const spread = 3 + (i < 3 ? i : 5 - i);
      voxels.push(...line(-spread, y, 0, 0, y, 0, '#cbd5e1', 'Rib'));
      voxels.push(...line(spread, y, 0, 0, y, 0, '#cbd5e1', 'Rib'));
    }
    // ── Shoulders ──
    voxels.push(...box(-5, 10, 0, 2, 1, 1, boneColor, 'Clavicle'));
    voxels.push(...box(5, 10, 0, 2, 1, 1, boneColor, 'Clavicle'));
    // ── Arms ──
    voxels.push(...line(-5, 10, 0, -7, 5, 0, boneColor, 'Humerus / Radius'));
    voxels.push(...line(5, 10, 0, 7, 5, 0, boneColor, 'Humerus / Radius'));
    voxels.push(...line(-7, 5, 0, -8, 1, 0, boneColor, 'Ulna'));
    voxels.push(...line(7, 5, 0, 8, 1, 0, boneColor, 'Ulna'));
    // ── Pelvis ──
    voxels.push(...box(0, 1, 0, 5, 2, 3, boneColor, 'Pelvis'));
    // ── Legs ──
    voxels.push(...line(-2, 1, 0, -2, -8, 0, boneColor, 'Femur / Tibia'));
    voxels.push(...line(2, 1, 0, 2, -8, 0, boneColor, 'Femur / Tibia'));
    // Feet
    voxels.push(...box(-2, -9, 1, 2, 1, 3, boneColor, 'Foot'));
    voxels.push(...box(2, -9, 1, 2, 1, 3, boneColor, 'Foot'));

  } else if (animalType === 'fish') {
    // Body
    for (let x = -6; x <= 4; x++) {
      const r = Math.round(3 * Math.exp(-(x * x) / 20));
      for (let y = -r; y <= r; y++) {
        for (let z = -r; z <= r; z++) {
          if (y * y + z * z <= r * r + 1) {
            voxels.push({ x, y, z, color: '#7dd3fc', label: 'Body' });
          }
        }
      }
    }
    // Tail fin
    [[5, 0, 0], [7, 2, 0], [7, -2, 0], [6, 1, 0], [6, -1, 0]].forEach(([x, y, z]) => {
      voxels.push({ x, y, z, color: '#38bdf8', label: 'Caudal fin' });
    });
    // Dorsal fin
    [[0, 4, 0], [1, 5, 0], [2, 5, 0], [3, 4, 0]].forEach(([x, y, z]) => {
      voxels.push({ x, y, z, color: '#0284c7', label: 'Dorsal fin' });
    });
    // Eye
    voxels.push({ x: -5, y: 1, z: 2, color: DARK, label: 'Eye' });
  }

  return voxels;
}
