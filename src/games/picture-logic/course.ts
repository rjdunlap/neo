import { BUTTERFLY, CAT, DUCK, LIGHTHOUSE, SAILBOAT, type DrawnPicture } from './pictures';
import { fromDrawn, type PicturePuzzle } from './logic';

/**
 * A challenge course: fixed pictures played in a row as one round, scored by the fills made. The pictures are frozen data
 * (drawn in `pictures.ts`), so a record always means the same puzzles; the fewest fills for a picture is its filled squares,
 * worked out from the drawing, never typed in. Change a picture used here and the course's version must change too, which
 * starts a fresh record and keeps the old one (the course test pins each picture's clues to catch an accidental edit).
 */
export type PictureCourseId = 'pictures' | 'bigpictures';

export interface Course {
  id: PictureCourseId;
  /** Bump when a picture or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  pictures: readonly DrawnPicture[];
}

export const COURSES: Record<PictureCourseId, Course> = {
  pictures: {
    id: 'pictures',
    version: 1,
    name: 'Pond Pictures',
    blurb: 'Three 10 by 10 pictures in a row, from a sailboat to a cat: fill what the numbers say and see what appears.',
    pictures: [SAILBOAT, CAT, DUCK],
  },
  bigpictures: {
    id: 'bigpictures',
    version: 1,
    name: 'The Big Pictures',
    blurb: 'Two 15 by 15 pictures, an evening\'s puzzle: a lighthouse, then a butterfly.',
    pictures: [LIGHTHOUSE, BUTTERFLY],
  },
};

export const isPictureCourse = (v: unknown): v is PictureCourseId => v === 'pictures' || v === 'bigpictures';

const parsed = new Map<PictureCourseId, PicturePuzzle[]>();
/** The pictures of a course, read once. */
export function coursePictures(id: PictureCourseId): PicturePuzzle[] {
  let pictures = parsed.get(id);
  if (!pictures) parsed.set(id, pictures = COURSES[id].pictures.map(fromDrawn));
  return pictures;
}

/** The fewest fills for each picture of a course: its filled squares. */
export const courseBest = (id: PictureCourseId): number[] => coursePictures(id).map((p) => p.par);
/** The fewest fills for a whole course. */
export const courseMinimum = (id: PictureCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
