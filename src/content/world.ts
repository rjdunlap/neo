import type { ColorName } from '../art/palette';

/** Stable IDs shared by region art, save migration, and game metadata. */
export const REGION_IDS = ['bubble-beach', 'music-mountain', 'treehouse', 'barnyard', 'counting-cove', 'cozy-village', 'rainbow-meadow', 'puzzle-peaks', 'story-grove', 'tinker-lab'] as const;
export type RegionId = (typeof REGION_IDS)[number];
export const PET_COLORS = ['teal', 'pink', 'blue', 'purple', 'green', 'yellow', 'orange', 'red'] as const satisfies readonly ColorName[];
export type PetColor = (typeof PET_COLORS)[number];
export const STICKER_PAGES = ['meadow', 'beach', 'farm', 'sea', 'space'] as const;
export type StickerPage = (typeof STICKER_PAGES)[number];

/** Illustrated subject choices; IDs remain the existing catalog grouping IDs. */
export const SUBJECTS = [
  { id: 'bubble-beach', name: 'Bubble Beach', line: 'subject.senses' },
  { id: 'music-mountain', name: 'Music Mountain', line: 'subject.music' },
  { id: 'treehouse', name: 'Treehouse', line: 'subject.art' },
  { id: 'barnyard', name: 'Barnyard', line: 'subject.animals' },
  { id: 'counting-cove', name: 'Counting Cove', line: 'subject.numbers' },
  { id: 'cozy-village', name: 'Cozy Village', line: 'subject.everyday' },
  { id: 'rainbow-meadow', name: 'Rainbow Meadow', line: 'subject.shapes' },
  { id: 'puzzle-peaks', name: 'Puzzle Peaks', line: 'subject.puzzles' },
  { id: 'story-grove', name: 'Story Grove', line: 'subject.stories' },
  { id: 'tinker-lab', name: 'Tinker Lab', line: 'subject.science' },
] as const satisfies readonly { id: RegionId; name: string; line: import('./voice-script').LineId }[];
