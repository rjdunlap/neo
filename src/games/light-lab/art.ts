import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { flower } from '../../art/shapes';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { WigglyIcon } from '../shared';
import type { GameContext } from '../types';
import type { Outcome, ThingName, Tilt, Tint } from './logic';

export const TINT_COLOR: Record<Tint, number> = {
  sun: 0xffe066,
  pink: swatch.pink.fill,
  blue: swatch.blue.fill,
};
export const CARD_W = 150;
export const CARD_H = 130;

/** A smiling sun: the beam's start, and the button that shines it on planning levels. */
export function sunArt(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30).lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
  }
  g.stroke({ width: 6, color: swatch.yellow.line, cap: 'round' });
  g.circle(0, 0, 28).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
  g.circle(-9, -4, 3).circle(9, -4, 3).fill(ink);
  g.moveTo(-9, 8).quadraticCurveTo(0, 15, 9, 8).stroke({ width: 3, color: ink, cap: 'round' });
  return g;
}

/** A mirror on a little stand; it is drawn as "/" and rotated a quarter for "\". */
export function mirrorArt(): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .circle(0, 0, 40)
      .fill({ color: 0xffffff, alpha: 0.5 })
      .stroke({ width: 3, color: swatch.white.line, alpha: 0.6 }),
  );
  const glass = new Graphics()
    .roundRect(-8, -42, 16, 84, 6)
    .fill(0xdff3ff)
    .stroke({ width: 5, color: swatch.blue.line });
  glass.moveTo(-2, -32).lineTo(-2, 30).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
  glass.rotation = Math.PI / 4;
  c.addChild(glass);
  return c;
}

/** Level 12's half-mirror: the mirror's bar as pale glass with a silver stripe and two glints, so it reads as glass and mirror at once. */
export function halfMirrorArt(): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .circle(0, 0, 40)
      .fill({ color: 0xffffff, alpha: 0.5 })
      .stroke({ width: 3, color: swatch.white.line, alpha: 0.6 }),
  );
  const glass = new Graphics()
    .roundRect(-10, -42, 20, 84, 7)
    .fill({ color: swatch.blue.light, alpha: 0.35 })
    .stroke({ width: 4, color: swatch.blue.line, alpha: 0.8 });
  glass.moveTo(0, -36).lineTo(0, 36).stroke({ width: 5, color: 0x9aa8b6 });
  glass.circle(-4, -24, 3).circle(4, 22, 2.5).fill(0xffffff);
  glass.rotation = Math.PI / 4;
  c.addChild(glass);
  return c;
}

/** Level 10's cloud over one cell: overlapping white puffs with a pale blue edge, wide enough to hide a mirror. */
export function cloudArt(): Container {
  const c = new Container();
  const puffs: [number, number, number][] = [
    [0, 0, 38],
    [-26, -20, 27],
    [24, -22, 26],
    [-26, 20, 27],
    [26, 20, 26],
    [0, -30, 22],
    [0, 30, 22],
  ];
  const g = new Graphics();
  for (const [x, y, r] of puffs) g.circle(x, y, r);
  g.stroke({ width: 6, color: 0xb9d8f2 });
  for (const [x, y, r] of puffs) g.circle(x, y, r);
  g.fill(0xffffff);
  g.roundRect(-40, -40, 80, 80, 26).fill(0xffffff);
  c.addChild(g);
  return c;
}

/** Level 11's things, about a cell across: drawn straight, except a shiny one, slanted at its tilt so its turn shows. */
export function objectArt(name: ThingName, tilt: Tilt): Container {
  const c = new Container();
  const g = new Graphics();
  const clear = { color: 0xbfe3ff, alpha: 0.25 };
  const edge = { width: 4, color: swatch.blue.line, alpha: 0.7 };
  const frosted = { color: 0xffffff, alpha: 0.6 };
  switch (name) {
    case 'jar':
      g.roundRect(-26, -30, 52, 64, 12).fill(clear).stroke(edge);
      g.roundRect(-22, -40, 44, 12, 4).fill({ color: swatch.blue.fill, alpha: 0.5 }).stroke(edge);
      g.moveTo(-14, -20).lineTo(-14, 20).stroke({ width: 4, color: 0xffffff, alpha: 0.9, cap: 'round' });
      break;
    case 'cup':
      g.poly([-28, -34, 28, -34, 20, 34, -20, 34])
        .fill(clear)
        .stroke({ ...edge, join: 'round' });
      g.moveTo(-16, -24).lineTo(-12, 22).stroke({ width: 4, color: 0xffffff, alpha: 0.9, cap: 'round' });
      break;
    case 'pane':
      g.rect(-32, -38, 64, 76).fill(clear).stroke({ width: 7, color: wood.line });
      g.moveTo(0, -38).lineTo(0, 38).moveTo(-32, 0).lineTo(32, 0).stroke({ width: 5, color: wood.line });
      break;
    case 'wax':
    case 'tissue': {
      const top = [-30, -34, -15, -40, 0, -34, 15, -40, 30, -34];
      g.poly([...top, 30, 38, -30, 38])
        .fill(name === 'wax' ? frosted : { color: 0xffe4ef, alpha: 0.65 })
        .stroke({ width: 3, color: swatch.white.line, join: 'round' });
      g.moveTo(-18, -20)
        .lineTo(-6, 26)
        .moveTo(10, -24)
        .lineTo(18, 20)
        .stroke({ width: 2, color: swatch.white.line, alpha: 0.6 });
      break;
    }
    case 'bottle':
      g.roundRect(-22, -14, 44, 52, 12)
        .roundRect(-9, -38, 18, 26, 4)
        .fill(frosted)
        .stroke({ width: 3, color: swatch.white.line });
      break;
    case 'card':
      g.rect(-32, -36, 64, 72).fill(0xc99a62).stroke({ width: 4, color: wood.line });
      g.moveTo(-32, -6).lineTo(32, -6).stroke({ width: 3, color: wood.line, alpha: 0.5 });
      g.poly([18, -36, 32, -36, 32, -22]).fill(0xe0b98a);
      break;
    case 'block':
      g.roundRect(-32, -32, 64, 64, 8).fill(wood.fill).stroke({ width: 5, color: wood.line });
      break;
    case 'book':
      g.roundRect(-30, -38, 60, 76, 6).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
      g.rect(18, -32, 8, 64).fill(0xfffaf0);
      break;
    case 'lid':
    case 'foil': {
      const metal = new Graphics();
      if (name === 'lid') metal.ellipse(0, 0, 14, 42).fill(0xd6dde6).stroke({ width: 5, color: 0x8a97a8 });
      else
        metal
          .poly([-10, -42, 8, -36, 12, -10, 6, 14, 12, 40, -8, 42, -12, 16, -6, -8])
          .fill(0xdfe5ec)
          .stroke({ width: 4, color: 0x8a97a8, join: 'round' });
      metal.circle(-2, -20, 4).circle(3, 14, 3).fill(0xffffff);
      // Drawn upright, then slanted like a mirror's glass: "/" for tilt 0, "\" for tilt 1.
      metal.rotation = tilt === 0 ? Math.PI / 4 : -Math.PI / 4;
      c.addChild(metal);
      break;
    }
  }
  c.addChildAt(g, 0);
  return c;
}

/** The little wooden stand a thing sits on. */
export function standArt(): Graphics {
  return new Graphics()
    .roundRect(-34, 34, 68, 12, 4)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line })
    .rect(-6, 26, 12, 10)
    .fill(wood.line);
}

/** The three guess pictures: an arrow passing a pane, turning off a slanted bar, or meeting a wall with a shadow behind. */
export function outcomeArt(o: Outcome): Graphics {
  const g = new Graphics();
  const arrow = { width: 8, color: 0xf2b705, cap: 'round' as const, join: 'round' as const };
  const head = (x: number, y: number, dx: number, dy: number) =>
    g.poly([x + dx * 14, y + dy * 14, x - dy * 11, y + dx * 11, x + dy * 11, y - dx * 11]).fill(0xf2b705);
  if (o === 'through') {
    g.roundRect(-8, -36, 16, 72, 4)
      .fill({ color: 0xbfe3ff, alpha: 0.5 })
      .stroke({ width: 3, color: swatch.blue.line });
    g.moveTo(-54, 0).lineTo(40, 0).stroke(arrow);
    head(40, 0, 1, 0);
  } else if (o === 'bounce') {
    g.moveTo(-6, 20).lineTo(26, -12).stroke({ width: 10, color: 0x8a97a8, cap: 'round' });
    g.moveTo(-54, 4).lineTo(10, 4).lineTo(10, -34).stroke(arrow);
    head(10, -34, 0, -1);
  } else {
    g.rect(14, -24, 40, 48).fill({ color: ink, alpha: 0.15 });
    g.roundRect(2, -38, 14, 76, 4).fill(0xc99a62).stroke({ width: 3, color: wood.line });
    g.moveTo(-54, 0).lineTo(-14, 0).stroke(arrow);
    head(-14, 0, 1, 0);
  }
  return g;
}

/** A picture card under the board: a guess button or a tray thing. */
export function cardArt(): Graphics {
  return new Graphics()
    .roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 22)
    .fill(0xffffff)
    .stroke({ width: 5, color: swatch.teal.line });
}

export function rockArt(): Graphics {
  return new Graphics()
    .poly([-38, 26, -30, -16, -8, -34, 22, -28, 38, 4, 30, 30])
    .fill(swatch.white.line)
    .stroke({ width: 5, color: ink, alpha: 0.4, join: 'round' });
}

export function glassArt(tint: Tint): Graphics {
  return new Graphics()
    .roundRect(-34, -34, 68, 68, 12)
    .fill({ color: TINT_COLOR[tint], alpha: 0.45 })
    .stroke({ width: 5, color: TINT_COLOR[tint] });
}

export class Bloom extends Container {
  private readonly bud = new Graphics();
  private readonly open: Graphics;
  awake = false;
  constructor(readonly wants: Tint) {
    super();
    const petal = wants === 'pink' ? swatch.pink : swatch.yellow;
    this.bud.ellipse(0, -6, 16, 24).fill(petal.light).stroke({ width: 4, color: petal.line });
    this.open = flower(new Graphics(), 34, petal.fill, petal.line);
    this.open.y = -8;
    this.open.scale.set(0);
    const stem = new Graphics()
      .moveTo(0, 40)
      .lineTo(0, 12)
      .stroke({ width: 6, color: swatch.green.line, cap: 'round' })
      .ellipse(10, 28, 10, 5)
      .fill(swatch.green.fill);
    this.addChild(stem, this.bud, this.open);
  }
  /** A `soft` wake (dim light, level 11) opens it partway and paler. */
  wake(tw: GameContext['tw'], soft = false) {
    if (this.awake) return;
    this.awake = true;
    this.bud.visible = false;
    this.open.alpha = soft ? 0.6 : 1;
    const to = soft ? 0.7 : 1;
    void tw.to(this.open.scale, { x: to, y: to }, { duration: 0.45, ease: ease.outBack });
  }
  sleep() {
    this.awake = false;
    this.bud.visible = true;
    this.open.scale.set(0);
    this.open.alpha = 1;
  }
}

export class LightIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const sun = sunArt();
    sun.position.set(-70, -150);
    sun.scale.set(0.8);
    const beam = new Graphics()
      .moveTo(-70, -150)
      .lineTo(30, -150)
      .lineTo(30, -60)
      .stroke({ width: 16, color: 0xffe066, alpha: 0.5, cap: 'round' })
      .moveTo(-70, -150)
      .lineTo(30, -150)
      .lineTo(30, -60)
      .stroke({ width: 6, color: 0xffe066, cap: 'round' });
    const m = mirrorArt();
    m.position.set(30, -150);
    m.scale.set(0.7);
    m.children[1].rotation = -Math.PI / 4;
    const f = new Bloom('sun');
    f.position.set(30, -60);
    f.children[1].visible = false;
    f.children[2].scale.set(1);
    c.addChild(beam, sun, m, f);
    super(c);
  }
}

export function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const pink = rng.chance(0.5);
  const f = new Bloom(pink ? 'pink' : 'sun');
  f.children[1].visible = false;
  f.children[2].scale.set(1);
  f.scale.set(1.6);
  const rays = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    rays.moveTo(Math.cos(a) * 70, Math.sin(a) * 70 - 14).lineTo(Math.cos(a) * 100, Math.sin(a) * 100 - 14);
  }
  rays.stroke({ width: 8, color: pink ? swatch.pink.fill : 0xffe066, cap: 'round' });
  c.addChild(rays, f);
  return c;
}
