import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { flower, puffs, starPoints } from '../../art/shapes';
import { Rng } from '../../engine/random';
import { PICTURE_H, PICTURE_W } from './logic';
import { stickerScene, type Feature, type SceneDef } from './scenes';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/**
 * A 600 by 420 picture with its top-left corner on (0, 0). The friend is returned too,
 * so the finished picture can come alive, and so is every part of the picture with the box it fills,
 * so a test can see what each piece of a puzzle holds.
 *
 * The random draws happen in a fixed order (the sun's side, then anything a place needs, then the flowers) and the
 * `playDetails: false` preserves the original drawing for saved stickers and the map icon.
 */
export function pictureScene(scene: SceneDef, seed: number, playDetails = true): { root: Container; friend: Critter; features: Feature[] } {
  const rng = new Rng(seed);
  const W = PICTURE_W;
  const H = PICTURE_H;
  const root = new Container();
  const features: Feature[] = [];
  const note = (name: string, x: number, y: number, w: number, h: number) => void features.push({ name, x, y, w, h });
  const solid = (name: string, x: number, y: number, w: number, h: number) => void features.push({ name, x, y, w, h, solid: true });
  const noteBounds = (name: string, node: Container) => {
    const r = node.getBounds().rectangle;
    note(name, r.x, r.y, r.width, r.height);
  };
  const horizon = H * 0.58;
  const g = new Graphics().rect(0, 0, W, H).fill(scene.sky);
  // The sun sits on whichever side the friend is not.
  const sunX = rng.chance(0.5) ? 90 : W - 90;
  const toward = sunX < W / 2 ? 1 : -1;
  const friendX = W / 2 + toward * 60;
  if (scene.light === 'sun') {
    g.circle(sunX, 80, 46).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
    note('sun', sunX - 46, 34, 92, 92);
    solid('sun-core', sunX - 30, 50, 60, 60);
  } else if (scene.light === 'moon') {
    g.circle(sunX, 80, 40).fill(0xfff3c4).circle(sunX + toward * 20, 68, 34).fill(scene.sky);
    note('moon', sunX - 40, 40, 80, 80);
  }
  puffs(g, [[-40, 6, 26], [0, -10, 34], [38, 6, 24]].map(([x, y, r]) => [W - sunX + x, 70 + y, r] as [number, number, number]), scene.cloud, scene.cloud, 0);
  note('cloud', W - sunX - 66, 26, 128, 76);
  solid('cloud-core', W - sunX - 22, 38, 44, 44);
  g.ellipse(W * 0.3, horizon + 30, W * 0.5, 90).fill(scene.hills).ellipse(W * 0.8, horizon + 40, W * 0.4, 80).fill(scene.hills);
  g.rect(0, horizon, W, H - horizon).fill(scene.ground);
  root.addChild(g);

  const back = new Graphics();
  root.addChild(back);
  switch (scene.id) {
    case 'cow': {
      // A red barn and a fence.
      back.rect(40, horizon - 110, 150, 140).fill(swatch.red.fill).stroke(line(swatch.red.line));
      back.poly([25, horizon - 110, 115, horizon - 180, 205, horizon - 110]).fill(swatch.red.line);
      back.rect(85, horizon - 50, 60, 80).fill(wood.light).stroke(line(wood.line));
      note('barn', 25, horizon - 180, 180, 220);
      for (let x = 260; x < W; x += 60) {
        back.rect(x, horizon - 20, 14, 70).fill(wood.fill).stroke(line(wood.line, 3));
        note(`post-${x}`, x, horizon - 20, 14, 70);
      }
      back.rect(250, horizon - 5, W - 250, 12).fill(wood.fill);
      break;
    }
    case 'duck':
      back.ellipse(W / 2, H * 0.8, 240, 70).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      note('pond', W / 2 - 240, H * 0.8 - 70, 480, 140);
      for (const [x, y] of [[170, 330], [440, 345], [380, 310]]) {
        back.ellipse(x, y, 26, 11).fill(swatch.green.fill);
        note(`pad-${x}`, x - 26, y - 11, 52, 22);
      }
      break;
    case 'bunny':
      for (let i = 0; i < 7; i++) {
        const x = 40 + i * 85 + rng.range(-10, 10);
        back.moveTo(x, H - 10).lineTo(x, H - 70).stroke(line(swatch.green.line, 4));
        note(`stalk-${i}`, x - 2, H - 70, 4, 60);
      }
      break;
    case 'cat':
      for (let i = 0; i < 5; i++) {
        const b = prop('balloon', (['red', 'yellow', 'blue', 'purple', 'orange'] as const)[i]);
        b.position.set(60 + i * 120 + (i % 2) * 20, 120 + (i % 2) * 40);
        b.scale.set(0.9);
        root.addChild(b);
        noteBounds(`balloon-${i}`, b);
      }
      back.rect(0, horizon - 12, W, 14).fill(swatch.pink.fill);
      note('streamer', 0, horizon - 12, W, 14);
      break;
    case 'bear':
      for (const x of [70, 520, 600]) {
        back.rect(x - 14, horizon - 60, 28, 120).fill(wood.fill).stroke(line(wood.line, 4));
        puffs(back, [[x - 40, horizon - 80, 40], [x, horizon - 120, 48], [x + 40, horizon - 80, 40]], swatch.green.fill, swatch.green.line, 5);
        note(`tree-${x}`, x - 80, horizon - 168, 160, 228);
      }
      break;
    case 'dog': {
      const ball = new Graphics().circle(0, 0, 34).fill(swatch.red.fill).stroke(line(swatch.red.line)).moveTo(-34, 0).quadraticCurveTo(0, 18, 34, 0).stroke(line(swatch.white.fill, 6));
      ball.position.set(friendX + toward * 185, H - 70);
      root.addChild(ball);
      noteBounds('ball', ball);
      break;
    }
    case 'pig-mud': {
      // A muddy yard: a puddle under the pig, a trough, a hay bale and splashes of mud.
      const mud = 0x9a6a45;
      back.rect(36, horizon - 10, 120, 56).fill(wood.fill).stroke(line(wood.line)).rect(48, horizon - 2, 96, 14).fill(swatch.blue.fill);
      note('trough', 36, horizon - 10, 120, 56);
      back.rect(470, horizon - 36, 100, 82).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)).moveTo(470, horizon - 8).lineTo(570, horizon - 8).moveTo(470, horizon + 20).lineTo(570, horizon + 20).stroke(line(swatch.yellow.line, 3));
      note('hay', 470, horizon - 36, 100, 82);
      back.ellipse(friendX, H - 44, 150, 34).fill(mud).stroke(line(0x6e4a2e));
      note('puddle', friendX - 150, H - 78, 300, 68);
      for (const [x, y] of [[190, 312], [420, 300], [90, 340]]) {
        back.ellipse(x, y, 30, 14).fill(mud);
        note(`splat-${x}`, x - 30, y - 14, 60, 28);
      }
      // Two fence posts leaning on the hills.
      for (const x of [250, 330]) {
        back.rect(x, horizon - 40, 14, 60).fill(wood.fill).stroke(line(wood.line, 3));
        note(`post-${x}`, x, horizon - 40, 14, 60);
      }
      break;
    }
    case 'cow-snow': {
      // A fir tree, a snowman and snowflakes.
      back.rect(62, horizon + 10, 16, 36).fill(wood.fill);
      back.poly([15, horizon + 20, 70, horizon - 100, 125, horizon + 20]).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      back.poly([30, horizon - 40, 70, horizon - 110, 110, horizon - 40]).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      note('fir', 15, horizon - 110, 110, 160);
      const sx = 548;
      back.circle(sx, horizon + 52, 28).fill(swatch.white.fill).stroke(line(swatch.white.line, 3)).circle(sx, horizon + 16, 20).fill(swatch.white.fill).stroke(line(swatch.white.line, 3)).circle(sx, horizon - 12, 14).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
      back.circle(sx - 5, horizon - 15, 2.5).fill(swatch.red.line).circle(sx + 5, horizon - 15, 2.5).fill(swatch.red.line).poly([sx, horizon - 10, sx + 14, horizon - 8, sx, horizon - 6]).fill(swatch.orange.fill);
      note('snowman', sx - 30, horizon - 26, 60, 120);
      for (const [x, y] of [[215, 40], [305, 118], [398, 52], [250, 150]]) {
        const flake = new Graphics();
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3;
          flake.moveTo(Math.cos(a) * 20, Math.sin(a) * 20).lineTo(-Math.cos(a) * 20, -Math.sin(a) * 20);
        }
        flake.stroke(line(swatch.white.fill, 5)).circle(0, 0, 4).fill(swatch.blue.line);
        flake.position.set(x, y);
        root.addChild(flake);
        note(`flake-${x}`, x - 22, y - 22, 44, 44);
      }
      // A snow drift in front of the barnyard.
      back.ellipse(430, H - 36, 90, 26).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
      note('drift', 340, H - 62, 180, 52);
      break;
    }
    case 'bunny-autumn': {
      // Trees in red and gold, leaves coming down and a heap of them on the ground.
      const gold = [swatch.orange, swatch.red, swatch.yellow] as const;
      [70, 530].forEach((x, i) => {
        back.rect(x - 12, horizon - 40, 24, 100).fill(wood.fill).stroke(line(wood.line, 4));
        puffs(back, [[x - 38, horizon - 70, 38], [x, horizon - 108, 46], [x + 38, horizon - 70, 38]], gold[i].fill, gold[i].line, 5);
        note(`tree-${x}`, x - 76, horizon - 154, 152, 214);
      });
      const leaf = (x: number, y: number, c: (typeof gold)[number], r: number) => {
        const l = new Graphics().poly([0, -r, r * 0.7, 0, 0, r, -r * 0.7, 0]).fill(c.fill).stroke(line(c.line, 3));
        l.position.set(x, y);
        l.rotation = x / 90;
        root.addChild(l);
        note(`leaf-${x}`, x - r, y - r, r * 2, r * 2);
      };
      leaf(215, 45, swatch.red, 24);
      leaf(305, 110, swatch.orange, 26);
      leaf(395, 50, swatch.yellow, 24);
      leaf(255, 160, swatch.orange, 24);
      back.ellipse(friendX + toward * 170, H - 40, 70, 24).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4)).ellipse(friendX + toward * 150, H - 54, 40, 16).fill(swatch.red.fill);
      note('heap', friendX + toward * 170 - 70, H - 64, 140, 48);
      break;
    }
    case 'cat-night': {
      // A cottage with a lit window, stars, and fireflies.
      back.rect(20, horizon - 90, 140, 130).fill(swatch.brown.fill).stroke(line(swatch.brown.line)).poly([8, horizon - 90, 90, horizon - 150, 172, horizon - 90]).fill(swatch.purple.line);
      back.rect(60, horizon - 60, 54, 50).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      note('cottage', 8, horizon - 150, 164, 190);
      for (const [x, y, r] of [[215, 40, 20], [300, 105, 18], [390, 45, 20], [250, 160, 16], [455, 125, 16]] as const) {
        back.poly(starPoints(r, r * 0.45).map((v, k) => v + (k % 2 === 0 ? x : y))).fill(swatch.yellow.light);
        note(`star-${x}`, x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8);
      }
      back.rect(538, horizon - 110, 10, 170).fill(ink).circle(543, horizon - 116, 20).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      note('lamp', 518, horizon - 138, 50, 198);
      for (const [x, y] of [[470, 300], [540, 335], [440, 355]]) {
        back.circle(x, y, 9).fill(swatch.yellow.fill);
        note(`firefly-${x}`, x - 18, y - 18, 36, 36);
      }
      break;
    }
    case 'bear-picnic': {
      // A checked blanket with fruit and a basket, a tree behind and a bush.
      back.rect(40, horizon - 50, 28, 110).fill(wood.fill).stroke(line(wood.line, 4));
      puffs(back, [[0, horizon - 70, 38], [54, horizon - 108, 46], [108, horizon - 70, 38]], swatch.green.fill, swatch.green.line, 5);
      note('tree', 0, horizon - 154, 170, 214);
      puffs(back, [[548, horizon - 20, 34], [588, horizon - 40, 40], [596, horizon + 10, 34]], swatch.green.fill, swatch.green.line, 5);
      note('bush', 514, horizon - 80, 100, 130);
      back.poly([14, H - 30, 586, H - 30, 548, H - 106, 52, H - 106]).fill(swatch.red.light).stroke(line(swatch.red.line, 4));
      for (let k = 0; k < 7; k++) back.rect(80 + k * 70, H - 100, 28, 64).fill({ color: swatch.white.fill, alpha: 0.8 });
      note('blanket', 14, H - 106, 572, 76);
      const fruit: [string, 'apple' | 'pear' | 'grapes', 'red' | 'green' | 'purple', number][] = [['apple', 'apple', 'red', 78], ['pear', 'pear', 'green', 574], ['grapes', 'grapes', 'purple', 524]];
      for (const [name, kind, color, x] of fruit) {
        const f = prop(kind, color);
        f.position.set(x, H - 76);
        root.addChild(f);
        noteBounds(name, f);
      }
      // The basket sits on the blanket on the side the friend is not.
      const ox = friendX - toward * 215;
      back.roundRect(ox - 40, H - 112, 80, 52, 8).fill(wood.light).stroke(line(wood.line, 4)).moveTo(ox - 34, H - 112).arc(ox, H - 112, 34, Math.PI, 0).stroke(line(wood.line, 5));
      note('basket', ox - 40, H - 146, 80, 86);
      break;
    }
    case 'dog-rain': {
      // Rain falling from a grey cloud, a doghouse and puddles.
      const streak = (x: number, y: number) => {
        for (let k = 0; k < 3; k++) back.moveTo(x + k * 18, y + (k % 2) * 14).lineTo(x + k * 18 - 8, y + (k % 2) * 14 + 26).stroke(line(swatch.blue.fill, 5));
        note(`rain-${x}-${y}`, x - 10, y, 56, 56);
      };
      for (const [x, y] of [[30, 40], [110, 130], [210, 30], [310, 95], [400, 40], [240, 160], [470, 120], [540, 40]]) streak(x, y);
      const hx = friendX + toward * 215;
      back.rect(hx - 55, horizon + 10, 110, 70).fill(swatch.red.fill).stroke(line(swatch.red.line)).poly([hx - 68, horizon + 12, hx, horizon - 40, hx + 68, horizon + 12]).fill(swatch.red.line);
      back.ellipse(hx, horizon + 66, 20, 14).fill(ink);
      note('doghouse', hx - 68, horizon - 40, 136, 120);
      for (const [x, y] of [[170, 345], [440, 330]]) {
        back.ellipse(x, y, 44, 14).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
        note(`puddle-${x}`, x - 44, y - 14, 88, 28);
      }
      break;
    }
  }
  // Flowers along the bottom for every picture, so each piece has something to look at.
  for (let i = 0; i < 4; i++) {
    const colors = ['pink', 'yellow', 'purple', 'orange'] as const;
    const f = flower(new Graphics(), 16, swatch[colors[i]].fill, swatch[colors[i]].line);
    f.position.set(40 + i * 170 + rng.range(-20, 20), H - 28 - rng.range(0, 14));
    root.addChild(f);
    noteBounds(`flower-${colors[i]}`, f);
  }

  const friend = new Critter(CRITTERS[scene.animal]);
  friend.scale.set(scene.animal === 'duck' ? 0.95 : 1.05);
  friend.position.set(friendX, scene.animal === 'duck' ? H * 0.84 : H - 40);
  friend.alive = false;
  root.addChild(friend);
  const fb = friend.getBounds().rectangle;
  note('friend', fb.x, fb.y, fb.width, fb.height);
  // These flank interiors lie inside bodyPath at every animal's scale. Unlike its
  // bounding box, they contain drawn body, not an empty corner near an ear.
  const fs = friend.scale.x;
  solid('friend-left', friend.x - 95 * fs, friend.y - 145 * fs, 55 * fs, 40 * fs);
  solid('friend-right', friend.x + 40 * fs, friend.y - 145 * fs, 55 * fs, 40 * fs);

  if (playDetails) {
    // A small garden in front of the friend, and two kites above it. These use a
    // separate seeded stream so the original scene and sticker random draws stay put.
    const detailRng = new Rng(seed ^ 0x50414c53);
    const detail = new Graphics();
    root.addChild(detail);
    for (const [x, color, name] of [[225, swatch.red, 'red-kite'], [375, swatch.blue, 'blue-kite']] as const) {
      const y = 64 + detailRng.range(-8, 8);
      detail.poly([x, y - 42, x + 38, y, x, y + 42, x - 38, y]).fill(color.fill).stroke(line(color.line, 4));
      detail.moveTo(x, y + 42).quadraticCurveTo(x - 16, y + 58, x + 12, y + 68).stroke(line(wood.line, 3));
      // An inscribed rectangle; the empty corners of the kite's bounds do not count.
      solid(name, x - 16, y - 16, 32, 32);
    }
    const bloom = (x: number, y: number, name: string, color: typeof swatch.pink) => {
      detail.moveTo(x, y + 30).lineTo(x, y + 72).stroke(line(swatch.green.line, 5));
      const f = flower(new Graphics(), 40, color.fill, color.line);
      f.position.set(x, y);
      root.addChild(f);
      // Within the top petal's filled circle (radius 19.2), rather than its empty bounding corners.
      solid(name, x - 13, y - 24.8 - 13, 26, 26);
    };
    bloom(75, 210, 'tall-pink-flower', swatch.pink);
    // The pinwheel is visibly different from the flower on the other side.
    const px = 525;
    const py = 210;
    detail.moveTo(px, py + 20).lineTo(px, py + 74).stroke(line(wood.line, 5));
    for (let k = 0; k < 4; k++) {
      const blade = new Graphics().poly([0, 0, 0, -44, 40, -36]).fill((k % 2 ? swatch.yellow : swatch.purple).fill).stroke(line(swatch.purple.line, 3));
      blade.position.set(px, py);
      blade.rotation = k * Math.PI / 2;
      root.addChild(blade);
    }
    root.addChild(new Graphics().circle(px, py, 22).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3)));
    solid('pinwheel-hub', px - 14, py - 14, 28, 28);

    // Different silhouettes as well as colors make the ground pieces readable.
    bloom(75, 378, 'low-purple-flower', swatch.purple);
    detail.ellipse(225, 375, 34, 32).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
    detail.moveTo(225, 343).lineTo(229, 333).stroke(line(wood.line, 5));
    detail.ellipse(241, 340, 13, 6).fill(swatch.green.fill);
    solid('apple-core', 205, 355, 40, 40);
    detail.roundRect(366, 374, 18, 28, 4).fill(cream).stroke(line(wood.line, 3));
    detail.ellipse(375, 366, 42, 26).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
    detail.circle(355, 361, 4).circle(384, 355, 5).fill(cream);
    solid('mushroom-cap', 353, 354, 44, 24);
    detail.moveTo(525, 396).lineTo(525, 351).stroke(line(swatch.green.line, 5));
    detail.ellipse(509, 373, 28, 18).ellipse(541, 353, 28, 18).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
    solid('leaf-pair', 491, 361, 36, 24);
    // A rainy scene has no sun, and a crescent's empty disk is not a filled cue.
    if (scene.light !== 'sun') {
      const b = new Graphics().ellipse(sunX, 72, 36, 25).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      b.poly([sunX - 30, 72, sunX - 54, 52, sunX - 54, 87]).fill(swatch.orange.fill);
      b.circle(sunX + 16, 67, 4).fill(ink);
      root.addChild(b);
      solid('sky-bird', sunX - 20, 57, 40, 30);
    }
  }
  // Keep hills and balloons inside the picture, both in the pieces and when it comes alive.
  const mask = new Graphics().rect(0, 0, W, H).fill(0xffffff);
  root.addChild(mask);
  root.mask = mask;
  return { root, friend, features };
}

/** A small framed copy of a picture, for the sticker and the map. */
export function pictureThumb(seed: number, width: number): Container {
  const { root } = pictureScene(stickerScene(seed), seed, false);
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
