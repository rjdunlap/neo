import { Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { SpotBox, Stone, StreamLayout } from './logic';

const WATER = 0x7bc7e8;
const WATER_EDGE = 0x4ca3cc;
const WATER_FOAM = 0xdff5ff;
const BANK_GRASS = 0x9cd67d;
const BANK_EDGE = 0x5ea145;
const PET_STONE = { fill: 0x9a93b0, light: 0xc9c3dc, line: 0x6f6888 };

/** Draws a 5-point star centered on (0, 0). */
function drawStar(g: Graphics, r: number, color: number): Graphics {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  return g.poly(pts).fill(color);
}

/** Draws a simple 3-toe paw mark centered on (0, 0). */
function drawPaw(g: Graphics, s: number, color: number): Graphics {
  g.ellipse(0, s * 0.18, s * 0.34, s * 0.28).fill(color);
  for (const [dx, dy] of [
    [-0.36, -0.22],
    [0, -0.34],
    [0.36, -0.22],
  ]) {
    g.circle(s * dx, s * dy, s * 0.14).fill(color);
  }
  return g;
}

/** Draws a small far-bank lantern badge beside spot `T`. */
export function farLantern(lit = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-3, -24, 6, 30, 3).fill(wood.line);
  g.roundRect(-12, -28, 24, 6, 3).fill(wood.fill);
  if (lit) {
    g.circle(0, -10, 22).fill({ color: swatch.yellow.light, alpha: 0.75 });
  }
  g.roundRect(-10, -22, 20, 22, 6)
    .fill(lit ? swatch.yellow.fill : swatch.yellow.light)
    .stroke({ width: 3, color: swatch.orange.line });
  g.circle(0, -11, 5).fill(cream);
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** Draws the stream ribbon, S-path stepping-stone path, and bank shores behind the spots. */
export function streamBed(
  L: StreamLayout,
  target: number,
  litFarBank = false,
  /** Spot that carries the lantern (the safe stone before the whirlpool at level 5); the far bank by default. */
  lanternSpot = target,
): Container {
  const c = new Container();
  const { board, spots } = L;
  const g = new Graphics();

  // Wide winding river band behind the grid
  const padX = 56;
  const padY = 40;
  g.roundRect(board.x - padX, board.y - padY, board.w + padX * 2, board.h + padY * 2, 48)
    .fill({ color: BANK_GRASS, alpha: 0.88 })
    .stroke({ width: 5, color: BANK_EDGE, alpha: 0.5 });

  g.roundRect(board.x - 28, board.y - 18, board.w + 56, board.h + 36, 36)
    .fill(WATER)
    .stroke({ width: 5, color: WATER_EDGE });

  // S-path water channel connecting spots 1 -> 2 -> ... -> T
  if (spots.length > 1) {
    g.moveTo(spots[0].x, spots[0].y);
    for (let i = 1; i < spots.length; i++) g.lineTo(spots[i].x, spots[i].y);
    g.stroke({ width: 42, color: WATER_FOAM, alpha: 0.45, cap: 'round', join: 'round' });

    // Subtle directional dots between consecutive spots
    for (let i = 0; i < spots.length - 1; i++) {
      const a = spots[i];
      const b = spots[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      g.circle(mx, my, 5).fill({ color: WATER_EDGE, alpha: 0.45 });
    }
  }

  // Near-bank wooden footbridge edge beside spot 1
  const s1 = spots[0];
  g.roundRect(s1.x - L.spotSize * 0.66, s1.y - 34, 24, 68, 8)
    .fill(wood.fill)
    .stroke({ width: 3, color: wood.line });

  c.addChild(g);

  // Far-bank lantern beside spot T
  const last = spots[lanternSpot - 1];
  const lantern = farLantern(litFarBank);
  lantern.position.set(last.x + L.spotSize * 0.46, last.y - L.spotSize * 0.36);
  c.addChild(lantern);

  c.eventMode = 'none';
  return c;
}

/** Base stepping-stone spot ring (`1..T`), centered on (0, 0). */
export function spotBase(spot: number, isFarBank: boolean, size: number, whirlpool = false): Container {
  const c = new Container();
  const r = size * 0.43;
  const g = new Graphics();

  // Touch highlight overlay (children[0])
  const press = new Graphics().circle(0, 0, r + 4).fill({ color: ink, alpha: 0.18 });
  press.alpha = 0;
  c.addChild(press);

  // Subtle drop shadow + water ring
  g.circle(0, 4, r + 3).fill({ color: shadow, alpha: 0.14 });
  g.circle(0, 0, r)
    .fill(isFarBank ? swatch.yellow.light : cream)
    .stroke({ width: isFarBank ? 5 : 4, color: isFarBank ? swatch.orange.line : WATER_EDGE });
  g.circle(0, 0, r - 8).stroke({ width: 2, color: isFarBank ? swatch.yellow.fill : WATER_FOAM });

  if (isFarBank && whirlpool) {
    // The whirlpool: a swirl in place of the bank, ringed so it reads as no-landing.
    g.circle(0, 0, r).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
    for (const k of [0.7, 0.46, 0.24]) {
      g.arc(0, 0, r * k, k * 2, k * 2 + Math.PI * 1.5).stroke({ width: 4, color: swatch.blue.fill });
    }
    g.circle(0, 0, r + 1).stroke({ width: 3, color: swatch.red.fill, alpha: 0.8 });
  }
  const num = label(String(spot), 32, isFarBank && !whirlpool ? swatch.orange.line : ink);
  c.addChild(g, num);
  return c;
}

/** A laid stone for either `'her'` (warm coral-orange with star) or `'pet'` (slate-purple with paw), centered on (0, 0). */
export function stonePiece(
  owner: Exclude<Stone, null>,
  spot: number,
  size: number,
  isFarBank: boolean,
): Container {
  const c = new Container();
  const r = size * 0.41;
  const g = new Graphics();

  g.ellipse(0, 6, r, r * 0.88).fill({ color: shadow, alpha: 0.18 });
  if (owner === 'her') {
    g.circle(0, 0, r)
      .fill(isFarBank ? swatch.yellow.fill : swatch.orange.fill)
      .stroke({ width: 4, color: swatch.orange.line });
    g.ellipse(-r * 0.24, -r * 0.28, r * 0.32, r * 0.18).fill({
      color: isFarBank ? swatch.yellow.light : swatch.orange.light,
      alpha: 0.7,
    });
    drawStar(g, r * 0.48, cream);
  } else {
    g.circle(0, 0, r).fill(PET_STONE.fill).stroke({ width: 4, color: PET_STONE.line });
    g.ellipse(-r * 0.24, -r * 0.28, r * 0.32, r * 0.18).fill({ color: PET_STONE.light, alpha: 0.65 });
    drawPaw(g, r * 0.72, cream);
  }

  // Keep spot number legible on a small bottom badge so working backwards from T stays easy
  const badgeR = 14;
  g.circle(r * 0.62, r * 0.62, badgeR)
    .fill(cream)
    .stroke({ width: 2.5, color: owner === 'her' ? swatch.orange.line : PET_STONE.line });
  const badgeText = label(String(spot), 16, ink);
  badgeText.position.set(r * 0.62, r * 0.62);

  c.addChild(g, badgeText);
  c.eventMode = 'none';
  return c;
}

/** Hub icon: a winding mini-stream of stepping stones leading to a glowing far-bank lantern. */
export function hubIconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-84, -44, 168, 88, 34).fill(WATER).stroke({ width: 4, color: WATER_EDGE });
  const pts: [number, number][] = [
    [-54, 12],
    [-18, -14],
    [18, 12],
    [54, -14],
  ];
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke({ width: 18, color: WATER_FOAM, alpha: 0.5, cap: 'round', join: 'round' });
  c.addChild(g);

  const s1 = stonePiece('her', 1, 44, false);
  s1.position.set(pts[0][0], pts[0][1]);
  const s2 = stonePiece('pet', 2, 44, false);
  s2.position.set(pts[1][0], pts[1][1]);
  const s3 = stonePiece('her', 3, 44, false);
  s3.position.set(pts[2][0], pts[2][1]);
  const s4 = stonePiece('her', 4, 44, true);
  s4.position.set(pts[3][0], pts[3][1]);
  const l = farLantern(true);
  l.scale.set(0.7);
  l.position.set(pts[3][0] + 18, pts[3][1] - 18);
  c.addChild(s1, s2, s3, s4, l);
  c.position.set(0, -108);
  return c;
}

/** Sticker tile (`260 × 260`): a completed crossing onto the far-bank stone. */
export function stickerArt(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const g = new Graphics();
  g.roundRect(-100, -56, 200, 112, 38).fill(WATER).stroke({ width: 4, color: WATER_EDGE });
  const pts: [number, number][] = [
    [-64, 18],
    [-22, -18],
    [22, 18],
    [64, -18],
  ];
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke({ width: 22, color: WATER_FOAM, alpha: 0.55, cap: 'round', join: 'round' });
  c.addChild(g);

  const owners: ('her' | 'pet')[] =
    seed % 2 === 0 ? ['her', 'pet', 'her', 'her'] : ['pet', 'her', 'pet', 'her'];
  pts.forEach(([x, y], i) => {
    const p = stonePiece(owners[i], i + 4, 52, i === 3);
    p.position.set(x, y);
    c.addChild(p);
  });
  const l = farLantern(true);
  l.scale.set(0.85);
  l.position.set(82, -46);
  c.addChild(l);
  return c;
}

export function spotCenter(L: StreamLayout, spot: number): SpotBox {
  return L.spots[spot - 1];
}
