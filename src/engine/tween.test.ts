import { describe, expect, it } from 'vitest';
import { Tweener } from './tween';

describe('Tweener', () => {
  it('ends a tween whose target was destroyed instead of throwing, and keeps others running', async () => {
    const tw = new Tweener();
    const gone = { x: 0, destroyed: false };
    const other = { x: 0 };
    const a = tw.to(gone, { x: 10 }, { duration: 1 });
    const b = tw.to(other, { x: 10 }, { duration: 0.5 });
    tw.update(0.25);
    gone.destroyed = true;
    const where = gone.x;
    for (let i = 0; i < 5; i++) tw.update(0.25);
    await Promise.all([a, b]);
    expect(other.x).toBe(10);
    expect(gone.x).toBe(where); // left where it was
  });

  it('survives a target that throws when set', async () => {
    const tw = new Tweener();
    const broken = {
      set x(_: number) {
        throw new Error('position is null');
      },
      get x() {
        return 0;
      },
    };
    const ok = { y: 0 };
    const a = tw.to(broken, { x: 1 }, { duration: 0.2 });
    const b = tw.to(ok, { y: 1 }, { duration: 0.2 });
    tw.update(0.3);
    await Promise.all([a, b]);
    expect(ok.y).toBe(1);
  });
});
