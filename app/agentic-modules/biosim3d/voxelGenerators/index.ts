import type { VoxelBlock, RenderMode, SceneParameters } from '../types';
import { generateDNA, generateRNA } from './dna';
import { generateMolecule, generateCrystal } from './molecule';
import { generateCell } from './cell';
import { generatePlant, generateFungus } from './plant';
import { generateAnimal } from './animal';
import { generateQuantum, generateAtom } from './quantum';
import { generateMath } from './math';
import { generateProtein } from './protein';
import { generateAnatomy } from './anatomy';
import { generateParticle } from './particle';

/** Central dispatch — maps RenderMode → voxel generator */
export function buildVoxels(mode: RenderMode, params: SceneParameters): VoxelBlock[] {
  switch (mode) {
    case 'dna':      return generateDNA(params);
    case 'rna':      return generateRNA(params);
    case 'molecule': return generateMolecule(params);
    case 'crystal':  return generateCrystal(params);
    case 'cell':     return generateCell(params);
    case 'plant':    return generatePlant(params);
    case 'fungus':   return generateFungus(params);
    case 'animal':   return generateAnimal(params);
    case 'quantum':  return generateQuantum(params);
    case 'atom':     return generateAtom(params);
    case 'math':     return generateMath(params);
    case 'protein':  return generateProtein(params);
    case 'anatomy':  return generateAnatomy(params);
    case 'particle': return generateParticle(params);
    default:         return generateDNA(params);
  }
}

export {
  generateDNA, generateRNA,
  generateMolecule, generateCrystal,
  generateCell,
  generatePlant, generateFungus,
  generateAnimal,
  generateQuantum, generateAtom,
  generateMath,
  generateProtein,
  generateAnatomy,
  generateParticle,
};
