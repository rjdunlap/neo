import { describe, expect, it } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { chosen, RoundButton, SQUASH, UNCHOSEN_ALPHA } from './buttons';
import { swatch } from '../art/palette';

const card = () => {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-100, -100, 200, 200, 20).fill(0xffffff));
  return c;
};

describe('chosen (U7 R2)', () => {
  it('keeps the pressed picture pressed and ringed, and dims every other choice', () => {
    const pick = card();
    const others = [card(), card(), null];
    pick.scale.set(0.92);
    const undo = chosen(pick, [pick, ...others]);
    expect(pick.scale.x).toBe(0.92);
    expect(pick.getChildByLabel('chosen-ring')).toBeTruthy();
    expect(pick.alpha).toBe(1);
    expect(others[0]!.alpha).toBe(UNCHOSEN_ALPHA);
    expect(others[1]!.alpha).toBe(UNCHOSEN_ALPHA);
    undo();
    expect(pick.scale.x).toBe(1);
    expect(pick.getChildByLabel('chosen-ring')).toBeNull();
    expect(others[0]!.alpha).toBe(1);
  });

  it('rings a round button by its radius and stops its spring back', async () => {
    const button: RoundButton = new RoundButton(new Container(), swatch.white, 60, () => chosen(button, []));
    button.press(); // squashes, starts the spring back, then chooses
    await new Promise((r) => setTimeout(r, 450));
    expect(button.scale.x).toBe(SQUASH.x);
    const ring = button.getChildByLabel('chosen-ring')!;
    expect(ring.getLocalBounds().width).toBeGreaterThan(2 * 60);
  });
});
