import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood, type ColorName } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { bowIcon, giftBox, ribbon } from './art';
import {
  fitsIn,
  SWITCH_RIBBON,
  SwitchBench,
  switchHint,
  switchRound,
  TRAY_GAP,
  TRAY_LEFT,
  WRITTEN,
  type SwitchClaim,
  type SwitchRound,
  type SwitchWhole,
} from './logic';

/** Logical units per tick at every view size: the ribbon is 180 long, the short whole 360 and the long whole 720. */
export const SWITCH_TICK = 30;
/** The ribbon and every whole start here, as levels 1–3's spool does: clear of the help button on the left, and the long whole ends at 830, clear of the button column. */
const X0 = 110;
const RIBBON_LEN = SWITCH_RIBBON * SWITCH_TICK;
const RIBBON_TALL = 120;
const TAG_Y = 82;
/** The rail's two places: the whole in play sits in the lower one, and at the finish tag 1's whole sits above it. */
const RAIL_UP = 195;
const RAIL_LOW = 270;
const RAIL_TALL = 70;
const RIBBON_Y = 380;
const SPOOL_CARD = { w: 220, h: 130 };
const NAME_CARD = { w: 150, h: 130 };
/** Seconds: the ghost lifts to the rail, then steps along the whole. */
const LIFT = 0.25;
const MEASURE = 1.2;
/** Ribbon colours. Purple is the wholes' colour and yellow the lit card's, so neither is a ribbon. */
const COLORS: ColorName[] = ['red', 'orange', 'green', 'blue', 'pink'];

const WHOLE_LINE = { 12: 'ribbon.switch.whole.short', 24: 'ribbon.switch.whole.long' } as const;
const NAME_LINE = {
  1: 'ribbon.switch.name.quarter',
  2: 'ribbon.switch.name.half',
  3: 'ribbon.switch.name.threeQuarters',
} as const;
const FITS_LINE = { 12: 'ribbon.switch.fits.short', 24: 'ribbon.switch.fits.long' } as const;
const MADE_LINE = { 12: 'ribbon.switch.made.short', 24: 'ribbon.switch.made.long' } as const;

/** A wound spool with a tail at its true length ratio: the long spool's tail is twice the short one's. */
function spoolPicture(whole: SwitchWhole, scale = 1): Container {
  const g = new Graphics(),
    tail = whole * 5.5;
  g.roundRect(-56, -10, tail, 20, 5)
    .fill(swatch.purple.light)
    .stroke({ width: 3, color: swatch.purple.line });
  g.circle(-80, 0, 26).fill(swatch.purple.fill).stroke({ width: 4, color: swatch.purple.line });
  g.circle(-80, 0, 9).fill(wood.fill).stroke({ width: 3, color: wood.line });
  // The picture runs from -106 (the spool's edge) to -56 + tail; centre it on its own middle.
  g.x = 81 - tail / 2;
  const c = new Container();
  c.addChild(g);
  c.scale.set(scale);
  return c;
}

class Measure {
  t = 0;
  constructor(
    readonly whole: SwitchWhole,
    readonly done: () => void,
  ) {}
}

/**
 * Level 6, Whole Switch: the ribbon never changes; she picks which spool is the whole, names the part, and then gives the
 * same ribbon its other name by switching the whole. See docs/definitions/whole-switch.md.
 */
export class WholeSwitch implements Game {
  private view: View;
  readonly bench = new SwitchBench();
  readonly round: SwitchRound;
  private readonly color: ColorName;
  /** A right statement is being shown; touches wait. */
  busy = false;
  /** Both wholes are stacked with their tags and the gift is tied. */
  finale = false;
  private destroyed = false;
  private clock = 0;
  private measure: Measure | null = null;
  /** Steps the measure has marked on a whole, for this tag. */
  private readonly marks = new Map<SwitchWhole, number>();
  /** The paper tag clipped to a whole once its statement was made. */
  private readonly clips = new Map<SwitchWhole, SwitchClaim>();
  private readonly catcher = new Graphics();
  private readonly decor = new Graphics();
  private readonly rail = new Container();
  private readonly giftLayer = new Container();
  private readonly ghost: Graphics;
  private readonly strip = new Container();
  private readonly cards = new Container();
  private readonly glow = new Graphics();
  readonly tag = new Container();
  readonly ribbonNode = new Container();
  readonly spoolCards = new Map<SwitchWhole, Container>();
  readonly nameCards = new Map<SwitchClaim, Container>();
  readonly bow: RoundButton;
  readonly undo: RoundButton;
  readonly hintLabel = 'Show a hint';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = switchRound(ctx.rng, COLORS.length);
    this.color = COLORS[this.round.color];
    this.catcher.eventMode = 'static';
    this.catcher.on('pointerdown', () => this.skip());
    for (const c of [this.decor, this.rail, this.giftLayer, this.strip, this.glow]) c.eventMode = 'none';
    this.ghost = ribbon(RIBBON_LEN, this.color, RAIL_TALL - 10);
    this.ghost.eventMode = 'none';
    this.ghost.visible = false;
    this.ribbonNode.addChild(ribbon(RIBBON_LEN, this.color, RIBBON_TALL));
    // A pin at each end: the ribbon stays.
    const pins = new Graphics();
    for (const x of [-RIBBON_LEN / 2 + 16, RIBBON_LEN / 2 - 16])
      pins.circle(x, 0, 9).fill(swatch.white.light).stroke({ width: 4, color: swatch.brown.line });
    this.ribbonNode.addChild(pins);
    this.ribbonNode.hitArea = new Rectangle(-RIBBON_LEN / 2, -RIBBON_TALL / 2, RIBBON_LEN, RIBBON_TALL);
    onTap(this.ribbonNode, () => this.tapRibbon(), { cooldown: 600 });
    onTap(
      this.tag,
      () => {
        if (this.skip()) return;
        this.ask();
      },
      { cooldown: 600 },
    );
    this.bow = new RoundButton(bowIcon(), swatch.green, 60, () => this.check());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 60, () => {
      if (this.skip() || this.busy || this.bench.done) return;
      if (this.bench.undo()) this.draw();
    });
    ctx.stage.addChild(
      this.catcher,
      this.decor,
      this.rail,
      this.giftLayer,
      this.ribbonNode,
      this.ghost,
      this.tag,
      this.strip,
      this.cards,
      this.glow,
      this.bow,
      this.undo,
    );
    this.layout();
  }

  get state() {
    return this.bench.state;
  }
  get misses() {
    return this.bench.misses;
  }
  get hints() {
    return this.bench.hints;
  }
  get measuring() {
    return this.measure !== null;
  }

  private ask() {
    void this.ctx.instruct(this.bench.tag === 1 ? 'ribbon.switch.ask' : 'ribbon.switch.ask2');
  }

  /** End a measure animation at once; true when one was running, so the touch that did it does nothing else. */
  private skip(): boolean {
    const m = this.measure;
    if (!m) return false;
    this.endMeasure(m);
    return true;
  }

  private tapRibbon() {
    if (this.skip() || this.busy || this.bench.done) return;
    void this.ctx.say('ribbon.switch.ribbon');
    const r = this.ribbonNode;
    this.ctx.tw.kill(r);
    r.rotation = 0;
    void this.ctx.tw
      .to(r, { rotation: 0.04 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(r, { rotation: -0.04 }, { duration: 0.1 }))
      .then(() => this.ctx.tw.to(r, { rotation: 0 }, { duration: 0.06 }));
  }

  private tapWhole(w: SwitchWhole) {
    if (this.skip() || this.busy || this.bench.done) return;
    this.bench.setWhole(w);
    sfx.pop(w === 12 ? 4 : 2);
    void this.ctx.say(WHOLE_LINE[w]);
    this.draw(this.spoolCards, w);
  }

  private tapName(q: SwitchClaim) {
    if (this.skip() || this.busy || this.bench.done) return;
    this.bench.setClaim(q);
    sfx.pop(5 + q);
    void this.ctx.say(NAME_LINE[q]);
    this.draw(this.nameCards, q);
  }

  private check() {
    if (this.skip() || this.busy || this.bench.done) return;
    const { whole, claim } = this.state,
      glowing = this.bench.tally.glow,
      v = this.bench.check();
    if (v === 'empty') {
      void this.ctx.say(whole ? 'ribbon.switch.empty.name' : 'ribbon.switch.empty.whole');
      return;
    }
    if (v === 'same') {
      void this.ctx.say('ribbon.switch.same');
      return;
    }
    if (!whole || !claim) return;
    if (v === 'wrong') {
      sfx.boing();
      // The name card dims back; the whole stays, and the ghost shows how many times the ribbon fits in it.
      this.bench.setClaim(0);
      const hinted = this.bench.tally.glow && !glowing;
      void this.runMeasure(whole);
      // The line names the active whole and the count, never the fraction. The glow's own line follows it.
      void this.ctx.say(FITS_LINE[whole]).then(() => (hinted ? this.ctx.say('ribbon.hint') : undefined));
      this.draw();
      return;
    }
    this.busy = true;
    this.clips.set(whole, claim);
    this.draw();
    [0, 2, 4, 5, 7].forEach((step, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(step, 0.25)));
    void Promise.all([this.runMeasure(whole), this.ctx.say(MADE_LINE[whole])])
      .then(() => this.ctx.tw.wait(0.4))
      .then(() => {
        if (this.destroyed) return;
        if (!this.bench.done) {
          // Tag 2 starts with tag 1's whole and name still showing; its measure marks go with tag 1.
          this.marks.clear();
          this.busy = false;
          this.draw();
          this.ask();
          return;
        }
        this.finale = true;
        // Both wholes show their steps: two of the ribbon in one, four in the other.
        for (const w of this.clips.keys()) this.marks.set(w, fitsIn(w));
        this.draw();
        this.drawGift(true, true);
        this.ctx.particles.burst(X0 + RIBBON_LEN + 70, RIBBON_Y - 70, {
          colors: [swatch[this.color].fill, swatch.yellow.fill],
          count: 18,
        });
        return this.ctx
          .say('ribbon.switch.both')
          .then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
      });
  }

  askForHint() {
    if (this.busy || this.bench.done) return;
    if (this.bench.askHint()) void this.ctx.say('ribbon.hint');
    this.draw();
  }

  restart() {
    if (this.busy || this.bench.done) return;
    this.skip();
    this.bench.restart();
    this.draw();
  }

  /** The ghost steps along the whole, a mark and a note per step; resolves when it ends or a tap skips it. */
  private runMeasure(whole: SwitchWhole): Promise<void> {
    if (this.measure) this.endMeasure(this.measure);
    return new Promise((done) => {
      this.marks.set(whole, 0);
      this.measure = new Measure(whole, done);
      this.ghost.visible = true;
      this.ghost.alpha = 0.55;
      this.ghost.position.set(X0 + RIBBON_LEN / 2, RIBBON_Y);
    });
  }

  private endMeasure(m: Measure) {
    this.measure = null;
    this.ghost.visible = false;
    this.marks.set(m.whole, fitsIn(m.whole));
    this.draw();
    m.done();
  }

  private stepMeasure(m: Measure, dt: number) {
    m.t += dt;
    const steps = fitsIn(m.whole);
    if (m.t >= MEASURE) return this.endMeasure(m);
    if (m.t < LIFT) {
      this.ghost.y = RIBBON_Y + (RAIL_LOW - RIBBON_Y) * (m.t / LIFT);
      return;
    }
    const at = Math.min(steps - 1, Math.floor(((m.t - LIFT) / (MEASURE - LIFT)) * steps));
    this.ghost.position.set(X0 + at * RIBBON_LEN + RIBBON_LEN / 2, RAIL_LOW);
    if (this.marks.get(m.whole) !== at + 1) {
      this.marks.set(m.whole, at + 1);
      sfx.marimba(at * 2, 0.3);
      this.drawRail();
    }
  }

  /** One whole on the rail: a striped bar from the ribbon's left edge, with end caps and no division marks until measured. */
  private wholeBar(whole: SwitchWhole, y: number): Container {
    const c = new Container(),
      g = new Graphics(),
      len = whole * SWITCH_TICK,
      half = RAIL_TALL / 2;
    g.roundRect(0, -half + 8, len, RAIL_TALL - 16, 8)
      .fill(swatch.purple.light)
      .stroke({ width: 4, color: swatch.purple.line });
    for (let x = 30; x < len - 8; x += 36) g.moveTo(x, -half + 11).lineTo(x - 12, half - 11);
    g.stroke({ width: 3, color: swatch.purple.fill, alpha: 0.6 });
    for (const x of [0, len])
      g.roundRect(x - 7, -half, 14, RAIL_TALL, 6)
        .fill(wood.fill)
        .stroke({ width: 3, color: wood.line });
    const marks = this.marks.get(whole) ?? 0;
    for (let i = 1; i <= marks && i < fitsIn(whole); i++)
      g.moveTo(i * RIBBON_LEN, -half + 4)
        .lineTo(i * RIBBON_LEN, half - 4)
        .stroke({ width: 6, color: swatch.purple.line });
    c.addChild(g);
    const t = label('1 whole', 26);
    t.anchor?.set(0.5);
    // Inside one ribbon-length, so no measure mark crosses it, and clear of the tag clipped at the right end.
    t.position.set(whole === 12 ? RIBBON_LEN / 2 : RIBBON_LEN * 1.5, 0);
    c.addChild(t);
    const clip = this.clips.get(whole);
    if (clip) {
      const p = new Graphics();
      p.roundRect(-46, -30, 92, 60, 10).fill(cream).stroke({ width: 4, color: swatch.brown.line });
      p.circle(-34, -18, 5).fill(swatch.brown.line);
      const name = label(WRITTEN[clip], 38);
      name.anchor?.set(0.5);
      name.position.set(-10, 0);
      const pic = spoolPicture(whole, 0.3);
      pic.position.set(28, 4);
      const tagC = new Container();
      tagC.addChild(p, name, pic);
      tagC.position.set(len - 62, -6);
      tagC.rotation = -0.06;
      c.addChild(tagC);
    }
    c.position.set(X0, y);
    return c;
  }

  private drawRail() {
    for (const c of this.rail.removeChildren()) c.destroy({ children: true });
    const { whole, made } = this.state;
    if (this.finale && made && whole) {
      this.rail.addChild(this.wholeBar(made, RAIL_UP), this.wholeBar(whole, RAIL_LOW));
      return;
    }
    if (whole) {
      this.rail.addChild(this.wholeBar(whole, RAIL_LOW));
      return;
    }
    // No whole yet: an empty dashed rail as long as the short spool.
    const g = new Graphics();
    for (let x = 0; x < 12 * SWITCH_TICK; x += 44)
      g.roundRect(X0 + x, RAIL_LOW - 4, 26, 8, 4).fill({ color: swatch.brown.line, alpha: 0.45 });
    this.rail.addChild(g);
  }

  private drawGift(tied: boolean, pop = false) {
    for (const c of this.giftLayer.removeChildren()) {
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    const box = giftBox(this.color, tied);
    box.position.set(X0 + RIBBON_LEN + 70, RIBBON_Y + 20);
    this.giftLayer.addChild(box);
    if (pop) {
      box.scale.set(0.7);
      void this.ctx.tw
        .to(box.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 })
        .then(() => this.ctx.tw.to(box.scale, { x: 1, y: 1 }, { duration: 0.2 }));
    }
  }

  private miniRibbon(w: number, h: number): Graphics {
    const s = swatch[this.color];
    return new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 6)
      .fill(s.fill)
      .stroke({ width: 3, color: s.line });
  }

  /** Tag 1: the ribbon and a question mark. Tag 2: the ribbon, tag 1's name, and a curved arrow to a question mark. */
  private drawTag() {
    for (const c of this.tag.removeChildren()) c.destroy({ children: true });
    const g = new Graphics();
    g.roundRect(-150, -52, 300, 104, 18).fill(cream).stroke({ width: 5, color: swatch.brown.line });
    g.circle(-132, 0, 7).fill(swatch.brown.line);
    this.tag.addChild(g);
    const mini = this.miniRibbon(84, 30);
    const q = label('?', 54);
    q.anchor?.set(0.5);
    const made = this.state.made;
    if (!made || this.finale) {
      mini.position.set(-50, 0);
      q.position.set(70, 0);
      if (this.finale) q.text = '✓';
      this.tag.addChild(mini, q);
    } else {
      mini.position.set(-72, 0);
      const was = label(WRITTEN[this.clips.get(made) ?? 0] ?? '', 40);
      was.anchor?.set(0.5);
      was.position.set(4, 4);
      const arrow = new Graphics();
      arrow
        .moveTo(18, -22)
        .quadraticCurveTo(52, -50, 84, -24)
        .stroke({ width: 5, color: swatch.brown.line })
        .poly([84, -24, 70, -24, 80, -38])
        .fill(swatch.brown.line);
      q.position.set(104, 4);
      this.tag.addChild(mini, was, arrow, q);
    }
    this.tag.hitArea = new Rectangle(-150, -52, 300, 104);
  }

  /** The statement in pictures: the ribbon, the chosen name and the chosen spool, with a gap for whatever is not chosen yet. */
  private drawStrip() {
    for (const c of this.strip.removeChildren()) c.destroy({ children: true });
    const { whole, claim } = this.state,
      g = new Graphics();
    g.roundRect(-135, -42, 270, 84, 16)
      .fill({ color: 0xffffff, alpha: 0.7 })
      .stroke({ width: 3, color: swatch.brown.line, alpha: 0.5 });
    const gap = (x: number, w: number) =>
      g.roundRect(x - w / 2, -24, w, 48, 10).stroke({ width: 3, color: swatch.brown.line, alpha: 0.45 });
    this.strip.addChild(g);
    const mini = this.miniRibbon(50, 24);
    mini.x = -98;
    const eq = label('=', 34);
    eq.anchor?.set(0.5);
    eq.x = -54;
    this.strip.addChild(mini, eq);
    if (claim) {
      const name = label(WRITTEN[claim], 42);
      name.anchor?.set(0.5);
      name.x = -14;
      this.strip.addChild(name);
    } else gap(-14, 44);
    if (whole) {
      const pic = spoolPicture(whole, 0.5);
      pic.x = 70;
      this.strip.addChild(pic);
    } else gap(70, 100);
  }

  private card<K extends number>(
    map: Map<K, Container>,
    key: K,
    size: { w: number; h: number },
    lit: boolean,
    x: number,
    y: number,
    onPress: () => void,
  ): Container {
    const c = new Container();
    c.addChild(
      new Graphics()
        .roundRect(-size.w / 2, -size.h / 2, size.w, size.h, 18)
        .fill(lit ? swatch.yellow.light : cream)
        .stroke({ width: lit ? 7 : 4, color: lit ? swatch.yellow.line : swatch.brown.line }),
    );
    c.position.set(x, y);
    c.hitArea = new Rectangle(-size.w / 2, -size.h / 2, size.w, size.h);
    onTap(c, onPress, { cooldown: 250 });
    this.cards.addChild(c);
    map.set(key, c);
    return c;
  }

  /** Rebuild everything that follows the choices; the card just tapped lifts as it lands. */
  private draw<K extends number>(poppedFrom?: Map<K, Container>, popped?: K) {
    const v = this.view,
      { whole, claim } = this.state;
    for (const c of this.cards.removeChildren()) {
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    this.spoolCards.clear();
    this.nameCards.clear();
    this.round.wholes.forEach((w, i) => {
      const c = this.card(
        this.spoolCards,
        w,
        SPOOL_CARD,
        whole === w,
        TRAY_LEFT + SPOOL_CARD.w / 2 + i * (SPOOL_CARD.w + TRAY_GAP),
        v.h - 232,
        () => this.tapWhole(w),
      );
      c.addChild(spoolPicture(w));
    });
    this.round.claims.forEach((q, i) => {
      const c = this.card(
        this.nameCards,
        q,
        NAME_CARD,
        claim === q,
        TRAY_LEFT + NAME_CARD.w / 2 + i * (NAME_CARD.w + TRAY_GAP),
        v.h - 90,
        () => this.tapName(q),
      );
      const t = label(WRITTEN[q], 56);
      t.anchor?.set(0.5);
      t.y = -18;
      // A four-cell bar with q cells shaded: a picture of the name, not of either spool.
      const bar = new Graphics();
      for (let k = 0; k < 4; k++)
        bar
          .rect(-56 + k * 28, 26, 28, 22)
          .fill(k < q ? swatch.blue.fill : swatch.white.light)
          .stroke({ width: 3, color: swatch.blue.line });
      c.addChild(t, bar);
    });
    const hit = poppedFrom?.get(popped as K);
    if (hit) {
      hit.scale.set(1.1);
      void this.ctx.tw.to(hit.scale, { x: 1, y: 1 }, { duration: 0.18 });
    }
    this.undo.alpha = this.bench.canUndo ? 1 : 0.5;
    this.drawRail();
    this.drawStrip();
    this.drawTag();
    this.drawGlow();
  }

  private hintTarget(): Container {
    const h = switchHint(this.state, this.round.wholes);
    return h.kind === 'check'
      ? this.bow
      : h.kind === 'whole'
        ? this.spoolCards.get(h.whole)!
        : this.nameCards.get(h.claim)!;
  }

  private drawGlow() {
    this.glow.clear();
    if (!this.bench.tally.glow || this.busy || this.bench.done) return;
    const t = this.hintTarget();
    if (t instanceof RoundButton) this.glow.circle(t.x, t.y, t.radius + 12);
    else {
      const b = t.hitArea as Rectangle;
      this.glow.roundRect(t.x + b.x - 10, t.y + b.y - 10, b.width + 20, b.height + 20, 24);
    }
    this.glow.stroke({ width: 8, color: swatch.yellow.line });
  }

  private layout() {
    const v = this.view;
    this.catcher.clear().rect(0, 0, v.w, v.h).fill(swatch.pink.light);
    // The bench: a plank under the ribbon, as long as the long whole.
    this.decor
      .clear()
      .roundRect(X0 - 14, RIBBON_Y + RIBBON_TALL / 2 + 6, 24 * SWITCH_TICK + 28, 22, 8)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    this.ribbonNode.position.set(X0 + RIBBON_LEN / 2, RIBBON_Y);
    this.tag.position.set(Math.max(300, v.w / 2 - 120), TAG_Y);
    this.strip.position.set(this.tag.x + 150 + 20 + 135, TAG_Y);
    this.undo.position.set(v.w - 80, 82);
    this.bow.position.set(v.w - 80, v.h - 90);
    this.drawGift(this.finale);
    this.draw();
  }

  start() {
    this.ask();
  }

  resize(v: View) {
    this.view = v;
    this.layout();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (this.measure) this.stepMeasure(this.measure, dt);
  }

  /** The ghost finger follows the hint: a spool card, its true name card, the bow; then the other spool, its name and the bow. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.bench.done || this.measure) return null;
    return { tap: { on: this.hintTarget() } };
  }

  destroy() {
    this.destroyed = true;
    this.measure = null;
  }
}
