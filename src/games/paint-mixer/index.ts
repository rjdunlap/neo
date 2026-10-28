import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bucket as bucketArt, button, drop as dropArt, fillInside, jar as jarArt, pot as potArt } from './art';
import {
  BUTTON_H, BUTTON_W, CAP, JAR_H, JAR_W, LEVELS, POT_H, POT_W, check, countsOf, dropAt, glowFor, layout, makeRound, mix, mixName,
  planFor, rows, sizeFor, solveFrom, stickerSample, total, type Glow, type Layout, type Plan, type Pot, type Sample,
} from './logic';

type Button = 'undo' | 'tip' | 'check';

class PaintMixer implements Game {
  readonly plan: Plan;
  readonly samples: Sample[];
  /** Pots on screen, left to right as laid out from the right edge. */
  readonly pots: Pot[];
  bucketIndex = 0;
  drops: Pot[] = [];
  misses = 0;
  hints = 0;
  /** Misses on the bucket in play; the second lights the glow. */
  bucketMisses = 0;
  /** The glowing control, once help is on; retargeted after every change until the match. */
  glow: Glow | null = null;
  /** A hint has been counted for this bucket. */
  hinted = false;
  busy = false;
  finished = false;
  /** The ghost pour is running (a second Help after the glow). */
  pouring = false;
  readonly potNodes = new Map<Pot, Container>();
  readonly buttons = new Map<Button, Container>();
  readonly jarNode = new Container();
  private layoutNow: Layout;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly bucketNode: Container;
  private readonly inside: Graphics;
  private readonly rowsNode: Container;
  private readonly recipeNode = new Container();
  private readonly flights = new Container();
  private readonly glowRing = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.samples = makeRound(ctx.level, ctx.rng);
    this.pots = this.sample.pair.slice() as Pot[];
    this.backdrop = new Backdrop({ sky: [cream, swatch.blue.light], hills: [grass, swatch.green.light], horizon: 0.34, clouds: 1, sun: false, seed: 67 }, ctx.view);
    const b = bucketArt();
    this.bucketNode = b.node; this.inside = b.inside; this.rowsNode = b.rows;
    this.bucketNode.eventMode = 'none';
    this.recipeNode.eventMode = this.flights.eventMode = this.glowRing.eventMode = 'none';
    this.jarNode.hitArea = new Rectangle(-JAR_W / 2, -JAR_H / 2, JAR_W, JAR_H);
    onTap(this.jarNode, () => this.tapJar());
    for (const kind of ['undo', 'tip', 'check'] as const) {
      const n = button(kind, BUTTON_W, BUTTON_H);
      n.hitArea = new Rectangle(-BUTTON_W / 2, -BUTTON_H / 2, BUTTON_W, BUTTON_H);
      onTap(n, () => this.tapButton(kind));
      this.buttons.set(kind, n);
    }
    this.layoutNow = layout(ctx.view, this.pots.length);
    ctx.stage.addChild(this.backdrop, this.jarNode, this.recipeNode, this.bucketNode, ...this.buttons.values(), this.flights, this.glowRing);
    this.buildPots();
    this.dressBucket();
    this.resize(ctx.view);
  }

  get sample(): Sample { return this.samples[this.bucketIndex]; }
  get counts() { return countsOf(this.drops); }
  /** What a scripted play reads. */
  get state() {
    return { level: this.plan.level, bucket: this.bucketIndex, sample: this.sample, drops: this.drops.slice(), misses: this.misses, hints: this.hints, glow: this.glow, size: sizeFor(this.plan, this.sample), busy: this.busy, finished: this.finished };
  }

  start() {
    void this.ctx.instruct(this.plan.level === 1 ? 'pm.instruct.1' : 'pm.instruct.2');
  }

  destroy() {
    this.finished = true;
    for (const n of this.potNodes.values()) this.ctx.tw.kill(n.scale);
    this.ctx.tw.kill(this.bucketNode);
  }

  // ---- the bucket's picture ----

  private buildPots() {
    for (const n of this.potNodes.values()) n.destroy();
    this.potNodes.clear();
    for (const pot of this.pots) {
      const n = potArt(pot);
      n.hitArea = new Rectangle(-POT_W / 2 - 6, -POT_H - 6, POT_W + 12, POT_H + 12);
      onTap(n, () => this.pour(pot));
      this.potNodes.set(pot, n);
      this.ctx.stage.addChild(n);
    }
    this.ctx.stage.addChild(this.flights, this.glowRing);
  }

  /** The jar, its recipe row and the bucket's empty rows for the bucket in play. */
  private dressBucket() {
    this.jarNode.removeChildren().forEach((c) => c.destroy());
    this.jarNode.addChild(jarArt(mix(countsOf(this.rowOf(this.sample)))!));
    this.recipeNode.removeChildren().forEach((c) => c.destroy());
    this.rowOf(this.sample).forEach((pot, i) => {
      const d = dropArt(pot);
      d.position.set(i * 42, 0);
      this.recipeNode.addChild(d);
    });
    this.refresh();
  }

  private rowOf(s: Sample): Pot[] {
    return [...Array(s.counts[0]).fill(s.pair[0]), ...Array(s.counts[1]).fill(s.pair[1])];
  }

  /** Redraw the bucket's colour and rows from the drops, and retarget the glow. */
  private refresh() {
    const counts = this.counts;
    fillInside(this.inside, mix(counts));
    this.rowsNode.removeChildren().forEach((c) => c.destroy());
    const r = rows(this.sample, counts, this.plan.batches);
    const n = total(this.sample);
    const template = this.rowOf(this.sample);
    const looseRows = Math.ceil(r.loose.length / 6);
    const rowCount = this.plan.batches + looseRows;
    for (let i = 0; i < this.plan.batches; i++) {
      const places = r.rows[i];
      for (let j = 0; j < n; j++) {
        const filled = places ? places[j].filled : false;
        const d = dropArt(template[j], !filled);
        const at = dropAt(i, j, n, rowCount);
        d.position.set(at.x, at.y);
        this.rowsNode.addChild(d);
      }
    }
    r.loose.forEach((pot, j) => {
      const d = dropArt(pot);
      const row = Math.floor(j / 6), inRow = Math.min(6, r.loose.length - row * 6);
      const at = dropAt(this.plan.batches + row, j - row * 6, inRow, rowCount);
      d.position.set(at.x, at.y);
      d.rotation = j % 2 ? 0.35 : -0.35;
      this.rowsNode.addChild(d);
    });
    if (this.glow) this.glow = glowFor(this.plan, this.sample, this.drops);
  }

  // ---- play ----

  private pour(pot: Pot, ghost = false) {
    if (this.busy || this.finished || (this.pouring && !ghost)) return;
    const node = this.potNodes.get(pot)!;
    this.ctx.tw.kill(node.scale);
    node.scale.set(1.08, 0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.drops.length >= CAP) {
      sfx.pop(2);
      this.slosh();
      void this.ctx.say('pm.full');
      return;
    }
    this.drops.push(pot);
    const batch = Math.min(this.plan.batches, rows(this.sample, this.counts, this.plan.batches).complete);
    sfx.pluck(4 + batch, 0.3);
    this.refresh();
    this.fly(pot, node);
  }

  /** A drop leaves the pot for the bucket's opening and fades as it lands (the rows already show it). */
  private fly(pot: Pot, from: Container) {
    const d = dropArt(pot);
    d.position.set(from.x, from.y - POT_H * 0.8);
    this.flights.addChild(d);
    const l = this.layoutNow;
    void this.ctx.tw.to(d.position, { x: l.bucket.x, y: l.bucket.y - 90 }, { duration: 0.28, ease: ease.outQuad }).then(() => {
      if (this.finished || d.destroyed) return;
      this.ctx.particles.burst(l.bucket.x, l.bucket.y - 90, { kind: 'dot', colors: [mix(this.counts) ?? 0xffffff], count: 5, speed: [40, 110], gravity: 260, life: [0.2, 0.4] });
      d.destroy();
    });
  }

  private slosh() {
    this.ctx.tw.kill(this.bucketNode);
    this.bucketNode.rotation = -0.06;
    void this.ctx.tw.to(this.bucketNode, { rotation: 0 }, { duration: 0.4, ease: ease.outElastic });
  }

  private tapButton(kind: Button) {
    if (this.busy || this.finished || this.pouring) return;
    const n = this.buttons.get(kind)!;
    this.ctx.tw.kill(n.scale);
    n.scale.set(0.92);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    if (kind === 'undo') this.undo();
    else if (kind === 'tip') this.tipOut();
    else this.checkBucket();
  }

  undo(ghost = false) {
    if (this.pouring && !ghost) return;
    if (this.drops.length === 0) { sfx.pop(3); return; }
    const pot = this.drops.pop()!;
    sfx.pop(5);
    this.refresh();
    const d = dropArt(pot), l = this.layoutNow, to = this.potNodes.get(pot) ?? null;
    d.position.set(l.bucket.x, l.bucket.y - 90);
    this.flights.addChild(d);
    void this.ctx.tw.to(d.position, { x: to?.x ?? l.bucket.x, y: (to?.y ?? l.bucket.y) - POT_H * 0.8 }, { duration: 0.28, ease: ease.inQuad }).then(() => { if (!d.destroyed) d.destroy(); });
  }

  tipOut(ghost = false) {
    if (this.pouring && !ghost) return;
    if (this.drops.length === 0) { sfx.pop(3); return; }
    this.drops = [];
    sfx.splash();
    this.ctx.tw.kill(this.bucketNode);
    this.bucketNode.rotation = 0.35;
    void this.ctx.tw.to(this.bucketNode, { rotation: 0 }, { duration: 0.5, ease: ease.outBack });
    this.refresh();
  }

  private checkBucket() {
    const verdict = check(this.plan, this.sample, this.counts);
    const s = this.sample;
    const words = { pot: verdict.kind === 'wrong' ? verdict.pot : s.pair[0], a: s.counts[0], potA: s.pair[0], b: s.counts[1], potB: s.pair[1] };
    if (verdict.kind === 'match') { void this.celebrate(); return; }
    if (verdict.kind === 'moreSameWay') {
      sfx.pop(6);
      void this.ctx.say('pm.more-same-way');
      return;
    }
    this.misses++; this.bucketMisses++;
    sfx.boing();
    this.slosh();
    const line = verdict.direction === 'stray' ? 'pm.stray' : verdict.direction === 'too-many' ? 'pm.too-many'
      : this.drops.length === 0 ? 'pm.start' : 'pm.short';
    void this.hearWrong(line, words);
  }

  private async hearWrong(line: 'pm.stray' | 'pm.too-many' | 'pm.start' | 'pm.short', words: Record<string, string | number>) {
    const bucket = this.bucketIndex;
    await this.ctx.say(line, words);
    // She may have fixed the bucket and matched while the line played: no hint for a bucket she solved unaided.
    if (this.finished || this.busy || bucket !== this.bucketIndex) return;
    if (check(this.plan, this.sample, this.counts).kind === 'match') return;
    if (this.bucketMisses >= 2 && this.lightHint()) await this.ctx.say('pm.help');
  }

  /** Turn the glow on for this bucket (one hint, counted once per bucket). True when it is on. */
  private lightHint(): boolean {
    if (this.finished) return false;
    this.glow = glowFor(this.plan, this.sample, this.drops);
    if (!this.hinted) { this.hinted = true; this.hints++; }
    return true;
  }

  readonly hintLabel = 'Show me';

  /** Asked-for help: the glow (one hint for the bucket); asked again, the ghost pours the rest and Check glows. */
  askForHint() {
    if (this.busy || this.finished || this.pouring) return;
    if (!this.glow) {
      this.lightHint();
      void this.ctx.say('pm.help');
      return;
    }
    void this.ghostPour();
  }

  private async ghostPour() {
    this.pouring = true;
    const bucket = this.bucketIndex;
    if (solveFrom(this.plan, this.sample, this.drops).some((g) => g.at === 'tip')) void this.ctx.say('pm.plan', { a: this.sample.counts[0], potA: this.sample.pair[0], b: this.sample.counts[1], potB: this.sample.pair[1] });
    // One tap a second, each read from the bucket as it is now, until Check is the glowing one (at most 24 steps).
    for (let i = 0; i < 24; i++) {
      if (this.finished || this.busy || bucket !== this.bucketIndex) break;
      const g = glowFor(this.plan, this.sample, this.drops);
      if (g.at === 'check') break;
      await this.ctx.tw.wait(1);
      if (this.finished || this.busy || bucket !== this.bucketIndex) break;
      if (g.at === 'pot') this.pour(g.pot, true);
      else if (g.at === 'undo') this.undo(true);
      else this.tipOut(true);
    }
    this.pouring = false;
  }

  private tapJar() {
    if (this.finished) return;
    sfx.bell(7, 0.2);
    const s = this.sample;
    void this.ctx.say('pm.recipe', { a: s.counts[0], potA: s.pair[0], b: s.counts[1], potB: s.pair[1] });
  }

  private async celebrate() {
    this.busy = true;
    this.glow = null;
    const l = this.layoutNow;
    sfx.bell(7, 0.35);
    sfx.bell(11, 0.3);
    this.ctx.particles.burst(l.bucket.x, l.bucket.y - 60, { kind: 'star', colors: [mix(this.counts)!, swatch.yellow.fill, 0xffffff], count: 20, speed: [120, 280], gravity: 320, life: [0.5, 0.9] });
    // The bucket lifts toward the jar and settles: the two swatches are one colour.
    void this.ctx.tw.to(this.bucketNode, { y: l.bucket.y - 30 }, { duration: 0.25, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.bucketNode, { y: this.layoutNow.bucket.y }, { duration: 0.35, ease: ease.outBack }));
    await this.ctx.say('pm.match', { colour: mixName(this.sample.pair) });
    if (this.finished) return;
    if (this.bucketIndex + 1 >= this.samples.length) {
      this.finished = true;
      await this.ctx.say('pm.done');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    // The bucket empties by itself (a glug, free) and the next sample arrives.
    this.drops = [];
    sfx.splash();
    this.bucketIndex++;
    this.bucketMisses = 0;
    this.hinted = false;
    this.pots.splice(0, this.pots.length, ...this.sample.pair);
    this.buildPots();
    this.dressBucket();
    this.resize(this.ctx.view);
    await this.ctx.say('pm.next');
    if (this.finished) return;
    void this.ctx.instruct(this.plan.level === 1 ? 'pm.instruct.1' : 'pm.instruct.2');
    this.busy = false;
  }

  // ---- shell hooks ----

  resize(view: View) {
    const l = this.layoutNow = layout(view, this.pots.length);
    this.backdrop.resize(view);
    this.jarNode.position.set(l.jar.x, l.jar.y);
    this.recipeNode.position.set(l.recipe.x, l.recipe.y);
    this.bucketNode.position.set(l.bucket.x, l.bucket.y);
    this.buttons.get('undo')!.position.set(l.undo.x, l.undo.y);
    this.buttons.get('tip')!.position.set(l.tip.x, l.tip.y);
    this.buttons.get('check')!.position.set(l.check.x, l.check.y);
    this.pots.forEach((pot, i) => this.potNodes.get(pot)!.position.set(l.pots[i].x, l.pots[i].y + POT_H / 2));
  }

  update(dt: number) {
    this.clock += dt;
    this.glowRing.clear();
    if (!this.glow || this.finished || this.busy) return;
    const target = this.glowTarget(this.glow);
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const b = target.hitArea as Rectangle;
    this.glowRing.roundRect(target.x + b.x - pulse, target.y + b.y - pulse, b.width + 2 * pulse, b.height + 2 * pulse, 30).stroke({ width: 7, color: swatch.yellow.fill });
  }

  private glowTarget(g: Glow): Container {
    if (g.at === 'pot') return this.potNodes.get(g.pot)!;
    return this.buttons.get(g.at)!;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.pouring) return null;
    if (this.flights.children.length > 0) return null;
    return { tap: { on: this.glowTarget(glowFor(this.plan, this.sample, this.drops)) }, pause: 0.45 };
  }
}

function icon(): Container {
  const c = new Container();
  const b = bucketArt();
  fillInside(b.inside, mix({ red: 1, yellow: 2, blue: 0, white: 0 }));
  b.node.scale.set(0.5);
  b.node.position.set(0, -110);
  const r = potArt('red'), y = potArt('yellow');
  r.scale.set(0.5); y.scale.set(0.5);
  r.position.set(-92, 0); y.position.set(92, 0);
  c.addChild(b.node, r, y);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const s = stickerSample(seed);
  const counts = countsOf([...Array(s.counts[0]).fill(s.pair[0]), ...Array(s.counts[1]).fill(s.pair[1])] as Pot[]);
  const color = mix(counts)!;
  c.addChild(tile(260, 260, 'white'));
  const b = bucketArt();
  fillInside(b.inside, color);
  b.node.scale.set(0.5);
  b.node.position.set(20, 0);
  const j = jarArt(color);
  j.scale.set(0.6);
  j.position.set(-80, -20);
  c.addChild(b.node, j);
  const row = [...Array(s.counts[0]).fill(s.pair[0]), ...Array(s.counts[1]).fill(s.pair[1])] as Pot[];
  row.forEach((pot, i) => {
    const d = dropArt(pot);
    d.scale.set(0.9);
    d.position.set(-80 + (i - 1) * 34, 92);
    c.addChild(d);
  });
  return c;
}

export const paintMixer: GameModule = {
  id: 'paint-mixer', name: 'Paint Mixer', titleLine: 'game.paint-mixer', region: 'counting-cove',
  skills: ['counting', 'comparing', 'number-sense', 'operations'], bands: ['school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  coplayHint: 'Take turns: one of you reads the sample\'s row aloud ("one red, two yellow") while the other pours; swap after each bucket.',
  offScreen: 'Mix a drink or a paint colour together, then ask: if we made twice as much, what would we need of each?',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new PaintMixer(ctx),
  touchDemo: true,
};
