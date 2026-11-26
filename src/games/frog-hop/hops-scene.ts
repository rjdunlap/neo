import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  hintCharge,
  hopsLayout,
  makeQuestions,
  openLine,
  planFor,
  routeLanding,
  routeWords,
  shortestRoute,
  type HopQuestion,
} from './logic';

/** Big hops and little hops (level 14): an open line, a frog and a flag, a big lily (+10), a small lily (+1) and back. */
const BIG = 10;
const SMALL = 1;
/** Two overshoots in a question are charged; a third is spoken only, so one wild question cannot bury a round. */
const MAX_CHARGED_OVERSHOOTS = 2;
/** After this many little hops on one question the big lily pulses once. */
const NUDGE_AFTER = 10;
const SKY = {
  sky: [0x8fd3f7, 0xe9f7ff],
  hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9],
  horizon: 0.42,
  clouds: 2,
  sun: true,
  seed: 61,
} satisfies ConstructorParameters<typeof Backdrop>[0];

class Lily extends Container {
  constructor(
    readonly size: number,
    text: string,
    color: 'green' | 'yellow' | 'white',
    box: number,
  ) {
    super();
    this.addChild(tile(box - 8, box - 8, color), label(text, box > 120 ? 54 : 48, ink));
    this.hitArea = new Rectangle(-box / 2, -box / 2, box, box);
  }
}

export class HopsLine implements Game {
  readonly questions: HopQuestion[];
  private readonly backdrop: Backdrop;
  private readonly line = new Graphics();
  private readonly arcs = new Container();
  private readonly flag = new Graphics();
  private readonly frog = frogArt();
  private readonly frogNum: Text;
  private readonly flagNum: Text;
  private readonly sign = new Container();
  private readonly signBoard = new Graphics();
  private readonly signText: Text;
  private readonly glow = new Graphics();
  private readonly big = new Lily(BIG, '+10', 'green', 140);
  private readonly small = new Lily(SMALL, '+1', 'yellow', 140);
  private readonly back = new Lily(0, '↶', 'white', 110);
  private view: View;
  private index = -1;
  /** The hops standing on this question, in order (`10` or `1`). */
  private route: number[] = [];
  private arcDraw: Graphics[] = [];
  private busy = true;
  private finished = false;
  private misses = 0;
  private hints = 0;
  private overs = 0;
  private charged = 0;
  private helped = false;
  private nudged = false;
  private glowing: Container | null = null;
  private clock = 0;
  private botWait = 1.5;
  private focus = 0;
  private couchOn = false;
  private unasked: (() => unknown) | null = null;
  private lo = 0;
  private scale = 12;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.questions = makeQuestions(planFor(ctx.level), ctx.rng);
    this.backdrop = new Backdrop(SKY, ctx.view);
    this.signText = label('', 46, ink);
    this.sign.addChild(this.signBoard, this.signText);
    for (const n of [this.line, this.arcs, this.flag, this.frog, this.sign, this.glow]) n.eventMode = 'none';
    this.flag
      .moveTo(0, 6)
      .lineTo(0, -96)
      .stroke({ width: 6, color: wood.line })
      .poly([3, -96, 46, -82, 3, -66])
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line });
    this.frogNum = label('', 36, ink);
    this.flagNum = label('', 36, ink);
    this.frogNum.eventMode = this.flagNum.eventMode = 'none';
    this.setSign('');
    this.flag.visible = false;
    ctx.stage.addChild(
      this.backdrop,
      this.line,
      this.arcs,
      this.flag,
      this.frog,
      this.frogNum,
      this.flagNum,
      this.sign,
      this.glow,
      this.big,
      this.small,
      this.back,
    );
    onTap(this.big, () => void this.hop(BIG), { cooldown: 200 });
    onTap(this.small, () => void this.hop(SMALL), { cooldown: 150 });
    onTap(this.back, () => void this.takeBack(), { cooldown: 200 });
    // A tap on the frog takes back the last hop as well.
    this.frog.eventMode = 'static';
    this.frog.hitArea = new Rectangle(-60, -90, 120, 110);
    onTap(this.frog, () => void this.takeBack(), { cooldown: 200 });
  }

  private get q() {
    return this.questions[this.index];
  }

  private get at() {
    return routeLanding(this.q.start, this.route);
  }

  private x(n: number) {
    const l = hopsLayout(this.view, GUIDE_CORNER.w).line;
    return (l.x0 + l.x1) / 2 + (n - this.lo - this.span / 2) * this.scale;
  }

  private span = 60;

  private get lineY() {
    return hopsLayout(this.view, GUIDE_CORNER.w).line.y;
  }

  start() {
    void this.next();
  }

  private setSign(text: string) {
    this.signText.text = text;
    const w = Math.min(720, Math.max(340, this.signText.width + 64));
    this.signBoard
      .clear()
      .roundRect(-w / 2, -46, w, 92, 24)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
  }

  /** Redraws the line for the question's window: marks every ten, no numbers but the frog's and the flag's. */
  private drawLine() {
    const q = this.q;
    const w = hopsLayout(this.view, GUIDE_CORNER.w).line;
    const { lo, hi, scale } = openLine(q, w.x1 - w.x0 - 40);
    this.lo = lo;
    this.span = hi - lo;
    this.scale = scale;
    const y = this.lineY;
    const g = this.line.clear();
    g.moveTo(this.x(lo), y).lineTo(this.x(hi), y).stroke({ width: 10, color: wood.line, cap: 'round' });
    for (let n = lo; n <= hi; n += 10)
      g.moveTo(this.x(n), y - 18)
        .lineTo(this.x(n), y + 18)
        .stroke({ width: 6, color: wood.line });
    for (let n = lo; n < hi; n++)
      if (n % 10)
        g.moveTo(this.x(n), y - 6)
          .lineTo(this.x(n), y + 6)
          .stroke({ width: 2, color: wood.line });
  }

  private place() {
    const q = this.q;
    if (!q) return;
    const y = this.lineY;
    this.flag.position.set(this.x(q.target), y);
    this.flagNum.text = String(q.target);
    this.flagNum.position.set(this.x(q.target) - this.flagNum.width / 2, y + 30);
    if (!this.hopping) this.frog.position.set(this.x(this.at), y - 10);
    this.frogNum.text = String(this.at);
    this.frogNum.position.set(this.x(this.at) - this.frogNum.width / 2, y + 74);
    this.redrawArcs();
  }

  private hopping = false;

  private redrawArcs() {
    this.arcs.removeChildren().forEach((c) => c.destroy());
    this.arcDraw = [];
    let at = this.q?.start ?? 0;
    const y = this.lineY;
    for (const hop of this.route) {
      const g = new Graphics();
      const a = this.x(at);
      const b = this.x(at + hop);
      const peak = hop === BIG ? 120 : 12;
      g.moveTo(a, y - 6)
        .quadraticCurveTo((a + b) / 2, y - 6 - peak * 2, b, y - 6)
        .stroke({ width: hop === BIG ? 6 : 4, color: swatch.green.line, alpha: 0.5 });
      this.arcs.addChild(g);
      this.arcDraw.push(g);
      at += hop;
    }
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const l = hopsLayout(v, GUIDE_CORNER.w);
    for (const [node, box] of [
      [this.big, l.big],
      [this.small, l.small],
      [this.back, l.back],
    ] as const)
      node.position.set(box.x, box.y);
    this.sign.position.set(l.sign.x, l.sign.y);
    if (this.q) {
      this.drawLine();
      this.place();
    }
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const at = this.glowing.position;
      g.circle(at.x, at.y, 88 + 4 * Math.sin(this.clock * 6)).stroke({ width: 7, color: swatch.yellow.fill });
    }
    if (this.couchOn && !this.busy && !this.finished) {
      const spot = this.spots[this.focus];
      g.roundRect(spot.x - 78, spot.y - 78, 156, 156, 26).stroke({ width: 8, color: swatch.teal.line });
    }
  }

  destroy() {}

  private get spots() {
    return [this.big, this.small, this.back];
  }

  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished || !this.q) return;
    for (const p of input.players) {
      if (p.direction === 0) this.focus = Math.min(2, this.focus + 1);
      else if (p.direction === 2) this.focus = Math.max(0, this.focus - 1);
      if (!p.action) continue;
      if (this.focus === 0) void this.hop(BIG);
      else if (this.focus === 1) void this.hop(SMALL);
      else void this.takeBack();
    }
  }

  /** The watch-me demo: the fewest-hops route, one lily at a time. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || !this.q || this.botWait > 0) return out;
    const want = this.nextLily();
    if (!want) return out;
    const spot = this.spots.indexOf(want);
    if (spot === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = spot > this.focus ? 0 : 2;
      this.botWait = 0.4;
    }
    return out;
  }

  /** The ghost finger: the big lily for the tens still to go, then the small lily for the ones (back first if past the flag). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.q) return null;
    const lily = this.nextLily();
    return lily ? { tap: { on: lily } } : null;
  }

  private nextLily(): Lily | null {
    const left = this.q.target - this.at;
    if (left < 0) return this.back;
    if (left >= BIG) return this.big;
    return left > 0 ? this.small : null;
  }

  private async next(line?: Promise<unknown>) {
    this.busy = true;
    this.unasked = null;
    this.index++;
    this.route = [];
    this.overs = 0;
    this.charged = 0;
    this.helped = false;
    this.nudged = false;
    this.glowing = null;
    if (this.index >= this.questions.length) return void this.finale();
    const q = this.q;
    this.drawLine();
    this.hopping = false;
    this.flag.visible = true;
    this.place();
    this.setSign(`${q.start} → ${q.target}`);
    this.busy = false;
    const say = () => this.ctx.instruct('hop.hops', { n: q.target });
    if (!line) void say();
    else {
      this.unasked = say;
      const at = this.index;
      void line.then(() => {
        if (this.index === at) this.askNow();
      });
    }
  }

  private askNow() {
    const say = this.unasked;
    if (!say || this.finished) return false;
    this.unasked = null;
    void say();
    return true;
  }

  sayWaitingAsk() {
    return this.askNow();
  }

  /** One hop animation to the number `to`, with the arc as long as the hop. */
  private async leapTo(to: number, size: number) {
    this.hopping = true;
    const y = this.lineY - 10;
    const lift = size === BIG ? 120 : 30;
    sfx.pop(size === BIG ? 3 : 7);
    void this.ctx.tw
      .to(this.frog, { y: y - lift }, { duration: 0.15, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y }, { duration: 0.15, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: this.x(to) }, { duration: 0.3 });
    this.frog.y = y;
    this.hopping = false;
    this.frogNum.text = String(to);
    this.frogNum.position.set(this.x(to) - this.frogNum.width / 2, this.lineY + 74);
  }

  private async hop(size: number) {
    if (this.busy || this.finished || !this.q) return;
    this.askNow();
    const q = this.q;
    const to = this.at + size;
    if (to > openLine(q).hi) {
      // The line ends here: the lily squeaks and nothing moves (free).
      sfx.squeak();
      return;
    }
    this.busy = true;
    this.glowing = null;
    this.route.push(size);
    this.redrawArcs();
    void this.ctx.say('count', { n: to });
    await this.leapTo(to, size);
    if (to === q.target) return void this.land();
    if (to > q.target) await this.over(to);
    else if (size === SMALL && !this.nudged && this.route.filter((h) => h === SMALL).length >= NUDGE_AFTER) {
      this.nudged = true;
      this.glowing = this.big;
      void this.ctx.say('hop.hops.nudge');
    }
    this.busy = false;
  }

  /** The frog landed past the flag: a miss (two charged a question), the back lily glows, the hop stays until she takes it back. */
  private async over(n: number) {
    this.overs++;
    if (this.charged < MAX_CHARGED_OVERSHOOTS) {
      this.charged++;
      this.misses++;
    }
    sfx.boing();
    this.glowing = this.back;
    await this.ctx.say('hop.hops.oops', { n });
    await this.ctx.say('hop.hops.over');
    if (this.overs >= 2 && !this.helped) await this.demonstrate();
  }

  private async takeBack() {
    if (this.busy || this.finished || !this.q || this.route.length === 0) return void sfx.squeak();
    this.askNow();
    this.busy = true;
    this.glowing = null;
    const size = this.route.pop()!;
    this.redrawArcs();
    await this.leapTo(this.at, size);
    this.busy = false;
  }

  /** The pause sheet's "show a hint", and a second overshoot: the shortest route from here, then back to where she was. */
  askForHint() {
    if (this.busy || this.finished || !this.q) return;
    if (this.helped)
      return void this.ctx.say('hop.hops.hint', { route: this.routeText(this.q.target - this.at) });
    this.busy = true;
    void this.demonstrate();
  }

  private routeText(left: number) {
    const r = shortestRoute(Math.max(0, left));
    return routeWords(r.bigs, r.smalls).toLowerCase();
  }

  private async demonstrate() {
    this.busy = true;
    const q = this.q;
    this.hints += hintCharge(2, !!this.glowing && this.glowing !== this.back, this.helped);
    this.helped = true;
    const kept = [...this.route];
    // Past the flag, back up to the start first (her hops are past use); otherwise start from where she stands.
    if (this.at > q.target) {
      this.route = [];
      this.redrawArcs();
      await this.leapTo(q.start, SMALL);
    }
    const from = this.at;
    const r = shortestRoute(q.target - from);
    await this.ctx.say('hop.hops.hint', { route: routeWords(r.bigs, r.smalls).toLowerCase() });
    const shown: number[] = [];
    for (const [count, size] of [
      [r.bigs, BIG],
      [r.smalls, SMALL],
    ] as const)
      for (let i = 0; i < count; i++) {
        shown.push(size);
        const to = from + shown.reduce((a, b) => a + b, 0);
        void this.ctx.say('count', { n: to });
        await this.leapTo(to, size);
        await this.ctx.tw.wait(0.25);
      }
    await this.ctx.tw.wait(0.3);
    await this.leapTo(from, SMALL);
    this.route = this.at > q.target ? [] : kept.slice(0, kept.length);
    this.redrawArcs();
    this.glowing = from + 10 <= q.target ? this.big : this.small;
    this.busy = false;
  }

  private async land() {
    const q = this.q;
    sfx.croak();
    sfx.sparkle();
    this.ctx.particles.burst(this.frog.x, this.frog.y - 40, {
      kind: 'star',
      colors: [0xffffff, swatch.green.light, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.ctx.pet.cheer();
    const bigs = this.route.filter((h) => h === BIG).length;
    const smalls = this.route.length - bigs;
    const line = this.ctx.say('hop.hops.yay', {
      route: routeWords(bigs, smalls),
      n: q.start,
      k: q.hops,
      m: q.target,
    });
    if (this.index + 1 >= this.questions.length) await line;
    await this.next(line);
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('hop.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
