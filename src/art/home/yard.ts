import { Container, Graphics } from 'pixi.js';
import { treehouse } from './paper-home';

/**
 * The things standing in Home's yard (docs/rework/HOME.md#the-yard), each drawn flat with its foot at (0, 0) so the
 * paper pass cuts it out like the backdrop. Pieces that move on a tap (the board's cards, the cabinet's screen, a
 * bush's bird) are their own children, labelled, so a scene can wiggle them without redrawing.
 */

const WOOD = 0xb07a4a;
const DARK_WOOD = 0x8f5a37;
const PALE_WOOD = 0xd9a066;

/** The treehouse (the backdrop's own, now a thing of its own so it stands inside an upright phone's view too). */
export function yardTreehouse(): Container {
  const c = new Container();
  const tree = treehouse();
  const light = new Graphics().circle(40, -412, 26).fill(0xffe27a);
  light.label = 'light';
  light.alpha = 0;
  c.addChild(tree, light);
  return c;
}

/** A notice board on two legs with six cards pinned up: Today's six. About 190 × 210. */
export function noticeBoard(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const x of [-70, 62]) g.roundRect(x, -110, 14, 110, 4);
  g.fill(DARK_WOOD);
  g.roundRect(-95, -215, 190, 130, 10).fill(WOOD);
  g.roundRect(-84, -204, 168, 108, 6).fill(0xe9c99a);
  g.poly([-104, -212, 0, -248, 104, -212]).fill(0xf2545b);
  c.addChild(g);
  const colors = [0xff9ac1, 0x8ed2ee, 0xffd54a, 0x9be07a, 0xc7a6ff, 0xffb36b];
  const cards = new Container();
  cards.label = 'cards';
  colors.forEach((color, i) => {
    const card = new Graphics();
    const col = i % 3,
      row = Math.floor(i / 3);
    card.roundRect(-20, -18, 40, 38, 5).fill(color);
    card.circle(0, -12, 5).fill(0xf2545b);
    card.position.set(-52 + col * 52, -176 + row * 50);
    card.rotation = ((i * 37) % 11) / 60 - 0.08;
    cards.addChild(card);
  });
  c.addChild(cards);
  return c;
}

/** An arcade cabinet with a glowing screen and two buttons: all the games. About 130 × 230. */
export function arcadeCabinet(): Container {
  const c = new Container();
  const g = new Graphics();
  g.poly([-62, 0, -62, -150, -50, -228, 50, -228, 62, -150, 62, 0]).fill(0x7a5cc9);
  g.roundRect(-56, -224, 112, 34, 8).fill(0xffd54a);
  g.roundRect(-62, -110, 124, 26, 6).fill(0x5d43a8);
  g.circle(-20, -98, 9).fill(0xf2545b);
  g.circle(18, -98, 9).fill(0x4fa3f7);
  g.roundRect(-30, -60, 60, 40, 6).fill(0x5d43a8);
  c.addChild(g);
  const screen = new Graphics();
  screen.roundRect(-44, -180, 88, 62, 8).fill(0x2f3b5c);
  screen.circle(-14, -150, 10).fill(0x9be07a);
  screen.roundRect(4, -160, 24, 20, 4).fill(0xff9ac1);
  screen.label = 'screen';
  c.addChild(screen);
  return c;
}

/** A wooden signpost with two arrow boards pointing off the path: out to the island. About 150 × 220. */
export function signpost(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-9, -210, 18, 214, 6).fill(DARK_WOOD);
  g.ellipse(0, 2, 34, 9).fill(0x6db94f);
  c.addChild(g);
  const boards = new Container();
  boards.label = 'boards';
  const arrow = (y: number, dir: 1 | -1, color: number) => {
    const b = new Graphics();
    // The square end by the post, the point 26 units past the board's far end.
    const near = -40 * dir,
      far = 80 * dir,
      tip = far + 26 * dir;
    b.poly([near, y - 22, far, y - 22, tip, y, far, y + 22, near, y + 22]).fill(color);
    return b;
  };
  boards.addChild(arrow(-176, 1, PALE_WOOD), arrow(-120, -1, 0xe7b47a));
  c.addChild(boards);
  return c;
}

/** A picnic blanket with two cushions, laid on the grass: family play on the couch. About 210 × 90. */
export function familyBlanket(): Container {
  const c = new Container();
  const g = new Graphics();
  g.poly([-100, -6, 80, -40, 110, 30, -80, 52]).fill(0xf2545b);
  for (const t of [0.25, 0.5, 0.75]) {
    const ax = -100 + 180 * t,
      ay = -6 - 34 * t,
      bx = -80 + 190 * t,
      by = 52 - 22 * t;
    g.moveTo(ax, ay).lineTo(bx, by);
  }
  g.stroke({ width: 7, color: 0xfff4e3 });
  c.addChild(g);
  const cushions = new Container();
  cushions.label = 'cushions';
  for (const [x, y, color] of [
    [-38, -20, 0x8ed2ee],
    [42, -36, 0xffd54a],
  ] as const) {
    const k = new Graphics().roundRect(-30, -22, 60, 40, 16).fill(color);
    k.position.set(x, y);
    cushions.addChild(k);
  }
  c.addChild(cushions);
  return c;
}

/** Welcome a New Friend's basket on the grass, with a blanket peeking out (RW07): Continue. About 140 × 100. */
export function projectBasket(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-44, -62).arc(0, -62, 44, Math.PI, 0).stroke({ width: 10, color: DARK_WOOD });
  g.poly([-66, -66, 66, -66, 52, 0, -52, 0]).fill(PALE_WOOD);
  g.roundRect(-60, -76, 120, 20, 8).fill(0xff9ac1);
  for (let x = -48; x <= 48; x += 24) g.moveTo(x, -56).lineTo(x * 0.85, -4);
  g.stroke({ width: 4, color: WOOD });
  c.addChild(g);
  return c;
}

/**
 * Pick for me's kite, flying in the yard's sky (`kite`, which bobs and swoops without redrawing): a diamond in the old
 * Pick button's three card colours, with a bow-knotted tail and its string running down. Foot (the string's end) at
 * (0, 0). About 150 × 230.
 */
export function yardKite(): Container {
  const c = new Container();
  const string = new Graphics()
    .moveTo(0, 0)
    .bezierCurveTo(-30, -60, 30, -120, 0, -150)
    .stroke({ width: 3, color: 0x8c8c9c });
  const kite = new Container();
  kite.label = 'kite';
  kite.position.set(0, -150);
  const tail = new Graphics()
    .moveTo(0, 0)
    .bezierCurveTo(-24, 30, 24, 50, -6, 84)
    .stroke({ width: 3, color: 0x8c8c9c });
  for (const [x, y, color] of [
    [-6, 28, 0xff9ac1],
    [8, 52, 0xffd54a],
    [-4, 78, 0x4fa3f7],
  ] as const)
    tail
      .poly([x - 12, y - 7, x, y, x - 12, y + 7])
      .poly([x + 12, y - 7, x, y, x + 12, y + 7])
      .fill(color);
  const body = new Graphics()
    .poly([0, -80, 46, -22, 0, 0, 0, -80])
    .fill(0x4fa3f7)
    .poly([0, -80, -46, -22, 0, 0])
    .fill(0xff9ac1)
    .poly([-46, -22, 46, -22, 0, 0])
    .fill(0xffd54a)
    .moveTo(0, -80)
    .lineTo(0, 0)
    .moveTo(-46, -22)
    .lineTo(46, -22)
    .stroke({ width: 3, color: 0x8f5a37 });
  const star = new Graphics().star(0, -38, 5, 11, 5).fill(0xffffff);
  kite.addChild(tail, body, star);
  c.addChild(string, kite);
  return c;
}

/** A round bush with a bird tucked behind it (`bird`, hidden until a tap shakes it out). About 170 × 110. */
export function yardBush(color = 0x4fa24a): Container {
  const c = new Container();
  const bird = new Graphics();
  bird.circle(0, 0, 18).fill(0x4fa3f7);
  bird.poly([14, -4, 32, 2, 14, 8]).fill(0xffb36b);
  bird.circle(6, -5, 3).fill(0x2b2440);
  bird.label = 'bird';
  bird.position.set(10, -60);
  bird.visible = false;
  const g = new Graphics();
  for (const [x, y, r] of [
    [-50, -34, 38],
    [0, -56, 50],
    [52, -34, 40],
    [0, -26, 44],
  ])
    g.circle(x, y, r);
  g.fill(color);
  g.label = 'leaves';
  c.addChild(bird, g);
  return c;
}

/** A patch of three tall flowers that spin and open on a tap. About 130 × 110. */
export function flowerPatch(): Container {
  const c = new Container();
  const stems = new Graphics();
  const heads = new Container();
  heads.label = 'heads';
  for (const [x, h, petal] of [
    [-40, 70, 0xff6f91],
    [0, 96, 0xffd54a],
    [40, 60, 0x9a6cf0],
  ] as const) {
    stems.moveTo(x, 0).lineTo(x, -h);
    const head = new Graphics();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      head.circle(Math.cos(a) * 14, Math.sin(a) * 14, 13);
    }
    head.fill(petal);
    head.circle(0, 0, 9).fill(0xfff4e3);
    head.position.set(x, -h);
    heads.addChild(head);
  }
  stems.stroke({ width: 7, color: 0x3f8f3a, cap: 'round' });
  const leaves = new Graphics();
  leaves.ellipse(-22, -24, 16, 7).fill(0x5fae4b);
  leaves.ellipse(22, -30, 16, 7).fill(0x5fae4b);
  c.addChild(stems, leaves, heads);
  return c;
}

/** A sun with short rays, centred on (0, 0): the upright yard's own (about 150 across). */
export function yardSun(): Container {
  const c = new Container();
  const rays = new Graphics();
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI * 2) / 10;
    rays.poly([
      Math.cos(a - 0.12) * 52,
      Math.sin(a - 0.12) * 52,
      Math.cos(a) * 78,
      Math.sin(a) * 78,
      Math.cos(a + 0.12) * 52,
      Math.sin(a + 0.12) * 52,
    ]);
  }
  rays.fill(0xffb347);
  rays.label = 'rays';
  c.addChild(rays, new Graphics().circle(0, 0, 54).fill(0xffd54a));
  return c;
}

/** Lantern Lodge up on the hill: a log cabin with a lantern each side, the grown-ups' place to build (about 170 × 150). */
export function yardLodge(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-70, -80, 140, 80, 6).fill(0xa86f43);
  for (let y = -66; y < 0; y += 16) g.moveTo(-70, y).lineTo(70, y);
  g.stroke({ width: 4, color: 0x8f5a37 });
  g.poly([-86, -76, 0, -138, 86, -76]).fill(0x3f6e8c);
  g.roundRect(-16, -48, 32, 48, 10).fill(0x6b4329);
  g.rect(28, -60, 26, 22).fill(0xffe27a);
  c.addChild(g);
  for (const x of [-60, 60]) {
    const lantern = new Graphics();
    lantern.moveTo(0, -42).lineTo(0, -30).stroke({ width: 3, color: 0x2b2440 });
    lantern.roundRect(-9, -30, 18, 22, 6).fill(0xffc94d);
    lantern.position.set(x * 1.35, 0);
    lantern.label = 'lantern';
    c.addChild(lantern);
  }
  return c;
}
