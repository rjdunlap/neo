import { Container, Graphics } from 'pixi.js';
import { frogArt, fishArt } from '../../art/animals';
import { ink, swatch } from '../../art/palette';
import { ANIMALS, type AnimalId } from './logic';

/** Draws one animal, centred on (0, 0), about 130 units across. The frog and fish are the shared drawings. */
function drawing(id: AnimalId): Container {
  const c = new Container();
  const g = new Graphics();
  switch (id) {
    case 'frog':
      return centred(frogArt(), 1.25);
    case 'fish':
      return centred(fishArt(swatch.orange), 1.7);
    case 'duck':
      g.ellipse(0, 18, 52, 38).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
      g.ellipse(-8, 22, 24, 16).fill(swatch.yellow.light);
      g.circle(28, -26, 28).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
      g.poly([50, -24, 76, -16, 50, -8])
        .fill(swatch.orange.fill)
        .stroke({ width: 3, color: swatch.orange.line });
      g.circle(34, -34, 5).fill(ink);
      break;
    case 'bird':
      g.poly([-50, 20, -86, 0, -80, 34]).fill(swatch.blue.line);
      g.ellipse(0, 14, 50, 36).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
      g.ellipse(-6, 22, 28, 16).fill(swatch.blue.light);
      g.circle(34, -22, 24).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
      g.poly([54, -26, 78, -20, 54, -14]).fill(swatch.orange.fill);
      g.circle(40, -28, 5).fill(ink);
      break;
    case 'snail':
      g.roundRect(-70, 22, 130, 28, 14)
        .fill(swatch.green.fill)
        .stroke({ width: 4, color: swatch.green.line });
      g.circle(48, 14, 18).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
      g.moveTo(44, -2)
        .lineTo(40, -26)
        .moveTo(56, -2)
        .lineTo(62, -24)
        .stroke({ width: 4, color: swatch.green.line });
      g.circle(40, -28, 5).circle(62, -26, 5).fill(ink);
      g.circle(-14, -8, 44).fill(swatch.pink.fill).stroke({ width: 5, color: swatch.pink.line });
      g.circle(-14, -8, 26).stroke({ width: 4, color: swatch.pink.line });
      g.circle(-14, -8, 10).stroke({ width: 4, color: swatch.pink.line });
      break;
    case 'bear':
      g.circle(-34, -44, 16)
        .circle(34, -44, 16)
        .fill(swatch.brown.fill)
        .stroke({ width: 4, color: swatch.brown.line });
      g.ellipse(0, 20, 52, 44).fill(swatch.brown.fill).stroke({ width: 5, color: swatch.brown.line });
      g.circle(0, -20, 40).fill(swatch.brown.fill).stroke({ width: 5, color: swatch.brown.line });
      g.ellipse(0, -8, 20, 15).fill(swatch.brown.light);
      g.circle(-14, -26, 5).circle(14, -26, 5).fill(ink);
      g.ellipse(0, -12, 7, 5).fill(ink);
      break;
  }
  c.addChild(g);
  return c;
}

/** Centres a shared drawing on its own bounds and scales it. */
function centred(c: Container, scale: number): Container {
  const b = c.getLocalBounds();
  c.scale.set(scale);
  c.position.set(-(b.x + b.width / 2) * scale, -(b.y + b.height / 2) * scale);
  const wrap = new Container();
  wrap.addChild(c);
  return wrap;
}

/** The animal on its own, about `size` units across. */
export function animalArt(id: AnimalId, size: number): Container {
  const c = drawing(id);
  c.scale.set(size / 190);
  return c;
}

/** An animal card: a white rounded square with the animal on it, `size` wide and centred on (0, 0). */
export function animalCard(id: AnimalId, size: number): Container {
  const c = new Container();
  const back = new Graphics()
    .roundRect(-100, -100, 200, 200, 26)
    .fill(0xffffff)
    .stroke({ width: 6, color: swatch.green.line });
  const art = drawing(id);
  art.scale.set(0.95);
  const inner = new Container();
  inner.addChild(back, art);
  inner.scale.set(size / 200);
  c.addChild(inner);
  return c;
}

/** The pet's plain shape for the stage: a round body with two eyes and nothing that names an animal. */
export function plainPet(color = swatch.purple): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 0, 80, 74).fill(color.fill).stroke({ width: 6, color: color.line });
  g.ellipse(0, 22, 46, 34).fill(color.light);
  g.circle(-26, -18, 9).circle(26, -18, 9).fill(0xffffff);
  g.circle(-24, -17, 5).circle(28, -17, 5).fill(ink);
  c.addChild(g);
  return c;
}

export const stickerArt = (seed: number) =>
  animalCard(ANIMALS[Math.abs(Math.trunc(seed)) % ANIMALS.length], 96);

/** A soft green glow ring for a card. */
export const glowRing = (size: number, color = swatch.yellow.fill) =>
  new Graphics()
    .roundRect(-(size + 22) / 2, -(size + 22) / 2, size + 22, size + 22, 30)
    .stroke({ width: 9, color });
export const selRing = (size: number) => glowRing(size - 8, swatch.purple.line);

// Button icons, white on the button's colour, drawn about 60 units wide.
export const tickIcon = () =>
  new Graphics().poly([-24, 0, -10, 14, 24, -18, 24, -10, -10, 28, -24, 10]).fill(0xffffff);
export function eyeIcon(closed = false) {
  const g = new Graphics();
  if (closed) {
    g.moveTo(-28, -4).quadraticCurveTo(0, 20, 28, -4).stroke({ width: 7, color: 0xffffff, cap: 'round' });
    for (const x of [-16, 0, 16])
      g.moveTo(x, 8)
        .lineTo(x * 1.1, 20)
        .stroke({ width: 4, color: 0xffffff, cap: 'round' });
    return g;
  }
  g.ellipse(0, 0, 28, 16).fill(0xffffff);
  g.circle(0, 0, 9).fill(swatch.blue.line);
  return g;
}
export function againIcon() {
  const g = new Graphics();
  g.moveTo(22, -4)
    .arc(0, 0, 22, 0, Math.PI * 1.5)
    .stroke({ width: 7, color: 0xffffff, cap: 'round' });
  g.poly([10, -30, 32, -22, 18, -6]).fill(0xffffff);
  return g;
}
export function swapIcon() {
  const g = new Graphics();
  g.moveTo(-22, -8).lineTo(18, -8).stroke({ width: 7, color: 0xffffff });
  g.poly([14, -22, 30, -8, 14, 6]).fill(0xffffff);
  g.moveTo(22, 12).lineTo(-18, 12).stroke({ width: 7, color: 0xffffff });
  g.poly([-14, -2, -30, 12, -14, 26]).fill(0xffffff);
  return g;
}
export const notYetIcon = () =>
  new Graphics().poly([-26, -10, 4, -10, 4, -24, 30, 0, 4, 24, 4, 10, -26, 10]).fill(0xffffff);
export const readyIcon = () => new Graphics().star(0, 0, 5, 28, 12).fill(0xffffff);
export function seatIcon(two: boolean) {
  const c = new Container();
  const mk = (kind: 'pet' | 'person', color: number) => {
    const g = new Graphics().circle(0, 0, 24).fill(0xffffff).stroke({ width: 5, color });
    if (kind === 'pet') {
      g.circle(-10, -10, 7).circle(10, -10, 7).fill(color);
    } else {
      g.circle(0, -6, 8).fill(color);
      g.ellipse(0, 14, 14, 9).fill(color);
    }
    return g;
  };
  const a = mk('person', swatch.blue.line);
  const b = mk(two ? 'person' : 'pet', swatch.orange.line);
  a.x = -22;
  b.x = 22;
  c.addChild(a, b);
  return c;
}
