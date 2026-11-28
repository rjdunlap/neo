import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { layout, plotAt, railAt, railUnder, type Layout } from './layout';
import {
  FULL,
  LEVELS,
  Misses,
  PLOTS,
  RAILS,
  completes,
  describeLevel,
  drop,
  hint,
  petChoices,
  petReply,
  pickStart,
  planFor,
  railPosts,
  sound,
  type Hint,
  type Pools,
  type Start,
} from './logic';
import pools from './pools.json';

const line = (id: string) => id as LineId;

/** `pet`: the pet is laying its rails. `replay`: *show me why* is playing the pet's answer to a costly rail. */
type Phase = 'turn' | 'pet' | 'replay' | 'done';
type Owner = 'her' | 'pet' | null;

/** Seconds between the pet's rails: a pace she can read. */
const PACE = 0.6;

/** The previous round's pool class at each level, so the next round is another field. Round state only; never saved. */
const lastClass = new Map<number, number>();

function lantern(g: Graphics, x: number, y: number, k: number, lit = false) {
  g.roundRect(x - 14 * k, y - 30 * k, 28 * k, 8 * k, 3 * k).fill(wood.line);
  g.roundRect(x - 20 * k, y - 22 * k, 40 * k, 46 * k, 9 * k)
    .fill(lit ? swatch.yellow.light : swatch.yellow.fill)
    .stroke({ width: 4 * k, color: wood.line });
  g.circle(x, y + 2 * k, 9 * k).fill(lit ? 0xffffff : swatch.orange.fill);
  g.roundRect(x - 16 * k, y + 24 * k, 32 * k, 7 * k, 3 * k).fill(wood.line);
}

function paw(g: Graphics, x: number, y: number, k: number) {
  const c = swatch.purple.fill;
  g.ellipse(x, y + 10 * k, 20 * k, 16 * k).fill(c);
  for (const [dx, dy] of [
    [-20, -10],
    [-7, -22],
    [7, -22],
    [20, -10],
  ])
    g.circle(x + dx * k, y + dy * k, 7.5 * k).fill(c);
}

/** A little field: posts, the given rails and one mark, for the hub icon and the sticker. */
function miniField(s: number, mask: number, mark: 'lantern' | 'paw'): Container {
  const g = new Graphics();
  g.roundRect(-1.5 * s - 14, -1.5 * s - 14, 3 * s + 28, 3 * s + 28, 18).fill(grass);
  for (let e = 0; e < RAILS; e++) {
    if (!(mask & (1 << e))) continue;
    const [a, b] = railPosts(e);
    g.moveTo((a[0] - 1.5) * s, (a[1] - 1.5) * s)
      .lineTo((b[0] - 1.5) * s, (b[1] - 1.5) * s)
      .stroke({ width: s * 0.14, color: wood.fill, cap: 'round' });
  }
  for (let i = 0; i < 16; i++)
    g.circle(((i % 4) - 1.5) * s, (Math.floor(i / 4) - 1.5) * s, s * 0.11).fill(wood.line);
  if (mark === 'lantern') lantern(g, -s, -s, s / 110);
  else paw(g, -s, -s, s / 110);
  return new Container().addChild(g);
}

class FenceTheField implements Game {
  readonly level: number;
  readonly round: Start;
  /** The rails laid, and who holds each plot. During a replay these show the pet's answer, then step back. */
  mask: number;
  owners: Owner[] = Array.from({ length: PLOTS }, () => null);
  phase: Phase = 'turn';
  finished = false;
  /** The rail glowing as a hint and the position it was given at; asking again there is free. */
  hintNow: (Hint & { at: number }) | null = null;
  private readonly score = newTally();
  private readonly counted = new Misses();
  /** Bumped whenever the position changes hands, so an awaited step from an older one stops short. */
  private gen = 0;
  private L: Layout;
  private clock = 0;
  private saidDown = false;
  private readonly backdrop: Backdrop;
  private readonly ground = new Graphics();
  private readonly rails = new Graphics();
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();
  private readonly press = new Graphics();
  private readonly strip = new Container();
  private readonly stripArt = new Graphics();
  private readonly hers = label('0', 44);
  private readonly pets = label('0', 44);
  private readonly goal = label('', 30);
  /** The one touch surface: the whole field. A scripted play and the ghost finger tap it at a rail's middle. */
  readonly pad = new Container();
  readonly help = new Container();
  private readonly helpArt = new Graphics();
  private readonly helpText = label('Help', 32);

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).level;
    this.round = pickStart((pools as Pools)[this.level], ctx.rng, lastClass.get(this.level));
    lastClass.set(this.level, this.round.klass);
    this.mask = this.round.mask;
    this.backdrop = new Backdrop(
      {
        sky: [0xd9c8f2, 0xffe9c4],
        hills: [0xb9c8f2, 0x9ed6d8, 0xa8dc8f],
        horizon: 0.3,
        clouds: 2,
        sun: false,
        seed: 157,
      },
      ctx.view,
    );
    this.L = layout(ctx.view);
    for (const g of [this.ground, this.rails, this.marks, this.glow, this.press]) g.eventMode = 'none';
    this.press.alpha = 0;
    this.strip.eventMode = 'none';
    this.strip.addChild(this.stripArt, this.hers, this.pets, this.goal);
    this.helpArt.eventMode = this.helpText.eventMode = 'none';
    this.help.addChild(this.helpArt, this.helpText);
    onTap(this.pad, (e) => this.tapField(e));
    onTap(this.help, () => this.askForHint());
    ctx.stage.addChild(
      this.backdrop,
      this.ground,
      this.pad,
      this.rails,
      this.marks,
      this.glow,
      this.press,
      this.strip,
      this.help,
    );
    this.resize(ctx.view);
  }

  get herPlots() {
    return this.owners.filter((o) => o === 'her').length;
  }
  get petPlots() {
    return this.owners.filter((o) => o === 'pet').length;
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.level,
      mask: this.mask,
      target: this.round.target,
      her: this.herPlots,
      pet: this.petPlots,
      phase: this.phase,
      misses: this.score.misses,
      hints: this.score.hints,
      hint: this.hintNow?.rail ?? null,
      finished: this.finished,
    };
  }

  /** Where a scripted play taps for rail `e`, in the pad's own coordinates. */
  spot(e: number) {
    return railAt(this.L, e);
  }

  start() {
    const g = this.gen;
    void this.ctx.instruct(line('fence.start')).then(() => {
      if (!this.finished && g === this.gen) void this.ctx.say(line(`fence.target.${this.round.target}`));
    });
  }

  destroy() {
    this.finished = true;
    this.gen++;
    this.ctx.tw.kill(this.press);
  }

  // ---- laying rails ----

  /** Lay `e` for `who`: the plots it closes are theirs, each with a rising note. Returns how many it closed. */
  private lay(e: number, who: 'her' | 'pet'): number {
    const closed = completes(this.mask, e);
    this.mask |= 1 << e;
    sfx.pluck(who === 'her' ? 5 : 1, 0.3);
    for (const p of closed) {
      this.owners[p] = who;
      const n = who === 'her' ? this.herPlots : this.petPlots;
      sfx.bell(3 + n, 0.3);
      const at = plotAt(this.L, p);
      this.ctx.particles.burst(at.x, at.y, {
        kind: 'dot',
        colors: who === 'her' ? [swatch.yellow.fill, 0xffffff] : [swatch.purple.light, 0xffffff],
        count: 8,
        speed: [40, 120],
        gravity: 0,
        life: [0.3, 0.6],
      });
    }
    this.draw();
    return closed.length;
  }

  private flash(e: number) {
    const { x, y } = railAt(this.L, e);
    const t = this.L.s / 2;
    this.press
      .clear()
      .roundRect(x - t / 2, y - t / 2, t, t, 14)
      .fill({ color: ink, alpha: 0.22 });
    this.ctx.tw.kill(this.press);
    this.press.alpha = 1;
    void this.ctx.tw.to(this.press, { alpha: 0 }, { duration: 0.35 });
  }

  private tapField(e: FederatedPointerEvent) {
    if (this.finished || this.phase !== 'turn') return;
    const at = e.getLocalPosition(this.pad);
    const hit = railUnder(this.L, this.mask, at.x, at.y);
    if (!hit) return;
    this.flash(hit.rail);
    if (hit.laid) {
      // A laid rail stays down; nothing is laid and nothing counts.
      sfx.tick();
      if (!this.saidDown) {
        this.saidDown = true;
        void this.ctx.say(line('fence.down'));
      }
      return;
    }
    if (sound(this.mask, hit.rail)) void this.herRail(hit.rail);
    else void this.showWhy(hit.rail);
  }

  private async herRail(e: number) {
    const g = ++this.gen;
    this.hintNow = null;
    const closed = this.lay(e, 'her');
    if (this.mask === FULL) return this.end(g);
    if (closed) return; // she claimed, so she lays again
    this.phase = 'pet';
    let rails = 0;
    for (;;) {
      await this.ctx.tw.wait(PACE);
      if (g !== this.gen) return;
      const took = this.lay(this.ctx.rng.pick(petChoices(this.mask)), 'pet');
      rails++;
      if (this.mask === FULL) return this.end(g);
      if (!took) break;
      if (rails === 1) void this.ctx.say(line('fence.again'));
    }
    this.phase = 'turn';
    if (rails > 1) void this.ctx.say(line('fence.your-turn'));
  }

  // ---- show me why ----

  /** A costly rail: it is laid, the play to the pet's best answer follows, then the field steps back to before it. */
  private async showWhy(e: number) {
    const g = ++this.gen;
    const before = { mask: this.mask, owners: this.owners.slice() };
    const cost = drop(before.mask, e);
    const fresh = this.counted.count(before.mask, e);
    const due = fresh && missEvery(this.score);
    this.phase = 'replay';
    this.hintNow = null;
    this.lay(e, 'her');
    const reply = petReply(before.mask, e);
    for (const step of reply.steps) {
      await this.ctx.tw.wait(PACE);
      if (g !== this.gen) return;
      this.lay(step.rail, step.who);
    }
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    sfx.boing();
    if (reply.handed)
      await Promise.all([this.ctx.say(line(`fence.handed.${reply.handed}`)), this.ctx.tw.wait(0.8)]);
    if (g !== this.gen) return;
    this.mask = before.mask;
    this.owners = before.owners;
    this.draw();
    sfx.whoosh();
    await this.ctx.say(line(`fence.only.${this.round.target - cost}`));
    if (g !== this.gen) return;
    this.phase = 'turn';
    // The second counted miss of the round brings one assisted hint.
    if (due) this.showHint();
  }

  // ---- hints ----

  readonly hintLabel = 'Help';

  /** Glow one sound rail and say its line. A new hint counts once; the same one asked again at the same position is free. */
  private showHint() {
    if (this.hintNow?.at !== this.mask) {
      hinted(this.score);
      this.hintNow = { ...hint(this.mask, this.level), at: this.mask };
    }
    void this.ctx.say(line(`fence.hint.${this.hintNow.kind}`));
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.finished || this.phase !== 'turn') return;
    this.showHint();
  }

  // ---- the last rail ----

  private async end(g: number) {
    this.phase = 'done';
    this.finished = true;
    this.hintNow = null;
    this.draw();
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say(line(`fence.score.${this.herPlots}`));
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    this.ctx.finish(tally(this.score));
  }

  // ---- drawing ----

  private draw() {
    const L = this.L,
      s = L.s;
    const post = (i: number) => ({ x: L.x0 + (i % 4) * s, y: L.y0 + Math.floor(i / 4) * s });
    const done = this.phase === 'done';
    this.ground
      .clear()
      .roundRect(L.x0 - s / 4, L.y0 - s / 4, 3.5 * s, 3.5 * s, 30)
      .fill(done ? swatch.yellow.light : grass)
      .stroke({ width: 6, color: swatch.green.line });
    this.rails.clear();
    for (let e = 0; e < RAILS; e++) {
      const [a, b] = railPosts(e);
      const from = post(a[1] * 4 + a[0]),
        to = post(b[1] * 4 + b[0]);
      const down = (this.mask & (1 << e)) !== 0;
      // An open rail is a pale line where a rail can go; a laid one is wood, hers and the pet's alike.
      this.rails
        .moveTo(from.x, from.y)
        .lineTo(to.x, to.y)
        .stroke(
          down
            ? { width: s * 0.12, color: wood.fill, cap: 'round' }
            : { width: s * 0.05, color: cream, alpha: 0.7, cap: 'round' },
        );
    }
    for (let i = 0; i < 16; i++) {
      const p = post(i);
      this.rails
        .circle(p.x, p.y, s * 0.1)
        .fill(wood.line)
        .circle(p.x, p.y, s * 0.045)
        .fill(wood.light);
    }
    this.marks.clear();
    this.owners.forEach((o, p) => {
      if (!o) return;
      const at = plotAt(L, p);
      if (o === 'her') lantern(this.marks, at.x, at.y, s / 100, done);
      else paw(this.marks, at.x, at.y, s / 100);
    });
    this.hers.text = String(this.herPlots);
    this.pets.text = String(this.petPlots);
  }

  resize(view: View) {
    this.L = layout(view);
    const L = this.L;
    this.backdrop.resize(view);
    this.pad.hitArea = new Rectangle(
      L.field.x - L.field.w / 2,
      L.field.y - L.field.h / 2,
      L.field.w,
      L.field.h,
    );
    // The score strip: her lantern and count, the pet's paw and count, and what she can get.
    const { w, h } = L.score;
    const narrow = w < 420;
    this.strip.position.set(L.score.x, L.score.y);
    this.stripArt
      .clear()
      .roundRect(-w / 2, -h / 2, w, h, 22)
      .fill({ color: cream, alpha: 0.94 })
      .stroke({ width: 4, color: wood.fill });
    const left = -w / 2 + 44;
    lantern(this.stripArt, left, 0, 0.8);
    this.hers.position.set(left + 52, 0);
    paw(this.stripArt, left + 128, 0, 0.8);
    this.pets.position.set(left + 180, 0);
    this.goal.text = narrow ? `Get ${this.round.target}` : `You can get ${this.round.target}`;
    this.goal.position.set((left + 210 + w / 2) / 2, 0);
    this.help.position.set(L.help.x, L.help.y);
    this.help.hitArea = new Rectangle(-L.help.w / 2, -L.help.h / 2, L.help.w, L.help.h);
    this.helpArt
      .clear()
      .roundRect(-L.help.w / 2, -L.help.h / 2, L.help.w, L.help.h, 22)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: wood.line });
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.hintNow || this.phase !== 'turn') return;
    const { x, y } = railAt(this.L, this.hintNow.rail);
    const t = this.L.s / 2 - 16 + 6 * Math.sin(this.clock * 5);
    this.glow.roundRect(x - t / 2, y - t / 2, t, t, 16).stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.phase !== 'turn') return null;
    const { x, y } = railAt(this.L, hint(this.mask, this.level).rail);
    return { tap: { on: this.pad, x, y } };
  }
}

/** Two sides of a plot fenced, with a lantern in it. */
const ICON_MASK = (1 << 0) | (1 << 12) | (1 << 3) | (1 << 13) | (1 << 1);

function icon(): Container {
  const c = new Container();
  const m = miniField(44, ICON_MASK, 'lantern');
  m.position.set(0, -95);
  c.addChild(m);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const all = (pools as Pools)['1'];
  c.addChild(miniField(60, all[seed % all.length] | ICON_MASK, seed % 2 ? 'paw' : 'lantern'));
  return c;
}

export const game: GameModule = {
  id: 'fence-the-field',
  name: 'Fence the Field',
  titleLine: 'game.fence-the-field',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['looking ahead', 'counting what a move gives away', 'strategy'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'Talk through the rail together before it is laid: what does it hand the pet? Swap the phone after a round.',
  offScreen:
    'Dots and boxes on squared paper: a three by three field of dots for a quick game, or five by five for a long one.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  upright: true,
  touchDemo: true,
  create: (ctx) => new FenceTheField(ctx),
};
