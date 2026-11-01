/** Paint Mixer's pots, bucket, jar and drops, code-drawn from the palette. Colour is never the only cue: every pot and drop carries its mark. */
import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { label } from '../../ui/text';
import { BUCKET, DROP, JAR_H, JAR_W, POT_COLOR, POT_H, POT_W, TABLE_CELL, TABLE_H, TABLE_LABEL, TABLE_ROW, type Pot, type Table } from './logic';

const line = (pot: Pot) => swatch[pot].line;
const TIN = 0xbfc6d2, TIN_LINE = 0x6f7a8c, TIN_LIGHT = 0xe3e8f0;

/** The pot's mark: a red dot, a yellow stripe, a blue star, a white ring. Drawn into `g` centred on (0, 0) at `size`. */
export function mark(g: Graphics, pot: Pot, size: number, color = line(pot), alpha = 1): Graphics {
  const s = size / 2;
  if (pot === 'red') g.circle(0, 0, s * 0.55).fill({ color, alpha });
  else if (pot === 'yellow') g.roundRect(-s, -s * 0.22, size, s * 0.44, s * 0.2).fill({ color, alpha });
  else if (pot === 'blue') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5, b = a + Math.PI / 5;
      const p = [Math.cos(a) * s, Math.sin(a) * s, Math.cos(b) * s * 0.45, Math.sin(b) * s * 0.45];
      if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
      g.lineTo(p[2], p[3]);
    }
    g.closePath().fill({ color, alpha });
  } else g.circle(0, 0, s * 0.72).stroke({ width: Math.max(3, size * 0.16), color, alpha });
  return g;
}

/** A drop of paint, 30 units, with its mark; `outline` draws the empty place a drop of that pot would fill. */
export function drop(pot: Pot, outline = false): Graphics {
  const g = new Graphics();
  const r = DROP / 2;
  if (outline) {
    g.circle(0, 0, r - 2).stroke({ width: 3, color: ink, alpha: 0.35 });
    return mark(g, pot, DROP * 0.5, ink, 0.3);
  }
  g.circle(0, 0, r).fill(POT_COLOR[pot]).stroke({ width: 3, color: line(pot) });
  return mark(g, pot, DROP * 0.5);
}

/** A fat pot with its word and mark on the belly, 120 × 130, standing on (0, 0) with its centre at (0, -65). */
export function pot(kind: Pot): Container {
  const c = new Container();
  const w = POT_W, h = POT_H;
  const g = new Graphics()
    .ellipse(0, 2, w * 0.46, 9).fill({ color: ink, alpha: 0.12 })
    .moveTo(-w * 0.42, -h * 0.82).lineTo(w * 0.42, -h * 0.82).lineTo(w * 0.36, -4).quadraticCurveTo(0, 6, -w * 0.36, -4).closePath()
    .fill(POT_COLOR[kind]).stroke({ width: 5, color: line(kind) })
    .roundRect(-w * 0.48, -h * 0.98, w * 0.96, h * 0.2, 10).fill(POT_COLOR[kind]).stroke({ width: 5, color: line(kind) })
    .ellipse(0, -h * 0.88, w * 0.32, 7).fill({ color: 0xffffff, alpha: 0.35 });
  c.addChild(g);
  const badge = new Graphics().roundRect(-40, -h * 0.68, 80, 34, 12).fill({ color: 0xffffff, alpha: 0.85 });
  c.addChild(badge);
  const m = mark(new Graphics(), kind, 30);
  m.position.set(0, -h * 0.28);
  c.addChild(m);
  const word = label(kind, 24, ink);
  word.position.set(0, -h * 0.68 + 17);
  c.addChild(word);
  return c;
}

/** A tin bucket, 320 × 320, centred on (0, 0): `inside` is the paint surface the game fills, `rows` holds the drops over it. */
export function bucket(): { node: Container; inside: Graphics; rows: Container; rim: Graphics } {
  const node = new Container();
  const s = BUCKET;
  const body = new Graphics()
    .ellipse(0, s * 0.47, s * 0.42, 12).fill({ color: ink, alpha: 0.14 })
    .moveTo(-s * 0.44, -s * 0.3).lineTo(s * 0.44, -s * 0.3).lineTo(s * 0.36, s * 0.44).quadraticCurveTo(0, s * 0.5, -s * 0.36, s * 0.44).closePath()
    .fill(TIN).stroke({ width: 6, color: TIN_LINE })
    .roundRect(-s * 0.46, -s * 0.36, s * 0.92, s * 0.1, 8).fill(TIN_LIGHT).stroke({ width: 5, color: TIN_LINE })
    .moveTo(-s * 0.44, -s * 0.32).quadraticCurveTo(0, -s * 0.62, s * 0.44, -s * 0.32).stroke({ width: 8, color: TIN_LINE, cap: 'round' });
  const inside = new Graphics();
  const rim = new Graphics();
  const rows = new Container();
  node.addChild(body, inside, rim, rows);
  return { node, inside, rows, rim };
}

/** Paint the bucket's inside: the opening as an ellipse in `color`, or bare tin when empty. */
export function fillInside(inside: Graphics, color: number | undefined) {
  const s = BUCKET;
  inside.clear().ellipse(0, -s * 0.31, s * 0.4, s * 0.11).fill(color ?? TIN_LIGHT).stroke({ width: 4, color: TIN_LINE, alpha: 0.5 });
  // The paint shown as a wide pool down the front, so the drops sit on colour.
  inside.roundRect(-s * 0.34, -s * 0.2, s * 0.68, s * 0.56, 40).fill({ color: color ?? TIN_LIGHT, alpha: color === undefined ? 0.5 : 0.95 });
}

/** A glass sample jar, 150 × 190, centred on (0, 0), holding `color` with a lid. */
export function jar(color: number): Container {
  const c = new Container();
  const w = JAR_W, h = JAR_H;
  c.addChild(new Graphics()
    .ellipse(0, h * 0.48, w * 0.4, 8).fill({ color: ink, alpha: 0.12 })
    .roundRect(-w * 0.42, -h * 0.3, w * 0.84, h * 0.76, 26).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ width: 5, color: TIN_LINE })
    .roundRect(-w * 0.36, -h * 0.08, w * 0.72, h * 0.48, 20).fill(color)
    .roundRect(-w * 0.3, -h * 0.46, w * 0.6, h * 0.2, 10).fill(swatch.brown.fill).stroke({ width: 5, color: swatch.brown.line })
    .roundRect(-w * 0.32, -h * 0.22, 14, h * 0.5, 6).fill({ color: 0xffffff, alpha: 0.45 }));
  return c;
}

/** A plain rounded button with a drawn icon: Undo (a back arrow), Tip out (a tilted cup), Check (a tick). */
export function button(kind: 'undo' | 'tip' | 'check', w: number, h: number): Container {
  const c = new Container();
  const color = kind === 'check' ? swatch.green : kind === 'undo' ? swatch.blue : swatch.orange;
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2 + 6, w, h, 24).fill({ color: ink, alpha: 0.12 })
    .roundRect(-w / 2, -h / 2, w, h, 24).fill(color.fill).stroke({ width: 5, color: color.line }));
  const g = new Graphics();
  if (kind === 'check') g.moveTo(-26, 2).lineTo(-8, 22).lineTo(28, -22).stroke({ width: 13, color: 0xffffff, cap: 'round', join: 'round' });
  else if (kind === 'undo') {
    g.moveTo(22, 14).quadraticCurveTo(22, -16, -8, -16).stroke({ width: 11, color: 0xffffff, cap: 'round' })
      .moveTo(-26, -16).lineTo(-6, -32).lineTo(-6, 0).closePath().fill(0xffffff);
  } else {
    g.roundRect(-20, -18, 40, 44, 8).fill(0xffffff);
    g.rotation = -0.6;
    g.position.set(-6, 0);
    const splash = new Graphics().circle(28, 18, 6).circle(38, 30, 4).fill(0xffffff);
    c.addChild(splash);
  }
  c.addChild(g);
  return c;
}

/**
 * The ratio table, centred on (0, 0): a header row of batch numbers, then a row per pot with its mark, each column holding
 * `k × sample` once batch `k` is complete and an empty cell before it. `star` marks level 4's first way.
 */
export function ratioTable(t: Table, pair: readonly [Pot, Pot], star: number | null): Container {
  const c = new Container();
  const w = TABLE_LABEL + t.columns * TABLE_CELL, h = TABLE_H;
  const left = -w / 2, top = -h / 2;
  c.addChild(new Graphics().roundRect(left - 8, top - 8, w + 16, h + 16, 16).fill({ color: 0xffffff, alpha: 0.88 }).stroke({ width: 3, color: TIN_LINE, alpha: 0.6 }));
  const g = new Graphics();
  c.addChild(g);
  for (let k = 0; k < t.columns; k++) {
    const x = left + TABLE_LABEL + k * TABLE_CELL + TABLE_CELL / 2;
    if (star === k + 1) c.addChild(starAt(x, top + TABLE_ROW / 2));
    const head = label(String(k + 1), 20, ink);
    head.alpha = 0.55;
    head.position.set(x, top + TABLE_ROW / 2);
    c.addChild(head);
    const full = k < t.filled;
    for (const i of [0, 1] as const) {
      const y = top + TABLE_ROW * (i + 1) + TABLE_ROW / 2;
      g.roundRect(x - TABLE_CELL / 2 + 3, y - TABLE_ROW / 2 + 3, TABLE_CELL - 6, TABLE_ROW - 6, 8);
      if (full) g.fill({ color: swatch[pair[i]].light }).stroke({ width: 2, color: line(pair[i]) });
      else g.stroke({ width: 2, color: ink, alpha: 0.2 });
      if (full) {
        const n = label(String(t.values[k][i]), 22, ink);
        n.position.set(x, y);
        c.addChild(n);
      }
    }
  }
  pair.forEach((pot, i) => {
    const d = drop(pot);
    d.scale.set(0.9);
    d.position.set(left + TABLE_LABEL / 2, top + TABLE_ROW * (i + 1) + TABLE_ROW / 2);
    c.addChild(d);
  });
  return c;
}

/** Level 4's first way: a gold star behind its column's number. */
function starAt(x: number, y: number): Graphics {
  const s = new Graphics();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5, b = a + Math.PI / 5;
    if (i === 0) s.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); else s.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
    s.lineTo(Math.cos(b) * 8, Math.sin(b) * 8);
  }
  s.closePath().fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
  s.position.set(x, y + 2);
  return s;
}

/** Level 3's fill line across the bucket at `y`, dashed. */
export function fillLine(y: number): Graphics {
  const g = new Graphics();
  for (let x = -118; x < 118; x += 22) g.moveTo(x, y).lineTo(Math.min(x + 13, 118), y);
  return g.stroke({ width: 5, color: ink, alpha: 0.55, cap: 'round' });
}
