import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, swatch } from '../art/palette';
import { shell } from '../art/shore';
import { FONT } from './text';

/**
 * A shell and a line of words beside it, centred on (0, 0): "+5 shells" on a grown-up's result, the balance on Today's six
 * (the progression loop, docs/definitions/progression-loop.md). Drawn only for a band that earns shells. With `plate`, a soft
 * cream pill sits behind it, for reading over a busy picture.
 */
export function shellTag(words: string, fontSize = 24, plate = false): Container {
  const c = new Container();
  const s = fontSize / 24;
  const g = new Graphics();
  shell(g, 0, 11 * s, s, swatch.pink);
  const t = new Text({ text: words, style: { fontFamily: FONT, fontSize, fill: ink, fontWeight: '600' } });
  t.anchor.set(0, 0.5);
  const gap = 8 * s;
  const w = 28 * s + gap + t.width;
  g.x = -w / 2 + 14 * s;
  t.x = -w / 2 + 28 * s + gap;
  if (plate)
    c.addChild(
      new Graphics()
        .roundRect(-w / 2 - 14 * s, -20 * s, w + 28 * s, 40 * s, 20 * s)
        .fill({ color: cream, alpha: 0.92 }),
    );
  c.addChild(g, t);
  return c;
}
