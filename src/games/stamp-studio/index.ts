import { rangeFor } from '../../progress/difficulty';
import { hinted, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import { Circle, Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, turnIcon, undoIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { sceneArt, stampArt } from './art';
import { TracePrints } from './trace';
import {
  animalAsks,
  animalWord,
  ASK_HINT_AFTER,
  COLOR_RADIUS,
  LEVELS,
  nextSize,
  stampLine,
  LIMIT,
  pixel,
  place,
  planFor,
  playOrder,
  type PlayNote,
  roundPlan,
  STAMP_COLORS,
  STAMP_NAMES,
  type SceneId,
  STAMP_SOUNDS,
  countAloud,
  stampStep,
  stickerStamp,
  wakeSchedule,
  wakeSounds,
  stampDemo,
  stampLayout,
  SPARKLE,
  sparklePixel,
  sparkleSpots,
  sparkleTap,
  type Pt,
  type Stamp,
  type StampKind,
} from './logic';

interface Mark {
  data: Stamp;
  node: Container;
  drag?: DragHandle;
}
class StampStudio implements Game {
  readonly plan;
  readonly stamps: Mark[] = [];
  readonly choices: RoundButton[] = [];
  readonly colors: RoundButton[] = [];
  readonly paper = new Container();
  private readonly background = new Graphics();
  private readonly sheet = new Graphics();
  /** The scene's backdrop (Sea rounds), under the stamps and inside the paper's edge; empty on plain paper. */
  private readonly backdrop = new Container();
  private readonly backdropMask = new Graphics();
  private readonly scene: SceneId | undefined;
  private readonly selection = new Graphics();
  readonly finish: RoundButton;
  readonly undo: RoundButton;
  readonly turn: RoundButton;
  readonly grow: RoundButton;
  readonly bin: RoundButton;
  /** The music note (levels 3–6): plays the picture back, left to right. */
  readonly play: RoundButton;
  /** The stamps the latest play-back has sounded, in order (for checks). */
  played: Stamp[] = [];
  private scan: { notes: (PlayNote & { mark: Mark })[]; time: number } | null = null;
  /** The stamps the wake-up has bounced, in order (for checks). */
  woken: Stamp[] = [];
  private wake: {
    at: number[];
    end: number;
    sounds: boolean[];
    time: number;
    marks: Mark[];
    creation: { kind: 'picture'; stamps: Stamp[]; scene?: SceneId };
  } | null = null;
  /** Presses this round, which climb a pitched stamp's sound; and the numbers already counted aloud. */
  private presses = 0;
  private readonly counted = new Set<number>();
  private readonly bar = new Graphics();
  /** Follow the sparkle (level 10): the round's spots in the order they glow, and the glow itself. */
  readonly spots: Pt[] = [];
  readonly glow = new Graphics();
  /** Stamp a duck! (level 11): the three animals asked in turn, which button glows after two wrong presses, and miss/hint counts. */
  readonly asks: StampKind[] = [];
  askIndex = 0;
  hintKind: StampKind | null = null;
  readonly choiceGlow = new Graphics();
  private readonly tally = newRequestTally();
  get misses() {
    return this.tally.misses;
  }
  get hints() {
    return this.tally.hints;
  }
  private glowTime = 0;
  private nudgeTime = 0;
  private selected: Mark | null = null;
  private readonly named = new Set<StampKind>();
  private fullSaid = false;
  private kind: StampKind;
  private color: ColorName;
  private width = 600;
  private height = 400;
  done = false;
  constructor(private readonly ctx: GameContext) {
    const round = roundPlan(ctx.level, ctx.rng);
    this.plan = round.plan;
    this.color = round.color;
    this.scene = round.scene;
    this.kind = this.plan.kinds[0];
    this.backdrop.eventMode = 'none';
    this.backdrop.mask = this.backdropMask;
    this.paper.addChild(this.sheet, this.backdrop, this.backdropMask, this.glow, this.selection, this.bar);
    if (this.plan.follow) {
      this.spots.push(...sparkleSpots(ctx.rng));
      const gold = swatch.yellow;
      this.glow
        .circle(0, 0, SPARKLE.radius)
        .fill({ color: gold.fill, alpha: 0.4 })
        .circle(0, 0, 58)
        .fill({ color: gold.fill, alpha: 0.55 })
        .poly(starPoints(46, 18, 4))
        .fill(0xffffff)
        .stroke({ width: 4, color: gold.line, join: 'round' });
    }
    this.glow.eventMode = 'none';
    this.glow.visible = false;
    this.selection.eventMode = 'none';
    this.bar.eventMode = 'none';
    ctx.stage.addChild(this.background, this.paper);
    const press = (e: FederatedPointerEvent) => {
      if (this.done) return;
      const p = this.paper.toLocal(e.global);
      if (this.stamps.length >= LIMIT) {
        if (this.currentAsk() !== null) {
          // Keep the paper within the limit without locking out remaining asks.
          this.remove(this.stamps[0]);
        } else {
          if (!this.fullSaid) {
            this.fullSaid = true;
            void ctx.say('stamp.full');
          }
          return;
        }
      }
      // `place` clamps, so a pat off the paper presses at the nearest place on it.
      const spot = this.sparkle();
      const at = spot ? sparkleTap(p.x, p.y, spot, this.width, this.height) : p;
      this.add(at.x, at.y);
    };
    // Pats close together are all kept.
    onTap(this.sheet, press, { cooldown: this.plan.pat ? 0 : undefined });
    // Pat the paper (lap): the teal around the paper presses a star too.
    if (this.plan.pat) onTap(this.background, press, { cooldown: 0 });
    // Follow the sparkle (lap, toddler): a tap anywhere stamps too, so there is no miss.
    if (this.plan.follow) onTap(this.background, press);
    if (this.plan.ask) this.asks.push(...animalAsks(this.plan.kinds, this.kind, ctx.rng));
    this.choiceGlow
      .circle(0, 0, 64)
      .fill({ color: 0xfff3a0, alpha: 0.85 })
      .stroke({ width: 5, color: swatch.yellow.line });
    this.choiceGlow.eventMode = 'none';
    this.choiceGlow.visible = false;
    ctx.stage.addChild(this.choiceGlow);
    this.plan.kinds.forEach((kind) => {
      const b = new RoundButton(stampArt(kind, this.color, 33), swatch.white, 48, () => {
        if (this.done) return;
        this.kind = kind;
        if (!this.named.has(kind)) {
          this.named.add(kind);
          void ctx.say('stamp.kind', { kind: STAMP_NAMES[kind] });
        }
        this.drawSelection();
      });
      ctx.stage.addChild(b);
      this.choices.push(b);
    });
    if (this.plan.color)
      for (const color of STAMP_COLORS) {
        const b = new RoundButton(
          new Graphics()
            .circle(0, 0, 22)
            .fill(swatch[color].fill)
            .stroke({ width: 4, color: stampLine(color, swatch[color].line) }),
          swatch.white,
          COLOR_RADIUS,
          () => {
            if (this.done) return;
            if (this.color !== color) {
              this.color = color;
              this.redrawChoices();
            }
            void ctx.say(('color.' + color) as 'color.blue');
            this.drawSelection();
          },
        );
        ctx.stage.addChild(b);
        this.colors.push(b);
      }
    this.finish = new RoundButton(arrowIcon(1), swatch.green, 48, () => this.complete());
    this.undo = new RoundButton(undoIcon(), swatch.white, 48, () => this.remove(this.stamps.at(-1) ?? null));
    const binArt = new Graphics()
      .roundRect(-19, -15, 38, 42, 5)
      .stroke({ width: 6, color: swatch.brown.line })
      .moveTo(-26, -22)
      .lineTo(26, -22)
      .moveTo(-9, -29)
      .lineTo(9, -29)
      .moveTo(-7, -5)
      .lineTo(-7, 16)
      .moveTo(7, -5)
      .lineTo(7, 16)
      .stroke({ width: 6, color: swatch.brown.line });
    this.bin = new RoundButton(binArt, swatch.white, 48, () => {
      if (this.plan.move) this.remove(this.selected);
    });
    this.turn = new RoundButton(turnIcon(), swatch.white, 48, () => {
      if (!this.done && this.selected) {
        this.selected.data.turns = (this.selected.data.turns + 1) % 4;
        this.layoutStamp(this.selected);
        this.drawSelection();
      }
    });
    this.grow = new RoundButton(
      // Small, middle and big: the button cycles a stamp through all three.
      new Graphics().circle(-25, 9, 7).circle(-8, 5, 11).circle(15, -1, 17).fill(swatch.purple.fill),
      swatch.white,
      48,
      () => {
        if (!this.done && this.selected) {
          this.selected.data.size = nextSize(this.selected.data.size);
          this.layoutStamp(this.selected);
          this.drawSelection();
        }
      },
    );
    const note = new Graphics()
      .ellipse(-9, 15, 13, 10)
      .fill(swatch.blue.line)
      .rect(1, -24, 6, 40)
      .fill(swatch.blue.line)
      .moveTo(4, -24)
      .quadraticCurveTo(26, -18, 20, 0)
      .stroke({ width: 6, color: swatch.blue.line });
    this.play = new RoundButton(note, swatch.white, 48, () => this.playBack());
    ctx.stage.addChild(this.finish, this.undo, this.turn, this.grow, this.bin, this.play);
  }
  /** Play the picture: start (or start again) the left-to-right scan. Nothing is scored. */
  private playBack() {
    if (this.done || !this.plan.play || !this.stamps.length) return;
    this.stopScan();
    this.played = [];
    this.scan = {
      notes: playOrder(this.stamps.map((s) => s.data)).map((n) => ({ ...n, mark: this.stamps[n.index] })),
      time: 0,
    };
  }
  private stopScan() {
    this.scan = null;
    this.bar.clear();
    for (const s of this.stamps) this.layoutStamp(s);
  }
  /** The spot that glows now (Follow the sparkle), or null. */
  private sparkle(): Pt | null {
    return this.done ? null : (this.spots[this.stamps.length] ?? null);
  }
  private drawGlow() {
    const spot = this.sparkle();
    this.glow.visible = !!spot;
    if (spot) this.glow.position.copyFrom(sparklePixel(spot, this.width, this.height));
  }
  /** The animal currently asked for (Stamp a duck!, level 11), or null once all asks are met. */
  private currentAsk(): StampKind | null {
    return this.plan.ask ? (this.asks[this.askIndex] ?? null) : null;
  }
  private complete() {
    if (this.done || !this.stamps.length) return;
    this.done = true;
    this.glow.visible = false;
    this.hintKind = null;
    this.choiceGlow.visible = false;
    this.finish.rotation = 0;
    this.stopScan();
    this.play.visible = false;
    // Freeze before the wake-up, including a stamp held by another finger.
    this.stamps.forEach((s) => {
      if (s.drag) {
        s.drag.enabled = false;
        s.drag.destroy();
      }
      this.ctx.tw.kill(s.node.scale);
      s.node.scale.set(1);
      this.layoutStamp(s);
    });
    const creation = {
      kind: 'picture' as const,
      stamps: this.stamps.map((s) => ({ ...s.data })),
      ...(this.scene ? { scene: this.scene } : {}),
    };
    void this.ctx.say('stamp.done');
    // The wake-up: each stamp bounces with its own sound, in the order it was placed, then the round ends (`update`).
    this.woken = [];
    const { at, end } = wakeSchedule(this.stamps.length);
    const sounds = wakeSounds(
      this.stamps.map((s) => s.data.kind),
      at,
    );
    this.wake = { at, end, sounds, time: 0, marks: [...this.stamps], creation };
  }
  /** A stamp's own sound; a pitched one rings the step for this `press` (counting from 1). */
  private sound(kind: StampKind, press: number) {
    const sound = STAMP_SOUNDS[kind];
    if (sound.play === 'splash') sfx.splash();
    else if (sound.play === 'animal') sfx.animal(sound.animal);
    else sfx[sound.play](stampStep(kind, press)!);
  }
  private stepWake(dt: number) {
    const wake = this.wake!;
    wake.time += dt;
    while (this.woken.length < wake.at.length && wake.at[this.woken.length] <= wake.time) {
      const i = this.woken.length;
      const mark = wake.marks[i];
      this.woken.push({ ...mark.data });
      if (wake.sounds[i]) this.sound(mark.data.kind, i + 1);
      const art = mark.node.children[0];
      art.scale.set(mark.data.size * 1.3);
      void this.ctx.tw.to(art.scale, { x: mark.data.size, y: mark.data.size }, { duration: 0.3 });
    }
    // At least the old 0.9 s pause, so a single stamp's wake-up still lets "You made your own picture!" begin.
    if (this.woken.length === wake.at.length && wake.time >= Math.max(wake.end, 0.9)) {
      this.wake = null;
      sfx.sparkle();
      this.ctx.finish({ ...tally(this.tally), creation: wake.creation });
    }
  }
  private remove(mark: Mark | null) {
    if (this.done || !mark) return;
    const index = this.stamps.indexOf(mark);
    if (index < 0) return;
    this.stamps.splice(index, 1);
    mark.drag?.destroy();
    this.ctx.tw.kill(mark.node);
    this.ctx.tw.kill(mark.node.scale);
    this.ctx.tw.kill(mark.node.children[0].scale);
    mark.node.destroy({ children: true });
    if (this.selected === mark) this.selected = this.stamps.at(-1) ?? null;
    this.drawSelection();
  }
  private redrawChoices() {
    this.choices.forEach((button, i) => {
      button.removeChildAt(1).destroy({ children: true });
      button.addChild(stampArt(this.plan.kinds[i], this.color, 33));
    });
  }
  private add(x: number, y: number) {
    const data: Stamp = {
      kind: this.kind,
      color: this.color,
      ...place(x, y, this.width, this.height),
      size: this.plan.pat?.size ?? 1,
      turns: 0,
    };
    const node = new Container();
    node.addChild(stampArt(data.kind, data.color));
    node.hitArea = new Circle(0, 0, 55);
    this.paper.addChild(node);
    const mark: Mark = { data, node };
    if (this.plan.move)
      mark.drag = draggable(node, this.ctx.tw, {
        onPick: () => {
          this.selected = mark;
          this.drawSelection();
          sfx.tick();
        },
        onDrop: (x, y) => {
          Object.assign(data, place(x, y, this.width, this.height));
          this.layoutStamp(mark);
          this.drawSelection();
          return true;
        },
      });
    else node.eventMode = 'none';
    this.stamps.push(mark);
    this.selected = mark;
    this.layoutStamp(mark);
    this.sound(data.kind, ++this.presses);
    if (this.plan.count) {
      const n = countAloud(this.stamps.length, this.counted);
      if (n) void this.ctx.say('stamp.count', { n });
    }
    this.checkAsk(data.kind);
    this.drawSelection();
    if (
      (this.ctx.level <= 2 && this.stamps.length === LIMIT) ||
      (this.plan.pat && this.stamps.length >= this.plan.pat.count) ||
      (this.plan.follow && this.stamps.length >= this.plan.follow.count)
    )
      this.complete();
  }
  private checkAsk(stamped: StampKind) {
    const ask = this.currentAsk();
    if (!ask) return;
    if (stamped === ask) {
      this.askIndex++;
      nextRequest(this.tally);
      this.hintKind = null;
      const next = this.currentAsk();
      if (next) void this.ctx.instruct('stamp.ask', { animal: animalWord(next) });
      else void this.ctx.instruct('stamp.free');
      return;
    }
    sfx.boing();
    if (missOnRequest(this.tally, ASK_HINT_AFTER)) {
      hinted(this.tally);
      this.hintKind = ask;
    }
    void this.ctx.say('stamp.wrong', {
      got: STAMP_NAMES[stamped].toLowerCase(),
      want: animalWord(ask),
    });
  }
  private layoutStamp(s: Mark) {
    const p = pixel(s.data, this.width, this.height);
    this.ctx.tw.kill(s.node);
    s.node.position.set(p.x, p.y);
    s.node.rotation = (s.data.turns * Math.PI) / 2;
    // Transform only the drawing; drag hit areas remain at least 110 units.
    this.ctx.tw.kill(s.node.children[0].scale);
    s.node.children[0].scale.set(s.data.size);
    if (s.drag) s.drag.home = p;
  }
  private drawSelection() {
    this.selection.clear();
    if (this.selected && this.plan.move)
      this.selection
        .circle(this.selected.node.x, this.selected.node.y, Math.max(70, 48 * this.selected.data.size + 12))
        .stroke({ width: 5, color: swatch.yellow.line });
    // Pat the paper and Follow the sparkle: no stamp button and no arrows, so only the last press ends the picture and
    // nothing takes a stamp away. Stamp a duck!: the green arrow appears once the three asks are met.
    const bare = !!(this.plan.pat || this.plan.follow);
    const asking = this.currentAsk() !== null;
    this.finish.visible = !bare && !asking && this.stamps.length > 0;
    this.undo.visible = !bare && this.stamps.length > 0;
    this.choices.forEach((b) => (b.visible = !bare));
    const hintIndex = this.hintKind && !this.done ? this.plan.kinds.indexOf(this.hintKind) : -1;
    this.choiceGlow.visible = hintIndex >= 0;
    if (hintIndex >= 0) this.choiceGlow.position.copyFrom(this.choices[hintIndex].position);
    this.drawGlow();
    this.bin.visible = this.plan.move && !!this.selected;
    this.play.visible = !!this.plan.play && this.stamps.length > 0 && !this.done;
    if (this.stamps.length < 5) {
      this.nudgeTime = 0;
      this.finish.rotation = 0;
    }
    this.turn.visible = this.grow.visible = this.plan.transform && !!this.selected;
    this.choices.forEach((b, i) => (b.alpha = this.plan.kinds[i] === this.kind ? 1 : 0.68));
    this.colors.forEach((b, i) => (b.alpha = STAMP_COLORS[i] === this.color ? 1 : 0.65));
  }
  start() {
    const ask = this.currentAsk();
    if (ask) void this.ctx.instruct('stamp.ask', { animal: animalWord(ask) });
    else void this.ctx.instruct(`stamp.${this.plan.prompt}`);
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    const l = stampLayout(v, this.choices.length, this.plan.transform);
    this.width = l.paper.w;
    this.height = l.paper.h;
    this.paper.position.set(l.paper.x, l.paper.y);
    this.sheet
      .clear()
      .roundRect(0, 0, this.width, this.height, 24)
      .fill(cream)
      .stroke({ width: 7, color: swatch.brown.line });
    this.sheet.hitArea = new Rectangle(0, 0, this.width, this.height);
    this.backdrop.removeChildren().forEach((c) => c.destroy());
    this.backdropMask
      .clear()
      .roundRect(3.5, 3.5, this.width - 7, this.height - 7, 20.5)
      .fill(0xffffff);
    if (this.scene) this.backdrop.addChild(sceneArt(this.scene, this.width, this.height));
    this.choices.forEach((b, i) => b.position.set(l.choices[i].x, l.choices[i].y));
    this.colors.forEach((b, i) => b.position.set(l.colors[i].x, l.colors[i].y));
    for (const k of ['finish', 'undo', 'bin', 'turn', 'grow', 'play'] as const)
      this[k].position.set(l[k].x, l[k].y);
    if (this.scan) this.stopScan();
    for (const s of this.stamps) this.layoutStamp(s);
    this.drawSelection();
  }
  update(dt: number) {
    if (this.scan) this.stepScan(dt);
    if (this.wake) this.stepWake(dt);
    if (this.glow.visible || this.choiceGlow.visible) {
      this.glowTime += dt;
      // Never smaller than `SPARKLE.across`.
      if (this.glow.visible) this.glow.scale.set(1 + SPARKLE.pulse * Math.sin(this.glowTime * 4));
      if (this.choiceGlow.visible) this.choiceGlow.alpha = 0.65 + 0.35 * Math.sin(this.glowTime * 7);
    }
    if (!this.done && this.ctx.level <= 2 && this.stamps.length >= 5) {
      this.nudgeTime += dt;
      this.finish.rotation = Math.sin(this.nudgeTime * 4) * 0.12;
    }
  }
  private stepScan(dt: number) {
    const scan = this.scan!;
    scan.time += dt;
    while (scan.notes.length && scan.notes[0].at <= scan.time) {
      const { mark, step } = scan.notes.shift()!;
      // A stamp removed since the scan began is skipped.
      if (!this.stamps.includes(mark)) continue;
      sfx.marimba(step);
      this.played.push({ ...mark.data });
      const art = mark.node.children[0];
      art.scale.set(mark.data.size * 1.25);
      void this.ctx.tw.to(art.scale, { x: mark.data.size, y: mark.data.size }, { duration: 0.25 });
      this.bar
        .clear()
        .rect(mark.node.x - 4, 0, 8, this.height)
        .fill({ color: swatch.yellow.line, alpha: 0.5 });
    }
    if (!scan.notes.length && scan.time > (this.played.length ? 0.5 : 0)) {
      this.scan = null;
      this.bar.clear();
    }
  }
  /** The ghost finger: make a small picture with what this level offers (stamps, colors, a turn, a bigger stamp, a carried stamp), then press the green arrow. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    const spot = this.sparkle();
    const at = spot && sparklePixel(spot, this.width, this.height);
    const move = stampDemo(this.plan, {
      stamps: this.stamps.map((s) => s.data),
      kind: this.kind,
      color: this.color,
      sparkle: at ? place(at.x, at.y, this.width, this.height) : undefined,
      ask: this.currentAsk() ?? undefined,
    });
    switch (move.do) {
      case 'kind':
        return { tap: { on: this.choices[(this.plan.kinds as readonly StampKind[]).indexOf(move.kind)] } };
      case 'color':
        return { tap: { on: this.colors[STAMP_COLORS.indexOf(move.color)] } };
      case 'stamp':
        return { tap: { on: this.sheet, ...pixel(move, this.width, this.height) } };
      case 'turn':
        return { tap: { on: this.turn } };
      case 'grow':
        return { tap: { on: this.grow } };
      case 'move':
        return {
          drag: { on: this.stamps[move.stamp].node },
          to: { on: this.paper, ...pixel(move, this.width, this.height) },
        };
      default:
        return { tap: { on: this.finish } };
    }
  }
  destroy() {
    this.stamps.forEach((s) => s.drag?.destroy());
  }
}
export const stampStudio: GameModule = {
  id: 'stamp-studio',
  name: 'Stamp Studio',
  titleLine: 'game.stamp-studio',
  region: 'treehouse',
  challenge: 'space',
  skills: ['composition', 'creative-expression', 'spatial-reasoning'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [7, 8, 9, 10, 11],
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Let {name} choose where the picture goes. Any picture is a finished picture.',
  offScreen: 'Stamp with a sponge or potato on scrap paper, then tell a story about the picture.',
  hubIcon: () => {
    const c = new Container();
    c.addChild(
      new Graphics()
        .roundRect(-90, -140, 180, 140, 15)
        .fill(cream)
        .stroke({ width: 7, color: swatch.brown.line }),
    );
    const a = stampArt('flower', 'pink');
    a.y = -70;
    c.addChild(a);
    return new WigglyIcon(c);
  },
  sticker: (seed) => {
    const { kind, color } = stickerStamp(seed);
    return stampArt(kind, color, 70);
  },
  create: (ctx) => (planFor(ctx.level).trace ? new TracePrints(ctx) : new StampStudio(ctx)),
};
