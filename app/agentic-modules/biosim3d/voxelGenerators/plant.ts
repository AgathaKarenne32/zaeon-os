import type { VoxelBlock, SceneParameters } from '../types';

// ─── Recursive branching tree ────────────────────────────────────────────────
function growBranch(
  voxels: VoxelBlock[],
  x: number, y: number, z: number,
  length: number,
  depth: number,
  color: string,
  spread: number
) {
  if (depth === 0 || length < 2) return;

  for (let i = 0; i < length; i++) {
    voxels.push({ x, y: y + i, z, color, label: depth > 1 ? 'Trunk' : 'Branch' });
  }

  const nextY = y + length;
  const nextLen = Math.floor(length * 0.65);

  // Four branching directions (limited by depth)
  const dirs = [
    [spread, 0], [-spread, 0], [0, spread], [0, -spread],
  ];

  dirs.forEach(([dx, dz]) => {
    growBranch(voxels, x + dx, nextY, z + dz, nextLen, depth - 1, color, spread - 1);
  });
}

/** Add leaves as flat pads at branch tips */
function addLeafPad(
  voxels: VoxelBlock[],
  cx: number, cy: number, cz: number,
  color: string
) {
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) {
        voxels.push({ x: cx + dx, y: cy, z: cz + dz, color, label: 'Leaf' });
        if (Math.abs(dx) + Math.abs(dz) <= 1) {
          voxels.push({ x: cx + dx, y: cy + 1, z: cz + dz, color, label: 'Leaf' });
        }
      }
    }
  }
}

export function generatePlant(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const plantType  = params.plantType   ?? 'tree';
  const branchDepth = params.branchDepth ?? 3;
  const leafColor  = params.leafColor   ?? '#22c55e';
  const trunkColor = '#78350f';
  const rootColor  = '#a16207';

  if (plantType === 'tree' || plantType === 'flower') {
    // Trunk
    for (let y = -5; y < 0; y++) {
      voxels.push({ x: 0, y, z: 0, color: rootColor, label: 'Root' });
      if (y === -5) {
        [-2, -1, 1, 2].forEach(dx => {
          voxels.push({ x: dx, y, z: 0, color: rootColor, label: 'Root' });
          voxels.push({ x: 0, y, z: dx, color: rootColor, label: 'Root' });
        });
      }
    }

    growBranch(voxels, 0, 0, 0, 8, branchDepth, trunkColor, 3);

    // Leaf crowns at branch tips (level depends on depth)
    const crownY = 8 + Math.floor(8 * 0.65) * (branchDepth > 1 ? 1 : 0);
    const crownPositions = branchDepth >= 3
      ? [[3, crownY, 0], [-3, crownY, 0], [0, crownY, 3], [0, crownY, -3], [0, crownY + 4, 0]]
      : [[0, crownY, 0]];

    crownPositions.forEach(([pcx, pcy, pcz]) => {
      addLeafPad(voxels, pcx, pcy, pcz, leafColor);
    });

    if (plantType === 'flower') {
      // Add flower petals on top
      const petalColors = ['#f9a8d4', '#fde68a', '#a5f3fc', '#d8b4fe'];
      [[0, 3], [3, 0], [0, -3], [-3, 0]].forEach(([dx, dz], i) => {
        for (let py = 0; py < 2; py++) {
          voxels.push({
            x: crownY > 10 ? 0 + dx : dx,
            y: crownY + 6 + py,
            z: dz,
            color: petalColors[i],
            label: 'Petal',
          });
        }
      });
      voxels.push({ x: 0, y: crownY + 6, z: 0, color: '#fbbf24', label: 'Stamen' });
    }
  }

  if (plantType === 'fern') {
    // Fern frond — bilateral branching
    for (let y = 0; y < 14; y++) {
      voxels.push({ x: 0, y, z: 0, color: trunkColor, label: 'Rachis' });
      const pinnuleLen = Math.max(1, 4 - Math.floor(y / 3));
      if (y % 2 === 0) {
        for (let dx = 1; dx <= pinnuleLen; dx++) {
          voxels.push({ x:  dx, y: y + 1 + Math.floor(dx * 0.3), z: 0, color: leafColor, label: 'Pinnule' });
          voxels.push({ x: -dx, y: y + 1 + Math.floor(dx * 0.3), z: 0, color: leafColor, label: 'Pinnule' });
        }
      }
    }
  }

  if (plantType === 'seed') {
    // Ellipsoid seed
    for (let x = -3; x <= 3; x++) {
      for (let y = -4; y <= 4; y++) {
        for (let z = -2; z <= 2; z++) {
          if ((x * x) / 9 + (y * y) / 16 + (z * z) / 4 <= 1) {
            voxels.push({ x, y, z, color: '#854d0e', label: 'Seed coat' });
          }
        }
      }
    }
    voxels.push({ x: 0, y: 0, z: 0, color: '#fef9c3', label: 'Embryo' });
    voxels.push({ x: 0, y: 1, z: 0, color: '#fef9c3', label: 'Embryo' });
  }

  return voxels;
}

export function generateFungus(params: SceneParameters): VoxelBlock[] {
  const voxels: VoxelBlock[] = [];
  const plantType = params.plantType ?? 'mushroom';

  if (plantType === 'mushroom') {
    // Stipe (stem)
    const stipeColor = '#e7d5b3';
    for (let y = -6; y < 0; y++) {
      voxels.push({ x: 0, y, z: 0, color: stipeColor, label: 'Stipe' });
    }
    // Volva at base
    for (let y = -7; y <= -6; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          voxels.push({ x: dx, y, z: dz, color: '#d6b899', label: 'Volva' });
        }
      }
    }

    // Pileus (cap) — hemisphere with downward skirt
    const capColor = '#ef4444'; // classic red
    const spotColor = '#ffffff';
    for (let x = -5; x <= 5; x++) {
      for (let y = 0; y <= 4; y++) {
        for (let z = -5; z <= 5; z++) {
          const d = Math.sqrt(x * x + (y - 3) * (y - 3) * 0.5 + z * z);
          if (d <= 5 && y >= 0) {
            voxels.push({ x, y, z, color: capColor, label: 'Pileus' });
          }
        }
      }
    }

    // White spots on cap
    [[0, 4, 0], [3, 3, 2], [-3, 3, 2], [2, 3, -3], [-2, 3, -3]].forEach(([x, y, z]) => {
      voxels.push({ x, y, z, color: spotColor, label: 'Universal veil remains' });
    });

    // Mycelium threads at base
    const myceliumColor = '#fef3c7';
    [[4, -7, 0], [-4, -7, 0], [0, -7, 4], [0, -7, -4], [3, -7, 3]].forEach(([x, y, z]) => {
      for (let i = 0; i < 4; i++) {
        voxels.push({ x: x + (Math.random() > 0.5 ? i : -i), y, z, color: myceliumColor, label: 'Mycelium' });
      }
    });
  }

  if (plantType === 'mycelium') {
    // 3D branching network
    const myceliumColor = '#fef3c7';
    function growMycelium(x: number, y: number, z: number, depth: number) {
      if (depth === 0) return;
      voxels.push({ x, y, z, color: myceliumColor, label: 'Hypha' });
      const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      dirs.forEach(([dx, dy, dz]) => {
        if (Math.random() > 0.55) {
          growMycelium(x + dx * 2, y + dy, z + dz * 2, depth - 1);
        }
      });
    }
    growMycelium(0, 0, 0, 6);
  }

  return voxels;
}
