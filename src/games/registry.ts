import { patternTrain } from './pattern-train';
import { memoryMatch } from './memory-match';
import { letterTrails } from './letter-trails';
import { robotPath } from './robot-path';
import { sizeParade } from './size-parade';
import { bugBuilder } from './bug-builder';
import { storySteps } from './story-steps';
import { feelingsFaces } from './feelings-faces';
import { monsterMunch } from './monster-munch';
import { songMaker } from './song-maker';
import { puzzlePals } from './puzzle-pals';
import { weatherWardrobe } from './weather-wardrobe';
import { sinkFloat } from './sink-float';
import { bubblePop } from './bubble-pop';
import { colorGarden } from './color-garden';
import { duckPond } from './duck-pond';
import { jellyDrums } from './jelly-drums';
import { peekabooBarn } from './peekaboo-barn';
import { rainbowFingers } from './rainbow-fingers';
import { shapeSorter } from './shape-sorter';
import { splishSplash } from './splish-splash';
import { ducklingParade } from './duckling-parade';
import { scoopShop } from './scoop-shop';
import { roundup } from './roundup';
import { bouncyLaunch } from './bouncy-launch';
import type { GameModule } from './types';

/**
 * Every minigame. Within each island region, registry order determines game spots.
 */
export const GAMES: GameModule[] = [
  bubblePop,
  rainbowFingers,
  jellyDrums,
  peekabooBarn,
  splishSplash,
  duckPond,
  shapeSorter,
  colorGarden,
  patternTrain,
  memoryMatch,
  letterTrails,
  robotPath,
  sizeParade,
  bugBuilder,
  storySteps,
  feelingsFaces,
  monsterMunch,
  songMaker,
  puzzlePals,
  weatherWardrobe,
  sinkFloat,
  ducklingParade,
  scoopShop,
  roundup,
  bouncyLaunch,
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
