import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { SoundValue, ToyId, ViewValue } from './logic';

/** The toys, drawn centred on (0, 0) in about a 140-unit box. */
export function toyArt(id: ToyId, size = 140): Container {
  const c = new Container();
  const g = new Graphics();
  if (id === 'bell') {
    g.moveTo(-50, 40)
      .quadraticCurveTo(-52, -45, 0, -52)
      .quadraticCurveTo(52, -45, 50, 40)
      .closePath()
      .fill(swatch.yellow.fill)
      .stroke({ width: 5, color: swatch.yellow.line });
    g.roundRect(-58, 34, 116, 16, 8).fill(swatch.yellow.line);
    g.circle(0, 58, 11).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
    g.circle(0, -58, 9).stroke({ width: 5, color: swatch.yellow.line });
  } else if (id === 'rattle') {
    g.roundRect(-8, -5, 16, 70, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
    g.circle(0, -35, 38).fill(swatch.pink.fill).stroke({ width: 5, color: swatch.pink.line });
    for (const [x, y] of [
      [-14, -45],
      [12, -30],
      [-6, -22],
      [14, -52],
    ])
      g.circle(x, y, 5).fill(swatch.white.fill);
  } else {
    g.roundRect(-52, -30, 104, 70, 12).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
    g.ellipse(0, -30, 52, 16).fill(cream).stroke({ width: 5, color: swatch.red.line });
    g.moveTo(-44, -18)
      .lineTo(-22, 36)
      .lineTo(0, -18)
      .lineTo(22, 36)
      .lineTo(44, -18)
      .stroke({ width: 4, color: wood.line });
  }
  c.addChild(g);
  c.scale.set(size / 140);
  return c;
}

/** The parcel seen from above through the peephole: a circle, or a circle with a handle. */
export function outlineArt(v: ViewValue, size = 100): Container {
  const c = new Container();
  const g = new Graphics();
  if (v === 'handled') g.roundRect(-8, 6, 16, 56, 6).fill(ink);
  g.circle(0, -8, 34).fill(ink);
  c.addChild(g);
  c.scale.set(size / 100);
  c.y = v === 'handled' ? -8 : 4;
  return c;
}

/** The picture that goes with each sound, so a sound is never needed to play. */
export function soundArt(s: SoundValue, size = 100): Container {
  const c = new Container();
  const g = new Graphics();
  if (s === 'ring') {
    g.moveTo(-14, -30).lineTo(0, 10).lineTo(14, -30).stroke({ width: 5, color: ink, cap: 'round' });
    g.circle(0, 18, 9).fill(ink);
    for (const r of [28, 42, 56])
      g.arc(0, 0, r, -0.5, 0.5)
        .stroke({ width: 4, color: swatch.yellow.line, cap: 'round' })
        .arc(0, 0, r, Math.PI - 0.5, Math.PI + 0.5)
        .stroke({ width: 4, color: swatch.yellow.line, cap: 'round' });
  } else if (s === 'shake') {
    for (const [x, y] of [
      [-30, -22],
      [8, -34],
      [-10, 6],
      [32, 0],
      [-34, 30],
      [10, 34],
    ])
      g.circle(x, y, 8).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
    for (const x of [-52, 52])
      for (const y of [-10, 14])
        g.moveTo(x, y)
          .lineTo(x + (x < 0 ? -10 : 10), y)
          .stroke({ width: 4, color: ink, cap: 'round' });
  } else {
    g.ellipse(0, 20, 46, 12).fill(cream).stroke({ width: 4, color: swatch.red.line });
    g.moveTo(-40, -30).lineTo(-6, 14).stroke({ width: 7, color: wood.line, cap: 'round' });
    for (const a of [-0.5, 0, 0.5])
      g.moveTo(Math.sin(a) * 22, -4 - Math.cos(a) * 22)
        .lineTo(Math.sin(a) * 40, -4 - Math.cos(a) * 40)
        .stroke({ width: 5, color: swatch.red.fill, cap: 'round' });
  }
  c.addChild(g);
  c.scale.set(size / 120);
  return c;
}

/** The wrapped parcel with a round peephole. */
export function parcelArt(): Container {
  const g = new Graphics();
  g.roundRect(-120, -70, 240, 150, 16)
    .fill(swatch.brown.light)
    .stroke({ width: 6, color: swatch.brown.line });
  g.rect(-12, -70, 24, 150).fill(swatch.red.fill);
  g.rect(-120, -4, 240, 24).fill(swatch.red.fill);
  g.circle(0, -30, 32).fill(ink).stroke({ width: 6, color: wood.line });
  const c = new Container();
  c.addChild(g);
  return c;
}

/** A round window button (Look) and an ear button (Listen). */
export function lookButtonArt(): Container {
  const g = new Graphics();
  g.circle(0, 0, 70).fill(swatch.blue.light).stroke({ width: 7, color: swatch.blue.line });
  g.ellipse(0, 0, 40, 26).fill(swatch.white.fill).stroke({ width: 5, color: ink });
  g.circle(0, 0, 14).fill(ink);
  const c = new Container();
  c.addChild(g);
  return c;
}

export function listenButtonArt(): Container {
  const g = new Graphics();
  g.circle(0, 0, 70).fill(swatch.pink.light).stroke({ width: 7, color: swatch.pink.line });
  g.moveTo(-6, 36)
    .quadraticCurveTo(-34, 30, -30, -10)
    .quadraticCurveTo(-26, -46, 6, -44)
    .quadraticCurveTo(38, -42, 30, -6)
    .quadraticCurveTo(26, 14, 8, 20)
    .stroke({ width: 8, color: ink, cap: 'round' });
  g.arc(4, -6, 12, Math.PI, 0).stroke({ width: 6, color: ink, cap: 'round' });
  const c = new Container();
  c.addChild(g);
  return c;
}

export function checkButtonArt(): Container {
  const g = new Graphics();
  g.roundRect(-85, -85, 170, 170, 26).fill(swatch.green.light).stroke({ width: 7, color: swatch.green.line });
  g.moveTo(-40, 4)
    .lineTo(-12, 34)
    .lineTo(44, -30)
    .stroke({ width: 18, color: swatch.green.line, cap: 'round', join: 'round' });
  const c = new Container();
  c.addChild(g);
  return c;
}

export function cardBack(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(swatch.white.fill)
    .stroke({ width: 5, color: wood.line });
}

/** Level 5's thick patchwork quilt over the parcel, with the peephole flap left open. */
export function quiltArt(): Container {
  const g = new Graphics();
  const colors = [swatch.blue.light, swatch.pink.light, swatch.green.light, swatch.yellow.light];
  const cols = 6;
  const rows = 4;
  const w = 264 / cols;
  const h = 170 / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      g.rect(-132 + c * w, -80 + r * h, w, h).fill(colors[(r + c) % colors.length]);
    }
  g.roundRect(-132, -80, 264, 170, 26).stroke({ width: 7, color: wood.line });
  for (let c = 1; c < cols; c++)
    g.moveTo(-132 + c * w, -80)
      .lineTo(-132 + c * w, 90)
      .stroke({ width: 2, color: wood.light });
  for (let r = 1; r < rows; r++)
    g.moveTo(-132, -80 + r * h)
      .lineTo(132, -80 + r * h)
      .stroke({ width: 2, color: wood.light });
  // The flap folded back from the peephole.
  g.circle(0, -30, 42).fill(cream).stroke({ width: 4, color: wood.line });
  g.circle(0, -30, 32).fill(ink).stroke({ width: 6, color: wood.line });
  g.moveTo(26, -64)
    .quadraticCurveTo(58, -78, 60, -44)
    .lineTo(36, -46)
    .closePath()
    .fill(swatch.pink.light)
    .stroke({ width: 3, color: wood.line });
  const q = new Container();
  q.addChild(g);
  return q;
}

/** The *Can't tell yet* card: two round badges side by side under a soft question mark. */
export function cantTellArt(size = 170): Container {
  const c = new Container();
  c.addChild(cardBack(size, size));
  const q = new Graphics();
  q.arc(0, -46, 20, Math.PI * 1.05, Math.PI * 2.45).stroke({
    width: 9,
    color: swatch.purple.line,
    cap: 'round',
  });
  q.moveTo(0, -18 + 2)
    .lineTo(0, -12)
    .stroke({ width: 9, color: swatch.purple.line, cap: 'round' });
  q.circle(0, 4, 6).fill(swatch.purple.line);
  q.alpha = 0.75;
  c.addChild(q);
  for (const x of [-36, 36]) {
    const plate = new Graphics()
      .circle(x, 46, 30)
      .fill(swatch.white.light)
      .stroke({ width: 3, color: wood.light });
    const badge = outlineArt('round', 50);
    badge.position.set(x, 46 + badge.y);
    c.addChild(plate, badge);
  }
  return c;
}

/** Stage B's choice cards: a look (the eye window) or a listen (the ear), on a shelf card. */
export function senseChoiceArt(channel: 'view' | 'sound'): Container {
  const c = new Container();
  c.addChild(cardBack(200, 220));
  const b = channel === 'view' ? lookButtonArt() : listenButtonArt();
  b.scale.set(1.2);
  c.addChild(b);
  return c;
}
