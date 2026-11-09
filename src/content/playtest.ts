/**
 * Playtest notes: what a grown-up thought of a game after a Today's six round, kept in that grown-up's own save so two
 * people on two phones can compare. One note per game and day: a reaction, a line of text, or both. A grown-up profile
 * only; nothing here is shown to a child, counted across days or owed. `notesText` turns the notes into plain text to
 * paste into docs/OBSERVATIONS.md.
 */
export const RATINGS = ['good', 'ok', 'fix'] as const;
export type Rating = (typeof RATINGS)[number];
export const RATING_LABEL: Record<Rating, string> = { good: 'Good', ok: 'Fine', fix: 'Needs work' };

export interface PlaytestNote {
  /** The local calendar day, `YYYY-MM-DD` (`dayKey`). */
  day: string;
  game: string;
  level: number;
  rating: Rating | null;
  note: string;
  at: number;
}

/** About seven weeks of six a day; the oldest notes fall off first. */
export const MAX_NOTES = 300;
export const MAX_NOTE_LENGTH = 280;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A stored list, repaired: well-formed notes only, one per game and day (the last wins), empty ones dropped, bounded. */
export function cleanPlaytest(raw: unknown): PlaytestNote[] {
  if (!Array.isArray(raw)) return [];
  let out: PlaytestNote[] = [];
  for (const r of raw) {
    if (!isObj(r) || typeof r.day !== 'string' || !DAY.test(r.day)) continue;
    if (typeof r.game !== 'string' || !r.game || r.game.length > 60) continue;
    out = setNote(out, {
      day: r.day,
      game: r.game,
      level: typeof r.level === 'number' && Number.isFinite(r.level) ? Math.max(1, Math.floor(r.level)) : 1,
      rating: RATINGS.find((x) => x === r.rating) ?? null,
      note: typeof r.note === 'string' ? r.note : '',
      at: typeof r.at === 'number' && Number.isFinite(r.at) ? r.at : 0,
    });
  }
  return out;
}

/** The list with `entry` as that game's note for that day; an entry with no reaction and no text removes the note. */
export function setNote(list: readonly PlaytestNote[], entry: PlaytestNote): PlaytestNote[] {
  const rest = list.filter((n) => !(n.day === entry.day && n.game === entry.game));
  const note = entry.note.trim().slice(0, MAX_NOTE_LENGTH);
  if (!entry.rating && !note) return rest;
  return [...rest, { ...entry, note }].slice(-MAX_NOTES);
}

export const noteFor = (list: readonly PlaytestNote[], day: string, game: string) =>
  list.find((n) => n.day === day && n.game === game);

/** The notes as plain text, newest day first, one line per game: for pasting into the observations doc or a message. */
export function notesText(
  list: readonly PlaytestNote[],
  player: string,
  nameOf: (game: string) => string,
): string {
  if (!list.length) return '';
  const days = [...new Set(list.map((n) => n.day))].sort().reverse();
  const lines = [`Playtest notes${player ? `, ${player}` : ''}`];
  for (const day of days) {
    lines.push('', day);
    for (const n of list.filter((x) => x.day === day)) {
      const rating = n.rating ? RATING_LABEL[n.rating] : 'No reaction';
      lines.push(
        `- ${nameOf(n.game)} (${n.game}, level ${n.level}): ${rating}${n.note ? `. ${n.note}` : ''}`,
      );
    }
  }
  return lines.join('\n');
}
