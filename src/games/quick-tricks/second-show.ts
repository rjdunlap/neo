import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, RAINBOW, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  encoreFor,
  encoreMove,
  encoreRound,
  fitsParcel,
  picnicFriends,
  type ParcelShape,
} from './second-logic';
function parcel(shape: ParcelShape) {
  const g = new Graphics();
  const points =
    shape === 'rectangle'
      ? [-85, -45, 85, -45, 85, 45, -85, 45]
      : shape === 'triangle'
        ? [-75, 60, 0, -70, 75, 60]
        : [-70, -70, 0, -70, 0, 0, 70, 0, 70, 70, -70, 70];
  return g
    .poly(points)
    .fill(swatch.orange.fill)
    .stroke({ width: 6, color: swatch.brown.line, join: 'round' });
}
/** The mailbox the parcel goes into: a box on a post, its shadow slot on the front, and a flag that pops up when the parcel lands. */
function mailbox() {
  const c = new Container();
  c.addChild(
    new Graphics()
      .rect(-14, 60, 28, 170)
      .fill(swatch.brown.fill)
      .stroke({ width: 5, color: swatch.brown.line })
      .roundRect(-130, -125, 260, 195, 40)
      .fill(swatch.blue.fill)
      .stroke({ width: 6, color: swatch.blue.line }),
  );
  const flag = new Graphics()
    .rect(-6, -110, 12, 110)
    .fill(swatch.red.line)
    .rect(-6, -110, 70, 44)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line });
  flag.label = 'flag';
  flag.position.set(136, 20);
  flag.rotation = Math.PI;
  c.addChild(flag);
  c.eventMode = 'none';
  return c;
}
function bowl() {
  return new Graphics()
    .ellipse(0, 5, 55, 28)
    .fill(swatch.blue.fill)
    .stroke({ width: 5, color: swatch.blue.line })
    .ellipse(0, -7, 55, 22)
    .fill(cream)
    .stroke({ width: 5, color: swatch.blue.line });
}
export class SecondShow implements Game {
  private view: View;
  readonly plan;
  readonly round;
  step = 0;
  waiting = false;
  finished = false;
  misses = 0;
  hints = 0;
  wrong = 0;
  readonly layer = new Container();
  private readonly bg = new Graphics();
  private readonly glow = new Graphics();
  readonly next: RoundButton;
  readonly turn: RoundButton;
  readonly undo: RoundButton;
  readonly submit: RoundButton;
  parcel: Container | null = null;
  parcelArt: Graphics | null = null;
  turns = 0;
  target = { x: 0, y: 0 };
  bowl: Container | null = null;
  readonly seats: { node: Container; filled: boolean }[] = [];
  readonly berry: RoundButton;
  berries = 0;
  private readonly berryPicture = new Container();
  private drags: DragHandle[] = [];
  private clock = 0;
  /** Quiet seconds on a waiting arrow; at ten the pet asks again. */
  private waitClock = 0;
  /** The picnic's friends (seeded critters), at the places and in the bow. */
  readonly kinds;
  friends: Critter[] = [];
  private mail: Container | null = null;
  private gulping = false;
  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = encoreFor(ctx.level);
    this.round = encoreRound(ctx.level, ctx.rng);
    this.kinds = picnicFriends(this.plan, ctx.rng);
    ctx.stage.addChild(this.bg, this.layer, this.berryPicture, this.glow);
    this.glow.eventMode = 'none';
    this.next = new RoundButton(arrowIcon(1), swatch.green, 50, () => {
      if (!this.waiting || this.finished) return;
      this.waitClock = 0;
      if (this.step === 2) void this.finale();
      else {
        this.step++;
        this.setup();
      }
    });
    this.turn = new RoundButton(againIcon(), swatch.blue, 50, () => {
      if (this.waiting || !this.parcelArt) return;
      this.turns = (this.turns + 1) % 4;
      this.parcelArt.rotation = (this.turns * Math.PI) / 2;
      sfx.tick();
    });
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 50, () => {
      if (this.waiting) return;
      this.berries = Math.max(this.round.already, this.berries - 1);
      this.drawBerries();
    });
    this.submit = new RoundButton(arrowIcon(1), swatch.yellow, 50, () => {
      // Only the berries are checked: the last bowl at the picnic wins by itself (a hidden button can still catch a tap).
      if (this.waiting || this.step !== 2) return;
      if (this.berries === this.plan.total) this.win();
      else this.miss('tricks.berries-hint');
    });
    this.berry = new RoundButton(
      new Graphics().circle(0, 0, 24).fill(swatch.red.fill).ellipse(6, -24, 15, 6).fill(swatch.green.line),
      swatch.white,
      52,
      () => {
        if (this.waiting) return;
        this.berries = Math.min(this.plan.total + 2, this.berries + 1);
        sfx.pop(6);
        this.drawBerries();
      },
    );
    ctx.stage.addChild(this.next, this.turn, this.undo, this.submit, this.berry);
  }
  start() {
    this.setup();
  }
  private clear() {
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const f of this.friends) this.ctx.untrack(f);
    this.friends = [];
    for (const c of this.layer.removeChildren()) c.destroy({ children: true });
    this.parcel = this.parcelArt = null;
    this.bowl = null;
    this.mail = null;
    this.seats.length = 0;
  }
  private critter(kind: (typeof this.kinds)[number], scale: number) {
    const f = this.ctx.track(new Critter(CRITTERS[kind]));
    f.scale.set(scale);
    f.eventMode = 'none';
    this.friends.push(f);
    return f;
  }
  private setup() {
    this.clear();
    this.waiting = false;
    this.wrong = 0;
    this.glow.clear();
    if (this.step === 0) {
      const mail = mailbox();
      mail.label = 'mailbox';
      this.layer.addChild(mail);
      this.mail = mail;
      const slot = parcel(this.plan.shape);
      slot.tint = swatch.purple.line;
      slot.alpha = 0.3;
      slot.rotation = (this.round.turn * Math.PI) / 2;
      slot.label = 'slot';
      this.layer.addChild(slot);
      const n = new Container(),
        art = parcel(this.plan.shape);
      n.addChild(art);
      n.hitArea = new Circle(0, 0, 95);
      this.layer.addChild(n);
      this.parcel = n;
      this.parcelArt = art;
      const d = draggable(n, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.waiting) return false;
          if (Math.hypot(x - this.target.x, y - this.target.y) > 115) return false;
          if (fitsParcel(this.plan.shape, this.turns, this.round.turn)) {
            n.position.set(this.target.x, this.target.y);
            d.enabled = false;
            this.win();
            this.flagUp();
            return true;
          }
          this.miss('tricks.parcel-hint');
          return false;
        },
      });
      this.drags.push(d);
      void this.ctx.instruct('tricks.parcel');
    } else if (this.step === 1) {
      for (let i = 0; i < this.plan.friends; i++) {
        const node = new Container();
        const friend = this.critter(this.kinds[i], 0.4);
        friend.y = -22;
        node.addChild(
          friend,
          new Graphics().ellipse(0, 0, 62, 38).fill(cream).stroke({ width: 4, color: swatch.brown.line }),
        );
        const filled = i < this.round.set;
        if (filled) {
          node.addChild(bowl());
          friend.setMood('happy');
        }
        this.layer.addChild(node);
        this.seats.push({ node, filled });
      }
      const n = new Container();
      n.addChild(bowl());
      n.hitArea = new Circle(0, 0, 65);
      this.layer.addChild(n);
      this.bowl = n;
      this.drags.push(
        draggable(n, this.ctx.tw, {
          onPick: () => sfx.tick(),
          onDrop: (x, y) => {
            // The nearest place takes the bowl (places sit close in portrait); a filled place is a free try.
            if (this.waiting) return false;
            const s = this.seats
              .map((s) => ({ s, d: Math.hypot(x - s.node.x, y - s.node.y) }))
              .filter((o) => o.d < 76)
              .sort((a, b) => a.d - b.d)[0]?.s;
            if (s && !s.filled) {
              s.filled = true;
              s.node.addChild(bowl());
              sfx.bell(6, 0.2);
              this.friends[this.seats.indexOf(s)]?.cheer();
              if (this.seats.every((s) => s.filled)) this.win();
            }
            return false;
          },
        }),
      );
      void this.ctx.instruct('tricks.places');
    } else {
      this.berries = this.round.already;
      void this.ctx.instruct('tricks.berries', { n: this.plan.total });
    }
    this.resize(this.view);
  }
  private miss(line: 'tricks.parcel-hint' | 'tricks.berries-hint') {
    this.misses++;
    this.wrong++;
    if (this.wrong === 2) this.hints++;
    sfx.boing();
    void this.ctx.say(line, { n: this.plan.total });
    this.drawGlow();
  }
  private win() {
    this.waiting = true;
    this.waitClock = 0;
    this.drags.forEach((d) => (d.enabled = false));
    this.next.visible = true;
    this.submit.visible = false;
    this.glow.clear();
    sfx.sparkle();
    this.ctx.pet.cheer();
    if (this.step === 2) this.gulp();
    void this.ctx.say('tricks.encore-yes');
  }
  /** The parcel is in: the mailbox's flag pops up with a bell. */
  private flagUp() {
    const flag = this.mail?.getChildByLabel('flag');
    if (!flag) return;
    sfx.bell(8, 0.25);
    void this.ctx.tw.to(flag, { rotation: 0 }, { duration: 0.45, ease: ease.outBack });
  }
  /** Exactly the berries asked for: the friends cheer and the berries go in one gulp. */
  private gulp() {
    this.gulping = true;
    sfx.giggle();
    for (const c of this.berryPicture.children)
      void this.ctx.tw.to(c.scale, { x: 0, y: 0 }, { duration: 0.35, ease: ease.inBack });
  }
  /** Everyone from the picnic takes a bow, then the round ends. */
  private async finale() {
    this.finished = true;
    this.next.visible = false;
    this.berry.visible = this.undo.visible = false;
    // Let the gulp finish before its berries go.
    await this.ctx.tw.wait(0.4);
    this.clear();
    for (const c of this.berryPicture.removeChildren()) c.destroy({ children: true });
    const v = this.view;
    const n = this.kinds.length;
    this.kinds.forEach((kind, i) => {
      const f = this.critter(kind, 0.5);
      f.setMood('happy');
      f.position.set(v.w * (0.5 + (i - (n - 1) / 2) * (0.7 / n)), v.h * 0.62);
      this.layer.addChild(f);
      void this.ctx.tw
        .wait(0.3 + i * 0.25)
        .then(() => this.ctx.tw.to(f, { y: f.y - 30 }, { duration: 0.2, ease: ease.outQuad }))
        .then(() => this.ctx.tw.to(f, { y: f.y + 30 }, { duration: 0.25, ease: ease.inQuad }));
    });
    this.ctx.particles.burst(v.w / 2, v.h * 0.3, {
      kind: 'confetti',
      colors: RAINBOW.map((c) => swatch[c].fill),
      count: 70,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    await this.ctx.say('tricks.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  private drawBerries() {
    // Once the berries are gulped, a resize must not bring them back.
    if (this.gulping) return;
    for (const c of this.berryPicture.removeChildren()) c.destroy({ children: true });
    if (this.step !== 2 || this.finished) return;
    const n = label(String(this.plan.total), 44);
    n.position.set(0, -160);
    this.berryPicture.addChild(n);
    for (let i = 0; i < Math.max(this.plan.total, this.berries); i++) {
      const g = new Graphics()
        .circle(0, 0, 28)
        .fill(i < this.berries ? swatch.red.fill : cream)
        .stroke({ width: 5, color: i < this.berries ? swatch.red.line : swatch.brown.line });
      g.position.set(((i % 4) - 1.5) * 85, Math.floor(i / 4) * 85);
      this.berryPicture.addChild(g);
    }
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear();
    if (this.wrong < 2 || this.waiting) return;
    if (this.step === 0) {
      this.glow.circle(this.target.x, this.target.y, 125).stroke({ width: 8, color: swatch.yellow.line });
      this.glow.circle(this.turn.x, this.turn.y, 65).stroke({ width: 8, color: swatch.yellow.line });
    }
    if (this.step === 2) {
      const b = this.berries > this.plan.total ? this.undo : this.berry;
      this.glow.circle(b.x, b.y, 65).stroke({ width: 8, color: swatch.yellow.line });
    }
  }
  resize(v: View) {
    this.view = v;
    this.bg
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(cream)
      .rect(0, 0, 110, v.h)
      .fill(swatch.red.light)
      .rect(v.w - 110, 0, 110, v.h)
      .fill(swatch.red.light);
    this.next.position.set(v.w - 80, v.h - 80);
    this.next.visible = this.waiting && !this.finished;
    this.submit.position.set(v.w - 80, 80);
    this.submit.visible = this.step === 2 && !this.waiting && !this.finished;
    this.turn.position.set(v.w * 0.3, v.h - 100);
    this.turn.visible = this.step === 0;
    this.undo.position.set(v.w * 0.65, v.h - 100);
    this.undo.visible = this.step === 2 && !this.finished;
    this.berry.position.set(v.w * 0.4, v.h - 100);
    this.berry.visible = this.step === 2 && !this.finished;
    this.target = { x: v.w * 0.68, y: v.h * 0.45 };
    const slot = this.layer.children.find((c) => c.label === 'slot');
    slot?.position.set(this.target.x, this.target.y);
    this.mail?.position.set(this.target.x, this.target.y);
    if (this.finished) {
      const n = this.friends.length;
      this.friends.forEach((f, i) => f.position.set(v.w * (0.5 + (i - (n - 1) / 2) * (0.7 / n)), v.h * 0.62));
    }
    if (this.parcel) {
      const home = { x: v.w * 0.3, y: v.h * 0.45 };
      this.drags[0].home = home;
      if (!this.drags[0].dragging)
        this.parcel.position.set(
          this.waiting ? this.target.x : home.x,
          this.waiting ? this.target.y : home.y,
        );
    }
    const xs = spread(this.seats.length, 130, v.w - 130, 190);
    this.seats.forEach((s, i) => s.node.position.set(xs[i], v.h * 0.45));
    if (this.bowl) {
      this.drags[0].home = { x: v.w / 2, y: v.h - 100 };
      if (!this.drags[0].dragging) this.bowl.position.set(v.w / 2, v.h - 100);
    }
    this.berryPicture.position.set(v.w / 2, v.h * 0.45);
    this.drawBerries();
    this.drawGlow();
  }
  /** The ghost finger: turn the parcel and carry it to its slot, a bowl to each empty place, the berries asked for and then submit, and the arrow after each step. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const m = encoreMove(this.plan, this.round, {
      step: this.step as 0 | 1 | 2,
      waiting: this.waiting,
      turns: this.turns,
      seats: this.seats.map((s) => s.filled),
      berries: this.berries,
    });
    switch (m?.do) {
      case 'next':
        return { tap: { on: this.next } };
      case 'turn':
        return { tap: { on: this.turn } };
      case 'parcel':
        return this.parcel
          ? { drag: { on: this.parcel }, to: { on: this.layer, x: this.target.x, y: this.target.y } }
          : null;
      case 'bowl':
        return this.bowl ? { drag: { on: this.bowl }, to: { on: this.seats[m.seat].node } } : null;
      case 'berry':
        return { tap: { on: this.berry } };
      case 'undo':
        return { tap: { on: this.undo } };
      case 'submit':
        return { tap: { on: this.submit } };
      default:
        return null;
    }
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 4);
    if (this.waiting && !this.finished) {
      this.waitClock += dt;
      if (this.waitClock > 10) {
        this.waitClock = 0;
        void this.ctx.say('tricks.next');
      }
    }
    if (this.waiting && this.step === 0 && this.parcel)
      this.parcel.scale.set(1 + 0.04 * Math.sin(this.clock * 8));
  }
  destroy() {
    this.finished = true;
    this.clear();
  }
}
