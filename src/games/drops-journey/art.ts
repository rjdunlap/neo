import { Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import type { Driver, Layout, Place, State } from './logic';

const SEA = swatch.blue, SNOW = swatch.white, HILL = swatch.green;

/** The land: sky, mountain with its snowy top, the hill with ground water in a soil cutaway, the river and the sea. */
export function landArt(l: Layout): Graphics {
  const g = new Graphics();
  const { land, places: p } = l;
  const left = land.x - land.w / 2, right = land.x + land.w / 2, top = land.y - land.h / 2, bottom = land.y + land.h / 2;
  // Mountain under the snow ring.
  const peak = p.snow;
  const baseY = peak.y + land.h * (l.portrait ? 0.3 : 0.36);
  g.poly([peak.x - 230, baseY, peak.x - 10, peak.y - 90, peak.x + 220, baseY]).fill(0xb7a99a).stroke({ width: 4, color: 0x8a7b6c });
  g.poly([peak.x - 72, peak.y - 10, peak.x - 10, peak.y - 90, peak.x + 66, peak.y - 14, peak.x + 30, peak.y + 4, peak.x - 6, peak.y - 16, peak.x - 34, peak.y + 2])
    .fill(SNOW.fill).stroke({ width: 3, color: SNOW.line });
  // The cold band hangs at the mountain top.
  g.roundRect(peak.x - 110, peak.y - 120, 220, 24, 12).fill({ color: 0x9fd0ff, alpha: 0.35 });
  // The hill and its soil cutaway with ground-water dots between stones.
  const gr = p.ground;
  g.ellipse(gr.x + 30, gr.y - 20, 190, 95).fill(HILL.fill).stroke({ width: 4, color: HILL.line });
  g.roundRect(gr.x - 110, gr.y - 10, 220, 92, 22).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
  for (const [dx, dy] of [[-80, 20], [-20, 50], [50, 18], [80, 58]]) g.ellipse(gr.x + dx, gr.y + dy, 16, 10).fill(0xa49384);
  for (const [dx, dy] of [[-50, 34], [10, 22], [20, 62], [-70, 62], [70, 38]]) g.circle(gr.x + dx, gr.y + dy, 5).fill(SEA.fill);
  // The sea, bottom-right.
  const sea = p.sea;
  g.roundRect(sea.x - (right - sea.x) - 120, sea.y - 46, (right - sea.x) * 2 + 240, bottom - sea.y + 90, 46).fill(SEA.light).stroke({ width: 4, color: SEA.line });
  for (let i = -2; i <= 2; i++) g.moveTo(sea.x + i * 70 - 22, sea.y + 52).quadraticCurveTo(sea.x + i * 70, sea.y + 38, sea.x + i * 70 + 22, sea.y + 52).stroke({ width: 4, color: SEA.fill });
  // The river: from just below the snow, past the river ring, into the sea.
  const r = p.river;
  const rx0 = peak.x + 40, ry0 = peak.y + 70;
  g.moveTo(rx0, ry0).bezierCurveTo(rx0 + 60, ry0 + 80, r.x - 120, r.y - 30, r.x, r.y).bezierCurveTo(r.x + 120, r.y + 30, sea.x - 160, sea.y - 40, sea.x - 60, sea.y)
    .stroke({ width: 26, color: SEA.fill, cap: 'round' });
  g.moveTo(rx0, ry0).bezierCurveTo(rx0 + 60, ry0 + 80, r.x - 120, r.y - 30, r.x, r.y).bezierCurveTo(r.x + 120, r.y + 30, sea.x - 160, sea.y - 40, sea.x - 60, sea.y)
    .stroke({ width: 10, color: SEA.light, cap: 'round' });
  // The big cloud.
  const c = p.cloud;
  for (const [dx, dy, rr] of [[-70, 10, 44], [-20, -16, 56], [44, -4, 50], [86, 16, 36], [0, 22, 44]]) g.circle(c.x + dx, c.y + dy, rr).fill(0xffffff);
  g.roundRect(c.x - 110, c.y + 10, 220, 46, 23).fill(0xffffff);
  void left; void top;
  return g;
}

export function sunArt(): Container {
  const c = new Container();
  const rays = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    rays.moveTo(Math.cos(a) * 52, Math.sin(a) * 52).lineTo(Math.cos(a) * 74, Math.sin(a) * 74).stroke({ width: 7, color: swatch.yellow.line, cap: 'round' });
  }
  rays.label = 'rays';
  c.addChild(rays, new Graphics().circle(0, 0, 44).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }));
  return c;
}

export function ringArt(): Graphics {
  return new Graphics().circle(0, 0, 62).fill({ color: 0xffffff, alpha: 0.28 }).stroke({ width: 4, color: 0xffffff, alpha: 0.7 });
}

/** The drop in one of its looks. Vapour is only a ring of dots in the drop's outline, with no fill. */
export function dropArt(look: State | 'vapour', size = 70): Container {
  const c = new Container();
  const s = size / 70;
  const outline = (g: Graphics) => g.moveTo(0, -34 * s).bezierCurveTo(14 * s, -14 * s, 28 * s, 2 * s, 28 * s, 14 * s).arc(0, 14 * s, 28 * s, 0, Math.PI).bezierCurveTo(-28 * s, 2 * s, -14 * s, -14 * s, 0, -34 * s);
  if (look === 'vapour') {
    const g = new Graphics();
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const a = t * Math.PI * 2;
      const x = Math.sin(a) * 26 * s, y = (8 - Math.cos(a) * 26) * s - (Math.cos(a) > 0.6 ? 8 * s * (Math.cos(a) - 0.6) * 4 : 0);
      g.circle(x, y, 4 * s).fill(SEA.line);
    }
    c.addChild(g);
  } else if (look === 'cloud') {
    const puff = new Graphics();
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; puff.circle(Math.cos(a) * 34 * s, Math.sin(a) * 30 * s + 6 * s, 4 * s).fill(0x9fb4c8); }
    const d = outline(new Graphics()).fill(SEA.fill).stroke({ width: 3, color: ink });
    d.scale.set(0.6); d.y = 6 * s;
    c.addChild(puff, d);
  } else if (look === 'ice') {
    const g = new Graphics();
    const pts: number[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; const rr = (i % 2 ? 22 : 36) * s; pts.push(Math.cos(a) * rr, Math.sin(a) * rr + 4 * s); }
    g.poly(pts).fill(SNOW.fill).stroke({ width: 4, color: ink });
    c.addChild(g);
  } else {
    c.addChild(outline(new Graphics()).fill(SEA.fill).stroke({ width: 4, color: ink }));
    c.addChild(new Graphics().ellipse(-10 * s, -2 * s, 5 * s, 9 * s).fill({ color: 0xffffff, alpha: 0.6 }));
  }
  if (look !== 'vapour') {
    const eyeY = (look === 'cloud' ? 14 : 12) * s, gap = (look === 'cloud' ? 6 : 9) * s;
    c.addChild(new Graphics().circle(-gap, eyeY, 4 * s).circle(gap, eyeY, 4 * s).fill(ink));
  }
  return c;
}

/** A small picture of a place, for cards and the postcard strip (size is its width). */
export function placeIcon(place: Place | 'stay', size: number): Graphics {
  const g = new Graphics();
  const s = size / 100;
  switch (place) {
    case 'sea':
      g.roundRect(-46 * s, -10 * s, 92 * s, 44 * s, 12 * s).fill(SEA.light).stroke({ width: 3, color: SEA.line });
      for (let i = -1; i <= 1; i++) g.moveTo((i * 28 - 12) * s, 8 * s).quadraticCurveTo(i * 28 * s, -4 * s, (i * 28 + 12) * s, 8 * s).stroke({ width: 4, color: SEA.fill });
      break;
    case 'cloud':
      for (const [dx, dy, r] of [[-24, 6, 20], [0, -8, 26], [24, 4, 20]]) g.circle(dx * s, dy * s, r * s).fill(0xffffff).stroke({ width: 3, color: 0x9fb4c8 });
      g.roundRect(-40 * s, 4 * s, 80 * s, 22 * s, 11 * s).fill(0xffffff);
      break;
    case 'river':
      g.roundRect(-46 * s, -30 * s, 92 * s, 64 * s, 14 * s).fill(HILL.light);
      g.moveTo(-40 * s, -24 * s).bezierCurveTo(0, -20 * s, -20 * s, 20 * s, 40 * s, 26 * s).stroke({ width: 14 * s, color: SEA.fill, cap: 'round' });
      break;
    case 'snow':
      g.poly([-46 * s, 32 * s, 0, -36 * s, 46 * s, 32 * s]).fill(0xb7a99a).stroke({ width: 3, color: 0x8a7b6c });
      g.poly([-18 * s, -8 * s, 0, -36 * s, 18 * s, -8 * s, 6 * s, -2 * s, -6 * s, -10 * s]).fill(SNOW.fill).stroke({ width: 2, color: SNOW.line });
      break;
    case 'ground':
      g.ellipse(0, -8 * s, 46 * s, 24 * s).fill(HILL.fill).stroke({ width: 3, color: HILL.line });
      g.roundRect(-40 * s, 0, 80 * s, 32 * s, 8 * s).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
      for (const [dx, dy] of [[-20, 12], [4, 22], [24, 10]]) g.circle(dx * s, dy * s, 5 * s).fill(SEA.fill);
      break;
    case 'stay':
      g.ellipse(0, 12 * s, 40 * s, 20 * s).fill(wood.fill).stroke({ width: 3, color: wood.line });
      g.ellipse(0, 6 * s, 28 * s, 10 * s).fill(wood.line);
      for (let i = -2; i <= 2; i++) g.moveTo((i * 14 - 8) * s, 16 * s).lineTo((i * 14 + 8) * s, 22 * s).stroke({ width: 2, color: wood.line });
      break;
  }
  return g;
}

/** A process badge: sun for warm, snowflake for cold, arrow for down, nest for stay. */
export function badgeArt(kind: Driver | 'stay', size = 34): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.circle(0, 0, r).fill(cream).stroke({ width: 3, color: ink });
  if (kind === 'warm') {
    g.circle(0, 0, r * 0.38).fill(swatch.yellow.fill);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5).lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78).stroke({ width: 2.5, color: swatch.yellow.line }); }
  } else if (kind === 'cold') {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7).lineTo(-Math.cos(a) * r * 0.7, -Math.sin(a) * r * 0.7).stroke({ width: 3, color: SEA.line }); }
  } else if (kind === 'down') {
    g.moveTo(0, -r * 0.6).lineTo(0, r * 0.5).stroke({ width: 4, color: SEA.line });
    g.poly([-r * 0.42, r * 0.1, 0, r * 0.62, r * 0.42, r * 0.1]).fill(SEA.line);
  } else {
    g.ellipse(0, r * 0.15, r * 0.6, r * 0.32).fill(wood.fill).stroke({ width: 2, color: wood.line });
  }
  return g;
}

/** A choice card: a picture of where the drop would go (a nest for staying). The back is redrawn to grey it. */
export function cardArt(place: Place | 'stay', w: number, h: number): { node: Container; back: Graphics } {
  const node = new Container();
  const back = new Graphics();
  paintCard(back, w, h, false);
  const pic = placeIcon(place, w * 0.72);
  pic.y = -6;
  node.addChild(back, pic);
  return { node, back };
}

export function paintCard(back: Graphics, w: number, h: number, grey: boolean) {
  back.clear();
  back.roundRect(-w / 2 + 4, -h / 2 + 8, w, h, 22).fill({ color: shadow, alpha: 0.18 });
  back.roundRect(-w / 2, -h / 2, w, h, 22).fill(grey ? 0xd9d9e0 : cream).stroke({ width: 5, color: grey ? 0xa0a0ac : wood.line });
}

/** The postcard strip's little card for one stop. */
export function stripCard(place: Place, badge: Driver | 'stay' | null): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-36, -34, 72, 68, 12).fill(0xffffff).stroke({ width: 3, color: wood.line }));
  const pic = placeIcon(place, 60); pic.y = -4;
  c.addChild(pic);
  if (badge) { const b = badgeArt(badge, 26); b.position.set(26, 24); c.addChild(b); }
  return c;
}

export function bookArt(size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 26).fill(cream).stroke({ width: 5, color: wood.line }));
  const g = new Graphics();
  g.poly([-34, -22, -2, -16, -2, 30, -34, 24]).fill(swatch.purple.light).stroke({ width: 3, color: swatch.purple.line });
  g.poly([34, -22, 2, -16, 2, 30, 34, 24]).fill(swatch.purple.light).stroke({ width: 3, color: swatch.purple.line });
  g.poly([-6, -8, 10, 4, -6, 16]).fill(swatch.purple.line);
  c.addChild(g);
  return c;
}

export function leafArt(size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, size / 2).fill(cream).stroke({ width: 5, color: swatch.green.line }));
  const g = new Graphics();
  g.moveTo(-26, 26).bezierCurveTo(-30, -20, 10, -34, 30, -30).bezierCurveTo(32, 6, 6, 32, -26, 26).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  g.moveTo(-26, 26).lineTo(18, -18).stroke({ width: 3, color: swatch.green.line });
  c.addChild(g);
  return c;
}

/** The postcard: a friend asks for the drop at a place. */
export function postcardArt(place: Place, friend: Container, size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 14).fill(0xffffff).stroke({ width: 4, color: swatch.red.line }));
  const pic = placeIcon(place, size * 0.6); pic.position.set(0, size * 0.16);
  friend.scale.set((size * 0.36) / 100);
  friend.position.set(-size * 0.22, -size * 0.18);
  c.addChild(pic, friend);
  return c;
}

/** The big down chevron that shows gravity while the drop falls or runs. */
export function chevronArt(): Graphics {
  return new Graphics().poly([-26, -10, 0, 14, 26, -10, 26, 4, 0, 28, -26, 4]).fill({ color: SEA.line, alpha: 0.8 });
}
