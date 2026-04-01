import type { RoomPresets } from './types';

// ─── Helper to create a preset descriptor quickly ─────────────────────────────
function p(
  id: string, label: string, emoji: string,
  renderMode: string, title: string, description: string,
  hint: string, parameters: Record<string, unknown>, accentColor: string
) {
  return {
    id, label, emoji,
    prompt: label,
    descriptor: {
      renderMode: renderMode as any,
      title, description, hint,
      parameters: parameters as any,
      accentColor,
    },
  };
}

const bioPresets = [
  p('bio-dna-male', 'Male DNA Helix', '🧬', 'dna',
    'Male DNA Double Helix (XY)', 'The B-form double helix of deoxyribonucleic acid, representing the human male genome (46, XY). Shows the antiparallel sugar-phosphate backbones and complementary base pairs connected by hydrogen bonds.',
    'Men carry one X and one Y chromosome. The Y chromosome is significantly smaller and carries the SRY gene which initiates male development.',
    { helixTurns: 4, helixRadius: 4, helixHeight: 20, sequence: 'ATCGATCGATCGATCG' },
    '#3b82f6'),

  p('bio-dna-female', 'Female DNA Helix', '🧬', 'dna',
    'Female DNA Double Helix (XX)', 'The B-form double helix of deoxyribonucleic acid, representing the human female genome (46, XX). Shows the clear structured hydrogen bonds between base pairs.',
    'Women carry two X chromosomes. In each female somatic cell, one X chromosome is randomly inactivated (X-inactivation) to avoid double coding, forming a Barr body.',
    { helixTurns: 4, helixRadius: 4, helixHeight: 20, sequence: 'ATCGATCGATCGATCG' },
    '#ec4899'),
];

// ─────────────────────────────────────────────────────────────────────────────
//  Export map
// ─────────────────────────────────────────────────────────────────────────────
export const ROOM_PRESETS: RoomPresets = {
  bio:        bioPresets,
  med:        [],
  quantic:    [],
  cyber:      [],
  humanities: [],
};

export const DEFAULT_ROOM = 'bio';
