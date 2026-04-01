/**
 * POST /api/agentic/biosim/pdb
 *
 * Fetches a real protein / biomolecule structure from the RCSB Protein Data Bank
 * and converts atoms to VoxelBlock[].
 *
 * Flow:
 *   1. Accept a PDB ID (4-char, e.g. "4HHB" = haemoglobin) or a search term
 *   2. If search term → use RCSB search API to find the best matching entry ID
 *   3. Download the mmCIF-lite (ATOM records) via RCSB data API
 *   4. Parse ATOM / HETATM lines → (x,y,z,element)
 *   5. Down-sample large structures (cap at 2,000 representative atoms)
 *   6. Centre + scale → voxels
 *   7. Colour by element (CPK) + chain colour blending
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── CPK element colours ──────────────────────────────────────────────────────
const CPK: Record<string, string> = {
  H:'#e2e8f0',C:'#404040',N:'#3b82f6',O:'#ef4444',S:'#eab308',
  P:'#f97316',FE:'#b45309',CA:'#99f6e4',MG:'#34d399',ZN:'#6ee7b7',
  CU:'#f59e0b',MN:'#f472b6',SE:'#fbbf24',CL:'#22c55e',BR:'#7f1d1d',
};
const CHAIN_COLORS = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#f87171','#22d3ee','#fb923c'];

// ─── PDB ID search via RCSB ────────────────────────────────────────────────────
async function searchPDB(query: string): Promise<string | null> {
  try {
    const body = {
      query: {
        type: 'terminal',
        service: 'full_text',
        parameters: { value: query },
      },
      return_type: 'entry',
      request_options: { paginate: { start: 0, rows: 1 } },
    };
    const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result_set?.[0]?.identifier ?? null;
  } catch { return null; }
}

// ─── Parse PDB flat file → atoms ─────────────────────────────────────────────
interface PDBAtom { x: number; y: number; z: number; element: string; chain: string; resName: string }

function parsePDB(text: string): PDBAtom[] {
  const atoms: PDBAtom[] = [];
  for (const raw of text.split('\n')) {
    const rec = raw.slice(0, 6).trim();
    if (rec !== 'ATOM' && rec !== 'HETATM') continue;
    const x    = parseFloat(raw.slice(30, 38));
    const y    = parseFloat(raw.slice(38, 46));
    const z    = parseFloat(raw.slice(46, 54));
    const elem = (raw.slice(76, 78).trim() || raw.slice(12, 16).trim()[0]).toUpperCase();
    const chain = raw.slice(21, 22).trim() || 'A';
    const resName = raw.slice(17, 20).trim();
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) atoms.push({ x, y, z, element: elem, chain, resName });
  }
  return atoms;
}

// ─── Down-sample to maxAtoms representative atoms using spatial grid ──────────
function downsample(atoms: PDBAtom[], maxAtoms: number): PDBAtom[] {
  if (atoms.length <= maxAtoms) return atoms;
  const step = Math.ceil(atoms.length / maxAtoms);
  return atoms.filter((_, i) => i % step === 0);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { pdbId, search } = await req.json() as { pdbId?: string; search?: string };

    let id = pdbId?.toUpperCase().trim();

    // Resolve search term to PDB ID
    if (!id && search) {
      id = (await searchPDB(search)) ?? undefined;
      if (!id) return NextResponse.json({ error: `No PDB entry found for "${search}"` }, { status: 404 });
    }

    if (!id) return NextResponse.json({ error: 'pdbId or search required' }, { status: 400 });

    // Fetch PDB flat file
    const pdbUrl = `https://files.rcsb.org/download/${id}.pdb`;
    const pdbRes = await fetch(pdbUrl, { next: { revalidate: 86400 } });
    if (!pdbRes.ok) return NextResponse.json({ error: `PDB entry "${id}" not found` }, { status: 404 });
    const pdbText = await pdbRes.text();

    // Parse atoms
    let atoms = parsePDB(pdbText);
    if (atoms.length === 0) return NextResponse.json({ error: 'No ATOM records found in PDB file' }, { status: 422 });

    // Down-sample for performance (max 2,000 atoms → voxels)
    const originalCount = atoms.length;
    atoms = downsample(atoms, 2000);

    // Centre
    const cx = atoms.reduce((a,b)=>a+b.x,0)/atoms.length;
    const cy = atoms.reduce((a,b)=>a+b.y,0)/atoms.length;
    const cz = atoms.reduce((a,b)=>a+b.z,0)/atoms.length;

    // Scale to fit ±14 voxels
    const maxDist = Math.max(...atoms.map(a => Math.sqrt((a.x-cx)**2+(a.y-cy)**2+(a.z-cz)**2)), 1);
    const scale = 14 / maxDist;

    // Unique chain → colour mapping
    const chains = [...new Set(atoms.map(a => a.chain))];
    const chainColorMap: Record<string,string> = {};
    chains.forEach((c,i) => { chainColorMap[c] = CHAIN_COLORS[i % CHAIN_COLORS.length]; });

    // Convert to voxels
    const voxelMap = new Map<string, { x:number; y:number; z:number; color:string; label:string }>();
    for (const a of atoms) {
      const vx = Math.round((a.x - cx) * scale);
      const vy = Math.round((a.y - cy) * scale);
      const vz = Math.round((a.z - cz) * scale);
      const elemColor = CPK[a.element] ?? chainColorMap[a.chain] ?? '#a78bfa';
      const key = `${vx},${vy},${vz}`;
      voxelMap.set(key, {
        x: vx, y: vy, z: vz,
        color: elemColor,
        label: `${a.element} (${a.resName}, chain ${a.chain})`,
      });
    }

    // Fetch PDB metadata
    let title = id, resolution = null, method = null;
    try {
      const metaRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${id}`, { next: { revalidate: 86400 } });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        title      = meta.struct?.title ?? id;
        resolution = meta.rcsb_entry_info?.resolution_combined?.[0] ?? null;
        method     = meta.exptl?.[0]?.method ?? null;
      }
    } catch { /* metadata optional */ }

    return NextResponse.json({
      source:        'rcsb_pdb',
      pdbId:         id,
      title,
      resolution,
      method,
      originalAtoms: originalCount,
      sampledAtoms:  atoms.length,
      chains:        chains.length,
      voxels:        [...voxelMap.values()],
      pdbUrl:        `https://www.rcsb.org/structure/${id}`,
    });

  } catch (err: any) {
    console.error('PDB route error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
