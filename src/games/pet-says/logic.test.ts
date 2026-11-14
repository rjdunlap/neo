import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
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
  MUSIC_SECONDS,
  petDances,
  QUIET_ROUND_MAX,
  QUIET_SECONDS,
  quietSegments,
  segmentAt,
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
  BODY_ZONE,
  CHANT_LINES,
  CHANT_STEPS,
  CHANT_VERSES,
  CHANT_WORDS,
  CLASHES,
  petGrow,
  WRONG_NAMES,
  wrongName,
  LEVELS,
  ONCE_MORE_MODES,
  OPPOSITE_PAIRS,
  PARTNER,
  partnerOf,
  SUN_TURNS,
  MANNER_MOVES,
  MORE_OPPOSITE_PAIRS,
  CONTRASTS,
  WIGGLE_TEMPO,
  CLAP_LOUDNESS,
  STOMP_TIPTOE_STRETCH,
  MORE_PAIRS_A_ROUND,
  MORE_SUN_TURNS,
  WALK_PLACES,
  WALKS,
  walkLandmark,
} from './logic';
import { CONCEPTS } from '../opposites/logic';

describe('Pet Says', () => {
  it('pins the original sticker color and pose draw for seeds 0–99', () => {
    expect(stickerSeeds).toHaveLength(100);
    stickerSeeds.forEach((expected, seed) => {
      const { color, pose } = stickerRecipe(new Rng(seed));
      expect(`${color}:${pose}`).toBe(expected);
    });
  });

  it('every move has a real move-only speech line and spoken words', () => {
    for (const move of [...ALL_MOVES, ...BODY, ...MANNER_MOVES]) {
      expect(MOVE_CUES[move].line).toBe(`says.move.${move}`);
      expect(SCRIPT[MOVE_CUES[move].line].length).toBeGreaterThan(0);
      expect(MOVE_CUES[move].word).toBe(MOVE_WORDS[move]);
    }
    const every = ALL_MOVES.length + BODY.length + MANNER_MOVES.length;
    expect(new Set(Object.values(MOVE_CUES).map((c) => c.line)).size).toBe(every);
    expect(Object.keys(MOVE_CUES)).toHaveLength(every);
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
        if (plan.mode === 'body') {
          for (const t of turns.slice(0, -1)) expect(BODY).toContain(t.moves[0]);
          expect(turns[turns.length - 1]).toEqual({ moves: [], chant: CHANT_VERSES });
        }
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

  it('starts "Pet says" with a real one, and spaces out two or three tricks, the first a plain one', () => {
    const plan = PLANS.find((p) => p.mode === 'says')!;
    const seen = { counts: new Set<number>(), cues: new Set<string>() };
    for (let seed = 1; seed <= 400; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns[0].says).toBe(true);
      expect(turns[0].cue).toBe('says');
      const tricks = turns.map((t, i) => (t.says ? -1 : i)).filter((i) => i >= 0);
      expect([2, 3]).toContain(tricks.length);
      seen.counts.add(tricks.length);
      tricks.slice(1).forEach((t, k) => expect(t - tricks[k]).toBeGreaterThanOrEqual(2));
      // Only "says" and "do this" mean move; the first trick is the plain one, and the other kinds come after it.
      for (const t of turns) {
        expect(t.says).toBe(t.cue === 'says' || t.cue === 'this');
        seen.cues.add(t.cue!);
        expect(t.who !== undefined).toBe(t.cue === 'name');
      }
      expect(turns[tricks[0]].cue).toBe('plain');
      const moves = turns.map((t) => t.moves[0]);
      moves.slice(1).forEach((m, i) => {
        const prev = moves[i];
        if (m in BODY_ZONE && prev in BODY_ZONE)
          expect(BODY_ZONE[m as keyof typeof BODY_ZONE]).not.toBe(BODY_ZONE[prev as keyof typeof BODY_ZONE]);
      });
      const cues = turns.map((t) => t.cue!);
      for (const kind of ['name', 'that', 'this'] as const)
        if (cues.includes(kind)) expect(cues.indexOf(kind)).toBeGreaterThan(tricks[0]);
      // "Do that" only once a "do this" has shown what "do this" means.
      if (cues.includes('that')) expect(cues.indexOf('this')).toBeGreaterThan(-1);
      if (cues.includes('that')) expect(cues.indexOf('this')).toBeLessThan(cues.indexOf('that'));
      if (cues.includes('this')) expect(cues).toContain('that');
    }
    expect([...seen.counts].sort()).toEqual([2, 3]);
    expect([...seen.cues].sort()).toEqual(['name', 'plain', 'says', 'that', 'this']);
  });

  it('never deals a move and a body word with the same mitten places in one round', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) {
        const moves = new Set(makeTurns(plan, new Rng(seed)).flatMap((t) => t.moves));
        for (const [a, b] of CLASHES)
          expect(moves.has(a) && moves.has(b), `${plan.mode} ${seed}`).toBe(false);
      }
  });

  it("borrows a wrong name that is never the pet's or the child's", () => {
    for (let start = 0; start < WRONG_NAMES.length; start++) {
      expect(wrongName(start, ['Pip', 'Mia'])).toBe(WRONG_NAMES[start]);
      for (const own of WRONG_NAMES) {
        expect(wrongName(start, [own.toUpperCase(), 'Mia']).toLowerCase()).not.toBe(own.toLowerCase());
        const other = WRONG_NAMES.find((n) => n !== own)!;
        expect([own, other]).not.toContain(wrongName(start, [own, ` ${other.toLowerCase()} `]));
      }
    }
  });

  it('deals five of the ten body words, never two in a row from one zone, then the chant', () => {
    expect(BODY).toHaveLength(10);
    expect(new Set(BODY).size).toBe(10);
    expect(Object.keys(BODY_ZONE).sort()).toEqual([...BODY].sort());
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const turns = makeTurns(planFor(2), new Rng(seed));
      const words = turns.slice(0, -1).map((t) => t.moves[0] as (typeof BODY)[number]);
      expect(words).toHaveLength(5);
      expect(new Set(words).size).toBe(5);
      words.slice(1).forEach((w, i) => expect(BODY_ZONE[w]).not.toBe(BODY_ZONE[words[i]]));
      words.forEach((w) => seen.add(w));
    }
    expect(seen.size).toBe(10);
  });

  it('puts the ten body words on each friend, apart enough that the mittens show which part', () => {
    for (const s of SPECIES_IDS) {
      const box = bodyBox(s);
      const f = saysFrame((p) => restPoints(s, p), box);
      const g = petGrow(box);
      // Mouth, chin and shoulders are not marked parts; they are placed from the nose, the neck and the body box, so
      // this checks them against the box and the marked parts near them, not against the drawing itself.
      const inside = (p: { x: number; y: number }, pad: number) =>
        p.x >= box.x - pad &&
        p.x <= box.x + box.width + pad &&
        p.y >= box.y - pad &&
        p.y <= box.y + box.height + pad;
      for (const w of ['eyes', 'mouth', 'cheeks', 'shoulders', 'chin'] as const)
        for (const p of [f.targets[w].left, f.targets[w].right])
          if (p !== f.rest.left) expect(inside(p, 20), `${s} ${w}`).toBe(true);
      const nose = restPoints(s, 'nose')[0];
      expect(f.targets.mouth.right.y, s).toBeGreaterThan(nose.y);
      expect(f.targets.chin.left.y, s).toBeGreaterThan(f.targets.mouth.right.y);
      for (const cheek of restPoints(s, 'cheeks'))
        expect(
          Math.min(
            Math.hypot(f.targets.cheeks.left.x - cheek.x, f.targets.cheeks.left.y - cheek.y),
            Math.hypot(f.targets.cheeks.right.x - cheek.x, f.targets.cheeks.right.y - cheek.y),
          ),
          s,
        ).toBeLessThanOrEqual(16);
      for (const eye of restPoints(s, 'eyes'))
        expect(
          Math.min(Math.abs(f.targets.eyes.left.x - eye.x), Math.abs(f.targets.eyes.right.x - eye.x)),
          s,
        ).toBeLessThanOrEqual(35);
      expect(f.targets.shoulders.left.x, s).toBeLessThan(f.targets.shoulders.right.x);
      // Words from different zones (any two that can follow each other): the two mittens together travel at least 70
      // units at pip size (the friend's units times its grow). Summed, because on the side-on glider the tummy sits just
      // under the face and both mittens move a little rather than one a lot.
      for (const a of BODY)
        for (const b of BODY) {
          if (BODY_ZONE[a] === BODY_ZONE[b]) continue;
          const ta = f.targets[a];
          const tb = f.targets[b];
          const travel =
            Math.hypot(ta.left.x - tb.left.x, ta.left.y - tb.left.y) +
            Math.hypot(ta.right.x - tb.right.x, ta.right.y - tb.right.y);
          expect(travel * g, `${s} ${a} to ${b}`).toBeGreaterThanOrEqual(70);
        }
    }
  });

  it('sings the chant one word quieter each verse, and touches every word every time', () => {
    expect(CHANT_WORDS).toEqual(['head', 'shoulders', 'tummy', 'toes']);
    for (const w of CHANT_WORDS) {
      expect(BODY).toContain(w);
      expect(SCRIPT[CHANT_LINES[w as keyof typeof CHANT_LINES]].length).toBeGreaterThan(0);
    }
    expect(CHANT_VERSES[0].every(Boolean)).toBe(true);
    CHANT_VERSES.forEach((v) => expect(v).toHaveLength(CHANT_WORDS.length));
    CHANT_VERSES.slice(1).forEach((v, k) => {
      const sung = (x: boolean[]) => x.filter(Boolean).length;
      expect(sung(v)).toBe(sung(CHANT_VERSES[k]) - 1);
      // The words go quiet from the front: a word once quiet stays quiet.
      v.forEach((on, i) => on && expect(CHANT_VERSES[k][i]).toBe(true));
    });
    expect(CHANT_VERSES[CHANT_VERSES.length - 1].some(Boolean)).toBe(false);
    expect(CHANT_STEPS).toHaveLength(CHANT_WORDS.length);
    for (const step of CHANT_STEPS)
      expect(Number.isInteger(step) && step >= TUNE_RANGE.low && step <= TUNE_RANGE.high).toBe(true);
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

  it('keeps its own ID beside the numbered ladder', () => {
    expect(plan.mode).toBe('pat');
    expect(ENTRY_PLANS[13]).toBe(plan);
    expect(PLANS.map((p) => p.mode)).toEqual([
      'copy',
      'body',
      'pairs',
      'says',
      'freeze',
      'opposite',
      'quiet',
      'opposite',
      'walk',
      'opposite',
    ]);
    for (let level = 1; level <= PLANS.length; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
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

describe('Opposite day (level 6, dive slice 5)', () => {
  const plan = planFor(6);

  it('is level 6, in the pre-K window and the start of the school window', () => {
    expect(plan.mode).toBe('opposite');
    expect(plan.turns).toBe(6);
    expect(LEVELS.prek?.min).toBe(3);
    expect(LEVELS.school?.min).toBe(6);
    expect(ONCE_MORE_MODES).toContain('opposite');
  });

  it('pairs each move with exactly one partner, and the partner of the partner is the move', () => {
    const moves = OPPOSITE_PAIRS.flat();
    expect(new Set(moves).size).toBe(moves.length);
    for (const m of moves) {
      expect(partnerOf(m)).not.toBe(m);
      expect(partnerOf(partnerOf(m))).toBe(m);
    }
    expect(OPPOSITE_PAIRS.flat().every((m) => PARTNER[m])).toBe(true);
    expect(() => partnerOf('clap')).toThrow();
  });

  it('starts with suns, then moons; uses only its pairs; and never asks from the same pair twice running', () => {
    // "No turn shows a move and its partner" (dive), read as: the opposite revealed on one turn is never the next
    // turn's ask, nor its partner, so the next turn is never answered by the reveal she just saw.
    const pool = new Set(OPPOSITE_PAIRS.flat());
    const pairOf = (m: string) => OPPOSITE_PAIRS.findIndex((p) => p.includes(m as never));
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(6);
      turns.forEach((t, i) => {
        expect(t.moves).toHaveLength(1);
        expect(pool.has(t.moves[0])).toBe(true);
        expect(t.sign).toBe(i < SUN_TURNS ? 'sun' : 'moon');
        if (i > 0) expect(pairOf(t.moves[0])).not.toBe(pairOf(turns[i - 1].moves[0]));
        seen.add(t.moves[0]);
      });
    }
    expect(seen).toEqual(pool);
  });

  it('reveals a move the pet can show apart from the one it asked, on every friend', () => {
    // Paired hand targets differ by at least 120 units at pip size (the two mittens' travel summed, in the friend's
    // units times its grow), so the reveal is plainly a different move; up and down also stretch the pet differently.
    for (const s of SPECIES_IDS) {
      const box = bodyBox(s);
      const f = saysFrame((p) => restPoints(s, p), box);
      const g = petGrow(box);
      const places = {
        up: f.up,
        down: f.down,
        head: f.targets.head,
        toes: f.targets.toes,
      };
      for (const [a, b] of OPPOSITE_PAIRS) {
        const pa = places[a as keyof typeof places];
        const pb = places[b as keyof typeof places];
        const travel =
          Math.hypot(pa.left.x - pb.left.x, pa.left.y - pb.left.y) +
          Math.hypot(pa.right.x - pb.right.x, pa.right.y - pb.right.y);
        expect(travel * g, `${s} ${a} and ${b}`).toBeGreaterThanOrEqual(120);
      }
    }
  });

  it('speaks every Opposite day line', () => {
    for (const id of ['says.opp.intro', 'says.opp.sun', 'says.opp.flip', 'says.opp.moon', 'says.opp.reveal'])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeDefined();
  });
});

describe('Quiet dance (level 7, dive slice 6)', () => {
  const plan = planFor(7);

  it('is level 7, and both the pre-K and the school windows reach it', () => {
    expect(plan.mode).toBe('quiet');
    expect(plan.turns).toBe(4);
    expect(LEVELS.prek?.min).toBe(3);
    expect(LEVELS.prek?.max).toBeGreaterThanOrEqual(7);
    expect(LEVELS.school?.min).toBe(6);
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(7);
    // Level 7 has only the arrow: no "once more", so it always counts 0 and 0 (decision 2).
    expect(ONCE_MORE_MODES).not.toContain('quiet');
  });

  it('alternates quiet and music, quiet first and long enough for the rule to show, in at most 40 seconds', () => {
    const seen = { quiet: new Set<number>(), music: new Set<number>() };
    for (let seed = 0; seed < 500; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(4);
      const flat = turns.flatMap((t) => {
        expect(t.moves).toEqual([]);
        expect(t.dance).toBeDefined();
        expect(t.segments!.map((s) => s.kind)).toEqual(['quiet', 'music']);
        return t.segments!;
      });
      flat.forEach((s, i) => expect(s.kind).toBe(i % 2 === 0 ? 'quiet' : 'music'));
      expect(flat[0].kind).toBe('quiet');
      expect(flat[0].seconds).toBeGreaterThanOrEqual(3);
      for (const s of flat) {
        const span = s.kind === 'quiet' ? QUIET_SECONDS : MUSIC_SECONDS;
        expect(s.seconds).toBeGreaterThanOrEqual(span.min);
        expect(s.seconds).toBeLessThanOrEqual(span.max);
        seen[s.kind].add(s.seconds);
      }
      // No length back to back: not the stretch just before, nor the last stretch of the same kind.
      flat.slice(1).forEach((s, i) => expect(s.seconds).not.toBe(flat[i].seconds));
      flat.slice(2).forEach((s, i) => expect(s.seconds).not.toBe(flat[i].seconds));
      expect(flat.reduce((t, s) => t + s.seconds, 0)).toBeLessThanOrEqual(QUIET_ROUND_MAX);
    }
    expect([...seen.quiet].sort()).toEqual([3, 4, 5, 6, 7]);
    expect([...seen.music].sort()).toEqual([2, 3, 4]);
    expect(MUSIC_SECONDS).toEqual({ min: 2, max: 4 });
    expect(QUIET_SECONDS).toEqual({ min: 3, max: 7 });
  });

  it('keeps the pet still while the music plays, and dancing only in the quiet', () => {
    expect(petDances('quiet')).toBe(true);
    expect(petDances('music')).toBe(false);
    const segments = quietSegments(1, new Rng(3))[0];
    const [q, m] = segments.map((s) => s.seconds);
    expect(segmentAt(segments, 0)).toBe(0);
    expect(segmentAt(segments, q - 0.01)).toBe(0);
    expect(segmentAt(segments, q)).toBe(1);
    expect(segmentAt(segments, q + m - 0.01)).toBe(1);
    expect(segmentAt(segments, q + m)).toBe(2);
  });

  it('gives every dance a tune and a style, as the freeze dance does', () => {
    for (let seed = 0; seed < 100; seed++) {
      const dances = makeTurns(plan, new Rng(seed)).map((t) => t.dance!);
      expect(new Set(dances.map((d) => d.tune)).size).toBe(4);
      dances.forEach((d, i) => {
        expect(STYLES_FOR[d.tune]).toContain(d.style);
        if (i) expect(d.style).not.toBe(dances[i - 1].style);
      });
    }
  });

  it('speaks every Quiet dance line', () => {
    for (const id of ['says.quiet', 'says.quiet.go', 'says.music'])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeDefined();
  });
});

describe('More opposites (level 8, dive slice 7)', () => {
  const plan = planFor(8);

  it('is level 8, an opposite level with the held "once more", in both windows', () => {
    expect(plan.mode).toBe('opposite');
    expect(plan.opposites).toBe('more');
    expect(plan.turns).toBe(6);
    expect(ONCE_MORE_MODES).toContain(plan.mode);
    expect(LEVELS.prek?.max).toBeGreaterThanOrEqual(8);
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(8);
    expect(planFor(6).opposites).toBe('first');
  });

  it('has six distinct pairs, no move in two of them, every partner the way back', () => {
    expect(MORE_OPPOSITE_PAIRS).toHaveLength(6);
    expect(CONTRASTS).toHaveLength(MORE_OPPOSITE_PAIRS.length);
    const moves = MORE_OPPOSITE_PAIRS.flat();
    expect(new Set(moves).size).toBe(moves.length);
    expect(Object.keys(PARTNER).sort()).toEqual([...moves].sort());
    for (const m of moves) expect(partnerOf(partnerOf(m))).toBe(m);
    // Level 6's pairs are its first two, unchanged.
    expect(MORE_OPPOSITE_PAIRS.slice(0, 2)).toEqual(OPPOSITE_PAIRS);
    // The manner moves are only ever opposites: never in a tier another level draws from.
    for (const m of MANNER_MOVES) {
      expect(ALL_MOVES).not.toContain(m);
      expect(moves).toContain(m);
    }
  });

  it('draws three pairs a round, each twice, never the same pair twice in a row; one sun, then moons', () => {
    const pairOf = (m: string) => MORE_OPPOSITE_PAIRS.findIndex((p) => p.includes(m as never));
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(6);
      const pairs = turns.map((t) => pairOf(t.moves[0]));
      expect(pairs.every((p) => p >= 0)).toBe(true);
      expect(new Set(pairs).size).toBe(MORE_PAIRS_A_ROUND);
      for (const p of new Set(pairs)) expect(pairs.filter((q) => q === p)).toHaveLength(2);
      pairs.forEach((p, i) => i > 0 && expect(p, `seed ${seed}`).not.toBe(pairs[i - 1]));
      turns.forEach((t, i) => expect(t.sign).toBe(i < MORE_SUN_TURNS ? 'sun' : 'moon'));
      expect(turns.filter((t) => t.sign === 'moon').length).toBeGreaterThan(turns.length / 2);
      for (const t of turns) seen.add(t.moves[0]);
    }
    expect(seen).toEqual(new Set(MORE_OPPOSITE_PAIRS.flat()));
  });

  it('shows the partners of each pair visibly apart: places, height, tempo or volume', () => {
    MORE_OPPOSITE_PAIRS.forEach(([a, b], i) => {
      const kind = CONTRASTS[i];
      if (kind === 'tempo') {
        const fast = WIGGLE_TEMPO[a as keyof typeof WIGGLE_TEMPO];
        const slow = WIGGLE_TEMPO[b as keyof typeof WIGGLE_TEMPO];
        expect(slow.seconds / fast.seconds).toBeGreaterThanOrEqual(3);
        expect(slow.sways).toBeLessThan(fast.sways);
      } else if (kind === 'volume') {
        const loud = CLAP_LOUDNESS[a as keyof typeof CLAP_LOUDNESS];
        const soft = CLAP_LOUDNESS[b as keyof typeof CLAP_LOUDNESS];
        expect(loud / soft).toBeGreaterThanOrEqual(3);
      } else if (kind === 'height') {
        expect([a, b]).toEqual(['stomp', 'tiptoe']);
        expect(STOMP_TIPTOE_STRETCH.tiptoe - STOMP_TIPTOE_STRETCH.stomp).toBeGreaterThanOrEqual(0.15);
      } else {
        for (const s of SPECIES_IDS) {
          const box = bodyBox(s);
          const f = saysFrame((p) => restPoints(s, p), box);
          const g = petGrow(box);
          const places = {
            up: f.up,
            down: f.down,
            head: f.targets.head,
            toes: f.targets.toes,
            wide: f.wide,
            hug: f.hug,
          };
          const pa = places[a as keyof typeof places];
          const pb = places[b as keyof typeof places];
          const travel =
            Math.hypot(pa.left.x - pb.left.x, pa.left.y - pb.left.y) +
            Math.hypot(pa.right.x - pb.right.x, pa.right.y - pb.right.y);
          expect(travel * g, `${s} ${a} and ${b}`).toBeGreaterThanOrEqual(120);
        }
      }
    });
  });

  it('crosses the mittens for the hug and opens them past the body for arms wide, on every friend', () => {
    for (const s of SPECIES_IDS) {
      const box = bodyBox(s);
      const f = saysFrame((p) => restPoints(s, p), box);
      expect(f.hug.left.x, s).toBeGreaterThan(f.hug.right.x);
      expect(f.wide.left.x, s).toBeLessThan(box.x);
      expect(f.wide.right.x, s).toBeGreaterThan(box.x + box.width);
    }
  });

  it('shares its words with Opposites where a pair is the same idea', () => {
    // Up and down is Opposites' height pair; fast and slow its speed pair. Same order, same words.
    expect(MOVE_CUES.up.word).toContain(CONCEPTS.height.words[0]);
    expect(MOVE_CUES.down.word).toContain(CONCEPTS.height.words[1]);
    expect(MOVE_CUES.fastwiggle.word).toContain(CONCEPTS.speed.words[0]);
    expect(MOVE_CUES.slowwiggle.word).toContain(CONCEPTS.speed.words[1]);
  });

  it('speaks its intro and every new move', () => {
    expect(SCRIPT['says.opp.more' as keyof typeof SCRIPT]).toBeDefined();
    for (const m of MANNER_MOVES) expect(SCRIPT[MOVE_CUES[m].line].length).toBeGreaterThan(0);
  });
});

describe('A walk in the woods (level 9, dive slice 8)', () => {
  const plan = planFor(9);

  it('keeps level 9 in both windows and offers replay', () => {
    expect(plan.mode).toBe('walk');
    expect(ONCE_MORE_MODES).toContain(plan.mode);
    expect(LEVELS.prek?.max).toBeGreaterThanOrEqual(9);
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(9);
  });

  it('deals a whole story with distinct moves and landmarks, an instruction at every stop and a cheer at the end', () => {
    const seen = new Set();
    const pool = [...TIERS.base, ...TIERS.walking, ...TIERS.animal];
    for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(makeTurns(plan, new Rng(seed))).toEqual(turns);
      expect(turns).toHaveLength(4);
      const place = turns[0].stop!.place;
      seen.add(place);
      expect(turns.map((t) => t.stop!.place)).toEqual(Array(4).fill(place));
      expect(turns.map((t) => t.stop!.landmark)).toEqual(WALKS[place].map((stop) => stop.landmark));
      expect(new Set(turns.map((t) => t.stop!.landmark)).size).toBe(4);
      expect(new Set(turns.flatMap((t) => t.moves)).size).toBe(4);
      for (const { moves, stop } of turns) {
        expect(moves).toEqual([stop!.move]);
        expect(pool).toContain(stop!.move);
        expect(SCRIPT[stop!.line][0]).toBeTruthy();
      }
      expect(SCRIPT[turns[3].stop!.line][0]).toMatch(/Hooray!/);
    }
    expect([...seen].sort()).toEqual([...WALK_PLACES].sort());
  });

  it('keeps the focus of each backdrop inside the view and clear of the replay and arrow', () => {
    for (const [w, h] of [
      [390, 844],
      [844, 390],
      [768, 1024],
      [1024, 768],
    ]) {
      const view = computeView(w, h, NO_INSETS, w < h);
      const { x, y, scale } = walkLandmark(view);
      // The tallest prop (a pine) and the widest (the hill) fit. Replay is above the arrow at the right.
      expect(x + 174 * scale).toBeLessThan(view.w);
      expect(y - 190 * scale).toBeGreaterThan(0);
      expect(y + 62 * scale).toBeLessThan(view.h - 176);
      expect(Math.hypot(x - (view.w - 110), y - (view.h - 260))).toBeGreaterThan(66);
    }
  });
});

describe('Sun or moon (level 10, dive slice 9)', () => {
  const plan = planFor(10);

  it("extends both windows through level 10 and uses the opposite levels' replay", () => {
    expect(plan.mode).toBe('opposite');
    expect(plan.opposites).toBe('switching');
    expect(ONCE_MORE_MODES).toContain(plan.mode);
    expect(LEVELS.prek).toEqual({ min: 3, max: 10 });
    expect(LEVELS.school?.min).toBe(6);
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(10);
  });

  it('opens with two suns, then switches at least twice with no four alike in a row', () => {
    const patterns = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(8);
      expect(makeTurns(plan, new Rng(seed))).toEqual(turns);

      const signs = turns.map((turn) => turn.sign);
      expect(signs.slice(0, 2)).toEqual(['sun', 'sun']);
      expect(signs.every((sign) => sign === 'sun' || sign === 'moon')).toBe(true);
      expect(signs.filter((sign, i) => i > 0 && sign !== signs[i - 1]).length).toBeGreaterThanOrEqual(2);
      expect(signs.join(' ')).not.toMatch(/(sun sun sun sun|moon moon moon moon)/);
      patterns.add(signs.join(' '));
    }
    expect(patterns.size).toBeGreaterThan(1);
  });

  it('deals one move from the level 8 pairs per turn, never repeating a pair back to back', () => {
    const seen = new Set();
    for (let seed = 0; seed < 500; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      for (const [i, turn] of turns.entries()) {
        expect(turn.moves).toHaveLength(1);
        const move = turn.moves[0];
        const pair = MORE_OPPOSITE_PAIRS.find((pair) => pair.includes(move));
        expect(pair).toBeDefined();
        if (turn.sign === 'moon') expect(pair).toContain(partnerOf(move));
        if (i > 0) expect(pair).not.toContain(turns[i - 1].moves[0]);
        seen.add(move);
      }
    }
    expect(seen).toEqual(new Set(MORE_OPPOSITE_PAIRS.flat()));
  });
});
