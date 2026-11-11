// BEGIN game imports (scripts/content-barrels.mjs)
import { VOICE as adventureWalkVoice } from '../games/adventure-walk/voice.ts';
import { VOICE as animalSnackVoice } from '../games/animal-snack/voice.ts';
import { VOICE as atticFindsVoice } from '../games/attic-finds/voice.ts';
import { VOICE as beatBuilderVoice } from '../games/beat-builder/voice.ts';
import { VOICE as blockGardenVoice } from '../games/block-garden/voice.ts';
import { VOICE as blockToppleVoice } from '../games/block-topple/voice.ts';
import { VOICE as blockTowerVoice } from '../games/block-tower/voice.ts';
import { VOICE as boltBoardsVoice } from '../games/bolt-boards/voice.ts';
import { VOICE as bondBeadsVoice } from '../games/bond-beads/voice.ts';
import { VOICE as bounceBackVoice } from '../games/bounce-back/voice.ts';
import { VOICE as bouncyLaunchVoice } from '../games/bouncy-launch/voice.ts';
import { VOICE as brainBreakVoice } from '../games/brain-break/voice.ts';
import { VOICE as bubblePopVoice } from '../games/bubble-pop/voice.ts';
import { VOICE as bugBuilderVoice } from '../games/bug-builder/voice.ts';
import { VOICE as bumperGardenVoice } from '../games/bumper-garden/voice.ts';
import { VOICE as caravanDaysVoice } from '../games/caravan-days/voice.ts';
import { VOICE as chainReactionVoice } from '../games/chain-reaction/voice.ts';
import { VOICE as circuitGardenVoice } from '../games/circuit-garden/voice.ts';
import { VOICE as clapSyllablesVoice } from '../games/clap-syllables/voice.ts';
import { VOICE as clockTowerVoice } from '../games/clock-tower/voice.ts';
import { VOICE as colorGardenVoice } from '../games/color-garden/voice.ts';
import { VOICE as critterCrossingVoice } from '../games/critter-crossing/voice.ts';
import { VOICE as critterSortVoice } from '../games/critter-sort/voice.ts';
import { VOICE as crosswordVoice } from '../games/crossword/voice.ts';
import { VOICE as cueStudioVoice } from '../games/cue-studio/voice.ts';
import { VOICE as cutAlongVoice } from '../games/cut-along/voice.ts';
import { VOICE as dayByDayVoice } from '../games/day-by-day/voice.ts';
import { VOICE as dominoRunVoice } from '../games/domino-run/voice.ts';
import { VOICE as dotLinkVoice } from '../games/dot-link/voice.ts';
import { VOICE as drawThePatternVoice } from '../games/draw-the-pattern/voice.ts';
import { VOICE as driftCardsVoice } from '../games/drift-cards/voice.ts';
import { VOICE as dropsJourneyVoice } from '../games/drops-journey/voice.ts';
import { VOICE as duckPondVoice } from '../games/duck-pond/voice.ts';
import { VOICE as ducklingParadeVoice } from '../games/duckling-parade/voice.ts';
import { VOICE as eggCatchVoice } from '../games/egg-catch/voice.ts';
import { VOICE as exampleExpressVoice } from '../games/example-express/voice.ts';
import { VOICE as farLightsVoice } from '../games/far-lights/voice.ts';
import { VOICE as feelingsFacesVoice } from '../games/feelings-faces/voice.ts';
import { VOICE as ferryJamVoice } from '../games/ferry-jam/voice.ts';
import { VOICE as fillDumpVoice } from '../games/fill-dump/voice.ts';
import { VOICE as fluffySalonVoice } from '../games/fluffy-salon/voice.ts';
import { VOICE as foodWebWorkshopVoice } from '../games/food-web-workshop/voice.ts';
import { VOICE as forecastDetectiveVoice } from '../games/forecast-detective/voice.ts';
import { VOICE as fossilDigVoice } from '../games/fossil-dig/voice.ts';
import { VOICE as frogHopVoice } from '../games/frog-hop/voice.ts';
import { VOICE as fruitSliceVoice } from '../games/fruit-slice/voice.ts';
import { VOICE as fruitSumsVoice } from '../games/fruit-sums/voice.ts';
import { VOICE as gadgetBenchVoice } from '../games/gadget-bench/voice.ts';
import { VOICE as gardenGrowVoice } from '../games/garden-grow/voice.ts';
import { VOICE as gardenRowsVoice } from '../games/garden-rows/voice.ts';
import { VOICE as gearGardenVoice } from '../games/gear-garden/voice.ts';
import { VOICE as gemSwapVoice } from '../games/gem-swap/voice.ts';
import { VOICE as goodnightRoomVoice } from '../games/goodnight-room/voice.ts';
import { VOICE as habitatHelpersVoice } from '../games/habitat-helpers/voice.ts';
import { VOICE as hatBandVoice } from '../games/hat-band/voice.ts';
import { VOICE as helperHouseVoice } from '../games/helper-house/voice.ts';
import { VOICE as inchwormVoice } from '../games/inchworm/voice.ts';
import { VOICE as islandBridgesVoice } from '../games/island-bridges/voice.ts';
import { VOICE as jarSortVoice } from '../games/jar-sort/voice.ts';
import { VOICE as jellyDrumsVoice } from '../games/jelly-drums/voice.ts';
import { VOICE as keepHouseVoice } from '../games/keep-house/voice.ts';
import { VOICE as lanternLightsVoice } from '../games/lantern-lights/voice.ts';
import { VOICE as lassoLoopsVoice } from '../games/lasso-loops/voice.ts';
import { VOICE as lemonadeStandVoice } from '../games/lemonade-stand/voice.ts';
import { VOICE as letterTrailsVoice } from '../games/letter-trails/voice.ts';
import { VOICE as liftItVoice } from '../games/lift-it/voice.ts';
import { VOICE as lightLabVoice } from '../games/light-lab/voice.ts';
import { VOICE as littleConductorVoice } from '../games/little-conductor/voice.ts';
import { VOICE as littleHelpersVoice } from '../games/little-helpers/voice.ts';
import { VOICE as littleLoomVoice } from '../games/little-loom/voice.ts';
import { VOICE as logRollVoice } from '../games/log-roll/voice.ts';
import { VOICE as logicGridVoice } from '../games/logic-grid/voice.ts';
import { VOICE as lookItUpVoice } from '../games/look-it-up/voice.ts';
import { VOICE as lostLayersVoice } from '../games/lost-layers/voice.ts';
import { VOICE as mailCarrierVoice } from '../games/mail-carrier/voice.ts';
import { VOICE as makerLaneVoice } from '../games/maker-lane/voice.ts';
import { VOICE as marbleJumpVoice } from '../games/marble-jump/voice.ts';
import { VOICE as marketStallVoice } from '../games/market-stall/voice.ts';
import { VOICE as meadowPensVoice } from '../games/meadow-pens/voice.ts';
import { VOICE as measuringPostVoice } from '../games/measuring-post/voice.ts';
import { VOICE as meltFreezeVoice } from '../games/melt-freeze/voice.ts';
import { VOICE as memoryDeskVoice } from '../games/memory-desk/voice.ts';
import { VOICE as memoryMatchVoice } from '../games/memory-match/voice.ts';
import { VOICE as monsterMunchVoice } from '../games/monster-munch/voice.ts';
import { VOICE as moonWindowVoice } from '../games/moon-window/voice.ts';
import { VOICE as mossyPathVoice } from '../games/mossy-path/voice.ts';
import { VOICE as movieNightVoice } from '../games/movie-night/voice.ts';
import { VOICE as notAlwaysVoice } from '../games/not-always/voice.ts';
import { VOICE as noticeBoardVoice } from '../games/notice-board/voice.ts';
import { VOICE as numberNookVoice } from '../games/number-nook/voice.ts';
import { VOICE as numberTrailsVoice } from '../games/number-trails/voice.ts';
import { VOICE as oppositesVoice } from '../games/opposites/voice.ts';
import { VOICE as orchardRowsVoice } from '../games/orchard-rows/voice.ts';
import { VOICE as owlWalkVoice } from '../games/owl-walk/voice.ts';
import { VOICE as paintMixerVoice } from '../games/paint-mixer/voice.ts';
import { VOICE as patternTrainVoice } from '../games/pattern-train/voice.ts';
import { VOICE as peekabooBarnVoice } from '../games/peekaboo-barn/voice.ts';
import { VOICE as peekaroundIslandVoice } from '../games/peekaround-island/voice.ts';
import { VOICE as pegGardenVoice } from '../games/peg-garden/voice.ts';
import { VOICE as penguinSlideVoice } from '../games/penguin-slide/voice.ts';
import { VOICE as petKitchenVoice } from '../games/pet-kitchen/voice.ts';
import { VOICE as petSaysVoice } from '../games/pet-says/voice.ts';
import { VOICE as photoSafariVoice } from '../games/photo-safari/voice.ts';
import { VOICE as pictureGraphVoice } from '../games/picture-graph/voice.ts';
import { VOICE as pictureLogicVoice } from '../games/picture-logic/voice.ts';
import { VOICE as pileMatchVoice } from '../games/pile-match/voice.ts';
import { VOICE as pixelPicturesVoice } from '../games/pixel-pictures/voice.ts';
import { VOICE as playdateWorkshopVoice } from '../games/playdate-workshop/voice.ts';
import { VOICE as pondCongaVoice } from '../games/pond-conga/voice.ts';
import { VOICE as pondTypingVoice } from '../games/pond-typing/voice.ts';
import { VOICE as puddleGobbleVoice } from '../games/puddle-gobble/voice.ts';
import { VOICE as puddleLensVoice } from '../games/puddle-lens/voice.ts';
import { VOICE as puppetStageVoice } from '../games/puppet-stage/voice.ts';
import { VOICE as puzzlePalsVoice } from '../games/puzzle-pals/voice.ts';
import { VOICE as pyramidSolitaireVoice } from '../games/pyramid-solitaire/voice.ts';
import { VOICE as quickTricksVoice } from '../games/quick-tricks/voice.ts';
import { VOICE as rainGardenVoice } from '../games/rain-garden/voice.ts';
import { VOICE as rainbowFingersVoice } from '../games/rainbow-fingers/voice.ts';
import { VOICE as rampRaceVoice } from '../games/ramp-race/voice.ts';
import { VOICE as readDoVoice } from '../games/read-do/voice.ts';
import { VOICE as readyForAdventureVoice } from '../games/ready-for-adventure/voice.ts';
import { VOICE as recipeWorkshopVoice } from '../games/recipe-workshop/voice.ts';
import { VOICE as relayWoodsVoice } from '../games/relay-woods/voice.ts';
import { VOICE as rhymeTimeVoice } from '../games/rhyme-time/voice.ts';
import { VOICE as rhythmNeighborsVoice } from '../games/rhythm-neighbors/voice.ts';
import { VOICE as ribbonWorkshopVoice } from '../games/ribbon-workshop/voice.ts';
import { VOICE as riverTabletsVoice } from '../games/river-tablets/voice.ts';
import { VOICE as robotPathVoice } from '../games/robot-path/voice.ts';
import { VOICE as roundupVoice } from '../games/roundup/voice.ts';
import { VOICE as ruleMachineVoice } from '../games/rule-machine/voice.ts';
import { VOICE as sandTableVoice } from '../games/sand-table/voice.ts';
import { VOICE as scoopShopVoice } from '../games/scoop-shop/voice.ts';
import { VOICE as seaLiftVoice } from '../games/sea-lift/voice.ts';
import { VOICE as secondChanceShedVoice } from '../games/second-chance-shed/voice.ts';
import { VOICE as secretCodeVoice } from '../games/secret-code/voice.ts';
import { VOICE as seedTravelersVoice } from '../games/seed-travelers/voice.ts';
import { VOICE as seesawBalanceVoice } from '../games/seesaw-balance/voice.ts';
import { VOICE as senseDetectiveVoice } from '../games/sense-detective/voice.ts';
import { VOICE as shapeBuddiesVoice } from '../games/shape-buddies/voice.ts';
import { VOICE as shapeSorterVoice } from '../games/shape-sorter/voice.ts';
import { VOICE as shellRowsVoice } from '../games/shell-rows/voice.ts';
import { VOICE as singAlongBarnVoice } from '../games/sing-along-barn/voice.ts';
import { VOICE as sinkFloatVoice } from '../games/sink-float/voice.ts';
import { VOICE as sizeParadeVoice } from '../games/size-parade/voice.ts';
import { VOICE as snowballMergeVoice } from '../games/snowball-merge/voice.ts';
import { VOICE as songMakerVoice } from '../games/song-maker/voice.ts';
import { VOICE as sortingMachineVoice } from '../games/sorting-machine/voice.ts';
import { VOICE as soundGardenVoice } from '../games/sound-garden/voice.ts';
import { VOICE as speciesComebackVoice } from '../games/species-comeback/voice.ts';
import { VOICE as spinnerFairVoice } from '../games/spinner-fair/voice.ts';
import { VOICE as splishSplashVoice } from '../games/splish-splash/voice.ts';
import { VOICE as sproutShuffleVoice } from '../games/sprout-shuffle/voice.ts';
import { VOICE as stampStudioVoice } from '../games/stamp-studio/voice.ts';
import { VOICE as stopAndGoVoice } from '../games/stop-and-go/voice.ts';
import { VOICE as storyStepsVoice } from '../games/story-steps/voice.ts';
import { VOICE as storyWeaverVoice } from '../games/story-weaver/voice.ts';
import { VOICE as sudokuGardenVoice } from '../games/sudoku-garden/voice.ts';
import { VOICE as swapMeetVoice } from '../games/swap-meet/voice.ts';
import { VOICE as swingPalsVoice } from '../games/swing-pals/voice.ts';
import { VOICE as tangramTownVoice } from '../games/tangram-town/voice.ts';
import { VOICE as teddyDoctorVoice } from '../games/teddy-doctor/voice.ts';
import { VOICE as thoughtBubblesVoice } from '../games/thought-bubbles/voice.ts';
import { VOICE as tideLineVoice } from '../games/tide-line/voice.ts';
import { VOICE as tilePairsVoice } from '../games/tile-pairs/voice.ts';
import { VOICE as timelineTrailVoice } from '../games/timeline-trail/voice.ts';
import { VOICE as trackwayTalesVoice } from '../games/trackway-tales/voice.ts';
import { VOICE as treasureMapVoice } from '../games/treasure-map/voice.ts';
import { VOICE as villageVoteVoice } from '../games/village-vote/voice.ts';
import { VOICE as vineSnipVoice } from '../games/vine-snip/voice.ts';
import { VOICE as waterRoadVoice } from '../games/water-road/voice.ts';
import { VOICE as weatherWardrobeVoice } from '../games/weather-wardrobe/voice.ts';
import { VOICE as welcomeWaysVoice } from '../games/welcome-ways/voice.ts';
import { VOICE as whoAmIVoice } from '../games/who-am-i/voice.ts';
import { VOICE as wordGlueVoice } from '../games/word-glue/voice.ts';
import { VOICE as wordMonstersVoice } from '../games/word-monsters/voice.ts';
import { VOICE as wordSearchVoice } from '../games/word-search/voice.ts';
// END game imports

/**
 * Every line the game speaks, keyed by id. Arrays are variations picked at random.
 * `{name}` is the child's name; other `{words}` are filled in by the caller.
 * This is also the script for recording parents' voices later.
 *
 * A game's own lines live in src/games/<id>/voice.ts; the lines here are shared by the shell, the pet, stories,
 * couch play and more than one game. scripts/content-barrels.mjs writes the two marked blocks.
 */
export const SHARED = {
  'discovery.offer': ['Next game: {title}. Or choose another.'],
  'discovery.another': ['Another game. {title}.'],
  'discovery.empty': ['You can play again, or go home.'],
  'mix.offer': ['Little surprises! Games in a row.'],
  'mix.stop': ['{title}.'],
  'mix.next': ['Next: {title}.'],
  'mix.skip': ["Okay, we'll hop over that one."],
  'mix.last': ["All done! Let's see."],
  'mix.end': ['That was Little surprises!'],
  'mix.end.quiet': ['We can play these another time.'],
  'mix.changed': ["That one can't come today. Here's the next."],
  'mix.in': ['{title} is in.'],
  'mix.out': ['{title} can rest.'],
  'mix.full': ["That's five. Take one out first."],
  'mix.one': ['A mix needs one game.'],
  'mix.reset': ['Back to Little surprises.'],
  'couch.how.gem-swap': ['Move to a gem and choose it, then choose its neighbour. Make a line of three matching shapes. The gems above fall into the gaps. Clear the tray. The left button takes a swap back.'],
  'couch.how.tile-pairs': ['Move between the free tiles. Choose two with the same picture to remove them. A tile needs a clear top and an open left or right side. Clear the stack.'],
  'couch.island': ['This puzzle plays with a keyboard or a controller.'],
  'couch.next': ['Another lantern is lit! What shall we play next?'],
  'couch.done': ['Six lanterns! We made a whole trip together.'],
  'couch.turn': ['{who}, it is your turn!'],
  'couch.course.done': ['All five ponds! What a slider!'],
  'couch.course.clouds': ['All twelve clouds! What a bounce!'],
  'couch.course.beds': ['Six beds in bloom! What a gardener!'],
  'couch.course.bigbeds': ['Three big beds in bloom! What a puzzle!'],
  'couch.course.lanterns': ['Five ponds, every lantern aglow!'],
  'couch.course.pictures': ['Three pictures, all found!'],
  'couch.course.bigpictures': ['Both big pictures, found!'],
  'couch.course.harbors': ['Five busy harbors, all clear!'],
  'couch.course.words': ['Three grids, every word found!'],
  'couch.course.bigwords': ['Both big grids, every word found!'],
  'couch.course.bridges': ['Five seas, every island joined!'],
  'couch.course.joined': ['Five joined seas, and not one group cut off!'],
  'couch.course.conga': ['Four ponds, every bite gobbled!'],
  'couch.course.typing': ['Three ponds, every bubble popped!'],
  'couch.course.sunbeams': ['Five boards, every flower awake!'],
  'couch.course.codedoors': ['Five doors, every code cracked!'],
  'couch.course.best': ['A new best! Look at that sliding!'],
  'couch.keepsake': ['A keepsake for your first trip: Lantern Night!'],
  // Couch play: what each game asks of the players, one variant so the caption matches the speech.
  'couch.how.penguin-slide': ['Slide the penguin with the stick or arrow keys. It only stops when it bumps into something. Collect every fish!'],
  'couch.how.bouncy-launch': ['Push down to squash the spring, press the bottom button to launch, and land on the star cloud!'],
  'couch.how.memory-match': ['Move the highlight, press the bottom button to turn a card over, and find the pairs! In a face-off, a match earns another turn.'],
  'couch.how.rhythm-neighbors': ['Listen to the bird and the frog reply, then play it back with the left and right buttons. Send it with the bottom button!'],
  'couch.how.light-lab': ['Move the highlight to a mirror and press the bottom button to turn it. Carry the sunbeam to every flower, then shine the sun!'],
  'couch.how.secret-code': ['Pick stones with left and right and press the bottom button to place them. When every slot is full, press again to turn the key. Use the clues to crack the code!'],
  'couch.how.peg-garden': ['Hold left or right to swing the launcher, and press the bottom button to drop a pearl. Hit the numbered flowers!'],
  'couch.how.bumper-garden': ['Flip the ladybug back up! With two controllers, the first player flips the left flipper and the second flips the right. Bloom the flowers together!'],
  'couch.how.bounce-back': ['Move your paddle up and down with the stick. Keep the ball bouncing together, or in a face-off send it past the other paddle for a goal!'],
  'couch.how.pattern-train': ['Look at the train. Move the highlight with left and right, and press the bottom button to choose what comes in the glowing space!'],
  'couch.how.egg-catch': ['Slide the basket left and right with the stick or arrow keys, and catch the falling eggs! With two controllers, you both steer the same basket.'],
  'couch.how.robot-path': ['Move the stick to add steps for the robot, then press the bottom button to play them. The left button takes the last step back out. Reach the star!'],
  'couch.how.frog-hop': ['Move the highlight along the lily pads and press the bottom button to choose where the frog lands. When number cards show up, choose the right one!'],
  'couch.how.sudoku-garden': ['Fill the bed so every row, column and box holds each number once. Move around with the stick, press the bottom button to open the number tray, and press it again to place a number. The left button takes a number back out.'],
  'couch.how.lantern-lights': ['Press a lantern to flip it and the four lanterns beside it. Move with the stick, press with the bottom button, and light every lantern on the pond. The left button takes the last press back.'],
  'couch.how.picture-logic': ['Fill the squares the numbers allow, and a picture appears. Press the bottom button to fill, and hold it while you move to paint a run.'],
  'couch.how.ferry-jam': ['Slide the boats aside so the red ferry reaches the dock. Move between boats with the stick, press the bottom button to pick one up, slide it along its lane, and press again to set it down.'],
  'couch.how.pond-typing': ['A bubble waits on the pond. Press the key it shows, and it pops.'],
  'couch.how.word-search': ['Find the hidden words. Move to a word\'s first letter and press the bottom button, move to its last letter, and press again.'],
  'couch.how.pond-conga': ['Steer the ducklings to each bit of duck food in turn with the stick: peas, sweetcorn or oats. If they bump something, the whole line turns about. Gobble every bite in the fewest steps!'],
  'couch.how.island-bridges': ['Give each island as many planks as its number, with no crossing. Press the bottom button on an island, then push toward a neighbor.'],
  'couch.how.sink-float': ['Will it float, or will it sink? Choose with left and right, press the bottom button, and watch the water to find out!'],
  // Couch versions of lines that tell a touch player to tap or pull.
  'couch.ferry.start': ['The harbor is jammed! Choose a boat, pick it up with the bottom button, slide it, and set it down. Free the red ferry.'],
  'couch.slide.go': ['Use the stick or arrow keys to slide the penguin. It only stops when it bumps into something!'],
  'couch.slide.stuck': ['Oh no, the penguin cannot reach the fish from here. Press the left button to undo a slide, or pause to start the pond again.'],
  'couch.neighbors.rhythm': ['Listen to the bird and the frog reply. Now play the frog part with the left and right buttons, keeping the short and long gaps. Press the bottom button when ready.'],
  'couch.light.two': ['Wake up both flowers with one sunbeam. Turn the mirrors, then shine the sun!'],
  'couch.peg.number': ['Hold left or right to aim, then press the bottom button. Hit {n}!'],
  'couch.peg.order': ['Hit 1, then 2, then 3! Hold left or right to aim, then press the bottom button.'],
  'couch.launch.short': ['A little farther! Push down for more power.'],
  'couch.launch.long': ['Whoa, too far! Push up for less power.'],
  'couch.egg.catch': ['Use the stick or arrow keys to slide the basket under the falling eggs!'],
  'couch.robot.start': ['Help the robot reach the star! Move the stick to add steps, then press the bottom button to play.'],
  'couch.how.treasure-map': ['Move the ring to the square the map asks for, then press the bottom button to dig. Find the column first, then the row!'],
  'couch.map.steps': ['Start where the pet is. Go {dirs}. Move the ring to where you end up, and press the bottom button!'],
  'couch.how.garden-rows': ['Move the ring to an empty spot and press the bottom button. Pick a flower, and press again to plant it. No flower may repeat in a row or a column!'],
  'couch.rows.rows': ['Every row of the flower bed needs one of each flower. Move the ring to an empty spot, press the bottom button, pick a flower and press again to plant it!'],
  'couch.rows.both': ['One of each flower in every row, and in every column too! Move the ring to an empty spot, press, pick a flower and press again.'],
  'couch.rows.stuck': ['Hmm, no flower fits in the glowing spot. Ring a flower you planted and press the bottom button to take it out, then try another.'],
  'couch.rows.hint-fix': ['This flower does not belong here. Ring it and press the bottom button to take it out, then try a different one.'],
  'couch.map.clues': ['The {firstThing} is {first}. The {secondThing} is {second}. Move the ring to where the two clues meet, and press the bottom button!'],
  'couch.hop.gap': ['How many hops from {n} to {m}? Move to a number card, then press the bottom button.'],
  'couch.sink.guess': ['Will the {thing} float or sink? Choose with left and right, then press the bottom button!'],
  'parent.ask': ['That one is for grown-ups. Ask a grown-up to help!'],
  'start.hi':['Hi, {name}!', 'Hello, {name}!', 'Yay, {name} is here!'],
  'hub.pick': ['What should we play?', 'Pick a game!', "Let's play!"],
  'hub.again': ['What next?', 'Ooh, what now?'],
  'map.pick': ['Where shall we go, {pet}? Tap a place on our island!'],
  'map.birthday': ['Happy birthday, {pet}! We are growing up together. Look, new games on our island!'],
  'island.home': ['Home! All your games are here.'],
  'land.try': ['Have you tried this one?', 'How about this one?', 'Try this one!'],
  'land.bigger': ['These games are for bigger kids. Try one if you like!'],
  'land.yours': ['Back to your games!'],
  'land.lantern-lake': ['Lantern Lake! Quiet puzzles for grown-ups.'],
  'place.lap': ['Puddle Lagoon!'],
  'place.toddler': ['Daisy Meadow!'],
  'place.preschool': ['Bumpy Hills!'],
  'place.prek': ['Starry Peak!'],
  'place.school': ['Wonder Woods!'],
  'place.grownup': ['Lantern Lodge!'],
  'place.subjects': ['Pick a picture to find games! Swipe or tap an arrow for more.'],
  'subject.senses': ['Bubble Beach! Popping, bouncing, and splashing.'],
  'subject.music': ['Music Mountain! Songs and sounds.'],
  'subject.art': ['Painted Canyon! Pictures and making.'],
  'subject.animals': ['Barnyard! Animal friends.'],
  'subject.numbers': ['Counting Cove! Counting and sharing.'],
  'subject.everyday': ['Cozy Village! Helping and pretend play.'],
  'subject.shapes': ['Rainbow Meadow! Colors and shapes.'],
  'subject.puzzles': ['Puzzle Peaks! Patterns and puzzles.'],
  'subject.stories': ['Story Grove! Letters and stories.'],
  'subject.science': ['Tinker Lab! Try things and discover.'],
  'place.more': ['Swipe to see more games!'],
  'hatch.tap': ['Someone is inside! Tap the egg!'],
  'hatch.color': ['Hello, little sprout! Pick a color for your friend, then tap the green arrow.'],
  'hatch.name': ['What shall we call our friend? Tap a name to hear it, then tap the green arrow.'],
  'hatch.try-name': ['{pet}!'],
  'hatch.hello': ['Hello, {pet}! Let us explore our island!'],
  'stickers.place': ['Drag a sticker onto the picture! Put it back in the tray to move it away.'],
  'stickers.meadow': ['A meadow!'],
  'stickers.beach': ['The beach!'],
  'stickers.farm': ['A farm!'],
  'stickers.sea': ['Under the sea!'],
  'stickers.space': ['Outer space!'],
  'tower.crash': ['Crash!', 'Tumble, tumble!', 'Boom!'],
  'tower.tall': ['Too tall! Tap the tower to take the top block off.'],
  'tower.stand-yes': ['You guessed it! The middle of its top blocks is over the block below, so it stands.'],
  'tower.stand-no': ['That is why the other one fell: the middle of its top blocks was past the edge of the block below.'],

  'map.picnic': ['The windy picnic! Juniper needs our help.'],
  'map.room': ['{pet} has a treehouse! Let us go and see.'],
  'room.hello': ['Welcome to the treehouse! Tap things to play with them, or drag them to move them.'],
  'room.bed': ['Zzz. A cozy little nap.', 'Nighty night. Zzz.'],
  'room.lamp-on': ['Light on!'],
  'room.lamp-off': ['Lights out. So cozy.'],
  'room.rug': ['Dance time!', 'Boing, boing, boing!'],
  'room.shelf': ['What a good story!', 'Reading a book.'],
  'room.plant': ['Splash! The plant is happy.', 'A drink for the plant!'],
  'room.frame': ['Pick a sticker to hang on the wall!'],
  'room.no-stickers': ['Play a game to win a sticker for the wall!'],
  'room.hung': ['What a lovely picture!', 'It looks great on the wall!'],
  'room.cleared': ['The frame is empty again.'],
  'room.tidy': ['All tidy!', 'Everything is back in its place.'],
  'room.picture': ['What a lovely picture you made!', 'Look at your picture!'],
  'room.picture-empty': ['Make a picture in Stamp Studio or Rainbow Fingers, and it can hang here!'],
  'room.tune': ['Listen to the song you made!', 'Your very own song!'],
  'room.friends': ['Who is in the nest? Your friends!'],
  'play.library': ['Story time! Let us look at the books.'],
  'library.hello': ['Your books! Tap one: your journal, or a story.'],
  'library.journal': ['Your journal!'],
  'friends.pick': ['Tap a friend to say hello. Tap the green button, and that friend comes with you!'],
  'friends.name': ['{pet}!'],
  'friends.come': ['{pet} is coming with you!'],
  'friends.already': ['{pet} is already with you!'],
  'friends.dress': ['Let’s dress up {pet}!'],
  'dress.pick': ['Tap a picture to put it on {pet}. Tap it again to take it off.'],
  'dress.on.crown': ['A crown for {pet}!'],
  'dress.on.scarf': ['A cozy scarf for {pet}!'],
  'dress.on.sunhat': ['A sun hat for {pet}!'],
  'dress.on.sunglasses': ['Sunglasses for {pet}!'],
  'dress.on.raincoat': ['A raincoat for {pet}!'],
  'dress.on.umbrella': ['An umbrella for {pet}!'],
  'dress.on.beanie': ['A warm hat for {pet}!'],
  'dress.on.boots': ['Boots for {pet}!'],
  'dress.on.mittens': ['Mittens for {pet}!'],
  'dress.off': ['Off it comes!'],
  'dress.none': ['All off!'],
  'home.hello': ['{pet} is home!', 'Hello! {pet} is home!'],
  'home.play': ['Let’s play with {pet}!'],
  'home.explore': ['Let’s explore!'],
  'home.who': ['Who’s playing?'],
  'home.continue': ['Let’s get ready for our new friend!'],
  // Welcome a New Friend (RW07, docs/rework/WELCOME-ADVENTURE.md#the-steps).
  'welcome.invite': ['Someone new is coming to live with us! Let’s get ready.'],
  'welcome.ask.pretty': ['Our new friend needs something pretty over their bed. Make them a picture!'],
  'welcome.ask.yummy': ['Our new friend is hungry. Share the sandwich so all four of us get the same!'],
  'welcome.ask.yummy-prek': ['Our new friend loves fruit salad. Make it twice as big so there’s enough for two!'],
  'welcome.done.pretty': ['Look, it’s hanging over the basket!'],
  'welcome.done.yummy': ['Four plates, all the same. Yum!'],
  'welcome.done.yummy-prek': ['A bowl big enough for two. Yum!'],
  'welcome.ask.song': ['Let’s make a song to say hello. Tap the jellies to make your own tune!'],
  'welcome.done.song': ['That’s our hello song!'],
  'welcome.done.song-hum': ['We’ll hum hello together!'],
  'welcome.here': ['Everything is ready. Here comes our new friend!'],
  'welcome.name': ['Our new friend wants a name. Tap a name to hear it, then tap the green arrow.'],
  'welcome.joined': ['{new} lives here now!'],
  'welcome.full': ['So many friends live here already! Our new friend came to say hello.'],
  'welcome.bed': ['This is {new}’s cozy bed, with your picture over it.'],
  'welcome.bed-empty': ['{new}’s bed is ready whenever {new} wants a nap.'],
  'welcome.back': ['Back home!'],
  'explore.pick': ['What shall we do? Tap a picture!'],
  'explore.where': ['Where shall we go? Tap a place!'],
  'explore.places': ['Places!'],
  'explore.favorites': ['Your favorites!'],
  'explore.all': ['All the games!'],
  'explore.family': ['Family play!'],
  'explore.other-age': ['This one is for {who}.'],
  'explore.no-favorites': ['No favorites yet. Tap the heart after a game you love, and it waits here!'],
  'explore.family-pads': ['Family play needs a controller or a keyboard. Grown-ups, grab one and play together!'],
  'explore.page': ['{n} more!', 'Here are {n} more!'],
  'explore.others': ['Games for other ages!'],
  'explore.mine': ['Back to your games!'],
  'daily.go': ['Today’s six!'],
  'daily.open': ["Today's six games! Tap one to play."],
  'daily.done': ['You played all six today! Play one again, or tap the tiles for every game.'],
  // The Arcade's lines stay on device speech until a clip render takes the `arcade` prefix (scripts/voice-clips/clips.mjs).
  'arcade.open': ['The arcade! Watch a game play, then tap it to play.'],
  'arcade.mine': ['Games for you!'],
  'arcade.played': ['Games you played before!'],
  'arcade.topics': ['What kind of game? Tap a picture!'],
  'arcade.empty': ['Nothing here yet. Play a game, and it waits here!'],
  'result.back': ['Back to {place}!'],
  'nav.home': ['Home!'],
  'nav.back': ['Back!'],
  'play.ball': ['Throw the ball for {pet}! Tap the ball.'],
  'play.fetch': ['Got it!', '{pet} found the ball!', 'Again, again!', 'Fetch!'],
  'species.sprout': ['A sprout!'],
  'species.river': ['A river!'],
  'species.glider': ['A cloud glider!'],
  // RW14 slice 2: a location's resident says hello when poked, before its suggestion; her own friend, where it is the resident's species, says it is home.
  'resident.tote': ['Hello! I am Tote. I live here by the rock pools.'],
  'resident.trill': ['Hello! I am Trill. I sing up here in the cloud forest.'],
  'resident.dapple': ['Hello! I am Dapple. I climb the painted rocks.'],
  'resident.bramble': ['Hello! I am Bramble. I live in the hedge by the lane.'],
  'resident.lumen': ['Hello! I am Lumen. I glow in the night garden.'],
  'resident.mossback': ['Hello! I am Mossback. I live in the cave by the workshop.'],
  'location.home': ['{pet} is home! This is where {pet} comes from.'],
  'room.tune-empty': ['Make a song in Song Maker, and it can play here!'],
  'room.swap': ['Here is the one from before!'],
  'room.taken-down': ['All clear! Tap the back arrow to put it up again.'],
  'journal.hello': ['Your discoveries! Tap one to hear about it.'],
  'journal.new': ['A new discovery for your journal!', 'Look, something new for your journal!'],
  'journal.hint': ['Not found yet! Tap the green arrow to go and find it.'],
  'journal.sink.duck': ['The duck floats! Splash!'],
  'journal.sink.boat': ['The boat floats on top of the water.'],
  'journal.sink.ball': ['The ball floats and bobs about.'],
  'journal.sink.leaf': ['A leaf floats, light as a feather.'],
  'journal.sink.apple': ['Surprise! An apple floats.'],
  'journal.sink.rock': ['The rock sinks, all the way to the bottom.'],
  'journal.sink.key': ['The key sinks down, down, down.'],
  'journal.sink.coin': ['Surprise! A little coin sinks.'],
  'journal.sink.spoon': ['A spoon sinks, even though it is small.'],
  'journal.sink.feather': ['A feather floats, light and soft.'],
  'journal.sink.log': ['Surprise! A big wooden log floats.'],
  'journal.sink.ice': ['Surprise! A hard ice cube floats.'],
  'journal.sink.marble': ['The marble sinks, plop, to the bottom.'],
  'journal.sink.paperclip': ['Surprise! A tiny paper clip sinks.'],
  'journal.melt.ice': ['The ice melts in the warm sun and goes hard again in the cold.'],
  'journal.melt.butter': ['The butter melts when it is warm and goes hard again when it is cool.'],
  'journal.melt.chocolate': ['The chocolate melts when it is warm and goes hard again when it is cool.'],
  'journal.melt.stays': ['Some things, like a stone and a spoon, stay the same, warm or cool.'],
  'journal.kitchen.half': ['Two halves make a whole. Put the two halves of a sandwich together and it is the whole sandwich again.'],
  'journal.kitchen.quarter': ['Two quarters make a half. Two quarter pieces cover the same as one half.'],
  'journal.kitchen.third': ['Three thirds make a pizza. Three equal slices are the whole pizza.'],
  'journal.far.strong-far': ['A strong light far away can look as bright as a gentle light close by.'],
  'journal.paint.peach': ['Peach: for every 1 red, 2 yellow and 1 white.'],
  'journal.paint.coral': ['Coral: for every 2 red, 1 yellow and 1 white.'],
  'journal.paint.blush': ['Blush: for every 1 red, 1 yellow and 2 white.'],
  'journal.paint.lavender': ['Lavender: for every 1 red, 2 blue and 1 white.'],
  'journal.paint.rose': ['Rose: for every 2 red, 1 blue and 1 white.'],
  'journal.paint.lilac': ['Lilac: for every 1 red, 1 blue and 2 white.'],
  'journal.snack.cow': ['The cow eats hay. Munch, munch! Moo!'],
  'journal.snack.bunny': ['The bunny eats grass. Nibble, nibble!'],
  'journal.snack.dog': ['The dog chews a bone. Woof!'],
  'journal.snack.cat': ['The cat eats fish. Meow!'],
  'journal.snack.duck': ['The duck eats seeds. Quack!'],
  'journal.snack.pig': ['The pig eats an apple. Oink!'],
  'journal.snack.bear': ['The bear eats sweet honey. Yum!'],
  'journal.safari.jumping': ['Jumping means going up into the air and coming down again.'],
  'journal.safari.sleeping': ['Sleeping means resting with your eyes closed.'],
  'journal.safari.eating': ['Eating means taking bites of food.'],
  'journal.safari.waving': ['Waving means moving your hand to say hello or goodbye.'],
  'journal.safari.swimming': ['Swimming means moving through water.'],
  'journal.safari.dancing': ['Dancing means moving your body to music.'],
  'journal.seesaw.heavy': ['The side with more weight goes down, and the lighter side goes up.'],
  'journal.seesaw.equal': ['When both sides have the same weight, the seesaw stays level.'],
  'journal.neighbors.answer': ['The woodpecker knocked, and the frog answered. Taking turns makes a song.'],
  'journal.launch.pull': ['A bigger pull stretches the spring more and sends the pet farther.'],
  'journal.habitat.bunny': ['A bunny needs food to eat, water to drink, and shelter where it can hide and rest.'],
  'journal.habitat.duck': ['A duck needs food to eat, water to drink, and shelter where it can hide and rest.'],
  'journal.mail.plumber': ['A plumber fixes drips with a wrench.'],
  'journal.mail.doctor': ['A doctor helps a hurt teddy with a bandage roll.'],
  'journal.mail.gardener': ['A gardener helps a drooping flower with a watering can.'],
  'journal.mail.postkeeper': ['A postkeeper puts a stamp on a letter so it can travel.'],
  'journal.mail.lifeguard': ['A lifeguard brings back a boat that drifted far out with a ring buoy.'],
  'journal.mail.baker': ['A baker whisks up a cake for a birthday candle.'],
  'journal.trails.A': ['A is for apple! Apple starts with the letter A.'],
  'journal.trails.B': ['B is for ball! Ball starts with the letter B.'],
  'journal.trails.C': ['C is for cat! Cat starts with the letter C.'],
  'journal.trails.D': ['D is for duck! Duck starts with the letter D.'],
  'journal.trails.E': ['E is for egg! Egg starts with the letter E.'],
  'journal.trails.F': ['F is for fish! Fish starts with the letter F.'],
  'journal.trails.G': ['G is for grapes! Grapes starts with the letter G.'],
  'journal.trails.H': ['H is for house! House starts with the letter H.'],
  'journal.trails.I': ['I is for ice cream! Ice cream starts with the letter I.'],
  'journal.trails.J': ['J is for jelly! Jelly starts with the letter J.'],
  'journal.trails.K': ['K is for kite! Kite starts with the letter K.'],
  'journal.trails.L': ['L is for leaf! Leaf starts with the letter L.'],
  'journal.trails.M': ['M is for moon! Moon starts with the letter M.'],
  'journal.trails.N': ['N is for nest! Nest starts with the letter N.'],
  'journal.trails.O': ['O is for orange! Orange starts with the letter O.'],
  'journal.trails.P': ['P is for pig! Pig starts with the letter P.'],
  'journal.trails.Q': ['Q is for queen! Queen starts with the letter Q.'],
  'journal.trails.R': ['R is for rainbow! Rainbow starts with the letter R.'],
  'journal.trails.S': ['S is for sun! Sun starts with the letter S.'],
  'journal.trails.T': ['T is for tree! Tree starts with the letter T.'],
  'journal.trails.U': ['U is for umbrella! Umbrella starts with the letter U.'],
  'journal.trails.V': ['V is for violin! Violin starts with the letter V.'],
  'journal.trails.W': ['W is for whale! Whale starts with the letter W.'],
  'journal.trails.X': ['X is for xylophone! Xylophone starts with the letter X.'],
  'journal.trails.Y': ['Y is for yo-yo! Yo-yo starts with the letter Y.'],
  'journal.trails.Z': ['Z is for zebra! Zebra starts with the letter Z.'],
  'keep.offer': ['Shall we hang it up in your room? Tap the little tree house!'],
  'keep.done': ['Hooray! It is in your room now.', 'Hung up! Go and see it in your room.'],
  'picnic.hello': ["Oh no! The wind blew Juniper's picnic into a muddle. Tap a picture to help!"],
  'picnic.back': ['Welcome back to the picnic! Tap a picture to help Juniper.'],
  'picnic.next': ['Tap the glowing picture to help with the picnic.'],
  'picnic.blanket': ["The wind blew the blankets away! Juniper's blanket has stripes. Tap the striped blanket."],
  'picnic.blanket-where': ["The wind blew the blankets away! Juniper's blanket has stripes, and it landed {where}. Tap the striped blanket {where}."],
  'picnic.not-pattern': ["That blanket has {pattern}. Juniper's blanket has stripes."],
  'picnic.not-place': ["That one has stripes, but it is {where}. Juniper's blanket is {target}."],
  'picnic.blanket-hint': ['Here it is, glowing. Tap it!'],
  'picnic.blanket-done': ['You found it! Juniper spreads the striped blanket on the grass.'],
  'picnic.blanket-recap': ['You found the striped blanket. Now it is ready for our picnic.'],
  'picnic.sandwiches': ['The wind mixed up the sandwiches! Let us go to the kitchen and share them fairly, so every friend gets the same.'],
  'picnic.sandwiches-done': ['Fair shares! A plate of sandwiches for every friend.'],
  'picnic.sandwiches-recap': ['You shared the sandwiches fairly. Every plate has the same.'],
  'picnic.invitation': ['Our friends do not know about the picnic yet! Let us play the invitation song on the jelly drums.'],
  'picnic.invitation-done': ['Our friends heard the song! Here they come.'],
  'picnic.invitation-recap': ['You played the invitation song, and our friends came.'],
  'picnic.ready': ['Everything is ready. Let us have our picnic!'],
  'picnic.keepsake': ['Juniper took a picture of our picnic for you to keep. It is in the picnic journal!'],
  'picnic.thanks': ['Thank you for helping with my picnic!', 'What a lovely picnic!', 'Yum, yum! Thank you!'],
  'picnic.journal': ['Our picnic journal. Tap a picture to hear about it. The green arrow goes to the next thing to do.'],
  'picnic.journal-done': ['Our picnic journal, with the picture of our picnic. Tap the round arrow to tell the story again.'],
  'picnic.again': ['Whoosh! Here comes the wind again. Let us help Juniper one more time!'],
  'woodland.spot': ['The Woodland Picnic! Hazel needs your help.'],
  'woodland.hello': ["Hello! I'm Hazel. I'm having a picnic in the woods, and I need three jobs done. Tap a card to help!"],
  'woodland.back': ['Welcome back to the clearing! Tap a card to help Hazel get the picnic ready.'],
  'woodland.next': ['Tap the glowing card for the next job.'],
  'woodland.invitations': ['Will you take the invitations to my friends? Find each friend in the map key, then the house with their sign.'],
  'woodland.invitations-done': ['Every friend has an invitation! Look, flags on their houses, and stepping stones to the clearing.'],
  'woodland.invitations-recap': ['You took the invitations, so every friend knows the way to the picnic.'],
  'woodland.baskets': ['Two baskets the same, so we can carry them on the pole. Weigh the boxes on the seesaw to make them even.'],
  'woodland.baskets-done': ['Two baskets the same! They hang level from the carrying pole.'],
  'woodland.baskets-recap': ['You packed two baskets the same, so the pole hangs level.'],
  'woodland.beat': ["Let's learn the picnic beat so everyone can dance. Listen, then build the beat you hear."],
  'woodland.beat-done': ['That is the picnic beat! The drum and the bell are ready on the stump.'],
  'woodland.beat-recap': ['You learned the picnic beat. The drum and the bell are waiting on the stump.'],
  'woodland.ready': ['Everything is ready. Here come my friends!'],
  'woodland.keepsake': ['I took a picture of our woodland picnic for you to keep. It is pinned on the tree!'],
  'woodland.thanks': ['Thank you for helping with my picnic!', 'What a happy picnic in the woods!', 'Thank you, friend!'],
  'woodland.photo': ['Our woodland picnic photo. Tap the round arrow to tell the story again.'],
  'woodland.again': ['Let us get ready for another picnic! Three jobs again.'],
  'neighbors.rhythm': ['Listen to the bird and the frog reply. Now play the frog part, with short and long gaps. Tap the green arrow when ready.'],
  'game.stickers': ['Your stickers!'],
  'map.steps': ['Start where the pet is. Go {dirs}. Where do you end up? Tap that square!'],
  'map.clues': ['The {firstThing} is {first}. The {secondThing} is {second}. Where do the two clues meet? Tap that square!'],
  'rows.rows': ['Every row of the flower bed needs one of each flower. Tap a flower packet, then tap an empty spot to plant it!'],
  'rows.both': ['One of each flower in every row, and in every column too! Pick a flower packet, then tap an empty spot.'],
  'rows.stuck': ['Hmm, no flower fits in the glowing spot. Tap a flower you planted to take it out, then try another.'],
  'rows.hint-fix': ['This flower does not belong here. Tap it to take it out, then try a different one.'],
  'ferry.start': ['The harbor is jammed! Slide the boats out of the way so the red ferry can reach the dock. Each boat only slides the way it points.'],
  'hop.gap': ['How many hops from {n} to {m}? Tap a number card.'],
  'hop.wrong.find': ['That is {m}. Can you find {n}?'],
  'slide.go': ['Tap the ice where the penguin should slide. It only stops when it bumps into something!'],
  'slide.stuck': ['Oh no, the penguin cannot reach the fish from here. Tap the round arrow to go back.'],
  'light.two': ['Wake up both flowers with one sunbeam. Turn the mirrors, then tap the sun!'],
  'egg.catch': ['Slide the basket to catch the eggs!'],
  'peg.number': ['Drag to aim, then let go. Hit {n}!'],
  'peg.order': ['Hit 1, then 2, then 3! Drag to aim, then let go.'],
  'launch.short': ['A little farther! Pull more.'],
  'launch.long': ['Whoa, too far! Pull a little less.'],
  'robot.start': ['Help the robot reach the star! Tap arrows to make a path, then press play.'],
  'robot.wrong': ['A bump! Let us change our path and try again.'],

  praise: ['Yay!', 'You did it!', 'Wow!', 'Great job, {name}!', 'Hooray!'],
  sticker: ['A sticker for you!', 'You got a sticker!'],
  again: ['Again?', 'Play again?'],
  'heart.on': ['A favorite! I love it too!', 'A heart for this one!'],
  'heart.off': ['Okay! We can heart it again any time.'],
  'place.favorites': ['Your favorites! Tap one to play.'],
  'sink.guess': ['Will the {thing} float or sink? Tap your guess!'],

  'color.red': ['Red!'],
  'color.orange': ['Orange!'],
  'color.yellow': ['Yellow!'],
  'color.green': ['Green!'],
  'color.blue': ['Blue!'],
  'color.purple': ['Purple!'],
  'color.teal': ['Teal!'],
  'color.pink': ['Pink!'],
  'color.white': ['White!'],
  'color.brown': ['Brown!'],

  count: ['{n}!'],
} satisfies Record<string, string[]>;

export const SCRIPT = {
  ...SHARED,
  // BEGIN game entries (scripts/content-barrels.mjs)
  ...adventureWalkVoice,
  ...animalSnackVoice,
  ...atticFindsVoice,
  ...beatBuilderVoice,
  ...blockGardenVoice,
  ...blockToppleVoice,
  ...blockTowerVoice,
  ...boltBoardsVoice,
  ...bondBeadsVoice,
  ...bounceBackVoice,
  ...bouncyLaunchVoice,
  ...brainBreakVoice,
  ...bubblePopVoice,
  ...bugBuilderVoice,
  ...bumperGardenVoice,
  ...caravanDaysVoice,
  ...chainReactionVoice,
  ...circuitGardenVoice,
  ...clapSyllablesVoice,
  ...clockTowerVoice,
  ...colorGardenVoice,
  ...critterCrossingVoice,
  ...critterSortVoice,
  ...crosswordVoice,
  ...cueStudioVoice,
  ...cutAlongVoice,
  ...dayByDayVoice,
  ...dominoRunVoice,
  ...dotLinkVoice,
  ...drawThePatternVoice,
  ...driftCardsVoice,
  ...dropsJourneyVoice,
  ...duckPondVoice,
  ...ducklingParadeVoice,
  ...eggCatchVoice,
  ...exampleExpressVoice,
  ...farLightsVoice,
  ...feelingsFacesVoice,
  ...ferryJamVoice,
  ...fillDumpVoice,
  ...fluffySalonVoice,
  ...foodWebWorkshopVoice,
  ...forecastDetectiveVoice,
  ...fossilDigVoice,
  ...frogHopVoice,
  ...fruitSliceVoice,
  ...fruitSumsVoice,
  ...gadgetBenchVoice,
  ...gardenGrowVoice,
  ...gardenRowsVoice,
  ...gearGardenVoice,
  ...gemSwapVoice,
  ...goodnightRoomVoice,
  ...habitatHelpersVoice,
  ...hatBandVoice,
  ...helperHouseVoice,
  ...inchwormVoice,
  ...islandBridgesVoice,
  ...jarSortVoice,
  ...jellyDrumsVoice,
  ...keepHouseVoice,
  ...lanternLightsVoice,
  ...lassoLoopsVoice,
  ...lemonadeStandVoice,
  ...letterTrailsVoice,
  ...liftItVoice,
  ...lightLabVoice,
  ...littleConductorVoice,
  ...littleHelpersVoice,
  ...littleLoomVoice,
  ...logRollVoice,
  ...logicGridVoice,
  ...lookItUpVoice,
  ...lostLayersVoice,
  ...mailCarrierVoice,
  ...makerLaneVoice,
  ...marbleJumpVoice,
  ...marketStallVoice,
  ...meadowPensVoice,
  ...measuringPostVoice,
  ...meltFreezeVoice,
  ...memoryDeskVoice,
  ...memoryMatchVoice,
  ...monsterMunchVoice,
  ...moonWindowVoice,
  ...mossyPathVoice,
  ...movieNightVoice,
  ...notAlwaysVoice,
  ...noticeBoardVoice,
  ...numberNookVoice,
  ...numberTrailsVoice,
  ...oppositesVoice,
  ...orchardRowsVoice,
  ...owlWalkVoice,
  ...paintMixerVoice,
  ...patternTrainVoice,
  ...peekabooBarnVoice,
  ...peekaroundIslandVoice,
  ...pegGardenVoice,
  ...penguinSlideVoice,
  ...petKitchenVoice,
  ...petSaysVoice,
  ...photoSafariVoice,
  ...pictureGraphVoice,
  ...pictureLogicVoice,
  ...pileMatchVoice,
  ...pixelPicturesVoice,
  ...playdateWorkshopVoice,
  ...pondCongaVoice,
  ...pondTypingVoice,
  ...puddleGobbleVoice,
  ...puddleLensVoice,
  ...puppetStageVoice,
  ...puzzlePalsVoice,
  ...pyramidSolitaireVoice,
  ...quickTricksVoice,
  ...rainGardenVoice,
  ...rainbowFingersVoice,
  ...rampRaceVoice,
  ...readDoVoice,
  ...readyForAdventureVoice,
  ...recipeWorkshopVoice,
  ...relayWoodsVoice,
  ...rhymeTimeVoice,
  ...rhythmNeighborsVoice,
  ...ribbonWorkshopVoice,
  ...riverTabletsVoice,
  ...robotPathVoice,
  ...roundupVoice,
  ...ruleMachineVoice,
  ...sandTableVoice,
  ...scoopShopVoice,
  ...seaLiftVoice,
  ...secondChanceShedVoice,
  ...secretCodeVoice,
  ...seedTravelersVoice,
  ...seesawBalanceVoice,
  ...senseDetectiveVoice,
  ...shapeBuddiesVoice,
  ...shapeSorterVoice,
  ...shellRowsVoice,
  ...singAlongBarnVoice,
  ...sinkFloatVoice,
  ...sizeParadeVoice,
  ...snowballMergeVoice,
  ...songMakerVoice,
  ...sortingMachineVoice,
  ...soundGardenVoice,
  ...speciesComebackVoice,
  ...spinnerFairVoice,
  ...splishSplashVoice,
  ...sproutShuffleVoice,
  ...stampStudioVoice,
  ...stopAndGoVoice,
  ...storyStepsVoice,
  ...storyWeaverVoice,
  ...sudokuGardenVoice,
  ...swapMeetVoice,
  ...swingPalsVoice,
  ...tangramTownVoice,
  ...teddyDoctorVoice,
  ...thoughtBubblesVoice,
  ...tideLineVoice,
  ...tilePairsVoice,
  ...timelineTrailVoice,
  ...trackwayTalesVoice,
  ...treasureMapVoice,
  ...villageVoteVoice,
  ...vineSnipVoice,
  ...waterRoadVoice,
  ...weatherWardrobeVoice,
  ...welcomeWaysVoice,
  ...whoAmIVoice,
  ...wordGlueVoice,
  ...wordMonstersVoice,
  ...wordSearchVoice,
  // END game entries
} satisfies Record<string, string[]>;

export type LineId = keyof typeof SCRIPT;
