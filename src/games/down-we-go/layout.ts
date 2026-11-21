export interface Spot {
  x: number;
  y: number;
}

export interface DownLayout {
  /** The height of a knot's band of water. */
  band: number;
  seaTop: number;
  ropeX: number;
  knots: Spot[];
  /** Each knot's sun dial (display, 96 across) and its radius. */
  dials: Spot[];
  dialR: number;
  /** Ledges are targets: `w` × `h` boxes centered on each spot. */
  ledges: Spot[];
  ledge: { w: number; h: number };
  wallX: number;
  boat: Spot;
  needCard: Spot;
  lantern: number;
  /** Level 3's two answer plates (targets), stacked between the rope and the wall: Deeper above, Not as deep below. */
  plates: Spot[];
  plate: { w: number; h: number };
  /** Level 4's three dial cards (targets) down the right side where the ledges are not used. */
  cards: Spot[];
  card: { w: number; h: number };
  /** Level 3's logbook: the first cove's dials as small displays down the left edge. */
  logbook: Spot[];
  logR: number;
}

/**
 * Where Down We Go puts things, pure so a test can read it at every view (docs/definitions/down-we-go.md#screen-and-controls):
 * the boat strip on top, the rope down the left-centre with a knot per stop, a rock wall down the right with a ledge at each knot.
 * Returns null rather than squeeze a knot's band under 112 units.
 */
export function downLayout(v: { w: number; h: number }, knots: number): DownLayout | null {
  const seaTop = 150;
  const band = Math.min(150, Math.floor((v.h - seaTop - 24) / knots));
  if (band < 112) return null;
  const ropeX = v.w > v.h ? 330 : 300;
  const ys = Array.from({ length: knots }, (_, k) => seaTop + band * (k + 0.5));
  const mid = seaTop + (band * knots) / 2;
  return {
    band,
    seaTop,
    ropeX,
    knots: ys.map((y) => ({ x: ropeX, y })),
    dials: ys.map((y) => ({ x: ropeX - 135, y })),
    dialR: 48,
    ledges: ys.map((y) => ({ x: v.w - 110, y })),
    ledge: { w: 170, h: 110 },
    wallX: v.w - 215,
    boat: { x: ropeX, y: 80 },
    needCard: { x: v.w - 180, y: 80 },
    lantern: 110,
    plates: [-1, 1].map((d) => ({ x: Math.round((ropeX + v.w - 215) / 2), y: mid + d * 80 })),
    plate: { w: 170, h: 130 },
    cards: [-1, 0, 1].map((d) => ({ x: v.w - 110, y: mid + d * 165 })),
    card: { w: 150, h: 150 },
    logbook: ys.map((y) => ({ x: 62, y })),
    logR: 26,
  };
}
