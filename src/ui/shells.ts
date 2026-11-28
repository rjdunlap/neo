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

/** A paper lantern, lit or not, its centre on (x, y): a stamp on the result and the stamps button on Today's six. */
export function lantern(g: Graphics, x: number, y: number, s = 1, lit = true) {
  const body = lit ? swatch.yellow : { fill: 0xe4ddd0, light: 0xf2ede4, line: 0xb9ae9c };
  if (lit) g.circle(x, y, 20 * s).fill({ color: swatch.yellow.light, alpha: 0.45 });
  g.roundRect(x - 5 * s, y - 17 * s, 10 * s, 4 * s, 2 * s).fill(ink);
  g.ellipse(x, y, 12 * s, 14 * s)
    .fill(body.fill)
    .stroke({ color: body.line, width: 2 * s });
  for (const d of [-5, 0, 5])
    g.moveTo(x + d * s, y - 13 * s)
      .quadraticCurveTo(x + d * 1.6 * s, y, x + d * s, y + 13 * s)
      .stroke({ color: body.line, width: 1.2 * s, alpha: 0.6 });
  g.roundRect(x - 5 * s, y + 13 * s, 10 * s, 4 * s, 2 * s).fill(ink);
}

/** "New stamp: …" on a cream pill with a lit lantern, centred on (0, 0), for a grown-up's result. */
export function stampTag(words: string, fontSize = 22): Container {
  const c = new Container();
  const s = fontSize / 24;
  const g = new Graphics();
  lantern(g, 0, 0, s * 0.9);
  const t = new Text({ text: words, style: { fontFamily: FONT, fontSize, fill: ink, fontWeight: '600' } });
  t.anchor.set(0, 0.5);
  const gap = 8 * s;
  const w = 24 * s + gap + t.width;
  g.x = -w / 2 + 12 * s;
  t.x = -w / 2 + 24 * s + gap;
  c.addChild(
    new Graphics()
      .roundRect(-w / 2 - 14 * s, -20 * s, w + 28 * s, 40 * s, 20 * s)
      .fill({ color: cream, alpha: 0.92 }),
    g,
    t,
  );
  return c;
}
