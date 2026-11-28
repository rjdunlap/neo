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
  anchorPixel,
  type Anchor,
  animalAsks,
  animalWord,
  type Invite,
  type Relation,
  meetsRelation,
  relationPhrase,
  relationTarget,
  ASK_HINT_AFTER,
  choiceButtonRadius,
  COLOR_RADIUS,
  ABOVE_REACH,
  BETWEEN_REACH,
  LEVELS,
  meetsWord,
  NEXT_TO,
  ON_ANCHOR,
  nextSize,
  PLACE_GLOW_AFTER,
  PLACE_PHRASES,
  placeTarget,
  POND,
  POND_REACH,
  SCENES,
  stampLine,
  LIMIT,
  pixel,
  place,
  planFor,
  playOrder,
  type PlayNote,
  roundPlan,
  SET_CHOICES,
  SET_RADIUS,
  SET_REACH,
  setChoiceInfo,
  type SetChoice,
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
  /** The scene's backdrop (Sea or Farm rounds, or a chosen set from level 4), under the stamps and inside the paper's edge; empty on plain paper. */
  private readonly backdrop = new Container();
  private readonly backdropMask = new Graphics();
  private scene: SceneId | undefined;
  private activeSet: SetChoice = 'plain';
  activeKinds: StampKind[];
  setsOpen = false;
  readonly setsButton: RoundButton;
  private readonly setTray = new Graphics();
  readonly setButtons: RoundButton[] = [];
  private lastView: View = { w: 1024, h: 768, scale: 1 };
  /** The yellow ring round the picked stamp (empty when nothing is picked). */
  readonly selection = new Graphics();
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
  /**
   * The invitation levels, Where does it go? (12) and Next to, between, above (13): the round's invitations, how many are
   * met, and the idle glow over the place that would meet the open one.
   */
  readonly invites: Invite[] = [];
  /** Next to, between, above: the two animals printed on the paper, which never move and are not hers to remove. */
  readonly anchors: Anchor[] = [];
  readonly anchorMarks: Mark[] = [];
  private readonly anchorShadows = new Graphics();
  inviteIndex = 0;
  private elsewhereSaid = false;
  readonly placeGlow = new Graphics();
  /** Keeps the glow on the paper: a ring beside an animal near the edge would otherwise spill onto the teal. */
  private readonly placeGlowMask = new Graphics();
  private idleTime = 0;
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
    if (round.invites) this.invites.push(...round.invites);
    if (round.anchors) this.anchors.push(...round.anchors);
    this.activeKinds = [...this.plan.kinds];
    this.kind = this.activeKinds[0];
    this.backdrop.eventMode = 'none';
    this.backdrop.mask = this.backdropMask;
    this.paper.addChild(
      this.sheet,
      this.backdrop,
      this.backdropMask,
      this.placeGlowMask,
      this.placeGlow,
      this.glow,
      this.selection,
      this.bar,
    );
    this.placeGlow.eventMode = 'none';
    this.placeGlow.visible = false;
    this.placeGlow.mask = this.placeGlowMask;
    this.anchorShadows.eventMode = 'none';
    this.paper.addChild(this.anchorShadows);
    for (const [i, a] of this.anchors.entries()) {
      // Printed in two fixed colors; a press on an animal passes through to the paper.
      const data: Stamp = { kind: a.kind, color: i ? 'blue' : 'orange', x: 0.5, y: 0.5, size: 1, turns: 0 };
      const node = new Container();
      node.addChild(stampArt(data.kind, data.color));
      node.eventMode = 'none';
      this.paper.addChild(node);
      this.anchorMarks.push({ data, node });
    }
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
      if (this.setsOpen) {
        this.setsOpen = false;
        this.drawSelection();
      }
      const p = this.paper.toLocal(e.global);
      // The printed animals are kept with the picture, so they take their places in its limit.
      if (this.stamps.length >= LIMIT - this.anchorMarks.length) {
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
    this.rebuildChoices();
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
              this.redrawSetButton();
              this.redrawSetButtons();
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
    this.setsButton = new RoundButton(stampArt(this.activeKinds[0], this.color, 30), swatch.white, 48, () => {
      if (this.done || !this.plan.sets) return;
      this.setsOpen = !this.setsOpen;
      this.drawSelection();
    });
    this.setTray.eventMode = 'static';
    ctx.stage.addChild(
      this.finish,
      this.undo,
      this.turn,
      this.grow,
      this.bin,
      this.play,
      this.setsButton,
      this.setTray,
    );
    for (const choice of SET_CHOICES) {
      const info = setChoiceInfo(choice);
      const b = new RoundButton(stampArt(info.kinds[0], this.color, 26), swatch.white, SET_RADIUS, () => {
        if (this.done) return;
        this.selectSet(choice);
      });
      ctx.stage.addChild(b);
      this.setButtons.push(b);
    }
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
    this.setsOpen = false;
    this.glow.visible = false;
    this.hintKind = null;
    this.choiceGlow.visible = false;
    this.finish.rotation = 0;
    this.stopScan();
    this.placeGlow.visible = false;
    // Levels 12 and 13: each invitation not met when she finishes counts as one hint (never spoken as a failure).
    for (let i = this.inviteIndex; i < this.invites.length; i++) hinted(this.tally);
    this.play.visible = false;
    this.setsButton.visible = false;
    this.setTray.visible = false;
    this.setButtons.forEach((b) => (b.visible = false));
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
    // The printed animals are kept with her picture (first, under her stamps) and wake up with it.
    const marks = [...this.anchorMarks, ...this.stamps];
    const creation = {
      kind: 'picture' as const,
      stamps: marks.map((s) => ({ ...s.data })),
      ...(this.scene ? { scene: this.scene } : {}),
    };
    void this.ctx.say('stamp.done');
    // The wake-up: each stamp bounces with its own sound, in the order it was placed, then the round ends (`update`).
    this.woken = [];
    const { at, end } = wakeSchedule(marks.length);
    const sounds = wakeSounds(
      marks.map((s) => s.data.kind),
      at,
    );
    this.wake = { at, end, sounds, time: 0, marks, creation };
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
  private choiceArtSize(radius: number) {
    return radius <= 36 ? 25 : radius <= 40 ? 28 : 33;
  }
  private rebuildChoices() {
    for (const b of this.choices) b.destroy({ children: true });
    this.choices.length = 0;
    const radius = choiceButtonRadius(this.activeKinds.length, this.lastView.upright);
    const artSize = this.choiceArtSize(radius);
    for (const kind of this.activeKinds) {
      const b = new RoundButton(stampArt(kind, this.color, artSize), swatch.white, radius, () => {
        if (this.done) return;
        this.kind = kind;
        if (!this.named.has(kind)) {
          this.named.add(kind);
          void this.ctx.say('stamp.kind', { kind: STAMP_NAMES[kind] });
        }
        this.drawSelection();
      });
      this.ctx.stage.addChild(b);
      this.choices.push(b);
    }
    this.layoutChoices();
  }
  private layoutChoices() {
    const l = stampLayout(this.lastView, this.activeKinds.length, this.plan.transform);
    this.choices.forEach((b, i) => b.position.set(l.choices[i].x, l.choices[i].y));
  }
  private drawBackdrop() {
    this.backdrop.removeChildren().forEach((c) => c.destroy());
    if (this.scene) this.backdrop.addChild(sceneArt(this.scene, this.width, this.height));
  }
  /** Switch to a stamp set (or back to Plain): updates the palette and backdrop while keeping stamps already placed. */
  selectSet(choice: SetChoice) {
    this.activeSet = choice;
    const info = setChoiceInfo(choice);
    this.scene = info.scene;
    this.activeKinds = [...info.kinds];
    if (!this.activeKinds.includes(this.kind)) this.kind = this.activeKinds[0];
    this.setsOpen = false;
    this.rebuildChoices();
    this.drawBackdrop();
    this.redrawSetButton();
    this.drawSelection();
  }
  private redrawChoices() {
    const artSize = this.choiceArtSize(this.choices[0]?.radius ?? 48);
    this.choices.forEach((button, i) => {
      button.removeChildAt(1).destroy({ children: true });
      button.addChildAt(stampArt(this.activeKinds[i], this.color, artSize), 1);
    });
  }
  private redrawSetButton() {
    this.setsButton.removeChildAt(1).destroy({ children: true });
    this.setsButton.addChildAt(stampArt(this.activeKinds[0], this.color, 30), 1);
  }
  private redrawSetButtons() {
    this.setButtons.forEach((button, i) => {
      const first = setChoiceInfo(SET_CHOICES[i]).kinds[0];
      button.removeChildAt(1).destroy({ children: true });
      button.addChildAt(stampArt(first, this.color, 26), 1);
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
          this.checkInvite(data);
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
    this.checkInvite(data);
    this.drawSelection();
    if (
      (this.ctx.level <= 2 && this.stamps.length === LIMIT) ||
      (this.plan.pat && this.stamps.length >= this.plan.pat.count) ||
      (this.plan.follow && this.stamps.length >= this.plan.follow.count)
    )
      this.complete();
  }
  /** The invitation still open (levels 12 and 13), or null once all are met. */
  private currentInvite() {
    return this.invites[this.inviteIndex] ?? null;
  }
  /** The printed animals' centres on this paper. */
  private anchorPixels() {
    return this.anchors.map((a) => anchorPixel(a, this.width, this.height));
  }
  private invitePlace(invite: Invite) {
    return 'word' in invite ? PLACE_PHRASES[invite.word] : relationPhrase(invite.relation, this.anchors);
  }
  /** Whether a stamp centred at this pixel meets the invitation: only where it lands counts. */
  private meets(invite: Invite, p: Pt) {
    return 'word' in invite
      ? meetsWord(invite.word, p.x, p.y, this.width, this.height)
      : meetsRelation(invite.relation, p.x, p.y, this.anchorPixels());
  }
  private sayInvite(line: 'stamp.places' | 'stamp.elsewhere') {
    const invite = this.currentInvite();
    if (!invite) return;
    const params = { kind: animalWord(invite.kind), place: this.invitePlace(invite) };
    if (line === 'stamp.places') void this.ctx.instruct(line, params);
    else void this.ctx.say(line, params);
  }
  /**
   * A stamp pressed or carried to the open invitation's place meets it: a sparkle, then the next word. A stamp anywhere
   * else is just part of the picture (no boing, no miss); the invitation is said again once, gently.
   */
  private checkInvite(stamp: Stamp) {
    const invite = this.currentInvite();
    if (!invite || this.done) return;
    this.idleTime = 0;
    this.placeGlow.visible = false;
    const p = pixel(stamp, this.width, this.height);
    if (!this.meets(invite, p)) {
      if (!this.elsewhereSaid) {
        this.elsewhereSaid = true;
        this.sayInvite('stamp.elsewhere');
      }
      return;
    }
    this.inviteIndex++;
    this.elsewhereSaid = false;
    sfx.sparkle();
    this.ctx.particles.burst(this.paper.x + p.x, this.paper.y + p.y, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff, swatch.yellow.fill],
      count: 14,
      speed: [80, 200],
      gravity: 160,
      life: [0.4, 0.7],
    });
    if (this.currentInvite()) this.sayInvite('stamp.places');
    else if (this.plan.relate) void this.ctx.instruct('stamp.relationsdone', { count: 'three' });
    else void this.ctx.instruct('stamp.placesdone', { count: 'three' });
    this.drawPlaceGlow();
  }
  /** The soft glow over the open invitation's place, drawn for this paper size (shown after `PLACE_GLOW_AFTER` idle). */
  private drawPlaceGlow() {
    const g = this.placeGlow.clear();
    const invite = this.currentInvite();
    if (!invite) return;
    const w = this.width;
    const h = this.height;
    const fill = { color: 0xfff3a0, alpha: 0.45 };
    if (!('word' in invite)) {
      this.drawRelationGlow(g, invite.relation, fill);
      return;
    }
    const horizon = h * SCENES.farm.horizon;
    const pond = () => g.ellipse(w * POND.x, h * POND.y, w * POND.rx + POND_REACH, h * POND.ry + POND_REACH);
    if (invite.word === 'sky') g.rect(4, 4, w - 8, horizon - 4).fill(fill);
    else if (invite.word === 'water') pond().fill(fill).stroke({ width: 5, color: swatch.yellow.line });
    else {
      g.rect(4, horizon, w - 8, h - horizon - 4).fill(fill);
      pond().cut();
    }
  }
  /** Next to, between, above: the zone that would meet the relation, with the animals themselves left clear. */
  private drawRelationGlow(g: Graphics, r: Relation, fill: { color: number; alpha: number }) {
    const pts = this.anchorPixels();
    if (r.rel === 'next') {
      // A ring: the animal's own circle (wholly inside the glow) is left clear.
      const a = pts[r.anchor];
      g.circle(a.x, a.y, NEXT_TO).fill(fill).circle(a.x, a.y, ON_ANCHOR).cut();
    } else if (r.rel === 'between') {
      // The band along the line joining them, starting and ending clear of each animal.
      const [a, b] = pts;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      const [nx, ny] = [-uy * BETWEEN_REACH, ux * BETWEEN_REACH];
      const [sx, sy] = [a.x + ux * ON_ANCHOR, a.y + uy * ON_ANCHOR];
      const [ex, ey] = [b.x - ux * ON_ANCHOR, b.y - uy * ON_ANCHOR];
      g.poly([sx + nx, sy + ny, ex + nx, ey + ny, ex - nx, ey - ny, sx - nx, sy - ny]).fill(fill);
    } else {
      const a = pts[r.anchor];
      const top = r.rel === 'above' ? 4 : a.y + ON_ANCHOR;
      const bottom = r.rel === 'above' ? a.y - ON_ANCHOR : this.height - 4;
      g.rect(a.x - ABOVE_REACH, top, ABOVE_REACH * 2, bottom - top).fill(fill);
    }
  }
  /** Lay the printed animals and their soft shadows out on this paper. */
  private layoutAnchors() {
    const shadows = this.anchorShadows.clear();
    this.anchorPixels().forEach((p, i) => {
      const mark = this.anchorMarks[i];
      Object.assign(mark.data, place(p.x, p.y, this.width, this.height));
      this.layoutStamp(mark);
      shadows.ellipse(p.x + 4, p.y + 44, 50, 14).fill({ color: 0x000000, alpha: 0.12 });
    });
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
    const hintIndex = this.hintKind && !this.done ? this.activeKinds.indexOf(this.hintKind) : -1;
    this.choiceGlow.visible = hintIndex >= 0;
    if (hintIndex >= 0) this.choiceGlow.position.copyFrom(this.choices[hintIndex].position);
    this.drawGlow();
    this.bin.visible = this.plan.move && !!this.selected;
    this.play.visible = !!this.plan.play && this.stamps.length > 0 && !this.done;
    const showSets = !!this.plan.sets && !this.done;
    this.setsButton.visible = showSets;
    this.setTray.visible = showSets && this.setsOpen;
    this.setButtons.forEach((b, i) => {
      b.visible = showSets && this.setsOpen;
      b.alpha = SET_CHOICES[i] === this.activeSet ? 1 : 0.72;
    });
    if (this.stamps.length < 5) {
      this.nudgeTime = 0;
      this.finish.rotation = 0;
    }
    this.turn.visible = this.grow.visible = this.plan.transform && !!this.selected;
    this.choices.forEach((b, i) => (b.alpha = this.activeKinds[i] === this.kind ? 1 : 0.68));
    this.colors.forEach((b, i) => (b.alpha = STAMP_COLORS[i] === this.color ? 1 : 0.65));
  }
  start() {
    const ask = this.currentAsk();
    if (this.currentInvite()) this.sayInvite('stamp.places');
    else if (ask) void this.ctx.instruct('stamp.ask', { animal: animalWord(ask) });
    else void this.ctx.instruct(`stamp.${this.plan.prompt}`);
  }
  resize(v: View) {
    this.lastView = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    if (
      this.choices.length &&
      this.choices[0].radius !== choiceButtonRadius(this.activeKinds.length, v.upright)
    )
      this.rebuildChoices();
    const l = stampLayout(v, this.activeKinds.length, this.plan.transform);
    this.width = l.paper.w;
    this.height = l.paper.h;
    this.paper.position.set(l.paper.x, l.paper.y);
    this.sheet
      .clear()
      .roundRect(0, 0, this.width, this.height, 24)
      .fill(cream)
      .stroke({ width: 7, color: swatch.brown.line });
    this.sheet.hitArea = new Rectangle(0, 0, this.width, this.height);
    this.backdropMask
      .clear()
      .roundRect(3.5, 3.5, this.width - 7, this.height - 7, 20.5)
      .fill(0xffffff);
    this.placeGlowMask
      .clear()
      .roundRect(3.5, 3.5, this.width - 7, this.height - 7, 20.5)
      .fill(0xffffff);
    this.drawBackdrop();
    this.layoutAnchors();
    this.drawPlaceGlow();
    this.choices.forEach((b, i) => b.position.set(l.choices[i].x, l.choices[i].y));
    this.colors.forEach((b, i) => b.position.set(l.colors[i].x, l.colors[i].y));
    for (const k of ['finish', 'undo', 'bin', 'turn', 'grow', 'play', 'sets'] as const)
      (k === 'sets' ? this.setsButton : this[k]).position.set(l[k].x, l[k].y);
    this.setButtons.forEach((b, i) => b.position.set(l.setRow[i].x, l.setRow[i].y));
    if (l.setRow.length) {
      const xs = l.setRow.map((p) => p.x);
      const ys = l.setRow.map((p) => p.y);
      const pad = SET_REACH + 4;
      const x0 = Math.min(...xs) - pad;
      const y0 = Math.min(...ys) - pad;
      const w = Math.max(...xs) + pad - x0;
      const h = Math.max(...ys) + pad - y0;
      this.setTray
        .clear()
        .roundRect(x0, y0, w, h, 24)
        .fill({ color: 0xffffff, alpha: 0.94 })
        .stroke({ width: 4, color: swatch.brown.line });
      this.setTray.hitArea = new Rectangle(x0, y0, w, h);
    }
    if (this.scan) this.stopScan();
    for (const s of this.stamps) this.layoutStamp(s);
    this.drawSelection();
  }
  update(dt: number) {
    if (this.scan) this.stepScan(dt);
    if (!this.done && this.currentInvite()) {
      // A free glow of the named place after a quiet spell; any stamp resets it. Not a hint.
      this.idleTime += dt;
      this.placeGlow.visible = this.idleTime >= PLACE_GLOW_AFTER;
      if (this.placeGlow.visible) this.placeGlow.alpha = 0.7 + 0.3 * Math.sin(this.idleTime * 3);
    }
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
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

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
      invite: this.inviteFor(),
    });
    switch (move.do) {
      case 'kind':
        return { tap: { on: this.choices[this.activeKinds.indexOf(move.kind)] } };
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
  /** The ghost finger's open invitation: its suggested stamp and a press well inside its place or relation. */
  private inviteFor() {
    const invite = this.currentInvite();
    if (!invite) return undefined;
    const at =
      'word' in invite
        ? placeTarget(invite.word, this.width, this.height)
        : relationTarget(invite.relation, this.anchorPixels());
    return { kind: invite.kind, at: place(at.x, at.y, this.width, this.height) };
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
