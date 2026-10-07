/**
 * A challenge course for Bouncy Launch: a fixed run of target clouds, one after another, scored by the
 * total number of launches. Every landing is soft and a miss only means another launch, so the lowest
 * possible total is one launch per cloud. The sequence is frozen data, so a record always means the
 * same clouds; change it, or the clouds' size, and the version must change.
 *
 * Targets are pads numbered from 0 (nearest) to 4 (farthest). The clouds are smaller than in the
 * learning levels, so a launch has to be judged by feel; two misses on a cloud bring the help.
 */
export interface CloudCourse {
  id: 'clouds';
  /** Bump when the targets or the clouds' size change: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  targets: readonly number[];
  /** The width of a cloud against the learning levels' 0.85: how close a landing has to be. */
  padWidth: number;
}

export const CLOUDS: CloudCourse = {
  id: 'clouds',
  version: 1,
  name: 'Cloud Hopper',
  blurb: 'Twelve clouds in a row. Land on each with as few launches as you can.',
  // Never the same cloud twice running, every cloud at least twice, long hops and short ones.
  targets: [2, 4, 0, 3, 1, 4, 2, 0, 3, 1, 4, 2],
  padWidth: 0.5,
};

/** The fewest launches: one for every cloud. */
export const cloudMinimum = () => CLOUDS.targets.length;
