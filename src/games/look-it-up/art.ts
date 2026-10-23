import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { frogArt, penguinArt, fishArt } from '../../art/animals';
import { cream, ink, swatch, wood } from '../../art/palette';
import { label } from '../../ui/text';
import type { AnimalId, Picture, Row } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const CRITTER_OF: Partial<Record<AnimalId, CritterName>> = { cow: 'cow', pig: 'pig', duck: 'duck', rabbit: 'bunny', bear: 'bear' };

/** An adult standing with its feet on (0, 0) about `height` units tall. */
export function animalArt(id: AnimalId, height = 200): Container {
  const c = new Container();
  const name = CRITTER_OF[id];
  if (name) {
    const critter = new Critter(CRITTERS[name]);
    critter.alive = false;
    critter.scale.set(height / 250);
    c.addChild(critter);
  } else {
    const art = id === 'frog' ? frogArt() : penguinArt();
    // Both are drawn about 80 units tall with their feet near y = 36 (the frog's near 10).
    const s = height / (id === 'frog' ? 70 : 90);
    art.scale.set(s);
    art.y = id === 'frog' ? -10 * s : -40 * s;
    c.addChild(art);
  }
  c.eventMode = 'none';
  return c;
}

/** A picture for a fact row, centred on (0, 0) inside about 90 units. */
export function pictureArt(pic: Picture): Container {
  const c = new Container();
  const g = new Graphics();
  switch (pic) {
    case 'grass':
      g.ellipse(0, 30, 34, 11).fill(wood.fill).stroke(line(wood.line, 3));
      for (const [x, tip, lean] of [[-22, -20, -10], [-11, -34, -4], [0, -40, 2], [11, -34, 6], [22, -20, 12]]) {
        g.poly([x - 6, 28, x + 6, 28, x + lean, tip]).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      }
      break;
    case 'rootPlant':
      for (const [x, lean] of [[-14, -20], [0, 0], [14, 20]]) {
        g.ellipse(x + lean * 0.6, -22, 13, 22).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      }
      g.moveTo(0, 0).lineTo(0, 22).stroke(line(swatch.green.line, 5));
      g.poly([-12, 18, 12, 18, 3, 44, -3, 44]).fill(swatch.orange.light).stroke(line(wood.line, 3));
      g.moveTo(-8, 44).lineTo(-16, 38).moveTo(8, 44).lineTo(16, 38).stroke(line(wood.line, 2));
      break;
    case 'seeds':
      g.ellipse(0, 18, 38, 14).fill(wood.light);
      for (const [x, y] of [[-20, 8], [-6, 0], [12, 8], [24, 16], [-12, 20], [4, 16], [0, -8], [-24, 18]]) g.ellipse(x, y, 6, 3.5).fill(wood.line);
      break;
    case 'berries':
      for (const [x, y] of [[-16, 8], [14, 6], [0, 24], [-2, -10]]) g.circle(x, y, 15).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 3));
      g.moveTo(0, -30).lineTo(0, -12).stroke(line(swatch.green.line, 4));
      g.ellipse(14, -28, 14, 7).fill(swatch.green.fill);
      break;
    case 'snail':
      g.ellipse(6, 28, 38, 10).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
      g.circle(0, 4, 26).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.circle(0, 4, 12).stroke(line(swatch.orange.line, 3));
      g.moveTo(34, 22).lineTo(40, -2).moveTo(26, 22).lineTo(26, 0).stroke(line(swatch.brown.line, 3));
      g.circle(40, -4, 3).circle(26, -2, 3).fill(ink);
      break;
    case 'fish':
      return fishPicture();
    case 'field':
      g.roundRect(-45, -30, 90, 70, 12).fill(swatch.green.light).stroke(line(swatch.green.line, 3));
      for (const [x, y] of [[-25, 0], [0, -14], [24, 10], [-6, 20]]) {
        g.moveTo(x - 5, y + 8).lineTo(x, y - 6).lineTo(x + 5, y + 8).stroke(line(swatch.green.line, 3));
      }
      g.moveTo(-45, -12).lineTo(45, -12).stroke(line(wood.line, 4));
      break;
    case 'mudPen':
      g.roundRect(-45, -34, 90, 74, 12).fill(wood.light).stroke(line(wood.line, 3));
      g.ellipse(0, 10, 30, 18).fill(wood.fill).stroke(line(wood.line, 3));
      for (const x of [-30, -10, 10, 30]) g.moveTo(x, -34).lineTo(x, -14).stroke(line(wood.line, 4));
      break;
    case 'pond':
      g.ellipse(0, 10, 44, 28).fill(swatch.blue.light).stroke(line(swatch.blue.line, 4));
      g.ellipse(-8, 8, 18, 8).stroke(line(swatch.blue.line, 2));
      g.ellipse(18, -22, 10, 5).fill(swatch.green.fill);
      g.moveTo(-34, -14).lineTo(-34, -34).moveTo(-28, -14).lineTo(-26, -30).stroke(line(swatch.green.line, 3));
      break;
    case 'burrow':
      g.roundRect(-45, -10, 90, 52, 14).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      g.ellipse(0, 24, 20, 17).fill(ink);
      for (const x of [-30, 30]) g.moveTo(x - 4, -10).lineTo(x, -24).lineTo(x + 4, -10).stroke(line(swatch.green.line, 3));
      break;
    case 'den':
      g.poly([-46, 42, -30, -20, 0, -40, 30, -20, 46, 42]).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
      g.poly([-24, 42, -18, -2, 0, -14, 18, -2, 24, 42]).fill(ink);
      break;
    case 'rockyBeach':
      g.rect(-46, 12, 92, 30).fill(swatch.yellow.light);
      g.rect(-46, -34, 92, 46).fill(swatch.blue.light);
      for (const [x, y, r] of [[-26, 14, 16], [0, 22, 20], [26, 12, 14]]) g.ellipse(x, y, r, r * 0.7).fill(0x9a9aa8).stroke(line(0x6c6c7c, 3));
      g.moveTo(-40, -14).quadraticCurveTo(-24, -24, -8, -14).stroke(line(swatch.blue.line, 3));
      break;
    case 'calf': return baby('cow', 'cow');
    case 'piglet': return baby('pig', 'pig');
    case 'duckling': return baby('duck', 'duck');
    case 'kit': return baby('bunny', 'bunny');
    case 'cub': return baby('bear', 'bear');
    case 'tadpole':
      g.circle(-8, 0, 17).fill(0x4a5a3a).stroke(line(ink, 3));
      g.moveTo(8, 0).quadraticCurveTo(24, 14, 42, 0).stroke(line(0x4a5a3a, 8));
      g.circle(-14, -4, 4).fill(0xffffff);
      g.circle(-13, -4, 2).fill(ink);
      break;
    case 'chick':
      g.ellipse(0, 6, 28, 30).fill(0x8c7b6b).stroke(line(0x5e5248, 3));
      g.circle(0, -22, 18).fill(0x9c8b7b).stroke(line(0x5e5248, 3));
      g.circle(-6, -24, 3).circle(6, -24, 3).fill(ink);
      g.poly([-5, -17, 5, -17, 0, -10]).fill(swatch.orange.fill);
      g.ellipse(-8, 40, 9, 4).ellipse(8, 40, 9, 4).fill(swatch.orange.fill);
      break;
  }
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

function fishPicture(): Container {
  const c = fishArt(swatch.blue);
  c.eventMode = 'none';
  return c;
}

/** A small, round baby of a critter kind, standing in the box. */
function baby(name: CritterName, _kind: string): Container {
  const c = new Container();
  const critter = new Critter(CRITTERS[name]);
  critter.alive = false;
  critter.scale.set(0.3);
  critter.y = 44;
  c.addChild(critter);
  c.eventMode = 'none';
  return c;
}

/** The icon on a fact row: a bowl for Eats, a map pin for Where, an egg for Baby. */
export function rowIcon(row: Row): Container {
  const c = new Container();
  const g = new Graphics();
  if (row === 'eats') {
    g.ellipse(0, 4, 24, 8).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
    g.poly([-24, 4, 24, 4, 16, 24, -16, 24]).fill(swatch.orange.light).stroke(line(swatch.orange.line, 3));
  } else if (row === 'where') {
    g.circle(0, -8, 17).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.poly([-14, 2, 14, 2, 0, 28]).fill(swatch.red.fill);
    g.circle(0, -8, 6).fill(0xffffff);
  } else {
    g.ellipse(0, 4, 17, 22).fill(cream).stroke(line(wood.line, 3));
    g.moveTo(-14, 6).lineTo(-6, 0).lineTo(0, 8).lineTo(6, 0).lineTo(14, 6).stroke(line(wood.line, 2));
  }
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** The open book on a stand, drawn into a rect (the page area is cream, the cover wood). */
export function bookArt(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(0, 0, w, h, 22).fill(wood.fill).stroke(line(wood.line, 5))
    .roundRect(10, 10, w - 20, h - 20, 16).fill(cream).stroke(line(wood.light, 3));
}

export const tabFace = (id: AnimalId): Container => {
  const c = new Container();
  const a = animalArt(id, id === 'frog' || id === 'penguin' ? 56 : 62);
  a.y = 34;
  c.addChild(a);
  c.eventMode = 'none';
  return c;
};

export const titleText = (text: string, size = 38) => label(text, size, ink);
