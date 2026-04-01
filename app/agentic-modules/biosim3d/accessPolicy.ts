/**
 * BioSim3D — Room Access Policy
 *
 * Each study room has a curated set of allowed render modes, intents,
 * and subject keywords. This single file is the source of truth for
 * what a teacher from a given course can generate.
 *
 * Enforcement happens at two layers:
 *   1. API  → rejects descriptors whose renderMode is outside the room's scope
 *   2. UI   → locks the room, hides out-of-scope presets, shows clear messaging
 */

import type { RenderMode } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomPolicy {
  /** Human-readable course name */
  label: string;
  /** Emoji  */
  emoji: string;
  /** All RenderModes this room may visualise */
  allowedModes: RenderMode[];
  /** AI intents this room may trigger (molecule → PubChem, protein → PDB, descriptor → local) */
  allowedIntents: Array<'molecule' | 'protein' | 'descriptor'>;
  /** Whether RCSB PDB lookup is allowed (false for rooms where macromolecules are off-topic) */
  pdbAllowed: boolean;
  /** Allowed math functions (subset of math renderMode) */
  allowedMathFunctions?: string[];
  /** Allowed quantum orbital types */
  allowedOrbitals?: string[];
  /** Allowed anatomy body parts */
  allowedBodyParts?: string[];
  /** Allowed physics types */
  allowedPhysicsTypes?: string[];
  /** Allowed animal types */
  allowedAnimalTypes?: string[];
  /** Allowed plant types */
  allowedPlantTypes?: string[];
  /** Short message shown when a generation is blocked */
  outOfScopeMessage: string;
  /** Keywords acceptable in a prompt (used by Gemini context) */
  subjectKeywords: string[];
}

// ─── Policy map ───────────────────────────────────────────────────────────────

export const ROOM_POLICY: Record<string, RoomPolicy> = {

  // ── Biology ──────────────────────────────────────────────────────────────────
  bio: {
    label: 'Biology',
    emoji: '🌿',
    allowedModes: ['dna', 'rna', 'molecule', 'protein', 'cell', 'plant', 'fungus', 'animal', 'crystal'],
    allowedIntents: ['molecule', 'protein', 'descriptor'],
    pdbAllowed: true,
    allowedAnimalTypes: ['horse', 'dog', 'human', 'fish', 'bird'],
    allowedPlantTypes: ['tree', 'flower', 'fern', 'seed', 'mycelium', 'mushroom'],
    allowedMathFunctions: [], // math surfaces are not in scope
    allowedOrbitals: [],      // quantum physics not in scope
    allowedBodyParts: [],     // clinical anatomy is in Med
    allowedPhysicsTypes: [],  // particle physics not in scope
    outOfScopeMessage:
      'Esta sala é focada em Biologia. Visualizações de física quântica, anatomia clínica, ou matemática avançada pertencem a outras salas.',
    subjectKeywords: [
      'cell', 'dna', 'rna', 'protein', 'enzyme', 'plant', 'fungi', 'mushroom', 'organism',
      'bacteria', 'virus', 'evolution', 'ecology', 'photosynthesis', 'mitosis', 'meiosis',
      'chlorophyll', 'chloroplast', 'mitochondria', 'glucose', 'amino acid', 'peptide',
      'receptor', 'membrane', 'nucleus', 'chromosome', 'gene', 'ecosystem', 'seed', 'fern',
      'moss', 'algae', 'fish', 'bird', 'horse', 'animal', 'taxonomy', 'kingdom', 'species',
    ],
  },

  // ── Medicine ─────────────────────────────────────────────────────────────────
  med: {
    label: 'Medicine',
    emoji: '🔬',
    allowedModes: ['anatomy', 'molecule', 'protein', 'cell', 'dna', 'crystal'],
    allowedIntents: ['molecule', 'protein', 'descriptor'],
    pdbAllowed: true,
    allowedBodyParts: ['skeleton', 'heart', 'neuron', 'skin', 'lung', 'bloodCells', 'eye', 'skull', 'muscle'],
    allowedAnimalTypes: [],     // zoology not in curriculum
    allowedPlantTypes: [],      // botany not in curriculum
    allowedMathFunctions: [],   // advanced math not in scope
    allowedOrbitals: [],        // quantum physics not in scope
    allowedPhysicsTypes: [],    // particle physics not in scope
    outOfScopeMessage:
      'Esta sala é focada em Medicina. Visualizações de física quântica, biologia vegetal, fungos ou matemática pura pertencem a outras salas.',
    subjectKeywords: [
      'anatomy', 'skeleton', 'bone', 'muscle', 'heart', 'lung', 'brain', 'neuron', 'nerve',
      'blood', 'cell', 'tissue', 'organ', 'body', 'human', 'clinical', 'medical', 'drug',
      'pharmaceutical', 'pharmacology', 'diagnosis', 'pathology', 'surgery', 'therapy',
      'vaccine', 'antibody', 'immune', 'hormone', 'protein', 'enzyme', 'receptor',
      'dna', 'rna', 'gene', 'genome', 'mutation', 'cancer', 'virus', 'bacteria',
      'aspirin', 'penicillin', 'insulin', 'cortisol', 'adrenaline', 'dopamine', 'serotonin',
    ],
  },

  // ── Quantum Physics ──────────────────────────────────────────────────────────
  quantic: {
    label: 'Quantum Physics',
    emoji: '⚛️',
    allowedModes: ['quantum', 'atom', 'particle', 'math', 'molecule', 'crystal', 'dna'],
    allowedIntents: ['molecule', 'descriptor'],
    pdbAllowed: false,
    allowedOrbitals: ['s', 'p', 'd', 'f'],
    allowedPhysicsTypes: ['bubbleChamber', 'proton', 'wavePacket', 'photon', 'particleDecay', 'uncertainty'],
    allowedMathFunctions: ['ripple', 'saddle', 'paraboloid', 'torus', 'lorenz', 'mobius', 'fourier', 'network'],
    allowedAnimalTypes: [],   // biology not in scope
    allowedPlantTypes: [],    // botany not in scope
    allowedBodyParts: [],     // anatomy not in scope
    outOfScopeMessage:
      'Esta sala é focada em Física Quântica. Visualizações de anatomia, biologia vegetal ou estruturas macro-biológicas pertencem a outras salas.',
    subjectKeywords: [
      'quantum', 'orbital', 'atom', 'electron', 'proton', 'neutron', 'photon', 'quark',
      'gluon', 'wave', 'particle', 'uncertainty', 'superposition', 'entanglement',
      'energy level', 'spin', 'fermion', 'boson', 'higgs', 'neutrino', 'positron',
      'antiparticle', 'decay', 'radioactive', 'nuclear', 'fusion', 'fission',
      'molecule', 'bond', 'crystal', 'lattice', 'NaCl', 'semiconductor',
      'lorenz', 'chaos', 'fourier', 'wave function', 'schrodinger', 'heisenberg',
    ],
  },

  // ── Cyber / Computational ─────────────────────────────────────────────────────
  cyber: {
    label: 'Cyber / Math',
    emoji: '💻',
    allowedModes: ['math', 'crystal', 'molecule', 'dna', 'protein'],
    allowedIntents: ['molecule', 'descriptor'],
    pdbAllowed: false,
    allowedMathFunctions: ['ripple', 'saddle', 'paraboloid', 'torus', 'lorenz', 'mobius', 'fourier', 'network'],
    allowedAnimalTypes: [],
    allowedPlantTypes: [],
    allowedBodyParts: [],
    allowedOrbitals: [],
    allowedPhysicsTypes: [],
    outOfScopeMessage:
      'Esta sala é focada em Matemática Computacional. Visualizações de anatomia, física quântica ou biologia pertencem a outras salas.',
    subjectKeywords: [
      'graph', 'network', 'topology', 'surface', 'function', 'fractal', 'chaos',
      'lorenz', 'attractor', 'torus', 'mobius', 'fourier', 'transform', 'series',
      'paraboloid', 'saddle', 'ripple', 'wave', 'interference', 'algorithm',
      'data structure', 'matrix', 'vector', 'tensor', 'integral', 'derivative',
      'number theory', 'prime', 'cryptography', 'lattice', 'crystal', 'geometry',
      'dna computing', 'protein folding', 'bioinformatics',
    ],
  },

  // ── Humanities / Interdisciplinary ───────────────────────────────────────────
  humanities: {
    label: 'Humanities',
    emoji: '📚',
    allowedModes: ['animal', 'plant', 'fungus', 'cell', 'crystal', 'anatomy', 'molecule', 'dna'],
    allowedIntents: ['molecule', 'protein', 'descriptor'],
    pdbAllowed: true,
    allowedAnimalTypes: ['horse', 'dog', 'human', 'fish', 'bird', 'dinosaur'],
    allowedPlantTypes: ['tree', 'flower', 'fern', 'seed', 'mycelium', 'mushroom'],
    allowedBodyParts: ['skeleton', 'skull'],   // anthropological anatomy
    allowedMathFunctions: [],    // advanced math not in scope
    allowedOrbitals: [],
    allowedPhysicsTypes: [],
    outOfScopeMessage:
      'Esta sala é focada em Humanidades. Visualizações de física quântica, partículas subatômicas ou matemática avançada pertencem a outras salas.',
    subjectKeywords: [
      'animal', 'plant', 'history', 'evolution', 'fossil', 'archaeology', 'anthropology',
      'skeleton', 'skull', 'horse', 'dog', 'fish', 'bird', 'dinosaur', 'mammal',
      'crystal', 'mineral', 'rock', 'geography', 'cell', 'organism', 'ecology',
      'seed', 'tree', 'flower', 'forest', 'culture', 'civilization', 'ancient',
      'DNA', 'ancestry', 'migration', 'species', 'extinction', 'biodiversity',
    ],
  },
};

// ─── Guard functions ──────────────────────────────────────────────────────────

/**
 * Check if a renderMode is allowed for a given room.
 */
export function isModeAllowed(room: string, mode: RenderMode): boolean {
  const policy = ROOM_POLICY[room];
  if (!policy) return true; // unknown room → permissive
  return policy.allowedModes.includes(mode);
}

/**
 * Check if a specific sub-parameter is allowed (bodyPart, mathFunction, etc.)
 */
export function isParamAllowed(
  room: string,
  paramKey: 'bodyPart' | 'mathFunction' | 'physicsType' | 'orbital' | 'animalType' | 'plantType',
  value: string
): boolean {
  const policy = ROOM_POLICY[room];
  if (!policy) return true;
  switch (paramKey) {
    case 'bodyPart':      return (policy.allowedBodyParts ?? []).includes(value);
    case 'mathFunction':  return (policy.allowedMathFunctions ?? []).includes(value);
    case 'physicsType':   return (policy.allowedPhysicsTypes ?? []).includes(value);
    case 'orbital':       return (policy.allowedOrbitals ?? []).includes(value);
    case 'animalType':    return (policy.allowedAnimalTypes ?? []).includes(value);
    case 'plantType':     return (policy.allowedPlantTypes ?? []).includes(value);
    default:              return true;
  }
}

/**
 * Validate a full SceneDescriptor against the room policy.
 * Returns null if OK, or a human-readable reason string if blocked.
 */
export function validateDescriptor(
  room: string,
  descriptor: { renderMode: string; parameters?: Record<string, any> }
): string | null {
  const policy = ROOM_POLICY[room];
  if (!policy) return null;

  const mode = descriptor.renderMode as RenderMode;
  const params = descriptor.parameters ?? {};

  if (!policy.allowedModes.includes(mode)) {
    return policy.outOfScopeMessage;
  }

  // Sub-parameter checks
  const checks: Array<[string, 'bodyPart' | 'mathFunction' | 'physicsType' | 'orbital' | 'animalType' | 'plantType']> = [
    ['bodyPart',     'bodyPart'],
    ['mathFunction', 'mathFunction'],
    ['physicsType',  'physicsType'],
    ['orbital',      'orbital'],
    ['animalType',   'animalType'],
    ['plantType',    'plantType'],
  ];

  for (const [key, policyKey] of checks) {
    const val = params[key];
    if (val) {
      const allowed = policy[`allowed${policyKey.charAt(0).toUpperCase() + policyKey.slice(1)}s` as keyof RoomPolicy] as string[] | undefined;
      if (allowed && allowed.length > 0 && !allowed.includes(val)) {
        return policy.outOfScopeMessage;
      }
    }
  }

  return null; // allowed
}

/**
 * Check if a given AI intent (molecule/protein/descriptor) is allowed for a room.
 */
export function isIntentAllowed(
  room: string,
  intent: 'molecule' | 'protein' | 'descriptor'
): boolean {
  const policy = ROOM_POLICY[room];
  if (!policy) return true;
  return policy.allowedIntents.includes(intent);
}

/**
 * Build the policy context string to inject into the Gemini system prompt.
 * This scopes Gemini's output to the room's allowed domain.
 */
export function buildPolicyContext(room: string): string {
  const policy = ROOM_POLICY[room];
  if (!policy) return '';
  return `
ROOM POLICY FOR "${policy.label}" (${room}):
- Allowed render modes: ${policy.allowedModes.join(', ')}
- Allowed AI intents: ${policy.allowedIntents.join(', ')}
- PDB protein lookup: ${policy.pdbAllowed ? 'YES' : 'NO'}
- Relevant subject keywords: ${policy.subjectKeywords.slice(0, 20).join(', ')}
- IMPORTANT: If the user's request is outside this domain (e.g., a medicine teacher asking about quantum orbitals), set intent to "descriptor" and choose the closest ALLOWED render mode, or respond with renderMode "dna" as a safe fallback and explain in the description that the topic is outside this room's curriculum.
`;
}
