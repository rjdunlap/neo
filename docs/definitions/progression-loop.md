# The progression loop: earn, spend, collect (chunk 32)

Requested by the developer on 2026-11-24: progression and things to work toward, "Neopets progression", for the grown-ups first and for older children later, while the youngest children's play stays free of it. The developer chose this plan on 2026-11-25 from the [proposal](https://claude.ai/artifact/W6CShZBtAhVsAe8J53QxrV) ("Yes, rules PR then shells"). This file is the definition; the rule change it rests on is in [AGENTS.md](../../AGENTS.md#rules-for-every-activity) and the roadmap's [planning rules](../ROADMAP.md#planning-rules).

## What Neopets does, and what the island keeps

Neopets is one loop: play games to earn Neopoints, spend them on a pet and its home, and fill collections that show what you have done ([Wikipedia, 2022 snapshot](https://webcf.waybackmachine.org/web/20220604223752/https://en.wikipedia.org/wiki/Neopets); [StrategyWiki, Freebies](https://strategywiki.org/wiki/Neopets/Freebies); [Alex Irpan, Stories From the Neopets Economy](https://gwern.net/docs/www/www.alexirpan.com/f8ddd22e69d0e0fefd940bea0c6f60fe6eb5a6a2.html)).

| Neopets | Kept here as |
| --- | --- |
| Neopoints from games, most games capped per day | **Shells** per finished round, capped per game per day so the easiest game is not farmed |
| NPC shops, paint brushes, clothes | A shop of colours and things to wear for the player's own friend, at shown prices |
| Neohome | Treehouse pieces (children), Lantern Lodge (grown-ups), later |
| Stamps, avatars, trophies | Stamp pages of named goals, each saying beforehand how it is earned |
| Bank | The Harbor Bank already proposed for school age, paying automatically, later |
| Dailies and freebies | Grown-ups only: one small daily gift that never stacks up or shows as missed, later |
| Hunger and illness | **Not kept**: nothing goes down while a player is away |
| Battledome | **Not kept**: no fighting |
| Wheels, scratchcards, ads, Neocash, trading | **Not kept**: no chance, paid or traded rewards |

## Who gets what

| Band | Earn | Spend | Collect |
| --- | --- | --- | --- |
| `lap`, `toddler` | Nothing: one sticker per round, as always | Nothing | Stickers, friends met |
| `preschool`, `prek` | No currency | A grown-up may give a named gift | Stamp pages (later slice) |
| `school` | Shells, once the grown-up pacing is known | Shop at shown prices | Stamps, trophies, journal |
| `grownup` | Shells, then the daily gift | Shop for their own friend, then Lantern Lodge | Stamps, trophies, records, a calendar of days played |

Grown-ups come first because they play now, on phones, through [Today's six](todays-six.md); their pacing sets the prices before the school band switches on.

## Rules for every band

- Supported completion earns the same as unaided completion, as a sticker does.
- Nothing is lost by not playing: no hunger, decay, upkeep, interest that stops, or streak that resets. A cap counter that starts again each day limits earning; it never takes anything away.
- Every price and every earning rule is shown before it matters. No chance, no real money, no trading between profiles.
- A balance belongs to one profile's save, so it is in that profile's backup and never reaches another profile.
- Spending never locks a game, a level or a story; it buys looks and places.

## Slices

The developer, 2026-11-27: "option D, can have features from the other options as well integrated". So the loop takes in the proposal's other three options: A's named goals become stamps and Lantern Lake's lanterns, C's calendar, seasons and share line join Today's six, and B's lodge is the big thing to spend on.

1. **Rules** (this file and the rule wording). Docs only. Built.
2. **Shells for grown-ups.** Defined below. Built.
3. **Stamps** (from option A; defined below, built): three to five named goals per grown-up game (reach a level, a level with no hint, the top level, one trick of the game's own), each written beforehand, earned once and paying a one-time shell bonus. A stamp page per land, and Lantern Lake shows one lit paper lantern per stamp, so the lake fills up as the total grows.
4. **The friend's page and shop** (defined below, built): colours and wearables for the player's own friend at shown prices, on a page of its own reached from the six (as Neopets kept pets on their own pages), never added to a game screen. The developer, 2026-11-25: the friend in a game's corner "didn't really do much".
5. **Today's six extras** (from option C; defined below, built): a copyable share line of the day's results (the six games are the same for both grown-ups on a day), a small bonus once a day for finishing all six, and a month calendar with a lantern on each day all six were done. Empty days stay empty; nothing counts a run of days.
6. **Seasons** (from option C; defined below, built): four-week sets of goals ("finish 15 sixes", "try every grown-up game"), each paying shells once, and a dated keepsake for a finished season. A season that ends unfinished simply ends.
7. **Lantern Lodge** (from option B; defined below, built): a lodge, dock and garden to build and decorate with shells, piece by piece at shown prices, in the paper cut-out look (chosen 2026-11-26, [ART-STYLE](../ART-STYLE.md)).
8. **A daily gift** for grown-ups (never stacking or shown as missed), then the `school` band with the prices grown-up play has set.

### Slice 2: shells for grown-ups

**Built 2026-11-25** ([PR #2143](https://github.com/rjdunlap/neo/pull/2143)), as written below; the tag sits on a cream pill under the sticker so it reads over a place's picture.

- **Save.** `SaveData.shells: { balance: number; day: string; earned: Record<string, number> }`: the balance, and how many shells each game has earned on `day` (a `dayKey`). Repaired on load: the balance a whole number from 0 to 999 999, `day` a `YYYY-MM-DD` string or empty, `earned` only known-shaped ids (at most 60 entries, each a whole number up to the cap). An older save starts at 0. It rides in backups and the undo snapshot with the rest of the save.
- **Earning.** A finished round on a `grownup` profile earns **5 shells**, up to **15 per game per local day** (three rounds). Any band other than `grownup` earns nothing and shows nothing. Story and project rounds earn as ordinary rounds; a round counts once (`finish` already runs once).
- **Pure rules.** `src/content/shells.ts`: `earnShells(save, gameId, band, day) → { shells, earned }`, the constants and `cleanShells`, unit-tested: the cap, a new day, other bands, a damaged save.
- **Shown.** The round's result screen says "+5 shells" under the sticker for a grown-up (nothing when the cap is reached: no "0"). Today's six shows the balance as a small shell and number beside the date. No other screen changes.
- **Not in this slice.** Spending, stamps, bonuses, a daily gift, the school band.
- **Checks.** Unit tests for `shells.ts` and the save repair; typecheck, lint, the build; one phone-size browser look at the six page and a result screen.

### Slice 3: stamps

**Built 2026-11-28.** Goals come from each grown-up game's own ladder, so every game listing `grownup` has them now and a new game or level brings its own; game-specific tricks can be added later.

- **Goals.** `goalsFor(range)` on the game's `grownup` ladder (in its band order): *first* (finish any round, 10 shells), *middle* (finish the middle level or a harder one, 20), *top* (finish the top level, 30), *clean* (the top level with no misses and no hints, 40). A ladder of two has no middle; a ladder of one has first and clean. Help counts for all but clean.
- **Earning.** `GameScene.finish` calls `store.earnStamps` for a game listing `grownup`, on a `grownup` profile, after the round's shells; a round can earn several at once. Each is earned once and pays its bonus once, outside the daily cap. Rounds finished before this slice never count.
- **Save.** `SaveData.stamps: { id: '<game>:<kind>', at }[]`, repaired by `cleanStamps` (known kinds, one each, at most 600).
- **Shown.** The result adds the bonus to "+N shells" and a lantern pill under it: "New stamp: Top level" (one or two named, three or more counted). A lantern button on Today's six (above the notes in a wide view, beside them upright) opens the stamps page: plain HTML, every grown-up game with its goals as a row of paper lanterns, lit and dated when held, each saying what it asks, games under way first, and the balance.
- **Later.** Lantern Lake's own lanterns on the island map (the phone has no island), and school games' stamps once the school band earns.

### Slice 4: the friend's page and shop

**Built 2026-11-28.** A grown-up's own friend gets a page of its own, as a Neopet does, and shells buy its looks. Nothing goes on a game screen.

- **Way in.** On Today's six, for a band that earns shells, a pill beside the friend in the bottom-left corner reads "Choose a friend" (or "Pebble's shop" once there is one), and a tap on the pill or the friend opens the page. Back returns to the six.
- **Choosing.** With no friend yet, the page offers the three species, free, by their first names (Pip, Pebble, Breeze). The choice is a normal friend in the save (`store.meet`, met-at token `grownup:friend`), so the six's corner shows it from then on.
- **Shop.** The friend stands on a stage with a card for each thing its species can wear and a paged row of all fourteen colours, laid out as Dress lays them out (`dressLayout`). Prices (`src/content/shop.ts`): sunglasses, scarf, mittens 60; beanie, boots 80; sun hat 100; umbrella 120; raincoat 150; flower crown 250; each of the first eight colours 50, each paint-shelf colour 120. A thing not yet bought carries its price on a small shell pill. A tap tries it on without saving and shows its name and price over the stage with Buy, or "N more shells to go" when the balance is short. Buy takes the price off the balance and keeps the thing on. A thing bought goes on and off with a tap, free, for good.
- **Never taken away.** The friend's own colour, and anything already on it, count as owned. Buying is once per thing, opens no game or level, and the balance cannot go below zero.
- **Save.** `SaveData.shop: { owned: ShopId[] }` (`wear:<item>` or `color:<colour>`), repaired by `cleanShop` (known ids, once each). `store.buy(id)` refuses a band that does not earn, an unknown or owned id, or a short balance, changing nothing. `store.recolor` also accepts a bought colour.
- **Children.** Dress keeps every item and colour free; a child's profile has no shop and no prices.
- **Later.** More things to sell as new wearables are drawn; Lantern Lodge (slice 7) is the larger thing to save for.

### Slice 5: Today's six extras

**Built 2026-11-28.** Robert, the same day: "merge each as you go, don't need me".

- **All six.** When a grown-up comes back to the six with every card ticked, the day is recorded and, the first time that day, **25 shells** are paid. A pill under the title says "+25 shells · all six" for a few seconds, and the balance beside the date updates. The same day again pays nothing.
- **Calendar.** The lantern button's sheet is now "Lanterns". Under "Today" is the share line, then a month calendar (weeks from Monday, ‹ and › to turn the month) with a lit lantern on each day all six were done and today outlined. Then come the stamps, as before. Empty days are only their number; nothing counts a run of days or marks a day missed.
- **Share line.** Wordle-style, with no game names: "Puddle Island · Today's six · Nov 28", then one square per card in card order (green: a round today with no misses or hints; yellow: a round with some; white: not played) and "N/6". Copy opens the phone's share sheet, or copies where there is none.
- **Save.** `SaveData.sixes: { days: string[] }` (`src/content/sixes.ts`), repaired by `cleanSixes` (real days, once each, in order, at most 2,400). `store.recordAllSix(day)` returns the bonus; it records nothing for a band that does not earn.

### Slice 6: seasons

**Built 2026-11-28.**

- **Seasons.** Four weeks each, Monday to Sunday, counted from Monday 5 January 2026 (`src/content/seasons.ts`). Every season has the same four goals, written out beforehand:
  - Finish all six on 10 days: 60 shells.
  - Play 12 different games: 40 shells.
  - Finish 50 rounds: 40 shells.
  - Earn 6 new stamps: 40 shells.
- **Paying.** Each goal pays once a season, as soon as it is met: at the end of a round (`store.countSeasonRound`, after the round's shells and stamps, so the result's "+N shells" includes it and a lantern pill says "Season goal: 50 rounds", or counts two or more), or when an all-six day is recorded (`store.recordAllSix` settles the season too). Meeting all four adds that season's dated keepsake.
- **Ending.** A new season starts its rounds, games and payments again from nothing; all-six days and stamps count in the season they are dated in. A season that ends unfinished simply ends: nothing is lost, nothing is shown missed, and keepsakes stay.
- **Shown.** The Lanterns sheet has "This season" with its dates after the calendar: each goal with its count ("8 of 10"), its shells, and a lantern lit once met, then the keepsakes (each season's dates).
- **Save.** `SaveData.seasons: { season, rounds, games, paid, keepsakes }`, repaired by `cleanSeasons`. A band that does not earn shells counts nothing.

### Slice 7: Lantern Lodge

**Built 2026-11-28.** The island-games thread, the same day: keep the name (classic's age place that used it is retiring); Home will get a lodge to tap for grown-ups once this route (`app.go.lodge()`) is on main.

- **Way in.** A house button on Today's six for a band that earns shells: left of the lantern button upright, above it sideways. Back returns to the six.
- **The picture.** A 1200 × 800 scene by a lake (`src/art/lodge.ts`), drawn in code and turned to paper by the paper pass: sky, hills, meadow and lake are always there. Each built piece stands in its place. Each piece that can be built next shows faintly with its price on a shell pill; a tap offers it by name with Build, or "N more shells to go".
- **Pieces** (`src/content/lodge.ts`), fifteen, 1,890 shells in all: stone footing 80; log walls 150 (on the footing); front door 80, lit windows 120 and roof 200 (on the walls); chimney 100 and porch lanterns 150 (on the roof); stepping stones 60 (from the door); flower bed 80, garden bench 120, garden fence 90, lantern tree 250; dock 120; dock lantern 90 and rowing boat 200 (on the dock).
- **Never taken away.** Built once, kept for good; no upkeep, no decay, no chance, and it opens no game or level.
- **Save.** `SaveData.lodge: { built: LodgePiece[] }`, repaired by `cleanLodge` (known pieces, once, each kept only with its chain of supports). `store.buildLodge(id)` refuses a child band, an unknown or built piece, a piece whose support is not built, or a short balance, changing nothing.
- **Later.** More pieces, and moving pieces around, once grown-ups have used it.
