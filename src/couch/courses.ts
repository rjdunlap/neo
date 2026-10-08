import type { LineId } from '../content/voice-script';
import { CLOUDS, cloudMinimum } from '../games/bouncy-launch/course';
import { COURSES as PONDS, courseBoards, courseMinimum, type PondCourseId } from '../games/penguin-slide/course';
import { COURSES as HARBORS_COURSE, courseBest as harborBest, courseMinimum as harborMinimum, type HarborCourseId } from '../games/ferry-jam/course';
import { COURSES as PICTURES, courseBest as pictureBest, courseMinimum as pictureMinimum, type PictureCourseId } from '../games/picture-logic/course';
import { COURSES as LANTERNS, courseBest as lanternBest, courseMinimum as lanternMinimum, type LanternCourseId } from '../games/lantern-lights/course';
import { COURSES as BEDS, courseBest as bedBest, courseMinimum as bedMinimum, type BedCourseId } from '../games/sudoku-garden/course';
import type { CouchId } from './party';

/**
 * The couch's challenge courses: a fixed run of parts in one game, scored by how many tries it takes.
 * The parts themselves are frozen data in each game (`games/<game>/course.ts`); this is how the couch
 * speaks about them and how many there are. Adding a course means a game that can play one, an entry
 * here, and a save for it (`couch/course.ts` is generic over all of them).
 */
export type CourseId = PondCourseId | 'clouds' | BedCourseId | LanternCourseId | PictureCourseId | HarborCourseId;
/** In the order the Challenges menu shows them: a gentle one first. */
export const COURSE_IDS: readonly CourseId[] = ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors'];
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
  /** The game can replay the best way through each part ("Watch the best route"): its demo bot plays the solver's route on that part. */
  routes: boolean;
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
  part: 'pond', unit: 'slide', par: 'best route', routes: true, best: courseBoards(id).map(b => b.best), minimum: courseMinimum(id),
  rule: 'Slide for the fewest slides. Every slide counts, even one you undo.',
  note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a pond starts that pond again, and the slides you made still count.',
  leaving: 'Leaving or refreshing starts the pond you are on again, and the slides you made on it still count. Finished ponds stay saved.',
  done: 'couch.course.done',
  badges: {
    finish: { title: 'Finished', how: 'Finish every pond, with or without help.' },
    minimum: { title: 'Perfect route', how: 'Finish with the fewest slides possible and no hint.' },
  },
});

/** The two Picture Logic courses speak alike; only the pictures differ. */
const pictures = (id: PictureCourseId, card: string, done: LineId): CourseInfo => ({
  id, game: 'picture-logic', level: id === 'pictures' ? 3 : 4, version: PICTURES[id].version, name: PICTURES[id].name, blurb: PICTURES[id].blurb, card,
  part: 'picture', unit: 'fill', par: 'fewest', routes: false, best: pictureBest(id), minimum: pictureMinimum(id),
  rule: 'Fill every picture with the fewest fills you can: one for each square in the picture, with nothing filled by mistake. Crosses, and taking a fill out, are free.',
  note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a picture empties it again, and the fills you made on it still count.',
  leaving: 'Leaving or refreshing empties the picture you are on, and the fills you made on it still count. Finished pictures stay saved.',
  done,
  badges: {
    finish: { title: 'Finished', how: 'Find every picture, with or without help.' },
    minimum: { title: 'Every fill right', how: 'Find every picture with one fill for each of its squares and no hint.' },
  },
});

/** The two Sudoku Garden courses speak alike; only the beds differ. */
const beds = (id: BedCourseId, card: string, done: LineId): CourseInfo => ({
  id, game: 'sudoku-garden', level: id === 'beds' ? 3 : 6, version: BEDS[id].version, name: BEDS[id].name, blurb: BEDS[id].blurb, card,
  part: 'bed', unit: 'entry', par: 'fewest', routes: false, best: bedBest(id), minimum: bedMinimum(id),
  rule: 'Fill every bed with the fewest entries you can: one for each empty square, with nothing replaced. Taking a number out and pencil marks are free.',
  note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a bed starts that bed again, and the entries you made on it still count.',
  leaving: 'Leaving or refreshing starts the bed you are on again, and the entries you made on it still count. Finished beds stay saved.',
  done,
  badges: {
    finish: { title: 'Finished', how: 'Finish every bed, with or without help.' },
    minimum: { title: 'Every entry right', how: 'Finish with one entry for each empty square and no hint.' },
  },
});

const build: Record<CourseId, () => CourseInfo> = {
  practice: () => ponds('practice', 'Penguin Slide, five gentle ice puzzles with no dead ends. A warm-up, or an easy game for the evening.'),
  ponds: () => ponds('ponds', 'Penguin Slide, five ice puzzles that take real planning. Use the fewest slides you can, then beat your own best.'),
  harbors: () => ({
    id: 'harbors', game: 'ferry-jam', level: 6, version: HARBORS_COURSE.harbors.version, name: HARBORS_COURSE.harbors.name, blurb: HARBORS_COURSE.harbors.blurb,
    card: 'Ferry Jam, five harbors in a row. Get the ferry to the dock in the fewest slides, then beat your own best.',
    part: 'harbor', unit: 'slide', par: 'best way', routes: true, best: harborBest('harbors'), minimum: harborMinimum('harbors'),
    rule: 'Clear every harbor in the fewest slides you can. A boat slid any distance is one slide, and every slide counts, even one you take back.',
    note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a harbor puts the boats back where they began, and the slides you made still count.',
    leaving: 'Leaving or refreshing puts the boats of the harbor you are on back where they began, and the slides you made on it still count. Finished harbors stay saved.',
    done: 'couch.course.harbors',
    badges: {
      finish: { title: 'Finished', how: 'Clear every harbor, with or without help.' },
      minimum: { title: 'Fewest slides', how: 'Clear every harbor with the fewest slides possible and no hint.' },
    },
  }),
  pictures: () => pictures('pictures', 'Picture Logic, three 10 by 10 pictures in a row. Fill what the numbers say, then beat your own best.', 'couch.course.pictures'),
  bigpictures: () => pictures('bigpictures', 'Picture Logic, two big 15 by 15 pictures. An evening\'s puzzle: fewer wrong fills is better.', 'couch.course.bigpictures'),
  lanterns: () => ({
    id: 'lanterns', game: 'lantern-lights', level: 6, version: LANTERNS.lanterns.version, name: LANTERNS.lanterns.name, blurb: LANTERNS.lanterns.blurb,
    card: 'Lantern Lights, five ponds of paper lanterns in a row. Light every lantern with the fewest presses, then beat your own best.',
    part: 'pond', unit: 'press', par: 'fewest', routes: false, best: lanternBest('lanterns'), minimum: lanternMinimum('lanterns'),
    rule: 'Light every lantern with the fewest presses you can. Every press counts, even one you take back.',
    note: 'A hint, once shown, marks the whole run as helped; helped and unhelped bests are kept apart. Leaving in the middle of a pond puts it back as it began, and the presses you made on it still count.',
    leaving: 'Leaving or refreshing puts the pond you are on back as it began, and the presses you made on it still count. Finished ponds stay saved.',
    done: 'couch.course.lanterns',
    badges: {
      finish: { title: 'Finished', how: 'Light every pond, with or without help.' },
      minimum: { title: 'Fewest presses', how: 'Light every pond with the fewest presses possible and no hint.' },
    },
  }),
  beds: () => beds('beds', 'Sudoku Garden, six small beds in a row. Place every number once, and beat your own best.', 'couch.course.beds'),
  bigbeds: () => beds('bigbeds', 'Sudoku Garden, three full 9 by 9 beds. An evening\'s puzzle: fewer replaced numbers is better.', 'couch.course.bigbeds'),
  clouds: () => ({
    id: 'clouds', game: 'bouncy-launch', level: 3, version: CLOUDS.version, name: CLOUDS.name, blurb: CLOUDS.blurb,
    card: 'Bouncy Launch, twelve small clouds in a row. Land on each with as few launches as you can, then beat your own best.',
    part: 'cloud', unit: 'launch', par: null, routes: false, best: CLOUDS.targets.map(() => 1), minimum: cloudMinimum(),
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

/** "slides", "launches", "entries". */
export const unitsOf = (info: CourseInfo) => /[^aeiou]y$/.test(info.unit) ? `${info.unit.slice(0, -1)}ies` : info.unit + (/(s|x|ch|sh)$/.test(info.unit) ? 'es' : 's');
/** "1 slide", "3 launches". */
export const countOf = (info: CourseInfo, n: number) => `${n} ${n === 1 ? info.unit : unitsOf(info)}`;
