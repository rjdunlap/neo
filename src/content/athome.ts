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
  // Batch 3 (2026-11-17): eight more that name something from the kit; Treehouse now has a toddler game with notes.
  'recipe-workshop': {
    all: {
      notice: 'Does {name} fill the bowl, stir it or hand it to you?',
      say: 'In it goes. Stir, stir. All done!',
    },
  },
  'song-maker': {
    all: {
      notice: 'Does {name} tap one pot, tap each in turn or watch your spoon?',
      say: 'Tap, tap, boom. Again? Tap, tap, boom.',
    },
    school: {
      notice: 'Does {name} play it back the same way, or change a part?',
      say: 'Was that the same song? Which part would you change?',
    },
  },
  'sound-garden': {
    all: {
      notice: 'Does {name} tap along, wait for a turn or speed up?',
      say: 'Tap, tap, tap. Slow, slow. Fast, fast, fast!',
    },
  },
  'egg-catch': {
    all: {
      notice: 'Does {name} watch the tube, look in the bowl or reach for the ball?',
      say: 'In it goes. Here it comes. Caught it!',
    },
    school: {
      notice: 'Does {name} move the bowl after seeing where the first roll lands?',
      say: 'Where will it come out? What happens if we tilt the tube more?',
    },
  },
  'bumper-garden': {
    all: {
      notice: 'Does {name} follow the ball, move a cup or tip the tray?',
      say: 'Roll! Bump. It hit the cup. Again?',
    },
  },
  'goodnight-room': {
    all: {
      notice: 'Does {name} look at each thing, point to one or wave?',
      say: 'Goodnight, lamp. Goodnight, teddy. Goodnight, window.',
    },
  },
  'seesaw-balance': {
    all: {
      notice: 'Does {name} add a spoon, take one out or swing the hanger?',
      say: 'One more spoon. Down it goes! Now this side.',
    },
    school: {
      notice: 'Does {name} even it up by adding to one cup, or by taking from the other?',
      say: 'Which cup will go down? What would make it hang level?',
    },
  },
  'relay-woods': {
    all: {
      notice: 'Does {name} pass the picture along, keep hold of it or give it to one friend?',
      say: 'Here you go, bear. Pass it on. Thank you!',
    },
    school: {
      notice: 'Does {name} give each friend a turn, or skip to the end of the row?',
      say: 'Who gets it next? What would show us it got to the end?',
    },
  },
  // Batch 4 (2026-11-17): eight more in bands already served, each naming something from the kit.
  'domino-run': {
    all: {
      notice: 'Does {name} stand one up, push the first one or knock the whole row down?',
      say: 'Stand, stand, stand. Push! Down they go.',
    },
    school: {
      notice: 'Does {name} change the gap after a row stops partway?',
      say: 'Will the wide gap work? What made it stop there?',
    },
  },
  'puddle-gobble': {
    all: {
      notice: 'Does {name} put one cup inside another, build a tower or try each in turn?',
      say: 'In it goes. Too big! This one fits.',
    },
    school: {
      notice: 'Does {name} hold two cups side by side before trying the fit?',
      say: 'Which fit inside which? How did you choose the order?',
    },
  },
  'beat-builder': {
    all: {
      notice: 'Does {name} bang the pot, clap along or wait for the next turn?',
      say: 'Boom, clap. Boom, clap. Your turn!',
    },
    school: {
      notice: 'Does {name} copy the beat the same way, or add a new part?',
      say: 'What comes next in the beat? How would you change it?',
    },
  },
  'sing-along-barn': {
    all: {
      notice: 'Does {name} look at the animal, reach for it or join in with the sound?',
      say: 'Here is the cow. Moo, moo! Again?',
    },
  },
  'adventure-walk': {
    all: {
      notice: 'Does {name} walk the toy over the bridge, hide it under or go another way?',
      say: 'Over the bridge. Under! Around the boulder.',
    },
    school: {
      notice: 'Does {name} try a second way around after the first one?',
      say: 'Which way did the toy go? Is there another way to get there?',
    },
  },
  'village-vote': {
    all: {
      notice: 'Does {name} give each friend one choice, send every friend to one toy or choose too?',
      say: 'Bear picks this one. Rabbit picks that one. Which has more?',
    },
    school: {
      notice: 'Does {name} count each side, or line the friends up to compare?',
      say: 'Which toy won? What if one friend changed sides?',
    },
  },
  'memory-match': {
    all: {
      notice: 'Does {name} lift cups in turn, go back to one already seen or peek under two?',
      say: 'A spoon! Where is its partner? Under this cup?',
    },
    school: {
      notice: 'Does {name} point to where a pair is before lifting the cup?',
      say: 'How did you remember that one? Shall we add another pair?',
    },
  },
  'block-topple': {
    all: {
      notice: 'Does {name} aim low, aim high or build the stack up again?',
      say: 'Roll! Did it tip? Now a taller one.',
    },
    school: {
      notice: 'Does {name} change where the ball hits after seeing a stack stay up?',
      say: 'Which stack will tip first? Where would you aim, and why?',
    },
  },
  // Batch 5 (2026-11-17): eight more in bands already served, each naming toys or books from the kit.
  'pile-match': {
    all: {
      notice: 'Does {name} gather the toys in threes, in handfuls or one at a time?',
      say: 'One, two, three. That is a set! Here is another.',
    },
    school: {
      notice: 'Does {name} say how many sets there will be before gathering the toys?',
      say: 'How many sets of three will there be? Will any be left over?',
    },
  },
  'bolt-boards': {
    all: {
      notice: 'Does {name} take the top book, pull one from the middle or stack the books up again?',
      say: 'Top one off. Next one. All the way down!',
    },
    school: {
      notice: 'Does {name} say which book has to come off before the one below?',
      say: 'Which one has to come off first? What is it holding down?',
    },
  },
  'robot-path': {
    all: {
      notice: 'Does {name} move the toy one step at a time, or run it straight to the end?',
      say: 'One step forward. Turn. One more step. There!',
    },
    school: {
      notice: 'Does {name} give all the steps first, then check where the toy ends up?',
      say: 'What steps would get it there? Which part could we do again?',
    },
  },
  'secret-code': {
    all: {
      notice: 'Does {name} guess all three at once, or change one toy at a time?',
      say: 'Bear is in the right spot. Try the other two.',
    },
    school: {
      notice: 'Does {name} keep the toys already in the right spot when guessing again?',
      say: 'What did that clue tell you? Which toy will you move?',
    },
  },
  'garden-rows': {
    all: {
      notice: 'Does {name} look along the row, down the column or try each toy in the gap?',
      say: 'This row has a car and a bear. Which one is missing?',
    },
    school: {
      notice: 'Does {name} check both the row and the column before putting a toy back?',
      say: 'How do you know it goes there? Could any other toy fit?',
    },
  },
  'penguin-slide': {
    all: {
      notice: 'Does {name} push the car gently, push it hard or go and see what stopped it?',
      say: 'Slide! It stopped at the wall. Again?',
    },
    school: {
      notice: 'Does {name} point to where the car will stop before letting go?',
      say: 'Where will it stop this time? What would stop it sooner?',
    },
  },
  'sense-detective': {
    all: {
      notice: 'Does {name} shake the bag, feel it from outside or ask for a peek?',
      say: 'Shake, shake. What could it be? Now take a peek.',
    },
    school: {
      notice: 'Does {name} change the guess after the peek, or keep the first one?',
      say: 'What did the shake tell you? What did the peek add?',
    },
  },
  'ready-for-adventure': {
    all: {
      notice: 'Does {name} choose a toy, give it a hat or march it along?',
      say: 'Teddy is coming to the parade. Hat on. Off we go!',
    },
  },
  // Batch 6 (2026-11-17): eight pre-K and school games (Logic Grid from preschool), each naming toys, books or a tray.
  'thought-bubbles': {
    all: {
      notice: 'Does {name} point to where teddy last saw the toy, or to where the toy is now?',
      say: 'Teddy was asleep. Where will teddy look first?',
    },
    school: {
      notice: 'Does {name} explain what teddy saw and what teddy missed?',
      say: "What does teddy think? What would change teddy's mind?",
    },
  },
  'logic-grid': {
    all: {
      notice: 'Does {name} go and look after each clue, or wait for one more?',
      say: 'It is somewhere low. It is near something soft. Found it!',
    },
    school: {
      notice: 'Does {name} rule places out aloud as the clues add up?',
      say: 'Which places did that clue rule out? What would you ask next?',
    },
  },
  'ramp-race': {
    all: {
      notice: 'Does {name} lift the book higher, try the other floor or chase the car?',
      say: 'Down it rolls! That one went far. Now a higher ramp.',
    },
    school: {
      notice: 'Does {name} change one thing at a time, the height or the floor?',
      say: 'Which will roll farther? How would we make it a fair test?',
    },
  },
  inchworm: {
    all: {
      notice: 'Does {name} lay the spoons end to end, leave gaps or hold two toys side by side?',
      say: 'One spoon, two spoons, three. The bear is three spoons long!',
    },
    school: {
      notice: 'Does {name} guess a length first, or measure and then compare?',
      say: 'How many spoons long will it be? Would bricks give the same number?',
    },
  },
  'chain-reaction': {
    all: {
      notice: 'Does {name} move the book, move the ball or point to where the ball will go?',
      say: 'Where will it go this time? Let it roll and see.',
    },
    school: {
      notice: 'Does {name} change one part at a time, or several at once?',
      say: 'What did you change? What did that do to where the ball went?',
    },
  },
  'not-always': {
    all: {
      notice: 'Does {name} check each toy in turn, or go straight to the one that does not fit?',
      say: 'All of these are soft. Is that true for every one?',
    },
    school: {
      notice: 'Does {name} make up a new "all of these" for you to test?',
      say: 'Is it always true? What one toy would show that it is not?',
    },
  },
  'critter-crossing': {
    all: {
      notice: 'Does {name} try lots of toys, try one kind again or guess the rule straight away?',
      say: 'Yes, that one crosses. No, not that one. What is my rule?',
    },
    school: {
      notice: 'Does {name} pick a toy that would test the guess before saying it?',
      say: 'Which toy would test your idea? Now you make up a rule for me.',
    },
  },
  'ferry-jam': {
    all: {
      notice: 'Does {name} slide one car at a time, push a whole row or lift a car off the tray?',
      say: 'Slide this one over. Now there is a gap. Out it comes!',
    },
    school: {
      notice: 'Does {name} look for what is in the way before sliding anything?',
      say: 'Which one is blocking the way? What has to move first?',
    },
  },
  // Batch 7 (2026-11-17): the last seven eligible games, each naming toys, blocks, a box or a card.
  'memory-desk': {
    all: {
      notice: 'Does {name} answer straight away, look at the toy you are holding or ask to open the box?',
      say: 'What is in the box? Open it and see. Now you hide one for me.',
    },
  },
  'sorting-machine': {
    all: {
      notice: 'Does {name} guess which door will open before a toy goes through?',
      say: 'Which door will the hat open? What would a second card change?',
    },
  },
  'orchard-rows': {
    all: {
      notice: 'Does {name} count the blocks one by one, row by row or say the total straight away?',
      say: 'Three rows of four. How many is that? Is it the same from the side?',
    },
  },
  'welcome-ways': {
    all: {
      notice: 'Does {name} widen the entrance, move a block aside or push each toy through?',
      say: 'In rolls the car. In hops the bunny. Room for both!',
    },
    school: {
      notice: 'Does {name} change the entrance after watching the second toy try it?',
      say: 'Did it work for both toys? What would you change for a third?',
    },
  },
  'shape-buddies': {
    all: {
      notice: 'Does {name} slide the toy over, move the bowl or change the bridge?',
      say: 'Over the bridge and into the bowl! Now move the bowl. Again?',
    },
    school: {
      notice: 'Does {name} point to where the toy will land before letting go?',
      say: 'What did you change? Where do you think it will land now?',
    },
  },
  'playdate-workshop': {
    all: {
      notice: 'Does {name} pass the crayon, keep it a little longer or say no thanks?',
      say: 'Bear has the crayon now. Rabbit is next. Your turn, Rabbit!',
    },
  },
  'read-do': {
    all: {
      notice: 'Does {name} read the words aloud, point to each word or go straight to find a toy?',
      say: 'It says big pig. Let us find one! What shall we write next?',
    },
    school: {
      notice: 'Does {name} write a card for you to read and match?',
      say: 'Your turn to write one. Could two toys match your card?',
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
