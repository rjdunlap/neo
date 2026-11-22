/** Not Always's crate, sign pictograms, card creatures, stamp and marks, code-drawn from the palette. */
import { Container, Graphics } from 'pixi.js';
import { Critter, type CritterSpec } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { hatArt } from '../../art/props';
import {
  COLORS,
  SCENE_FACTS,
  type Card,
  type Claim,
  type Color,
  type Prop,
  type Reply,
  type Response,
  type Why,
} from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Every card is this one creature with only colour, hat, wings and spots changed, so no claim is about the kind. */
const BASE: Omit<CritterSpec, 'color'> = { ears: 'round', snout: 'nose', noseColor: ink, belly: true };

/** A card's creature, feet on (0, 0), at `scale`. */
export function cardCritter(c: Card, scale: number, alive = false): Critter {
  const k = new Critter({ ...BASE, color: c.color, spots: c.spots });
  if (c.wings) k.attach(wingsArt());
  if (c.hat) k.attach(hatArt());
  k.scale.set(scale);
  k.alive = alive;
  return k;
}

/** A pair of big white feathered wings at the creature's sides, in body coordinates: Critter's own wings are too small to judge at card size. */
export function wingsArt(): Graphics {
  const g = new Graphics();
  for (const side of [-1, 1]) {
    g.moveTo(side * 88, -160)
      .quadraticCurveTo(side * 120, -232, side * 158, -214)
      .quadraticCurveTo(side * 140, -192, side * 158, -172)
      .quadraticCurveTo(side * 136, -156, side * 152, -132)
      .quadraticCurveTo(side * 128, -120, side * 136, -98)
      .quadraticCurveTo(side * 110, -100, side * 92, -108)
      .closePath()
      .fill(0xffffff)
      .stroke(line(swatch.blue.line, 7));
    g.moveTo(side * 102, -150)
      .quadraticCurveTo(side * 124, -164, side * 140, -190)
      .moveTo(side * 102, -128)
      .quadraticCurveTo(side * 124, -134, side * 138, -150)
      .stroke(line(swatch.blue.line, 4));
  }
  return g;
}

/** The wooden crate the friend stands on, its top centre at (0, 0). */
export function crateArt(w = 150, h = 46): Graphics {
  const g = new Graphics()
    .roundRect(-w / 2, 0, w, h, 6)
    .fill(wood.fill)
    .stroke(line(wood.line, 4));
  g.moveTo(-w / 2 + 8, 8)
    .lineTo(w / 2 - 8, h - 8)
    .moveTo(w / 2 - 8, 8)
    .lineTo(-w / 2 + 8, h - 8)
    .stroke(line(wood.line, 3));
  return g;
}

/** An attribute's picture, about 70 units across, centred on (0, 0). Colours are told apart by name and lightness. */
export function attrIcon(a: Prop): Container {
  const c = new Container();
  if (a === 'round' || a === 'square') {
    const g = new Graphics();
    if (a === 'round') g.circle(0, 0, 30);
    else g.rect(-28, -28, 56, 56);
    c.addChild(g.stroke(line(ink, 7)));
  } else if (COLORS.includes(a as Color)) {
    const sw = swatch[a as Color];
    c.addChild(new Graphics().circle(0, 0, 30).fill(sw.fill).stroke(line(ink, 5)));
  } else if (a === 'hat') {
    const h = hatArt();
    h.scale.set(0.42);
    h.y = 116;
    c.addChild(h);
  } else if (a === 'wings') {
    c.addChild(
      new Graphics()
        .moveTo(-30, 14)
        .quadraticCurveTo(-14, -34, 32, -26)
        .lineTo(22, -12)
        .lineTo(32, -2)
        .lineTo(16, 6)
        .lineTo(22, 16)
        .quadraticCurveTo(-8, 28, -30, 14)
        .fill(0xffffff)
        .stroke(line(swatch.blue.line, 4)),
    );
  } else {
    const g = new Graphics().ellipse(0, 0, 32, 26).fill(swatch.white.light).stroke(line(ink, 4));
    for (const [x, y, r] of [
      [-12, -8, 7],
      [10, -10, 6],
      [4, 10, 8],
      [-16, 10, 5],
    ])
      g.circle(x, y, r).fill(ink);
    c.addChild(g);
  }
  return c;
}

export type SignMark = 'every' | 'none' | 'not-all';

/** The quantifier picture: a hand sweeping over three dots (every), the dots crossed (none), or one dot popped out and circled (not all). */
export function quantIcon(m: SignMark): Graphics {
  const g = new Graphics();
  const dots =
    m === 'not-all'
      ? [
          [-24, 14],
          [0, 18],
          [30, -12],
        ]
      : [
          [-24, 14],
          [0, 18],
          [24, 14],
        ];
  for (const [x, y] of dots) g.circle(x, y, 8).fill(ink);
  if (m === 'none')
    for (const [x, y] of dots)
      g.moveTo(x - 11, y - 11)
        .lineTo(x + 11, y + 11)
        .moveTo(x + 11, y - 11)
        .lineTo(x - 11, y + 11)
        .stroke(line(swatch.red.fill, 4));
  if (m === 'not-all') g.circle(30, -12, 15).stroke(line(swatch.red.fill, 4));
  // The sweeping hand: an arc over the dots with a little palm at its end.
  g.moveTo(-34, -6)
    .quadraticCurveTo(0, -30, m === 'not-all' ? 12 : 34, -6)
    .stroke(line(swatch.blue.fill, 5));
  g.circle(m === 'not-all' ? 12 : 34, -6, 7)
    .fill(swatch.orange.light)
    .stroke(line(swatch.orange.line, 3));
  return g;
}

/** A sign card for a claim (or the not-all sign after a break), `w` by `h`, centred on (0, 0). */
export function claimSign(claim: Claim, w: number, h: number, mark: SignMark = claim.q): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 16)
      .fill(0xffffff)
      .stroke(line(wood.line, 6)),
  );
  const q = quantIcon(mark);
  const a = attrIcon(claim.attr);
  if (claim.if) {
    // Filtered: the group (its picture in a dashed loop), then the quantifier, then the part, left to right.
    const k = Math.min(1, h / 110);
    const f = attrIcon(claim.if);
    f.scale.set(0.8 * k);
    f.x = -w / 2 + 52 * k + 6;
    const loop = new Graphics();
    for (let t = 0; t < 16; t += 2)
      loop.arc(0, 0, 44, (t * Math.PI) / 8, ((t + 1) * Math.PI) / 8).stroke(line(ink, 4));
    loop.scale.set(k);
    loop.x = f.x;
    q.scale.set(0.9 * k);
    q.x = f.x + 100 * k;
    a.scale.set(0.9 * k);
    a.x = w / 2 - 52 * k - 6;
    c.addChild(loop, f, q, a);
    return c;
  }
  q.x = -w / 4;
  q.scale.set(Math.min(1.2, h / 100));
  a.x = w / 4;
  a.scale.set(Math.min(1.1, h / 100));
  c.addChild(q, a);
  return c;
}

/** Level 4's frame behind a card's creature: a big circle or a big square, centred on (0, 0). */
export function frameArt(shape: 'round' | 'square'): Graphics {
  const g = new Graphics();
  if (shape === 'round') g.circle(0, 0, 62);
  else g.roundRect(-58, -58, 116, 116, 6);
  return g.fill(swatch.white.light).stroke(line(ink, 7));
}

// Level 5 ------------------------------------------------------------------------------------------------------------

/** A small picture of the thing a level 5 claim is about (`k` 0 or 1), centred on (0, 0), about 80 across. */
export function thingIcon(why: Why, k: 0 | 1): Container {
  const c = new Container();
  if (why.scene === 'balance') c.addChild(k === 0 ? bucketArt(1) : cupArt(1));
  else if (why.scene === 'ribbon')
    c.addChild(
      new Graphics()
        .roundRect(-38, -10, 76, 20, 6)
        .fill(swatch[k === 0 ? 'red' : 'blue'].fill)
        .stroke(line(ink, 4)),
    );
  else c.addChild(trayArt(k + 1, 0.6, true));
  return c;
}

/** "More": two stacked chevrons pointing up, centred on (0, 0). */
function moreMark(): Graphics {
  const g = new Graphics();
  for (const y of [-6, 12])
    g.moveTo(-16, y + 8)
      .lineTo(0, y - 8)
      .lineTo(16, y + 8);
  return g.stroke(line(swatch.green.line, 7));
}

/** A speaker's sign at level 5: its claim as the thing and a "more" mark, `w` by `h`, centred on (0, 0). */
export function whySign(why: Why, k: 0 | 1, w: number, h: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 16)
      .fill(0xffffff)
      .stroke(line(wood.line, 6)),
  );
  const t = thingIcon(why, k);
  t.x = -w * 0.12;
  const m = moreMark();
  m.x = w * 0.3;
  c.addChild(t, m);
  return c;
}

export function bucketArt(s: number): Graphics {
  return new Graphics()
    .poly([-30 * s, -30 * s, 30 * s, -30 * s, 22 * s, 26 * s, -22 * s, 26 * s])
    .fill(swatch.blue.light)
    .stroke(line(ink, 4))
    .moveTo(-28 * s, -30 * s)
    .quadraticCurveTo(0, -62 * s, 28 * s, -30 * s)
    .stroke(line(ink, 4));
}
export function cupArt(s: number): Graphics {
  return new Graphics()
    .roundRect(-14 * s, -14 * s, 28 * s, 30 * s, 5 * s)
    .fill(swatch.yellow.light)
    .stroke(line(ink, 4))
    .circle(18 * s, 0, 8 * s)
    .stroke(line(ink, 4));
}
/** A tray holding `n` shells in a row (from the left), `s` scale; `label` adds the tray's number as dots underneath. */
export function trayArt(n: number, s: number, label = false): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-130 * s, -24 * s, 260 * s, 48 * s, 12 * s)
    .fill(wood.fill)
    .stroke(line(wood.line, 4));
  if (label) for (let d = 0; d < n; d++) g.circle((d - (n - 1) / 2) * 30 * s, 0, 10 * s).fill(ink);
  else
    for (let i = 0; i < n; i++) {
      const x = -100 * s + i * 54 * s;
      g.moveTo(x - 18 * s, 10 * s)
        .quadraticCurveTo(x, -34 * s, x + 18 * s, 10 * s)
        .closePath()
        .fill(swatch.pink.light)
        .stroke(line(swatch.pink.line, 3));
    }
  c.addChild(g);
  return c;
}

/**
 * Level 5's scene, `w` by `h`, centred on (0, 0), drawn from the prompt's facts (so the picture and the lines agree).
 * Returns the picture and the spot the evidence traces (the low pan, the two ribbon ends, or the two trays).
 */
export function sceneArt(
  why: Why,
  w: number,
  h: number,
): { node: Container; marks: { x: number; y: number }[] } {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(cream)
      .stroke(line(wood.line, 5)),
  );
  const [a, b] = why.facts;
  const flip = why.mirror ? -1 : 1;
  const marks: { x: number; y: number }[] = [];
  if (why.scene === 'balance') {
    // The heavier thing's pan sits low; the bucket is on the left unless mirrored.
    const tilt = (a > b ? 1 : -1) * 0.22 * flip;
    const beam = new Container();
    const g = new Graphics()
      .poly([-16, h / 2 - 20, 16, h / 2 - 20, 0, -30])
      .fill(wood.fill)
      .stroke(line(wood.line, 4));
    c.addChild(g, beam);
    beam.y = -30;
    beam.addChild(new Graphics().rect(-170, -6, 340, 12).fill(wood.fill).stroke(line(wood.line, 4)));
    beam.rotation = tilt;
    for (const side of [-1, 1]) {
      const isBucket = side === -flip;
      const x = side * 160 * Math.cos(tilt),
        y = -30 + side * 160 * Math.sin(tilt) + 50;
      const pan = new Graphics()
        .moveTo(x, y - 50)
        .lineTo(x - 50, y)
        .moveTo(x, y - 50)
        .lineTo(x + 50, y)
        .stroke(line(ink, 3))
        .ellipse(x, y, 60, 12)
        .fill(wood.light ?? wood.fill)
        .stroke(line(wood.line, 4));
      const thing = isBucket ? bucketArt(0.9) : cupArt(1.1);
      thing.position.set(x, y - 24);
      c.addChild(pan, thing);
      if ((isBucket ? a : b) > (isBucket ? b : a)) marks.push({ x, y });
    }
  } else if (why.scene === 'ribbon') {
    // A ruler of marks from a shared start; the red and blue ribbons reach their marks.
    const step = Math.min(80, (w - 120) / 6);
    const x0 = -step * 3;
    const g = new Graphics();
    g.moveTo(x0, -h / 2 + 30)
      .lineTo(x0, h / 2 - 30)
      .stroke(line(ink, 5));
    for (let m = 1; m <= 6; m++)
      g.moveTo(x0 + m * step, -h / 2 + 30)
        .lineTo(x0 + m * step, h / 2 - 30)
        .stroke(line(ink, 2));
    c.addChild(g);
    const rows: [Color, number][] = [
      ['red', a],
      ['blue', b],
    ];
    if (why.mirror) rows.reverse();
    rows.forEach(([color, n], r) => {
      const y = (r === 0 ? -1 : 1) * 40;
      c.addChild(
        new Graphics()
          .roundRect(x0, y - 14, n * step, 28, 8)
          .fill(swatch[color].fill)
          .stroke(line(ink, 4)),
      );
      marks.push({ x: x0 + n * step, y });
    });
  } else {
    // Two trays in matching rows: the first above, the second below.
    [a, b].forEach((n, r) => {
      const t = trayArt(n, 1);
      t.y = (r === 0 ? -1 : 1) * 55;
      c.addChild(t);
      marks.push({ x: 0, y: t.y });
    });
  }
  c.addChild(new Graphics()); // keeps child order stable for the trace overlay
  return { node: c, marks };
}

/** A level 5 response card's picture, centred on (0, 0): a magnifier (evidence), a puffed-up "!" (sure), a looping bubble (again). */
export function responseArt(r: Response, w: number, h: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 16)
      .fill(0xffffff)
      .stroke(line(wood.line, 6)),
  );
  const g = new Graphics();
  if (r === 'evidence') {
    g.circle(-8, -8, 34).fill(swatch.blue.light).stroke(line(ink, 7));
    g.moveTo(16, 16).lineTo(46, 46).stroke(line(wood.line, 12));
    g.circle(-8, -8, 8).fill(ink);
  } else if (r === 'sure') {
    g.circle(0, 0, 44).fill(swatch.orange.light).stroke(line(swatch.orange.line, 5));
    g.roundRect(-7, -32, 14, 40, 6).fill(ink).circle(0, 22, 8).fill(ink);
  } else {
    g.roundRect(-52, -38, 104, 70, 24).fill(swatch.white.light).stroke(line(ink, 5));
    g.moveTo(-20, 32).lineTo(-30, 52).lineTo(-4, 32).stroke(line(ink, 5));
    g.arc(0, -4, 20, -2.6, 1.9).stroke(line(swatch.green.line, 6));
    g.moveTo(-4, 16).lineTo(-12, 8).moveTo(-4, 16).lineTo(-12, 24).stroke(line(swatch.green.line, 6));
  }
  c.addChild(g);
  return c;
}

/** A level 6 reply bubble, `w` by `h`, centred on (0, 0): two friends looking together (kind) or a hand held up (rude). */
export function replyArt(r: Reply, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h - 18, 30)
    .fill(0xffffff)
    .stroke(line(ink, 5))
    .moveTo(-30, h / 2 - 20)
    .lineTo(-44, h / 2)
    .lineTo(-6, h / 2 - 20)
    .fill(0xffffff);
  if (r === 'kind') {
    for (const x of [-44, 44])
      g.circle(x, -14, 26).fill(swatch.orange.light).stroke(line(swatch.orange.line, 4));
    g.circle(0, 18, 18)
      .fill(swatch.blue.light)
      .stroke(line(ink, 5))
      .moveTo(12, 30)
      .lineTo(26, 44)
      .stroke(line(wood.line, 7));
  } else {
    g.roundRect(-30, -40, 60, 70, 18).fill(swatch.red.light).stroke(line(swatch.red.line, 5));
    for (const x of [-20, -7, 6, 19]) g.moveTo(x, -40).lineTo(x, -58).stroke(line(swatch.red.line, 8));
  }
  c.addChild(g);
  return c;
}

void SCENE_FACTS;

/** The sign's post down to the friend's crate. */
export function postArt(h: number): Graphics {
  return new Graphics().rect(-6, 0, 12, h).fill(wood.fill).stroke(line(wood.line, 3));
}

/** The big tick printed across the sign by the stamp. */
export function everyMark(): Graphics {
  return new Graphics()
    .circle(0, 0, 46)
    .fill({ color: swatch.green.light, alpha: 0.9 })
    .stroke(line(swatch.green.line, 6))
    .moveTo(-22, 2)
    .lineTo(-6, 20)
    .lineTo(26, -18)
    .stroke(line(swatch.green.line, 10));
}

/** The wooden rubber stamp, `s` square, centred on (0, 0): a handle above an inked face with the every sign and a tick. */
export function stampArt(s: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-s * 0.18, -s / 2, s * 0.36, s * 0.42, 12)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .roundRect(-s / 2, -s * 0.1, s, s * 0.6, 14)
      .fill(cream)
      .stroke(line(wood.line, 5)),
  );
  const q = quantIcon('every');
  q.scale.set(0.8);
  q.position.set(-s * 0.18, s * 0.2);
  const t = new Graphics().moveTo(-12, 0).lineTo(-3, 10).lineTo(14, -10).stroke(line(swatch.green.line, 7));
  t.position.set(s * 0.28, s * 0.2);
  c.addChild(q, t);
  return c;
}
