import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import stickerSeeds from './sticker-seeds.json';
import { SCRIPT } from '../../content/voice-script';
import { bodyBox, restPoints } from '../../creatures/companion';
import { SPECIES_IDS } from '../../creatures/species';
import {
  saysFrame,
  MOVE_CUES,
  shouldNudge,
  stickerRecipe,
  BODY,
  danceSeconds,
  ENTRY_PLANS,
  makeTurns,
  MOVE_WORDS,
  MOVES,
  PAT_MOVES,
  planFor,
  PLANS,
  ALL_MOVES,
  BEATS,
  beatsFor,
  cueWord,
  FIRST_POOL,
  isCountable,
  MAX_COUNT,
  TIERS,
  DANCE_STYLES,
  makeDances,
  PET_FEET,
  pickScene,
  SCENE_EXTRAS,
  SCENE_IDS,
  SCENES,
  STATUE_LINES,
  STATUES,
  statuePose,
  STYLE_LINES,
  STYLES_FOR,
  TUNE_IDS,
  TUNE_RANGE,
  TUNES,
} from './logic';

describe('Pet Says', () => {
  it('pins the original sticker color and pose draw for seeds 0–99', () => {
    expect(stickerSeeds).toHaveLength(100);
    stickerSeeds.forEach((expected, seed) => {
      const { color, pose } = stickerRecipe(new Rng(seed));
      expect(`${color}:${pose}`).toBe(expected);
    });
  });

  it('every move has a real move-only speech line and spoken words', () => {
    for (const move of [...ALL_MOVES, ...BODY]) {
      expect(MOVE_CUES[move].line).toBe(`says.move.${move}`);
      expect(SCRIPT[MOVE_CUES[move].line].length).toBeGreaterThan(0);
      expect(MOVE_CUES[move].word).toBe(MOVE_WORDS[move]);
    }
    expect(new Set(Object.values(MOVE_CUES).map((c) => c.line)).size).toBe(ALL_MOVES.length + BODY.length);
    expect(Object.keys(MOVE_CUES)).toHaveLength(ALL_MOVES.length + BODY.length);
  });

  it('puts the mittens on each species’ own parts, and on the floor where it has no feet', () => {
    for (const s of SPECIES_IDS) {
      const box = bodyBox(s);
      const f = saysFrame((p) => restPoints(s, p), box);
      const near = (a: { x: number; y: number }, b: { x: number; y: number }, r: number) =>
        Math.hypot(a.x - b.x, a.y - b.y) <= r;
      expect(f.targets.nose.right, s).toEqual(restPoints(s, 'nose')[0]);
      // Peekaboo covers the eyes: both mittens on the eyes where the friend marks two, else beside the nose.
      const eyes = restPoints(s, 'eyes');
      if (eyes.length >= 2) {
        const xs = eyes.map((e) => e.x);
        expect(f.eyes.left.x, s).toBe(Math.min(...xs));
        expect(f.eyes.right.x, s).toBe(Math.max(...xs));
      } else {
        const anchor = eyes[0] ?? restPoints(s, 'nose')[0];
        if (anchor) expect(Math.abs(f.eyes.left.y - anchor.y), s).toBeLessThanOrEqual(8);
      }
      expect(f.eyes.left.x, s).toBeLessThan(f.eyes.right.x);
      for (const ear of restPoints(s, 'ears'))
        expect(near(f.targets.ears.left, ear, 15) || near(f.targets.ears.right, ear, 15), s).toBe(true);
      for (const side of ['left', 'right'] as const)
        expect(near(f.targets.tummy[side], restPoints(s, 'tummy')[0], 40), s).toBe(true);
      const feet = restPoints(s, 'feet');
      if (feet.length)
        for (const foot of feet)
          expect(near(f.targets.toes.left, foot, 1) || near(f.targets.toes.right, foot, 1), s).toBe(true);
      else expect(f.targets.toes.left.y, s).toBe(Math.min(0, box.y + box.height));
      // The head pat lands just above the head; at rest and reaching up the mittens are clear of the body's sides or top.
      expect(f.targets.head.right.y, s).toBeLessThan(restPoints(s, 'head')[0].y);
      expect(f.rest.left.x, s).toBeLessThan(box.x);
      expect(f.rest.right.x, s).toBeGreaterThan(box.x + box.width);
      expect(f.up.left.y, s).toBeLessThan(box.y);
      for (const pair of [f.rest, f.eyes, f.clap, f.up, f.down, ...Object.values(f.targets)])
        for (const p of [pair.left, pair.right])
          expect(Number.isFinite(p.x) && Number.isFinite(p.y), s).toBe(true);
    }
  });

  it('nudges only after a quiet wait, never during a move or after completion', () => {
    expect(shouldNudge(9.99, false, false)).toBe(false);
    expect(shouldNudge(10, false, false)).toBe(true);
    expect(shouldNudge(20, true, false)).toBe(false);
    expect(shouldNudge(20, false, true)).toBe(false);
  });
  it('names every move, and never asks for the same move twice in a row', () => {
    for (const m of [...ALL_MOVES, ...BODY]) expect(MOVE_WORDS[m].length).toBeGreaterThan(2);
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) {
        const turns = makeTurns(plan, new Rng(seed));
        expect(turns).toHaveLength(plan.turns);
        const flat = turns.flatMap((t) => t.moves);
        if (plan.mode !== 'freeze') flat.slice(1).forEach((m, i) => expect(m).not.toBe(flat[i]));
        if (plan.mode === 'body') for (const t of turns) expect(BODY).toContain(t.moves[0]);
        if (plan.mode === 'pairs') for (const t of turns) expect(t.moves).toHaveLength(2);
      }
  });

  it('splits every whole-body move into exactly one tier, and keeps the base eight first', () => {
    const tiered = Object.values(TIERS).flat();
    expect(new Set(tiered).size).toBe(tiered.length);
    expect(tiered).toEqual(ALL_MOVES);
    expect(MOVES).toEqual(['clap', 'stomp', 'wave', 'jump', 'spin', 'wiggle', 'up', 'down']);
    expect(ALL_MOVES).toHaveLength(18);
    for (const m of BODY) expect(ALL_MOVES).not.toContain(m);
  });

  it('copies only base and social moves at level 1, and meets every tier by level 3 and 4', () => {
    expect(FIRST_POOL).toEqual([...TIERS.base, ...TIERS.social]);
    const seen = { pairs: new Set<string>(), says: new Set<string>() };
    for (let seed = 1; seed <= 300; seed++) {
      for (const t of makeTurns(planFor(1), new Rng(seed))) expect(FIRST_POOL).toContain(t.moves[0]);
      for (const t of makeTurns(planFor(3), new Rng(seed))) t.moves.forEach((m) => seen.pairs.add(m));
      for (const t of makeTurns(planFor(4), new Rng(seed))) t.moves.forEach((m) => seen.says.add(m));
    }
    for (const m of ALL_MOVES) {
      expect(seen.pairs.has(m), m).toBe(true);
      expect(seen.says.has(m), m).toBe(true);
    }
  });

  it('asks for counts only on moves made of beats, two or three of them, and says the number it does', () => {
    let counted = 0;
    for (let seed = 1; seed <= 400; seed++) {
      for (const t of makeTurns(planFor(3), new Rng(seed))) {
        expect(t.moves).toHaveLength(2);
        if (!t.counts) continue;
        const asked = t.counts.flatMap((c, k) => (c === undefined ? [] : [k]));
        expect(asked).toHaveLength(1);
        const k = asked[0];
        const move = t.moves[k];
        const n = t.counts[k]!;
        expect(isCountable(move), move).toBe(true);
        expect(n >= 2 && n <= 3 && n <= MAX_COUNT).toBe(true);
        if (isCountable(move)) expect(beatsFor(move, n)).toBe(n);
        expect(cueWord(move, n)).toBe(`${MOVE_WORDS[move]} ${n === 2 ? 'two' : 'three'} times`);
        counted++;
      }
      for (const level of [1, 2, 4, 5, 13])
        for (const t of makeTurns(planFor(level), new Rng(seed))) expect(t.counts).toBeUndefined();
    }
    expect(counted).toBeGreaterThan(100);
    for (const [m, n] of Object.entries(BEATS)) {
      expect(n).toBeLessThanOrEqual(MAX_COUNT);
      expect(beatsFor(m as keyof typeof BEATS)).toBe(n);
    }
    expect(cueWord('stomp')).toBe('stomp');
  });

  it('starts "Pet says" with a real one, and spaces out the two tricks', () => {
    const plan = PLANS.find((p) => p.mode === 'says')!;
    for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns[0].says).toBe(true);
      const tricks = turns.map((t, i) => (t.says ? -1 : i)).filter((i) => i >= 0);
      expect(tricks).toHaveLength(2);
      expect(tricks[1] - tricks[0]).toBeGreaterThanOrEqual(2);
    }
  });

  it('dances for a few seconds before each freeze, never the same twice running', () => {
    let last = 0;
    const rng = new Rng(5);
    for (let i = 0; i < 100; i++) {
      const s = danceSeconds(rng, last);
      expect(s >= 3 && s <= 7).toBe(true);
      expect(s).not.toBe(last);
      last = s;
    }
  });
});

describe("Pat the pet (level 13, lap's first level)", () => {
  const plan = planFor(13);

  it('is its own level beside the numbered ladder, which does not change', () => {
    expect(plan.mode).toBe('pat');
    expect(ENTRY_PLANS[13]).toBe(plan);
    expect(PLANS.map((p) => p.mode)).toEqual(['copy', 'body', 'pairs', 'says', 'freeze']);
    for (let level = 1; level <= 5; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
  });

  it('brings out five different, spoken moves, never an animal or walking move', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(5);
      const moves = turns.map((t) => t.moves);
      expect(moves.every((m) => m.length === 1)).toBe(true);
      const names = moves.map(([m]) => m);
      expect(new Set(names).size).toBe(5);
      for (const m of names) {
        expect(PAT_MOVES).toContain(m);
        expect(FIRST_POOL).toContain(m);
        expect(MOVE_CUES[m].line).toMatch(/^says\.move\./);
        expect(MOVE_CUES[m].word.length).toBeGreaterThan(0);
      }
      expect(turns.every((t) => t.says === undefined)).toBe(true);
    }
  });
});

describe('Freeze dance variety (level 5, dive slice 4)', () => {
  it("has four tunes of different feel, each on the five-note scale in the marimba's middle", () => {
    expect(TUNE_IDS).toEqual(['bounce', 'sway', 'shimmy', 'march']);
    expect(new Set(TUNE_IDS.map((t) => TUNES[t].beat)).size).toBe(4);
    for (const t of TUNE_IDS) {
      const { beat, steps } = TUNES[t];
      expect(beat >= 0.2 && beat <= 0.5, t).toBe(true);
      expect(steps.length, t).toBeGreaterThanOrEqual(8);
      // A step is a place on the pentatonic scale (src/audio/notes.ts), so whole steps are always in the scale.
      for (const step of steps) {
        expect(Number.isInteger(step), t).toBe(true);
        expect(step >= TUNE_RANGE.low && step <= TUNE_RANGE.high, t).toBe(true);
      }
    }
    expect(new Set(TUNE_IDS.map((t) => TUNES[t].steps.join())).size).toBe(4);
  });

  it('deals four dances with four different tunes, a fitting style never twice running, and four statues', () => {
    const seen = { styles: new Set<string>(), statues: new Set<string>() };
    for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(planFor(5), new Rng(seed));
      expect(turns).toHaveLength(4);
      const dances = turns.map((t) => t.dance!);
      expect(new Set(dances.map((d) => d.tune)).size).toBe(4);
      expect(new Set(dances.map((d) => d.statue)).size).toBe(4);
      dances.forEach((d, i) => {
        expect(STYLES_FOR[d.tune]).toContain(d.style);
        if (i) expect(d.style).not.toBe(dances[i - 1].style);
        seen.styles.add(d.style);
        seen.statues.add(d.statue);
      });
      for (const level of [1, 2, 3, 4, 13])
        for (const t of makeTurns(planFor(level), new Rng(seed))) expect(t.dance).toBeUndefined();
    }
    expect([...seen.styles].sort()).toEqual([...DANCE_STYLES].sort());
    expect([...seen.statues].sort()).toEqual([...STATUES].sort());
    // Longer rounds still never repeat a style back to back.
    const long = makeDances(9, new Rng(3));
    long.slice(1).forEach((d, i) => expect(d.style).not.toBe(long[i].style));
  });

  it('speaks every style and statue with its own line', () => {
    for (const s of DANCE_STYLES) expect(SCRIPT[STYLE_LINES[s]].length).toBeGreaterThan(0);
    for (const s of STATUES) {
      expect(SCRIPT[STATUE_LINES[s]].length).toBeGreaterThan(0);
      expect(SCRIPT[STATUE_LINES[s]][0]).toMatch(/^Freeze like a/);
    }
  });

  it('gives each statue its own mitten places on every friend', () => {
    for (const s of SPECIES_IDS) {
      const f = saysFrame((p) => restPoints(s, p), bodyBox(s));
      const poses = STATUES.map((st) => statuePose(st, f));
      for (const pose of poses)
        for (const p of [pose.left, pose.right])
          expect(Number.isFinite(p.x) && Number.isFinite(p.y), s).toBe(true);
      for (let i = 0; i < poses.length; i++)
        for (let j = i + 1; j < poses.length; j++) {
          const d = Math.max(
            Math.hypot(poses[i].left.x - poses[j].left.x, poses[i].left.y - poses[j].left.y),
            Math.hypot(poses[i].right.x - poses[j].right.x, poses[i].right.y - poses[j].right.y),
          );
          expect(d, `${s}: ${STATUES[i]} and ${STATUES[j]}`).toBeGreaterThanOrEqual(40);
        }
      // The tree reaches up; the ice cream meets over the head; the flamingo has one wing high and one low.
      const [tree, icecream, flamingo] = poses;
      expect(tree.left.y).toBeLessThan(bodyBox(s).y);
      expect(icecream.right.x - icecream.left.x).toBeLessThan(60);
      expect(flamingo.left.y).toBeGreaterThan(flamingo.right.y + 60);
    }
  });
});

describe('Scenes (dive slice 4)', () => {
  const VIEWS = [
    { w: 390, h: 844 },
    { w: 844, h: 390 },
    { w: 768, h: 1024 },
    { w: 1366, h: 1024 },
  ];

  it('has five places, each a different sky, with ground under the pet and sky above it at four views', () => {
    expect(SCENE_IDS).toEqual(['meadow', 'beach', 'room', 'snow', 'evening']);
    expect(new Set(SCENE_IDS.map((s) => SCENES[s].sky.join())).size).toBe(5);
    for (const s of SCENE_IDS) {
      const style = SCENES[s];
      expect(style.hills.length, s).toBeGreaterThan(0);
      for (const v of VIEWS) {
        const ground = v.h * style.horizon;
        // The pet's feet stand on the ground, with room below the horizon, and the back hills leave sky above.
        expect(ground, `${s} ${v.w}x${v.h}`).toBeLessThan(v.h - PET_FEET - 60);
        expect(ground - (style.hills.length - 1) * 62 - 60, `${s} ${v.w}x${v.h}`).toBeGreaterThan(20);
      }
      expect(SCENE_EXTRAS[s]).toBeDefined();
    }
  });

  it('picks a place by seed after the turns, so every place comes up and the moves are unchanged', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const a = new Rng(seed);
      const b = new Rng(seed);
      const turns = makeTurns(planFor(1), a);
      expect(makeTurns(planFor(1), b)).toEqual(turns);
      const scene = pickScene(a);
      expect(pickScene(b)).toBe(scene);
      seen.add(scene);
    }
    expect(seen.size).toBe(5);
  });
});
