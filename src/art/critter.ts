import { Container, Graphics, Point } from 'pixi.js';
import { gaze } from '../engine/input';
import { cheek, ink, swatch, type ColorName, type Swatch } from './palette';
import { bodyPath } from './shapes';

export type Ears = 'round' | 'pointy' | 'floppy' | 'long' | 'none';
export type Snout = 'none' | 'nose' | 'pig' | 'muzzle' | 'bill';
export type Mood = 'happy' | 'surprised' | 'sing' | 'sleepy' | 'sad' | 'calm';

/** Everything that makes one critter different from another. All parts share one body and face. */
export interface CritterSpec {
  color: ColorName;
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
  wings?: boolean;
  whiskers?: boolean;
}

export const CRITTERS = {
  pip: { color: 'teal', ears: 'round', sprout: true, belly: true },
  cow: { color: 'white', ears: 'floppy', snout: 'muzzle', spots: true, horns: true, feet: 'hoof' },
  duck: { color: 'yellow', snout: 'bill', tuft: true, wings: true, feet: 'orange' },
  pig: { color: 'pink', ears: 'pointy', snout: 'pig' },
  cat: { color: 'orange', ears: 'pointy', snout: 'nose', noseColor: 0xff8fa3, whiskers: true, belly: true },
  bear: { color: 'brown', ears: 'round', snout: 'nose', noseColor: ink, belly: true },
  dog: { color: 'brown', ears: 'floppy', earColor: 'orange', snout: 'nose', noseColor: ink, belly: true },
  bunny: { color: 'white', ears: 'long', snout: 'nose', noseColor: 0xff8fa3, whiskers: true },
} satisfies Record<string, CritterSpec>;

export type CritterName = keyof typeof CRITTERS;

const MOUTH_DARK = 0x7a2e3e;
const MUZZLE = { fill: 0xf7b6c2, line: 0xd98597, dark: 0xc06c80 };
const HORN = { fill: 0xf4d9a6, line: 0xc9a86a };
const HOOF = { fill: 0x8c7b6b, line: 0x5e5248 };

const stroke = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

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
    this.sw = swatch[spec.color];
    this.eyeY = spec.snout === 'muzzle' ? -150 : -142;
    this.eyeX = spec.snout === 'muzzle' ? 35 : 40;
    this.mouthAt =
      spec.snout === 'bill'
        ? null
        : spec.snout === 'muzzle'
          ? { x: 0, y: -48, color: MUZZLE.dark }
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
    for (const p of this.pupils) p.position.set(this.look.x, 4 + this.look.y);
  }

  private buildBack() {
    const s = this.spec;
    const ear = swatch[s.earColor ?? s.color];
    const back = new Graphics();
    this.body.addChild(back);

    if (s.sprout) {
      back.moveTo(0, -248).quadraticCurveTo(-8, -278, 10, -296).stroke(stroke(this.sw.line, 5));
      const leaf = new Graphics().ellipse(0, 0, 15, 8).fill(swatch.green.fill).stroke(stroke(swatch.green.line, 4));
      leaf.position.set(20, -300);
      leaf.rotation = -0.52;
      this.body.addChild(leaf);
    }
    if (s.tuft) {
      back.moveTo(-10, -234).quadraticCurveTo(-20, -260, -4, -268).stroke(stroke(this.sw.line, 5));
      back.moveTo(6, -234).quadraticCurveTo(10, -260, 26, -264).stroke(stroke(this.sw.line, 5));
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
    if (s.wings) {
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
          back.circle(side * 72, -222, 34).fill(ear.fill).stroke(stroke(ear.line));
          back.circle(side * 72, -222, 16).fill({ color: cheek, alpha: 0.7 });
          break;
        case 'pointy':
          back.poly([side * 30, -236, side * 88, -292, side * 112, -196]).fill(ear.fill).stroke(stroke(ear.line));
          back.poly([side * 52, -232, side * 86, -268, side * 98, -214]).fill({ color: cheek, alpha: 0.7 });
          break;
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

  private buildBody() {
    const s = this.spec;
    const sw = this.sw;
    if (s.spots) {
      this.body.addChild(bodyPath(new Graphics()).fill(sw.fill));
      const mask = bodyPath(new Graphics()).fill(0xffffff);
      const spots = new Graphics()
        .ellipse(-86, -172, 44, 32)
        .ellipse(112, -65, 36, 50)
        .ellipse(62, -214, 20, 14)
        .fill(0x3d3d4d);
      spots.mask = mask;
      this.body.addChild(mask, spots, bodyPath(new Graphics()).stroke(stroke(sw.line)));
      this.body.addChild(
        new Graphics()
          .moveTo(-18, -244)
          .quadraticCurveTo(-10, -270, 1, -250)
          .quadraticCurveTo(11, -272, 20, -244)
          .closePath()
          .fill(0x3d3d4d),
      );
    } else {
      this.body.addChild(bodyPath(new Graphics()).fill(sw.fill).stroke(stroke(sw.line)));
    }
    if (s.belly) this.body.addChild(new Graphics().ellipse(0, -65, 80, 54).fill(sw.light));

    const feet = s.feet === 'hoof' ? HOOF : swatch[s.feet ?? s.color];
    const f = new Graphics();
    for (const side of [-1, 1]) f.ellipse(side * 40, 0, 30, 14).fill(feet.fill).stroke(stroke(feet.line, 6));
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
      eye.addChild(new Graphics().ellipse(0, 0, 25, 29).fill(0xffffff).stroke(stroke(sw.line, 4)));
      const pupil = new Container();
      pupil.addChild(new Graphics().circle(0, 0, 15).fill(ink), new Graphics().circle(5, -7, 5).fill(0xffffff));
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
    if (s.snout !== 'muzzle') {
      for (const side of [-1, 1]) g.ellipse(side * 74, -98, 16, 10).fill({ color: cheek, alpha: 0.55 });
    }
    if (s.whiskers) {
      for (const side of [-1, 1]) {
        g.moveTo(side * 58, -100).lineTo(side * 106, -110).stroke(stroke(sw.line, 3));
        g.moveTo(side * 58, -90).lineTo(side * 106, -86).stroke(stroke(sw.line, 3));
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
        g.ellipse(0, -68, 72, 46).fill(MUZZLE.fill).stroke(stroke(MUZZLE.line, 5));
        g.ellipse(-25, -76, 8, 11).ellipse(25, -76, 8, 11).fill(MUZZLE.dark);
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
      if (this.mood === 'surprised') b.moveTo(x - 18, browY + 2).quadraticCurveTo(x, browY - 14, x + 18, browY + 2);
    }
    if (this.mood === 'sad' || this.mood === 'surprised') b.stroke(stroke(this.sw.line, 5));
    if (this.mood === 'sad') {
      const x = this.eyeX + 14;
      const y = this.eyeY + 34;
      b.moveTo(x, y - 14).quadraticCurveTo(x + 9, y, x, y + 6).quadraticCurveTo(x - 9, y, x, y - 14).fill(swatch.blue.fill);
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
        m.moveTo(at.x - 11, at.y).lineTo(at.x + 11, at.y).stroke(stroke(at.color, 5));
        break;
      case 'sad':
        m.moveTo(at.x - 15, at.y + 6)
          .quadraticCurveTo(at.x, at.y - 8, at.x + 15, at.y + 6)
          .stroke(stroke(at.color, 5));
        break;
    }
  }
}
