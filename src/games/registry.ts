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
import { wordMonsters } from './word-monsters';
import { pegGarden } from './peg-garden';
import { fluffySalon } from './fluffy-salon';
import { soundGarden } from './sound-garden';
import { littleHelpers } from './little-helpers';
import { eggCatch } from './egg-catch';
import { mailCarrier } from './mail-carrier';
import { photoSafari } from './photo-safari';
import { bounceBack } from './bounce-back';
import { dotLink } from './dot-link';
import { seesawBalance } from './seesaw-balance';
import { teddyDoctor } from './teddy-doctor';
import { bumperGarden } from './bumper-garden';
import { quickTricks } from './quick-tricks';
import { stampStudio } from './stamp-studio';
import { petKitchen } from './pet-kitchen';
import { tangramTown } from './tangram-town';
import { rhythmNeighbors } from './rhythm-neighbors';
import { peekaroundIsland } from './peekaround-island';
import { lightLab } from './light-lab';
import { penguinSlide } from './penguin-slide';
import { secretCode } from './secret-code';
import { frogHop } from './frog-hop';
import { marketStall } from './market-stall';
import { gardenGrow } from './garden-grow';
import { clockTower } from './clock-tower';
import { pixelPictures } from './pixel-pictures';
import { goodnightRoom } from './goodnight-room';
import { animalSnack } from './animal-snack';
import { beatBuilder } from './beat-builder';
import { rhymeTime } from './rhyme-time';
import { stopAndGo } from './stop-and-go';
import { rampRace } from './ramp-race';
import { critterSort } from './critter-sort';
import { treasureMap } from './treasure-map';
import { oppositesGame } from './opposites';
import { pictureGraph } from './picture-graph';
import { inchworm } from './inchworm';
import { blockTower } from './block-tower';
import { lassoLoops } from './lasso-loops';
import { petSays } from './pet-says';
import { owlWalk } from './owl-walk';
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
  wordMonsters,
  pegGarden,
  fluffySalon,
  soundGarden,
  littleHelpers,
  eggCatch,
  mailCarrier,
  photoSafari,
  bounceBack,
  dotLink,
  seesawBalance,
  teddyDoctor,
  bumperGarden,
  quickTricks,
  stampStudio,
  petKitchen,
  tangramTown,
  rhythmNeighbors,
  peekaroundIsland,
  lightLab,
  penguinSlide,
  secretCode,
  frogHop,
  marketStall,
  gardenGrow,
  clockTower,
  pixelPictures,
  goodnightRoom,
  animalSnack,
  beatBuilder,
  rhymeTime,
  stopAndGo,
  rampRace,
  critterSort,
  treasureMap,
  oppositesGame,
  pictureGraph,
  inchworm,
  blockTower,
  lassoLoops,
  petSays,
  owlWalk,
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
