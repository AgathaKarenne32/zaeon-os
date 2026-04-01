// ─── BioSim3D — Core Types ─────────────────────────────────────────────────

export type RenderMode =
  | 'dna'
  | 'rna'
  | 'molecule'
  | 'protein'
  | 'cell'
  | 'plant'
  | 'fungus'
  | 'animal'
  | 'quantum'
  | 'math'
  | 'atom'
  | 'crystal'
  | 'anatomy'
  | 'particle';

/** A single voxel block in 3D space */
export interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  color: string;        // hex color string
  label?: string;       // optional annotation (e.g. "Oxygen", "Backbone")
  opacity?: number;     // 0–1, default 1
}

/** AI-generated descriptor — parameters only, no raw voxels */
export interface SceneDescriptor {
  renderMode: RenderMode;
  title: string;
  description: string;
  hint?: string;        // Short educational hint shown in UI
  parameters: SceneParameters;
  accentColor?: string;
  backgroundColor?: string;
}

export interface SceneParameters {
  // DNA / RNA
  helixHeight?: number;
  helixRadius?: number;
  helixTurns?: number;
  sequence?: string;     // e.g. "ATCGATCG"

  // Molecule
  formula?: string;      // e.g. "H2O", "CH4", "ATP"
  atoms?: AtomDef[];
  bonds?: BondDef[];

  // Cell
  cellType?: 'animal' | 'plant' | 'bacteria';
  showOrganelles?: boolean;

  // Plant / Fungus
  plantType?: 'tree' | 'flower' | 'mushroom' | 'seed' | 'mycelium' | 'fern';
  branchDepth?: number;
  leafColor?: string;

  // Animal
  animalType?: 'horse' | 'dog' | 'human' | 'fish' | 'bird' | 'dinosaur';
  showSkeleton?: boolean;

  // Quantum
  orbital?: 's' | 'p' | 'd' | 'f';
  principalN?: number;   // 1, 2, 3...

  // Math
  mathFunction?: 'ripple' | 'saddle' | 'paraboloid' | 'torus' | 'lorenz' | 'mobius' | 'fourier' | 'network';

  // Anatomy
  bodyPart?: 'skeleton' | 'heart' | 'neuron' | 'skin' | 'lung' | 'bloodCells' | 'eye' | 'skull' | 'muscle';

  // Particle physics
  physicsType?: 'bubbleChamber' | 'proton' | 'wavePacket' | 'photon' | 'particleDecay' | 'uncertainty';
  resolution?: number;

  // Atom
  element?: string;      // e.g. "Carbon", "Gold"
  atomicNumber?: number;

  // General
  scale?: number;        // multiplier (default 1)

  // Arbitrary extra params
  [key: string]: any;
}

export interface AtomDef {
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface BondDef {
  from: number; // index into atoms array
  to: number;
  order?: number;
}

/** A preset button in the UI for a specific room */
export interface BioSimPreset {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  descriptor: SceneDescriptor;
}

/** Map of room key → presets */
export type RoomPresets = Record<string, BioSimPreset[]>;
