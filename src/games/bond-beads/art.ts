import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { label } from '../../ui/text';
import { HANDS, type Kind, type Link, type Pt, type Shape } from './logic';

/** Bead colours follow the usual ball-and-stick convention; they are bead colours, never a substance's. */
export const BEAD_COLOR: Record<Kind, { fill: number; line: number; text: number }> = {
  H: { fill: swatch.white.fill, line: swatch.white.line, text: ink },
  O: { fill: swatch.red.fill, line: swatch.red.line, text: 0xffffff },
  C: { fill: 0x5a5a6a, line: 0x34343f, text: 0xffffff },
};

export const LINK_COLOR = wood.line;

/** Each kind's shape mark, so colour is never the only cue: H a small circle, O a rounded square, C a diamond. */
function mark(g: Graphics, kind: Kind, r: number, color: number) {
  const s = r * 0.62;
  if (kind === 'H') g.circle(0, 0, s).stroke({ width: Math.max(2, r * 0.09), color, alpha: 0.55 });
  else if (kind === 'O') g.roundRect(-s, -s, 2 * s, 2 * s, s * 0.4).stroke({ width: Math.max(2, r * 0.09), color, alpha: 0.55 });
  else g.poly([0, -s * 1.2, s * 1.2, 0, 0, s * 1.2, -s * 1.2, 0]).stroke({ width: Math.max(2, r * 0.09), color, alpha: 0.55 });
}

/** A bead's ball: a shadow, the rim, the face with a highlight, its shape mark and its letter. */
export function beadBody(kind: Kind, r: number, withLetter = true): Container {
  const c = new Container();
  const col = BEAD_COLOR[kind];
  const g = new Graphics();
  g.ellipse(0, r * 0.92, r * 0.8, r * 0.2).fill({ color: 0x2b2440, alpha: 0.18 });
  g.circle(0, 0, r).fill(col.line);
  g.circle(0, -r * 0.04, r * 0.88).fill(col.fill);
  g.ellipse(-r * 0.32, -r * 0.42, r * 0.3, r * 0.17).fill({ color: 0xffffff, alpha: 0.45 });
  mark(g, kind, r, col.text);
  c.addChild(g);
  if (withLetter) {
    const t = label(kind, Math.round(r * 0.8), col.text);
    t.y = -r * 0.02;
    c.addChild(t);
  }
  return c;
}

/**
 * The hands around a bead: a held hand is a filled dot pointing at the bead it holds, a free one an open ring, spread
 * into the places the held ones leave.
 */
export function drawHands(g: Graphics, kind: Kind, r: number, heldAngles: number[]) {
  g.clear();
  const n = HANDS[kind];
  const start = heldAngles.length ? heldAngles[0] : -Math.PI / 2;
  const slots = Array.from({ length: n }, (_, i) => start + (2 * Math.PI * i) / n);
  const used = new Array<boolean>(n).fill(false);
  for (const a of heldAngles) {
    let best = -1;
    let bestD = Infinity;
    slots.forEach((s, i) => {
      if (used[i]) return;
      const d = Math.abs(Math.atan2(Math.sin(a - s), Math.cos(a - s)));
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) used[best] = true;
  }
  const at = (a: number) => ({ x: Math.cos(a) * (r + 3), y: Math.sin(a) * (r + 3) });
  for (const a of heldAngles) {
    const p = at(a);
    g.circle(p.x, p.y, 10).fill(LINK_COLOR);
  }
  slots.forEach((s, i) => {
    if (used[i]) return;
    const p = at(s);
    g.circle(p.x, p.y, 10).fill(cream).stroke({ width: 4, color: BEAD_COLOR[kind].line });
  });
}

/** Links between beads (drawn under them), as short rounded bars from centre to centre. */
export function drawLinks(g: Graphics, beads: readonly Pt[], links: readonly Link[], width = 16) {
  for (const [a, b] of links) {
    g.moveTo(beads[a].x, beads[a].y).lineTo(beads[b].x, beads[b].y).stroke({ width: width + 6, color: 0x7a5230, cap: 'round' });
    g.moveTo(beads[a].x, beads[a].y).lineTo(beads[b].x, beads[b].y).stroke({ width, color: wood.light, cap: 'round' });
  }
}

/** A small drawing of a shape: its links and lettered beads, `step` units apart. */
export function shapePicture(shape: Pick<Shape, 'kinds' | 'links' | 'pic'>, step: number, r: number): Container {
  const c = new Container();
  const pts = shape.pic.map((p) => ({ x: p.x * step, y: p.y * step }));
  const g = new Graphics();
  drawLinks(g, pts, shape.links, Math.max(6, r * 0.35));
  c.addChild(g);
  shape.kinds.forEach((kind, i) => {
    const b = beadBody(kind, r);
    b.position.set(pts[i].x, pts[i].y);
    c.addChild(b);
  });
  return c;
}

/** The request card's face. */
export function cardArt(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2 + 5, w, h, 22).fill({ color: 0x2b2440, alpha: 0.15 })
    .roundRect(-w / 2, -h / 2, w, h, 22).fill(cream).stroke({ width: 5, color: wood.line });
}

/** The table the beads sit on. */
export function tableArt(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 34).fill({ color: wood.light, alpha: 0.55 }).stroke({ width: 5, color: wood.fill, alpha: 0.7 });
}

/** Three linked beads, for the hub icon and the sticker. */
export function beadTrio(r: number, kinds: Kind[] = ['H', 'O', 'H'], bend = 0.35): Container {
  const step = r * 2.3;
  return shapePicture({ kinds, links: [[0, 1], [1, 2]], pic: [{ x: -1, y: bend }, { x: 0, y: -bend }, { x: 1, y: bend }] }, step, r);
}
