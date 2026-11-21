import { ANIMALS, FAVORITE, FOOD_WORDS } from '../games/animal-snack/logic';
import { WORDS } from '../learning/words/letter-words';
import { ACTIONS, type Action } from '../games/photo-safari/logic';
import { ALL_THINGS, floats, thingWord, type Thing } from '../games/sink-float/logic';
import { HELPER, HELPERS } from '../games/mail-carrier/logic';
import { CHANGERS, EARLY, SUBSTANCES } from '../games/melt-freeze/logic';
import { KITCHEN_DISCOVERIES, type KitchenDiscovery } from '../games/pet-kitchen/logic';
import { RECIPES } from '../games/paint-mixer/logic';
import type { LineId } from './voice-script';

/**
 * The discovery journal: a small, fixed collection of things she has seen for herself. Every entry has one known
 * source (the game that shows it), so nothing is random, rare or timed, and the journal always says where an entry
 * is found. A game reports what it actually showed during a round (`RoundResult.discoveries`); the shell files it.
 */

export type JournalGame =
  | 'sink-float'
  | 'animal-snack'
  | 'photo-safari'
  | 'seesaw-balance'
  | 'bouncy-launch'
  | 'habitat-helpers'
  | 'letter-trails'
  | 'mail-carrier'
  | 'rhythm-neighbors'
  | 'melt-freeze'
  | 'pet-kitchen'
  | 'paint-mixer'
  | 'far-lights'
  | 'chain-reaction'
  | 'spinner-fair'
  | 'swing-pals';

export interface JournalEntry {
  /** Stable forever: `game:key`. Saves keep these, so never rename one. */
  id: string;
  game: JournalGame;
  key: string;
  /** Short card caption. */
  name: string;
  /** The spoken observation, replayable from the card. */
  line: LineId;
  /** The exact action that reveals this entry, for an unfound card and for remembering where it came from. */
  source: {
    /** Lower-case imperative clause, such as "put the duck into the water". */
    find: string;
    /** Lower-case past-tense clause, such as "the duck went into the water". */
    found: string;
  };
}

export const entryId = (game: JournalGame, key: string) => `${game}:${key}`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const KITCHEN_NAMES: Record<KitchenDiscovery, string> = {
  half: 'Two halves make a whole',
  quarter: 'Two quarters make a half',
  third: 'Three thirds make a pizza',
};
const KITCHEN_SOURCES: Record<KitchenDiscovery, JournalEntry['source']> = {
  half: {
    find: 'cut food in halves and share every half fairly',
    found: 'the two halves of the food were shared out',
  },
  quarter: { find: 'give a friend two quarters', found: 'a friend had two quarters, the same as one half' },
  third: {
    find: 'cut a pizza in thirds and share every slice',
    found: 'the pizza was cut in three equal slices and shared out',
  },
};

/** Observations, in the words a grown-up would say. One line per thing and per animal. */
const SINK_LINES: Record<Thing, LineId> = {
  duck: 'journal.sink.duck',
  boat: 'journal.sink.boat',
  ball: 'journal.sink.ball',
  feather: 'journal.sink.feather',
  leaf: 'journal.sink.leaf',
  apple: 'journal.sink.apple',
  log: 'journal.sink.log',
  ice: 'journal.sink.ice',
  rock: 'journal.sink.rock',
  key: 'journal.sink.key',
  marble: 'journal.sink.marble',
  coin: 'journal.sink.coin',
  spoon: 'journal.sink.spoon',
  paperclip: 'journal.sink.paperclip',
};

const SNACK_LINES: Record<string, LineId> = {
  cow: 'journal.snack.cow',
  bunny: 'journal.snack.bunny',
  dog: 'journal.snack.dog',
  cat: 'journal.snack.cat',
  duck: 'journal.snack.duck',
  pig: 'journal.snack.pig',
  bear: 'journal.snack.bear',
  sheep: 'journal.snack.sheep',
  horse: 'journal.snack.horse',
  hen: 'journal.snack.hen',
  mouse: 'journal.snack.mouse',
};

const SAFARI_LINES: Record<Action, LineId> = {
  jumping: 'journal.safari.jumping',
  sleeping: 'journal.safari.sleeping',
  eating: 'journal.safari.eating',
  dancing: 'journal.safari.dancing',
  waving: 'journal.safari.waving',
  swimming: 'journal.safari.swimming',
};

const TRAIL_LINES: Record<string, LineId> = {
  A: 'journal.trails.A',
  B: 'journal.trails.B',
  C: 'journal.trails.C',
  D: 'journal.trails.D',
  E: 'journal.trails.E',
  F: 'journal.trails.F',
  G: 'journal.trails.G',
  H: 'journal.trails.H',
  I: 'journal.trails.I',
  J: 'journal.trails.J',
  K: 'journal.trails.K',
  L: 'journal.trails.L',
  M: 'journal.trails.M',
  N: 'journal.trails.N',
  O: 'journal.trails.O',
  P: 'journal.trails.P',
  Q: 'journal.trails.Q',
  R: 'journal.trails.R',
  S: 'journal.trails.S',
  T: 'journal.trails.T',
  U: 'journal.trails.U',
  V: 'journal.trails.V',
  W: 'journal.trails.W',
  X: 'journal.trails.X',
  Y: 'journal.trails.Y',
  Z: 'journal.trails.Z',
};

/** Floaters first, then sinkers, so the cards read as two groups; then the animals in the order the game lists them. */
const sinkOrder = [...ALL_THINGS.filter(floats), ...ALL_THINGS.filter((t) => !floats(t))];

export const JOURNAL: readonly JournalEntry[] = [
  ...sinkOrder.map((t): JournalEntry => ({
    id: entryId('sink-float', t),
    game: 'sink-float',
    key: t,
    name: cap(thingWord(t)),
    line: SINK_LINES[t],
    source: {
      find: `put the ${thingWord(t)} into the water`,
      found: `the ${thingWord(t)} went into the water`,
    },
  })),
  ...ANIMALS.map((a): JournalEntry => ({
    id: entryId('animal-snack', a),
    game: 'animal-snack',
    key: a,
    name: `${cap(a)} and ${FAVORITE[a]}`,
    line: SNACK_LINES[a],
    source: {
      find: `let the ${a} eat ${FOOD_WORDS[FAVORITE[a]!]}`,
      found: `the ${a} ate ${FOOD_WORDS[FAVORITE[a]!]}`,
    },
  })),
  ...ACTIONS.map((action): JournalEntry => ({
    id: entryId('photo-safari', action),
    game: 'photo-safari',
    key: action,
    name: cap(action),
    line: SAFARI_LINES[action],
    source: { find: `take a photo of an animal ${action}`, found: `an animal ${action} was photographed` },
  })),
  {
    id: entryId('seesaw-balance', 'heavy-down'),
    game: 'seesaw-balance',
    key: 'heavy-down',
    name: 'Heavier side',
    line: 'journal.seesaw.heavy',
    source: {
      find: 'put more weight on one side of the seesaw',
      found: 'one side held more weight and went down',
    },
  },
  {
    id: entryId('seesaw-balance', 'equal-level'),
    game: 'seesaw-balance',
    key: 'equal-level',
    name: 'Same weight',
    line: 'journal.seesaw.equal',
    source: {
      find: 'make both sides of the seesaw weigh the same',
      found: 'both sides weighed the same and the seesaw became level',
    },
  },
  {
    id: entryId('bouncy-launch', 'bigger-pull'),
    game: 'bouncy-launch',
    key: 'bigger-pull',
    name: 'Bigger pull',
    line: 'journal.launch.pull',
    source: {
      find: 'try two different pulls and watch where the pet lands',
      found: 'a bigger pull sent the pet farther than a smaller pull',
    },
  },
  {
    id: entryId('habitat-helpers', 'bunny'),
    game: 'habitat-helpers',
    key: 'bunny',
    name: 'Bunny habitat',
    line: 'journal.habitat.bunny',
    source: {
      find: 'build a garden with food, water and shelter for Bunny and open the gate',
      found: 'a garden supplied food, water and shelter and Bunny visited',
    },
  },
  {
    id: entryId('habitat-helpers', 'duck'),
    game: 'habitat-helpers',
    key: 'duck',
    name: 'Duck habitat',
    line: 'journal.habitat.duck',
    source: {
      find: 'build a garden with food, water and shelter for Duck and open the gate',
      found: 'a garden supplied food, water and shelter and Duck visited',
    },
  },
  {
    id: entryId('rhythm-neighbors', 'frogs-answer'),
    game: 'rhythm-neighbors',
    key: 'frogs-answer',
    name: 'The frogs answered the woodpecker',
    line: 'journal.neighbors.answer',
    source: {
      find: 'take turns with the woodpecker and answer its knocks with the frogs',
      found: 'the woodpecker knocked and the frog answered',
    },
  },
  ...Object.keys(WORDS).map((letter): JournalEntry => ({
    id: entryId('letter-trails', letter),
    game: 'letter-trails',
    key: letter,
    name: `${letter} is for ${WORDS[letter]}`,
    line: TRAIL_LINES[letter],
    source: {
      find: `trace the letter ${letter} to its end`,
      found: `the letter ${letter} was traced to its end`,
    },
  })),
  ...HELPERS.map((helper): JournalEntry => ({
    id: entryId('mail-carrier', helper),
    game: 'mail-carrier',
    key: helper,
    name: `The ${helper} fixes ${HELPER[helper].fixes}`,
    line: `journal.mail.${helper}` as LineId,
    source: {
      find: `deliver the letter that shows the ${HELPER[helper].problem} to the ${helper}`,
      found: `the ${helper} fixed the ${HELPER[helper].problem} with ${HELPER[helper].toolName}`,
    },
  })),
  // Melt and Freeze, levels 4 and 6: each thing she watched melt (on the tray, where it also went hard again, or after
  // a guess), and the things that stayed the same. The ice lolly is only ever met at level 6.
  ...CHANGERS.map((s): JournalEntry => ({
    id: entryId('melt-freeze', s),
    game: 'melt-freeze',
    key: s,
    name: cap(SUBSTANCES[s].word),
    line: `journal.melt.${s}` as LineId,
    source: EARLY.includes(s)
      ? {
          find: `warm and cool a tray with the ${s} on it`,
          found: `the ${s} melted in the warm and went hard again in the cool`,
        }
      : {
          find: `say what you think the sun will do to the ${SUBSTANCES[s].word}, then warm it`,
          found: `the ${SUBSTANCES[s].word} melted in the warm`,
        },
  })),
  {
    id: entryId('melt-freeze', 'stays'),
    game: 'melt-freeze',
    key: 'stays',
    name: 'Stays the same',
    line: 'journal.melt.stays',
    source: {
      find: 'warm a thing that does not melt, like a stone or a spoon',
      found: 'some things stayed the same in the warm',
    },
  },
  // Melt and Freeze, level 7: what the snowflake test showed, each filed only by a round that showed it.
  {
    id: entryId('melt-freeze', 'goes-back'),
    game: 'melt-freeze',
    key: 'goes-back',
    name: 'Goes back',
    line: 'journal.melt.goes-back',
    source: {
      find: 'cool a puddle with the snowflake and see whether it can go back',
      found: 'a puddle went hard again in the cool',
    },
  },
  {
    id: entryId('melt-freeze', 'cant-go-back'),
    game: 'melt-freeze',
    key: 'cant-go-back',
    name: 'Can’t go back',
    line: 'journal.melt.cant-go-back',
    source: {
      find: 'cool the toast or the popped kernel with the snowflake and see whether it can go back',
      found: 'toast stayed toast and a popped kernel stayed popped',
    },
  },
  // Pet Kitchen: what a fair or asked-for serve showed (decision 6 of its dive).
  ...KITCHEN_DISCOVERIES.map((k): JournalEntry => ({
    id: entryId('pet-kitchen', k),
    game: 'pet-kitchen',
    key: k,
    name: KITCHEN_NAMES[k],
    line: `journal.kitchen.${k}` as LineId,
    source: KITCHEN_SOURCES[k],
  })),
  // Paint Mixer, level 5: the paint shelf, one card per three-pot recipe whose bucket matched (definition paint-mixer-5-6).
  ...RECIPES.map((r): JournalEntry => {
    const recipe = r.pots.map((pot, i) => `${r.counts[i]} ${pot}`);
    const said = `${recipe[0]}, ${recipe[1]} and ${recipe[2]}`;
    return {
      id: entryId('paint-mixer', r.name),
      game: 'paint-mixer',
      key: r.name,
      name: cap(r.name),
      line: `journal.paint.${r.name}` as LineId,
      source: {
        find: `make the bucket the sample's colour with ${said}`,
        found: `the bucket was ${r.name}: ${said}`,
      },
    };
  }),
  // Far Lights, level 7: a strong light far away and a gentle light close by looked the same (definition levels 5–8).
  {
    id: entryId('far-lights', 'strong-far'),
    game: 'far-lights',
    key: 'strong-far',
    name: 'A strong light far away',
    line: 'journal.far.strong-far',
    source: {
      find: 'tell which light is farther when a strong light and a gentle light look the same',
      found: 'a strong light far away looked as bright as a gentle light close by',
    },
  },
  // Chain Reaction, level 10 Springboard: a run bounced on the spring and skipped the ramp under it.
  {
    id: entryId('chain-reaction', 'spring-skip'),
    game: 'chain-reaction',
    key: 'spring-skip',
    name: 'The spring skips a row',
    line: 'journal.chain.spring',
    source: {
      find: 'send the marble onto the green spring and watch where it lands',
      found: 'the spring bounced the marble over one row, past the ramp under it',
    },
  },
  // Spinner Fair, level 7 Two dice: the grid of every way two dice can land, watched being built. It files on the grid,
  // never on what the dice rolled (definition spinner-fair-6-8).
  {
    id: entryId('spinner-fair', 'two-dice'),
    game: 'spinner-fair',
    key: 'two-dice',
    name: 'Two dice',
    line: 'journal.spinner-fair.two-dice',
    source: {
      find: 'fill the two-dice grid',
      found: 'the two-dice grid showed seven has the most ways',
    },
  },
  // Swing Pals, level 3 Short rope, long rope or level 7 Who comes back first?: two ropes of different lengths swung
  // side by side, and the shorter one came back first (showsSlower in the game's rules).
  {
    id: entryId('swing-pals', 'longer-slower'),
    game: 'swing-pals',
    key: 'longer-slower',
    name: 'Long ropes swing slower',
    line: 'journal.swing.slower',
    source: {
      find: 'swing a friend on a short rope beside a friend on a long rope',
      found: 'the friend on the long rope swung slower and came back after the short rope',
    },
  },
];

export const JOURNAL_IDS: readonly string[] = JOURNAL.map((e) => e.id);
export const entryById = (id: string) => JOURNAL.find((e) => e.id === id);
export const entriesOf = (game: JournalGame) => JOURNAL.filter((e) => e.game === game);

/** A card names the exact revealing action, not just the game that contains it. */
export function sourceText(entry: JournalEntry, gameName: string, found: boolean): string {
  return found
    ? `Found in ${gameName} when ${entry.source.found}.`
    : `In ${gameName}, ${cap(entry.source.find)}.`;
}

/** The journal in the save. `seen` is how many entries she had looked at when she last opened it (for a twinkle). */
export interface JournalSave {
  found: string[];
  seen: number;
}

export const emptyJournal = (): JournalSave => ({ found: [], seen: 0 });

/** What a restored or hand-edited save may keep: known entries, once each, in the order they were found. */
export function cleanJournal(raw: unknown): JournalSave {
  const r =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const known = new Set(JOURNAL_IDS);
  const found = [
    ...new Set(
      Array.isArray(r.found)
        ? r.found.filter((id): id is string => typeof id === 'string' && known.has(id))
        : [],
    ),
  ];
  const seen =
    typeof r.seen === 'number' && Number.isFinite(r.seen)
      ? Math.max(0, Math.min(found.length, Math.floor(r.seen)))
      : 0;
  return { found, seen };
}

/** Adds what a round showed. Unknown ids and ones already found change nothing; `added` is what is new this time. */
export function discover(
  journal: JournalSave,
  ids: readonly string[] | undefined,
): { journal: JournalSave; added: string[] } {
  const known = new Set(JOURNAL_IDS);
  const have = new Set(journal.found);
  const added: string[] = [];
  for (const id of ids ?? []) {
    if (known.has(id) && !have.has(id)) {
      have.add(id);
      added.push(id);
    }
  }
  return added.length
    ? { journal: { ...journal, found: [...journal.found, ...added] }, added }
    : { journal, added };
}

/** She has opened the journal: everything found so far counts as looked at. */
export const markSeen = (journal: JournalSave): JournalSave =>
  journal.seen === journal.found.length ? journal : { ...journal, seen: journal.found.length };

/** Whether there is something she has not looked at yet. */
export const hasNew = (journal: JournalSave) => journal.found.length > journal.seen;
