import { Container, Graphics, Point } from 'pixi.js';
import { gaze } from '../engine/input';
import { cheek, ink, swatch, toward, type ColorName, type Swatch } from './palette';
import { densify, ellipsePoints, paperPoints, U } from './paper';
import { bodyPath } from './shapes';

export type Ears = 'round' | 'pointy' | 'floppy' | 'long' | 'big' | 'none';
export type Snout = 'none' | 'nose' | 'pig' | 'muzzle' | 'bill' | 'beak';
export type Mood = 'happy' | 'surprised' | 'sing' | 'sleepy' | 'sad' | 'calm';

/** Everything that makes one critter different from another. All parts share one body and face. */
export interface CritterSpec {
  color: ColorName;
  /** A body colour outside the palette's names (Size Parade's shades); `color` still names its family. */
  shade?: Swatch;
  ears?: Ears;
  earColor?: ColorName;
  snout?: Snout;
  noseColor?: number;
  feet?: ColorName | 'hoof';
  belly?: boolean;
  spots?: boolean;
  horns?: boolean;
  sprout?: boolean;
  tuft?: boolean;
  /** `true`: a bird's little feathered wings. 'membrane': a bat's skin wings, scalloped between the finger bones. */
  wings?: boolean | 'membrane';
  whiskers?: boolean;
  /** A sheep's fleece: puffs all round the body and a curl on top. */
  wool?: boolean;
  /** A horse's dark mane on top of the head and a forelock over the brow. */
  mane?: boolean;
  /** A hen's red comb on top and wattle under the beak. */
  comb?: boolean;
  /** A mouse's long thin curling tail. */
  tail?: boolean;
  /** A muzzle colour other than the cow's pink (the horse's tan). */
  muzzleShade?: { fill: number; line: number; dark: number };
  /**
   * A species' own cut: its silhouette, eyes and the small things that tell it apart (a bear's muzzle patch, a cat's
   * stripes and tail, a bunny's chest fluff and tail puff, a chick's feather tuft, a pig's curly tail). Without one
   * the critter keeps the shared soft-toy body. The face keeps its places (eyes, nose, cheeks, ears), so games that
   * point at parts still land on them.
   */
  form?: Form;
}

export type Form =
  'bear' | 'cat' | 'bunny' | 'chick' | 'cow' | 'pig' | 'dog' | 'sheep' | 'horse' | 'hen' | 'mouse' | 'pip';

/** Body colours the palette's names lack; `color` names each one's family. */
const CHESTNUT: Swatch = { fill: 0xb8774a, line: 0x7d4a2a, light: 0xe8c3a3 };
const RUSSET: Swatch = { fill: 0xe0844e, line: 0xa8552c, light: 0xf8d0b2 };
const MOUSE_GREY: Swatch = { fill: 0xbcbccc, line: 0x7c7c90, light: 0xe6e6f0 };
const TAN_MUZZLE = { fill: 0xecd2b8, line: 0x9c6b4a, dark: 0x6e4224 };
const FLEECE: Swatch = { fill: 0xfffaf0, line: 0x9c9484, light: 0xffffff };

export const CRITTERS = {
  pip: { color: 'teal', ears: 'round', sprout: true, belly: true, form: 'pip' },
  cow: {
    color: 'white',
    ears: 'floppy',
    snout: 'muzzle',
    spots: true,
    horns: true,
    feet: 'hoof',
    form: 'cow',
  },
  duck: { color: 'yellow', snout: 'bill', tuft: true, wings: true, feet: 'orange', form: 'chick' },
  pig: { color: 'pink', ears: 'pointy', snout: 'pig', form: 'pig' },
  cat: {
    color: 'orange',
    ears: 'pointy',
    snout: 'nose',
    noseColor: 0xff8fa3,
    whiskers: true,
    belly: true,
    form: 'cat',
  },
  bear: { color: 'brown', ears: 'round', snout: 'nose', noseColor: ink, belly: true, form: 'bear' },
  dog: {
    color: 'brown',
    ears: 'floppy',
    earColor: 'orange',
    snout: 'nose',
    noseColor: ink,
    belly: true,
    form: 'dog',
  },
  bunny: { color: 'white', ears: 'long', snout: 'nose', noseColor: 0xff8fa3, whiskers: true, form: 'bunny' },
  sheep: {
    color: 'white',
    shade: FLEECE,
    ears: 'floppy',
    snout: 'nose',
    noseColor: ink,
    wool: true,
    feet: 'hoof',
    form: 'sheep',
  },
  horse: {
    color: 'brown',
    shade: CHESTNUT,
    ears: 'pointy',
    snout: 'muzzle',
    muzzleShade: TAN_MUZZLE,
    mane: true,
    feet: 'hoof',
    form: 'horse',
  },
  hen: {
    color: 'orange',
    shade: RUSSET,
    snout: 'beak',
    comb: true,
    wings: true,
    feet: 'yellow',
    form: 'hen',
  },
  mouse: {
    color: 'white',
    shade: MOUSE_GREY,
    ears: 'big',
    snout: 'nose',
    noseColor: 0xff8fa3,
    whiskers: true,
    tail: true,
    belly: true,
    form: 'mouse',
  },
} satisfies Record<string, CritterSpec>;

export type CritterName = keyof typeof CRITTERS;
/**
 * The first eight critters, in their original order. Games that deal from the whole cast use this, so critters added
 * later (the farm four) never change a seed's friends or appear where their art was not checked.
 */
export const FIRST_CAST: CritterName[] = ['pip', 'cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];

const MOUTH_DARK = 0x7a2e3e;
const MUZZLE = { fill: 0xf7b6c2, line: 0xd98597, dark: 0xc06c80 };
const HORN = { fill: 0xf4d9a6, line: 0xc9a86a };
const HOOF = { fill: 0x8c7b6b, line: 0x5e5248 };
const MANE = { fill: 0x5a3420, line: 0x3a2014 };
const BEAK = swatch.yellow;
const TAIL = 0xf7a8b8;

type Pt = [number, number];

/** The body outline (`bodyPath` at its default size) as points, for drawing it as paper on purpose. */
function bodyPoints(): Pt[] {
  const segs: Pt[][] = [
    [
      [0, -250],
      [100, -250],
      [130, -160],
      [130, -100],
    ],
    [
      [130, -100],
      [130, -30],
      [80, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [-80, 0],
      [-130, -30],
      [-130, -100],
    ],
    [
      [-130, -100],
      [-130, -160],
      [-100, -250],
      [0, -250],
    ],
  ];
  const out: Pt[] = [];
  for (const [p0, p1, p2, p3] of segs)
    for (let k = 0; k < 16; k++) {
      const t = k / 16,
        u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  return out;
}

/**
 * Each form's pieces, body first and head last, as ellipses [cx, cy, rx, ry]: a head cut separately and laid over the
 * body reads as an animal, not a bean. The face keeps its places, so every head covers the eyes, nose and mouth.
 */
const PIECES: Record<Form, [number, number, number, number][]> = {
  // A big round head on a chunky body.
  bear: [
    [0, -56, 114, 60],
    [0, -158, 118, 96],
  ],
  // A wide face with fluffed cheeks, on a slimmer body.
  cat: [
    [0, -52, 86, 54],
    [0, -160, 128, 90],
  ],
  // A smaller head on a big sitting bottom.
  bunny: [
    [0, -58, 124, 62],
    [0, -168, 100, 86],
  ],
  // One egg.
  chick: [[0, -127, 130, 128]],
  // A wide, long head on a smaller body.
  cow: [
    [0, -48, 98, 50],
    [0, -150, 130, 102],
  ],
  // One round pudding, wider than tall.
  pig: [[0, -120, 140, 120]],
  // A broad head over a sitting body, a little longer than the bear's.
  dog: [
    [0, -52, 106, 56],
    [0, -156, 124, 94],
  ],
  // A big round fleece (the wool puffs ring it); the face is its own darker piece on top.
  sheep: [[0, -116, 128, 116]],
  // A long, narrow head on a deep chest.
  horse: [
    [0, -46, 108, 50],
    [0, -150, 104, 104],
  ],
  // A taller, narrower egg than the chick's.
  hen: [[0, -130, 118, 130]],
  // A round head with room for big ears, on a small pear body.
  mouse: [
    [0, -50, 92, 52],
    [0, -152, 110, 94],
  ],
  // The pet: a round head on a soft round body.
  pip: [
    [0, -56, 110, 58],
    [0, -160, 120, 92],
  ],
};

/** A darker or lighter step of a colour, for markings cut from a neighbouring sheet. */
const shade = (c: number, t: number) => toward(c, t < 0 ? 0xffffff : 0x1d1a22, Math.abs(t));

/**
 * The paper pass's default torn edge (4.4 units) makes a big soft body look lumpy and nicks the tips of small pointed
 * ears, so the body and pointy ears are drawn as paper here with a gentler edge.
 */
const BODY_AMP = 0.7 * U;
const EAR_AMP = 0.4 * U;

const stroke = (color: number, width = 6) => ({
  width,
  color,
  join: 'round' as const,
  cap: 'round' as const,
});

/**
 * A living soft-toy creature, standing with its feet on (0, 0), about 250 units tall at scale 1.
 * It breathes, blinks, follows the last finger with its eyes, squashes when poked and hops.
 * Call `update(dt)` every frame (scenes do this for anything they `track`).
 */
export class Critter extends Container {
  readonly spec: CritterSpec;
  readonly sw: Swatch;
  /** False freezes the critter (stickers, thumbnails). */
  alive = true;

  private readonly body = new Container();
  private readonly face = new Container();
  private readonly eyes: Container[] = [];
  private readonly pupils: Container[] = [];
  private readonly lids: Graphics[] = [];
  private readonly mouth = new Graphics();
  /** Brows and a tear: only some moods draw anything here. */
  private readonly brows = new Graphics();
  private readonly eyeX: number;
  private readonly eyeY: number;
  private readonly mouthAt: { x: number; y: number; color: number } | null;

  private mood: Mood = 'happy';
  private restingMood: Mood = 'happy';
  private moodLeft = 0;
  private squash = 0;
  private squashV = 0;
  private hopY = 0;
  private hopV = 0;
  private clock = Math.random() * 10;
  private blinkIn = 1 + Math.random() * 3;
  private blinkT = -1;
  private readonly look = { x: 0, y: 0 };
  private readonly wander = { x: 0, y: 0, next: 0 };
  private readonly gazePoint = new Point();
  private readonly localPoint = new Point();

  constructor(spec: CritterSpec) {
    super();
    this.spec = spec;
    this.sw = spec.shade ?? swatch[spec.color];
    this.eyeY = spec.snout === 'muzzle' ? -150 : -142;
    this.eyeX = spec.snout === 'muzzle' ? 35 : 40;
    this.mouthAt =
      spec.snout === 'bill' || spec.snout === 'beak'
        ? null
        : spec.snout === 'muzzle'
          ? { x: 0, y: -48, color: (spec.muzzleShade ?? MUZZLE).dark }
          : spec.snout === 'pig'
            ? { x: 0, y: -70, color: ink }
            : { x: 0, y: -88, color: ink };
    this.addChild(this.body);
    this.buildBack();
    this.buildBody();
    this.buildFace();
    this.drawMood();
  }

  /** Adds something that rides on the body (it squashes and hops along), in body coordinates. */
  attach(child: Container) {
    this.body.addChild(child);
  }

  /** A surprised squish. */
  poke() {
    this.squashV += 4;
    this.setMood('surprised', 0.6);
  }

  hop(power = 1) {
    if (this.hopY < 0) return;
    this.hopV = -520 * power;
    this.squashV -= 2;
  }

  cheer() {
    this.hop(1.1);
    this.setMood('happy', 1);
  }

  /** The mood showing right now. */
  get currentMood(): Mood {
    return this.mood;
  }

  /** With `seconds`, the mood is temporary and the critter returns to its resting mood after. */
  setMood(mood: Mood, seconds = 0) {
    if (seconds > 0) {
      this.moodLeft = seconds;
    } else {
      this.restingMood = mood;
      this.moodLeft = 0;
    }
    if (mood !== this.mood) {
      this.mood = mood;
      this.drawMood();
    }
  }

  update(dt: number) {
    if (!this.alive) return;
    this.clock += dt;

    // Squash-and-stretch spring.
    this.squashV += (-180 * this.squash - 9 * this.squashV) * dt;
    this.squash += this.squashV * dt;

    // Hop under gravity, landing with a squish.
    if (this.hopY < 0 || this.hopV < 0) {
      this.hopV += 2400 * dt;
      this.hopY += this.hopV * dt;
      if (this.hopY >= 0) {
        this.hopY = 0;
        this.hopV = 0;
        this.squashV += 2.2;
      }
    }

    const sleepy = this.mood === 'sleepy';
    const breathe = sleepy ? 0.03 * Math.sin(this.clock * 1.6) : 0.015 * Math.sin(this.clock * 2.4);
    this.body.scale.set(1 + this.squash - breathe * 0.5, 1 - this.squash + breathe);
    this.body.y = this.hopY;

    if (this.moodLeft > 0) {
      this.moodLeft -= dt;
      if (this.moodLeft <= 0) this.setMood(this.restingMood);
    }

    // Blink every few seconds.
    if (!sleepy) {
      this.blinkIn -= dt;
      if (this.blinkIn <= 0 && this.blinkT < 0) {
        this.blinkT = 0;
        this.blinkIn = Math.random() < 0.2 ? 0.25 : 1.5 + Math.random() * 4;
      }
    }
    let lid = 1;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const p = this.blinkT / 0.16;
      if (p >= 1) this.blinkT = -1;
      else lid = 1 - 0.9 * Math.sin(Math.PI * p);
    }
    const wide = this.mood === 'surprised' ? 1.15 : 1;
    for (const e of this.eyes) e.scale.set(wide, wide * lid);

    // Look at the last touch; otherwise let the eyes wander.
    let tx = this.wander.x;
    let ty = this.wander.y;
    if (performance.now() - gaze.at < 2500) {
      this.gazePoint.set(gaze.x, gaze.y);
      const p = this.face.toLocal(this.gazePoint, undefined, this.localPoint);
      const dx = p.x;
      const dy = p.y - this.eyeY;
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(8, d * 0.04);
      tx = (dx / d) * m;
      ty = (dy / d) * m;
      // A critter scaled to zero (popping in) has no inverse transform; don't let NaN stick in its eyes.
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) tx = ty = 0;
    } else if (this.clock > this.wander.next) {
      this.wander.next = this.clock + 1.5 + Math.random() * 2.5;
      const a = Math.random() * Math.PI * 2;
      const m = Math.random() * 6;
      this.wander.x = Math.cos(a) * m;
      this.wander.y = Math.sin(a) * m * 0.6;
    }
    const f = Math.min(1, dt * 12);
    if (!Number.isFinite(this.look.x) || !Number.isFinite(this.look.y)) this.look.x = this.look.y = 0;
    this.look.x += (tx - this.look.x) * f;
    this.look.y += (ty - this.look.y) * f;
    const k = this.spec.form ? 0.45 : 1;
    for (const p of this.pupils) p.position.set(this.look.x * k, 4 + this.look.y * k);
  }

  private buildBack() {
    const s = this.spec;
    const ear = s.earColor ? swatch[s.earColor] : this.sw;
    const back = new Graphics();
    this.body.addChild(back);
    if (s.form) this.formBack(s.form, back);

    if (s.sprout) {
      back.moveTo(0, -248).quadraticCurveTo(-8, -278, 10, -296).stroke(stroke(this.sw.line, 5));
      const leaf = new Graphics()
        .ellipse(0, 0, 15, 8)
        .fill(swatch.green.fill)
        .stroke(stroke(swatch.green.line, 4));
      leaf.position.set(20, -300);
      leaf.rotation = -0.52;
      this.body.addChild(leaf);
    }
    if (s.tuft && s.form) {
      // Three snipped feathers standing up off the crown.
      for (const [x, lean, h] of [
        [-14, -0.35, 30],
        [2, 0.05, 40],
        [18, 0.4, 30],
      ]) {
        const tip: Pt = [x + Math.sin(lean) * h, -244 - Math.cos(lean) * h];
        back
          .moveTo(x - 7, -240)
          .quadraticCurveTo(tip[0] - 10, (tip[1] - 240) / 2, tip[0], tip[1])
          .quadraticCurveTo(tip[0] + 10, (tip[1] - 240) / 2, x + 7, -240)
          .closePath()
          .fill(shade(this.sw.fill, 0.12));
      }
    } else if (s.tuft) {
      back.moveTo(-10, -234).quadraticCurveTo(-20, -260, -4, -268).stroke(stroke(this.sw.line, 5));
      back.moveTo(6, -234).quadraticCurveTo(10, -260, 26, -264).stroke(stroke(this.sw.line, 5));
    }
    if (s.tail) {
      back
        .moveTo(96, -34)
        .bezierCurveTo(170, -20, 196, -80, 160, -104)
        .bezierCurveTo(138, -118, 128, -92, 146, -84)
        .stroke(stroke(TAIL, 7));
    }
    if (s.wool) {
      // Puffs round the outline, drawn behind the body so only their outer edges show.
      for (let a = -0.35; a <= Math.PI + 0.36; a += 0.3) {
        back
          .circle(Math.cos(a) * 128, -112 - Math.sin(a) * 128, 34)
          .fill(this.sw.fill)
          .stroke(stroke(this.sw.line, 5));
      }
    }
    if (s.mane) {
      for (const x of [-46, -16, 16, 46])
        back
          .circle(x, -246 + Math.abs(x) * 0.25, 28)
          .fill(MANE.fill)
          .stroke(stroke(MANE.line, 5));
    }
    if (s.comb) {
      for (const [x, y, r] of [
        [-24, -252, 18],
        [0, -266, 22],
        [24, -252, 18],
      ])
        back.circle(x, y, r).fill(swatch.red.fill).stroke(stroke(swatch.red.line, 5));
    }
    if (s.horns) {
      for (const side of [-1, 1]) {
        back
          .moveTo(side * 60, -222)
          .quadraticCurveTo(side * 82, -258, side * 66, -276)
          .quadraticCurveTo(side * 48, -250, side * 38, -228)
          .closePath()
          .fill(HORN.fill)
          .stroke(stroke(HORN.line, 5));
      }
    }
    if (s.wings === 'membrane') {
      for (const side of [-1, 1]) {
        back
          .moveTo(side * 98, -150)
          .lineTo(side * 140, -200)
          .lineTo(side * 168, -122)
          .quadraticCurveTo(side * 150, -118, side * 148, -84)
          .quadraticCurveTo(side * 130, -86, side * 124, -52)
          .quadraticCurveTo(side * 108, -62, side * 96, -50)
          .closePath()
          .fill(this.sw.light)
          .stroke(stroke(this.sw.line, 5));
        back
          .moveTo(side * 140, -200)
          .lineTo(side * 148, -84)
          .moveTo(side * 140, -200)
          .lineTo(side * 124, -52)
          .stroke(stroke(this.sw.line, 3));
      }
    } else if (s.wings) {
      for (const side of [-1, 1]) {
        back
          .moveTo(side * 112, -104)
          .quadraticCurveTo(side * 152, -112, side * 142, -70)
          .quadraticCurveTo(side * 128, -48, side * 98, -64)
          .closePath()
          .fill(this.sw.fill)
          .stroke(stroke(this.sw.line, 5));
      }
    }
    for (const side of [-1, 1]) {
      switch (s.ears) {
        case 'round':
          back
            .circle(side * 72, -222, 34)
            .fill(ear.fill)
            .stroke(stroke(ear.line));
          back
            .circle(side * 72, -222, 16)
            .fill(s.form ? shade(ear.fill, 0.25) : { color: cheek, alpha: 0.7 });
          break;
        case 'pointy': {
          const tri = (flat: number[]): Pt[] =>
            densify(
              [0, 2, 4].map((i) => [side * flat[i], flat[i + 1]] as Pt),
              6 * U,
            );
          paperPoints(back, tri([30, -236, 88, -292, 112, -196]), ear.fill, {
            amp: EAR_AMP,
            seed: side,
          });
          // The inner ear lies flat inside the ear: no edge, shadow or outline of its own.
          paperPoints(back, tri([52, -232, 86, -268, 98, -214]), cheek, { flat: true, alpha: 0.7 });
          break;
        }
        case 'floppy': {
          const g = new Graphics()
            .ellipse(0, 0, 42, 19)
            .fill(ear.fill)
            .stroke(stroke(ear.line))
            .ellipse(side * 2, 0, 24, 8)
            .fill({ color: cheek, alpha: 0.7 });
          g.position.set(side * 112, -190);
          g.rotation = side * 0.38;
          this.body.addChild(g);
          break;
        }
        case 'big':
          back
            .circle(side * 92, -214, 52)
            .fill(ear.fill)
            .stroke(stroke(ear.line));
          back.circle(side * 92, -214, 32).fill({ color: cheek, alpha: 0.7 });
          break;
        case 'long': {
          const g = new Graphics()
            .ellipse(0, 0, 23, 64)
            .fill(ear.fill)
            .stroke(stroke(ear.line))
            .ellipse(0, 6, 10, 44)
            .fill({ color: cheek, alpha: 0.7 });
          g.position.set(side * 46, -292);
          g.rotation = side * 0.14;
          this.body.addChildAt(g, 0);
          break;
        }
        default:
          break;
      }
    }
  }

  /** The body as paper: a species' own pieces, or the shared soft-toy shape. */
  private drawBody(g: Graphics) {
    const form = this.spec.form;
    if (!form) return paperPoints(g, bodyPoints(), this.sw.fill, { amp: BODY_AMP, seed: 1 });
    PIECES[form].forEach(([x, y, rx, ry], i) =>
      paperPoints(g, ellipsePoints(x, y, rx, ry), this.sw.fill, { amp: BODY_AMP, seed: 1 + i }),
    );
    return g;
  }

  /** A mask the size of the body, for markings printed on it (the cow's patches). */
  private bodyMask(): Graphics {
    const form = this.spec.form;
    if (!form) return bodyPath(new Graphics()).fill(0xffffff);
    const m = new Graphics();
    for (const [x, y, rx, ry] of PIECES[form]) m.ellipse(x, y, rx, ry);
    return m.fill(0xffffff);
  }

  /** Pieces behind a species' body: tails. */
  private formBack(form: Form, back: Graphics) {
    const sw = this.sw;
    if (form === 'cat') {
      // A tail curling up past the right hip: a tapering cut piece, darker at the tip.
      back
        .moveTo(70, -22)
        .bezierCurveTo(130, -14, 160, -50, 156, -104)
        .quadraticCurveTo(156, -126, 140, -128)
        .quadraticCurveTo(136, -114, 140, -104)
        .bezierCurveTo(142, -62, 118, -40, 74, -44)
        .closePath()
        .fill(sw.fill);
      back
        .moveTo(156, -104)
        .quadraticCurveTo(156, -126, 140, -128)
        .quadraticCurveTo(136, -114, 140, -104)
        .closePath()
        .fill(shade(sw.fill, 0.22));
    } else if (form === 'bunny') {
      back.circle(124, -40, 26).fill(0xfffdf8);
    } else if (form === 'pig') {
      back
        .moveTo(126, -70)
        .bezierCurveTo(160, -80, 168, -40, 148, -36)
        .bezierCurveTo(132, -34, 134, -58, 152, -56)
        .stroke(stroke(shade(sw.fill, 0.2), 7));
    } else if (form === 'dog') {
      // A short tail up off the right hip, wagging-shaped.
      back
        .moveTo(84, -40)
        .quadraticCurveTo(140, -50, 150, -110)
        .quadraticCurveTo(160, -112, 160, -100)
        .quadraticCurveTo(150, -36, 90, -22)
        .closePath()
        .fill(shade(sw.fill, 0.08));
    } else if (form === 'hen') {
      // Tail feathers fanned up behind the right side, a darker russet.
      for (const [a, len] of [
        [-1.25, 96],
        [-0.95, 104],
        [-0.65, 92],
      ]) {
        const tip: Pt = [80 + Math.cos(a) * len, -110 + Math.sin(a) * len];
        back
          .moveTo(70, -96)
          .quadraticCurveTo(tip[0] - 26, tip[1] + 10, tip[0], tip[1])
          .quadraticCurveTo(tip[0] + 4, tip[1] + 36, 96, -70)
          .closePath()
          .fill(shade(sw.fill, 0.2));
      }
    } else if (form === 'horse') {
      // A swishing tail of three dark locks off the right hip.
      for (const dx of [0, 12, 24])
        back
          .moveTo(90, -60)
          .bezierCurveTo(140 + dx, -60, 150 + dx, -20, 136 + dx, 6)
          .quadraticCurveTo(128 + dx, -24, 96, -40)
          .closePath()
          .fill(MANE.fill);
    }
  }

  /** Markings on a species' front: a bear's muzzle patch, a cat's stripes, a bunny's chest fluff, a chick's feathers. */
  private formFront(form: Form) {
    const sw = this.sw;
    const g = new Graphics();
    if (form === 'bear') {
      paperPoints(g, ellipsePoints(0, -100, 38, 27), sw.light, { amp: 0.5 * U, seed: 3 });
    } else if (form === 'cat') {
      const dark = shade(sw.fill, 0.22);
      // Three forehead stripes, cut as tapering slivers.
      for (const [x, y, len, a] of [
        [-18, -246, 32, 0.12],
        [0, -248, 38, 0],
        [18, -246, 32, -0.12],
      ])
        g.moveTo(x - 6, y)
          .quadraticCurveTo(x + Math.sin(a) * len * 0.5 - 2, y + len * 0.6, x + Math.sin(a) * len, y + len)
          .quadraticCurveTo(x + Math.sin(a) * len * 0.5 + 2, y + len * 0.6, x + 6, y)
          .closePath()
          .fill(dark);
    } else if (form === 'bunny') {
      // A fluffy chest: a cream piece with a zigzag top.
      const pts: Pt[] = [];
      for (let i = 0; i <= 8; i++) pts.push([-56 + i * 14, i % 2 ? -78 : -68]);
      pts.push([62, -44], [40, -14], [0, -10], [-40, -14], [-62, -44]);
      paperPoints(g, pts, 0xf6ecdc, { amp: 0.5 * U, seed: 4 });
    } else if (form === 'chick') {
      // A few feather scallops on the tummy.
      const line = shade(sw.fill, 0.28);
      for (const [x, y] of [
        [-30, -50],
        [0, -42],
        [30, -50],
        [-15, -24],
        [15, -24],
      ])
        g.moveTo(x - 12, y)
          .quadraticCurveTo(x, y + 12, x + 12, y)
          .stroke(stroke(line, 3));
    } else if (form === 'dog') {
      // A darker patch round one eye.
      paperPoints(g, ellipsePoints(-44, -146, 36, 32), shade(sw.fill, 0.18), { amp: 0.5 * U, seed: 5 });
      paperPoints(g, ellipsePoints(0, -98, 40, 28), sw.light, { amp: 0.5 * U, seed: 6 });
    } else if (form === 'sheep') {
      // The face: a smooth, darker oval laid over the fleece.
      paperPoints(g, ellipsePoints(0, -132, 76, 92), 0xd9c8b4, { amp: 0.5 * U, seed: 7 });
    } else if (form === 'hen') {
      // Feather scallops down the breast.
      const line = shade(sw.fill, 0.25);
      for (const [x, y] of [
        [-30, -54],
        [0, -46],
        [30, -54],
        [-15, -26],
        [15, -26],
      ])
        g.moveTo(x - 12, y)
          .quadraticCurveTo(x, y + 12, x + 12, y)
          .stroke(stroke(line, 3));
    } else if (form === 'mouse') {
      paperPoints(g, ellipsePoints(0, -100, 36, 24), sw.light, { amp: 0.5 * U, seed: 8 });
    }
    this.body.addChild(g);
  }

  /** A species' eyes: small shiny beads (a cat's are amber, with slit pupils) instead of big white ovals. */
  private formEye(form: Form, eye: Container, pupil: Container, side: number) {
    if (form === 'cat') {
      eye.addChild(
        new Graphics()
          .moveTo(-20, 2)
          .quadraticCurveTo(0, -22, 20, -2)
          .quadraticCurveTo(0, 20, -20, 2)
          .closePath()
          .fill(0xf2c14e)
          .stroke(stroke(0x5a3a1a, 3)),
      );
      pupil.addChild(
        new Graphics().ellipse(0, -4, 5, 14).fill(ink),
        new Graphics().circle(4, -10, 3).fill(0xffffff),
      );
      return;
    }
    const r = form === 'bunny' ? 14 : form === 'cow' ? 13 : 12;
    pupil.addChild(
      new Graphics().ellipse(0, -4, r, r * 1.15).fill(ink),
      new Graphics().circle(r * 0.35, -4 - r * 0.45, r * 0.38).fill(0xffffff),
    );
    if (form === 'cow')
      // Lashes over each eye.
      eye.addChild(
        new Graphics()
          .moveTo(-side * 4, -22)
          .lineTo(-side * 8, -32)
          .moveTo(side * 6, -21)
          .lineTo(side * 12, -30)
          .stroke(stroke(ink, 3)),
      );
  }

  private buildBody() {
    const s = this.spec;
    const sw = this.sw;
    if (s.spots) {
      // The same gentle paper body as everyone else, with the patches printed flat on it (clipped to the body), so the
      // cow is not the one lumpy critter.
      this.body.addChild(this.drawBody(new Graphics()));
      const mask = this.bodyMask();
      const spots = new Graphics();
      for (const [x, y, rx, ry] of [
        [-86, -172, 44, 32],
        [112, -65, 36, 50],
        [62, -214, 20, 14],
      ])
        paperPoints(spots, ellipsePoints(x, y, rx, ry), 0x3d3d4d, { flat: true });
      spots.mask = mask;
      this.body.addChild(mask, spots);
      this.body.addChild(
        new Graphics()
          .moveTo(-18, -244)
          .quadraticCurveTo(-10, -270, 1, -250)
          .quadraticCurveTo(11, -272, 20, -244)
          .closePath()
          .fill(0x3d3d4d),
      );
    } else {
      this.body.addChild(this.drawBody(new Graphics()));
    }
    // A species' tummy sits on its own body piece, below the chin.
    if (s.belly)
      this.body.addChild(
        paperPoints(
          new Graphics(),
          s.form ? ellipsePoints(0, -40, 62, 32) : ellipsePoints(0, -65, 80, 54),
          sw.light,
          { amp: BODY_AMP, seed: 2 },
        ),
      );
    if (s.form) this.formFront(s.form);
    if (s.wool) {
      const curl = new Graphics();
      for (const [x, y, r] of [
        [-30, -238, 24],
        [0, -250, 26],
        [30, -238, 24],
      ])
        curl.circle(x, y, r).fill(sw.fill).stroke(stroke(sw.line, 5));
      this.body.addChild(curl);
    }
    if (s.mane) {
      // The forelock: three locks falling over the brow.
      const lock = new Graphics();
      for (const [x, lean] of [
        [-20, -6],
        [0, 0],
        [20, 6],
      ])
        lock
          .moveTo(x - 14, -246)
          .quadraticCurveTo(x + lean - 10, -224, x + lean, -206)
          .quadraticCurveTo(x + lean + 10, -224, x + 14, -246)
          .closePath()
          .fill(MANE.fill)
          .stroke(stroke(MANE.line, 4));
      this.body.addChild(lock);
    }

    const feet = s.feet === 'hoof' ? HOOF : s.feet ? swatch[s.feet] : this.sw;
    const f = new Graphics();
    for (const side of [-1, 1])
      f.ellipse(side * 40, 0, 30, 14)
        .fill(feet.fill)
        .stroke(stroke(feet.line, 6));
    this.body.addChild(f);
  }

  private buildFace() {
    const s = this.spec;
    const sw = this.sw;
    this.body.addChild(this.face);
    const eyeX = this.eyeX;

    for (const side of [-1, 1]) {
      const eye = new Container();
      eye.position.set(side * eyeX, this.eyeY);
      const pupil = new Container();
      if (s.form) this.formEye(s.form, eye, pupil, side);
      else {
        eye.addChild(new Graphics().ellipse(0, 0, 25, 29).fill(0xffffff).stroke(stroke(sw.line, 4)));
        pupil.addChild(
          new Graphics().circle(0, 0, 15).fill(ink),
          new Graphics().circle(5, -7, 5).fill(0xffffff),
        );
      }
      pupil.y = 4;
      eye.addChild(pupil);
      this.eyes.push(eye);
      this.pupils.push(pupil);

      const lid = new Graphics().moveTo(-17, -2).quadraticCurveTo(0, 12, 17, -2).stroke(stroke(ink, 5));
      lid.position.copyFrom(eye.position);
      lid.visible = false;
      this.lids.push(lid);
      this.face.addChild(eye, lid);
    }

    const g = new Graphics();
    // The shared soft toys keep their blush; a species' own cut does without (it read as a sticker).
    if (s.snout !== 'muzzle' && !s.form) {
      for (const side of [-1, 1]) g.ellipse(side * 74, -98, 16, 10).fill({ color: cheek, alpha: 0.55 });
    }
    if (s.whiskers) {
      for (const side of [-1, 1]) {
        g.moveTo(side * 58, -100)
          .lineTo(side * 106, -110)
          .stroke(stroke(sw.line, 3));
        g.moveTo(side * 58, -90)
          .lineTo(side * 106, -86)
          .stroke(stroke(sw.line, 3));
      }
    }
    switch (s.snout) {
      case 'nose':
        g.ellipse(0, -106, 12, 9).fill(s.noseColor ?? ink);
        break;
      case 'pig':
        g.ellipse(0, -100, 30, 21).fill(sw.light).stroke(stroke(sw.line, 4));
        g.ellipse(-9, -100, 5, 7).ellipse(9, -100, 5, 7).fill(sw.line);
        break;
      case 'muzzle':
        {
          const mz = s.muzzleShade ?? MUZZLE;
          g.ellipse(0, -68, 72, 46).fill(mz.fill).stroke(stroke(mz.line, 5));
          g.ellipse(-25, -76, 8, 11).ellipse(25, -76, 8, 11).fill(mz.dark);
        }
        break;
      case 'bill': {
        const bill = swatch.orange;
        g.moveTo(-46, -100)
          .quadraticCurveTo(0, -120, 46, -100)
          .quadraticCurveTo(50, -76, 0, -68)
          .quadraticCurveTo(-50, -76, -46, -100)
          .closePath()
          .fill(bill.fill)
          .stroke(stroke(bill.line, 5));
        g.moveTo(-34, -91).quadraticCurveTo(0, -82, 34, -91).stroke(stroke(bill.line, 3));
        break;
      }
      case 'beak':
        g.moveTo(-20, -110)
          .lineTo(20, -110)
          .lineTo(0, -82)
          .closePath()
          .fill(BEAK.fill)
          .stroke(stroke(BEAK.line, 4));
        g.moveTo(-14, -104).lineTo(14, -104).stroke(stroke(BEAK.line, 3));
        if (s.comb) {
          for (const side of [-1, 1])
            g.ellipse(side * 7, -72, 8, 12)
              .fill(swatch.red.fill)
              .stroke(stroke(swatch.red.line, 3));
        }
        break;
      default:
        break;
    }
    this.face.addChild(g, this.mouth, this.brows);
  }

  private drawMood() {
    const sleepy = this.mood === 'sleepy';
    this.eyes.forEach((e) => (e.visible = !sleepy));
    this.lids.forEach((l) => (l.visible = sleepy));

    // Brows read even on a bill, so every critter can look sad or surprised.
    const b = this.brows.clear();
    const browY = this.eyeY - 40;
    for (const side of [-1, 1]) {
      const x = side * this.eyeX;
      if (this.mood === 'sad') b.moveTo(x - side * 20, browY - 8).lineTo(x + side * 18, browY + 4);
      if (this.mood === 'surprised')
        b.moveTo(x - 18, browY + 2).quadraticCurveTo(x, browY - 14, x + 18, browY + 2);
    }
    if (this.mood === 'sad' || this.mood === 'surprised') b.stroke(stroke(this.sw.line, 5));
    if (this.mood === 'sad') {
      const x = this.eyeX + 14;
      const y = this.eyeY + 34;
      b.moveTo(x, y - 14)
        .quadraticCurveTo(x + 9, y, x, y + 6)
        .quadraticCurveTo(x - 9, y, x, y - 14)
        .fill(swatch.blue.fill);
    }

    const m = this.mouth.clear();
    const at = this.mouthAt;
    if (!at) return;
    switch (this.mood) {
      case 'happy':
        m.moveTo(at.x - 16, at.y - 6)
          .quadraticCurveTo(at.x, at.y + 12, at.x + 16, at.y - 6)
          .stroke(stroke(at.color, 5));
        break;
      case 'surprised':
        m.ellipse(at.x, at.y + 2, 9, 11).fill(MOUTH_DARK);
        break;
      case 'sing':
        m.ellipse(at.x, at.y + 3, 13, 16).fill(MOUTH_DARK);
        m.ellipse(at.x, at.y + 12, 8, 5).fill(cheek);
        break;
      case 'sleepy':
        m.ellipse(at.x, at.y, 5, 6).fill(MOUTH_DARK);
        break;
      case 'calm':
        m.moveTo(at.x - 11, at.y)
          .lineTo(at.x + 11, at.y)
          .stroke(stroke(at.color, 5));
        break;
      case 'sad':
        m.moveTo(at.x - 15, at.y + 6)
          .quadraticCurveTo(at.x, at.y - 8, at.x + 15, at.y + 6)
          .stroke(stroke(at.color, 5));
        break;
    }
  }
}
