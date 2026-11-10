import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink } from '../art/palette';
import { PILL } from '../content/button-names';

export const FONT = 'Fredoka, ui-rounded, system-ui, sans-serif';

/** Centered text in the house font. */
export function label(text: string, size: number, color = ink, weight: '500' | '600' = '600'): Text {
  const t = new Text({
    text,
    style: { fontFamily: FONT, fontSize: size, fill: color, fontWeight: weight, align: 'center' },
  });
  t.anchor.set(0.5);
  return t;
}

/**
 * A name on its own cream pill, centred on (0, 0), so it reads over a busy backdrop (Explore's cards, and the root's
 * picture buttons, U1). A name wider than `maxW` is drawn smaller to fit. It never takes touches.
 */
export function namePill(name: string, maxW = Infinity): Container {
  const node = new Container();
  const text = label(name, PILL.size, ink);
  const room = maxW - 2 * PILL.pad;
  if (text.width > room) text.scale.set(room / text.width);
  const w = text.width + 2 * PILL.pad;
  const pill = new Graphics().roundRect(-w / 2, -PILL.h / 2, w, PILL.h, PILL.h / 2).fill(cream);
  node.addChild(pill, text);
  node.eventMode = 'none';
  return node;
}
