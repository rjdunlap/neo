import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';
export type Shape = 'square' | 'roof' | 'triangle' | 'rectangle' | 'hull' | 'parallelogram';
export interface Piece {
  shape: Shape;
  turns: number;
  /** Mirrored left to right before it is turned; only level 9 flips a piece, so a slot never sets it. */
  flip?: boolean;
}
export interface Target extends Piece {
  x: number;
  y: number;
}
export const VERTICES: Record<Shape, number[]> = {
  square: [-70, -70, 70, -70, 70, 70, -70, 70],
  roof: [-90, 60, 0, -70, 90, 60],
  triangle: [-70, -70, 70, -70, -70, 70],
  rectangle: [-100, -50, 100, -50, 100, 50, -100, 50],
  hull: [-100, -45, 100, -45, 60, 45, -60, 45],
  /** Leans like a backslash: the one shape here that a mirror changes into something no turn can make. */
  parallelogram: [-100, -50, 40, -50, 100, 50, -40, 50],
};
/** Each picture is a set of slots; the bounding box of all of them stays inside PICTURE_BOX so it clears the buttons and the tray. */
export const PICTURES = {
  house: [
    { shape: 'square', x: 0, y: 70, turns: 0 },
    { shape: 'roof', x: 0, y: -60, turns: 0 },
  ],
  tent: [
    { shape: 'roof', x: 0, y: 0, turns: 0 },
    { shape: 'rectangle', x: 0, y: 110, turns: 0 },
  ],
  barn: [
    { shape: 'triangle', x: 0, y: 70, turns: 0 },
    { shape: 'triangle', x: 0, y: 70, turns: 2 },
    { shape: 'hull', x: 0, y: -45, turns: 2 },
  ],
  tree: [
    { shape: 'roof', x: 0, y: -60, turns: 0 },
    { shape: 'rectangle', x: 0, y: 100, turns: 1 },
  ],
  boat: [
    { shape: 'hull', x: 0, y: 100, turns: 0 },
    { shape: 'triangle', x: 0, y: -15, turns: 1 },
  ],
  sailboat: [
    { shape: 'hull', x: 0, y: 100, turns: 0 },
    { shape: 'roof', x: 0, y: -5, turns: 0 },
  ],
  flag: [
    { shape: 'rectangle', x: -60, y: 100, turns: 1 },
    { shape: 'triangle', x: 60, y: 70, turns: 0 },
  ],
  cottage: [
    { shape: 'triangle', x: 0, y: 70, turns: 0 },
    { shape: 'triangle', x: 0, y: 70, turns: 2 },
    { shape: 'roof', x: 0, y: -60, turns: 0 },
  ],
  truck: [
    { shape: 'rectangle', x: -60, y: 90, turns: 0 },
    { shape: 'triangle', x: 110, y: 70, turns: 0 },
    { shape: 'triangle', x: 110, y: 70, turns: 2 },
  ],
  tower: [
    { shape: 'triangle', x: 0, y: 70, turns: 0 },
    { shape: 'triangle', x: 0, y: 70, turns: 2 },
    { shape: 'rectangle', x: 0, y: -100, turns: 1 },
  ],
  ferry: [
    { shape: 'hull', x: 0, y: 100, turns: 0 },
    { shape: 'triangle', x: 0, y: -15, turns: 0 },
    { shape: 'triangle', x: 0, y: -15, turns: 2 },
  ],
  rocket: [
    { shape: 'rectangle', x: 0, y: 35, turns: 1 },
    { shape: 'roof', x: 0, y: -125, turns: 0 },
    { shape: 'triangle', x: -120, y: 65, turns: 2 },
    { shape: 'triangle', x: 120, y: 65, turns: 3 },
  ],
  lamp: [
    { shape: 'hull', x: 0, y: -65, turns: 2 },
    { shape: 'rectangle', x: 0, y: 80, turns: 1 },
  ],
  broom: [
    { shape: 'rectangle', x: 0, y: -70, turns: 1 },
    { shape: 'roof', x: 0, y: 100, turns: 0 },
  ],
  shovel: [
    { shape: 'rectangle', x: 0, y: -45, turns: 1 },
    { shape: 'hull', x: 0, y: 100, turns: 0 },
  ],
  bus: [
    { shape: 'rectangle', x: 60, y: 90, turns: 0 },
    { shape: 'triangle', x: -110, y: 70, turns: 0 },
    { shape: 'triangle', x: -110, y: 70, turns: 2 },
  ],
  castle: [
    { shape: 'triangle', x: 0, y: 30, turns: 0 },
    { shape: 'triangle', x: 0, y: 30, turns: 2 },
    { shape: 'roof', x: 0, y: -100, turns: 0 },
    { shape: 'rectangle', x: 0, y: 150, turns: 0 },
  ],
  robot: [
    { shape: 'square', x: 0, y: -145, turns: 0 },
    { shape: 'rectangle', x: 0, y: -25, turns: 0 },
    { shape: 'triangle', x: -70, y: 95, turns: 0 },
    { shape: 'triangle', x: 70, y: 95, turns: 1 },
  ],
  fish: [
    { shape: 'hull', x: -60, y: 0, turns: 0 },
    { shape: 'triangle', x: 110, y: 0, turns: 0 },
  ],
  lighthouse: [
    { shape: 'rectangle', x: 0, y: 110, turns: 0 },
    { shape: 'square', x: 0, y: -10, turns: 0 },
    { shape: 'roof', x: 0, y: -140, turns: 0 },
  ],
  pine: [
    { shape: 'roof', x: 0, y: -100, turns: 0 },
    { shape: 'hull', x: 0, y: 5, turns: 2 },
    { shape: 'square', x: 0, y: 120, turns: 0 },
  ],
  bridge: [
    { shape: 'rectangle', x: 0, y: -40, turns: 0 },
    { shape: 'hull', x: -110, y: 55, turns: 2 },
    { shape: 'hull', x: 110, y: 55, turns: 2 },
  ],
  houseboat: [
    { shape: 'hull', x: 0, y: 100, turns: 0 },
    { shape: 'triangle', x: 0, y: -15, turns: 0 },
    { shape: 'triangle', x: 0, y: -15, turns: 2 },
    { shape: 'roof', x: 0, y: -145, turns: 0 },
  ],
  ship: [
    { shape: 'hull', x: 0, y: 130, turns: 0 },
    { shape: 'rectangle', x: 0, y: -15, turns: 1 },
    { shape: 'triangle', x: -120, y: 15, turns: 2 },
    { shape: 'triangle', x: 120, y: 15, turns: 3 },
  ],
  kite: [
    { shape: 'roof', x: 0, y: -65, turns: 0 },
    { shape: 'parallelogram', x: 0, y: 55, turns: 0 },
  ],
  sled: [
    { shape: 'parallelogram', x: 0, y: -10, turns: 0 },
    { shape: 'hull', x: 0, y: 90, turns: 0 },
  ],
  scarf: [
    { shape: 'parallelogram', x: 0, y: -75, turns: 0 },
    { shape: 'rectangle', x: 0, y: 25, turns: 0 },
  ],
  dock: [
    { shape: 'square', x: 0, y: -20, turns: 0 },
    { shape: 'parallelogram', x: 0, y: 100, turns: 0 },
  ],
  step: [
    { shape: 'square', x: -100, y: 50, turns: 0 },
    { shape: 'parallelogram', x: 80, y: 50, turns: 0 },
  ],
  ramp: [
    { shape: 'triangle', x: -100, y: 60, turns: 0 },
    { shape: 'parallelogram', x: 80, y: 60, turns: 0 },
  ],
} as const satisfies Record<string, readonly Target[]>;
export type PictureId = keyof typeof PICTURES;
/** Picture names are spoken as "Build a {picture}!", so each starts with a consonant. */
export const PICTURE_IDS = Object.keys(PICTURES) as PictureId[];
/** The room a picture may take, around the board's centre: clear of the turn and help buttons and of the tray. */
export const PICTURE_BOX = { x: 210, top: -220, bottom: 200 };
export interface Plan {
  rotate: boolean;
  outlines: boolean;
  name: string;
  pool: readonly PictureId[];
  alternatives?: boolean;
  repair?: boolean;
  /** A repair round that also has a flip button: the one wrong shape is the mirrored parallelogram. */
  flip?: boolean;
  /**
   * One piece home (level 10, toddler): the picture starts with every piece but one already in its place, the one left
   * snaps home from further away (SNAP_HOME) and no drop is ever a miss.
   */
  onePiece?: boolean;
}
export const PLANS: readonly Plan[] = [
  {
    pool: ['house', 'tree', 'lamp', 'tent', 'shovel', 'broom'],
    rotate: false,
    outlines: true,
    name: 'Two big shapes, already the right way up, make a house, tree, lamp, tent, shovel or broom',
  },
  {
    pool: ['boat', 'sailboat', 'flag', 'lamp', 'tent', 'fish', 'shovel', 'broom'],
    rotate: false,
    outlines: true,
    name: 'Fit two shapes to build a boat, flag, lamp, tent, fish, shovel or broom',
  },
  {
    pool: ['house', 'tree', 'flag', 'sailboat', 'lamp', 'tent', 'fish', 'shovel', 'broom'],
    rotate: true,
    outlines: true,
    name: 'Turn the shapes with quarter-turn snaps',
  },
  {
    pool: ['cottage', 'truck', 'tower', 'ferry', 'bus', 'barn'],
    rotate: true,
    outlines: true,
    name: 'Two triangles make a square; three shapes fill a picture',
  },
  {
    pool: ['rocket', 'houseboat', 'castle', 'robot', 'ship'],
    rotate: true,
    outlines: true,
    name: 'Build a rocket, houseboat, castle, robot or ship from four shapes',
  },
  {
    pool: [
      'cottage',
      'truck',
      'tower',
      'ferry',
      'houseboat',
      'bus',
      'castle',
      'barn',
      'robot',
      'lighthouse',
      'pine',
      'bridge',
    ],
    rotate: true,
    outlines: false,
    name: 'Fill a silhouette; ask for outlines and the next turn when needed',
  },
  {
    pool: ['house'],
    rotate: true,
    outlines: false,
    alternatives: true,
    name: 'Build a house two ways: a square or two triangles can make its wall',
  },
  {
    pool: ['house', 'tree', 'boat', 'sailboat', 'flag', 'lamp', 'tent', 'robot', 'fish'],
    rotate: true,
    outlines: true,
    repair: true,
    name: 'Find a shape facing the wrong way, turn it, then check the repaired picture',
  },
  {
    pool: ['kite', 'sled', 'scarf', 'dock', 'step', 'ramp'],
    rotate: true,
    outlines: true,
    repair: true,
    flip: true,
    name: 'Flip a leaning shape to match its outline: a flip makes a mirror that no turn can',
  },
  {
    pool: ['house', 'tree', 'lamp', 'tent', 'shovel', 'broom'],
    rotate: false,
    outlines: true,
    onePiece: true,
    name: 'One piece home: one shape is already in the picture; move the other onto its shadow',
  },
];
/** How near its shadow a dropped piece must land to snap in: the usual reach, and one piece home's wider one. */
export const SNAP = 76;
export const SNAP_HOME = 110;
/** A drop this near an open shadow that does not fit is a miss (never on a one-piece-home round). */
export const MISS_RING = 105;
export const planFor = (l: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, l - 1))];
/** The level's rules with the picture this round draws from its pool. */
export interface Build extends Plan {
  picture: PictureId;
  targets: readonly Target[];
  covers?: readonly (readonly number[])[];
  /** Slots whose piece is already in place when the round starts (one piece home); they get no tray piece. */
  preset?: readonly number[];
}
export function buildFor(level: number, rng: Rng): Build {
  const plan = planFor(level),
    picture = rng.pick(plan.pool);
  return plan.alternatives
    ? {
        ...plan,
        picture,
        targets: [PICTURES.house[1], PICTURES.house[0], PICTURES.cottage[0], PICTURES.cottage[1]],
        covers: [
          [0, 1],
          [0, 2, 3],
        ],
      }
    : plan.onePiece
      ? { ...plan, picture, targets: PICTURES[picture], preset: [rng.int(0, PICTURES[picture].length - 1)] }
      : { ...plan, picture, targets: PICTURES[picture] };
}
export function sameOrientation(shape: Shape, a: number, b: number) {
  const period = shape === 'square' ? 1 : shape === 'rectangle' || shape === 'parallelogram' ? 2 : 4;
  return (((a - b) % period) + period) % period === 0;
}
export function makePieces(build: Pick<Build, 'targets' | 'rotate' | 'preset'>, rng: Rng): Piece[] {
  return rng.shuffle(
    build.targets
      .filter((_, i) => !build.preset?.includes(i))
      .map((t) => ({
        shape: t.shape,
        turns: build.rotate ? (t.turns + rng.int(1, 3)) % 4 : t.turns,
      })),
  );
}
/** Any identical piece can fill a slot, including symmetric turns and the two complementary wall triangles. */
export function targetFor(
  piece: Piece,
  x: number,
  y: number,
  targets: readonly Target[],
  filled: boolean[],
  snap = SNAP,
): number {
  const near = targets
    .map((t, i) => ({ t, i, d: Math.hypot(t.x - x, t.y - y) }))
    .filter((a) => !filled[a.i] && a.d < snap)
    .sort((a, b) => a.d - b.d);
  return (
    near.find((a) => a.t.shape === piece.shape && sameOrientation(piece.shape, piece.turns, a.t.turns))?.i ??
    -1
  );
}
/** Whether a drop that did not place its piece counts as a miss: near an open shadow, and never on one piece home. */
export function isMiss(
  build: Pick<Build, 'targets' | 'onePiece'>,
  x: number,
  y: number,
  unavailable: readonly boolean[],
): boolean {
  return (
    !build.onePiece &&
    build.targets.some((t, i) => !unavailable[i] && Math.hypot(t.x - x, t.y - y) < MISS_RING)
  );
}
export function hintFor(piece: Piece, targets: readonly Target[], filled: boolean[]) {
  return targets.findIndex((t, i) => !filled[i] && t.shape === piece.shape);
}
/** How many taps of the turn button make `piece` fit `target`: none when it already does (a square or rectangle needs fewer than a roof). */
export function turnsToFit(piece: Piece, target: Piece): number {
  for (let k = 0; k < 4; k++) if (sameOrientation(piece.shape, piece.turns + k, target.turns)) return k;
  return 0;
}
/**
 * What a capable child aims for: the open place for this shape that takes the fewest turns, the hint's own pick on a tie.
 * The ghost finger turns the piece that many times and then carries it there, so a test can check it never misses.
 */
export function bestTarget(
  piece: Piece,
  targets: readonly Target[],
  filled: readonly boolean[],
): { index: number; turns: number } | undefined {
  let best: { index: number; turns: number } | undefined;
  targets.forEach((t, index) => {
    if (filled[index] || t.shape !== piece.shape) return;
    const turns = turnsToFit(piece, t);
    if (!best || turns < best.turns) best = { index, turns };
  });
  return best;
}

/** A surviving cover contains every placed slot, so accepting a slot can never strand the build. */
export function viableCovers(
  build: Pick<Build, 'targets' | 'covers'>,
  filled: readonly boolean[],
): readonly (readonly number[])[] {
  const covers = build.covers ?? [build.targets.map((_, i) => i)];
  return covers.filter((cover) => filled.every((done, i) => !done || cover.includes(i)));
}
/** Existing fixed-slot drop/turn rules consume this mask; incompatible alternative slots act occupied. */
export function unavailableSlots(
  build: Pick<Build, 'targets' | 'covers'>,
  filled: readonly boolean[],
): boolean[] {
  const covers = viableCovers(build, filled);
  return build.targets.map((_, i) => filled[i] || !covers.some((cover) => cover.includes(i)));
}
export function completedCover(
  build: Pick<Build, 'targets' | 'covers'>,
  filled: readonly boolean[],
): readonly number[] | undefined {
  return viableCovers(build, filled).find((cover) => cover.every((i) => filled[i]));
}
/** Shortest compatible cover first, then a missing slot. A triangle choice keeps the triangle cover. */
export function coverHint(build: Pick<Build, 'targets' | 'covers'>, filled: readonly boolean[]): number {
  const cover = [...viableCovers(build, filled)].sort((a, b) => a.length - b.length)[0];
  // Before a wall is chosen, show the larger wall piece first.
  if (build.covers && cover?.includes(1) && !filled[1]) return 1;
  return cover?.find((i) => !filled[i]) ?? -1;
}

/** Exactly one visible orientation error; rotationally equivalent turns never count as broken. */
export function makeRepair(build: Pick<Build, 'targets'>, rng: Rng): Piece[] {
  const pieces = build.targets.map((t) => ({ shape: t.shape, turns: t.turns }));
  const candidates = pieces
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !sameOrientation(p.shape, p.turns, p.turns + 1));
  const { p, i } = rng.pick(candidates);
  const turn = rng.pick([1, 2, 3].filter((k) => !sameOrientation(p.shape, p.turns, p.turns + k)));
  pieces[i] = { ...p, turns: (p.turns + turn) % 4 };
  return pieces;
}
/** What a piece looks like once mirrored (if flipped) and turned: its corners, rounded and sorted, so two looks compare by eye. */
function look(piece: Piece): string {
  const turns = ((piece.turns % 4) + 4) % 4,
    cos = [1, 0, -1, 0][turns],
    sin = [0, 1, 0, -1][turns],
    v = VERTICES[piece.shape],
    out: string[] = [];
  for (let i = 0; i < v.length; i += 2) {
    const x = piece.flip ? -v[i] : v[i];
    out.push(`${Math.round(x * cos - v[i + 1] * sin)},${Math.round(x * sin + v[i + 1] * cos)}`);
  }
  return out.sort().join(' ');
}
/** The mirror-aware rule: the same corners in the same places, however the piece got there (turns, a flip, or both). */
export function looksSame(a: Piece, b: Piece): boolean {
  return a.shape === b.shape && look(a) === look(b);
}
export function repairMismatches(targets: readonly Target[], pieces: readonly Piece[]): number[] {
  return targets.flatMap((t, i) => (!pieces[i] || !looksSame(t, pieces[i]) ? [i] : []));
}
/** The fewest presses that make `piece` look like `target`: a flip first when a mirror is the quicker way, then turns. */
export function fixFor(piece: Piece, target: Piece): { flip: boolean; turns: number } | undefined {
  let best: { flip: boolean; turns: number; cost: number } | undefined;
  for (const flip of [false, true])
    for (let turns = 0; turns < 4; turns++) {
      const tried = {
          shape: piece.shape,
          flip: flip ? !piece.flip : !!piece.flip,
          turns: piece.turns + turns,
        },
        cost = turns + (flip ? 1 : 0);
      if (looksSame(tried, target) && (!best || cost < best.cost)) best = { flip, turns, cost };
    }
  return best && { flip: best.flip, turns: best.turns };
}
export function repairAction(
  targets: readonly Target[],
  pieces: readonly Piece[],
  selected: number | null,
): { pick: number } | { turn: true } | { flip: true } | { check: true } {
  const i = repairMismatches(targets, pieces)[0];
  if (i === undefined) return { check: true };
  if (selected !== i) return { pick: i };
  return fixFor(pieces[i], targets[i])?.flip ? { flip: true } : { turn: true };
}
/** Exactly one parallelogram is wrong: mirrored, turned a quarter, or both. Every other shape already fits. */
export function makeFlipRepair(build: Pick<Build, 'targets'>, rng: Rng): Piece[] {
  const pieces: Piece[] = build.targets.map((t) => ({ shape: t.shape, turns: t.turns }));
  const i = rng.pick(build.targets.flatMap((t, k) => (t.shape === 'parallelogram' ? [k] : [])));
  const wrong = [0, 1, 2, 3].flatMap((turns) =>
    [false, true]
      .map((flip) => ({ shape: pieces[i].shape, turns, flip }))
      .filter((p) => !looksSame(p, build.targets[i])),
  );
  pieces[i] = rng.pick(wrong);
  return pieces;
}

/** Appended easier entries: one piece home (10) plays before level 1 at toddler and is in no other band. */
export const ENTRY_LEVELS = [10] as const;
export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 10, order: [10, 1, 2] },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 9 },
};
