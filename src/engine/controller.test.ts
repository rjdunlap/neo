import { describe, expect, it } from 'vitest';
import { ControllerSampler } from './controller';

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
