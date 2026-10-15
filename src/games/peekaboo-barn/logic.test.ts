import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { ANIMALS, STICKER_ANIMALS, SCENES, roundScene, COVER_NAMES, nearestSpot, shouldNudge, shouldSelfOpen, planFor, ONE_DOOR_LEVEL, SELF_OPEN_SECONDS, deal, newcomer, pickTarget, PLANS, spotToTap, type Animal } from './logic';

describe('Peekaboo Barn', () => {
  it('preserves old sticker choices and supplies a distinct spoken name for each cover', () => {
    expect(STICKER_ANIMALS).toEqual(['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear']);
    expect(Object.fromEntries(Object.entries(COVER_NAMES).slice(0, 4))).toEqual({ hay: 'haystack', bush: 'bush', door: 'door', crate: 'crate' });
    expect(new Set(Object.values(COVER_NAMES)).size).toBe(16);
    for (const id of ['peek.found', 'peek.yes'] as const) {
      for (const line of SCRIPT[id]) expect(line).toContain('{cover}');
    }
  });

  it('deals named distinct covers in any seeded setting at every level', () => {
    const seen = new Set<string>();
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
      const scene = roundScene(new Rng(seed), plan.spots);
      expect(scene).toEqual(roundScene(new Rng(seed), plan.spots));
      expect(scene.covers).toHaveLength(plan.spots);
      expect(new Set(scene.covers).size).toBe(plan.spots);
      expect(SCENES[scene.id].length).toBeGreaterThanOrEqual(4);
      for (const cover of scene.covers) expect(COVER_NAMES[cover]).toBeTruthy();
      seen.add(scene.id);
    }
    expect([...seen].sort()).toEqual(['barnyard', 'bedroom', 'beach', 'garden'].sort());
  });

  it('resolves neighboring hit areas to the nearer cover and rejects points outside', () => {
    const spots = [{ x: 300, y: 700, scale: 1 }, { x: 532, y: 700, scale: 1 }];
    expect(nearestSpot(415, 590, spots)).toBe(0);
    expect(nearestSpot(417, 590, spots)).toBe(1);
    expect(nearestSpot(416, 590, spots)).toBe(0);
    expect(nearestSpot(100, 590, spots)).toBeNull();
    expect(nearestSpot(300, 350, spots)).toBeNull();
    expect(nearestSpot(300, 711, spots)).toBeNull();
    expect(nearestSpot(405, 590, [{ x: 300, y: 700, scale: 0.8 }])).toBeNull();
  });

  it('nudges only quiet free play after six seconds, with everyone hidden', () => {
    expect(shouldNudge(PLANS[0], 5.99, ['hidden', 'hidden'], false)).toBe(false);
    expect(shouldNudge(PLANS[0], 6, ['hidden', 'hidden'], false)).toBe(true);
    for (const pose of ['out', 'peek']) expect(shouldNudge(PLANS[0], 10, ['hidden', pose], false)).toBe(false);
    expect(shouldNudge(PLANS[0], 10, ['hidden'], true)).toBe(false);
    for (const mode of ['find', 'remember'] as const) expect(shouldNudge(PLANS.find((p) => p.mode === mode)!, 10, ['hidden'], false)).toBe(false);
  });

  it('fits every level in four hiding places, with a wrong place to try on question levels', () => {
    for (const plan of PLANS) {
      expect(plan.spots).toBeLessThanOrEqual(4);
      if (plan.mode !== 'free') expect(plan.spots).toBeGreaterThanOrEqual(2);
    }
  });

  it('hides a different animal in each place and asks for one that is there, never twice in a row', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let last: Animal | null = null;
        for (let q = 0; q < plan.goal; q++) {
          const present = deal(rng, plan.spots);
          expect(new Set(present).size).toBe(plan.spots);
          const target = pickTarget(rng, present, last);
          expect(present).toContain(target);
          expect(target).not.toBe(last);
          last = target;
        }
      }
    }
  });

  it('sends in a newcomer who is not already showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const taken = deal(rng, 4);
      const who = newcomer(rng, taken);
      expect(ANIMALS).toContain(who);
      expect(taken).not.toContain(who);
    }
  });

  it("gives the ghost finger's bot only right taps: the hiding place of who was asked for, and in free play a place nobody is out of, going round", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const animals = deal(rng, plan.spots);
        if (plan.mode !== 'free') {
          const target = pickTarget(rng, animals, null);
          expect(animals[spotToTap(plan, animals.map(() => 'hidden'), animals, target, -1)!]).toBe(target);
          expect(spotToTap(plan, animals.map(() => 'hidden'), animals, null, -1)).toBeNull();
          continue;
        }
        const poses = animals.map(() => 'hidden');
        const visited = new Set<number>();
        let last = -1;
        for (let n = 0; n < plan.goal; n++) {
          const i = spotToTap(plan, poses, animals, null, last)!;
          expect(poses[i]).not.toBe('out');
          if (plan.spots > 1) expect(i).not.toBe(last);
          visited.add(i);
          last = i;
        }
        expect(visited.size).toBe(plan.spots);
        // Everyone out: wait.
        expect(spotToTap(plan, poses.map(() => 'out'), animals, null, last)).toBeNull();
        // Only one place free: that one, even if it was the last.
        expect(spotToTap(plan, poses.map((_, k) => (k === last ? 'hidden' : 'out')), animals, null, last)).toBe(last);
      }
    }
  });

  describe('One door', () => {
    const door = planFor(ONE_DOOR_LEVEL);
    it('is one free-play house with six reveals, and the original eight levels are unchanged', () => {
      expect(door).toMatchObject({ mode: 'free', spots: 1, goal: 6, door: true });
      for (let level = 1; level <= 8; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
    });
    it('opens by itself only after six quiet seconds, never over an animal already out, and nudges nothing', () => {
      expect(SELF_OPEN_SECONDS).toBeGreaterThanOrEqual(6);
      expect(shouldSelfOpen(door, SELF_OPEN_SECONDS - 0.01, ['hidden'], false)).toBe(false);
      expect(shouldSelfOpen(door, SELF_OPEN_SECONDS, ['hidden'], false)).toBe(true);
      for (const pose of ['out', 'peek']) expect(shouldSelfOpen(door, 10, [pose], false)).toBe(false);
      expect(shouldSelfOpen(door, 10, ['hidden'], true)).toBe(false);
      expect(shouldNudge(door, 10, ['hidden'], false)).toBe(false);
      expect(shouldSelfOpen(PLANS[0], 10, ['hidden', 'hidden', 'hidden'], false)).toBe(false);
    });
    it('cycles animals and never repeats the one that just showed', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = new Rng(seed);
        let who = deal(rng, 1)[0];
        for (let i = 0; i < 12; i++) {
          const next = newcomer(rng, [who]);
          expect(next).not.toBe(who);
          who = next;
        }
      }
    });
    it('is reachable by the ghost finger', () => {
      expect(spotToTap(door, ['hidden'], ['cow'], null, -1)).toBe(0);
      expect(spotToTap(door, ['hidden'], ['cow'], null, 0)).toBe(0);
    });
  });
});
