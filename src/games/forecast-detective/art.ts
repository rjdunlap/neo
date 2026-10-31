import { Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import type { Answer, ClueId, Layout, Side, Sky, Temp, Weather } from './logic';

const SEA = swatch.blue, HILL = swatch.green;
const STONE = 0xc9bfb3, STONE_LINE = 0x8a7b6c;

/** A sun disc with rays. */
function sun(g: Graphics, x: number, y: number, r: number) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.moveTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25).lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6)
      .stroke({ width: Math.max(3, r * 0.16), color: swatch.orange.fill, cap: 'round' });
  }
  g.circle(x, y, r).fill(swatch.yellow.fill).stroke({ width: Math.max(2, r * 0.1), color: swatch.orange.line });
}

/** Cloud puffs; `dark` for a rain or snow cloud. */
function cloud(g: Graphics, x: number, y: number, s: number, dark = false) {
  const fill = dark ? 0xc9d2e0 : 0xffffff, line = dark ? 0x7f8aa0 : 0xa9b7c9;
  for (const [dx, dy, r] of [[-0.5, 0.1, 0.32], [-0.12, -0.18, 0.42], [0.36, -0.02, 0.36], [0.1, 0.16, 0.34]] as const) {
    g.circle(x + dx * s, y + dy * s, r * s).fill(fill).stroke({ width: Math.max(2, s * 0.04), color: line });
  }
  for (const [dx, dy, r] of [[-0.5, 0.1, 0.32], [-0.12, -0.18, 0.42], [0.36, -0.02, 0.36], [0.1, 0.16, 0.34]] as const) g.circle(x + dx * s, y + dy * s, r * s - 2).fill(fill);
}

/** A six-point flake. */
function flake(g: Graphics, x: number, y: number, r: number) {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r).stroke({ width: Math.max(2, r * 0.28), color: 0x5aa0e6, cap: 'round' });
  }
}

/** The weather (or today's sky) in a box of about `s`, differing by shape as well as colour. */
export function weatherArt(w: Weather | Sky, s: number): Graphics {
  const g = new Graphics();
  if (w === 'sunny' || w === 'sun') sun(g, 0, 0, s * 0.26);
  else if (w === 'cloudy' || w === 'cloud') cloud(g, 0, 0, s * 0.62);
  else {
    cloud(g, 0, -s * 0.14, s * 0.56, true);
    if (w === 'snowy') for (const [dx, dy] of [[-0.26, 0.28], [0.04, 0.36], [0.28, 0.24]]) flake(g, dx * s, dy * s, s * 0.08);
    else for (const dx of [-0.24, -0.04, 0.16, 0.32]) g.moveTo(dx * s, s * 0.16).lineTo(dx * s - s * 0.06, s * 0.36).stroke({ width: Math.max(3, s * 0.05), color: SEA.fill, cap: 'round' });
  }
  return g;
}

function questionMark(g: Graphics, x: number, y: number, s: number, color = ink) {
  g.moveTo(x - s * 0.28, y - s * 0.3).bezierCurveTo(x - s * 0.28, y - s * 0.62, x + s * 0.3, y - s * 0.62, x + s * 0.3, y - s * 0.3)
    .bezierCurveTo(x + s * 0.3, y - s * 0.08, x, y - s * 0.06, x, y + s * 0.16).stroke({ width: s * 0.16, color, cap: 'round' });
  g.circle(x, y + s * 0.42, s * 0.1).fill(color);
}

/** Can't tell yet: two clouds with a question mark. */
function cantTellArt(s: number): Graphics {
  const g = new Graphics();
  cloud(g, -s * 0.18, -s * 0.06, s * 0.4);
  cloud(g, s * 0.2, s * 0.1, s * 0.4, true);
  questionMark(g, 0, -s * 0.02, s * 0.36, swatch.purple.line);
  return g;
}

// ---- the scene ----

function hillIsle(g: Graphics, x: number, y: number) {
  g.ellipse(x, y + 46, 120, 30).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
  g.poly([x - 100, y + 40, x - 40, y - 40, x + 10, y + 40]).fill(HILL.fill).stroke({ width: 4, color: HILL.line });
  g.poly([x - 30, y + 40, x + 30, y - 16, x + 96, y + 40]).fill(HILL.light).stroke({ width: 4, color: HILL.line });
}

function lighthouseIsle(g: Graphics, x: number, y: number) {
  g.ellipse(x, y + 46, 120, 30).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
  g.poly([x - 20, y + 40, x - 12, y - 50, x + 12, y - 50, x + 20, y + 40]).fill(0xffffff).stroke({ width: 4, color: swatch.red.line });
  for (const t of [-0.6, -0.1, 0.4]) g.rect(x - 17 + t * -2, y + t * 60 - 6, 34, 14).fill(swatch.red.fill);
  g.roundRect(x - 16, y - 70, 32, 22, 6).fill(swatch.yellow.fill).stroke({ width: 3, color: ink });
  g.poly([x - 20, y - 70, x, y - 90, x + 20, y - 70]).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
}

/** The sea, both islands, and the harbour town with its tower (the vane stands on it) and its wall (the thermometer hangs there). */
export function sceneArt(l: Layout): Graphics {
  const g = new Graphics();
  const s = l.scene;
  const top = s.y - s.h / 2, bottom = s.y + s.h / 2;
  const seaTop = top + s.h * 0.3;
  g.rect(0, seaTop, s.w, bottom - seaTop).fill(SEA.light);
  for (let x = 40; x < s.w; x += 120) for (const dy of [0.45, 0.75]) {
    const y = top + s.h * dy;
    g.moveTo(x - 20, y).quadraticCurveTo(x, y - 10, x + 20, y).stroke({ width: 3, color: SEA.fill });
  }
  hillIsle(g, l.hill.x, l.hill.y);
  lighthouseIsle(g, l.lighthouse.x, l.lighthouse.y);
  // The town: a quay, three houses and a tower.
  const t = l.town;
  g.roundRect(t.x - 190, t.y + 30, 380, 40, 10).fill(STONE).stroke({ width: 3, color: STONE_LINE });
  const colours = [swatch.orange, swatch.pink, swatch.yellow];
  [-140, -80, 80].forEach((dx, i) => {
    const c = colours[i];
    g.rect(t.x + dx - 26, t.y - 20, 52, 50).fill(c.light).stroke({ width: 3, color: c.line });
    g.poly([t.x + dx - 32, t.y - 20, t.x + dx, t.y - 50, t.x + dx + 32, t.y - 20]).fill(c.fill).stroke({ width: 3, color: c.line });
    g.rect(t.x + dx - 8, t.y + 6, 16, 24).fill(wood.fill);
  });
  // The tower.
  g.rect(t.x - 24, t.y - 70, 48, 100).fill(cream).stroke({ width: 3, color: STONE_LINE });
  g.poly([t.x - 30, t.y - 70, t.x, t.y - 96, t.x + 30, t.y - 70]).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
  g.moveTo(t.x, t.y - 96).lineTo(t.x, t.y - 120).stroke({ width: 4, color: ink });
  // The thermometer's board on the wall, right of the tower.
  g.roundRect(t.x + 130, t.y - 30, 44, 60, 8).fill(wood.light).stroke({ width: 3, color: wood.line });
  return g;
}

/** The vane on the tower: the arrow points into the wind, toward the island it blows from; null side for still. */
export function vaneArt(side: Side | null): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 5).fill(ink);
  if (side === null) {
    g.moveTo(-26, 0).lineTo(26, 0).stroke({ width: 5, color: ink, cap: 'round' });
    return g;
  }
  const d = side === 'west' ? -1 : 1;
  g.moveTo(-30 * d, 0).lineTo(30 * d, 0).stroke({ width: 5, color: ink, cap: 'round' });
  g.poly([30 * d, 0, 16 * d, -10, 16 * d, 10]).fill(ink);
  g.poly([-30 * d, 0, -40 * d, -14, -22 * d, -4]).fill(swatch.red.fill);
  g.poly([-30 * d, 0, -40 * d, 14, -22 * d, 4]).fill(swatch.red.fill);
  return g;
}

/** Wind streaks from the upwind island across the sea to the town. */
export function streaksArt(l: Layout, side: Side): Graphics {
  const g = new Graphics();
  const from = side === 'west' ? l.hill : l.lighthouse, to = l.town;
  const d = Math.sign(to.x - from.x);
  for (const [dy, len] of [[-30, 0.5], [10, 0.62], [44, 0.44]] as const) {
    const x0 = from.x + d * 100, x1 = x0 + (to.x - x0) * len;
    const y = (from.y + to.y) / 2 + dy;
    g.moveTo(x0, y).quadraticCurveTo((x0 + x1) / 2, y - 14, x1, y).stroke({ width: 5, color: 0xffffff, cap: 'round', alpha: 0.9 });
    g.poly([x1, y, x1 - d * 12, y - 8, x1 - d * 12, y + 8]).fill({ color: 0xffffff, alpha: 0.9 });
  }
  return g;
}

/** The thermometer: a column at the bottom with a snowflake (freezing) or well up with a sun (warm); null for unread. */
export function thermoArt(temp: Temp | null, s: number): Graphics {
  const g = new Graphics();
  const h = s, tw = s * 0.22;
  g.roundRect(-tw / 2, -h / 2, tw, h * 0.82, tw / 2).fill(0xffffff).stroke({ width: Math.max(2, s * 0.04), color: ink });
  const bulbY = h / 2 - tw * 0.7;
  const col = temp === 'warm' ? swatch.red.fill : temp === 'freezing' ? 0x5aa0e6 : 0xbfc6d0;
  g.circle(0, bulbY, tw * 0.75).fill(col).stroke({ width: Math.max(2, s * 0.04), color: ink });
  const level = temp === 'warm' ? 0.72 : temp === 'freezing' ? 0.12 : 0;
  if (level > 0) g.roundRect(-tw * 0.22, bulbY - h * 0.8 * level - tw * 0.3, tw * 0.44, h * 0.8 * level + tw * 0.3, tw * 0.2).fill(col);
  // The freezing line.
  g.moveTo(-tw * 0.9, bulbY - h * 0.2).lineTo(tw * 0.9, bulbY - h * 0.2).stroke({ width: Math.max(2, s * 0.03), color: 0x5aa0e6 });
  if (temp === 'freezing') flake(g, tw * 1.6, bulbY - h * 0.1, s * 0.13);
  if (temp === 'warm') sun(g, tw * 1.7, -h * 0.25, s * 0.1);
  return g;
}

function postcardFrame(g: Graphics, s: number) {
  g.roundRect(-s * 0.4, -s * 0.32, s * 0.8, s * 0.64, 8).fill(0xffffff).stroke({ width: 3, color: STONE_LINE });
}

/** A postcard of one island under its sky, or null sky for the cover. */
function postcardArt(side: Side, sky: Sky | null, s: number): Container {
  const c = new Container();
  const g = new Graphics();
  postcardFrame(g, s);
  g.rect(-s * 0.36, s * 0.04, s * 0.72, s * 0.24).fill(SEA.light);
  c.addChild(g);
  const isle = new Graphics();
  if (side === 'west') hillIsle(isle, 0, 0); else lighthouseIsle(isle, 0, 0);
  isle.scale.set(s * 0.0024);
  isle.position.set(0, s * 0.1);
  c.addChild(isle);
  if (sky) {
    const w = weatherArt(sky, s * 0.42);
    w.position.set(s * 0.14, -s * 0.14);
    c.addChild(w);
  }
  return c;
}

/** A flap's cover picture, so no reading is needed. */
function coverPicture(clue: ClueId, s: number): Container {
  if (clue === 'wind') {
    const c = new Container();
    const g = new Graphics();
    g.moveTo(0, s * 0.3).lineTo(0, -s * 0.06).stroke({ width: 4, color: ink });
    c.addChild(g);
    const v = vaneArt(null); v.scale.set(s / 110); v.y = -s * 0.1;
    const n = new Graphics();
    for (const [dx, dy, ch] of [[0, -0.34, 'N'], [0.3, -0.1, 'E'], [-0.3, -0.1, 'W']] as const) {
      void ch;
      n.circle(dx * s, dy * s, s * 0.03).fill(STONE_LINE);
    }
    c.addChild(v, n);
    return c;
  }
  if (clue === 'temp') return thermoArt(null, s * 0.66);
  return postcardArt(clue, null, s);
}

export interface Flap { node: Container; cover: Graphics; picture: Container; inside: Container }

/** A clue flap: a coloured cover over the inside. */
export function flapArt(clue: ClueId, s: number): Flap {
  const node = new Container();
  const inside = new Container();
  const back = new Graphics().roundRect(-s / 2, -s / 2, s, s, 20).fill(0xffffff).stroke({ width: 4, color: wood.line });
  inside.addChild(back);
  const cover = new Graphics();
  paintCover(cover, s, false);
  const picture = coverPicture(clue, s * 0.8);
  picture.y = 4;
  node.addChild(inside, cover, picture);
  return { node, cover, picture, inside };
}

export function paintCover(g: Graphics, s: number, missing: boolean) {
  g.clear().roundRect(-s / 2, -s / 2, s, s, 20).fill(missing ? 0xe4e0ea : wood.light).stroke({ width: 4, color: wood.line });
  g.circle(0, -s / 2 + 12, 6).fill(swatch.red.fill);
}

/** What a flap shows once lifted. */
export function clueInside(clue: ClueId, value: Side | Sky | Temp, s: number): Container {
  if (clue === 'wind') {
    const c = new Container();
    const v = vaneArt(value as Side); v.scale.set(s / 90);
    const g = new Graphics();
    // A small island at the end the arrow points to.
    const d = value === 'west' ? -1 : 1;
    if (value === 'west') hillIsle(g, 0, 0); else lighthouseIsle(g, 0, 0);
    g.scale.set(s * 0.0016);
    g.position.set(d * s * 0.26, s * 0.22);
    c.addChild(g, v);
    return c;
  }
  if (clue === 'temp') return thermoArt(value as Temp, s * 0.78);
  return postcardArt(clue, value as Sky, s);
}

/** The flap that never arrived: a little boat and a question mark. */
export function missingArt(s: number): Graphics {
  const g = new Graphics();
  g.moveTo(-s * 0.34, s * 0.22).quadraticCurveTo(0, s * 0.3, s * 0.34, s * 0.22).stroke({ width: 4, color: SEA.fill });
  g.poly([-s * 0.24, s * 0.08, s * 0.24, s * 0.08, s * 0.16, s * 0.2, -s * 0.16, s * 0.2]).fill(wood.fill).stroke({ width: 3, color: wood.line });
  g.moveTo(0, s * 0.08).lineTo(0, -s * 0.12).stroke({ width: 3, color: ink });
  g.poly([0, -s * 0.12, s * 0.14, s * 0.02, 0, s * 0.02]).fill(0xffffff).stroke({ width: 2, color: ink });
  questionMark(g, 0, -s * 0.28, s * 0.28, swatch.purple.line);
  return g;
}

/** The rule card: wind carrying a cloud, and a snowflake over a thermometer. */
export function ruleArt(s: number): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-s / 2, -s / 2, s, s, 18).fill(cream).stroke({ width: 4, color: swatch.purple.line });
  cloud(g, s * 0.1, -s * 0.2, s * 0.3);
  for (const dy of [-0.26, -0.14]) g.moveTo(-s * 0.4, dy * s).lineTo(-s * 0.16, dy * s).stroke({ width: 3, color: 0x7f8aa0, cap: 'round' });
  c.addChild(g);
  const t = thermoArt('freezing', s * 0.44); t.position.set(-s * 0.12, s * 0.2);
  c.addChild(t);
  return c;
}

/** An answer card: a weather picture, or Can't tell yet's two clouds and a question mark. */
export function cardArt(a: Answer, w: number, h: number): { node: Container; back: Graphics; cross: Graphics } {
  const node = new Container();
  const back = new Graphics();
  paintCard(back, w, h, false);
  const pic = a === 'cant-tell' ? cantTellArt(w * 0.9) : weatherArt(a, w * 0.82);
  pic.y = -h * 0.04;
  const cross = new Graphics();
  cross.moveTo(-w * 0.34, -h * 0.34).lineTo(w * 0.34, h * 0.34).moveTo(w * 0.34, -h * 0.34).lineTo(-w * 0.34, h * 0.34)
    .stroke({ width: 10, color: swatch.red.line, cap: 'round', alpha: 0.75 });
  cross.visible = false;
  node.addChild(back, pic, cross);
  return { node, back, cross };
}

export function paintCard(g: Graphics, w: number, h: number, selected: boolean) {
  g.clear().roundRect(-w / 2, -h / 2, w, h, 22).fill(selected ? 0xfff3c4 : 0xffffff)
    .stroke({ width: selected ? 8 : 4, color: selected ? swatch.orange.line : 0xa9b7c9 });
}

/** The green Check button with a tick; dimmed until a card is chosen. */
export function checkArt(s: number): { node: Container; face: Graphics } {
  const node = new Container();
  const face = new Graphics();
  paintCheck(face, s, false);
  node.addChild(face);
  return { node, face };
}

export function paintCheck(g: Graphics, s: number, active: boolean) {
  const c = swatch.green;
  g.clear().circle(0, 0, s / 2).fill(active ? c.fill : 0xd3d8cf).stroke({ width: 5, color: active ? c.line : 0xa4ab9e });
  g.moveTo(-s * 0.2, 0).lineTo(-s * 0.05, s * 0.16).lineTo(s * 0.22, -s * 0.16).stroke({ width: 10, color: 0xffffff, cap: 'round', join: 'round' });
}

/** Night over the scene, with a moon. */
export function nightArt(l: Layout, view: { w: number; h: number }): Container {
  const c = new Container();
  const g = new Graphics().rect(0, 0, view.w, view.h).fill({ color: shadow, alpha: 0.62 });
  g.circle(view.w * 0.7, l.scene.y - l.scene.h * 0.3, 34).fill(0xfff6c8);
  g.circle(view.w * 0.7 + 14, l.scene.y - l.scene.h * 0.3 - 8, 30).fill({ color: shadow, alpha: 0.9 });
  for (const [fx, fy] of [[0.2, 0.3], [0.4, 0.2], [0.55, 0.35], [0.85, 0.25], [0.3, 0.45]]) g.circle(view.w * fx, l.scene.y - l.scene.h * 0.5 + l.scene.h * fy, 3).fill(0xffffff);
  c.addChild(g);
  return c;
}

/** The hub icon: a magnifying glass over a small cloud with a wind streak. */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const dy of [-30, 10]) g.moveTo(-130, dy).quadraticCurveTo(-90, dy - 14, -50, dy).stroke({ width: 8, color: 0x7f8aa0, cap: 'round' });
  cloud(g, 10, -10, 150);
  g.circle(30, 10, 70).fill({ color: 0xdff0ff, alpha: 0.5 }).stroke({ width: 14, color: ink });
  g.moveTo(80, 60).lineTo(140, 120).stroke({ width: 22, color: wood.line, cap: 'round' });
  c.addChild(g);
  return c;
}

/** The sticker: the harbour town under a seeded weather, with the vane. */
export function stickerArt(w: Weather): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-130, -130, 260, 260, 30).fill(0xdff0ff).stroke({ width: 5, color: swatch.blue.line });
  g.rect(-126, 40, 252, 86).fill(SEA.light);
  for (const [dx, col] of [[-60, swatch.orange], [0, swatch.pink], [60, swatch.yellow]] as const) {
    g.rect(dx - 24, 0, 48, 44).fill(col.light).stroke({ width: 3, color: col.line });
    g.poly([dx - 30, 0, dx, -28, dx + 30, 0]).fill(col.fill).stroke({ width: 3, color: col.line });
  }
  g.moveTo(0, -28).lineTo(0, -50).stroke({ width: 4, color: ink });
  c.addChild(g);
  const v = vaneArt('west'); v.scale.set(0.8); v.y = -52;
  const sky = weatherArt(w, 120); sky.position.set(40, -86);
  c.addChild(v, sky);
  return c;
}
