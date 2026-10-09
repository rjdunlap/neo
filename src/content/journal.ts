import { ANIMALS, FAVORITE } from '../games/animal-snack/logic';
import { ALL_THINGS, floats, type Thing } from '../games/sink-float/logic';
import type { LineId } from './voice-script';

/**
 * The discovery journal: a small, fixed collection of things she has seen for herself. Every entry has one known
 * source (the game that shows it), so nothing is random, rare or timed, and the journal always says where an entry
 * is found. A game reports what it actually showed during a round (`RoundResult.discoveries`); the shell files it.
 */

export type JournalGame = 'sink-float' | 'animal-snack';

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

/** Observations, in the words a grown-up would say. One line per thing and per animal. */
const SINK_LINES: Record<Thing, LineId> = {
  duck: 'journal.sink.duck',
  boat: 'journal.sink.boat',
  ball: 'journal.sink.ball',
  leaf: 'journal.sink.leaf',
  apple: 'journal.sink.apple',
  rock: 'journal.sink.rock',
  key: 'journal.sink.key',
  coin: 'journal.sink.coin',
  spoon: 'journal.sink.spoon',
};

const SNACK_LINES: Record<string, LineId> = {
  cow: 'journal.snack.cow',
  bunny: 'journal.snack.bunny',
  dog: 'journal.snack.dog',
  cat: 'journal.snack.cat',
  duck: 'journal.snack.duck',
  pig: 'journal.snack.pig',
  bear: 'journal.snack.bear',
};

/** Floaters first, then sinkers, so the cards read as two groups; then the animals in the order the game lists them. */
const sinkOrder = [...ALL_THINGS.filter(floats), ...ALL_THINGS.filter((t) => !floats(t))];

export const JOURNAL: readonly JournalEntry[] = [
  ...sinkOrder.map((t): JournalEntry => ({
    id: entryId('sink-float', t),
    game: 'sink-float',
    key: t,
    name: cap(t),
    line: SINK_LINES[t],
    source: { find: `put the ${t} into the water`, found: `the ${t} went into the water` },
  })),
  ...ANIMALS.map((a): JournalEntry => ({
    id: entryId('animal-snack', a),
    game: 'animal-snack',
    key: a,
    name: `${cap(a)} and ${FAVORITE[a]}`,
    line: SNACK_LINES[a],
    source: { find: `let the ${a} eat ${FAVORITE[a]}`, found: `the ${a} ate ${FAVORITE[a]}` },
  })),
];

export const JOURNAL_IDS: readonly string[] = JOURNAL.map((e) => e.id);
export const entryById = (id: string) => JOURNAL.find((e) => e.id === id);
export const entriesOf = (game: JournalGame) => JOURNAL.filter((e) => e.game === game);

/** A card names the exact revealing action, not just the game that contains it. */
export function sourceText(entry: JournalEntry, gameName: string, found: boolean): string {
  return found ? `Found in ${gameName} when ${entry.source.found}.` : `In ${gameName}, ${cap(entry.source.find)}.`;
}

/** The journal in the save. `seen` is how many entries she had looked at when she last opened it (for a twinkle). */
export interface JournalSave {
  found: string[];
  seen: number;
}

export const emptyJournal = (): JournalSave => ({ found: [], seen: 0 });

/** What a restored or hand-edited save may keep: known entries, once each, in the order they were found. */
export function cleanJournal(raw: unknown): JournalSave {
  const r = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const known = new Set(JOURNAL_IDS);
  const found = [...new Set(Array.isArray(r.found) ? r.found.filter((id): id is string => typeof id === 'string' && known.has(id)) : [])];
  const seen = typeof r.seen === 'number' && Number.isFinite(r.seen) ? Math.max(0, Math.min(found.length, Math.floor(r.seen))) : 0;
  return { found, seen };
}

/** Adds what a round showed. Unknown ids and ones already found change nothing; `added` is what is new this time. */
export function discover(journal: JournalSave, ids: readonly string[] | undefined): { journal: JournalSave; added: string[] } {
  const known = new Set(JOURNAL_IDS);
  const have = new Set(journal.found);
  const added: string[] = [];
  for (const id of ids ?? []) {
    if (known.has(id) && !have.has(id)) {
      have.add(id);
      added.push(id);
    }
  }
  return added.length ? { journal: { ...journal, found: [...journal.found, ...added] }, added } : { journal, added };
}

/** She has opened the journal: everything found so far counts as looked at. */
export const markSeen = (journal: JournalSave): JournalSave => (journal.seen === journal.found.length ? journal : { ...journal, seen: journal.found.length });

/** Whether there is something she has not looked at yet. */
export const hasNew = (journal: JournalSave) => journal.found.length > journal.seen;
