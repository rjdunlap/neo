/** Spinner Fair's spinners and bars, code-drawn from the palette. Colour is never the only cue: every section and bar carries its critter. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { COLOR_OF, sections, STAND, WEDGE_DEG, type Kind, type Wheel } from './logic';

export const sw = (k: Kind) => swatch[COLOR_OF[k] as ColorName];

/** A still critter whose middle sits on (0, 0), `size` units tall. */
export function face(kind: Kind, size: number): Critter {
  const c = new Critter(CRITTERS[kind]);
  c.alive = false;
  const s = size / 250;
  c.scale.set(s);
  c.pivot.set(0, -125);
  return c;
}

/** Clockwise from the top: the wheel's wedge-0 edge points up at rotation 0. */
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

export interface SpinnerArt {
  node: Container;
  /** The part that turns: sections, faces and hub. */
  wheel: Container;
  /** The glow over one critter's section (help), redrawn by the game. */
  glow: Graphics;
}

/** A spinner of radius `r` on a stand, with the fixed pointer at the top; one section per critter, its face at the middle. */
export function spinner(w: Wheel, r: number): SpinnerArt {
  const node = new Container();
  const stand = new Graphics();
  stand.roundRect(-14, 0, 28, r + STAND - 6, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
  stand.roundRect(-r * 0.45, r + STAND - 14, r * 0.9, 20, 10).fill(wood.fill).stroke({ width: 4, color: wood.line });
  const wheel = new Container();
  const g = new Graphics();
  g.circle(0, 0, r + 8).fill(0xffffff).stroke({ width: 6, color: ink });
  for (const s of sections(w)) {
    const a0 = rad(s.start * WEDGE_DEG), a1 = rad((s.start + s.count) * WEDGE_DEG);
    const c = sw(s.kind);
    g.moveTo(0, 0).arc(0, 0, r, a0, a1).closePath().fill(c.fill).stroke({ width: 4, color: c.line });
  }
  wheel.addChild(g);
  for (const s of sections(w)) {
    const mid = rad((s.start + s.count / 2) * WEDGE_DEG);
    const at = s.count >= 3 ? 0.55 : 0.62;
    const f = face(s.kind, r * (s.count === 1 ? 0.42 : 0.5));
    f.position.set(Math.cos(mid) * r * at, Math.sin(mid) * r * at);
    f.rotation = mid + Math.PI / 2;
    wheel.addChild(f);
  }
  const hub = new Graphics();
  hub.circle(0, 0, r * 0.1).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  wheel.addChild(hub);
  const glow = new Graphics();
  glow.eventMode = 'none';
  const pointer = new Graphics();
  pointer.poly([-22, -r - 30, 22, -r - 30, 0, -r + 16]).fill(swatch.red.fill).stroke({ width: 5, color: ink, join: 'round' });
  node.addChild(stand, wheel, glow, pointer);
  return { node, wheel, glow };
}

/** Draw a pulsing ring over the wedges of `kind` on a wheel of radius `r` (in the wheel's own turned frame). */
export function glowSection(g: Graphics, w: Wheel, kind: Kind, r: number, rotation: number, width: number) {
  g.clear();
  const s = sections(w).find((x) => x.kind === kind);
  if (!s) return;
  const a0 = rad(s.start * WEDGE_DEG) + rotation, a1 = rad((s.start + s.count) * WEDGE_DEG) + rotation;
  g.moveTo(0, 0).arc(0, 0, r + 4, a0, a1).closePath().stroke({ width, color: swatch.yellow.fill, join: 'round' });
}

/** One block of a bar, `w` × `h`, in the critter's colours, its bottom edge on (0, 0). */
export function block(kind: Kind, w: number, h: number): Graphics {
  const c = sw(kind);
  return new Graphics().roundRect(-w / 2, -h + 2, w, h - 4, 6).fill(c.fill).stroke({ width: 3, color: c.line });
}
