import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import stickerSeeds from './sticker-seeds.json';
import { SCRIPT } from '../../content/voice-script';
import { BODY_TARGETS, MOVE_CUES, shouldNudge, stickerRecipe, BODY, danceSeconds, ENTRY_PLANS, makeTurns, MOVE_WORDS, MOVES, PAT_MOVES, planFor, PLANS } from './logic';

describe('Pet Says', () => {
  it('pins the original sticker color and pose draw for seeds 0–99', () => {
    expect(stickerSeeds).toHaveLength(100);
    stickerSeeds.forEach((expected, seed) => {
      const { color, pose } = stickerRecipe(new Rng(seed));
      expect(`${color}:${pose}`).toBe(expected);
    });
  });

  it('every move has a real move-only speech line and spoken words', () => {
    for (const move of [...MOVES, ...BODY]) {
      expect(MOVE_CUES[move].line).toBe(`says.move.${move}`);
      expect(SCRIPT[MOVE_CUES[move].line].length).toBeGreaterThan(0);
      expect(MOVE_CUES[move].word).toBe(MOVE_WORDS[move]);
    }
    expect(new Set(Object.values(MOVE_CUES).map(c => c.line)).size).toBe(13);
  });

  it('places mittens on the named pip shapes, including the game-only nose', () => {
    const inEllipse = (p: { x: number; y: number }, x: number, y: number, rx: number, ry: number) =>
      ((p.x - x) / rx) ** 2 + ((p.y - y) / ry) ** 2 <= 1;
    // Shape measurements from Critter.buildEars/buildBody/buildFace, not the target table.
    // A 27-radius mitten should fit inside the 34-radius round ear.
    expect(inEllipse(BODY_TARGETS.nose.right, 0, -106, 12, 9)).toBe(true);
    for (const side of ['left', 'right'] as const) {
      const sign = side === 'left' ? -1 : 1;
      expect(inEllipse(BODY_TARGETS.ears[side], sign * 72, -222, 34 - 27, 34 - 27)).toBe(true);
      expect(inEllipse(BODY_TARGETS.tummy[side], 0, -65, 80, 54)).toBe(true);
      expect(inEllipse(BODY_TARGETS.toes[side], sign * 40, 0, 30, 14)).toBe(true);
    }
    expect(BODY_TARGETS.head.right.x).toBe(0);
    expect(BODY_TARGETS.head.right.y).toBeGreaterThanOrEqual(-264);
    expect(BODY_TARGETS.head.right.y).toBeLessThan(-220);
  });

  it('nudges only after a quiet wait, never during a move or after completion', () => {
    expect(shouldNudge(9.99, false, false)).toBe(false);
    expect(shouldNudge(10, false, false)).toBe(true);
    expect(shouldNudge(20, true, false)).toBe(false);
    expect(shouldNudge(20, false, true)).toBe(false);
  });
  it('names every move, and never asks for the same move twice in a row', () => {
    for (const m of [...MOVES, ...BODY]) expect(MOVE_WORDS[m].length).toBeGreaterThan(2);
    for (const plan of PLANS) for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(plan.turns);
      const flat = turns.flatMap((t) => t.moves);
      if (plan.mode !== 'freeze') flat.slice(1).forEach((m, i) => expect(m).not.toBe(flat[i]));
      if (plan.mode === 'body') for (const t of turns) expect(BODY).toContain(t.moves[0]);
      if (plan.mode === 'pairs') for (const t of turns) expect(t.moves).toHaveLength(2);
    }
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

describe('Pat the pet (level 13, lap\'s first level)', () => {
  const plan = planFor(13);

  it('is its own level beside the numbered ladder, which does not change', () => {
    expect(plan.mode).toBe('pat');
    expect(ENTRY_PLANS[13]).toBe(plan);
    expect(PLANS.map((p) => p.mode)).toEqual(['copy', 'body', 'pairs', 'says', 'freeze']);
    for (let level = 1; level <= 5; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
  });

  it('brings out five different, spoken moves, from the ones the pet already shows', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(5);
      const moves = turns.map((t) => t.moves);
      expect(moves.every((m) => m.length === 1)).toBe(true);
      const names = moves.map(([m]) => m);
      expect(new Set(names).size).toBe(5);
      for (const m of names) {
        expect(PAT_MOVES).toContain(m);
        expect(MOVE_CUES[m].line).toMatch(/^says\.move\./);
        expect(MOVE_CUES[m].word.length).toBeGreaterThan(0);
      }
      expect(turns.every((t) => t.says === undefined)).toBe(true);
    }
  });
});
