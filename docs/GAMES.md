# Puddle Island games

What each game does and the design decisions behind its rules (what counts as a miss, what a hint shows, how the levels grow, and what was learned while building it) are on its own page in [docs/games/](games/), one file per game named by its ID. This file is the index, by land in island order. The [README inventory](../README.md#the-island-and-its-games) is the one-line summary and the game count; `src/games/registry.ts` and each game's `logic.ts` are the source of truth, and each game's `howto.ts` says how to play it. Shared systems (the shell, saves, the treehouse, couch play) are in [DESIGN.md](DESIGN.md); some games also play on the couch, listed in [COUCH-PLAY.md](COUCH-PLAY.md).

**Generated.** `npm run game-docs` writes this index, the README's inventory tables and counts, and the block at the top of each page (ID, land, ages, skills, each band's levels and every level's `describeLevel`) from the registry and `LANDS`; `src/content/game-docs.test.ts` fails in `npm test` when any of them is stale. By hand, on a game's page, below the generated block: its **Starts as** line (shown in the README table), its **Grows into** line, and its design notes, with what inspired it. A new game's page is made with empty lines to fill in. On a merge conflict in README.md, GAMES.md or a page's generated block, take either side and run `npm run game-docs` again.

## Grown-up puzzles

Fifteen games made for grown-ups: thirteen in Lantern Lake, Marble Jump in Puzzle Peaks and Log Roll in Tinker Lab, for the `grownup` band (13 and up; younger players find them behind the land's signpost and play their easiest levels). They are in `GAMES` like any game. All fifteen play by touch on the island; eight also take controllers on the couch. Brain Break, Number Nook, Pyramid Solitaire, Marble Jump, Log Roll, Snowball Merge and Species Comeback are touch-only. Couch rounds keep their own records and give a couch sticker; island rounds give the ordinary island sticker. Help remains replayable, with no clock or loss screen.

<!-- generated: the games by land (npm run game-docs) -->

## Bubble Beach

### Bubble Pop

*lap–school* · [Bubble Pop](games/bubble-pop.md)

### Peg Garden

*lap–pre-K* · [Peg Garden](games/peg-garden.md)

### Bounce Back

*lap–school* · [Bounce Back](games/bounce-back.md)

### Bumper Garden

*lap–pre-K* · [Bumper Garden](games/bumper-garden.md)

### Sink or Float

*lap–school* · [Sink or Float](games/sink-float.md)

### Domino Run

*toddler–school* · [Domino Run](games/domino-run.md)

### Fruit Slice

*toddler–school* · [Fruit Slice](games/fruit-slice.md)

### Puddle Gobble

*toddler–school* · [Puddle Gobble](games/puddle-gobble.md)

### Lost Layers

*school* · [Lost Layers](games/lost-layers.md)

### Sea Lift

*school* · [Sea Lift](games/sea-lift.md)

### Puddle Lens

*lap–school* · [Puddle Lens](games/puddle-lens.md)

### Melt and Freeze

*lap–preschool* · [Melt and Freeze](games/melt-freeze.md)

### Tide Line

*lap–pre-K* · [Tide Line](games/tide-line.md)

### Drift Cards

*school* · [Drift Cards](games/drift-cards.md)

## Music Mountain

### Jelly Drums

*lap–school* · [Jelly Drums](games/jelly-drums.md)

### Song Maker

*lap–school* · [Song Maker](games/song-maker.md)

### Sound Garden

*lap–pre-K* · [Sound Garden](games/sound-garden.md)

### Rhythm Neighbors

*lap–school* · [Rhythm Neighbors](games/rhythm-neighbors.md)

### Beat Builder

*toddler–school* · [Beat Builder](games/beat-builder.md)

### Little Conductor

*toddler–pre-K* · [Little Conductor](games/little-conductor.md)

### Puppet Stage

*lap–school* · [Puppet Stage](games/puppet-stage.md)

### Hat Band

*preschool–grown-up* · [Hat Band](games/hat-band.md)

## Painted Canyon

### Little Loom

*toddler–pre-K* · [Little Loom](games/little-loom.md)

### Movie Night

*preschool–school* · [Movie Night](games/movie-night.md)

### Rainbow Fingers

*lap–school* · [Rainbow Fingers](games/rainbow-fingers.md)

### Fluffy Salon

*lap–pre-K* · [Fluffy Salon](games/fluffy-salon.md)

### Stamp Studio

*lap–school* · [Stamp Studio](games/stamp-studio.md)

### Pixel Pictures

*preschool–school* · [Pixel Pictures](games/pixel-pictures.md)

### Cut Along

*toddler–school* · [Cut Along](games/cut-along.md)

### Draw the Pattern

*lap–pre-K* · [Draw the Pattern](games/draw-the-pattern.md)

### Recipe Workshop

*toddler–pre-K* · [Recipe Workshop](games/recipe-workshop.md)

### Gear Garden

*lap–school* · [Gear Garden](games/gear-garden.md)

### Gadget Bench

*preschool–school* · [Gadget Bench](games/gadget-bench.md)

## Barnyard

### Peekaboo Barn

*lap–pre-K* · [Peekaboo Barn](games/peekaboo-barn.md)

### Duckling Parade

*lap–school* · [Duckling Parade](games/duckling-parade.md)

### Roundup

*lap–pre-K* · [Roundup](games/roundup.md)

### Egg Catch

*lap–school* · [Egg Catch](games/egg-catch.md)

### Animal Snack

*lap–preschool* · [Animal Snack](games/animal-snack.md)

### Critter Sort

*pre-K–school* · [Critter Sort](games/critter-sort.md)

### Sing-Along Barn

*lap–pre-K* · [Sing-Along Barn](games/sing-along-barn.md)

### Orchard Rows

*school* · [Orchard Rows](games/orchard-rows.md)

### Bolt Boards

*toddler–school* · [Bolt Boards](games/bolt-boards.md)

### Look It Up

*toddler–school* · [Look It Up](games/look-it-up.md)

### Adventure Walk

*toddler–school* · [Adventure Walk](games/adventure-walk.md)

### Ready for Adventure

*toddler–pre-K* · [Ready for Adventure](games/ready-for-adventure.md)

### Who Am I?

*pre-K–school* · [Who Am I?](games/who-am-i.md)

### Timeline Trail

*preschool–school* · [Timeline Trail](games/timeline-trail.md)

## Counting Cove

### Duck Pond

*lap–school* · [Duck Pond](games/duck-pond.md)

### Monster Munch

*lap–school* · [Monster Munch](games/monster-munch.md)

### Little Helpers

*lap–school* · [Little Helpers](games/little-helpers.md)

### Pet Kitchen

*lap–school* · [Pet Kitchen](games/pet-kitchen.md)

### Frog Hop

*preschool–school* · [Frog Hop](games/frog-hop.md)

### Picture Graph

*pre-K–school* · [Picture Graph](games/picture-graph.md)

### Lasso Loops

*preschool–school* · [Lasso Loops](games/lasso-loops.md)

### Fill and Dump

*lap–preschool* · [Fill and Dump](games/fill-dump.md)

### Number Trails

*preschool–pre-K* · [Number Trails](games/number-trails.md)

### Fruit Sums

*school* · [Fruit Sums](games/fruit-sums.md)

### Pile Match

*preschool–school* · [Pile Match](games/pile-match.md)

### Ribbon Workshop

*school* · [Ribbon Workshop](games/ribbon-workshop.md)

### Paint Mixer

*school* · [Paint Mixer](games/paint-mixer.md)

### Spinner Fair

*preschool–school* · [Spinner Fair](games/spinner-fair.md)

## Cozy Village

### Splish Splash

*lap–pre-K* · [Splish Splash](games/splish-splash.md)

### Feelings Faces

*lap–school* · [Feelings Faces](games/feelings-faces.md)

### Weather Wardrobe

*lap–pre-K* · [Weather Wardrobe](games/weather-wardrobe.md)

### Scoop Shop

*lap–school* · [Scoop Shop](games/scoop-shop.md)

### Mail Carrier

*lap–school* · [Mail Carrier](games/mail-carrier.md)

### Teddy Doctor

*lap–school* · [Teddy Doctor](games/teddy-doctor.md)

### Market Stall

*preschool–school* · [Market Stall](games/market-stall.md)

### Clock Tower

*pre-K–school* · [Clock Tower](games/clock-tower.md)

### Day by Day

*pre-K–school* · [Day by Day](games/day-by-day.md)

### Stop and Go

*lap–pre-K* · [Stop and Go](games/stop-and-go.md)

### Pet Says

*lap–pre-K* · [Pet Says](games/pet-says.md)

### Lemonade Stand

*school* · [Lemonade Stand](games/lemonade-stand.md)

### Second Chance Shed

*toddler–school* · [Second Chance Shed](games/second-chance-shed.md)

### Swap Meet

*toddler–school* · [Swap Meet](games/swap-meet.md)

### Village Vote

*preschool–school* · [Village Vote](games/village-vote.md)

### Relay Woods

*toddler–school* · [Relay Woods](games/relay-woods.md)

### Helper House

*preschool–school* · [Helper House](games/helper-house.md)

### Caravan Days

*toddler–school* · [Caravan Days](games/caravan-days.md)

### Keep House

*toddler–school* · [Keep House](games/keep-house.md)

### Notice Board

*pre-K–school* · [Notice Board](games/notice-board.md)

### Maker Lane

*toddler–school* · [Maker Lane](games/maker-lane.md)

## Rainbow Meadow

### Shape Sorter

*lap–pre-K* · [Shape Sorter](games/shape-sorter.md)

### Color Garden

*lap–pre-K* · [Color Garden](games/color-garden.md)

### Dot Link

*lap–pre-K* · [Dot Link](games/dot-link.md)

### Tangram Town

*toddler–school* · [Tangram Town](games/tangram-town.md)

### Garden Grow

*lap–pre-K* · [Garden Grow](games/garden-grow.md)

### Treasure Map

*preschool–school* · [Treasure Map](games/treasure-map.md)

### Habitat Helpers

*preschool–school* · [Habitat Helpers](games/habitat-helpers.md)

### Jar Sort

*preschool–school* · [Jar Sort](games/jar-sort.md)

### Block Garden

*pre-K–grown-up* · [Block Garden](games/block-garden.md)

### Swing Pals

*lap–school* · [Swing Pals](games/swing-pals.md)

### Lift It

*preschool–school* · [Lift It](games/lift-it.md)

### Sand Table

*lap–school* · [Sand Table](games/sand-table.md)

### Food Web Workshop

*school* · [Food Web Workshop](games/food-web-workshop.md)

### Meadow Pens

*school* · [Meadow Pens](games/meadow-pens.md)

### Sprout Shuffle

*school* · [Sprout Shuffle](games/sprout-shuffle.md)

### Seed Travelers

*toddler–pre-K* · [Seed Travelers](games/seed-travelers.md)

## Puzzle Peaks

### Marble Jump

*grown-up* · [Marble Jump](games/marble-jump.md)

### Pattern Train

*preschool–school* · [Pattern Train](games/pattern-train.md)

### Memory Match

*preschool–school* · [Memory Match](games/memory-match.md)

### Size Parade

*lap–school* · [Size Parade](games/size-parade.md)

### Puzzle Pals

*lap–school* · [Puzzle Pals](games/puzzle-pals.md)

### Quick Tricks

*toddler–school* · [Quick Tricks](games/quick-tricks.md)

### Peekaround Island

*toddler–school* · [Peekaround Island](games/peekaround-island.md)

### Penguin Slide

*preschool–school* · [Penguin Slide](games/penguin-slide.md)

### Secret Code

*preschool–school* · [Secret Code](games/secret-code.md)

### Mystery Grid

*preschool–grown-up* · [Mystery Grid](games/logic-grid.md)

### Rule Machine

*pre-K–school* · [Rule Machine](games/rule-machine.md)

### Garden Rows

*preschool–school* · [Garden Rows](games/garden-rows.md)

### Ferry Jam

*pre-K–school* · [Ferry Jam](games/ferry-jam.md)

### Critter Crossing

*pre-K–school* · [Critter Crossing](games/critter-crossing.md)

### Mossy Path

*toddler–school* · [Mossy Path](games/mossy-path.md)

### Shell Rows

*pre-K–school* · [Shell Rows](games/shell-rows.md)

## Story Grove

### Letter Trails

*preschool–school* · [Letter Trails](games/letter-trails.md)

### Story Steps

*toddler–school* · [Story Steps](games/story-steps.md)

### Word Monsters

*lap–school* · [Word Monsters](games/word-monsters.md)

### Photo Safari

*lap–school* · [Photo Safari](games/photo-safari.md)

### Goodnight Room

*lap–pre-K* · [Goodnight Room](games/goodnight-room.md)

### Rhyme Time

*preschool–school* · [Rhyme Time](games/rhyme-time.md)

### Opposites

*lap–pre-K* · [Opposites](games/opposites.md)

### Clap the Syllables

*preschool–school* · [Clap the Syllables](games/clap-syllables.md)

### Read & Do

*pre-K–school* · [Read & Do](games/read-do.md)

### Owl Walk Home

*toddler–pre-K* · [Owl Walk Home](games/owl-walk.md)

### Attic Finds

*lap–school* · [Attic Finds](games/attic-finds.md)

### Trackway Tales

*school* · [Trackway Tales](games/trackway-tales.md)

### Pond Typing

*school* · [Pond Typing](games/pond-typing.md)

### Crossword

*pre-K–grown-up* · [Crossword](games/crossword.md)

### Word Glue

*lap–school* · [Word Glue](games/word-glue.md)

### Story Weaver

*school* · [Story Weaver](games/story-weaver.md)

### River Tablets

*preschool–school* · [River Tablets](games/river-tablets.md)

### Not Always

*pre-K–school* · [Not Always](games/not-always.md)

### Thought Bubbles

*pre-K–school* · [Thought Bubbles](games/thought-bubbles.md)

### Playdate Workshop

*preschool–pre-K* · [Playdate Workshop](games/playdate-workshop.md)

## Tinker Lab

### Log Roll

*grown-up* · [Log Roll](games/log-roll.md)

### Robot Path

*preschool–school* · [Robot Path](games/robot-path.md)

### Bug Builder

*toddler–school* · [Bug Builder](games/bug-builder.md)

### Bouncy Launch

*lap–school* · [Bouncy Launch](games/bouncy-launch.md)

### Seesaw Balance

*lap–school* · [Seesaw Balance](games/seesaw-balance.md)

### Light Lab

*pre-K–school* · [Light Lab](games/light-lab.md)

### Ramp Race

*pre-K–school* · [Ramp Race](games/ramp-race.md)

### Inchworm Measure

*pre-K–school* · [Inchworm Measure](games/inchworm.md)

### Block Tower

*lap–school* · [Block Tower](games/block-tower.md)

### Block Topple

*preschool–school* · [Block Topple](games/block-topple.md)

### Chain Reaction

*pre-K–school* · [Chain Reaction](games/chain-reaction.md)

### Shape Buddies

*preschool–school* · [Shape Buddies](games/shape-buddies.md)

### Fossil Dig

*pre-K* · [Fossil Dig](games/fossil-dig.md)

### Sense Detective

*pre-K–school* · [Sense Detective](games/sense-detective.md)

### Cue Studio

*pre-K–school* · [Cue Studio](games/cue-studio.md)

### Bond Beads

*school* · [Bond Beads](games/bond-beads.md)

### Welcome Ways

*toddler–school* · [Welcome Ways](games/welcome-ways.md)

### Example Express

*school* · [Example Express](games/example-express.md)

### Moon Window

*lap–pre-K* · [Moon Window](games/moon-window.md)

### Sorting Machine

*school–grown-up* · [Sorting Machine](games/sorting-machine.md)

### Water Road

*toddler–school* · [Water Road](games/water-road.md)

### Drop's Journey

*preschool–school* · [Drop's Journey](games/drops-journey.md)

### Rain Garden

*toddler–school* · [Rain Garden](games/rain-garden.md)

### Forecast Detective

*school* · [Forecast Detective](games/forecast-detective.md)

### Vine Snip

*lap–school* · [Vine Snip](games/vine-snip.md)

### Far Lights

*lap–school* · [Far Lights](games/far-lights.md)

### Circuit Garden

*pre-K–school* · [Circuit Garden](games/circuit-garden.md)

### Measuring Post

*school* · [Measuring Post](games/measuring-post.md)

## Lantern Lake

### Snowball Merge

*grown-up* · [Snowball Merge](games/snowball-merge.md)

### Brain Break

*grown-up* · [Brain Break](games/brain-break.md)

### Pyramid Solitaire

*grown-up* · [Pyramid Solitaire](games/pyramid-solitaire.md)

### Number Nook

*grown-up* · [Number Nook](games/number-nook.md)

### Gem Swap

*grown-up* · [Gem Swap](games/gem-swap.md)

### Tile Pairs

*grown-up* · [Tile Pairs](games/tile-pairs.md)

### Lantern Lights

*school–grown-up* · [Lantern Lights](games/lantern-lights.md)

### Sudoku Garden

*grown-up* · [Sudoku Garden](games/sudoku-garden.md)

### Picture Logic

*grown-up* · [Picture Logic](games/picture-logic.md)

### Word Search

*school–grown-up* · [Word Search](games/word-search.md)

### Island Bridges

*school–grown-up* · [Island Bridges](games/island-bridges.md)

### Pond Conga

*school–grown-up* · [Pond Conga](games/pond-conga.md)

### Species Comeback

*grown-up* · [Species Comeback](games/species-comeback.md)

<!-- end generated -->
