import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { eggArt, shakerArt, thingArt, waterlineMark } from './art';
import {
  SALT_DEPTHS,
  saltRoundFor,
  sinkPlan,
  type SaltRound,
  type SaltTest,
  type Side,
  type SinkPlan,
  type Water,
} from './logic';

/** Where the round is: part 1's shaker, duck and egg, then part 2's test and answer for each question. */
type Phase = 'shake' | 'duck' | 'egg' | 'test' | 'answer';

interface Tank {
  l: number;
  r: number;
  top: number;
  surface: number;
  bottom: number;
}

/** One of the pair dropped together, one into each tank. */
interface Wet {
  node: Container;
  test: SaltTest;
  tank: number;
  /** How far its bottom sits under the surface, or null if it rests on the bottom. */
  depth: number | null;
  settled: boolean;
}

/** Half the drawn height of each test thing, so a depth can be measured from its bottom. */
const HALF: Record<SaltTest, number> = { duck: 38, egg: 36 };
const SIDES: Side[] = ['left', 'right'];

/**
 * Salty or fresh (level 10): two tanks side by side. Part 1 is watched and never scored: salt goes into one tank, then the
 * same duck and the same egg go into both. Part 2 hides which tank has the salt; she drops a test thing into both and taps
 * the salty tank, reading the evidence she has just seen.
 */
export class SaltTanks implements Game {
  readonly plan: SinkPlan;
  readonly round: SaltRound;
  phase: Phase = 'shake';
  /** Part 2's question, 0 to count - 1. */
  question = 0;
  shakes = 0;
  /** Misses on the current question; two bring the glow. */
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  readonly wet: Wet[] = [];

  private readonly background = new Graphics();
  private readonly tankBack = new Graphics();
  private readonly tankFront = new Graphics();
  private readonly trayPad = new Graphics();
  private readonly glow = new Graphics();
  private readonly ring = new Graphics();
  /** The tanks' tap targets, live only while she answers. */
  readonly areas = [new Container(), new Container()];
  readonly shaker = new Container();
  readonly tray = new Container();
  private trayArt: Container | null = null;
  private tanks: Tank[] = [];
  private view: View;
  private clock = 0;
  private hinted = false;
  private glowOn = false;
  /** A wrong tank's evidence line is playing. */
  private explaining = false;
  /** Where the shaker stands: its tank's counter spot, over the tank while shaking, or off-screen in part 2. */
  private shakerAt: 'home' | 'moving' | 'away' = 'home';
  private shakerSide: Side;
  private lastLine: LineId = 'sink.salt-shake';
  private pick = 0;
  private couchOn = false;
  private botWait = 1.2;
  askForHint = () => this.requestHint();
  hintLabel = 'Show a hint';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sinkPlan(ctx.level);
    this.round = saltRoundFor(this.plan, ctx.rng);
    this.shakerSide = this.round.shown;
    ctx.stage.addChild(this.background, this.tankBack, this.trayPad);
    this.shaker.addChild(shakerArt());
    this.shaker.hitArea = new Rectangle(-85, -75, 170, 150);
    onTap(this.shaker, () => void this.shake());
    this.tray.hitArea = new Rectangle(-85, -75, 170, 150);
    this.tray.visible = false;
    onTap(this.tray, () => void this.drop());
    for (const [i, area] of this.areas.entries()) {
      onTap(area, () => void this.answer(i));
      // Not live until both things have settled: a tap before then is ignored, with no sound.
      area.eventMode = 'none';
    }
    for (const g of [this.tankFront, this.glow, this.ring]) g.eventMode = 'none';
    ctx.stage.addChild(this.tray, this.tankFront, this.shaker, ...this.areas, this.glow, this.ring);
  }

  start() {
    this.resize(this.view);
    this.instruct('sink.salt-shake');
  }

  private instruct(line: LineId) {
    this.lastLine = line;
    void this.ctx.instruct(line);
  }

  /** Which water each tank holds right now: part 1's shaker tank, or the current question's hidden one. */
  private water(tank: number): Water {
    const salty =
      this.phase === 'shake' || this.phase === 'duck' || this.phase === 'egg'
        ? this.round.shown
        : this.round.questions[this.question].salty;
    return SIDES[tank] === salty ? 'salty' : 'fresh';
  }

  private get test(): SaltTest {
    if (this.phase === 'duck') return 'duck';
    if (this.phase === 'egg') return 'egg';
    return this.round.questions[this.question].test;
  }

  // Part 1 -------------------------------------------------------------------------------

  /** One shake: the shaker tips over its tank and grains fall and fade into the water. Three, and the duck comes out. */
  private async shake() {
    if (this.phase !== 'shake' || this.busy || this.finished) return;
    this.busy = true;
    const tw = this.ctx.tw;
    const t = this.tanks[SIDES.indexOf(this.shakerSide)];
    const x = (t.l + t.r) / 2;
    const tip = this.shakerSide === 'left' ? 2.4 : -2.4;
    this.shakerAt = 'moving';
    await tw.to(this.shaker, { x, y: t.top - 60, rotation: tip }, { duration: 0.35, ease: ease.outQuad });
    sfx.tick();
    this.ctx.particles.burst(x, t.top - 20, {
      colors: [swatch.white.fill, swatch.white.light],
      count: 18,
      speed: [60, 160],
      gravity: 500,
      angle: Math.PI / 2,
      spread: 0.7,
      size: [0.15, 0.3],
      life: [0.5, 0.8],
    });
    await tw.wait(0.3);
    this.shakes++;
    await tw.to(this.shaker, { ...this.shakerHome(), rotation: 0 }, { duration: 0.3, ease: ease.inOutSine });
    this.shakerAt = 'home';
    this.busy = false;
    if (this.shakes < 3) return;
    this.phase = 'duck';
    this.showTray();
    this.instruct('sink.salt-duck-ask');
  }

  /** The thing to tap waits on the tray between the tanks. */
  private showTray() {
    this.trayArt?.destroy({ children: true });
    this.trayArt = this.test === 'duck' ? thingArt('duck') : eggArt();
    this.trayArt.scale.set(1.2);
    this.tray.addChild(this.trayArt);
    this.tray.visible = true;
    this.tray.scale.set(0);
    void this.ctx.tw.to(this.tray.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  /** One tap drops two of the same thing, one into each tank, together. */
  private async drop() {
    if (
      (this.phase !== 'duck' && this.phase !== 'egg' && this.phase !== 'test') ||
      this.busy ||
      this.finished
    )
      return;
    this.busy = true;
    this.tray.visible = false;
    const test = this.test;
    await Promise.all([0, 1].map((i) => this.splash(test, i)));
    if (this.finished) return;
    if (this.phase === 'duck') {
      await this.ctx.say('sink.salt-duck');
      await this.ctx.tw.wait(0.6);
      await this.liftOut();
      this.phase = 'egg';
      this.busy = false;
      this.showTray();
      return this.instruct('sink.salt-egg-ask');
    }
    if (this.phase === 'egg') {
      await this.ctx.say('sink.salt-egg');
      await this.ctx.say('sink.salt-why');
      await this.liftOut();
      this.shakerAt = 'away';
      await this.ctx.tw.to(this.shaker, this.shakerAway(), { duration: 0.5, ease: ease.inQuad });
      await this.ctx.say('sink.salt-hide');
      this.busy = false;
      return this.nextQuestion(0);
    }
    // Part 2: only now, with both things settled, do the tanks take a tap.
    this.phase = 'answer';
    this.busy = false;
    for (const a of this.areas) a.eventMode = 'static';
    this.instruct('sink.salt-which');
  }

  /** Arcs one thing from the tray into a tank; it bobs at its water's depth or drifts to the bottom. */
  private async splash(test: SaltTest, tank: number) {
    const tw = this.ctx.tw;
    const t = this.tanks[tank];
    const node = new Container();
    node.eventMode = 'none';
    node.addChild(test === 'duck' ? thingArt('duck') : eggArt());
    // The duck carries a dashed mark where plain water meets it, so in salty water the mark rides above the surface.
    if (test === 'duck')
      node.addChild(waterlineMark(new Graphics(), 0, HALF.duck - (SALT_DEPTHS.duck.fresh ?? 0), 76));
    node.position.copyFrom(this.tray.position);
    this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.tankFront));
    const wet: Wet = { node, test, tank, depth: SALT_DEPTHS[test][this.water(tank)], settled: false };
    this.wet.push(wet);
    const x = (t.l + t.r) / 2;
    await tw.to(node, { x, y: t.top - 70 }, { duration: 0.45, ease: ease.outQuad });
    await tw.to(node, { y: t.surface }, { duration: 0.25, ease: ease.inQuad });
    if (tank === 0) sfx.splash();
    this.ctx.particles.burst(x, t.surface, {
      colors: [swatch.blue.fill, swatch.blue.light],
      count: 12,
      speed: [150, 300],
      gravity: 700,
      angle: -Math.PI / 2,
      spread: 1.4,
      size: [0.3, 0.5],
    });
    if (wet.depth !== null) {
      await tw.to(node, { y: this.restY(wet) }, { duration: 0.4, ease: ease.outBack });
      if (tank === 0) sfx.pop(9);
    } else {
      this.ctx.particles.burst(x, t.surface + 40, {
        kind: 'ring',
        colors: [swatch.white.fill],
        count: 6,
        speed: [20, 60],
        gravity: -120,
        angle: -Math.PI / 2,
        spread: 0.6,
        life: [0.8, 1.2],
      });
      await tw.to(node, { y: this.restY(wet) }, { duration: 1.1, ease: ease.inOutSine });
      sfx.clunk();
    }
    wet.settled = true;
  }

  /** A floater's centre so its bottom sits `depth` under the surface; a sinker resting on the bottom. */
  private restY(w: Wet) {
    const t = this.tanks[w.tank];
    const half = HALF[w.test];
    return w.depth === null ? t.bottom - half - 8 : t.surface + w.depth - half;
  }

  /** The things lift out of the water and fade. */
  private async liftOut() {
    const tw = this.ctx.tw;
    const old = this.wet.splice(0);
    await Promise.all(
      old.map((w) =>
        tw.to(w.node, { y: this.tanks[w.tank].top - 60, alpha: 0 }, { duration: 0.45, ease: ease.inQuad }),
      ),
    );
    for (const w of old) {
      tw.kill(w.node);
      w.node.destroy({ children: true });
    }
  }

  // Part 2 -------------------------------------------------------------------------------

  private nextQuestion(q: number) {
    if (q >= this.round.questions.length) return void this.end();
    this.question = q;
    this.wrong = 0;
    this.hinted = this.glowOn = this.explaining = false;
    this.phase = 'test';
    this.drawGlow();
    this.showTray();
    this.instruct(this.test === 'egg' ? 'sink.salt-test-egg' : 'sink.salt-test-duck');
  }

  private async answer(tank: number) {
    if (this.phase !== 'answer' || this.busy || this.finished) return;
    const q = this.round.questions[this.question];
    if (SIDES[tank] !== q.salty) {
      // While the last wrong tank's line plays, more taps on a wrong tank count nothing: one miss per look.
      if (this.explaining) return;
      // She has already seen the test, so a wrong tank is a miss; the things stay in so she can look again.
      this.misses++;
      this.wrong++;
      this.explaining = true;
      const asked = this.question;
      sfx.boing();
      await this.ctx.say(q.test === 'egg' ? 'sink.salt-wrong-egg' : 'sink.salt-wrong-duck');
      this.explaining = false;
      // A right tap during the line may have moved on: the glow belongs only to a question still open.
      if (
        this.wrong >= 2 &&
        !this.finished &&
        !this.busy &&
        this.phase === 'answer' &&
        this.question === asked
      )
        this.showHint();
      return;
    }
    this.busy = true;
    for (const a of this.areas) a.eventMode = 'none';
    this.glowOn = false;
    this.drawGlow();
    const t = this.tanks[tank];
    sfx.sparkle();
    this.ctx.pet.cheer();
    this.ctx.particles.burst((t.l + t.r) / 2, t.surface, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.white.fill],
      count: 14,
      speed: [120, 260],
      gravity: 200,
      angle: -Math.PI / 2,
      spread: 2,
    });
    // The shaker pops up beside the salty tank: that is where the salt went.
    this.shakerSide = q.salty;
    this.shakerAt = 'home';
    this.ctx.tw.kill(this.shaker);
    this.shaker.position.copyFrom(this.shakerHome());
    this.shaker.rotation = 0;
    this.shaker.scale.set(0);
    void this.ctx.tw.to(this.shaker.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    // The lesson line plays over the lift-out and the shaker's exit (U7 R4) and never holds the next test; after the
    // last question it is heard out, because the closing line would cut it.
    const lesson = this.ctx.say('sink.salt-right');
    await this.liftOut();
    this.shakerAt = 'away';
    await this.ctx.tw.to(this.shaker, this.shakerAway(), { duration: 0.4, ease: ease.inQuad });
    if (this.question + 1 >= this.round.questions.length) await lesson;
    this.busy = false;
    this.nextQuestion(this.question + 1);
  }

  /** The salty tank's rim glows, with a line about what to look for. One hint per question, however it was asked for. */
  private showHint() {
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    this.glowOn = true;
    this.drawGlow();
    void this.ctx.say(this.test === 'egg' ? 'sink.salt-hint-egg' : 'sink.salt-hint-duck');
  }

  /** The pause sheet's Show a hint: the glow once the test has settled, otherwise the current instruction again, uncounted. */
  private requestHint() {
    if (this.finished) return;
    if (this.phase === 'answer' && !this.busy) this.showHint();
    else void this.ctx.instruct(this.lastLine);
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.tray.visible = false;
    await this.ctx.tw.wait(0.8);
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('sink.done');
    // Nothing new for the journal: the duck has its page, and the egg is not one of the things.
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Bots and the controller ------------------------------------------------------------

  /** The live target: the shaker, then the duck or egg on the tray, then the salty tank once both things have settled. */
  private target(): { node: Container; x: number; y: number } | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'shake') return { node: this.shaker, x: this.shaker.x, y: this.shaker.y };
    if (this.phase !== 'answer')
      return this.tray.visible ? { node: this.tray, x: this.tray.x, y: this.tray.y } : null;
    const i = SIDES.indexOf(this.round.questions[this.question].salty);
    const t = this.tanks[i];
    return { node: this.areas[i], x: (t.l + t.r) / 2, y: (t.surface + t.bottom) / 2 };
  }

  autotouch(): TouchIntent | null {
    const t = this.target();
    return t ? { tap: { on: t.node, x: t.x, y: t.y } } : null;
  }

  /** Before the test the action button presses the live target; answering, left and right ring a tank and the action picks it. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished) return;
    for (const p of input.players) {
      if (this.phase !== 'answer') {
        if (p.action) return void (this.phase === 'shake' ? this.shake() : this.drop());
        continue;
      }
      if (p.direction === 0) this.pick = 1;
      else if (p.direction === 2) this.pick = 0;
      if (p.action) return void this.answer(this.pick);
    }
  }

  /** The "watch me" demo: presses the live target, then rings and picks the salty tank. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0) return out;
    if (this.phase === 'answer') {
      const want = SIDES.indexOf(this.round.questions[this.question].salty);
      if (want !== this.pick) {
        out.players[0].direction = want === 1 ? 0 : 2;
        this.botWait = 0.6;
        return out;
      }
    } else if (this.phase !== 'shake' && !this.tray.visible) return out;
    out.players[0].action = true;
    this.botWait = 1.2;
    return out;
  }

  // Layout -----------------------------------------------------------------------------

  private shakerHome() {
    const v = this.view;
    const l = 190;
    const r = v.w - 40;
    return { x: this.shakerSide === 'left' ? l + 90 : r - 90, y: v.h - 85 };
  }

  private shakerAway() {
    return { x: this.view.w + 120, y: this.view.h - 85 };
  }

  resize(v: View) {
    this.view = v;
    const counter = v.h * 0.74;
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.teal.light)
      .rect(0, counter, v.w, v.h - counter)
      .fill(wood.light)
      .rect(0, counter - 8, v.w, 12)
      .fill(wood.fill);
    // Two tanks share the span right of the pet, with a gap between them.
    const l = 190;
    const span = v.w - 40 - l;
    const w = (span - 30) / 2;
    this.tanks = [0, 1].map((i) => ({
      l: l + i * (w + 30),
      r: l + i * (w + 30) + w,
      top: 150,
      surface: 230,
      bottom: counter,
    }));
    const back = this.tankBack.clear();
    const front = this.tankFront.clear();
    for (const [i, t] of this.tanks.entries()) {
      back
        .roundRect(t.l, t.top, t.r - t.l, t.bottom - t.top, 24)
        .fill({ color: swatch.white.fill, alpha: 0.5 })
        .rect(t.l + 6, t.surface, t.r - t.l - 12, t.bottom - t.surface - 6)
        .fill({ color: swatch.blue.fill, alpha: 0.35 });
      // A light wash in front, so whatever sits under the surface reads as under water and the floaters' heights compare.
      front
        .rect(t.l + 6, t.surface, t.r - t.l - 12, t.bottom - t.surface - 6)
        .fill({ color: swatch.blue.fill, alpha: 0.18 });
      front.moveTo(t.l + 6, t.surface);
      for (let x = t.l + 6; x <= t.r - 6; x += 20) front.lineTo(x, t.surface + Math.sin(x / 30) * 4);
      front.stroke({ width: 4, color: swatch.blue.fill, alpha: 0.8 });
      front
        .roundRect(t.l, t.top, t.r - t.l, t.bottom - t.top, 24)
        .stroke({ width: 8, color: swatch.white.fill })
        .roundRect(t.l + 18, t.top + 20, 14, 120, 7)
        .fill({ color: swatch.white.fill, alpha: 0.6 });
      this.areas[i].hitArea = new Rectangle(t.l, t.top, t.r - t.l, t.bottom - t.top);
    }
    const trayX = l + span / 2;
    this.trayPad
      .clear()
      .roundRect(trayX - 95, v.h - 150, 190, 130, 30)
      .fill({ color: swatch.white.fill, alpha: 0.6 });
    this.tray.position.set(trayX, v.h - 85);
    if (this.shakerAt === 'home') this.shaker.position.copyFrom(this.shakerHome());
    else if (this.shakerAt === 'away') this.shaker.position.copyFrom(this.shakerAway());
    for (const wet of this.wet) {
      const t = this.tanks[wet.tank];
      wet.node.x = (t.l + t.r) / 2;
      if (wet.settled) wet.node.y = this.restY(wet);
    }
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.glowOn || this.phase !== 'answer' || this.finished) return;
    const t = this.tanks[SIDES.indexOf(this.round.questions[this.question].salty)];
    g.roundRect(t.l - 8, t.top - 8, t.r - t.l + 16, t.bottom - t.top + 16, 30).stroke({
      width: 8,
      color: swatch.yellow.line,
    });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    // Both floaters bob together, so the only difference between the tanks is how high they sit.
    for (const w of this.wet) {
      if (!w.settled || w.depth === null) continue;
      w.node.y = this.restY(w) + Math.sin(this.clock * 2.4) * 3;
      w.node.rotation = Math.sin(this.clock * 1.8) * 0.05;
    }
    const ring = this.ring.clear();
    if (this.couchOn && this.phase === 'answer' && !this.busy && !this.finished) {
      const t = this.tanks[this.pick];
      ring
        .roundRect(t.l - 14, t.top - 14, t.r - t.l + 28, t.bottom - t.top + 28, 34)
        .stroke({ width: 8, color: swatch.teal.line });
    }
  }

  destroy() {
    this.finished = true;
  }
}
