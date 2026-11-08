import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood, type Swatch } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { HATS, type HatId } from './logic';

export const line = (color: number, width = 6) => ({
  width,
  color,
  cap: 'round' as const,
  join: 'round' as const,
});
export const HAT_COLORS: Record<HatId, Swatch> = {
  steady: swatch.red,
  skippy: swatch.orange,
  cuckoo: swatch.blue,
  rain: swatch.purple,
  thump: swatch.green,
  walk: swatch.teal,
};
/** A worn hat sits a little smaller on a friend's head. */
export const WORN_SCALE = 0.8;
/** How far above a friend's feet the worn hat sits. */
export const HEAD = 166;

/** A little drum, the drum hats' badge and the drummer's prop. */
export function drumArt(scale = 1): Graphics {
  const g = new Graphics()
    .roundRect(-26, -8, 52, 34, 8)
    .fill(swatch.red.fill)
    .stroke(line(swatch.red.line, 4))
    .ellipse(0, -8, 26, 9)
    .fill(0xfff4e3)
    .stroke(line(swatch.red.line, 4))
    .moveTo(-20, 2)
    .lineTo(20, 20)
    .moveTo(20, 2)
    .lineTo(-20, 20)
    .stroke({ width: 3, color: swatch.yellow.line });
  g.scale.set(scale);
  return g;
}

/** A small set of bars, the tune player's prop. */
export function barsArt(): Graphics {
  const g = new Graphics().roundRect(-56, 12, 112, 14, 5).fill(wood.fill).stroke(line(wood.line, 4));
  [swatch.red, swatch.orange, swatch.yellow, swatch.green].forEach((b, i) =>
    g
      .roundRect(-50 + i * 26, -20 + i * 4, 22, 34 - i * 4, 5)
      .fill(b.fill)
      .stroke(line(b.line, 3)),
  );
  return g;
}

/** A hat: a crown and brim in the hat's colour, with a drum or a note on its band so the role never rests on colour. */
export function hatArt(id: HatId): Container {
  const c = new Container();
  const sw = HAT_COLORS[id];
  const g = new Graphics();
  if (HATS[id].role === 'drum') {
    // A tall band-leader's hat with a plume.
    g.moveTo(10, -48)
      .quadraticCurveTo(34, -78, 22, -40)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line, 3));
    g.roundRect(-34, -44, 68, 70, 12).fill(sw.fill).stroke(line(sw.line, 5));
    g.roundRect(-50, 22, 100, 16, 8).fill(sw.fill).stroke(line(sw.line, 5));
  } else if (HATS[id].role === 'bass') {
    // A wide, flat cap that sits low: the low part's hat.
    g.ellipse(0, -14, 50, 34).fill(sw.fill).stroke(line(sw.line, 5));
    g.roundRect(-58, 14, 116, 18, 9).fill(sw.fill).stroke(line(sw.line, 5));
  } else {
    // A round cap with a bobble.
    g.circle(0, -42, 10).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
    g.moveTo(-44, 22)
      .bezierCurveTo(-44, -54, 44, -54, 44, 22)
      .closePath()
      .fill(sw.fill)
      .stroke(line(sw.line, 5));
    g.roundRect(-54, 18, 108, 16, 8).fill(sw.fill).stroke(line(sw.line, 5));
  }
  g.circle(0, -6, 22).fill(0xffffff).stroke({ width: 3, color: sw.line });
  c.addChild(g);
  if (HATS[id].role === 'drum') {
    const d = drumArt(0.55);
    d.y = -10;
    c.addChild(d);
  } else if (HATS[id].role === 'bass') {
    c.addChild(lowBadge(0.8));
  } else {
    const n = musicNote(new Graphics(), 24, ink);
    n.y = -6;
    c.addChild(n);
  }
  return c;
}

/** The low part's badge: a bigger note sitting below a staff line, so "low" is pictured, not only coloured. */
export function lowBadge(scale = 1): Container {
  const c = new Container();
  c.addChild(new Graphics().moveTo(-24, -20).lineTo(24, -20).stroke({ width: 3, color: ink, cap: 'round' }));
  const n = musicNote(new Graphics(), 30, ink);
  n.y = 6;
  c.addChild(n);
  c.scale.set(scale);
  return c;
}

/** The tune's badge, as on its hat. */
export function tuneBadge(scale = 1): Graphics {
  const n = musicNote(new Graphics(), 24, ink);
  n.scale.set(scale);
  return n;
}

/** A big plucked fiddle standing beside the low player: its prop. */
export function lowArt(): Graphics {
  const sw = swatch.green;
  return new Graphics()
    .moveTo(-4, -96)
    .lineTo(4, -96)
    .lineTo(4, -30)
    .lineTo(-4, -30)
    .closePath()
    .fill(wood.fill)
    .stroke(line(wood.line, 3))
    .ellipse(0, -14, 26, 22)
    .fill(sw.fill)
    .stroke(line(sw.line, 4))
    .ellipse(0, 22, 32, 28)
    .fill(sw.fill)
    .stroke(line(sw.line, 4))
    .moveTo(-3, -90)
    .lineTo(-3, 40)
    .moveTo(3, -90)
    .lineTo(3, 40)
    .stroke({ width: 2, color: ink });
}

export function checkArt(): Graphics {
  return new Graphics()
    .moveTo(-22, 0)
    .lineTo(-6, 18)
    .lineTo(24, -18)
    .stroke({ width: 11, color: 0xffffff, cap: 'round', join: 'round' });
}
