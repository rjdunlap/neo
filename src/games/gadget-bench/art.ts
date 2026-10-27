/** Gadget Bench's code-drawn pieces: the cart and its cargo, sockets, the five toy parts, path tiles, the request card, icons. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { checkIcon, crossIcon } from '../../ui/icons';
import { need, socketAt, SOCKET, SOCKETS, type Cargo, type Condition, type Gadget, type Neighbor, type PartId, type Socket } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export const WHEEL = { fill: 0xf2545b, line: 0xc23a40, hub: 0xffd54a };
export const FLOAT = { fill: 0x7cc7ff, line: 0x3a8fd6, stripe: 0xffffff };
export const UMBRELLA = { fill: 0xffd54a, line: 0xd9a520, handle: 0x9c6b3c };
export const LANTERN = { fill: 0x8fd48a, line: 0x4f9c4a, glow: 0xfff3a6 };
export const FLAG = { fill: 0xb98ae8, line: 0x7d55b5, pole: 0x9c6b3c };
export const ROAD = { fill: 0xd9d4c7, line: 0xa89f8e };
export const NIGHT = { fill: 0x2f3560, line: 0x1c2040, star: 0xfff3a6 };

// ——— The cart ———

/** A wooden cart body with small fixed wheels and the neighbor's cargo, centred on (0, 0), `w` wide. */
export function cartArt(w: number, cargo: Cargo | null): Container {
  const c = new Container();
  const g = new Graphics();
  const bw = w * 0.56;
  const bh = w * 0.22;
  g.roundRect(-bw / 2 + 6, -bh / 2 + 8, bw, bh, 14).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-bw / 2, -bh / 2, bw, bh, 14).fill(wood.fill).stroke(line(wood.line, 5));
  g.moveTo(-bw / 2 + 16, -bh / 2 + 10).lineTo(-bw / 2 + 16, bh / 2 - 10).stroke(line(wood.line, 3));
  g.moveTo(bw / 2 - 16, -bh / 2 + 10).lineTo(bw / 2 - 16, bh / 2 - 10).stroke(line(wood.line, 3));
  for (const x of [-bw * 0.3, bw * 0.3]) {
    g.circle(x, bh / 2 + 4, 15).fill(ink).stroke(line(0x555566, 3));
    g.circle(x, bh / 2 + 4, 5).fill(0x999aa8);
  }
  // A handle at the front.
  g.moveTo(bw / 2 - 4, -bh / 2 + 8).lineTo(bw / 2 + 22, -bh / 2 - 6).stroke(line(wood.line, 6));
  c.addChild(g);
  if (cargo) {
    const k = cargoArt(cargo, bh * 0.95);
    k.position.set(-bw * 0.3, -bh / 2 - 2);
    c.addChild(k);
  }
  return c;
}

/** What a neighbor carries, drawn sitting on a line (feet at (0, 0)). */
export function cargoArt(cargo: Cargo, size: number): Graphics {
  const g = new Graphics();
  const s = size / 60;
  if (cargo === 'apples') {
    for (const [x, y] of [[-18, -14], [18, -14], [0, -30]]) {
      g.circle(x * s, y * s, 14 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      g.moveTo(x * s, (y - 12) * s).lineTo(x * s, (y - 20) * s).stroke(line(wood.line, 3));
    }
  } else if (cargo === 'bag') {
    g.roundRect(-24 * s, -40 * s, 48 * s, 40 * s, 10 * s).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
    g.moveTo(-14 * s, -40 * s).quadraticCurveTo(0, -62 * s, 14 * s, -40 * s).stroke(line(swatch.blue.line, 4));
    g.circle(0, -22 * s, 7 * s).fill(cream);
  } else if (cargo === 'fish') {
    g.moveTo(-26 * s, -18 * s).quadraticCurveTo(0, -42 * s, 22 * s, -18 * s).quadraticCurveTo(0, 6 * s, -26 * s, -18 * s).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
    g.moveTo(22 * s, -18 * s).lineTo(34 * s, -30 * s).lineTo(34 * s, -6 * s).closePath().fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
    g.circle(-14 * s, -22 * s, 3 * s).fill(ink);
  } else {
    g.roundRect(-20 * s, -36 * s, 40 * s, 36 * s, 8 * s).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
    g.roundRect(-24 * s, -42 * s, 48 * s, 10 * s, 4 * s).fill(wood.light).stroke(line(wood.line, 3));
    g.ellipse(0, -14 * s, 14 * s, 8 * s).fill(cream);
  }
  return g;
}

/** An open socket: a dashed ring on a wooden plate; a closed one is a plain painted board. */
export function socketArt(open: boolean, lit = false): Graphics {
  const g = new Graphics();
  const r = SOCKET / 2;
  if (!open) {
    g.roundRect(-r * 0.7, -r * 0.5, r * 1.4, r, 10).fill(wood.light).stroke(line(wood.line, 4));
    return g;
  }
  g.circle(0, 0, r).fill({ color: lit ? 0xfff0b0 : cream, alpha: 0.95 }).stroke(line(lit ? swatch.yellow.line : wood.line, 4));
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + Math.PI / n;
    g.arc(0, 0, r - 12, a0, a1).stroke(line(lit ? swatch.yellow.line : wood.line, 3));
  }
  g.circle(0, 0, 6).fill(wood.line);
  return g;
}

// ——— The parts, each fitting a `size` square centred on (0, 0) ———

export function partArt(id: PartId, size = 100): Graphics {
  const g = new Graphics();
  const s = size / 100;
  switch (id) {
    case 'wheels':
      for (const x of [-22, 22]) {
        g.circle(x * s, 4 * s, 26 * s).fill(WHEEL.fill).stroke(line(WHEEL.line, 5 * s));
        g.circle(x * s, 4 * s, 9 * s).fill(WHEEL.hub).stroke(line(WHEEL.line, 3 * s));
      }
      g.moveTo(-22 * s, 4 * s).lineTo(22 * s, 4 * s).stroke(line(ink, 6 * s));
      break;
    case 'float':
      g.circle(0, 0, 36 * s).fill(FLOAT.fill).stroke(line(FLOAT.line, 5 * s));
      g.circle(0, 0, 16 * s).fill(cream).stroke(line(FLOAT.line, 4 * s));
      for (const a of [0.4, 2.0, 3.6, 5.2]) g.moveTo(Math.cos(a) * 18 * s, Math.sin(a) * 18 * s).lineTo(Math.cos(a) * 34 * s, Math.sin(a) * 34 * s).stroke(line(FLOAT.stripe, 6 * s));
      break;
    case 'umbrella':
      g.moveTo(-40 * s, 0).arc(0, 0, 40 * s, Math.PI, 0).closePath().fill(UMBRELLA.fill).stroke(line(UMBRELLA.line, 5 * s));
      for (const x of [-20, 0, 20]) g.moveTo(x * s, 0).lineTo(x * s, -8 * s).stroke(line(UMBRELLA.line, 3 * s));
      g.moveTo(0, 0).lineTo(0, 30 * s).arc(8 * s, 30 * s, 8 * s, Math.PI, 0, true).stroke(line(UMBRELLA.handle, 5 * s));
      break;
    case 'lantern':
      g.moveTo(0, -40 * s).lineTo(0, -28 * s).stroke(line(ink, 4 * s));
      g.circle(0, -42 * s, 6 * s).stroke(line(ink, 4 * s));
      g.roundRect(-18 * s, -28 * s, 36 * s, 8 * s, 3 * s).fill(LANTERN.line);
      g.roundRect(-22 * s, -20 * s, 44 * s, 44 * s, 8 * s).fill(LANTERN.glow).stroke(line(LANTERN.line, 5 * s));
      g.circle(0, 2 * s, 11 * s).fill(swatch.yellow.fill);
      g.roundRect(-18 * s, 24 * s, 36 * s, 8 * s, 3 * s).fill(LANTERN.line);
      break;
    case 'flag':
      g.moveTo(-14 * s, -40 * s).lineTo(-14 * s, 40 * s).stroke(line(FLAG.pole, 6 * s));
      g.moveTo(-12 * s, -38 * s).lineTo(36 * s, -22 * s).lineTo(-12 * s, -6 * s).closePath().fill(FLAG.fill).stroke(line(FLAG.line, 4 * s));
      break;
  }
  return g;
}

/** A part sitting in its socket on a board: parts drawn a little smaller than the socket. */
export function partInSocket(id: PartId): Graphics {
  return partArt(id, SOCKET * 0.86);
}

// ——— Path tiles ———

/** One condition's picture on a `size` square tile centred on (0, 0). */
export function conditionTile(c: Condition, size = 96, shaking = false): Graphics {
  const g = new Graphics();
  const s = size / 96;
  const dark = c === 'dark';
  g.roundRect(-size / 2 + 4, -size / 2 + 6, size, size, 16 * s).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-size / 2, -size / 2, size, size, 16 * s).fill(dark ? NIGHT.fill : cream).stroke(line(shaking ? swatch.red.line : dark ? NIGHT.line : ROAD.line, 4 * s));
  // The road along the bottom.
  g.roundRect(-size / 2 + 10 * s, 18 * s, size - 20 * s, 18 * s, 6 * s).fill(dark ? 0x4a5080 : ROAD.fill);
  if (c === 'bump') {
    g.moveTo(-26 * s, 20 * s).quadraticCurveTo(0, -26 * s, 26 * s, 20 * s).fill(wood.fill).stroke(line(wood.line, 4 * s));
  } else if (c === 'puddle') {
    g.ellipse(0, 26 * s, 32 * s, 12 * s).fill(FLOAT.fill).stroke(line(FLOAT.line, 3 * s));
    g.ellipse(-6 * s, 24 * s, 10 * s, 3 * s).fill(0xffffff);
  } else if (c === 'rain') {
    g.ellipse(0, -18 * s, 28 * s, 14 * s).fill(0xd6dbe6).stroke(line(0x8a93a6, 3 * s));
    g.circle(-12 * s, -24 * s, 12 * s).fill(0xd6dbe6).stroke(line(0x8a93a6, 3 * s));
    g.circle(10 * s, -26 * s, 14 * s).fill(0xd6dbe6).stroke(line(0x8a93a6, 3 * s));
    g.ellipse(0, -18 * s, 26 * s, 12 * s).fill(0xd6dbe6);
    for (const x of [-18, -6, 6, 18]) g.moveTo(x * s, -2 * s).lineTo((x - 4) * s, 12 * s).stroke(line(FLOAT.line, 4 * s));
  } else if (c === 'dark') {
    g.moveTo(10 * s, -30 * s).arc(4 * s, -18 * s, 14 * s, -1.2, 1.9).arc(10 * s, -18 * s, 11 * s, 1.6, -1.4, true).fill(NIGHT.star);
    for (const [x, y] of [[-28, -30], [-16, -8], [-32, -2], [30, 0]]) g.star(x * s, y * s, 4, 4 * s, 2 * s).fill(NIGHT.star);
  } else {
    // Smooth: a little sun and a clear road.
    g.circle(-24 * s, -24 * s, 12 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3 * s));
  }
  return g;
}

// ——— The neighbor's request card ———

/** A frozen critter, about `height` tall, feet at (0, 0). */
export function standingCritter(n: Neighbor, height: number): Critter {
  const c = new Critter(CRITTERS[n.critter]);
  c.alive = false;
  c.scale.set(height / 250);
  c.eventMode = 'none';
  return c;
}

/** The card: the neighbor, its cargo, and the pictured conditions it must pass. */
export function requestArt(n: Neighbor, path: readonly Condition[], w: number, h: number): Container & { critter: Critter } {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2 + 5, -h / 2 + 7, w, h, 22).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-w / 2, -h / 2, w, h, 22).fill(cream).stroke(line(wood.line, 5));
  c.addChild(g);
  const wide = w > h * 1.6;
  const critterH = Math.min(h - 30, wide ? h - 24 : h * 0.55);
  const critter = standingCritter(n, critterH);
  critter.position.set(wide ? -w / 2 + critterH * 0.45 + 16 : 0, wide ? h / 2 - 12 : -h / 2 + critterH + 10);
  c.addChild(critter);
  const cargo = cargoArt(n.cargo, critterH * 0.26);
  cargo.position.set(critter.x + critterH * 0.42, critter.y - critterH * 0.42);
  c.addChild(cargo);
  const shown = path.filter((p) => p !== 'smooth');
  const tile = Math.min(64, wide ? h - 40 : (w - 24) / Math.max(1, shown.length) - 12);
  const totalW = shown.length * tile + (shown.length - 1) * 10;
  const x0 = wide ? critter.x + critterH * 0.6 + 20 + (w / 2 - (critter.x + critterH * 0.6 + 20) - totalW) / 2 : -totalW / 2;
  const y = wide ? 0 : h / 2 - tile / 2 - 14;
  shown.forEach((cond, i) => {
    const t = conditionTile(cond, tile);
    t.position.set(x0 + tile / 2 + i * (tile + 10), y);
    c.addChild(t);
  });
  c.eventMode = 'none';
  return Object.assign(c, { critter });
}

/** A board (level 1 gadget or the bench's cart): a wooden plate. */
export function boardArt(w: number, h: number, lit = false): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, 26).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-w / 2, -h / 2, w, h, 26).fill(lit ? 0xfff0b0 : wood.light).stroke(line(lit ? swatch.yellow.line : wood.line, lit ? 8 : 5));
  for (let y = -h / 2 + 30; y < h / 2 - 20; y += 34) g.moveTo(-w / 2 + 18, y).lineTo(w / 2 - 18, y).stroke({ width: 2, color: wood.line, alpha: 0.25 });
  return g;
}

/** A gadget drawn on a board of (w, h): the cart in the middle and each socket with its part. */
export function gadgetArt(g: Gadget, open: readonly Socket[], w: number, h: number, cargo: Cargo | null): Container {
  const c = new Container();
  const cart = cartArt(Math.min(w * 0.7, 260), cargo);
  cart.position.set(-w * 0.08, h * 0.06);
  c.addChild(cart);
  for (const s of SOCKETS) {
    const p = socketAt(s, w, h);
    const sock = socketArt(open.includes(s));
    sock.position.set(p.x, p.y);
    c.addChild(sock);
    const part = g[s];
    if (part) {
      const art = partInSocket(part);
      art.position.set(p.x, p.y);
      c.addChild(art);
    }
  }
  c.eventMode = 'none';
  return c;
}

/** A small cart with its parts for the run along the path and the version strip; about `size` wide. */
export function miniCart(g: Gadget, size: number, cargo: Cargo | null): Container {
  const c = new Container();
  const w = size;
  const h = size * 0.7;
  const cart = cartArt(w * 0.9, cargo);
  c.addChild(cart);
  for (const s of SOCKETS) {
    const part = g[s];
    if (!part) continue;
    const p = socketAt(s, w, h);
    const art = partArt(part, size * 0.38);
    art.position.set(p.x * 0.8, p.y * 0.9);
    c.addChild(art);
  }
  c.eventMode = 'none';
  return c;
}

/** A version-strip picture: the cart with a tick, or a cross over the failing condition's picture. */
export function stripPicture(g: Gadget, failedAt: Condition | null, size: number): Container {
  const c = new Container();
  const bg = new Graphics().roundRect(-size / 2, -size / 2, size, size, 8).fill({ color: cream, alpha: 0.9 }).stroke(line(wood.line, 2));
  c.addChild(bg);
  if (failedAt) {
    const t = conditionTile(failedAt, size * 0.8);
    c.addChild(t);
    const x = crossIcon(swatch.red.line);
    x.scale.set(size / 110);
    c.addChild(x);
  } else {
    const m = miniCart(g, size * 0.8, null);
    m.position.set(0, 2);
    c.addChild(m);
    const tick = checkIcon(swatch.green.line);
    tick.scale.set(size / 120);
    tick.position.set(size * 0.28, -size * 0.28);
    c.addChild(tick);
  }
  c.eventMode = 'none';
  return c;
}

/** An open hand, for Give. */
export function handArt(color = 0xffffff): Graphics {
  const g = new Graphics();
  g.roundRect(-22, -6, 44, 36, 12).fill(color);
  for (const [x, h] of [[-16, 30], [-5, 38], [6, 36], [17, 28]]) g.roundRect(x - 5, -6 - h, 10, h + 12, 5).fill(color);
  g.roundRect(-34, 4, 18, 10, 5).fill(color);
  return g;
}

/** A Try arrow: a small cart rolling right. */
export function tryArt(color = 0xffffff): Graphics {
  const g = new Graphics();
  g.roundRect(-26, -16, 40, 22, 6).fill(color);
  g.circle(-14, 12, 7).fill(color);
  g.circle(6, 12, 7).fill(color);
  g.moveTo(18, -4).lineTo(34, -4).lineTo(28, -12).moveTo(34, -4).lineTo(28, 4).stroke(line(color, 5));
  return g;
}

// ——— Hub icon and sticker ———

/** The hub icon: a cart with a lantern at the front. Feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const cart = cartArt(150, 'apples');
  cart.position.set(0, -40);
  const lamp = partArt('lantern', 60);
  lamp.position.set(56, -64);
  c.addChild(cart, lamp);
  return c;
}

/** A seeded sticker: a cart with one working part in place and a tick. */
export function stickerArt(part: PartId, cargo: Cargo): Container {
  const c = new Container();
  const cart = cartArt(150, cargo);
  cart.position.set(0, -30);
  const s = need(cargoFree(part))?.socket ?? 'top';
  const p = socketAt(s, 170, 110);
  const art = partArt(part, 64);
  art.position.set(p.x, p.y - 30);
  const tick = new Graphics().circle(0, 0, 22).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
  tick.addChild(checkIcon());
  tick.position.set(66, -86);
  c.addChild(cart, art, tick);
  return c;
}

/** The condition a working part fixes (the flag never appears on a sticker). */
function cargoFree(part: PartId): Condition {
  return part === 'wheels' ? 'bump' : part === 'float' ? 'puddle' : part === 'umbrella' ? 'rain' : 'dark';
}
