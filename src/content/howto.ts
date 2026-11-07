import type { GameHowTo, GameModule, LevelCard, LevelLine } from '../games/types';
// BEGIN game imports (scripts/content-barrels.mjs)
import { HOW_TO as adventureWalkHowTo } from '../games/adventure-walk/howto.ts';
import { HOW_TO as animalSnackHowTo } from '../games/animal-snack/howto.ts';
import { HOW_TO as atticFindsHowTo } from '../games/attic-finds/howto.ts';
import { HOW_TO as beatBuilderHowTo } from '../games/beat-builder/howto.ts';
import { HOW_TO as blockGardenHowTo } from '../games/block-garden/howto.ts';
import { HOW_TO as blockToppleHowTo } from '../games/block-topple/howto.ts';
import { HOW_TO as blockTowerHowTo } from '../games/block-tower/howto.ts';
import { HOW_TO as boltBoardsHowTo } from '../games/bolt-boards/howto.ts';
import { HOW_TO as bondBeadsHowTo } from '../games/bond-beads/howto.ts';
import { HOW_TO as bounceBackHowTo } from '../games/bounce-back/howto.ts';
import { HOW_TO as bouncyLaunchHowTo } from '../games/bouncy-launch/howto.ts';
import { HOW_TO as brainBreakHowTo } from '../games/brain-break/howto.ts';
import { HOW_TO as bubblePopHowTo } from '../games/bubble-pop/howto.ts';
import { HOW_TO as bugBuilderHowTo } from '../games/bug-builder/howto.ts';
import { HOW_TO as bumperGardenHowTo } from '../games/bumper-garden/howto.ts';
import { HOW_TO as caravanDaysHowTo } from '../games/caravan-days/howto.ts';
import { HOW_TO as chainReactionHowTo } from '../games/chain-reaction/howto.ts';
import { HOW_TO as circuitGardenHowTo } from '../games/circuit-garden/howto.ts';
import { HOW_TO as clapSyllablesHowTo } from '../games/clap-syllables/howto.ts';
import { HOW_TO as clockTowerHowTo } from '../games/clock-tower/howto.ts';
import { HOW_TO as colorGardenHowTo } from '../games/color-garden/howto.ts';
import { HOW_TO as critterCrossingHowTo } from '../games/critter-crossing/howto.ts';
import { HOW_TO as critterSortHowTo } from '../games/critter-sort/howto.ts';
import { HOW_TO as crosswordHowTo } from '../games/crossword/howto.ts';
import { HOW_TO as cueStudioHowTo } from '../games/cue-studio/howto.ts';
import { HOW_TO as cutAlongHowTo } from '../games/cut-along/howto.ts';
import { HOW_TO as dayByDayHowTo } from '../games/day-by-day/howto.ts';
import { HOW_TO as dominoRunHowTo } from '../games/domino-run/howto.ts';
import { HOW_TO as dotLinkHowTo } from '../games/dot-link/howto.ts';
import { HOW_TO as drawThePatternHowTo } from '../games/draw-the-pattern/howto.ts';
import { HOW_TO as driftCardsHowTo } from '../games/drift-cards/howto.ts';
import { HOW_TO as dropsJourneyHowTo } from '../games/drops-journey/howto.ts';
import { HOW_TO as duckPondHowTo } from '../games/duck-pond/howto.ts';
import { HOW_TO as ducklingParadeHowTo } from '../games/duckling-parade/howto.ts';
import { HOW_TO as eggCatchHowTo } from '../games/egg-catch/howto.ts';
import { HOW_TO as exampleExpressHowTo } from '../games/example-express/howto.ts';
import { HOW_TO as farLightsHowTo } from '../games/far-lights/howto.ts';
import { HOW_TO as feelingsFacesHowTo } from '../games/feelings-faces/howto.ts';
import { HOW_TO as ferryJamHowTo } from '../games/ferry-jam/howto.ts';
import { HOW_TO as fillDumpHowTo } from '../games/fill-dump/howto.ts';
import { HOW_TO as fluffySalonHowTo } from '../games/fluffy-salon/howto.ts';
import { HOW_TO as foodWebWorkshopHowTo } from '../games/food-web-workshop/howto.ts';
import { HOW_TO as forecastDetectiveHowTo } from '../games/forecast-detective/howto.ts';
import { HOW_TO as fossilDigHowTo } from '../games/fossil-dig/howto.ts';
import { HOW_TO as frogHopHowTo } from '../games/frog-hop/howto.ts';
import { HOW_TO as fruitSliceHowTo } from '../games/fruit-slice/howto.ts';
import { HOW_TO as fruitSumsHowTo } from '../games/fruit-sums/howto.ts';
import { HOW_TO as gadgetBenchHowTo } from '../games/gadget-bench/howto.ts';
import { HOW_TO as gardenGrowHowTo } from '../games/garden-grow/howto.ts';
import { HOW_TO as gardenRowsHowTo } from '../games/garden-rows/howto.ts';
import { HOW_TO as gearGardenHowTo } from '../games/gear-garden/howto.ts';
import { HOW_TO as gemSwapHowTo } from '../games/gem-swap/howto.ts';
import { HOW_TO as goodnightRoomHowTo } from '../games/goodnight-room/howto.ts';
import { HOW_TO as habitatHelpersHowTo } from '../games/habitat-helpers/howto.ts';
import { HOW_TO as hatBandHowTo } from '../games/hat-band/howto.ts';
import { HOW_TO as helperHouseHowTo } from '../games/helper-house/howto.ts';
import { HOW_TO as inchwormHowTo } from '../games/inchworm/howto.ts';
import { HOW_TO as islandBridgesHowTo } from '../games/island-bridges/howto.ts';
import { HOW_TO as jarSortHowTo } from '../games/jar-sort/howto.ts';
import { HOW_TO as jellyDrumsHowTo } from '../games/jelly-drums/howto.ts';
import { HOW_TO as keepHouseHowTo } from '../games/keep-house/howto.ts';
import { HOW_TO as lanternLightsHowTo } from '../games/lantern-lights/howto.ts';
import { HOW_TO as lassoLoopsHowTo } from '../games/lasso-loops/howto.ts';
import { HOW_TO as lemonadeStandHowTo } from '../games/lemonade-stand/howto.ts';
import { HOW_TO as letterTrailsHowTo } from '../games/letter-trails/howto.ts';
import { HOW_TO as liftItHowTo } from '../games/lift-it/howto.ts';
import { HOW_TO as lightLabHowTo } from '../games/light-lab/howto.ts';
import { HOW_TO as littleConductorHowTo } from '../games/little-conductor/howto.ts';
import { HOW_TO as littleHelpersHowTo } from '../games/little-helpers/howto.ts';
import { HOW_TO as littleLoomHowTo } from '../games/little-loom/howto.ts';
import { HOW_TO as logRollHowTo } from '../games/log-roll/howto.ts';
import { HOW_TO as logicGridHowTo } from '../games/logic-grid/howto.ts';
import { HOW_TO as lookItUpHowTo } from '../games/look-it-up/howto.ts';
import { HOW_TO as lostLayersHowTo } from '../games/lost-layers/howto.ts';
import { HOW_TO as mailCarrierHowTo } from '../games/mail-carrier/howto.ts';
import { HOW_TO as makerLaneHowTo } from '../games/maker-lane/howto.ts';
import { HOW_TO as marbleJumpHowTo } from '../games/marble-jump/howto.ts';
import { HOW_TO as marketStallHowTo } from '../games/market-stall/howto.ts';
import { HOW_TO as meadowPensHowTo } from '../games/meadow-pens/howto.ts';
import { HOW_TO as measuringPostHowTo } from '../games/measuring-post/howto.ts';
import { HOW_TO as meltFreezeHowTo } from '../games/melt-freeze/howto.ts';
import { HOW_TO as memoryMatchHowTo } from '../games/memory-match/howto.ts';
import { HOW_TO as monsterMunchHowTo } from '../games/monster-munch/howto.ts';
import { HOW_TO as moonWindowHowTo } from '../games/moon-window/howto.ts';
import { HOW_TO as mossyPathHowTo } from '../games/mossy-path/howto.ts';
import { HOW_TO as movieNightHowTo } from '../games/movie-night/howto.ts';
import { HOW_TO as notAlwaysHowTo } from '../games/not-always/howto.ts';
import { HOW_TO as noticeBoardHowTo } from '../games/notice-board/howto.ts';
import { HOW_TO as numberNookHowTo } from '../games/number-nook/howto.ts';
import { HOW_TO as numberTrailsHowTo } from '../games/number-trails/howto.ts';
import { HOW_TO as oppositesHowTo } from '../games/opposites/howto.ts';
import { HOW_TO as orchardRowsHowTo } from '../games/orchard-rows/howto.ts';
import { HOW_TO as owlWalkHowTo } from '../games/owl-walk/howto.ts';
import { HOW_TO as paintMixerHowTo } from '../games/paint-mixer/howto.ts';
import { HOW_TO as patternTrainHowTo } from '../games/pattern-train/howto.ts';
import { HOW_TO as peekabooBarnHowTo } from '../games/peekaboo-barn/howto.ts';
import { HOW_TO as peekaroundIslandHowTo } from '../games/peekaround-island/howto.ts';
import { HOW_TO as pegGardenHowTo } from '../games/peg-garden/howto.ts';
import { HOW_TO as penguinSlideHowTo } from '../games/penguin-slide/howto.ts';
import { HOW_TO as petKitchenHowTo } from '../games/pet-kitchen/howto.ts';
import { HOW_TO as petSaysHowTo } from '../games/pet-says/howto.ts';
import { HOW_TO as photoSafariHowTo } from '../games/photo-safari/howto.ts';
import { HOW_TO as pictureGraphHowTo } from '../games/picture-graph/howto.ts';
import { HOW_TO as pictureLogicHowTo } from '../games/picture-logic/howto.ts';
import { HOW_TO as pileMatchHowTo } from '../games/pile-match/howto.ts';
import { HOW_TO as pixelPicturesHowTo } from '../games/pixel-pictures/howto.ts';
import { HOW_TO as playdateWorkshopHowTo } from '../games/playdate-workshop/howto.ts';
import { HOW_TO as pondCongaHowTo } from '../games/pond-conga/howto.ts';
import { HOW_TO as pondTypingHowTo } from '../games/pond-typing/howto.ts';
import { HOW_TO as puddleGobbleHowTo } from '../games/puddle-gobble/howto.ts';
import { HOW_TO as puddleLensHowTo } from '../games/puddle-lens/howto.ts';
import { HOW_TO as puppetStageHowTo } from '../games/puppet-stage/howto.ts';
import { HOW_TO as puzzlePalsHowTo } from '../games/puzzle-pals/howto.ts';
import { HOW_TO as pyramidSolitaireHowTo } from '../games/pyramid-solitaire/howto.ts';
import { HOW_TO as quickTricksHowTo } from '../games/quick-tricks/howto.ts';
import { HOW_TO as rainGardenHowTo } from '../games/rain-garden/howto.ts';
import { HOW_TO as rainbowFingersHowTo } from '../games/rainbow-fingers/howto.ts';
import { HOW_TO as rampRaceHowTo } from '../games/ramp-race/howto.ts';
import { HOW_TO as readDoHowTo } from '../games/read-do/howto.ts';
import { HOW_TO as readyForAdventureHowTo } from '../games/ready-for-adventure/howto.ts';
import { HOW_TO as recipeWorkshopHowTo } from '../games/recipe-workshop/howto.ts';
import { HOW_TO as relayWoodsHowTo } from '../games/relay-woods/howto.ts';
import { HOW_TO as rhymeTimeHowTo } from '../games/rhyme-time/howto.ts';
import { HOW_TO as rhythmNeighborsHowTo } from '../games/rhythm-neighbors/howto.ts';
import { HOW_TO as ribbonWorkshopHowTo } from '../games/ribbon-workshop/howto.ts';
import { HOW_TO as riverTabletsHowTo } from '../games/river-tablets/howto.ts';
import { HOW_TO as robotPathHowTo } from '../games/robot-path/howto.ts';
import { HOW_TO as roundupHowTo } from '../games/roundup/howto.ts';
import { HOW_TO as ruleMachineHowTo } from '../games/rule-machine/howto.ts';
import { HOW_TO as sandTableHowTo } from '../games/sand-table/howto.ts';
import { HOW_TO as scoopShopHowTo } from '../games/scoop-shop/howto.ts';
import { HOW_TO as seaLiftHowTo } from '../games/sea-lift/howto.ts';
import { HOW_TO as secondChanceShedHowTo } from '../games/second-chance-shed/howto.ts';
import { HOW_TO as secretCodeHowTo } from '../games/secret-code/howto.ts';
import { HOW_TO as seedTravelersHowTo } from '../games/seed-travelers/howto.ts';
import { HOW_TO as seesawBalanceHowTo } from '../games/seesaw-balance/howto.ts';
import { HOW_TO as senseDetectiveHowTo } from '../games/sense-detective/howto.ts';
import { HOW_TO as shapeBuddiesHowTo } from '../games/shape-buddies/howto.ts';
import { HOW_TO as shapeSorterHowTo } from '../games/shape-sorter/howto.ts';
import { HOW_TO as shellRowsHowTo } from '../games/shell-rows/howto.ts';
import { HOW_TO as singAlongBarnHowTo } from '../games/sing-along-barn/howto.ts';
import { HOW_TO as sinkFloatHowTo } from '../games/sink-float/howto.ts';
import { HOW_TO as sizeParadeHowTo } from '../games/size-parade/howto.ts';
import { HOW_TO as snowballMergeHowTo } from '../games/snowball-merge/howto.ts';
import { HOW_TO as songMakerHowTo } from '../games/song-maker/howto.ts';
import { HOW_TO as sortingMachineHowTo } from '../games/sorting-machine/howto.ts';
import { HOW_TO as soundGardenHowTo } from '../games/sound-garden/howto.ts';
import { HOW_TO as speciesComebackHowTo } from '../games/species-comeback/howto.ts';
import { HOW_TO as spinnerFairHowTo } from '../games/spinner-fair/howto.ts';
import { HOW_TO as splishSplashHowTo } from '../games/splish-splash/howto.ts';
import { HOW_TO as sproutShuffleHowTo } from '../games/sprout-shuffle/howto.ts';
import { HOW_TO as stampStudioHowTo } from '../games/stamp-studio/howto.ts';
import { HOW_TO as stopAndGoHowTo } from '../games/stop-and-go/howto.ts';
import { HOW_TO as storyStepsHowTo } from '../games/story-steps/howto.ts';
import { HOW_TO as storyWeaverHowTo } from '../games/story-weaver/howto.ts';
import { HOW_TO as sudokuGardenHowTo } from '../games/sudoku-garden/howto.ts';
import { HOW_TO as swapMeetHowTo } from '../games/swap-meet/howto.ts';
import { HOW_TO as swingPalsHowTo } from '../games/swing-pals/howto.ts';
import { HOW_TO as tangramTownHowTo } from '../games/tangram-town/howto.ts';
import { HOW_TO as teddyDoctorHowTo } from '../games/teddy-doctor/howto.ts';
import { HOW_TO as thoughtBubblesHowTo } from '../games/thought-bubbles/howto.ts';
import { HOW_TO as tideLineHowTo } from '../games/tide-line/howto.ts';
import { HOW_TO as tilePairsHowTo } from '../games/tile-pairs/howto.ts';
import { HOW_TO as timelineTrailHowTo } from '../games/timeline-trail/howto.ts';
import { HOW_TO as trackwayTalesHowTo } from '../games/trackway-tales/howto.ts';
import { HOW_TO as treasureMapHowTo } from '../games/treasure-map/howto.ts';
import { HOW_TO as villageVoteHowTo } from '../games/village-vote/howto.ts';
import { HOW_TO as vineSnipHowTo } from '../games/vine-snip/howto.ts';
import { HOW_TO as waterRoadHowTo } from '../games/water-road/howto.ts';
import { HOW_TO as weatherWardrobeHowTo } from '../games/weather-wardrobe/howto.ts';
import { HOW_TO as welcomeWaysHowTo } from '../games/welcome-ways/howto.ts';
import { HOW_TO as whoAmIHowTo } from '../games/who-am-i/howto.ts';
import { HOW_TO as wordGlueHowTo } from '../games/word-glue/howto.ts';
import { HOW_TO as wordMonstersHowTo } from '../games/word-monsters/howto.ts';
import { HOW_TO as wordSearchHowTo } from '../games/word-search/howto.ts';
// END game imports

/**
 * Grown-up help for the touch games, one entry per game id. Each game's card lives in src/games/<id>/howto.ts;
 * this file gathers them (scripts/content-barrels.mjs writes the two marked blocks). The card opens by itself every time a
 * game is opened (as the intro before the round, with a demonstration for the games that have a bot) and, during
 * a round, from the hold-to-open "?" in the game shell. It is written for one level at a time: the goal is true
 * across the whole ladder, and each step, finish and note is either a plain string (true at every level) or a
 * `LevelLine` that holds only for the levels it names (`from` and `to` are inclusive and use the numbers in the
 * game's `describeLevel`). `howToFor` keeps what holds at the level on the card, so a step never talks about other
 * levels; the card's own "this level" line (the game's `describeLevel`) says what the level asks. The intro lets a
 * grown-up step the level and the card follows. It is not a hint, and reading it changes no progress.
 *
 * Couch play has its own how-to screens (`src/couch/catalog.ts`); these describe touch play.
 */
export const HOW_TO: Record<string, GameHowTo> = {
  // BEGIN game entries (scripts/content-barrels.mjs)
  'adventure-walk': adventureWalkHowTo,
  'animal-snack': animalSnackHowTo,
  'attic-finds': atticFindsHowTo,
  'beat-builder': beatBuilderHowTo,
  'block-garden': blockGardenHowTo,
  'block-topple': blockToppleHowTo,
  'block-tower': blockTowerHowTo,
  'bolt-boards': boltBoardsHowTo,
  'bond-beads': bondBeadsHowTo,
  'bounce-back': bounceBackHowTo,
  'bouncy-launch': bouncyLaunchHowTo,
  'brain-break': brainBreakHowTo,
  'bubble-pop': bubblePopHowTo,
  'bug-builder': bugBuilderHowTo,
  'bumper-garden': bumperGardenHowTo,
  'caravan-days': caravanDaysHowTo,
  'chain-reaction': chainReactionHowTo,
  'circuit-garden': circuitGardenHowTo,
  'clap-syllables': clapSyllablesHowTo,
  'clock-tower': clockTowerHowTo,
  'color-garden': colorGardenHowTo,
  'critter-crossing': critterCrossingHowTo,
  'critter-sort': critterSortHowTo,
  'crossword': crosswordHowTo,
  'cue-studio': cueStudioHowTo,
  'cut-along': cutAlongHowTo,
  'day-by-day': dayByDayHowTo,
  'domino-run': dominoRunHowTo,
  'dot-link': dotLinkHowTo,
  'draw-the-pattern': drawThePatternHowTo,
  'drift-cards': driftCardsHowTo,
  'drops-journey': dropsJourneyHowTo,
  'duck-pond': duckPondHowTo,
  'duckling-parade': ducklingParadeHowTo,
  'egg-catch': eggCatchHowTo,
  'example-express': exampleExpressHowTo,
  'far-lights': farLightsHowTo,
  'feelings-faces': feelingsFacesHowTo,
  'ferry-jam': ferryJamHowTo,
  'fill-dump': fillDumpHowTo,
  'fluffy-salon': fluffySalonHowTo,
  'food-web-workshop': foodWebWorkshopHowTo,
  'forecast-detective': forecastDetectiveHowTo,
  'fossil-dig': fossilDigHowTo,
  'frog-hop': frogHopHowTo,
  'fruit-slice': fruitSliceHowTo,
  'fruit-sums': fruitSumsHowTo,
  'gadget-bench': gadgetBenchHowTo,
  'garden-grow': gardenGrowHowTo,
  'garden-rows': gardenRowsHowTo,
  'gear-garden': gearGardenHowTo,
  'gem-swap': gemSwapHowTo,
  'goodnight-room': goodnightRoomHowTo,
  'habitat-helpers': habitatHelpersHowTo,
  'hat-band': hatBandHowTo,
  'helper-house': helperHouseHowTo,
  'inchworm': inchwormHowTo,
  'island-bridges': islandBridgesHowTo,
  'jar-sort': jarSortHowTo,
  'jelly-drums': jellyDrumsHowTo,
  'keep-house': keepHouseHowTo,
  'lantern-lights': lanternLightsHowTo,
  'lasso-loops': lassoLoopsHowTo,
  'lemonade-stand': lemonadeStandHowTo,
  'letter-trails': letterTrailsHowTo,
  'lift-it': liftItHowTo,
  'light-lab': lightLabHowTo,
  'little-conductor': littleConductorHowTo,
  'little-helpers': littleHelpersHowTo,
  'little-loom': littleLoomHowTo,
  'log-roll': logRollHowTo,
  'logic-grid': logicGridHowTo,
  'look-it-up': lookItUpHowTo,
  'lost-layers': lostLayersHowTo,
  'mail-carrier': mailCarrierHowTo,
  'maker-lane': makerLaneHowTo,
  'marble-jump': marbleJumpHowTo,
  'market-stall': marketStallHowTo,
  'meadow-pens': meadowPensHowTo,
  'measuring-post': measuringPostHowTo,
  'melt-freeze': meltFreezeHowTo,
  'memory-match': memoryMatchHowTo,
  'monster-munch': monsterMunchHowTo,
  'moon-window': moonWindowHowTo,
  'mossy-path': mossyPathHowTo,
  'movie-night': movieNightHowTo,
  'not-always': notAlwaysHowTo,
  'notice-board': noticeBoardHowTo,
  'number-nook': numberNookHowTo,
  'number-trails': numberTrailsHowTo,
  'opposites': oppositesHowTo,
  'orchard-rows': orchardRowsHowTo,
  'owl-walk': owlWalkHowTo,
  'paint-mixer': paintMixerHowTo,
  'pattern-train': patternTrainHowTo,
  'peekaboo-barn': peekabooBarnHowTo,
  'peekaround-island': peekaroundIslandHowTo,
  'peg-garden': pegGardenHowTo,
  'penguin-slide': penguinSlideHowTo,
  'pet-kitchen': petKitchenHowTo,
  'pet-says': petSaysHowTo,
  'photo-safari': photoSafariHowTo,
  'picture-graph': pictureGraphHowTo,
  'picture-logic': pictureLogicHowTo,
  'pile-match': pileMatchHowTo,
  'pixel-pictures': pixelPicturesHowTo,
  'playdate-workshop': playdateWorkshopHowTo,
  'pond-conga': pondCongaHowTo,
  'pond-typing': pondTypingHowTo,
  'puddle-gobble': puddleGobbleHowTo,
  'puddle-lens': puddleLensHowTo,
  'puppet-stage': puppetStageHowTo,
  'puzzle-pals': puzzlePalsHowTo,
  'pyramid-solitaire': pyramidSolitaireHowTo,
  'quick-tricks': quickTricksHowTo,
  'rain-garden': rainGardenHowTo,
  'rainbow-fingers': rainbowFingersHowTo,
  'ramp-race': rampRaceHowTo,
  'read-do': readDoHowTo,
  'ready-for-adventure': readyForAdventureHowTo,
  'recipe-workshop': recipeWorkshopHowTo,
  'relay-woods': relayWoodsHowTo,
  'rhyme-time': rhymeTimeHowTo,
  'rhythm-neighbors': rhythmNeighborsHowTo,
  'ribbon-workshop': ribbonWorkshopHowTo,
  'river-tablets': riverTabletsHowTo,
  'robot-path': robotPathHowTo,
  'roundup': roundupHowTo,
  'rule-machine': ruleMachineHowTo,
  'sand-table': sandTableHowTo,
  'scoop-shop': scoopShopHowTo,
  'sea-lift': seaLiftHowTo,
  'second-chance-shed': secondChanceShedHowTo,
  'secret-code': secretCodeHowTo,
  'seed-travelers': seedTravelersHowTo,
  'seesaw-balance': seesawBalanceHowTo,
  'sense-detective': senseDetectiveHowTo,
  'shape-buddies': shapeBuddiesHowTo,
  'shape-sorter': shapeSorterHowTo,
  'shell-rows': shellRowsHowTo,
  'sing-along-barn': singAlongBarnHowTo,
  'sink-float': sinkFloatHowTo,
  'size-parade': sizeParadeHowTo,
  'snowball-merge': snowballMergeHowTo,
  'song-maker': songMakerHowTo,
  'sorting-machine': sortingMachineHowTo,
  'sound-garden': soundGardenHowTo,
  'species-comeback': speciesComebackHowTo,
  'spinner-fair': spinnerFairHowTo,
  'splish-splash': splishSplashHowTo,
  'sprout-shuffle': sproutShuffleHowTo,
  'stamp-studio': stampStudioHowTo,
  'stop-and-go': stopAndGoHowTo,
  'story-steps': storyStepsHowTo,
  'story-weaver': storyWeaverHowTo,
  'sudoku-garden': sudokuGardenHowTo,
  'swap-meet': swapMeetHowTo,
  'swing-pals': swingPalsHowTo,
  'tangram-town': tangramTownHowTo,
  'teddy-doctor': teddyDoctorHowTo,
  'thought-bubbles': thoughtBubblesHowTo,
  'tide-line': tideLineHowTo,
  'tile-pairs': tilePairsHowTo,
  'timeline-trail': timelineTrailHowTo,
  'trackway-tales': trackwayTalesHowTo,
  'treasure-map': treasureMapHowTo,
  'village-vote': villageVoteHowTo,
  'vine-snip': vineSnipHowTo,
  'water-road': waterRoadHowTo,
  'weather-wardrobe': weatherWardrobeHowTo,
  'welcome-ways': welcomeWaysHowTo,
  'who-am-i': whoAmIHowTo,
  'word-glue': wordGlueHowTo,
  'word-monsters': wordMonstersHowTo,
  'word-search': wordSearchHowTo,
  // END game entries
};

/** What the how-to card shows for one game at one level: every line already chosen for that level. */
export interface HowToCard {
  title: string;
  /** Which level this is, as the grown-up zone numbers it. */
  levelNumber: number;
  /** The level in a few words, from the game's own `describeLevel`. */
  level: string;
  goal: string;
  steps: readonly string[];
  finish: string;
  note?: string;
  /** The level's name, spoken line and picture, for a game that gives them (`GameModule.levelCard`). */
  mode?: LevelCard;
}

/** Whether a line holds at a level. */
export const holdsAt = (line: LevelLine, level: number) => (line.from ?? -Infinity) <= level && level <= (line.to ?? Infinity);

/** The first line of a list that holds at the level (a plain string holds at all of them). */
function firstAt(lines: string | readonly LevelLine[] | undefined, level: number): string | undefined {
  if (typeof lines === 'string' || lines === undefined) return lines;
  return lines.find((l) => holdsAt(l, level))?.text;
}

export function howToFor(mod: Pick<GameModule, 'id' | 'name' | 'describeLevel' | 'levelCard'>, level: number): HowToCard | null {
  const entry = HOW_TO[mod.id];
  if (!entry) return null;
  return {
    title: mod.name,
    levelNumber: level,
    level: mod.describeLevel(level),
    goal: entry.goal,
    steps: entry.steps.flatMap((s) => (typeof s === 'string' ? [s] : holdsAt(s, level) ? [s.text] : [])),
    finish: firstAt(entry.finish, level) ?? '',
    note: firstAt(entry.note, level),
    ...(mod.levelCard ? { mode: mod.levelCard(level) } : {}),
  };
}

/**
 * Whether a game explains itself before its round: every time it is opened, unless a grown-up has turned the cards off.
 * A story request never does (the story's own request comes first), nor does "again" straight after a round (she has just
 * seen it), and a game with no card has nothing to show. Opening a card is never a hint and costs the round nothing.
 */
export function shouldExplain(opts: { enabled: boolean; id: string; story: boolean; again: boolean }): boolean {
  return opts.enabled && !opts.story && !opts.again && opts.id in HOW_TO;
}
