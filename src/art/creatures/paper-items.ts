import { CanvasSource, Texture } from 'pixi.js';
import {
  almondPts,
  type Ctx,
  ellipsePts,
  hexCss,
  line,
  outline,
  piece,
  pieceUnion,
  shade,
  softPath,
  spot,
} from './paper/canvas';
import { ITEM_ART, WEARABLES, type File } from './wearables';

/**
 * The nine wearables as paper cut-outs (docs/ART-STYLE.md), drawn in code with the creatures' canvas helpers. Each is
 * drawn into the box of its prepared sprite (`ITEM_ART`: same size, same angle, the same part of the item under the
 * anchor), so every `*_WEAR` table places it exactly as it placed the painted one. `loadWearables()` returns these in
 * the paper look; `?paintedpets` brings the painted sprites back.
 */

type Pt = [number, number];

/** Points along a quadratic curve from `a` through control `c` to `b` (the last point included). */
function curve(a: Pt, c: Pt, b: Pt, n = 12): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n,
      u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ] as Pt;
  });
}

/** Draws inside a path only (stripes, dots, a lining). */
function within(x: Ctx, path: Path2D, draw: () => void) {
  x.save();
  x.clip(path);
  draw();
  x.restore();
}

/** A filled flat shape with no edge or shadow (a stripe, a dot), through soft points. */
function flat(x: Ctx, pts: Pt[], color: string, seed: string, amp = 1.5) {
  x.fillStyle = color;
  x.fill(softPath(pts, amp, seed));
}

const ring = (cx: number, cy: number, r: number, bumps: number, depth: number): Pt[] =>
  Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const k = r + depth * Math.abs(Math.sin((a * bumps) / 2));
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });

// ---- Crown: a ring of six flowers on leaves, its open middle on the anchor.
const PETAL = { yellow: 0xffd45e, pink: 0xff9fb8, purple: 0xc49ce6 };
const LEAF = 0x8fb85c;

function flower(x: Ctx, cx: number, cy: number, color: number, seed: string, turn: number) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = turn + (i / 5) * Math.PI * 2;
    return ellipsePts(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25, 26, 22, a);
  });
  pieceUnion(x, petals, color, seed, 2.5);
  for (let i = 0; i < 5; i++) {
    const a = turn + Math.PI / 5 + (i / 5) * Math.PI * 2;
    line(
      x,
      [
        [cx + Math.cos(a) * 10, cy + Math.sin(a) * 10],
        [cx + Math.cos(a) * 30, cy + Math.sin(a) * 30],
      ],
      shade(color, 0.18),
      2.5,
    );
  }
  piece(x, ellipsePts(cx, cy, 13, 12), 0xffa94a, `${seed}-mid`, { small: true, noShadow: true });
  for (let i = 0; i < 6; i++) {
    const a = turn + (i / 6) * Math.PI * 2;
    spot(x, cx + Math.cos(a) * 19, cy + Math.sin(a) * 19, 3, 3, hexCss(0xffe9a0));
  }
}

function drawCrown(x: Ctx) {
  const c: Pt = [206, 122];
  const flowers: [number, number, number][] = [
    [54, 128, PETAL.pink],
    [130, 52, PETAL.yellow],
    [270, 54, PETAL.purple],
    [360, 128, PETAL.pink],
    [272, 194, PETAL.yellow],
    [138, 190, PETAL.purple],
  ];
  // Two leaves between each pair of flowers, pointing out of the ring.
  flowers.forEach(([ax, ay], i) => {
    const [bx, by] = flowers[(i + 1) % flowers.length];
    const m: Pt = [(ax + bx) / 2, (ay + by) / 2];
    const out = Math.atan2(m[1] - c[1], m[0] - c[0]);
    [-0.75, 0.75].forEach((d, j) => {
      const a = out + d;
      const root: Pt = [m[0] - Math.cos(out) * 8, m[1] - Math.sin(out) * 8];
      piece(
        x,
        almondPts(root, [root[0] + Math.cos(a) * 62, root[1] + Math.sin(a) * 62], 32),
        LEAF,
        `crown-leaf${i}${j}`,
        {
          amp: 2,
        },
      );
      line(x, [root, [root[0] + Math.cos(a) * 46, root[1] + Math.sin(a) * 46]], shade(LEAF, 0.28), 2.5);
    });
  });
  flowers.forEach(([fx, fy, col], i) => flower(x, fx, fy, col, `crown-flower${i}`, i * 0.7));
}

// ---- Scarf: a striped ring seen from above (its hole on the anchor) and two tails hanging down at the right.
const SCARF = 0xf44f52;
const STRIPE = 0xfb8c48;

function tail(x: Ctx, pts: Pt[], seed: string, stripes: [number, number][], fringe: Pt[]) {
  const p = piece(x, pts, SCARF, seed);
  within(x, p, () => {
    x.fillStyle = hexCss(STRIPE);
    for (const [a, b] of stripes) x.fillRect(0, a, 400, b - a);
  });
  outline(x, p, shade(SCARF, 0.38));
  for (const [fx, fy] of fringe)
    line(
      x,
      [
        [fx, fy],
        [fx - 2, fy + 18],
      ],
      shade(SCARF, 0.45),
      2.5,
    );
}

function drawScarf(x: Ctx) {
  tail(
    x,
    [
      [262, 160],
      [322, 150],
      [340, 200],
      [356, 244],
      [348, 264],
      [300, 272],
      [284, 236],
      [268, 196],
    ],
    'scarf-tail0',
    [[210, 238]],
    [
      [318, 236],
      [332, 232],
    ],
  );
  tail(
    x,
    [
      [196, 180],
      [258, 176],
      [268, 236],
      [274, 290],
      [258, 314],
      [212, 316],
      [176, 302],
      [186, 244],
    ],
    'scarf-tail1',
    [[226, 262]],
    [
      [206, 274],
      [222, 276],
    ],
  );

  // The far side of the ring, its darker inner wall, the hole cut through, then the near roll over it all.
  const back = piece(x, ellipsePts(184, 78, 166, 70), SCARF, 'scarf-back', { amp: 3, noOutline: true });
  within(x, back, () => {
    x.fillStyle = hexCss(STRIPE);
    x.fillRect(86, 0, 26, 80);
    x.fillRect(256, 0, 42, 80);
  });
  outline(x, back, shade(SCARF, 0.38));
  const wall = softPath(ellipsePts(184, 66, 120, 44), 1.5, 'scarf-wall');
  x.fillStyle = hexCss(0xc9323f);
  x.fill(wall);
  within(x, wall, () => {
    x.fillStyle = hexCss(0xd8603a);
    x.fillRect(96, 0, 22, 200);
    x.fillRect(252, 0, 40, 200);
  });
  outline(x, wall, shade(SCARF, 0.45), true);
  const hole = softPath(ellipsePts(186, 90, 78, 18), 1, 'scarf-hole');
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.fill(hole);
  x.restore();
  const roll: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = Math.PI * (i / 16); // the near edge of the hole, right to left
    roll.push([184 + 120 * Math.cos(t), 70 + 38 * Math.sin(t)]);
  }
  for (let i = 0; i <= 20; i++) {
    const t = Math.PI * (1 - i / 20); // round the bottom of the roll, left to right
    roll.push([182 + 168 * Math.cos(t), 104 + 88 * Math.sin(t)]);
  }
  roll.push([340, 76]);
  const front = piece(x, roll, SCARF, 'scarf-roll', { amp: 3, noOutline: true });
  within(x, front, () => {
    x.fillStyle = hexCss(STRIPE);
    for (const [l, r] of [
      [54, 100],
      [212, 262],
      [312, 334],
    ])
      x.fillRect(l, 0, r - l, 400);
  });
  outline(x, front, shade(SCARF, 0.38));
}

// ---- Sun hat: a straw dome with a pink band (its lower edge on the anchor) over a wide brim curled up at the left.
const STRAW = 0xfdd57a;
const UNDER = 0xe8a95c;
const BAND = 0xf98aab;

function drawSunhat(x: Ctx) {
  const brim: Pt[] = [
    ...curve([14, 168], [60, 128], [150, 132]),
    ...curve([170, 128], [320, 70], [404, 92]),
    ...curve([414, 120], [400, 200], [320, 226]),
    ...curve([260, 232], [210, 220], [186, 204]),
    ...curve([150, 222], [60, 226], [18, 196]),
  ];
  const b = piece(x, brim, STRAW, 'sunhat-brim', { amp: 3 });
  // The curled-up left brim shows its shady underside.
  within(x, b, () =>
    flat(
      x,
      [...curve([12, 164], [80, 146], [186, 206]), [150, 230], [60, 236], [0, 210]],
      hexCss(UNDER),
      'sunhat-under',
    ),
  );
  line(x, curve([18, 166], [96, 140], [188, 206]), shade(STRAW, 0.38), 5);
  for (const [a, c, e] of [
    [
      [240, 170],
      [300, 160],
      [370, 120],
    ],
    [
      [250, 200],
      [320, 196],
      [380, 160],
    ],
    [
      [50, 196],
      [100, 210],
      [150, 206],
    ],
  ] as Pt[][])
    line(x, curve(a, c, e, 8), shade(STRAW, 0.16), 2.5);
  outline(x, b, shade(STRAW, 0.38));

  // The dome: a round top down to the band's lower edge.
  const dome: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = Math.PI * (1 + i / 20);
    dome.push([205 + 102 * Math.cos(t), 100 + 92 * Math.sin(t)]);
  }
  dome.push(...curve([306, 108], [210, 160], [102, 130], 8));
  piece(x, dome, STRAW, 'sunhat-dome', { amp: 3 });
  for (const [a, c, e] of [
    [
      [140, 40],
      [200, 26],
      [250, 34],
    ],
    [
      [130, 72],
      [210, 60],
      [280, 70],
    ],
  ] as Pt[][])
    line(x, curve(a, c, e, 8), shade(STRAW, 0.16), 2.5);
  piece(
    x,
    [...curve([100, 98], [200, 116], [298, 68]), ...curve([306, 108], [210, 160], [102, 130])],
    BAND,
    'sunhat-band',
    { amp: 2 },
  );
}

// ---- Sunglasses: two round orange frames seen from the front-left, the bridge between them on the anchor.
const FRAME = 0xff8a3c;
const LENS = 0x6cc2fc;

function drawSunglasses(x: Ctx) {
  // The far arm, behind everything.
  piece(
    x,
    [
      [212, 28],
      [236, 10],
      [346, 36],
      [356, 58],
      [322, 60],
      [246, 40],
      [234, 54],
      [214, 52],
    ],
    FRAME,
    'glasses-arm1',
    { amp: 1.5 },
  );
  piece(
    x,
    [
      [22, 57],
      [128, 88],
      [124, 116],
      [38, 82],
      [32, 102],
      [20, 110],
      [10, 102],
      [10, 70],
    ],
    FRAME,
    'glasses-arm0',
    { amp: 1.5 },
  );
  piece(
    x,
    [...curve([236, 84], [264, 70], [296, 74]), ...curve([298, 102], [266, 96], [238, 112])],
    FRAME,
    'glasses-bridge',
    {
      amp: 1.5,
    },
  );
  for (const [cx, cy, rx, ry, lx, ly, lrx, lry, i] of [
    [342, 106, 62, 68, 344, 107, 48, 56, 1],
    [186, 128, 67, 70, 192, 129, 52, 57, 0],
  ]) {
    piece(x, ellipsePts(cx, cy, rx, ry), FRAME, `glasses-frame${i}`, { amp: 1.2 });
    piece(x, ellipsePts(lx, ly, lrx, lry), LENS, `glasses-lens${i}`, { amp: 0.8, noShadow: true });
    spot(x, lx - lrx * 0.35, ly - lry * 0.45, lrx * 0.24, lry * 0.16, 'rgba(255,255,255,0.75)');
    spot(x, lx + lrx * 0.45, ly + lry * 0.5, 5, 4, 'rgba(255,255,255,0.6)');
  }
}

// ---- Raincoat: a yellow coat with its hood up behind, a sleeve reaching out at the left; the collar on the anchor.
const COAT = 0xfdcb3c;
const LINING = 0xdc9128;
const BUTTON = 0x744234;

function drawRaincoat(x: Ctx) {
  piece(
    x,
    [
      [276, 86],
      [320, 140],
      [366, 156],
      [372, 196],
      [346, 226],
      [318, 230],
      [298, 186],
    ],
    COAT,
    'coat-sleeve1',
  );
  piece(
    x,
    [
      [66, 245],
      [100, 140],
      [150, 66],
      [262, 96],
      [284, 86],
      [318, 200],
      [330, 276],
      [290, 294],
      [200, 307],
      [110, 298],
      [58, 276],
    ],
    COAT,
    'coat-body',
  );
  line(x, curve([256, 104], [268, 200], [288, 290]), shade(COAT, 0.4), 4);
  line(x, curve([70, 268], [200, 290], [322, 268]), shade(COAT, 0.22), 3);
  // The hood behind the collar, open towards us.
  piece(
    x,
    [
      [22, 100],
      [30, 52],
      [70, 28],
      [110, 20],
      [118, 8],
      [200, 8],
      [262, 36],
      [290, 62],
      [284, 88],
      [264, 104],
      [236, 98],
      [200, 76],
      [140, 62],
      [100, 80],
      [70, 138],
    ],
    COAT,
    'coat-hood',
  );
  piece(
    x,
    [
      [112, 24],
      [200, 18],
      [252, 44],
      [268, 96],
      [234, 86],
      [194, 60],
      [140, 46],
      [108, 42],
    ],
    LINING,
    'coat-hood-in',
    { noShadow: true, amp: 2 },
  );
  // The near sleeve, its open cuff showing the lining.
  piece(
    x,
    [
      [150, 62],
      [166, 150],
      [140, 210],
      [110, 250],
      [60, 246],
      [18, 214],
      [24, 184],
      [60, 170],
      [96, 120],
      [118, 74],
    ],
    COAT,
    'coat-sleeve0',
  );
  line(x, curve([30, 180], [70, 172], [104, 248]), shade(COAT, 0.3), 3);
  piece(x, ellipsePts(56, 220, 42, 23, 0.55), LINING, 'coat-cuff', { noShadow: true, amp: 1.5 });
  for (const [bx, by, r] of [
    [252, 142, 18],
    [262, 212, 16],
  ]) {
    piece(x, ellipsePts(bx, by, r, r * 1.05), BUTTON, `coat-button${bx}`, { small: true });
    spot(x, bx - r * 0.3, by, 2.6, 4, hexCss(0x2e1a14));
    spot(x, bx + r * 0.3, by, 2.6, 4, hexCss(0x2e1a14));
  }
}

// ---- Umbrella: a dotted blue canopy tipped to the left, its grip above the hook on the anchor.
const CANOPY = 0x6fa8f5;
const INSIDE = 0x4e74c0;
const HANDLE = 0x5b95ec;

function drawUmbrella(x: Ctx) {
  const top = [...curve([16, 240], [20, 22], [250, 12], 18), ...curve([300, 10], [360, 30], [392, 92], 8)];
  piece(
    x,
    [
      ...top,
      ...curve([392, 92], [370, 140], [343, 150], 5),
      ...curve([300, 190], [190, 200], [104, 250], 10),
    ],
    INSIDE,
    'umbrella-under',
    { amp: 2 },
  );
  // The shaft and the hook below it.
  line(
    x,
    [
      [204, 146],
      [252, 262],
    ],
    shade(0xdcd2ca, 0.4),
    12,
  );
  line(
    x,
    [
      [204, 146],
      [252, 262],
    ],
    hexCss(0xdcd2ca),
    7,
  );
  const hook: Pt[] = [
    [244, 250],
    [256, 280],
    [264, 300],
    [282, 314],
    [300, 304],
    [306, 286],
    [303, 274],
  ];
  x.save();
  x.shadowColor = 'rgba(45,30,20,0.32)';
  x.shadowBlur = 6;
  x.shadowOffsetY = 4;
  line(x, hook, shade(HANDLE, 0.38), 28);
  x.restore();
  line(x, hook, hexCss(HANDLE), 20);
  const canopy = piece(
    x,
    [
      ...top,
      ...curve([392, 92], [330, 92], [287, 130], 6),
      ...curve([287, 130], [180, 150], [122, 198], 8),
      ...curve([122, 198], [60, 210], [16, 240], 6),
    ],
    CANOPY,
    'umbrella-top',
    { amp: 2 },
  );
  within(x, canopy, () => {
    for (const [dx, dy, rx, ry] of [
      [70, 118, 22, 25],
      [34, 192, 15, 22],
      [156, 136, 26, 23],
      [210, 72, 27, 20],
      [280, 38, 23, 17],
      [354, 70, 18, 16],
    ])
      flat(x, ellipsePts(dx, dy, rx, ry), hexCss(0xfdf8ef), `umbrella-dot${dx}`);
  });
  outline(x, canopy, shade(CANOPY, 0.38));
  line(x, curve([142, 24], [104, 100], [122, 198]), shade(CANOPY, 0.4), 3.5);
  line(x, curve([142, 24], [250, 40], [287, 130]), shade(CANOPY, 0.4), 3.5);
  line(x, curve([104, 248], [108, 220], [122, 198]), shade(INSIDE, 0.4), 3);
  line(x, curve([343, 150], [320, 120], [310, 110]), shade(INSIDE, 0.4), 3);
  piece(x, ellipsePts(142, 20, 9, 14, -0.4), HANDLE, 'umbrella-knob', { small: true });
  for (const [tx, ty] of [
    [16, 240],
    [104, 248],
    [122, 198],
    [287, 130],
    [343, 150],
    [392, 92],
  ])
    piece(x, ellipsePts(tx, ty, 8, 8), HANDLE, `umbrella-tip${tx}`, { small: true, amp: 0.8 });
}

// ---- Beanie: a purple knitted hat with a fluffy cream pom-pom; the brim's opening on the anchor.
const KNIT = 0xc39ae7;
const POM = 0xfdf1dc;

function drawBeanie(x: Ctx) {
  piece(x, ring(130, 76, 58, 11, 10), POM, 'beanie-pom', { amp: 2 });
  spot(x, 114, 58, 26, 18, 'rgba(255,255,255,0.6)');
  const dome = piece(
    x,
    ellipsePts(185, 248, 160, 142).map(([px, py]) => [px, Math.min(py, 268)] as Pt),
    KNIT,
    'beanie-dome',
  );
  within(x, dome, () => {
    for (const k of [-3, -2, -1, 0, 1, 2, 3])
      line(x, curve([185 + k * 30, 110], [185 + k * 44, 180], [185 + k * 50, 270], 8), shade(KNIT, 0.3), 3);
  });
  // The turned-up cuff, and the dark inside of the brim under it.
  piece(
    x,
    [
      [42, 330],
      [180, 296],
      [320, 286],
      [330, 300],
      [210, 322],
      [64, 348],
    ],
    0x8a5eb3,
    'beanie-inside',
    { noShadow: true, amp: 1.5 },
  );
  const cuff = piece(
    x,
    [
      ...curve([10, 274], [160, 208], [334, 212], 14),
      [346, 240],
      [342, 284],
      ...curve([320, 292], [150, 300], [40, 342], 12),
      [14, 330],
      [8, 300],
    ],
    KNIT,
    'beanie-cuff',
  );
  within(x, cuff, () => {
    for (let i = 1; i < 9; i++) {
      const bx = 10 + i * 37;
      line(
        x,
        [
          [bx, 300 - bx * 0.28],
          [bx + 4, 345 - bx * 0.18],
        ],
        shade(KNIT, 0.3),
        3,
      );
    }
  });
}

// ---- Boot: a red welly standing on its sole (the anchor).
const BOOT = 0xf33c40;
const SOLE = 0xb2262d;

function drawBoot(x: Ctx) {
  piece(
    x,
    [
      [12, 22],
      [134, 22],
      [124, 44],
      [124, 120],
      [132, 140],
      [164, 150],
      [178, 166],
      [178, 186],
      [16, 186],
      [22, 120],
      [16, 44],
    ],
    BOOT,
    'boot-shaft',
  );
  spot(x, 36, 90, 7, 34, 'rgba(255,255,255,0.35)');
  piece(x, ellipsePts(73, 22, 63, 13), BOOT, 'boot-rim', { amp: 1.5, noShadow: true });
  piece(x, ellipsePts(73, 21, 53, 7), 0xbf2228, 'boot-in', { amp: 0.8, noShadow: true, small: true });
  piece(
    x,
    [
      [10, 176],
      [178, 172],
      [184, 186],
      [180, 202],
      [158, 207],
      [146, 202],
      [124, 207],
      [110, 202],
      [90, 207],
      [76, 202],
      [56, 207],
      [42, 202],
      [16, 206],
      [8, 190],
    ],
    SOLE,
    'boot-sole',
    { amp: 1 },
  );
}

// ---- Mitten: a green mitten with its thumb at the right and a cream ribbed cuff; the palm on the anchor.
const WOOL = 0x7ec26d;
const CUFF = 0xf6e5bd;

function drawMitten(x: Ctx) {
  const hand = pieceUnion(
    x,
    [ellipsePts(82, 100, 64, 92), ellipsePts(162, 128, 24, 50, 0.55)],
    WOOL,
    'mitten-hand',
    3,
  );
  within(x, hand, () => {
    for (const k of [-2, -1, 0, 1])
      line(x, curve([82 + k * 26, 14], [82 + k * 34, 90], [82 + k * 28, 180], 8), shade(WOOL, 0.3), 3);
    line(x, curve([150, 100], [158, 150], [150, 180], 6), shade(WOOL, 0.3), 3);
  });
  line(x, curve([138, 92], [146, 130], [140, 172], 6), shade(WOOL, 0.38), 3.5);
  const cuff = piece(
    x,
    [
      [22, 176],
      [100, 170],
      [168, 174],
      [176, 200],
      [172, 244],
      [150, 254],
      [100, 256],
      [42, 254],
      [20, 242],
      [16, 204],
    ],
    CUFF,
    'mitten-cuff',
    { amp: 2.5 },
  );
  within(x, cuff, () => {
    for (let i = 1; i < 8; i++)
      line(
        x,
        [
          [16 + i * 20, 182],
          [16 + i * 20, 250],
        ],
        shade(CUFF, 0.22),
        3,
      );
  });
}

const DRAW: Record<File, (x: Ctx) => void> = {
  crown: drawCrown,
  scarf: drawScarf,
  sunhat: drawSunhat,
  sunglasses: drawSunglasses,
  raincoat: drawRaincoat,
  umbrella: drawUmbrella,
  beanie: drawBeanie,
  boot: drawBoot,
  mitten: drawMitten,
};

/** Draws the nine items into mipmapped textures the size of their prepared sprites (at twice the size, as the creatures). */
export function paperItems(): Record<File, Texture> {
  const out = {} as Record<File, Texture>;
  for (const id of WEARABLES) {
    const { file, width, height } = ITEM_ART[id];
    if (out[file]) continue;
    const c = document.createElement('canvas');
    c.width = width * 2;
    c.height = height * 2;
    const x = c.getContext('2d')!;
    x.scale(2, 2);
    DRAW[file](x);
    const t = new Texture({ source: new CanvasSource({ resource: c, resolution: 2 }) });
    t.source.autoGenerateMipmaps = true;
    t.source.updateMipmaps();
    out[file] = t;
  }
  return out;
}
