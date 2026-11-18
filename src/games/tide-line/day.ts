import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { tally } from '../../progress/coach';
import type { Game, GameContext, TouchIntent } from '../types';
import { dayFlag, dayShore, flagButton, skyIcon } from './art';
import {
  AUTHORED_DAY,
  dayLayout,
  dayWater,
  fitting,
  FLAG_BUTTON,
  KNOB,
  makeDay,
  nearestStop,
  POOL_RIM,
  POOL_TOP,
  PoolTime,
  stopT,
  tidePlan,
  trackT,
  trackX,
  type DayLayout,
  type Plan,
  type PoolAsk,
} from './logic';

/** The authored day leads the first round of a session, and every demonstration. */
let authoredShown = false;

/** Seconds the sea takes to move when a stop is tapped, and to settle on a stop when the marker is let go. */
const GLIDE = 0.45;
const SNAP = 0.18;

/**
 * Tide Line level 5, Pool time (docs/definitions/tide-line-5-6.md): the day is a strip she slides a marker along, the
 * shore above it showing the sea at that time; the flag button marks the time the marker rests on. She marks a time the
 * rock pool shows, then a time the sea covers it.
 */
export class PoolDay implements Game {
  readonly plan: Plan;
  readonly turn: PoolTime;
  /** The time of day the shore shows, 0 to 1. */
  readonly now = { t: 0 };
  busy = false;
  finished = false;
  /** At the stage's origin: the ghost finger's drop spots are given in its coordinates. */
  readonly board = new Container();
  readonly stops: Container[] = [];
  readonly knob = new Container();
  readonly flagBtn = new Container();
  D: DayLayout;
  view: View;
  private handle: DragHandle;
  private readonly picture = new Graphics();
  private readonly strip = new Graphics();
  private readonly glow = new Graphics();
  private readonly flagLayer = new Container();
  private readonly pinned: Container[] = [];
  private drawn = -1;
  private clock = 0;
  /** The second ask waits behind the first flag's line; a tap on the guide says it at once. */
  private waitingAsk = false;
  readonly askForHint = () => this.help();
  readonly hintLabel = 'Show me';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.D = dayLayout(ctx.view);
    this.plan = tidePlan(ctx.level);
    const authored = !!ctx.demo || !authoredShown;
    authoredShown = true;
    this.turn = new PoolTime(authored ? AUTHORED_DAY : makeDay(ctx.rng));
    for (const g of [this.picture, this.strip, this.glow]) g.eventMode = 'none';
    this.flagLayer.eventMode = 'none';
    ctx.stage.addChild(this.board, this.picture, this.strip, this.glow);
    for (let i = 0; i < 4; i++) {
      const node = new Container();
      node.addChild(new Graphics());
      onTap(node, () => this.goTo(i));
      this.stops.push(node);
      ctx.stage.addChild(node);
    }
    const fb = new Graphics();
    flagButton(fb);
    this.flagBtn.addChild(fb);
    this.flagBtn.hitArea = new Rectangle(0, 0, FLAG_BUTTON, FLAG_BUTTON);
    this.flagBtn.pivot.set(FLAG_BUTTON / 2, FLAG_BUTTON / 2);
    onTap(this.flagBtn, () => this.tapFlag());
    const k = new Graphics();
    k.circle(0, 0, 44).fill(swatch.blue.fill).stroke({ color: swatch.blue.line, width: 5 });
    k.moveTo(-14, -6)
      .lineTo(-24, 0)
      .lineTo(-14, 6)
      .moveTo(14, -6)
      .lineTo(24, 0)
      .lineTo(14, 6)
      .stroke({ color: 0xffffff, width: 5, cap: 'round', join: 'round' });
    k.circle(0, 0, 7).fill(0xffffff);
    this.knob.addChild(k);
    this.knob.hitArea = new Rectangle(-KNOB / 2, -KNOB / 2, KNOB, KNOB);
    ctx.stage.addChild(this.flagLayer, this.flagBtn, this.knob);
    this.handle = this.grip();
    this.layoutAll();
  }

  start() {
    void this.ctx.instruct('tl.instruct.5');
  }

  /** The marker's drag: it stays on its track, the shore follows it, and letting go settles on the nearest stop. */
  private grip(): DragHandle {
    return draggable(this.knob, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        this.ctx.tw.kill(this.now);
        sfx.pop(5);
      },
      onMove: (x) => {
        // A finger still down when the round ends no longer moves the day.
        if (this.finished) return;
        this.now.t = trackT(this.D, x);
        this.knob.position.set(trackX(this.D, this.now.t), this.D.track.y);
      },
      onDrop: () => {
        if (this.finished) return true;
        const stop = nearestStop(this.now.t);
        this.turn.select(stop);
        sfx.clunk();
        void this.ctx.tw.to(this.now, { t: stopT(stop) }, { duration: SNAP, ease: ease.outCubic });
        this.drawStrip();
        return true;
      },
    });
  }

  /** A tapped stop: the sea moves there and the marker with it. */
  private goTo(stop: number, duration = GLIDE) {
    if (this.busy || this.finished || this.handle.dragging) return Promise.resolve();
    this.turn.select(stop);
    sfx.pop(4 + stop);
    this.drawStrip();
    this.ctx.tw.kill(this.now);
    return this.ctx.tw.to(this.now, { t: stopT(stop) }, { duration, ease: ease.inOutSine });
  }

  /** The flag button marks the stop the marker rests on. A stop showing the other state is named, never counted. */
  private tapFlag() {
    if (this.busy || this.finished || this.handle.dragging) return;
    const b = this.flagBtn;
    this.ctx.tw.kill(b.scale);
    b.scale.set(1.1);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const out = this.turn.mark();
    if (!out) {
      sfx.tick();
      void this.ctx.say('tl.pick-time');
      return;
    }
    if (!out.right) {
      sfx.pop(3);
      void this.ctx.say(out.ask === 'shows' ? 'tl.other.covered' : 'tl.other.shows');
      return;
    }
    void this.pin(out.ask);
  }

  private async pin(ask: PoolAsk) {
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    const flag = this.addFlag(this.pinned.length);
    this.placeFlags();
    this.drawStrip();
    flag.scale.set(0);
    await this.ctx.tw.to(flag.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    if (this.turn.done) return void this.end();
    // The first flag's line never holds the second ask's controls (U7 R4): they open now, and the ask follows the line.
    this.busy = false;
    this.waitingAsk = true;
    await this.ctx.say(ask === 'shows' ? 'tl.mark.shows' : 'tl.mark.covered');
    if (this.waitingAsk && !this.finished && !this.turn.done) this.sayAsk();
  }

  private sayAsk() {
    this.waitingAsk = false;
    void this.ctx.instruct(this.turn.ask === 'covered' ? 'tl.instruct.5.covered' : 'tl.instruct.5');
  }

  sayWaitingAsk() {
    if (!this.waitingAsk || this.finished || this.turn.done) return false;
    this.sayAsk();
    return true;
  }

  private addFlag(i: number) {
    const node = new Container();
    const g = new Graphics();
    dayFlag(g, 0, 0, 0.62, i === 0 ? swatch.green : swatch.purple);
    node.addChild(g);
    this.pinned.push(node);
    this.flagLayer.addChild(node);
    return node;
  }

  /** Show me: both fitting stops glow (one hint an ask); asked again, the marker goes to the earlier one and it is flagged. */
  private help() {
    if (this.finished || this.busy || this.handle.dragging) return;
    const out = this.turn.help();
    if (!out) return;
    if ('glow' in out) {
      sfx.sparkle();
      this.drawGlow();
      void this.ctx.say(this.turn.ask === 'shows' ? 'tl.glow.shows' : 'tl.glow.covered');
      return;
    }
    void this.goTo(out.mark).then(() => {
      if (!this.finished && !this.busy && this.turn.selected === out.mark) this.tapFlag();
    });
  }

  /** The two marks are looked at again, in order, before the round ends. */
  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.waitingAsk = false;
    this.handle.enabled = false;
    this.drawGlow();
    const tw = this.ctx.tw;
    const [low, high] = this.turn.flags;
    const visit = async (stop: number) => {
      tw.kill(this.now);
      await tw.to(this.now, { t: stopT(stop) }, { duration: 0.6, ease: ease.inOutSine });
      const flag = this.pinned[this.turn.flags.indexOf(stop)];
      if (flag) {
        flag.scale.set(1.3);
        void tw.to(flag.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      }
      sfx.pop(5 + stop);
    };
    await tw.wait(0.4);
    await visit(low);
    await this.ctx.say('tl.mark.shows');
    await visit(high);
    await this.ctx.say('tl.mark.covered');
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('tl.done.5');
    this.ctx.finish(tally(this.turn.tally));
  }

  // The ghost finger --------------------------------------------------------------------------------

  autotouch(): TouchIntent | null {
    const ask = this.turn.ask;
    if (this.finished || this.busy || !ask || this.handle.dragging || this.ctx.tw.busy(this.now)) return null;
    const want = fitting(ask, this.turn.day)[0];
    if (this.turn.selected === want)
      return { tap: { on: this.flagBtn, x: FLAG_BUTTON / 2, y: FLAG_BUTTON / 2 } };
    // A real scrub: the marker is carried along its track to the stop.
    return {
      drag: { on: this.knob },
      to: { on: this.board, x: trackX(this.D, stopT(want)), y: this.D.track.y },
      lift: 0,
    };
  }

  // Layout and drawing --------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.D = dayLayout(v);
    // A drag in progress is dropped without settling on a stop: the marker goes back to where it last rested.
    if (this.handle.dragging) {
      this.handle.destroy();
      this.handle = this.grip();
      this.handle.enabled = !this.finished;
      this.knob.scale.set(1);
      this.now.t = this.turn.selected === null ? 0 : stopT(this.turn.selected);
    }
    this.layoutAll();
  }

  private layoutAll() {
    const D = this.D;
    this.board.position.set(0, 0);
    this.picture.position.set(D.picture.x, D.picture.y);
    this.stops.forEach((n, i) => {
      n.position.set(D.stops[i].x, D.stops[i].y);
      n.hitArea = new Rectangle(0, 0, D.stops[i].w, D.stops[i].h);
    });
    this.flagBtn.position.set(D.button.x + FLAG_BUTTON / 2, D.button.y + FLAG_BUTTON / 2);
    this.knob.position.set(trackX(D, this.now.t), D.track.y);
    this.placeFlags();
    this.drawn = -1;
    this.drawStrip();
  }

  private placeFlags() {
    const D = this.D;
    this.pinned.forEach((n, i) => {
      const b = D.stops[this.turn.flags[i]];
      if (b) n.position.set(b.x + b.w / 2 - 14, D.flagY);
    });
  }

  private drawStrip() {
    const D = this.D;
    const g = this.strip.clear();
    g.roundRect(D.track.x0, D.track.y - 9, D.track.x1 - D.track.x0, 18, 9)
      .fill(0xffffff)
      .stroke({ color: swatch.blue.line, width: 3 });
    this.stops.forEach((n, i) => {
      const b = D.stops[i];
      const on = this.turn.selected === i;
      const art = n.children[0] as Graphics;
      art
        .clear()
        .roundRect(0, 0, b.w, b.h, 22)
        .fill(on ? swatch.yellow.light : 0xffffff)
        .stroke({ color: on ? swatch.orange.line : swatch.blue.line, width: on ? 7 : 4 });
      skyIcon(art, i, b.w / 2, b.h / 2);
      g.roundRect(b.x + b.w / 2 - 4, D.track.y - 18, 8, 36, 4).fill(swatch.blue.line);
    });
    // The flag button wakes once the marker rests on a stop.
    this.flagBtn.alpha = this.turn.selected === null || this.turn.done ? 0.45 : 1;
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    const ask = this.turn.ask;
    if (this.finished || !ask || !this.turn.glow) return;
    for (const i of fitting(ask, this.turn.day)) {
      const b = this.D.stops[i];
      g.roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 28).stroke({
        color: swatch.orange.line,
        width: 10,
      });
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    if (!this.handle.dragging) this.knob.position.set(trackX(this.D, this.now.t), this.D.track.y);
    if (this.now.t === this.drawn) return;
    this.drawn = this.now.t;
    const p = this.D.picture;
    dayShore(
      this.picture.clear(),
      p.w,
      p.h,
      dayWater(this.turn.day, this.now.t),
      this.now.t,
      POOL_RIM,
      POOL_TOP,
    );
  }

  destroy() {
    this.handle.destroy();
  }
}
