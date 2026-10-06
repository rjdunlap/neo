import type { ColorName } from '../art/palette';

/** Stable IDs shared by region art, save migration, and game metadata. */
export const REGION_IDS = ['bubble-beach', 'music-mountain', 'treehouse', 'barnyard', 'counting-cove', 'cozy-village', 'rainbow-meadow', 'puzzle-peaks', 'story-grove', 'tinker-lab'] as const;
export type RegionId = (typeof REGION_IDS)[number];
export const PET_COLORS = ['teal', 'pink', 'blue', 'purple', 'green', 'yellow', 'orange', 'red'] as const satisfies readonly ColorName[];
export type PetColor = (typeof PET_COLORS)[number];
export const STICKER_PAGES = ['meadow', 'beach', 'farm', 'sea', 'space'] as const;
export type StickerPage = (typeof STICKER_PAGES)[number];
