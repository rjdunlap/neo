import { Circle, Container, Graphics } from 'pixi.js';
import { blossomOf } from '../../art/creatures/forms';
import { IllustratedCreature } from '../../art/creatures/illustrated';
import { sfx } from '../../audio/sfx';
import { chirp, type Companion } from '../../creatures/companion';
import { LAMP_W, type Floor } from '../../creatures/home-layout';
import { blossomScale, EVENING_ALPHA, lampAnswer, type LampAnswer } from '../../creatures/lamp';
import { onTap } from '../../engine/input';
import { ease, type Tweener } from '../../engine/tween';
import type { Updatable } from '../Scene';
import type { BallPlay } from './ball-play';

const RUN = 520;

/** The sun-and-moon switch drawn as a disc: a golden sun half and a pale moon half, on a short stand. */
function lampArt(): { stand: Graphics; disc: Container } {
  const stand = new Graphics()
    .roundRect(-9, 30, 18, 40, 6)
    .fill(0x8a6a4a)
    .ellipse(0, 72, 34, 9)
    .fill(0x6e5238);
  const sun = new Graphics()
    .moveTo(0, -46)
    .arc(0, 0, 46, -Math.PI / 2, Math.PI / 2, true)
    .closePath()
    .fill(0xffc93c);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + ((i + 0.5) / 5) * Math.PI;
    sun
      .moveTo(Math.cos(a) * 49, Math.sin(a) * 49)
      .lineTo(Math.cos(a) * 60, Math.sin(a) * 60)
      .stroke({ width: 6, color: 0xb97d00, cap: 'round' });
  }
  const moon = new Graphics()
    .moveTo(0, -46)
    .arc(0, 0, 46, -Math.PI / 2, Math.PI / 2)
    .closePath()
    .fill(0xbcdcf6);
  moon
    .circle(24, -8, 15)
    .fill({ color: 0x4f82b0, alpha: 0.35 })
    .circle(18, 22, 8)
    .fill({ color: 0x4f82b0, alpha: 0.3 });
  const rim = new Graphics().circle(0, 0, 46).stroke({ width: 6, color: 0x6e5238 });
  const disc = new Container();
  disc.addChild(sun, moon, rim);
  return { stand, disc };
}

/**
 * The second toy in creature play (RW11 slice 3, docs/rework/FORMS-AND-TALENTS.md#the-talent-the-sun-and-moon-switch): tap
 * the lamp and the room turns to evening, with the backdrop dimmed by a scene-owned tween; tap again and it is day. Her
 * friend walks to the lamp first, then answers by form (`src/creatures/lamp.ts`). No timer, count or end: the room is day
 * whenever she comes back. All motion is this object's `update` and the scene's tweener, so leaving the scene stops it.
 */
export class LampPlay implements Updatable {
  readonly node = new Container();
  /** The dimming laid over the room, between the backdrop and her friend. */
  readonly dim = new Graphics();
  /** The moon blossom's circle of light on the floor, under her friend. */
  readonly glow = new Graphics();
  private readonly disc: Container;
  evening = false;
  /** Her friend is on its way to the lamp. */
  walking = false;
  /** Taps so far, for scripted checks; nothing is saved. */
  taps = 0;
  /** What her friend did last, for scripted checks. */
  last: LampAnswer | null = null;
  private spot = { x: 0, y: 0 };
  private floor: Floor = { x0: 0, x1: 0, y0: 0, y1: 0 };
  /** Bumped by each tap, so a slower answer to an earlier tap never lands over a newer one. */
  private turn = 0;
  /** Set while the scene sends her friend somewhere else: taps on the lamp wait. */
  frozen = false;

  constructor(
    private readonly pet: Companion,
    private readonly toy: BallPlay,
    private readonly tw: Tweener,
    private readonly say: (evening: boolean) => void,
  ) {
    const { stand, disc } = lampArt();
    this.disc = disc;
    this.node.addChild(stand, disc);
    for (const c of this.node.children) c.eventMode = 'none';
    this.node.hitArea = new Circle(0, 20, LAMP_W / 2 + 4);
    this.dim.alpha = 0;
    this.dim.eventMode = 'none';
    this.glow.alpha = 0;
    this.glow.eventMode = 'none';
    for (const [r, a] of [
      [150, 0.1],
      [112, 0.14],
      [76, 0.2],
    ] as const)
      this.glow.ellipse(0, 0, r, r * 0.3).fill({ color: 0xfff1a8, alpha: a });
    onTap(this.node, () => this.toggle(), { cooldown: 350 });
  }

  /** Where the lamp stands, the floor her friend may walk, and the view the dimming covers. */
  place(spot: { x: number; y: number }, floor: Floor, size: { w: number; h: number }) {
    this.spot = spot;
    this.floor = floor;
    this.node.position.set(spot.x, spot.y);
    this.dim.clear().rect(0, 0, size.w, size.h).fill(0x141a4a);
  }

  /** The blossom her friend shows, if its rig can show one. */
  private blossom(): Container | null {
    return this.pet.rig instanceof IllustratedCreature ? blossomOf(this.pet.rig) : null;
  }

  private get answer(): LampAnswer {
    return lampAnswer(this.pet.species, this.pet.form);
  }

  toggle() {
    if (this.frozen) return;
    this.taps++;
    this.evening = !this.evening;
    const turn = ++this.turn;
    this.say(this.evening);
    sfx.bell(this.evening ? 5 : 0, 0.22);
    sfx.bell(this.evening ? 1 : 4, 0.18);
    void this.tw.to(
      this.disc,
      { rotation: this.evening ? Math.PI : 0 },
      { duration: 0.45, ease: ease.outBack },
    );
    void this.tw.to(this.dim, { alpha: this.evening ? EVENING_ALPHA : 0 }, { duration: 1 });
    // The ball's chase gives way: her friend goes to the lamp.
    this.toy.chasing = false;
    this.walking = true;
    this.arrive = () => {
      if (turn === this.turn) this.respond();
    };
  }

  private arrive: (() => void) | null = null;

  /** Her friend's answer, once it stands by the lamp. */
  private respond() {
    const answer = this.answer;
    this.last = answer;
    const p = this.pet;
    const evening = this.evening;
    const bloom = this.blossom();
    if (bloom) {
      const s = blossomScale(answer, evening);
      void this.tw.to(bloom.scale, { x: s, y: s }, { duration: 0.9, ease: ease.outBack });
    }
    if (answer === 'glow') {
      if (evening) {
        p.setMood('happy', 2);
        sfx.sparkle();
      }
    } else if (answer === 'fold') {
      if (evening) p.setMood('sleepy', 3);
      else p.hop(0.8);
    } else if (evening) {
      p.setMood('sleepy');
      sfx.yawn();
    } else {
      p.setMood('calm');
      p.hop(0.9);
      p.setMood('happy', 1.4);
      chirp(p.species);
    }
  }

  update(dt: number) {
    const p = this.pet;
    if (this.toy.chasing) this.walking = false;
    if (this.walking && !this.frozen) {
      const side = p.x <= this.spot.x ? -1 : 1;
      const goal = {
        x: Math.max(this.floor.x0 - 40, Math.min(this.floor.x1 + 40, this.spot.x + side * 130)),
        y: Math.max(this.floor.y0 + 50, Math.min(this.floor.y1 + 50, this.spot.y + 50)),
      };
      const dx = goal.x - p.x;
      const dy = goal.y - p.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 4) p.scale.x = Math.abs(p.scale.x) * (dx > 0 ? 1 : -1);
      if (d > 6) {
        const step = Math.min(d, RUN * dt);
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      } else {
        this.walking = false;
        p.scale.x = Math.abs(p.scale.x) * (this.spot.x >= p.x ? 1 : -1);
        const done = this.arrive;
        this.arrive = null;
        done?.();
      }
    }
    // The moon blossom's light follows her friend's feet while it is evening.
    const lit = this.evening && this.answer === 'glow' ? 1 : 0;
    this.glow.alpha += (lit - this.glow.alpha) * Math.min(1, dt * 3);
    this.glow.position.set(p.x, p.y + 6);
    this.glow.zIndex = p.y - 1;
  }
}
