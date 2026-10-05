import { bubblePop } from './bubble-pop';
import { colorGarden } from './color-garden';
import { duckPond } from './duck-pond';
import { jellyDrums } from './jelly-drums';
import { peekabooBarn } from './peekaboo-barn';
import { rainbowFingers } from './rainbow-fingers';
import { shapeSorter } from './shape-sorter';
import { splishSplash } from './splish-splash';
import type { GameModule } from './types';

/**
 * Every minigame. Within each hub place, the first game stands front-left,
 * the second front-right and the third at the back in the middle.
 */
export const GAMES: GameModule[] = [
  // Meadow
  bubblePop,
  rainbowFingers,
  jellyDrums,
  // Farm
  peekabooBarn,
  splishSplash,
  duckPond,
  // Garden
  shapeSorter,
  colorGarden,
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
