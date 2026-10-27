import { createSuite as createMeadowHome } from './suites/home-meadow.mjs';
import { createSuite as createSeesawMeasure } from './suites/seesaw-measure.mjs';
import { createSuite as createSeesawEntry } from './suites/seesaw-entry.mjs';
import { createSuite as createWardrobe10 } from './suites/wardrobe10.mjs';
import { createSuite as createRelayWoods } from './suites/relay-woods-play.mjs';
import { createSuite as createVillageVote } from './suites/village-vote-play.mjs';
import { createSuite as createSwapMeet } from './suites/swap-meet-play.mjs';
import { createSuite as createLittleLoom } from './suites/little-loom-play.mjs';
import { createSuite as createExampleExpress } from './suites/example-express-play.mjs';
import { createSuite as createMovieNight } from './suites/movie-night-play.mjs';
import { createSuite as createWelcomeWays } from './suites/welcome-ways-play.mjs';
import { createSuite as createLens } from './suites/lens-play.mjs';
import { createSuite as createMeltFreeze } from './suites/melt-freeze-play.mjs';
import { createSuite as createMoonWindow } from './suites/moon-window-play.mjs';
import { createSuite as createSortingMachine } from './suites/sorting-machine-play.mjs';
import { createSuite as createHelperHouse } from './suites/helper-house-play.mjs';
import { createSuite as createStoryWeaver } from './suites/story-weaver-play.mjs';
import { createSuite as createWordGlue } from './suites/word-glue-play.mjs';
import { createSuite as createBondBeads } from './suites/bond-beads-play.mjs';
import assert from 'node:assert/strict';
import { selectNames, selectValue } from './selection.mjs';
import { createSuite as create0 } from './suites/ribbon-play.mjs';
import { createSuite as create1 } from './suites/feelings-poke.mjs';
import { createSuite as create2 } from './suites/critter-not-entry.mjs';
import { createSuite as create3 } from './suites/marble-jump-play.mjs';
import { createSuite as create4 } from './suites/log-roll-play.mjs';
import { createSuite as create5 } from './suites/snowball-merge-play.mjs';
import { createSuite as create6 } from './suites/story-theater-play.mjs';
import { createSuite as create7 } from './suites/brain-break-play.mjs';
import { createSuite as create8 } from './suites/cue-studio-play.mjs';
import { createSuite as create9 } from './suites/food-web-play.mjs';
import { createSuite as create10 } from './suites/pyramid-play.mjs';
import { createSuite as create11 } from './suites/mossy-path-play.mjs';
import { createSuite as create12 } from './suites/number-nook-play.mjs';
import { createSuite as create13 } from './suites/gem-swap-play.mjs';
import { createSuite as create14 } from './suites/tile-pairs-play.mjs';
import { createSuite as create15 } from './suites/lantern-touch-play.mjs';
import { createSuite as create16 } from './suites/pile-match-play.mjs';
import { createSuite as create17 } from './suites/bolt-boards-play.mjs';
import { createSuite as create18 } from './suites/jar-sort-play.mjs';
import { createSuite as create19 } from './suites/domino-run-play.mjs';
import { createSuite as create20 } from './suites/fruit-slice-play.mjs';
import { createSuite as create21 } from './suites/cut-along-play.mjs';
import { createSuite as create22 } from './suites/draw-pattern-play.mjs';
import { createSuite as create23 } from './suites/puddle-gobble-play.mjs';
import { createSuite as create24 } from './suites/swing-pals-play.mjs';
import { createSuite as create25 } from './suites/lift-it-play.mjs';
import { createSuite as create26 } from './suites/fossil-dig-play.mjs';
import { createSuite as create27 } from './suites/attic-finds-play.mjs';
import { createSuite as create28 } from './suites/attic-lever-play.mjs';
import { createSuite as create29 } from './suites/trackway-tales-play.mjs';
import { createSuite as create30 } from './suites/recipe-workshop-play.mjs';
import { createSuite as create31 } from './suites/sea-lift-play.mjs';
import { createSuite as create32 } from './suites/lost-layers-play.mjs';
import { createSuite as create33 } from './suites/block-garden-play.mjs';
import { createSuite as create34 } from './suites/sudoku-touch-play.mjs';
import { createSuite as create35 } from './suites/word-search-touch-play.mjs';
import { createSuite as create36 } from './suites/comeback-play.mjs';
import { createSuite as create37 } from './suites/bridges-touch-play.mjs';
import { createSuite as create38 } from './suites/picture-touch-play.mjs';
import { createSuite as create39 } from './suites/sing-barn-play.mjs';
import { createSuite as create40 } from './suites/number-trails-play.mjs';
import { createSuite as create41 } from './suites/fruit-sums-play.mjs';
import { createSuite as create42 } from './suites/buddies-play.mjs';
import { createSuite as create43 } from './suites/week-play.mjs';
import { createSuite as create44 } from './suites/orchard-play.mjs';
import { createSuite as create45 } from './suites/read-do-play.mjs';
import { createSuite as create46 } from './suites/friends-flow.mjs';
import { createSuite as create47 } from './suites/use-companion.mjs';
import { createSuite as create48 } from './suites/dress-flow.mjs';
import { createSuite as create49 } from './suites/home-first-run.mjs';
import { createSuite as create50 } from './suites/home-residents.mjs';
import { createSuite as create51 } from './suites/home-buttons.mjs';
import { createSuite as create52 } from './suites/home-last-place.mjs';
import { createSuite as create53 } from './suites/home-result.mjs';
import { createSuite as create54 } from './suites/home-flow.mjs';
import { createSuite as createArcadeHome } from './suites/home-arcade.mjs';
import { createSuite as create55 } from './suites/welcome-flow.mjs';
import { createSuite as create56 } from './suites/hatching-and-map.mjs';
import { createSuite as create57 } from './suites/grown-ups.mjs';
import { createSuite as create58 } from './suites/subject-places.mjs';
import { createSuite as create59 } from './suites/patterns.mjs';
import { createSuite as create60 } from './suites/memory.mjs';
import { createSuite as create61 } from './suites/trace-round.mjs';
import { createSuite as create62 } from './suites/robots.mjs';
import { createSuite as create63 } from './suites/conductor.mjs';
import { createSuite as create64 } from './suites/conductor-sign.mjs';
import { createSuite as create65 } from './suites/wardrobe7.mjs';
import { createSuite as create66 } from './suites/wardrobe9.mjs';
import { createSuite as create67 } from './suites/wardrobe6.mjs';
import { createSuite as create68 } from './suites/sticker-book.mjs';
import { createSuite as create69 } from './suites/expansion.mjs';
import { createSuite as create70 } from './suites/third.mjs';
import { createSuite as create71 } from './suites/feelings-batch.mjs';
import { createSuite as create72 } from './suites/feelings-ask.mjs';
import { createSuite as create73 } from './suites/feelings8.mjs';
import { createSuite as create74 } from './suites/fourth.mjs';
import { createSuite as create75 } from './suites/early.mjs';
import { createSuite as create76 } from './suites/arcade.mjs';
import { createSuite as create77 } from './suites/batch.mjs';
import { createSuite as create78 } from './suites/originals.mjs';
import { createSuite as create79 } from './suites/next.mjs';
import { createSuite as create80 } from './suites/encore-tricks.mjs';
import { createSuite as create81 } from './suites/creative-batch.mjs';
import { createSuite as create82 } from './suites/woods-batch.mjs';
import { createSuite as create83 } from './suites/shortlist-batch.mjs';
import { createSuite as create84 } from './suites/picnic-story.mjs';
import { createSuite as create85 } from './suites/woodland-story.mjs';
import { createSuite as create86 } from './suites/couch-play.mjs';
import { createSuite as create87 } from './suites/couch-beds.mjs';
import { createSuite as create88 } from './suites/couch-lanterns.mjs';
import { createSuite as create89 } from './suites/couch-pictures.mjs';
import { createSuite as create90 } from './suites/couch-harbors.mjs';
import { createSuite as create91 } from './suites/couch-words.mjs';
import { createSuite as create92 } from './suites/couch-conga.mjs';
import { createSuite as create93 } from './suites/couch-bridges.mjs';
import { createSuite as create94 } from './suites/couch-games.mjs';
import { createSuite as create95 } from './suites/couch-guide.mjs';
import { createSuite as create96 } from './suites/couch-course.mjs';
import { createSuite as create97 } from './suites/couch-names.mjs';
import { createSuite as create98 } from './suites/couch-settings.mjs';
import { createSuite as create99 } from './suites/couch-solo.mjs';
import { createSuite as create100 } from './suites/smoke.mjs';
import { createSuite as create101 } from './suites/phone-fit.mjs';
import { createSuite as create102 } from './suites/phone-games.mjs';
import { createSuite as create103 } from './suites/how-to-intro.mjs';
import { createSuite as create104 } from './suites/how-to-level-pick.mjs';
import { createSuite as create105 } from './suites/ready-for-adventure-play.mjs';
import { createSuite as create106 } from './suites/adventure-walk-play.mjs';
import { createSuite as create107 } from './suites/sand-table-play.mjs';
import { createSuite as create108 } from './suites/sense-detective-play.mjs';
import { createSuite as create109 } from './suites/shed-play.mjs';
import { createSuite as create110 } from './suites/gears-play.mjs';
import { createSuite as create111 } from './suites/meadow-play.mjs';
import { createSuite as create112 } from './suites/who-am-iplay.mjs';
import { createSuite as create113 } from './suites/look-it-up-play.mjs';
import { createSuite as create114 } from './suites/finger-demos.mjs';
import { createSuite as create115 } from './suites/conga-touch-play.mjs';
import { createSuite as create116 } from './suites/room-play.mjs';
import { createSuite as create117 } from './suites/island-shelf.mjs';
import { createSuite as create118 } from './suites/creations-room.mjs';
import { createSuite as create119 } from './suites/lands-tour.mjs';
import { createSuite as create120 } from './suites/journal-play.mjs';
import { createSuite as create121 } from './suites/clap-play.mjs';
import { createSuite as create122 } from './suites/clap-train-play.mjs';
import { createSuite as create123 } from './suites/clap-short-play.mjs';
import { createSuite as create124 } from './suites/clap-compare-play.mjs';
import { createSuite as create125 } from './suites/chain-play.mjs';
import { createSuite as create126 } from './suites/habitat-play.mjs';
import { createSuite as create127 } from './suites/profiles.mjs';
import { createSuite as create128 } from './suites/land-keys.mjs';
import { createSuite as create129 } from './suites/live-switch-play.mjs';
import { createSuite as create130 } from './suites/discovery-direct-next.mjs';
import { createSuite as create131 } from './suites/discovery-my-mix.mjs';
import { createSuite as create132 } from './suites/discovery-mix.mjs';

export const SUITES = [
  "relaywoods",
  "villagevote",
  "swapmeet",
  "littleloom",
  "world",
  "friends",
  "dress",
  "home",
  "welcome",
  "profiles",
  "discovery",
  "buddies",
  "singalong",
  "numbertrails",
  "storytheater",
  "marblejump",
  "logroll",
  "snowball",
  "brainbreak",
  "cuestudio",
  "foodweb",
  "fruitsums",
  "pyramid",
  "mossypath",
  "numbernook",
  "gemswap",
  "tilepairs",
  "lanterntouch",
  "sudokutouch",
  "jarsort",
  "pilematch",
  "boltboards",
  "dominorun",
  "fruitslice",
  "cutalong",
  "drawpattern",
  "puddlegobble",
  "swingpals",
  "liftit",
  "atticfinds",
  "atticlever",
  "lostlayers",
  "sealift",
  "recipeworkshop",
  "trackwaytales",
  "fossildig",
  "blockgarden",
  "landkeys",
  "livekeys",
  "wordsearchtouch",
  "bridgestouch",
  "comeback",
  "picturetouch",
  "congatouch",
  "week",
  "orchard",
  "readdo",
  "pattern",
  "memory",
  "letters",
  "robot",
  "wardrobe7",
  "wardrobe9",
  "wardrobe10",
  "seesawentry",
  "seesawmeasure",
  "wardrobe6",
  "conductor",
  "expansion",
  "third",
  "feelingsask",
  "ribbon",
  "feelingsbatch",
  "feelings8",
  "fourth",
  "early",
  "arcade",
  "batch",
  "originals",
  "next",
  "creative",
  "woods",
  "shortlist",
  "picnic",
  "woodland",
  "couch",
  "couchcourse",
  "couchnames",
  "couchsettings",
  "couchsolo",
  "couchbeds",
  "couchlanterns",
  "couchpictures",
  "couchharbors",
  "couchwords",
  "couchbridges",
  "couchconga",
  "couchgames",
  "grownups",
  "critternot",
  "feelpoke",
  "smoke",
  "phone",
  "phonefit",
  "howto",
  "howtolevel",
  "lookitup",
  "whoami",
  "shed",
  "gears",
  "meadow",
  "lens",
  "meltfreeze",
  "moonwindow",
  "sortingmachine",
  "helperhouse",
  "wordglue",
  "bondbeads",
  "exampleexpress",
  "movienight",
  "welcomeways",
  "sensedetective",
  "storyweaver",
  "sandtable",
  "adventurewalk",
  "readyadventure",
  "fingerdemo",
  "room",
  "lands",
  "island",
  "creations",
  "journal",
  "clap",
  "machines",
  "habitat",
  "stickers"
];
export const ALL_SUITES = [
  "relaywoods",
  "villagevote",
  "swapmeet",
  "littleloom",
  "world",
  "buddies",
  "singalong",
  "numbertrails",
  "storytheater",
  "marblejump",
  "logroll",
  "snowball",
  "brainbreak",
  "cuestudio",
  "foodweb",
  "fruitsums",
  "pyramid",
  "mossypath",
  "numbernook",
  "gemswap",
  "tilepairs",
  "lanterntouch",
  "sudokutouch",
  "jarsort",
  "pilematch",
  "boltboards",
  "dominorun",
  "fruitslice",
  "cutalong",
  "drawpattern",
  "puddlegobble",
  "swingpals",
  "liftit",
  "atticfinds",
  "atticlever",
  "lostlayers",
  "sealift",
  "recipeworkshop",
  "trackwaytales",
  "fossildig",
  "blockgarden",
  "landkeys",
  "livekeys",
  "wordsearchtouch",
  "bridgestouch",
  "comeback",
  "picturetouch",
  "congatouch",
  "week",
  "orchard",
  "readdo",
  "pattern",
  "memory",
  "letters",
  "robot",
  "wardrobe7",
  "wardrobe9",
  "wardrobe10",
  "seesawentry",
  "seesawmeasure",
  "wardrobe6",
  "conductor",
  "expansion",
  "third",
  "fourth",
  "early",
  "arcade",
  "batch",
  "originals",
  "next",
  "creative",
  "woods",
  "shortlist",
  "picnic",
  "woodland",
  "couch",
  "couchcourse",
  "couchnames",
  "couchsettings",
  "couchsolo",
  "couchbeds",
  "couchlanterns",
  "couchpictures",
  "couchharbors",
  "couchwords",
  "couchbridges",
  "couchconga",
  "couchgames",
  "grownups",
  "howto",
  "lookitup",
  "whoami",
  "shed",
  "gears",
  "meadow",
  "lens",
  "meltfreeze",
  "moonwindow",
  "sortingmachine",
  "helperhouse",
  "wordglue",
  "bondbeads",
  "exampleexpress",
  "movienight",
  "welcomeways",
  "sensedetective",
  "storyweaver",
  "sandtable",
  "adventurewalk",
  "readyadventure",
  "fingerdemo",
  "room",
  "lands",
  "island",
  "creations",
  "journal",
  "clap",
  "machines",
  "habitat",
  "stickers",
  "profiles",
  "phonefit"
];

export function createChecks(fixture) {
  const checks = {};
  const shared = { ...fixture };
  const install = group => {
    for (const [name, check] of Object.entries(group)) checks[name] = async (...args) => {
      const result = await check(...args);
      fixture.recordCheck?.(name);
      return result;
    };
  };
  // Cross-suite helpers are bound to this fixture; no page or save is shared across runs.
  for (const name of ["ribbonPlay","feelingsPoke","critterNotEntry","marbleJumpPlay","logRollPlay","snowballMergePlay","storyTheaterPlay","brainBreakPlay","cueStudioPlay","foodWebPlay","pyramidPlay","mossyPathPlay","numberNookPlay","gemSwapPlay","tilePairsPlay","lanternTouchPlay","pileMatchPlay","boltBoardsPlay","jarSortPlay","dominoRunPlay","fruitSlicePlay","cutAlongPlay","drawPatternPlay","puddleGobblePlay","swingPalsPlay","liftItPlay","fossilDigPlay","atticFindsPlay","atticLeverPlay","trackwayTalesPlay","recipeWorkshopPlay","seaLiftPlay","lostLayersPlay","blockGardenPlay","sudokuTouchPlay","wordSearchTouchPlay","comebackPlay","bridgesTouchPlay","pictureTouchPlay","singBarnPlay","numberTrailsPlay","fruitSumsPlay","buddiesPlay","weekPlay","orchardPlay","readDoPlay","friendsFlow","useCompanion","dressFlow","homeFirstRun","homeResidents","homeButtons","homeLastPlace","homeResult","homeArcade","homeMeadow","homeFlow","welcomeFlow","hatchingAndMap","grownUps","subjectPlaces","patterns","memory","traceRound","robots","conductor","conductorSign","wardrobe7","wardrobe9","wardrobe10","wardrobe6","stickerBook","expansion","third","feelingsBatch","feelingsAsk","feelings8","fourth","early","arcade","batch","originals","next","encoreTricks","creativeBatch","woodsBatch","shortlistBatch","picnicStory","woodlandStory","couchPlay","couchBeds","couchLanterns","couchPictures","couchHarbors","couchWords","couchConga","couchBridges","couchGames","couchGuide","couchCourse","couchNames","couchSettings","couchSolo","smoke","phoneFit","phoneGames","howToIntro","howToLevelPick","readyForAdventurePlay","adventureWalkPlay","sandTablePlay","senseDetectivePlay","shedPlay","gearsPlay","meadowPlay","lensPlay","wordGluePlay","whoAmIPlay","lookItUpPlay","fingerDemos","congaTouchPlay","roomPlay","islandShelf","creationsRoom","landsTour","journalPlay","clapPlay","clapTrainPlay","clapShortPlay","clapComparePlay","chainPlay","habitatPlay","profiles","landKeys","liveSwitchPlay","discoveryDirectNext","discoveryMyMix","discoveryMix"]) shared[name] = (...args) => checks[name](...args);
  install(create0(shared));
  install(create1(shared));
  install(create2(shared));
  install(create3(shared));
  install(create4(shared));
  install(create5(shared));
  install(create6(shared));
  install(create7(shared));
  install(create8(shared));
  install(create9(shared));
  install(create10(shared));
  install(create11(shared));
  install(create12(shared));
  install(create13(shared));
  install(create14(shared));
  install(create15(shared));
  install(create16(shared));
  install(create17(shared));
  install(create18(shared));
  install(create19(shared));
  install(create20(shared));
  install(create21(shared));
  install(create22(shared));
  install(create23(shared));
  install(create24(shared));
  install(create25(shared));
  install(create26(shared));
  install(create27(shared));
  install(create28(shared));
  install(create29(shared));
  install(create30(shared));
  install(create31(shared));
  install(create32(shared));
  install(create33(shared));
  install(create34(shared));
  install(create35(shared));
  install(create36(shared));
  install(create37(shared));
  install(create38(shared));
  install(create39(shared));
  install(create40(shared));
  install(create41(shared));
  install(create42(shared));
  install(create43(shared));
  install(create44(shared));
  install(create45(shared));
  install(create46(shared));
  install(create47(shared));
  install(create48(shared));
  install(create49(shared));
  install(create50(shared));
  install(create51(shared));
  install(create52(shared));
  install(create53(shared));
  install(createArcadeHome(shared));
  install(createMeadowHome(shared));
  install(create54(shared));
  install(create55(shared));
  install(create56(shared));
  install(create57(shared));
  install(create58(shared));
  install(create59(shared));
  install(create60(shared));
  install(create61(shared));
  install(create62(shared));
  install(create63(shared));
  install(create64(shared));
  install(create65(shared));
  install(create66(shared));
  install(createWardrobe10(shared));
  install(createSeesawEntry(shared));
  install(createSeesawMeasure(shared));
  install(create67(shared));
  install(create68(shared));
  install(create69(shared));
  install(create70(shared));
  install(create71(shared));
  install(create72(shared));
  install(create73(shared));
  install(create74(shared));
  install(create75(shared));
  install(create76(shared));
  install(create77(shared));
  install(create78(shared));
  install(create79(shared));
  install(create80(shared));
  install(create81(shared));
  install(create82(shared));
  install(create83(shared));
  install(create84(shared));
  install(create85(shared));
  install(create86(shared));
  install(create87(shared));
  install(create88(shared));
  install(create89(shared));
  install(create90(shared));
  install(create91(shared));
  install(create92(shared));
  install(create93(shared));
  install(create94(shared));
  install(create95(shared));
  install(create96(shared));
  install(create97(shared));
  install(create98(shared));
  install(create99(shared));
  install(create100(shared));
  install(create101(shared));
  install(create102(shared));
  install(create103(shared));
  install(create104(shared));
  install(create105(shared));
  install(create106(shared));
  install(create107(shared));
  install(create108(shared));
  install(create109(shared));
  install(create110(shared));
  install(create111(shared));
  install(create112(shared));
  install(create113(shared));
  install(create114(shared));
  install(create115(shared));
  install(create116(shared));
  install(create117(shared));
  install(create118(shared));
  install(create119(shared));
  install(create120(shared));
  install(create121(shared));
  install(create122(shared));
  install(create123(shared));
  install(create124(shared));
  install(create125(shared));
  install(create126(shared));
  install(create127(shared));
  install(create128(shared));
  install(create129(shared));
  install(create130(shared));
  install(create131(shared));
  install(create132(shared));
  install(createLens(shared));
  install(createMeltFreeze(shared));
  install(createMoonWindow(shared));
  install(createSortingMachine(shared));
  install(createHelperHouse(shared));
  install(createStoryWeaver(shared));
  install(createWordGlue(shared));
  install(createBondBeads(shared));
  install(createExampleExpress(shared));
  install(createRelayWoods(shared));
  install(createVillageVote(shared));
  install(createSwapMeet(shared));
  install(createLittleLoom(shared));
  install(createMovieNight(shared));
  install(createWelcomeWays(shared));
  return checks;
}

export async function runSuite(suite, fixture) {
  selectNames(suite, SUITES, 'BROWSER_SUITE');
  if (suite === 'clap' && process.env.CLAP_LEVELS !== undefined) selectValue(process.env.CLAP_LEVELS, ['6', '8', '9'], 'CLAP_LEVELS');
  if (suite === 'discovery' && process.env.DISCOVERY_ONLY !== undefined) selectValue(process.env.DISCOVERY_ONLY, ['direct-next', 'mix', 'my-mix'], 'DISCOVERY_ONLY');
  const completed = [];
  const { page, errors, ready, pickFirst, scene } = fixture;
  const { seesawMeasure, seesawEntry, relayWoodsPlay, ribbonPlay, feelingsPoke, critterNotEntry, marbleJumpPlay, logRollPlay, snowballMergePlay, storyTheaterPlay, brainBreakPlay, cueStudioPlay, foodWebPlay, pyramidPlay, mossyPathPlay, numberNookPlay, gemSwapPlay, tilePairsPlay, lanternTouchPlay, pileMatchPlay, boltBoardsPlay, jarSortPlay, dominoRunPlay, fruitSlicePlay, cutAlongPlay, drawPatternPlay, puddleGobblePlay, swingPalsPlay, liftItPlay, fossilDigPlay, atticFindsPlay, atticLeverPlay, trackwayTalesPlay, recipeWorkshopPlay, seaLiftPlay, lostLayersPlay, blockGardenPlay, sudokuTouchPlay, wordSearchTouchPlay, comebackPlay, bridgesTouchPlay, pictureTouchPlay, singBarnPlay, numberTrailsPlay, fruitSumsPlay, buddiesPlay, weekPlay, orchardPlay, readDoPlay, friendsFlow, useCompanion, dressFlow, homeFirstRun, homeResidents, homeButtons, homeLastPlace, homeResult, homeFlow, welcomeFlow, hatchingAndMap, grownUps, subjectPlaces, patterns, memory, traceRound, robots, conductor, conductorSign, wardrobe7, wardrobe9, wardrobe10, wardrobe6, stickerBook, expansion, third, feelingsBatch, feelingsAsk, feelings8, fourth, early, arcade, batch, originals, next, encoreTricks, creativeBatch, woodsBatch, shortlistBatch, picnicStory, woodlandStory, couchPlay, couchBeds, couchLanterns, couchPictures, couchHarbors, couchWords, couchConga, couchBridges, couchGames, couchGuide, couchCourse, couchNames, couchSettings, couchSolo, smoke, phoneFit, phoneGames, howToIntro, howToLevelPick, readyForAdventurePlay, adventureWalkPlay, sandTablePlay, senseDetectivePlay, shedPlay, gearsPlay, meadowPlay, lensPlay, wordGluePlay, bondBeadsPlay, villageVotePlay, swapMeetPlay, littleLoomPlay, movieNightPlay, exampleExpressPlay, welcomeWaysPlay, whoAmIPlay, lookItUpPlay, fingerDemos, congaTouchPlay, roomPlay, islandShelf, creationsRoom, landsTour, journalPlay, clapPlay, clapTrainPlay, clapShortPlay, clapComparePlay, chainPlay, habitatPlay, profiles, landKeys, liveSwitchPlay, discoveryDirectNext, discoveryMyMix, discoveryMix , storyWeaverPlay, meltFreezePlay, moonWindowPlay, sortingMachinePlay, helperHousePlay } = createChecks({ ...fixture, recordCheck: name => completed.push(name) });

  if (suite === 'all' || suite === 'world') { await hatchingAndMap(); await subjectPlaces(); }
  else if (suite === 'friends') await friendsFlow();
  else if (suite === 'dress') await dressFlow();
  else if (suite === 'home') await homeFlow();
  else if (suite === 'welcome') await welcomeFlow();
  else if (suite === 'profiles') { /* it starts from an empty device itself */ }
  else {
    // The chooser was built before the friend existed, so open it again: a hatched profile has a card to tap.
    await page.evaluate(() => { kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink' }, metAt: 'start' }], companion: 'pip0' }; kit.store.save(); kit.store.flush(); neo.go.start(); });
    await pickFirst(); await scene('MapScene');
  }
  if (suite === 'discovery') await ({ mix: discoveryMix, 'my-mix': discoveryMyMix }[process.env.DISCOVERY_ONLY] ?? discoveryDirectNext)();
  if (suite === 'all' || suite === 'buddies') await buddiesPlay();
  if (suite === 'all' || suite === 'singalong') await singBarnPlay();
  if (suite === 'all' || suite === 'numbertrails') await numberTrailsPlay();
  if (suite === 'all' || suite === 'storytheater') await storyTheaterPlay();
  if (suite === 'all' || suite === 'marblejump') await marbleJumpPlay();
  if (suite === 'all' || suite === 'logroll') await logRollPlay();
  if (suite === 'all' || suite === 'snowball') await snowballMergePlay();
  if (suite === 'all' || suite === 'brainbreak') await brainBreakPlay();
  if (suite === 'all' || suite === 'cuestudio') await cueStudioPlay();
  if (suite === 'all' || suite === 'foodweb') await foodWebPlay();
  if (suite === 'all' || suite === 'fruitsums') await fruitSumsPlay();
  if (suite === 'all' || suite === 'pyramid') await pyramidPlay();
  if (suite === 'all' || suite === 'mossypath') await mossyPathPlay();
  if (suite === 'all' || suite === 'numbernook') await numberNookPlay();
  if (suite === 'all' || suite === 'gemswap') await gemSwapPlay();
  if (suite === 'all' || suite === 'tilepairs') await tilePairsPlay();
  if (suite === 'all' || suite === 'lanterntouch') await lanternTouchPlay();
  if (suite === 'all' || suite === 'sudokutouch') await sudokuTouchPlay();
  if (suite === 'all' || suite === 'jarsort') await jarSortPlay();
  if (suite === 'all' || suite === 'pilematch') await pileMatchPlay();
  if (suite === 'all' || suite === 'boltboards') await boltBoardsPlay();
  if (suite === 'all' || suite === 'dominorun') await dominoRunPlay();
  if (suite === 'all' || suite === 'fruitslice') await fruitSlicePlay();
  if (suite === 'all' || suite === 'cutalong') await cutAlongPlay();
  if (suite === 'all' || suite === 'drawpattern') await drawPatternPlay();
  if (suite === 'all' || suite === 'puddlegobble') await puddleGobblePlay();
  if (suite === 'all' || suite === 'swingpals') await swingPalsPlay();
  if (suite === 'all' || suite === 'liftit') await liftItPlay();
  if (suite === 'all' || suite === 'atticfinds') await atticFindsPlay();
  if (suite === 'all' || suite === 'atticlever') await atticLeverPlay();
  if (suite === 'all' || suite === 'lostlayers') await lostLayersPlay();
  if (suite === 'all' || suite === 'sealift') await seaLiftPlay();
  if (suite === 'all' || suite === 'recipeworkshop') await recipeWorkshopPlay();
  if (suite === 'all' || suite === 'trackwaytales') await trackwayTalesPlay();
  if (suite === 'all' || suite === 'fossildig') await fossilDigPlay();
  if (suite === 'all' || suite === 'blockgarden') await blockGardenPlay();
  if (suite === 'all' || suite === 'landkeys') await landKeys();
  if (suite === 'all' || suite === 'livekeys') await liveSwitchPlay();
  if (suite === 'all' || suite === 'wordsearchtouch') await wordSearchTouchPlay();
  if (suite === 'all' || suite === 'bridgestouch') await bridgesTouchPlay();
  if (suite === 'all' || suite === 'comeback') await comebackPlay();
  if (suite === 'all' || suite === 'picturetouch') await pictureTouchPlay();
  if (suite === 'all' || suite === 'congatouch') await congaTouchPlay();
  if (suite === 'all' || suite === 'week') await weekPlay();
  if (suite === 'all' || suite === 'orchard') await orchardPlay();
  if (suite === 'all' || suite === 'readdo') await readDoPlay();
  if (suite === 'all' || suite === 'pattern') await patterns();
  if (suite === 'all' || suite === 'memory') await memory();
  if (suite === 'all' || suite === 'letters') {
    await traceRound(1, '', true); await traceRound(4, ''); await traceRound(7, ''); await traceRound(8, 'Zoë-Rose');
    await traceRound(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }
  if (suite === 'all' || suite === 'robot') await robots();
  if (suite === 'all' || suite === 'wardrobe7') await wardrobe7();
  if (suite === 'all' || suite === 'wardrobe9') await wardrobe9();
  if (suite === 'all' || suite === 'seesawmeasure') await seesawMeasure();
  if (suite === 'all' || suite === 'seesawentry') await seesawEntry();
  if (suite === 'all' || suite === 'wardrobe10') await wardrobe10();
  if (suite === 'all' || suite === 'wardrobe6') await wardrobe6();
  if (suite === 'all' || suite === 'conductor') await conductor();
  if (suite === 'all' || suite === 'expansion') await expansion();
  if (suite === 'all' || suite === 'third') await third();
  if (suite === 'feelingsask') await feelingsAsk();
  if (suite === 'ribbon') await ribbonPlay();
  if (suite === 'feelingsbatch') await feelingsBatch();
  if (suite === 'feelings8') await feelings8();
  if (suite === 'all' || suite === 'fourth') await fourth();
  if (suite === 'all' || suite === 'early') await early();
  if (suite === 'all' || suite === 'arcade') await arcade();
  if (suite === 'all' || suite === 'batch') await batch();
  if (suite === 'all' || suite === 'originals') await originals();
  if (suite === 'all' || suite === 'next') await next();
  if (suite === 'all' || suite === 'creative') await creativeBatch();
  if (suite === 'all' || suite === 'woods') await woodsBatch();
  if (suite === 'all' || suite === 'shortlist') await shortlistBatch();
  if (suite === 'all' || suite === 'picnic') await picnicStory();
  if (suite === 'all' || suite === 'woodland') await woodlandStory();
  if (suite === 'all' || suite === 'couch') await couchPlay();
  if (suite === 'all' || suite === 'couchcourse') await couchCourse();
  if (suite === 'all' || suite === 'couchnames') await couchNames();
  if (suite === 'all' || suite === 'couchsettings') await couchSettings();
  if (suite === 'all' || suite === 'couchsolo') await couchSolo();
  if (suite === 'all' || suite === 'couchbeds') await couchBeds();
  if (suite === 'all' || suite === 'couchlanterns') await couchLanterns();
  if (suite === 'all' || suite === 'couchpictures') await couchPictures();
  if (suite === 'all' || suite === 'couchharbors') await couchHarbors();
  if (suite === 'all' || suite === 'couchwords') await couchWords();
  if (suite === 'all' || suite === 'couchbridges') await couchBridges();
  if (suite === 'all' || suite === 'couchconga') await couchConga();
  if (suite === 'all' || suite === 'couchgames') await couchGames();
  if (suite === 'all' || suite === 'grownups') await grownUps();
  if (suite === 'critternot') await critterNotEntry();
  if (suite === 'feelpoke') await feelingsPoke();
  if (suite === 'smoke') await smoke();
  if (suite === 'all' || suite === 'phone' || suite === 'phonefit') await phoneFit();
  if (suite === 'phone') await phoneGames();
  if (suite === 'all' || suite === 'howto') await howToIntro();
  if (suite === 'all' || suite === 'howto' || suite === 'howtolevel') await howToLevelPick();
  if (suite === 'all' || suite === 'lookitup') await lookItUpPlay();
  if (suite === 'all' || suite === 'whoami') await whoAmIPlay();
  if (suite === 'all' || suite === 'shed') await shedPlay();
  if (suite === 'all' || suite === 'gears') await gearsPlay();
  if (suite === 'all' || suite === 'meadow') await meadowPlay();
  if (suite === 'all' || suite === 'lens') await lensPlay();
  if (suite === 'all' || suite === 'meltfreeze') await meltFreezePlay();
  if (suite === 'all' || suite === 'moonwindow') await moonWindowPlay();
  if (suite === 'all' || suite === 'sortingmachine') await sortingMachinePlay();
  if (suite === 'all' || suite === 'helperhouse') await helperHousePlay();
  if (suite === 'all' || suite === 'wordglue') await wordGluePlay();
  if (suite === 'all' || suite === 'bondbeads') await bondBeadsPlay();
  if (suite === 'all' || suite === 'exampleexpress') await exampleExpressPlay();
  if (suite === 'all' || suite === 'relaywoods') await relayWoodsPlay();
  if (suite === 'all' || suite === 'villagevote') await villageVotePlay();
  if (suite === 'all' || suite === 'swapmeet') await swapMeetPlay();
  if (suite === 'all' || suite === 'littleloom') await littleLoomPlay();
  if (suite === 'all' || suite === 'movienight') await movieNightPlay();
  if (suite === 'all' || suite === 'welcomeways') await welcomeWaysPlay();
  if (suite === 'all' || suite === 'sensedetective') await senseDetectivePlay();
  if (suite === 'all' || suite === 'storyweaver') await storyWeaverPlay();
  if (suite === 'all' || suite === 'sandtable') await sandTablePlay();
  if (suite === 'all' || suite === 'adventurewalk') await adventureWalkPlay();
  if (suite === 'all' || suite === 'readyadventure') await readyForAdventurePlay();
  if (suite === 'all' || suite === 'fingerdemo') await fingerDemos();
  if (suite === 'all' || suite === 'room') await roomPlay();
  if (suite === 'all' || suite === 'lands') await landsTour();
  if (suite === 'all' || suite === 'island') await islandShelf();
  if (suite === 'all' || suite === 'creations') await creationsRoom();
  if (suite === 'all' || suite === 'journal') await journalPlay();
  if (suite === 'all' || (suite === 'clap' && !process.env.CLAP_LEVELS)) await clapPlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '6'))) await clapTrainPlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '8'))) await clapComparePlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '9'))) await clapShortPlay();
  if (suite === 'all' || suite === 'machines') await chainPlay();
  if (suite === 'all' || suite === 'habitat') await habitatPlay();
  if (suite === 'stickers') await page.evaluate(() => {
    kit.store.data.profile.band = 'prek';
    for (let i = 0; i < 12; i++) kit.store.addSticker(['pattern-train', 'memory-match', 'letter-trails', 'robot-path'][i % 4], i + 1);
  });
  if (suite === 'all' || suite === 'stickers') await stickerBook();
  assert.equal(errors.length, 0, errors.join('\n'));
  // Last, because it wipes the device to start from nothing.
  if (suite === 'all' || suite === 'profiles') await profiles();


  assert.ok(completed.length > 0, `${suite}: no checks executed`);
  return completed;
}
