import { Container, Graphics } from 'pixi.js';
import { fishArt, owlArt, turtleArt } from '../../art/animals';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { grass, ink, swatch, wood } from '../../art/palette';
import { hatArt } from '../../art/props';
import { Cloud, drawFarBarn, Sun } from '../../art/scenery';
import { flower } from '../../art/shapes';
import { crab, gull, pail, shell } from '../../art/shore';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { layout } from './layout';
import type { Art, Backdrop } from './logic';

function animal(name: CritterName, extras: { wings?: true; hat?: true } = {}) {
  const c = new Critter({ ...CRITTERS[name], ...(extras.wings && { wings: true }) });
  if (extras.hat) c.addChild(hatArt());
  return c;
}

function legs(g: Graphics, y: number, xs: number[], color: number) {
  for (const x of xs) {
    g.moveTo(x, y)
      .lineTo(x, y + 25)
      .lineTo(x + 9, y + 25)
      .stroke({ width: 6, color, cap: 'round' });
  }
}

function direction(g: Graphics, x: number, y: number, down: boolean) {
  const d = down ? 1 : -1;
  g.moveTo(x, y - 9 * d)
    .lineTo(x, y + 10 * d)
    .moveTo(x - 5, y + 5 * d)
    .lineTo(x, y + 10 * d)
    .lineTo(x + 5, y + 5 * d)
    .stroke({ width: 2.5, color: swatch.blue.line, cap: 'round', join: 'round' });
}

function makeArt(art: Art, rng: Rng): Container {
  const g = new Graphics();
  const compose = (...parts: Container[]) => {
    const c = new Container();
    c.addChild(...parts);
    return c;
  };
  switch (art) {
    case 'cloud':
      return new Cloud(rng);
    case 'sun':
      return new Sun();
    case 'gull':
      gull(g, 0, 0);
      return g;
    case 'owl':
      return owlArt('brown');
    case 'duck':
      return animal('duck');
    case 'pig':
      return animal('pig');
    case 'wingedPig':
      return animal('pig', { wings: true });
    case 'hen':
      return animal('hen');
    case 'sheep':
      return animal('sheep');
    case 'cow':
      return animal('cow');
    case 'dogHat':
      return animal('dog', { hat: true });
    case 'roofCat': {
      const cat = animal('cat');
      cat.setMood('sleepy');
      return cat;
    }
    case 'bunnyPail': {
      const bunny = animal('bunny');
      bunny.scale.set(0.35);
      bunny.y = -38;
      pail(g, 0, 30, swatch.purple);
      return compose(bunny, g);
    }
    case 'fourLegHen': {
      const hen = animal('hen');
      hen.scale.set(0.45);
      legs(g, -13, [-28, 20], swatch.orange.line);
      return compose(g, hen);
    }
    case 'fish':
    case 'fishTree':
      return fishArt(swatch.orange);
    case 'walkingFish':
      legs(g, 14, [-19, 16], swatch.orange.line);
      return compose(g, fishArt(swatch.orange));
    case 'turtle':
      return turtleArt(110);
    case 'flyingTurtle':
      g.ellipse(-36, 1, 32, 14)
        .ellipse(36, 1, 32, 14)
        .fill(swatch.white.light)
        .stroke({ color: swatch.blue.line, width: 3 });
      return compose(g, turtleArt(106));
    case 'crab':
    case 'cloudCrab': {
      crab(g, 0, 0, 1);
      if (art === 'crab') return g;
      const cloud = new Cloud(rng);
      cloud.scale.set(0.32);
      cloud.y = 10;
      return compose(cloud, g);
    }
    case 'shell':
      shell(g, 0, 0, 2);
      return g;
    case 'pail':
      pail(g, 0, 0);
      return g;
    case 'flower': {
      const bloom = flower(new Graphics(), 24, swatch.pink.fill, swatch.pink.line);
      return compose(g.moveTo(0, 0).lineTo(0, 38).stroke({ width: 5, color: swatch.green.line }), bloom);
    }
    case 'lily':
      return g
        .poly([-42, 0, -29, -21, 12, -24, 40, -8, 37, 15, -16, 22, -40, 12, -9, 1])
        .fill(swatch.green.fill)
        .stroke({ width: 3, color: swatch.green.line, join: 'round' });
    case 'frog':
      return g
        .ellipse(0, 9, 32, 22)
        .circle(-15, -11, 12)
        .circle(15, -11, 12)
        .fill(swatch.green.fill)
        .stroke({ width: 3, color: swatch.green.line })
        .circle(-15, -12, 4)
        .circle(15, -12, 4)
        .fill(ink)
        .moveTo(-12, 9)
        .quadraticCurveTo(0, 20, 12, 9)
        .stroke({ width: 3, color: ink });
    case 'sandcastle':
      return g
        .poly([
          -42, 28, -42, -25, -28, -25, -28, -11, -13, -11, -13, -29, 13, -29, 13, -11, 28, -11, 28, -25, 42,
          -25, 42, 28,
        ])
        .fill(wood.light)
        .stroke({ width: 4, color: wood.line, join: 'round' })
        .roundRect(-9, 8, 18, 20, 7)
        .fill(wood.line);
    case 'risingRain':
    case 'rain': {
      const up = art === 'risingRain';
      const cloud = new Cloud(rng);
      cloud.scale.set(0.48);
      cloud.y = 0;
      for (const x of [-23, 0, 23]) {
        const y = 33 + Math.abs(x) / 4;
        g.ellipse(x, y, 4, 7).fill(swatch.blue.fill).stroke({ width: 1.5, color: swatch.blue.line });
        direction(g, x, y + (up ? -14 : 14), !up);
      }
      return compose(cloud, g);
    }
    case 'risingApple':
    case 'apple': {
      g.circle(-9, 7, 17)
        .circle(9, 7, 17)
        .fill(swatch.red.fill)
        .stroke({ color: swatch.red.line, width: 2.5 })
        .moveTo(0, -8)
        .quadraticCurveTo(-2, -16, 4, -25)
        .stroke({ color: wood.line, width: 4 })
        .ellipse(12, -19, 10, 5)
        .fill(swatch.green.line);
      direction(g, 37, 6, art === 'apple');
      return g;
    }
  }
}

export function thingArt(art: Art, rng: Rng, size = 108): Container {
  const picture = new Container();
  picture.addChild(makeArt(art, rng));
  const bounds = picture.getLocalBounds();
  const scale = size / Math.max(bounds.width, bounds.height);
  picture.scale.set(scale);
  picture.position.set(-(bounds.x + bounds.width / 2) * scale, -(bounds.y + bounds.height / 2) * scale);
  const centered = new Container();
  centered.addChild(picture);
  centered.eventMode = 'none';
  return centered;
}

function tree(g: Graphics, x: number, y: number, ground: number) {
  g.moveTo(x, ground)
    .lineTo(x, y + 12)
    .moveTo(x, y + 50)
    .lineTo(x - 64, y + 11)
    .moveTo(x, y + 35)
    .lineTo(x + 61, y + 8)
    .stroke({ width: 25, color: wood.line, cap: 'round' });
  for (const [dx, dy, r] of [
    [-64, -30, 52],
    [0, -47, 69],
    [66, -30, 50],
    [8, 5, 62],
  ]) {
    g.circle(x + dx, y + dy, r).fill(swatch.green.light);
  }
  g.moveTo(x - 48, y + 43)
    .quadraticCurveTo(x, y + 56, x + 49, y + 36)
    .stroke({ width: 11, color: wood.fill, cap: 'round' });
}

export function paintBackdrop(g: Graphics, backdrop: Backdrop, view: View, scene: ReturnType<typeof layout>) {
  const { w, h } = view;
  const { horizon, slots, rock, water } = scene;
  const sea = backdrop === 'beach';
  g.clear().rect(0, 0, w, h).fill(swatch.blue.light);
  g.moveTo(0, horizon + 13)
    .quadraticCurveTo(w * 0.53, horizon - 43, w, horizon + 12)
    .lineTo(w, h)
    .lineTo(0, h)
    .closePath()
    .fill(sea ? wood.light : grass);
  if (sea) {
    g.moveTo(0, horizon - 30)
      .quadraticCurveTo(w * 0.72, horizon - 48, w, horizon - 20)
      .lineTo(w, water.y + 31)
      .quadraticCurveTo(w * 0.83, water.y + 78, w * 0.68, horizon + 27)
      .quadraticCurveTo(w * 0.44, horizon - 24, 0, horizon + 4)
      .closePath()
      .fill(swatch.teal.fill);
  } else {
    tree(g, slots.canopy.x, slots.canopy.y, slots.leftGround.y + 50);
    if (backdrop === 'pond') {
      const left = Math.min(slots.bank.x, slots.middleGround.x) - 70;
      const top = Math.min(slots.bank.y, slots.middleGround.y) - 49;
      const right = water.x;
      g.moveTo(left, slots.bank.y + 19)
        .quadraticCurveTo(left - 42, top, slots.middleGround.x + 22, top)
        .quadraticCurveTo(right - 54, top - 18, right + 67, water.y - 31)
        .quadraticCurveTo(right + 80, water.y + 52, right - 80, water.y + 60)
        .quadraticCurveTo(left + 60, slots.middleGround.y + 100, left, slots.bank.y + 19)
        .fill(swatch.teal.fill)
        .stroke({ color: swatch.teal.line, width: 4 });
      g.ellipse(slots.leftGround.x, slots.leftGround.y + 35, 84, 35).fill(grass);
      g.ellipse(rock.x, rock.y + 35, 51, 26).fill(swatch.white.line);
    } else {
      drawFarBarn(g, slots.rightSky.x, slots.rightSky.y + 145, 124);
      g.ellipse(slots.middleGround.x, slots.middleGround.y + 46, 103, 29).fill(wood.fill);
      for (let i = 0; i < 4; i++) {
        const x = slots.rightGround.x - 80 + i * 48;
        g.roundRect(x, slots.rightGround.y - 27, 15, 97, 5).fill(wood.fill);
      }
      g.roundRect(slots.rightGround.x - 84, slots.rightGround.y + 7, 172, 11, 5).fill(wood.line);
    }
  }
  for (const f of [0.24, 0.43, 0.68, 0.84]) {
    const x = w * f;
    const y = h - 85 - 25 * Math.sin(f * 12);
    g.ellipse(x, y, 44, 6).fill({ color: sea ? wood.fill : swatch.green.fill, alpha: 0.42 });
  }
}
