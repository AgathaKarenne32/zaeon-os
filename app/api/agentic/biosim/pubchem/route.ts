/**
 * POST /api/agentic/biosim/pubchem
 *
 * Fetches a real 3D molecular structure from PubChem and converts it to
 * VoxelBlock[] ready for the BioSim3D canvas.
 */

import { NextResponse } from 'next/server';

// POST routes já são dinâmicas no App Router, não é estritamente necessário forçar, 
// mas é seguro deixar se não usarmos revalidate interno de forma conflitante.
export const dynamic = 'force-dynamic';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  color: string;
  label: string;
}

interface PubChemRecord {
  PC_Compounds: Array<{
    atoms: { element: number[] };
    coords: Array<{
      conformers: Array<{ x: number[]; y: number[]; z: number[] }>;
    }>;
    charge?: number;
    id?: { id?: { cid?: number } };
  }>;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CPK: Record<string, string> = {
  H: '#ffffff', C: '#404040', N: '#3b82f6', O: '#ef4444',
  F: '#22c55e', Cl: '#22c55e', Br: '#7f1d1d', I: '#5b21b6',
  S: '#eab308', P: '#f97316', Fe: '#b45309', Ca: '#99f6e4',
  Mg: '#34d399', Na: '#7c3aed', K: '#a78bfa', Zn: '#6ee7b7',
  Cu: '#f59e0b', Co: '#60a5fa', Mn: '#f472b6', Se: '#fbbf24',
  Si: '#94a3b8', B: '#fde68a', Li: '#bfdbfe', Al: '#cbd5e1',
};
const DEFAULT_COLOR = '#a78bfa';

const ATOMIC_NUMBER_TO_SYMBOL: Record<number, string> = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn', 34: 'Se',
  35: 'Br', 53: 'I', 56: 'Ba', 79: 'Au', 80: 'Hg', 82: 'Pb',
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
function elementSymbol(atomicNum: number): string {
  return ATOMIC_NUMBER_TO_SYMBOL[atomicNum] ?? 'X';
}

function dedup(blocks: VoxelBlock[]) {
  const map = new Map<string, VoxelBlock>();
  blocks.forEach(b => { map.set(`${b.x},${b.y},${b.z}`, b); });
  return [...map.values()];
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Compound name required' }, { status: 400 });
    }

    const compound = encodeURIComponent(name.trim());

    // 1. Resolve name → CID (Removido revalidate para evitar conflito com force-dynamic)
    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${compound}/cids/JSON`,
      { cache: 'no-store' }
    );

    if (!cidRes.ok) {
      return NextResponse.json({ error: `Compound "${name}" not found in PubChem` }, { status: 404 });
    }

    const cidJson = await cidRes.json();
    const cid: number = cidJson.IdentifierList?.CID?.[0];

    if (!cid) {
      return NextResponse.json({ error: 'Could not resolve CID' }, { status: 404 });
    }

    // 2. Fetch 3D conformer
    const mol3dRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/JSON?record_type=3d`,
      { cache: 'no-store' }
    );

    if (!mol3dRes.ok) {
      return NextResponse.json({
        error: `No 3D conformer available for "${name}" (CID ${cid}). Try a different compound.`,
        cid,
      }, { status: 422 });
    }

    const mol3d: PubChemRecord = await mol3dRes.json();
    const compound_data = mol3d.PC_Compounds?.[0];
    if (!compound_data) return NextResponse.json({ error: 'Invalid PubChem response format' }, { status: 500 });

    const conformer = compound_data.coords?.[0]?.conformers?.[0];
    const elements = compound_data.atoms?.element ?? [];

    if (!conformer || !elements.length) {
      return NextResponse.json({ error: 'No 3D coordinate data found' }, { status: 422 });
    }

    const { x: xs, y: ys, z: zs } = conformer;
    const n = Math.min(xs.length, ys.length, zs.length, elements.length);

    if (n === 0) {
      return NextResponse.json({ error: 'Empty coordinate arrays' }, { status: 422 });
    }

    // 3. Centre
    const cx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const cy = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const cz = zs.slice(0, n).reduce((a, b) => a + b, 0) / n;

    // 4. Scale to fit in ±11 voxels
    const maxDist = Math.max(
      ...xs.slice(0, n).map((v, i) => Math.sqrt((v - cx) ** 2 + (ys[i] - cy) ** 2 + (zs[i] - cz) ** 2))
    );
    const scale = maxDist > 0 ? 10 / maxDist : 2;

    // 5. Convert atoms → voxel blocks (Array FORTEMENTE TIPADO)
    const blocks: VoxelBlock[] = [];

    for (let i = 0; i < n; i++) {
      const sym = elementSymbol(elements[i]);
      const color = CPK[sym] ?? DEFAULT_COLOR;
      const vx = Math.round((xs[i] - cx) * scale);
      const vy = Math.round((ys[i] - cy) * scale);
      const vz = Math.round((zs[i] - cz) * scale);

      // Nucleus block
      blocks.push({ x: vx, y: vy, z: vz, color, label: sym });

      // Larger atoms get one extra ring block for visual presence
      if (['O', 'N', 'S', 'P', 'Fe', 'Cl', 'Br'].includes(sym)) {
        [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(([dx, dy, dz]) => {
          blocks.push({ x: vx + dx, y: vy + dy, z: vz + dz, color, label: sym });
        });
      }
    }

    // 6. Fetch metadata
    const propRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`,
      { cache: 'no-store' }
    );

    const propJson = propRes.ok ? await propRes.json() : null;
    const props = propJson?.PropertyTable?.Properties?.[0] ?? {};

    return NextResponse.json({
      source: 'pubchem',
      cid,
      name: props.IUPACName ?? name,
      formula: props.MolecularFormula ?? '',
      weight: props.MolecularWeight ?? null,
      atomCount: n,
      voxels: dedup(blocks),
      pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
    });

  } catch (err: any) {
    console.error('PubChem route error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}