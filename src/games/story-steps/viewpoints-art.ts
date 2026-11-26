import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch, wood } from '../../art/palette';
import { theaterSymbol } from './theater-art';
import type { Cast, ViewpointsEnding } from './theater-logic';

/** A little horn with the notes it plays, about 80 units wide, its mouthpiece at the origin. */
function horn(g: Graphics, x: number, y: number, s: number, notes: boolean) {
  g.moveTo(x, y - 6 * s)
    .lineTo(x + 36 * s, y - 20 * s)
    .lineTo(x + 36 * s, y + 20 * s)
    .lineTo(x, y + 6 * s)
    .closePath()
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line })
    .circle(x - 4 * s, y, 7 * s)
    .fill(swatch.yellow.line);
  if (!notes) return;
  for (const [dx, dy] of [
    [52, -22],
    [66, 6],
  ])
    g.circle(x + dx * s, y + dy * s, 6 * s)
      .fill(swatch.pink.line)
      .moveTo(x + (dx + 5) * s, y + dy * s)
      .lineTo(x + (dx + 5) * s, y + (dy - 22) * s)
      .stroke({ width: 3, color: swatch.pink.line, cap: 'round' });
}

function tree(g: Graphics, x: number, y: number, s: number) {
  g.roundRect(x - 7 * s, y - 20 * s, 14 * s, 44 * s, 4)
    .fill(wood.fill)
    .stroke({ width: 3, color: wood.line })
    .circle(x, y - 40 * s, 30 * s)
    .circle(x - 22 * s, y - 24 * s, 22 * s)
    .circle(x + 22 * s, y - 24 * s, 22 * s)
    .fill(swatch.green.fill)
    .stroke({ width: 3, color: swatch.green.line });
}

/** All pictures fit an 88-unit square about the origin. */
export function viewpointsSymbol(kind: ViewpointsEnding | 'speak' | 'heard'): Container {
  const c = new Container(),
    g = new Graphics();
  c.eventMode = 'none';
  c.addChild(g);
  if (kind === 'stay-loud') {
    horn(g, -34, 0, 0.9, true);
    for (const dy of [-26, 0, 26]) g.moveTo(-40, dy).lineTo(-52, dy - dy / 3);
    g.stroke({ width: 4, color: swatch.red.line, cap: 'round' });
  } else if (kind === 'turn-off') {
    horn(g, -34, 0, 0.9, false);
    g.moveTo(-40, -34)
      .lineTo(38, 34)
      .moveTo(38, -34)
      .lineTo(-40, 34)
      .stroke({ width: 7, color: swatch.red.fill, cap: 'round' });
  } else if (kind === 'two-spots') {
    g.roundRect(-42, 6, 38, 26, 4).fill(swatch.pink.light).stroke({ width: 3, color: swatch.pink.line });
    g.circle(-23, -14, 6)
      .fill(swatch.pink.line)
      .moveTo(-17, -14)
      .lineTo(-17, -32)
      .stroke({ width: 3, color: swatch.pink.line });
    tree(g, 26, 2, 0.6);
  } else if (kind === 'soft-spot') {
    g.moveTo(-44, 32)
      .quadraticCurveTo(0, -48, 44, 32)
      .closePath()
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line });
    g.circle(-6, -12, 5)
      .fill(swatch.pink.line)
      .moveTo(-1, -12)
      .lineTo(-1, -28)
      .stroke({ width: 3, color: swatch.pink.line });
  } else if (kind === 'speak') {
    g.roundRect(-36, -30, 72, 48, 14).fill(cream).stroke({ width: 4, color: swatch.blue.line });
    g.moveTo(-14, 16).lineTo(-22, 34).lineTo(2, 17).fill(cream).stroke({ width: 4, color: swatch.blue.line });
    for (const x of [-16, 0, 16]) g.circle(x, -6, 4).fill(swatch.blue.line);
  } else {
    g.moveTo(-26, 4)
      .lineTo(-8, 22)
      .lineTo(28, -20)
      .stroke({ width: 9, color: swatch.green.line, cap: 'round', join: 'round' });
  }
  return c;
}

/** The small picture on a friend's card. */
export function friendPortrait(who: Cast): Container {
  return theaterSymbol(who);
}

export interface ViewpointsView {
  musicFriend: Cast;
  quietFriend: Cast;
  /** `null` is the setup before an ending: 0 the mishap, 1 the two wishes. */
  ending: ViewpointsEnding | null;
  cue: number;
}

/** A 620 × 240 miniature stage. Cue 0: the horn starts, 1: two wishes, 2: the chosen ending. */
export function viewpointsScene({ musicFriend, quietFriend, ending, cue }: ViewpointsView): Container {
  const c = new Container(),
    g = new Graphics();
  c.eventMode = 'none';
  c.addChild(g);
  const final = cue >= 2 && ending !== null;
  g.roundRect(-310, -120, 620, 240, 18).fill(swatch.blue.light);
  g.rect(-305, 50, 610, 65).fill(swatch.green.light);
  const actor = (who: Cast, x: number, y: number, scale: number, lean = 0) => {
    const a = new Critter(CRITTERS[who]);
    a.alive = false;
    a.scale.set(scale);
    a.position.set(x, y);
    a.rotation = lean;
    c.addChild(a);
    return a;
  };
  const blanket = (x: number) =>
    g
      .roundRect(x - 62, 72, 124, 34, 6)
      .fill(swatch.pink.light)
      .stroke({ width: 3, color: swatch.pink.line });
  if (!final || ending === 'stay-loud') {
    blanket(-30);
    horn(g, 80, 56, 1, true);
    actor(musicFriend, -80, 80, 0.46, final ? 0.12 : 0);
    actor(quietFriend, 10, 80, 0.46);
    if (final) {
      // The quiet friend covers their ears.
      g.ellipse(-8, 4, 8, 12)
        .ellipse(28, 4, 8, 12)
        .fill(swatch.pink.fill)
        .stroke({ width: 3, color: swatch.pink.line });
    }
  } else if (ending === 'turn-off') {
    blanket(-30);
    g.roundRect(90, 70, 70, 28, 6).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    actor(musicFriend, -80, 80, 0.46, -0.1);
    actor(quietFriend, 10, 80, 0.46);
    g.circle(70, 66, 9).circle(98, 66, 9).fill(swatch.red.fill);
  } else if (ending === 'two-spots') {
    blanket(-170);
    horn(g, -120, 56, 1, true);
    tree(g, 190, 10, 1.1);
    actor(musicFriend, -200, 80, 0.46, 0.12);
    actor(quietFriend, 150, 80, 0.46);
    g.roundRect(195, 74, 56, 24, 6).fill(cream).stroke({ width: 3, color: wood.line });
    g.circle(212, 76, 8).circle(236, 76, 8).fill(swatch.red.fill);
  } else {
    // The shady hill: the horn sounds soft up here.
    g.moveTo(-100, 120)
      .quadraticCurveTo(80, -110, 260, 120)
      .closePath()
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line });
    tree(g, 215, 20, 0.8);
    blanket(80);
    horn(g, 165, 20, 0.6, true);
    actor(musicFriend, 40, 38, 0.38, 0.1);
    actor(quietFriend, 118, 38, 0.38);
  }
  g.roundRect(-310, -120, 30, 240, 8)
    .roundRect(280, -120, 30, 240, 8)
    .fill(swatch.pink.fill)
    .roundRect(-310, -120, 620, 20, 6)
    .fill(swatch.pink.line);
  return c;
}
