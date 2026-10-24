import { marbleJump } from './marble-jump';
import { logRoll } from './log-roll';
import { snowballMerge } from './snowball-merge';
import { mossyPath } from './mossy-path';
import { brainBreak } from './brain-break';
import { pyramidSolitaire } from './pyramid-solitaire';
import { numberNook } from './number-nook';
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
import { singAlongBarn } from './sing-along-barn';
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
import { ribbonWorkshop } from './ribbon-workshop';
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
import { littleConductor } from './little-conductor';
import { clapSyllables } from './clap-syllables';
import { chainReaction } from './chain-reaction';
import { rhymeTime } from './rhyme-time';
import { stopAndGo } from './stop-and-go';
import { rampRace } from './ramp-race';
import { critterSort } from './critter-sort';
import { treasureMap } from './treasure-map';
import { oppositesGame } from './opposites';
import { shapeBuddies } from './shape-buddies';
import { dayByDay } from './day-by-day';
import { orchardRows } from './orchard-rows';
import { boltBoards } from './bolt-boards';
import { pictureGraph } from './picture-graph';
import { inchworm } from './inchworm';
import { blockTower } from './block-tower';
import { lassoLoops } from './lasso-loops';
import { petSays } from './pet-says';
import { owlWalk } from './owl-walk';
import { gardenRows } from './garden-rows';
import { ferryJam } from './ferry-jam';
import { jarSort } from './jar-sort';
import { blockGarden } from './block-garden';
import { dominoRun } from './domino-run';
import { fruitSlice } from './fruit-slice';
import { cutAlong } from './cut-along';
import { drawThePattern } from './draw-the-pattern';
import { puddleGobble } from './puddle-gobble';
import { swingPals } from './swing-pals';
import { liftIt } from './lift-it';
import { atticFinds } from './attic-finds';
import { fossilDig } from './fossil-dig';
import { lostLayers } from './lost-layers';
import { seaLift } from './sea-lift';
import { recipeWorkshop } from './recipe-workshop';
import { trackwayTales } from './trackway-tales';
import { critterCrossing } from './critter-crossing';
import { sudokuGarden } from './sudoku-garden';
import { pondConga } from './pond-conga';
import { gemSwap } from './gem-swap';
import { tilePairs } from './tile-pairs';
import { lanternLights } from './lantern-lights';
import { pictureLogic } from './picture-logic';
import { wordSearch } from './word-search';
import { pondTyping } from './pond-typing';
import { islandBridges } from './island-bridges';
import { speciesComeback } from './species-comeback';
import { cueStudio } from './cue-studio';
import { foodWebWorkshop } from './food-web-workshop';
import { lemonadeStand } from './lemonade-stand';
import { habitatHelpers } from './habitat-helpers';
import { fillDump } from './fill-dump';
import { pileMatch } from './pile-match';
import { numberTrails } from './number-trails';
import { fruitSums } from './fruit-sums';
import { readDo } from './read-do';
import { lookItUp } from './look-it-up';
import { whoAmI } from './who-am-i';
import { secondChanceShed } from './second-chance-shed';
import { sandTable } from './sand-table';
import { adventureWalk } from './adventure-walk';
import { readyForAdventure } from './ready-for-adventure';
import { senseDetective } from './sense-detective';
import type { GameModule } from './types';

/**
 * Every minigame. Within each island region, registry order determines game spots.
 */
export const GAMES: GameModule[] = [
  bubblePop,
  rainbowFingers,
  jellyDrums,
  singAlongBarn,
  peekabooBarn,
  splishSplash,
  duckPond,
  shapeSorter,
  colorGarden,
  patternTrain,
  mossyPath,
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
  ribbonWorkshop,
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
  littleConductor,
  rhymeTime,
  stopAndGo,
  rampRace,
  critterSort,
  treasureMap,
  oppositesGame,
  pictureGraph,
  orchardRows,
  boltBoards,
  dayByDay,
  shapeBuddies,
  inchworm,
  blockTower,
  lassoLoops,
  petSays,
  owlWalk,
  gardenRows,
  ferryJam,
  jarSort,
  blockGarden,
  dominoRun,
  fruitSlice,
  cutAlong,
  drawThePattern,
  puddleGobble,
  swingPals,
  liftIt,
  atticFinds,
  fossilDig,
  lostLayers,
  seaLift,
  recipeWorkshop,
  trackwayTales,
  critterCrossing,
  clapSyllables,
  chainReaction,
  lemonadeStand,
  habitatHelpers,
  fillDump,
  numberTrails,
  fruitSums,
  readDo,
  lookItUp,
  whoAmI,
  secondChanceShed,
  sandTable,
  adventureWalk,
  readyForAdventure,
  senseDetective,
  marbleJump,
  logRoll,
  snowballMerge,
  gemSwap,
  tilePairs,
  lanternLights,
  sudokuGarden,
  pictureLogic,
  wordSearch,
  pondTyping,
  islandBridges,
  pondConga,
  speciesComeback,
  cueStudio,
  foodWebWorkshop,
  numberNook,
  pyramidSolitaire,
  brainBreak,
  pileMatch,
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Whether the island's own scene can play a game: it takes touch unless the module says it takes only a controller. */
export const playsByTouch = (mod: Pick<GameModule, 'inputs'>) => !mod.inputs || mod.inputs.includes('touch');

/** Couch play looks games up here too. The grown-up games are island games now (band `grownup`), so there is one list. */
export const couchGameById = gameById;
