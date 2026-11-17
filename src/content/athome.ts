import type { GameModule } from '../games/types';
import { playBand, type Band } from '../progress/bands';
import { NO_NAME, offScreenFor } from './offscreen';

/**
 * The At-home card on the grown-ups' page (docs/definitions/at-home-card.md): three ideas to try away from the screen,
 * each a game's off-screen line (*Try*) and, where written, something to *Notice* and something to *Say*, with one line of
 * things from around the house. Pure: it reads no store, writes nothing, and the same inputs give the same card.
 */

export interface AtHomeNote {
  /** One question listing things she might do, every one of them fine; names her once with `{name}`, no pronoun. */
  notice: string;
  /** Something short the grown-up says while playing. */
  say: string;
}

/** A game's notes: `all`, or a band's own pair where the *Try* differs there or `all` would not fit an older child. */
export type AtHomeNotes = { all: AtHomeNote } & Partial<Record<Band, AtHomeNote>>;

/**
 * Notes by game ID. One table rather than a `GameModule` field: the wording is read and revised together, and a notes
 * batch touches no game folder. Only games whose *Try* avoids every deferred practical-care class get an entry
 * (`DEFERRED_CLASSES`); the rule tests hold each line to the wording rules.
 */
export const AT_HOME_NOTES: Record<string, AtHomeNotes> = {
  'bounce-back': {
    all: {
      notice: 'Does {name} watch the ball, reach for it or push it back?',
      say: 'Roll! Here it comes. Again?',
    },
    school: {
      notice: 'Does {name} move the point after seeing the first roll come back?',
      say: 'Where will it come back this time? What makes you think so?',
    },
  },
  'jelly-drums': {
    all: {
      notice: 'Does {name} go back to one pot, or try each one?',
      say: 'Big pot: boom. Little pot: ting.',
    },
    school: {
      notice: 'Does {name} change the guess after hearing the first two pots?',
      say: 'Which will sound lowest? What makes you think so?',
    },
  },
  roundup: {
    all: {
      notice: 'Does {name} put the animals in, tip the basket out or hand one to you?',
      say: 'One in. Two in. All in!',
    },
  },
  'little-helpers': {
    all: {
      notice: 'Does {name} take a corner, hug the middle or watch you lift?',
      say: 'Two hands. Lift! We carried it together.',
    },
    school: {
      notice: 'Does {name} look for a way to carry it with fewer hands?',
      say: 'How many hands did that take? Is there another way?',
    },
  },
  'color-garden': {
    all: {
      notice: 'Does {name} start a pile, add to yours or mix the piles up again?',
      say: 'Red with red. Blue with blue.',
    },
  },
  'size-parade': {
    all: {
      notice: 'Which one does {name} pick up first: the biggest, the smallest or the nearest?',
      say: 'Little, bigger, biggest.',
    },
    school: {
      notice: 'Does {name} check by holding two side by side?',
      say: 'Where would a fourth one go? How do you know?',
    },
  },
  opposites: {
    all: {
      notice: 'Does {name} look where the teddy went, or reach for the box?',
      say: 'Up high. Down low. Open. Closed.',
    },
    school: {
      notice: 'Does {name} come up with a pair you had not thought of?',
      say: 'What is the opposite of that? Can anything be in between?',
    },
  },
  'block-tower': {
    all: {
      notice: 'Does {name} stack, knock down or hand you a block?',
      say: 'Up, up, up. Down! Again?',
    },
    school: {
      notice: 'Does {name} change the guess after the first tower?',
      say: 'Which will stand taller? What made that one wobble first?',
    },
  },
  // Batch 2 (2026-11-17): eight more, one land each, including the three lands that had none.
  'pixel-pictures': {
    all: {
      notice: 'Does {name} copy square by square, or color a whole row at once?',
      say: 'Two blue, then one red. What shall we make next?',
    },
  },
  'peekaboo-barn': {
    all: {
      notice: 'Does {name} look at the blanket, pull it off or wait for you to lift it?',
      say: 'Where did the cow go? Peekaboo! There it is.',
    },
    school: {
      notice: 'Does {name} take a turn hiding an animal for you to find?',
      say: 'Your turn to hide one. Will you give me a clue?',
    },
  },
  'duck-pond': {
    all: {
      notice: 'Does {name} touch each one, pick one up or push the line along?',
      say: 'One, two, three. Three in a row!',
    },
    school: {
      notice: 'Does {name} start again from one, or carry on from the last number?',
      say: 'How many would there be with two more? How do you know?',
    },
  },
  'swap-meet': {
    all: {
      notice: 'Does {name} hold on, hold a toy out or reach for yours?',
      say: 'Swap? Here is mine. Thank you!',
    },
    school: {
      notice: 'Does {name} offer a different toy after a "no thanks"?',
      say: 'Would you swap? What would make it a good swap for both of us?',
    },
  },
  'dot-link': {
    all: {
      notice: 'Does {name} line the blocks up, stack a few or gather one color?',
      say: 'Red, red, blue. Two red, one blue.',
    },
    school: {
      notice: 'Does {name} sort by color first, or keep a tally along the line?',
      say: 'Which color has the most? How many more than the next one?',
    },
  },
  'photo-safari': {
    all: {
      notice: 'Does {name} look toward the teddy, point or go and fetch it?',
      say: 'I spy a teddy under the table. There it is!',
    },
    school: {
      notice: 'Does {name} use a place word such as under, beside or on top of?',
      say: 'Your turn to spy. Where is it hiding?',
    },
  },
  'bouncy-launch': {
    all: {
      notice: 'Does {name} watch the ball, chase it or carry it back to the ramp?',
      say: 'Down it goes! Far, far away. Again?',
    },
    school: {
      notice: 'Does {name} move the guess nearer or farther after each roll?',
      say: 'Where will it land now? What changed?',
    },
  },
  'word-search': {
    all: {
      notice: 'Does {name} hide the words across, down or both ways?',
      say: 'Which word was hardest to hide? Where would you look first?',
    },
  },
};

type Lined = Pick<GameModule, 'id' | 'bands' | 'offScreen'>;

/**
 * A game's *Notice* and *Say* for a profile band, with her name in place of `{name}` as `offScreenFor` does; `null` for a
 * `grownup` profile, a game without an entry, or a game whose *Try* is withheld at that band (no *Try*, no notes).
 */
export function atHomeNoteFor(
  mod: Lined,
  band: Band,
  childName: string,
  notes: Record<string, AtHomeNotes> = AT_HOME_NOTES,
): AtHomeNote | null {
  if (band === 'grownup') return null;
  const entry = Object.hasOwn(notes, mod.id) ? notes[mod.id] : undefined;
  if (!entry || offScreenFor(mod, band, childName) === null) return null;
  const note = entry[playBand(mod.bands, band)] ?? entry.all;
  const name = childName.trim() || NO_NAME;
  return { notice: note.notice.replaceAll('{name}', name), say: note.say.replaceAll('{name}', name) };
}

/** A whole-word pattern over a kit row's words, plurals included. */
const words = (...list: string[]) => new RegExp(`\\b(${list.join('|')})(s|es)?\\b`, 'i');

const SOFT_TOY = 'a teddy or other soft toy';
const TOYS = 'a few toys';

/**
 * The household vocabulary, in display order. A help, not an inventory: it never lists food, water or a small loose
 * object, even when a *Try* names one, and a ball is always the large soft one the lap and toddler lines use.
 */
export const KIT: readonly { label: string; match: RegExp }[] = [
  { label: 'a large soft ball', match: words('ball') },
  { label: 'blocks', match: words('block') },
  { label: 'cups or bowls', match: words('cup', 'bowl') },
  { label: 'pots and pans', match: words('pot', 'pan') },
  { label: 'spoons', match: words('spoon') },
  { label: SOFT_TOY, match: words('stuffed animal', 'soft toy', 'teddy', 'teddies', 'doll') },
  { label: TOYS, match: words('toy') },
  { label: 'socks or shoes', match: words('sock', 'shoe') },
  { label: 'a laundry basket or box', match: words('basket', 'box') },
  { label: 'a pillow or cushion', match: words('pillow', 'cushion') },
  { label: 'a blanket', match: words('blanket') },
  { label: 'a book', match: words('book') },
  { label: 'paper and crayons', match: words('paper', 'crayon') },
  { label: 'a tray', match: words('tray') },
  { label: 'a cardboard tube', match: words('tube') },
];

/** The kit labels any of these *Try* lines names, in table order, each once; "a few toys" yields to the soft-toy label. */
export function kitFor(
  lines: readonly string[],
  kit: readonly { label: string; match: RegExp }[] = KIT,
): string[] {
  const labels = kit.filter((k) => lines.some((line) => k.match.test(line))).map((k) => k.label);
  return labels.includes(SOFT_TOY) ? labels.filter((l) => l !== TOYS) : labels;
}

export interface AtHomeIdea<T> {
  game: T;
  /** The game's off-screen line at her band. */
  try: string;
  note: AtHomeNote | null;
  /** Whether it is here because she played it this week (else a starter). */
  played: boolean;
}

export interface AtHomeCard<T> {
  ideas: AtHomeIdea<T>[];
  kit: string[];
}

export const AT_HOME_IDEAS = 3;
const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * The card for one profile. Played games first (a round in the last seven days and a line at her band, most recent
 * first, ties in the order given), then starters to fill three: one per land in `lands` order, first a game with *Try*,
 * *Notice* and *Say*, then a game with a *Try* alone, and only then a second game from a land already used. A starter is
 * always a game that lists her own band (a younger game she still sees can be played onto the card, not suggested). A
 * `grownup` profile gets *Try* lines only and no kit.
 */
export function atHomeCard<T extends Lined>(input: {
  /** What the lands show her (`visibleGames`), in catalog order. */
  games: readonly T[];
  lands: readonly { games: readonly string[] }[];
  band: Band;
  childName: string;
  /** The time of a game's most recent round, if it has one. */
  lastPlayed: (game: T) => number | undefined;
  now: number;
  notes?: Record<string, AtHomeNotes>;
}): AtHomeCard<T> {
  const { games, lands, band, childName, now } = input;
  const notes = input.notes ?? AT_HOME_NOTES;
  const grown = band === 'grownup';
  const ideas: AtHomeIdea<T>[] = [];
  const idea = (game: T, played: boolean): AtHomeIdea<T> | null => {
    const line = offScreenFor(game, band, childName);
    return line === null
      ? null
      : { game, try: line, note: atHomeNoteFor(game, band, childName, notes), played };
  };

  const recent = games
    .map((game, at) => ({ game, at, when: input.lastPlayed(game) }))
    .filter((r): r is { game: T; at: number; when: number } => r.when !== undefined && r.when >= now - WEEK)
    .sort((a, b) => b.when - a.when || a.at - b.at);
  for (const r of recent) {
    const made = ideas.length < AT_HOME_IDEAS ? idea(r.game, true) : null;
    if (made) ideas.push(made);
  }

  const landIndex = (id: string) => lands.findIndex((l) => l.games.includes(id));
  /** One pass over the lands, taking at most one game from each; returns whether it added anything. */
  const walk = (complete: boolean, skipUsed: boolean): boolean => {
    let added = false;
    const used = new Set(ideas.map((i) => landIndex(i.game.id)));
    lands.forEach((land, at) => {
      if (ideas.length >= AT_HOME_IDEAS || (skipUsed && used.has(at))) return;
      for (const id of land.games) {
        const game = games.find((g) => g.id === id);
        if (!game || ideas.some((i) => i.game.id === id)) continue;
        if (!game.bands.includes(band)) continue;
        const made = idea(game, false);
        if (!made || (complete && !made.note)) continue;
        ideas.push(made);
        added = true;
        return;
      }
    });
    return added;
  };
  if (!grown) walk(true, true);
  walk(false, true);
  while (ideas.length < AT_HOME_IDEAS && walk(false, false));

  return {
    ideas,
    kit: grown ? [] : kitFor(ideas.map((i) => i.try)),
  };
}
