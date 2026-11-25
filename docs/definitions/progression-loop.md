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

1. **Rules** (this file and the rule wording). Docs only.
2. **Shells for grown-ups.** Defined below.
3. **Stamps**: named goals for the grown-up games on the phone, each paying a one-time shell bonus.
4. **The shop**: colours and wearables for the player's own friend, with the friend shown on the phone's six page.
5. **Share line** on Today's six: a copyable line of the day's six results.
6. **Lantern Lodge** after the visual identity is chosen; then the `school` band.

### Slice 2: shells for grown-ups

**Built 2026-11-25** ([PR #2143](https://github.com/rjdunlap/neo/pull/2143)), as written below; the tag sits on a cream pill under the sticker so it reads over a place's picture.

- **Save.** `SaveData.shells: { balance: number; day: string; earned: Record<string, number> }`: the balance, and how many shells each game has earned on `day` (a `dayKey`). Repaired on load: the balance a whole number from 0 to 999 999, `day` a `YYYY-MM-DD` string or empty, `earned` only known-shaped ids (at most 60 entries, each a whole number up to the cap). An older save starts at 0. It rides in backups and the undo snapshot with the rest of the save.
- **Earning.** A finished round on a `grownup` profile earns **5 shells**, up to **15 per game per local day** (three rounds). Any band other than `grownup` earns nothing and shows nothing. Story and project rounds earn as ordinary rounds; a round counts once (`finish` already runs once).
- **Pure rules.** `src/content/shells.ts`: `earnShells(save, gameId, band, day) → { shells, earned }`, the constants and `cleanShells`, unit-tested: the cap, a new day, other bands, a damaged save.
- **Shown.** The round's result screen says "+5 shells" under the sticker for a grown-up (nothing when the cap is reached: no "0"). Today's six shows the balance as a small shell and number beside the date. No other screen changes.
- **Not in this slice.** Spending, stamps, bonuses, a daily gift, the school band.
- **Checks.** Unit tests for `shells.ts` and the save repair; typecheck, lint, the build; one phone-size browser look at the six page and a result screen.
