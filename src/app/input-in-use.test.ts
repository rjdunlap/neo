import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { neutral, type CouchControls } from '../engine/controller';
import { controllerLevels, controllerPlays, InputInUse, pressed } from './input-in-use';

const frame = (patch: Partial<ReturnType<typeof neutral>> = {}): CouchControls => ({
  players: [{ ...neutral(), ...patch }, neutral()],
  disconnected: false,
  status: '',
  controllers: 0,
});

describe('input in use', () => {
  it('starts on touch and turns to controller on a real press', () => {
    const u = new InputInUse();
    expect(u.kind).toBe('touch');
    expect(u.sample(frame())).toBe(false);
    expect(u.kind).toBe('touch');
    expect(u.sample(frame({ action: true }))).toBe(true);
    expect(u.kind).toBe('controller');
    expect(u.sample(frame({ action: true }))).toBe(false);
  });

  it('is not woken by a resting stick or by Start', () => {
    expect(pressed(frame({ x: 0.3, y: 0.2 }))).toBe(false);
    expect(pressed(frame({ pause: true }))).toBe(false);
    expect(pressed(frame({ direction: 2 }))).toBe(true);
    expect(pressed(frame({ undo: true }))).toBe(true);
  });

  it('goes back to touch on a pointer press, and a key brings the controller back', () => {
    const u = new InputInUse();
    u.sample(frame({ direction: 0 }));
    u.touched();
    expect(u.kind).toBe('touch');
    u.sample(frame({ back: true }));
    expect(u.kind).toBe('controller');
  });
});

describe('controllerPlays', () => {
  const live = GAMES.filter((g) => g.liveController);

  it('is on for the games that switch to a controller while they run', () => {
    expect(live.map((g) => g.id).sort()).toEqual([
      'bounce-back', 'bumper-garden', 'egg-catch', 'frog-hop', 'light-lab', 'memory-match', 'pattern-train',
      'peg-garden', 'rhythm-neighbors', 'robot-path', 'secret-code', 'sink-float',
    ]);
  });

  it('allows only levels couch play has played, and every one of them is a real level of the game', () => {
    for (const mod of live) {
      const levels = controllerLevels(mod.id);
      expect(levels.size, mod.id).toBeGreaterThan(0);
      const all = new Set<number>();
      for (const band of mod.bands) {
        const { min, max } = mod.levels(band);
        for (let l = min; l <= max; l++) all.add(l);
      }
      for (const level of levels) {
        expect(all.has(level), `${mod.id} level ${level}`).toBe(true);
        expect(controllerPlays(mod, level)).toBe(true);
      }
      expect(controllerPlays(mod, Math.max(...all) + 20), mod.id).toBe(false);
    }
  });

  it('leaves out the games that choose touch or controller when they are built', () => {
    for (const mod of GAMES.filter((g) => !g.liveController)) expect(controllerPlays(mod, 1), mod.id).toBe(false);
  });

  it('holds back the levels with no controller play (Pattern Train bell levels, Egg Catch chutes)', () => {
    const train = GAMES.find((g) => g.id === 'pattern-train')!;
    const egg = GAMES.find((g) => g.id === 'egg-catch')!;
    expect(controllerPlays(train, 7)).toBe(false);
    expect(controllerPlays(train, 8)).toBe(false);
    expect(controllerPlays(egg, 5)).toBe(false);
  });
});
