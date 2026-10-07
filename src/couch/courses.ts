import type { LineId } from '../content/voice-script';
import { CLOUDS, cloudMinimum } from '../games/bouncy-launch/course';
import { COURSES as PONDS, courseBoards, courseMinimum, type PondCourseId } from '../games/penguin-slide/course';
import type { CouchId } from './party';

/**
 * The couch's challenge courses: a fixed run of parts in one game, scored by how many tries it takes.
 * The parts themselves are frozen data in each game (`games/<game>/course.ts`); this is how the couch
 * speaks about them and how many there are. Adding a course means a game that can play one, an entry
 * here, and a save for it (`couch/course.ts` is generic over all of them).
 */
export type CourseId = PondCourseId | 'clouds';
/** In the order the Challenges menu shows them: a gentle one first. */
export const COURSE_IDS: readonly CourseId[] = ['practice', 'ponds', 'clouds'];
export const isCourseId = (v: unknown): v is CourseId => COURSE_IDS.includes(v as CourseId);

export interface CourseInfo {
  id: CourseId;
  game: CouchId;
  /** The level the game is created at; the course, not the level, decides what is played. */
  level: number;
  /** Bump when a part or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  /** The challenge card on the mode screen. */
  card: string;
  /** One part of the course ("pond") and the thing counted ("slide"); add an s for the plural. */
  part: string;
  unit: string;
  /** What the fewest for one part is called ("best route"), or null when it is always one try. */
  par: string | null;
  /** The fewest tries for each part, in order, and in all. */
  best: readonly number[];
  minimum: number;
  /** The sentence under the result's title, and what the course page says about help and leaving. */
  rule: string;
  note: string;
  leaving: string;
  done: LineId;
  badges: { finish: { title: string; how: string }; minimum: { title: string; how: string } };
}

/** The two Penguin Slide courses speak alike; only the ponds, and how they are pitched, differ. */
const ponds = (id: PondCourseId, card: string): CourseInfo => ({
  id, game: 'penguin-slide', level: 5, version: PONDS[id].version, name: PONDS[id].name, blurb: PONDS[id].blurb, card,
  part: 'pond', unit: 'slide', par: 'best route', best: courseBoards(id).map(b => b.best), minimum: courseMinimum(id),
  rule: 'Slide for the fewest slides. Every slide counts, even one you undo.',
  note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a pond starts that pond again, and the slides you made still count.',
  leaving: 'Leaving or refreshing starts the pond you are on again, and the slides you made on it still count. Finished ponds stay saved.',
  done: 'couch.course.done',
  badges: {
    finish: { title: 'Finished', how: 'Finish every pond, with or without help.' },
    minimum: { title: 'Perfect route', how: 'Finish with the fewest slides possible and no hint.' },
  },
});

const build: Record<CourseId, () => CourseInfo> = {
  practice: () => ponds('practice', 'Penguin Slide, five gentle ice puzzles with no dead ends. A warm-up, or an easy game for the evening.'),
  ponds: () => ponds('ponds', 'Penguin Slide, five ice puzzles that take real planning. Use the fewest slides you can, then beat your own best.'),
  clouds: () => ({
    id: 'clouds', game: 'bouncy-launch', level: 3, version: CLOUDS.version, name: CLOUDS.name, blurb: CLOUDS.blurb,
    card: 'Bouncy Launch, twelve small clouds in a row. Land on each with as few launches as you can, then beat your own best.',
    part: 'cloud', unit: 'launch', par: null, best: CLOUDS.targets.map(() => 1), minimum: cloudMinimum(),
    rule: 'Land on every cloud with the fewest launches. Every launch counts, even a miss.',
    note: 'Two misses on a cloud bring a hint: once shown it marks the whole run as helped, and helped and unhelped bests are kept apart. Leaving in the middle of a cloud starts you on it again, and the launches you made at it still count.',
    leaving: 'Leaving or refreshing starts you again on the cloud you are on, and the launches you made at it still count. Finished clouds stay saved.',
    done: 'couch.course.clouds',
    badges: {
      finish: { title: 'Finished', how: 'Land on every cloud, with or without help.' },
      minimum: { title: 'Perfect landings', how: 'Land on every cloud with your first launch and no hint.' },
    },
  }),
};

const cache = new Map<CourseId, CourseInfo>();
/** Everything the couch needs to describe a course. Built once: it reads the game's data. */
export function courseInfo(id: CourseId): CourseInfo {
  let info = cache.get(id);
  if (!info) cache.set(id, info = build[id]());
  return info;
}

/** "slides", "launches". */
export const unitsOf = (info: CourseInfo) => info.unit + (/(s|x|ch|sh)$/.test(info.unit) ? 'es' : 's');
/** "1 slide", "3 launches". */
export const countOf = (info: CourseInfo, n: number) => `${n} ${n === 1 ? info.unit : unitsOf(info)}`;
