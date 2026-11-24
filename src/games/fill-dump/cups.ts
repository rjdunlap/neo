import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  BOWL_HIT,
  CUPS_PAIRS,
  TALLY_CARD,
  TUB_HIT,
  bowlHeight,
  cupsBowl,
  cupsLayout,
  cupsMore,
  cupsNext,
  cupsPair,
  cupsTub,
  startCups,
  type BowlPair,
  type CupsState,
} from './logic';

const stroke = (color = ink, width = 6) => ({ color, width, join: 'round' as const, cap: 'round' as const });

/** The scoop's moves: dip into the tub, or carry a cupful over a bowl and tip it. Seconds each. */
const SCOOP_S = 0.45;
const POUR_S = 0.6;
/** How fast the water shown in a bowl catches up with the cupfuls poured, in cups per second. */
const RISE = 2.5;

/** A tally card: one stroke per cupful, the fifth across the first four. */
function drawTally(g: Graphics, n: number) {
  g.clear()
    .roundRect(-TALLY_CARD.w / 2, -TALLY_CARD.h / 2, TALLY_CARD.w, TALLY_CARD.h, 16)
    .fill(0xfffaf0)
    .stroke(stroke(wood.line, 5));
  const gap = 24;
  const left = -TALLY_CARD.w / 2 + 30;
  for (let i = 0; i < n; i++) {
    const group = Math.floor(i / 5);
    const inGroup = i % 5;
    const x0 = left + group * (gap * 4 + 34);
    if (inGroup === 4) {
      g.moveTo(x0 - 10, 22).lineTo(x0 + gap * 3 + 10, -22);
    } else {
      const x = x0 + inGroup * gap;
      g.moveTo(x, -28).lineTo(x, 28);
    }
  }
  if (n) g.stroke(stroke(swatch.blue.line, 9));
}

/**
 * Level 9, How many cups?: a little cup scoops from the tub and pours into two bowls, one cupful per two taps, each counted
 * aloud with a tally stroke under the bowl. When both are full: which bowl took more cups? Filling is never judged; only
 * that answer is, with the two tallies counted again after a wrong pick and the right bowl glowing after two.
 */
export class CupsGame implements Game {
  readonly state: CupsState;
  readonly tub = new Container();
  readonly bowls = [new Container(), new Container()] as const;
  private readonly tubArt = new Graphics();
  private readonly bowlArt = [new Graphics(), new Graphics()] as const;
  private readonly tallies = [new Graphics(), new Graphics()] as const;
  private readonly cup = new Graphics();
  private readonly bg = new Graphics();
  private readonly stream = new Graphics();
  private readonly halo = new Graphics();
  private readonly markers = new Graphics();
  private layout = cupsLayout(1024, 768);
  private view: View;
  /** Water drawn in each bowl, in cups: it rises toward the cupfuls poured. */
  private shown: [number, number] = [0, 0];
  /** The scoop's current move. */
  private move: { kind: 'scoop' | 'pour'; side: 0 | 1; t: number } | null = null;
  /** After a right answer the answered pair stays in view while its line is said; taps wait. */
  private held: { pair: BowlPair; poured: [number, number] } | null = null;
  /** The tally being counted aloud after a wrong pick. */
  private pulse: 0 | 1 | null = null;
  private clock = 0;
  private gone = false;

  get misses() {
    return this.state.misses;
  }
  get hints() {
    return this.state.hints;
  }

  constructor(private readonly ctx: GameContext) {
    this.state = startCups(ctx.rng);
    this.view = ctx.view;
    this.tub.addChild(this.tubArt);
    this.tub.hitArea = new Rectangle(TUB_HIT.x, TUB_HIT.y, TUB_HIT.w, TUB_HIT.h);
    this.bowls.forEach((bowl, side) => {
      bowl.addChild(this.bowlArt[side]);
      bowl.hitArea = new Rectangle(BOWL_HIT.x, BOWL_HIT.y, BOWL_HIT.w, BOWL_HIT.h);
      onTap(bowl, () => this.touchBowl(side as 0 | 1), { cooldown: 150 });
    });
    onTap(this.tub, () => this.touchTub(), { cooldown: 150 });
    for (const deco of [this.bg, this.stream, this.halo, this.markers, this.cup, ...this.tallies])
      deco.eventMode = 'none';
    ctx.stage.addChild(
      this.bg,
      this.halo,
      this.tub,
      ...this.bowls,
      ...this.tallies,
      this.stream,
      this.cup,
      this.markers,
    );
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct('fill.cups.start');
  }

  resize(v: View) {
    this.view = v;
    this.layout = cupsLayout(v.w, v.h);
    const l = this.layout;
    this.tub.position.set(l.tub.x, l.tub.y);
    this.bowls.forEach((b, side) => b.position.set(l.bowls[side].x, l.bowls[side].y));
    this.tallies.forEach((t, side) => t.position.set(l.bowls[side].x, l.tally));
    this.bg
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.blue.light)
      .roundRect(150, l.tub.y, v.w - 190, 24, 12)
      .fill(wood.fill);
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const { pair, poured } = this.showing();
    for (const side of [0, 1] as const) {
      const to = Math.min(poured[side], pair[side].cups);
      // Water rises only once the cup is over the bowl and tipping.
      const pouring = this.move?.kind === 'pour' && this.move.side === side && this.move.t < POUR_S * 0.35;
      const target = pouring ? to - 1 : to;
      this.shown[side] =
        this.shown[side] < target
          ? Math.min(target, this.shown[side] + RISE * dt)
          : Math.max(target, this.shown[side] - RISE * 4 * dt);
    }
    if (this.move) {
      this.move.t += dt;
      if (this.move.t >= (this.move.kind === 'scoop' ? SCOOP_S : POUR_S)) this.move = null;
    }
    this.tallies.forEach((t, side) => {
      const s = this.pulse === side ? 1.12 + Math.sin(this.clock * 10) * 0.06 : 1;
      t.scale.set(s);
    });
    this.draw();
  }

  destroy() {
    this.gone = true;
    for (const target of [this.tub, ...this.bowls]) target.removeAllListeners();
  }

  /** The ghost finger: scoop, pour into the first bowl with room, then tap the bowl that took more. */
  autotouch(): TouchIntent | null {
    if (this.state.done || this.held || this.move || this.pulse !== null) return null;
    const next = cupsNext(this.state);
    if (next === null) return null;
    if (next === 'tub') return { tap: { on: this.tub, y: -60 } };
    return { tap: { on: this.bowls[next], y: -60 } };
  }

  // ---- Touches ----------------------------------------------------------------------------------------------------

  private touchTub() {
    if (this.gone || this.held) return;
    const ev = cupsTub(this.state);
    if (ev.kind === 'scoop') {
      sfx.splash();
      this.move = { kind: 'scoop', side: 0, t: 0 };
    } else if (ev.kind === 'held') {
      // Already full: a little slosh, nothing changes.
      sfx.tick();
      this.move = { kind: 'scoop', side: 0, t: SCOOP_S * 0.6 };
    } else sfx.tick();
  }

  private touchBowl(side: 0 | 1) {
    if (this.gone || this.held) return;
    // While both tallies are being counted aloud, a bowl answers with a tick and waits, so one recount never overlaps another.
    if (this.pulse !== null) {
      sfx.tick();
      return;
    }
    const ev = cupsBowl(this.state, side);
    switch (ev.kind) {
      case 'empty':
        sfx.tick();
        void this.ctx.say('fill.cups.scoopfirst');
        return;
      case 'brim':
        sfx.tick();
        void this.ctx.say('fill.cups.brim');
        return;
      case 'pour':
        this.move = { kind: 'pour', side, t: 0 };
        sfx.marimba(1 + ev.n, 0.4);
        void this.ctx.say('fill.count', { n: ev.n }).then(() => {
          if (this.gone) return;
          if (ev.ask) void this.ctx.instruct('fill.cups.ask');
          else if (ev.full) void this.ctx.say('fill.cups.full', { n: ev.n });
        });
        return;
      case 'wrong':
        sfx.boing();
        void this.recount(ev.hint);
        return;
      case 'right':
        this.answered(ev.side, ev.more, ev.fewer, ev.done);
        return;
      default:
        return;
    }
  }

  /** A wrong pick: count both tallies aloud side by side, each pulsing as it is said; the glow follows the second miss. */
  private async recount(hint: boolean) {
    const p = cupsPair(this.state);
    this.pulse = 0;
    await this.ctx.say('fill.cups.this', { n: p[0].cups });
    if (this.gone) return;
    this.pulse = 1;
    await this.ctx.say('fill.cups.that', { n: p[1].cups });
    if (this.gone) return;
    this.pulse = null;
    if (hint) void this.ctx.say('fill.cups.hint');
  }

  private answered(side: 0 | 1, more: number, fewer: number, done: boolean) {
    sfx.tick();
    sfx.marimba(5, 0.4);
    const answered = this.state.pairs[this.state.round - 1];
    this.held = { pair: answered, poured: [answered[0].cups, answered[1].cups] };
    this.ctx.particles.burst(this.bowls[side].x, this.bowls[side].y - 120, {
      kind: 'confetti',
      colors: [swatch.blue.fill, swatch.yellow.fill, swatch.green.fill],
      count: 24,
      speed: [200, 420],
      angle: -Math.PI / 2,
      spread: 1.4,
      gravity: 600,
      life: [0.8, 1.2],
    });
    void this.ctx.say('fill.cups.right', { n: more, m: fewer }).then(async () => {
      if (this.gone) return;
      if (done) {
        await this.ctx.say('fill.cups.done');
        if (!this.gone) this.ctx.finish({ misses: this.misses, hints: this.hints });
        return;
      }
      this.held = null;
      this.shown = [0, 0];
      void this.ctx.instruct('fill.cups.start');
    });
  }

  // ---- Drawing ----------------------------------------------------------------------------------------------------

  private showing(): { pair: BowlPair; poured: [number, number] } {
    return this.held ?? { pair: cupsPair(this.state), poured: this.state.poured };
  }

  /** The scoop's place and tilt now, and whether it holds water. */
  private cupPose(): { x: number; y: number; tilt: number; water: boolean } {
    const l = this.layout;
    const rest = l.cup;
    const m = this.move;
    if (!m) return { ...rest, tilt: 0, water: this.state.scooped && !this.state.done };
    if (m.kind === 'scoop') {
      const u = Math.min(1, m.t / SCOOP_S);
      const dip = Math.sin(u * Math.PI);
      return { x: rest.x, y: rest.y + dip * 115, tilt: 0, water: u > 0.5 };
    }
    // Pour: carry over the bowl's top-left rim, tip, and come back.
    const u = Math.min(1, m.t / POUR_S);
    const bowl = l.bowls[m.side];
    const pair = this.showing().pair;
    const over = { x: bowl.x - 40, y: bowl.y - bowlHeight(pair[m.side]) - 70 };
    const go = u < 0.3 ? u / 0.3 : u > 0.7 ? (1 - u) / 0.3 : 1;
    const ease = go * go * (3 - 2 * go);
    const tilt = u > 0.25 && u < 0.75 ? Math.sin(((u - 0.25) / 0.5) * Math.PI) * 1.5 : 0;
    return {
      x: rest.x + (over.x - rest.x) * ease,
      y: rest.y + (over.y - rest.y) * ease,
      tilt,
      water: u < 0.45,
    };
  }

  private draw() {
    const { pair, poured } = this.showing();
    const s = this.state;
    const l = this.layout;
    // The tub: a wide wooden tub of water.
    this.tubArt
      .clear()
      .roundRect(-90, -110, 180, 110, 20)
      .fill(wood.fill)
      .stroke(stroke(wood.line, 6))
      .roundRect(-78, -100, 156, 26, 12)
      .fill(swatch.blue.fill)
      .moveTo(-95, -110)
      .lineTo(95, -110)
      .stroke(stroke(wood.line, 10))
      .moveTo(-90, -55)
      .lineTo(90, -55)
      .stroke(stroke(wood.line, 4));
    // Straight-sided bowls: water height is cupfuls times the cup's area over the bowl's width.
    for (const side of [0, 1] as const) {
      const b = pair[side];
      const h = bowlHeight(b);
      const w = b.width;
      const g = this.bowlArt[side].clear();
      g.rect(-w / 2 - 7, -h - 7, w + 14, h + 14)
        .fill(0xffffff)
        .stroke(stroke(swatch.blue.line));
      const water = Math.max(0, Math.min(b.cups, this.shown[side]));
      if (water > 1e-3) g.rect(-w / 2, -bowlHeight(b, water), w, bowlHeight(b, water)).fill(swatch.blue.fill);
      g.moveTo(-w / 2 - 12, -h - 7)
        .lineTo(w / 2 + 12, -h - 7)
        .stroke(stroke(swatch.blue.line, 9));
      drawTally(this.tallies[side], poured[side]);
    }
    // The scoop: a small cup with a handle, carrying water when full.
    const pose = this.cupPose();
    const c = this.cup.clear();
    c.position.set(pose.x, pose.y);
    c.rotation = pose.tilt;
    c.roundRect(-34, -30, 68, 60, 10)
      .fill(0xffffff)
      .stroke(stroke(swatch.orange.line, 6))
      .moveTo(34, -16)
      .bezierCurveTo(62, -18, 62, 18, 34, 16)
      .stroke(stroke(swatch.orange.line, 8));
    if (pose.water) c.roundRect(-28, -18, 56, 44, 8).fill(swatch.blue.fill);
    // The stream, while the cup is tipped over a bowl.
    this.stream.clear();
    const m = this.move;
    if (m?.kind === 'pour' && m.t > POUR_S * 0.3 && m.t < POUR_S * 0.6) {
      const bowl = l.bowls[m.side];
      const surface = bowl.y - bowlHeight(pair[m.side], this.shown[m.side]);
      this.stream
        .moveTo(pose.x + 30, pose.y + 10)
        .quadraticCurveTo(bowl.x - 10, pose.y + 10, bowl.x - 10, surface)
        .stroke(stroke(swatch.blue.fill, 12));
    }
    // The question: a frame on each bowl. Round dots at the top.
    const mk = this.markers.clear();
    if (s.phase === 'answer' && !s.done && !this.held)
      for (const bowl of this.bowls)
        mk.roundRect(bowl.x + BOWL_HIT.x, bowl.y + BOWL_HIT.y, BOWL_HIT.w, BOWL_HIT.h, 16).stroke(
          stroke(swatch.purple.line, 4),
        );
    const done = this.held ? s.round : Math.min(s.round, CUPS_PAIRS);
    for (let i = 0; i < CUPS_PAIRS; i++)
      mk.circle(this.view.w / 2 + (i - (CUPS_PAIRS - 1) / 2) * 45, 120, 14)
        .fill(i < done ? swatch.green.fill : 0xffffff)
        .stroke(stroke(swatch.blue.line, 3));
    // The glow on the bowl that took more, once this pair's hint has come.
    this.halo.clear();
    if (s.helped && s.phase === 'answer' && !s.done && !this.held) {
      const more = this.bowls[cupsMore(pair)];
      this.halo
        .roundRect(more.x + BOWL_HIT.x - 10, more.y + BOWL_HIT.y - 10, BOWL_HIT.w + 20, BOWL_HIT.h + 20, 20)
        .fill({ color: 0xfff3a0, alpha: 0.55 + 0.3 * Math.sin(this.clock * 6) });
    }
  }
}
