import { describe, expect, it } from 'vitest';
import { ControllerSampler, HeldDirection, idle } from './controller';

const pad = (index: number, buttons: number[] = [], axes = [0, 0], mapping: GamepadMappingType = 'standard') => ({ index, id: `test ${index}`, mapping, connected: true, axes, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i), touched: buttons.includes(i), value: buttons.includes(i) ? 1 : 0 })) });
const keys = (...codes: string[]) => new Set(codes);

describe('controller semantics', () => {
  it('requires release after mount and emits only one edge for a held button or direction', () => {
    const s = new ControllerSampler();
    expect(s.sample([pad(0, [0, 15])], keys()).players[0]).toMatchObject({ action: false, direction: -1 });
    s.sample([pad(0)], keys());
    expect(s.sample([pad(0, [0, 15])], keys()).players[0]).toMatchObject({ action: true, direction: 0 });
    expect(s.sample([pad(0, [0, 15])], keys()).players[0]).toMatchObject({ action: false, direction: -1, x: 1 });
    s.sample([pad(0)], keys());
    expect(s.sample([pad(0, [2])], keys()).players[0].undo).toBe(true);
  });
  it('reports the bottom and left buttons as held for as long as they stay down, apart from the one-frame press', () => {
    const s = new ControllerSampler();
    s.sample([pad(0)], keys());
    expect(s.sample([pad(0, [0])], keys()).players[0]).toMatchObject({ action: true, hold: true, undo: false, holdUndo: false });
    expect(s.sample([pad(0, [0])], keys()).players[0]).toMatchObject({ action: false, hold: true });
    expect(s.sample([pad(0, [0, 2])], keys()).players[0]).toMatchObject({ action: false, hold: true, undo: true, holdUndo: true });
    expect(s.sample([pad(0, [2])], keys()).players[0]).toMatchObject({ hold: false, holdUndo: true, undo: false });
    expect(s.sample([pad(0)], keys()).players[0]).toMatchObject({ hold: false, holdUndo: false });
    // The keyboard: Enter and Backspace.
    expect(s.sample([], keys('Enter')).players[0]).toMatchObject({ hold: true, action: true });
    expect(s.sample([], keys('Enter', 'Backspace')).players[0]).toMatchObject({ hold: true, holdUndo: true, action: false, undo: true });
  });
  it('keeps player two on the pink paddle when player one disconnects, then reconnects', () => {
    const s = new ControllerSampler(); s.sample([pad(3), pad(7)], keys());
    const lost = s.sample([pad(7, [], [0, 1])], keys());
    expect(lost.disconnected).toBe(true);
    expect(lost.players[0].y).toBe(0);
    expect(lost.players[1].y).toBe(1);
    expect(s.sample([pad(7)], keys()).disconnected).toBe(false);
    expect(s.sample([pad(3, [], [0, -1]), pad(7)], keys()).players[0].y).toBe(-1);
  });
  it('ignores drift and unmapped devices; keyboard supports two independent paddles', () => {
    const s = new ControllerSampler();
    const start = s.sample([pad(0, [], [0.15, -0.2]), pad(1, [0], [1, 1], '')], keys());
    expect(start.players[0]).toMatchObject({ x: 0, y: 0, action: false });
    expect(start.status).toContain('Unmapped');
    const next = s.sample([], keys('ArrowDown', 'KeyW'));
    expect(next.players[0].y).toBe(1);
    expect(next.players[1]).toMatchObject({ y: -1, active: true });
    expect(s.sample([], keys()).players[1].active).toBe(true);
  });
});

describe('hold to repeat', () => {
  const frame = (x: number, y: number, pressed = -1) => { const c = idle(); Object.assign(c.players[0], { x, y, direction: pressed }); return c; };

  it('moves once at the press, waits, then repeats while the stick is held', () => {
    const h = new HeldDirection(0.4, 0.1);
    expect(h.poll(frame(1, 0, 0), 0.016)).toEqual([0]);
    let moves = 0;
    for (let t = 0; t < 0.36; t += 0.016) moves += h.poll(frame(1, 0), 0.016).length;
    expect(moves, 'nothing before the delay is up').toBe(0);
    for (let t = 0; t < 0.5; t += 0.016) moves += h.poll(frame(1, 0), 0.016).length;
    expect(moves).toBeGreaterThanOrEqual(3);
    expect(moves).toBeLessThanOrEqual(6);
  });

  it('stops when the stick is let go or turned, and starts afresh on a new press', () => {
    const h = new HeldDirection(0.2, 0.1);
    h.poll(frame(0, 1, 1), 0.016);
    for (let t = 0; t < 0.3; t += 0.016) h.poll(frame(0, 1), 0.016);
    expect(h.poll(frame(0, 0), 0.016)).toEqual([]);
    expect(h.poll(frame(0, 1), 0.3)).toEqual([]);
    // Turning without a new press (a slow slide from down to right) never repeats the old direction.
    h.poll(frame(0, 1, 1), 0.016);
    expect(h.poll(frame(1, 0), 0.5)).toEqual([]);
    expect(h.poll(frame(0, 0, 3), 0.016)).toEqual([3]);
  });

  it('catches up on a slow frame, and a bot with no held stick only ever presses', () => {
    const h = new HeldDirection(0.2, 0.1);
    h.poll(frame(1, 0, 0), 0.016);
    expect(h.poll(frame(1, 0), 0.45).length).toBe(3);
    const bot = new HeldDirection(0.2, 0.1);
    expect(bot.poll(frame(0, 0, 2), 0.016)).toEqual([2]);
    for (let i = 0; i < 40; i++) expect(bot.poll(frame(0, 0), 0.05)).toEqual([]);
  });
});
