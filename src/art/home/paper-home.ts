import { Container, Graphics } from 'pixi.js';
import { BACKDROP } from '../../creatures/home-layout';

/**
 * Home's day backdrop in the paper cut-out look (docs/ART-STYLE.md): sky, far hills, a treehouse on the left, a pond on the
 * right and a meadow in front, every piece a flat shape the paper pass turns into construction paper. It replaces the
 * painted `home-day.webp` and keeps its frame: 1536 × 1024 units anchored at its bottom centre, the grass from 730 down
 * (`BACKDROP.floor`), so every layout placed on the picture still fits. A wide phone shows only the lower 700 units or so,
 * so everything that matters stands low.
 */
/** `tree` false leaves the treehouse out: Home stands its own (`yardTreehouse`) where an upright phone can see it. */
export function paperHome(tree = true): Container {
  const { w, h, floor } = BACKDROP;
  const L = -w / 2,
    T = -h,
    ground = T + floor;
  const c = new Container();
  const back = new Graphics();
  const front = new Graphics();
  c.addChild(back);
  if (tree) {
    const house = treehouse();
    house.scale.set(0.72);
    house.position.set(-480, ground + 40);
    c.addChild(house);
  }
  c.addChild(front);
  c.eventMode = 'none';

  const g = back;
  // Sky: one sheet (the pass gives it fibre only).
  g.rect(L, T, w, floor + 40).fill(0xbde7f5);
  g.circle(560, ground - 330, 54).fill(0xffd54a);
  cloud(g, -120, ground - 360, 1.1);
  cloud(g, 250, ground - 420, 0.8);
  cloud(g, 700, ground - 250, 0.7);

  // Far blue mountains with snowy tops, then two rolling hills.
  g.poly([
    L - 20,
    ground - 90,
    -230,
    ground - 330,
    20,
    ground - 140,
    280,
    ground - 360,
    560,
    ground - 130,
    w / 2 + 20,
    ground - 220,
    w / 2 + 20,
    ground + 20,
    L - 20,
    ground + 20,
  ]).fill(0xa9cde0);
  g.poly([-230, ground - 330, -178, ground - 268, -222, ground - 280, -276, ground - 262]).fill(0xf4fbff);
  g.poly([280, ground - 360, 336, ground - 292, 288, ground - 304, 230, ground - 288]).fill(0xf4fbff);
  const hill = (base: number, amp: number, phase: number, color: number) => {
    const pts: number[] = [L - 20, ground + 40];
    for (let x = L - 20; x <= w / 2 + 20; x += 32)
      pts.push(x, base + amp * (0.6 * Math.sin(x * 0.004 + phase) + 0.4 * Math.sin(x * 0.011 + phase * 2)));
    pts.push(w / 2 + 20, ground + 40);
    g.poly(pts).fill(color);
  };
  hill(ground - 110, 30, 1.3, 0x9bd17a);
  hill(ground - 45, 20, 4.1, 0x7dbe5a);

  // The meadow everything stands on.
  g.rect(L, ground, w, h - floor).fill(0x8fd16a);

  // The pond on the right, with its bank, ripples, pads and a flower.
  const f = front;
  f.ellipse(470, ground + 110, 300, 92).fill(0x6db94f);
  f.ellipse(470, ground + 108, 270, 74).fill(0x5fb3d9);
  for (const [x, y] of [
    [380, ground + 96],
    [560, ground + 126],
    [470, ground + 80],
  ])
    f.moveTo(x - 30, y)
      .lineTo(x + 30, y)
      .stroke({ width: 5, color: 0xb6e3f3, cap: 'round' });
  for (const [x, y, r] of [
    [330, ground + 120, 26],
    [600, ground + 96, 22],
  ])
    f.moveTo(x, y)
      .arc(x, y, r, 0.4, Math.PI * 2 - 0.4)
      .closePath()
      .fill(0x3fa05a);
  f.circle(330, ground + 120, 9).fill(0xff6f91);

  // Bushes along the back of the meadow.
  for (const [cx, s] of [
    [-150, 1],
    [120, 0.8],
    [700, 0.9],
  ] as const) {
    for (const [x, y, r] of [
      [-46, 0, 36],
      [0, -18, 46],
      [48, 0, 38],
    ])
      f.circle(cx + x * s, ground + 6 + y * s, r * s);
    f.fill(0x4fa24a);
  }

  // A stepping-stone path and a scatter of flowers.
  for (const [x, y, rx, ry] of [
    [-300, ground + 140, 40, 18],
    [-200, ground + 200, 46, 20],
    [-60, ground + 250, 50, 22],
    [90, ground + 285, 54, 22],
  ])
    f.ellipse(x, y, rx, ry).fill(0xe2d8c8);
  for (const [x, y, color] of [
    [-640, ground + 120, 0xff6f91],
    [-380, ground + 230, 0xffffff],
    [-20, ground + 150, 0xff9a3c],
    [250, ground + 220, 0xff6f91],
    [660, ground + 250, 0xffffff],
    [-560, ground + 260, 0x9a6cf0],
    [430, ground + 270, 0xffd54a],
  ] as const)
    flower(f, x, y, color);
  return c;
}

/** A cloud of five puffs (one fill, so the paper pass outlines it as one piece). */
export function cloud(g: Graphics, cx: number, cy: number, s: number) {
  for (const [x, y, r] of [
    [-50, 0, 34],
    [-15, -18, 44],
    [28, -8, 38],
    [58, 6, 26],
    [0, 10, 36],
  ])
    g.circle(cx + x * s * 1.3, cy + y * s * 1.3, r * s * 1.3);
  g.fill(0xffffff);
}

export function flower(g: Graphics, x: number, y: number, petal: number) {
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    g.circle(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 10);
  }
  g.fill(petal);
  g.circle(x, y, 7).fill(0xffd54a);
}

/** The treehouse, its foot on (0, 0): trunk, canopy, platform, a little house and a ladder to the grass. */
export function treehouse(): Graphics {
  const g = new Graphics();
  g.poly([-60, 60, -38, -300, -30, -470, 30, -470, 40, -300, 66, 60]).fill(0xa86f43);
  g.poly([-30, -360, -150, -470, -140, -490, -22, -400]).fill(0xa86f43);
  for (const [x, y, r] of [
    [-170, -520, 110],
    [-40, -600, 140],
    [120, -530, 115],
    [220, -450, 80],
    [-260, -430, 80],
    [40, -470, 120],
  ])
    g.circle(x, y, r);
  g.fill(0x5fae4b);
  for (const [x, y, r] of [
    [-120, -610, 60],
    [60, -650, 70],
    [170, -580, 48],
  ])
    g.circle(x, y, r);
  g.fill(0x7cc85a);
  g.roundRect(-190, -330, 380, 30, 8).fill(0xc98b55);
  g.rect(-120, -470, 210, 140).fill(0xffcf8a);
  g.poly([-145, -465, -15, -560, 115, -465]).fill(0xf2545b);
  g.roundRect(-70, -425, 60, 95, 26).fill(0x8f5a37);
  g.circle(40, -412, 26).fill(0x8ed2ee);
  for (const x of [120, 170]) g.moveTo(x, -300).lineTo(x + 18, 40);
  for (let y = -270; y < 30; y += 46) g.moveTo(120 + (y + 300) * 0.052, y).lineTo(170 + (y + 300) * 0.052, y);
  g.stroke({ width: 9, color: 0x8f5a37, cap: 'round' });
  return g;
}
