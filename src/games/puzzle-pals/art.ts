import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, grass, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { flower, puffs } from '../../art/shapes';
import type { AnimalSound } from '../../audio/sfx';
import { Rng } from '../../engine/random';
import { PICTURE_H, PICTURE_W } from './logic';

/** The pictures to put together. Each is one friend in a little place, with something to say. */
export const SCENES = [
  { animal: 'cow', what: 'a cow on the farm', sound: 'moo' },
  { animal: 'duck', what: 'a duck in the pond', sound: 'quack' },
  { animal: 'bunny', what: 'a bunny in the garden', sound: 'hop' },
  { animal: 'cat', what: 'a cat at a party', sound: 'meow' },
  { animal: 'bear', what: 'a bear in the woods', sound: 'growl' },
  { animal: 'dog', what: 'a dog with a ball', sound: 'woof' },
] as const satisfies readonly { animal: CritterName; what: string; sound: AnimalSound }[];
export type Scene = (typeof SCENES)[number];

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/**
 * A 600 by 420 picture with its top-left corner on (0, 0). The friend is returned too,
 * so the finished picture can come alive.
 */
export function pictureScene(scene: Scene, seed: number): { root: Container; friend: Critter } {
  const rng = new Rng(seed);
  const W = PICTURE_W;
  const H = PICTURE_H;
  const root = new Container();
  const horizon = H * 0.58;
  const sky = scene.animal === 'cat' ? swatch.pink.light : scene.animal === 'bear' ? swatch.teal.light : swatch.blue.light;
  const ground = scene.animal === 'duck' ? swatch.green.light : grass;
  const g = new Graphics().rect(0, 0, W, H).fill(sky);
  // The sun sits on whichever side the friend is not.
  const sunX = rng.chance(0.5) ? 90 : W - 90;
  const toward = sunX < W / 2 ? 1 : -1;
  const friendX = W / 2 + toward * 60;
  g.circle(sunX, 80, 46).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
  puffs(g, [[-40, 6, 26], [0, -10, 34], [38, 6, 24]].map(([x, y, r]) => [W - sunX + x, 70 + y, r] as [number, number, number]), swatch.white.fill, swatch.white.fill, 0);
  g.ellipse(W * 0.3, horizon + 30, W * 0.5, 90).fill(swatch.green.light).ellipse(W * 0.8, horizon + 40, W * 0.4, 80).fill(swatch.green.light);
  g.rect(0, horizon, W, H - horizon).fill(ground);
  root.addChild(g);

  const back = new Graphics();
  root.addChild(back);
  switch (scene.animal) {
    case 'cow': {
      // A red barn and a fence.
      back.rect(40, horizon - 110, 150, 140).fill(swatch.red.fill).stroke(line(swatch.red.line));
      back.poly([25, horizon - 110, 115, horizon - 180, 205, horizon - 110]).fill(swatch.red.line);
      back.rect(85, horizon - 50, 60, 80).fill(wood.light).stroke(line(wood.line));
      for (let x = 260; x < W; x += 60) back.rect(x, horizon - 20, 14, 70).fill(wood.fill).stroke(line(wood.line, 3));
      back.rect(250, horizon - 5, W - 250, 12).fill(wood.fill);
      break;
    }
    case 'duck':
      back.ellipse(W / 2, H * 0.8, 240, 70).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      for (const [x, y] of [[170, 330], [440, 345], [380, 310]]) back.ellipse(x, y, 26, 11).fill(swatch.green.fill);
      break;
    case 'bunny':
      for (let i = 0; i < 7; i++) {
        const x = 40 + i * 85 + rng.range(-10, 10);
        back.moveTo(x, H - 10).lineTo(x, H - 70).stroke(line(swatch.green.line, 4));
      }
      break;
    case 'cat':
      for (let i = 0; i < 5; i++) {
        const b = prop('balloon', (['red', 'yellow', 'blue', 'purple', 'orange'] as const)[i]);
        b.position.set(60 + i * 120 + (i % 2) * 20, 120 + (i % 2) * 40);
        b.scale.set(0.9);
        root.addChild(b);
      }
      back.rect(0, horizon - 12, W, 14).fill(swatch.pink.fill);
      break;
    case 'bear':
      for (const x of [70, 520, 600]) {
        back.rect(x - 14, horizon - 60, 28, 120).fill(wood.fill).stroke(line(wood.line, 4));
        puffs(back, [[x - 40, horizon - 80, 40], [x, horizon - 120, 48], [x + 40, horizon - 80, 40]], swatch.green.fill, swatch.green.line, 5);
      }
      break;
    case 'dog': {
      const ball = new Graphics().circle(0, 0, 34).fill(swatch.red.fill).stroke(line(swatch.red.line)).moveTo(-34, 0).quadraticCurveTo(0, 18, 34, 0).stroke(line(swatch.white.fill, 6));
      ball.position.set(friendX + toward * 185, H - 70);
      root.addChild(ball);
      break;
    }
  }
  // Flowers along the bottom for every picture, so each piece has something to look at.
  for (let i = 0; i < 4; i++) {
    const colors = ['pink', 'yellow', 'purple', 'orange'] as const;
    const f = flower(new Graphics(), 16, swatch[colors[i]].fill, swatch[colors[i]].line);
    f.position.set(40 + i * 170 + rng.range(-20, 20), H - 28 - rng.range(0, 14));
    root.addChild(f);
  }

  const friend = new Critter(CRITTERS[scene.animal]);
  friend.scale.set(scene.animal === 'duck' ? 0.95 : 1.05);
  friend.position.set(friendX, scene.animal === 'duck' ? H * 0.84 : H - 40);
  friend.alive = false;
  root.addChild(friend);
  // Keep hills and balloons inside the picture, both in the pieces and when it comes alive.
  const mask = new Graphics().rect(0, 0, W, H).fill(0xffffff);
  root.addChild(mask);
  root.mask = mask;
  return { root, friend };
}

/** A small framed copy of a picture, for the sticker and the map. */
export function pictureThumb(seed: number, width: number): Container {
  const rng = new Rng(seed);
  const scene = rng.pick(SCENES);
  const { root } = pictureScene(scene, seed);
  const s = width / PICTURE_W;
  root.scale.set(s);
  root.position.set((-PICTURE_W * s) / 2, (-PICTURE_H * s) / 2);
  const c = new Container();
  const mask = new Graphics().roundRect((-PICTURE_W * s) / 2, (-PICTURE_H * s) / 2, PICTURE_W * s, PICTURE_H * s, 14).fill(0xffffff);
  root.mask = mask;
  c.addChild(root, mask, new Graphics().roundRect((-PICTURE_W * s) / 2, (-PICTURE_H * s) / 2, PICTURE_W * s, PICTURE_H * s, 14).stroke(line(wood.line, 6)));
  return c;
}

/** The map landmark: a picture with one piece lifted out and tilted. */
export function puzzleIcon(): Container {
  const c = new Container();
  const pic = pictureThumb(2, 190);
  pic.y = -80;
  const hole = new Graphics().rect(0, -136, 95, 66).fill(cream).stroke(line(wood.line, 3));
  const piece = new Graphics().roundRect(-48, -33, 96, 66, 6).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4)).circle(0, -33, 12).fill(swatch.yellow.fill);
  piece.position.set(78, -162);
  piece.rotation = 0.25;
  c.addChild(pic, hole, piece);
  return c;
}
