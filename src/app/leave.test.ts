import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import { LEAVE_BEAT, WayOut } from './leave';
import { UNCHOSEN_ALPHA } from '../ui/buttons';

describe("a root screen's way out (U7 R2, R3)", () => {
  it("changes screen after the squash's beat with the line still playing, and ignores a second tap", async () => {
    const waits: number[] = [];
    let beat!: () => void;
    const out = new WayOut(
      (s) => {
        waits.push(s);
        return new Promise<void>((r) => (beat = r));
      },
      () => true,
    );
    const [pick, other] = [new Container(), new Container()];
    const go = vi.fn();
    const goElsewhere = vi.fn();
    const line = vi.fn(() => new Promise<void>(() => {})); // never ends
    const secondLine = vi.fn(() => Promise.resolve());
    const taking = out.take(pick, [pick, other], go, line);
    void out.take(other, [pick, other], goElsewhere, secondLine);
    expect(waits).toEqual([LEAVE_BEAT]);
    expect(LEAVE_BEAT).toBeLessThanOrEqual(0.3);
    expect(line).toHaveBeenCalledOnce();
    expect(secondLine).not.toHaveBeenCalled();
    expect(other.alpha).toBe(UNCHOSEN_ALPHA);
    expect(pick.getChildByLabel('chosen-ring')).toBeTruthy();
    beat();
    await taking;
    expect(go).toHaveBeenCalledOnce();
    expect(goElsewhere).not.toHaveBeenCalled();
  });

  it('goes nowhere when the scene has already gone', async () => {
    const out = new WayOut(
      () => Promise.resolve(),
      () => false,
    );
    const go = vi.fn();
    await out.take(new Container(), [], go);
    expect(go).not.toHaveBeenCalled();
  });
});
