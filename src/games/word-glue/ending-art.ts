import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { flower } from '../../art/shapes';
import type { Made } from './art';
import type { Ending } from './logic';

type State = 'neutral' | 'full' | 'without';

function apple(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r).fill(swatch.red.fill).stroke({ color: swatch.red.line, width: 2 });
  g.moveTo(x, y - r + 2)
    .lineTo(x + 3, y - r - 5)
    .stroke({ color: wood.line, width: 3 });
  g.ellipse(x + 7, y - r - 2, 5, 3).fill(swatch.green.fill);
}

function bolt(g: Graphics) {
  g.poly([3, -52, -32, 5, -8, 5, -15, 52, 34, -15, 8, -15, 20, -52])
    .fill(swatch.yellow.fill)
    .stroke({ color: swatch.yellow.line, width: 4, join: 'round' });
}

function balloons(g: Graphics) {
  for (const [x, y, color] of [
    [-24, -14, swatch.purple.fill],
    [22, -30, swatch.yellow.fill],
  ]) {
    g.moveTo(x, y + 24)
      .quadraticCurveTo(x + 12, 20, 0, 50)
      .stroke({ color: ink, width: 3 });
    g.ellipse(x, y, 20, 25).fill(color);
    g.ellipse(x - 6, y - 8, 4, 8).fill(swatch.white.fill);
  }
}

export function endingTileArt(base: Ending['base']): Container {
  const g = new Graphics();
  switch (base) {
    case 'fruit':
      apple(g, 0, 3, 39);
      break;
    case 'color':
      for (const [x, y, color] of [
        [-28, 16, swatch.blue.fill],
        [23, 17, swatch.red.fill],
        [0, -24, swatch.yellow.fill],
      ])
        g.ellipse(x, y, 24, 20).fill(color);
      break;
    case 'power':
      bolt(g);
      break;
    case 'cheer':
      balloons(g);
      break;
    case 'care':
      g.roundRect(-50, 3, 30, 43, 13).roundRect(20, 3, 30, 43, 13).fill(swatch.peach.fill);
      g.moveTo(-25, -6)
        .bezierCurveTo(-39, -33, -9, -48, 0, -25)
        .bezierCurveTo(9, -48, 39, -33, 25, -6)
        .lineTo(0, 20)
        .closePath()
        .fill(swatch.pink.fill);
      g.moveTo(-34, 18)
        .quadraticCurveTo(-26, 39, 0, 42)
        .quadraticCurveTo(26, 39, 34, 18)
        .stroke({ color: swatch.peach.fill, width: 13, cap: 'round' });
      break;
  }
  return g;
}

function tree(g: Graphics, state: State) {
  g.roundRect(-11, -12, 22, 82, 7).fill(wood.line);
  g.circle(-34, -22, 36).circle(32, -21, 38).circle(0, -41, 45).fill(swatch.green.fill);
  g.ellipse(-24, -43, 17, 7).ellipse(22, -48, 18, 8).fill(swatch.green.light);
  if (state === 'full') {
    for (const [x, y] of [
      [-44, -19],
      [0, -54],
      [42, -22],
      [-14, -12],
      [24, -3],
    ])
      apple(g, x, y, 11);
  } else if (state === 'neutral') apple(g, 25, -19, 10);
}

function fish(g: Graphics, state: State) {
  const color = state === 'without' ? swatch.white.line : swatch.blue.fill;
  g.poly([34, 0, 73, -32, 71, 32]).fill(color);
  g.ellipse(-6, 0, 56, 38).fill(state === 'full' ? swatch.yellow.fill : swatch.white.light);
  if (state !== 'without') {
    g.ellipse(15, 0, 16, 33).fill(color);
    if (state === 'full') g.ellipse(-11, 0, 12, 32).fill(swatch.pink.fill);
  }
  g.circle(-41, -8, 6).fill(ink);
  g.moveTo(-56, 11).quadraticCurveTo(-48, 17, -40, 11).stroke({ color: ink, width: 3 });
}

function lamp(g: Graphics, state: State) {
  if (state !== 'without') {
    g.poly([-27, -26, 27, -26, state === 'full' ? 75 : 51, 59, state === 'full' ? -75 : -51, 59]).fill({
      color: swatch.yellow.fill,
      alpha: state === 'full' ? 0.65 : 0.23,
    });
  }
  g.roundRect(-5, -20, 10, 73, 5).roundRect(-34, 46, 68, 12, 6).fill(wood.line);
  g.poly([-24, -63, 24, -63, 38, -22, -38, -22]).fill(
    state === 'without' ? swatch.white.line : swatch.orange.fill,
  );
  if (state === 'without') {
    g.moveTo(5, 45).quadraticCurveTo(28, 69, 55, 60).stroke({ color: ink, width: 4 });
    g.roundRect(52, 54, 13, 11, 3).fill(ink);
    g.moveTo(65, 57).lineTo(72, 57).moveTo(65, 62).lineTo(72, 62).stroke({ color: ink, width: 2 });
  }
}

function room(g: Graphics, state: State, node: Container) {
  g.roundRect(-70, -61, 140, 122, 13).fill(state === 'without' ? swatch.white.light : swatch.peach.light);
  g.roundRect(-39, -49, 78, 72, 5).fill(state === 'full' ? swatch.blue.light : swatch.white.line);
  if (state === 'full') {
    g.circle(17, -26, 12).fill(swatch.yellow.fill);
    g.rect(-40, -49, 12, 74).rect(28, -49, 12, 74).fill(swatch.pink.fill);
    g.moveTo(-20, 45)
      .lineTo(-20, 22)
      .moveTo(20, 45)
      .lineTo(20, 22)
      .stroke({ color: swatch.green.line, width: 4 });
    for (const [x, color] of [
      [-20, swatch.pink],
      [20, swatch.yellow],
    ] as const) {
      const bloom = flower(new Graphics(), 11, color.fill, color.line);
      bloom.position.set(x, 22);
      node.addChild(bloom);
    }
  } else {
    const curtain = state === 'neutral' ? swatch.purple.fill : swatch.white.line;
    g.rect(-40, -49, 37, 74)
      .rect(3, -49, state === 'neutral' ? 20 : 37, 74)
      .fill(curtain);
  }
  g.roundRect(-51, 38, 102, 14, 7).fill(wood.line);
}

export function endingArt(ending: Ending, state: State): Made {
  const node = new Container();
  const art = new Graphics();
  if (ending.thing !== 'bear') {
    const draw = { tree, fish, lamp, room }[ending.thing];
    node.addChild(art);
    draw(art, state, node);
    if (ending.thing === 'tree' && state === 'without') {
      const falling = new Graphics();
      apple(falling, 25, -19, 10);
      node.addChild(falling);
      return {
        node,
        alive(t) {
          const fall = Math.min(1, t * 1.8);
          falling.y = fall * fall * 88;
          falling.alpha = Math.min(1, (1 - fall) * 3);
        },
      };
    }
    return {
      node,
      alive: (t) => {
        node.pivot.y = Math.sin(t * 6) * 5;
      },
    };
  }

  const bear = new Critter(CRITTERS.bear);
  bear.alive = false;
  bear.scale.set(0.53);
  bear.position.set(-26, 62);
  const top = new Graphics().roundRect(-13, -10, 26, 20, 3).fill(swatch.yellow.fill);
  art.roundRect(6, 21, 46, 24, 4).fill(swatch.blue.fill);
  art.roundRect(12, 1, 35, 21, 4).fill(swatch.red.fill);
  node.addChild(bear, art, top);
  return {
    node,
    alive(t) {
      const fall = state === 'without' ? Math.min(1, 0.35 + t * 1.9) : 0;
      const bob = Math.sin(t * (state === 'without' ? 15 : 5)) * 4;
      const step = state === 'neutral' ? 0 : Math.sin(t * 3) * 8;
      bear.x = -26 + step;
      art.x = step;
      bear.y = 62 + bob;
      art.y = bob;
      top.position.set(29 + 33 * fall + step, -8 + 57 * fall * fall + bob);
      top.rotation = state === 'neutral' ? -0.18 : fall * 1.8;
    },
  };
}
