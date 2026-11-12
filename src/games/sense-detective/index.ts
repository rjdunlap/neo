import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  cantTellArt,
  cardBack,
  checkButtonArt,
  listenButtonArt,
  lookButtonArt,
  outlineArt,
  parcelArt,
  quiltArt,
  senseChoiceArt,
  soundArt,
  toyArt,
} from './art';
import {
  LEVELS,
  check,
  checkSense,
  checkSet,
  checkTell,
  countsAsMiss,
  deciding,
  exhibitLayout,
  GLOW_AFTER,
  HEARD,
  hintEdit,
  ITS,
  makeRound,
  narrowingFor,
  observe,
  planFor,
  possible,
  SEEN,
  senseTouch,
  setKey,
  setTouch,
  Tally,
  tellTarget,
  tellTouch,
  TOY_IDS,
  TOY_NAMES,
  TOYS,
  type Channel,
  type Mode,
  type TellAnswer,
  type Observation,
  type Rect,
  type Round,
  type SoundValue,
  type ToyId,
} from './logic';
import type { LineId } from '../../content/voice-script';

/** Each set level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

function playSound(s: SoundValue) {
  if (s === 'ring') sfx.bell(9);
  else if (s === 'beat') sfx.drum();
  else sfx.shake();
}

interface ToyCard {
  id: ToyId;
  node: Container;
  ring: Graphics;
  badge: Container;
}
interface Evidence {
  obs: Observation;
  node: Container;
}

class SenseDetective implements Game {
  readonly round: Round;
  readonly record: Observation[] = [];
  cards: ToyCard[] = [];
  evidence: Evidence[] = [];
  selected: ToyId | null = null;
  /** Levels 3-4: every toy she has selected, in the order she tapped them. */
  chosen: ToyId[] = [];
  /** Which parcel of the round is on the counter. */
  parcelIndex = 0;
  /** Level 4: the look's set was right so far, so the Listen ear is out. */
  listenOpen = false;
  /** Level 5: stage A asks whether the look can tell (`answer`); stage B which sense would (`sense`). */
  stage: 'answer' | 'sense' = 'answer';
  /** Level 5: the toy, *Can't tell yet* or sense card she has chosen in this stage. */
  answer: TellAnswer | Channel | null = null;
  readonly cantTellCard = new Container();
  private readonly cantTellRing = new Graphics();
  readonly choiceCards: { ch: Channel; node: Container; ring: Graphics }[] = [];
  private readonly quilt = quiltArt();
  readonly tally = new Tally();
  private readonly mode: Mode;
  private get setLevel() {
    return this.mode === 'set';
  }
  private get tellLevel() {
    return this.mode === 'tell';
  }
  private instructId: LineId;
  private oneMores = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Levels 4–5: the next instruction, waiting behind a right step's line (U7 R4); `askGen` drops a stale wait. */
  unasked = false;
  private askGen = 0;
  private askVars: Record<string, string> | undefined;
  private alive = true;
  private clock = 0;
  private lastKey: string | null = null;
  private notYets = 0;
  private hinted = false;
  private glowOn = false;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly parcel = parcelArt();
  readonly lookBtn = new Container();
  readonly listenBtn = new Container();
  readonly checkBtn = new Container();
  private readonly shelfBoard = new Graphics();
  private readonly stripLayer = new Container();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const first = ctx.demo === true || !authoredShown.has(ctx.level);
    this.round = makeRound(ctx.level, ctx.rng, first);
    if (!ctx.demo) authoredShown.add(ctx.level);
    this.mode = planFor(this.round.level).mode;
    this.instructId =
      this.round.level === 1
        ? 'sense.instruct-look'
        : this.round.level === 2
          ? 'sense.instruct-choose'
          : this.tellLevel
            ? 'sense.instruct-tell'
            : this.round.parcels.length > 1
              ? 'sense.two-parcels'
              : 'sense.instruct-all';
    this.backdrop = new Backdrop(
      {
        sky: [swatch.teal.light, cream],
        hills: [swatch.green.fill, swatch.teal.light],
        horizon: 0.74,
        clouds: 2,
        sun: false,
        seed: 83,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.shelfBoard.eventMode = 'none';
    this.parcel.eventMode = 'none';
    this.lookBtn.addChild(lookButtonArt());
    this.listenBtn.addChild(listenButtonArt());
    this.checkBtn.addChild(checkButtonArt());
    ctx.stage.addChild(this.backdrop, this.shelfBoard, this.parcel, this.stripLayer);
    this.makeButton(this.lookBtn, 150, () => void this.investigate('view'));
    if (this.round.channels.includes('sound'))
      this.makeButton(this.listenBtn, 150, () => void this.investigate('sound'));
    this.makeButton(this.checkBtn, 170, () => void this.press());
    for (const id of this.round.shelf) this.cards.push(this.makeCard(id));
    // Level 4's ear waits for the look's set to be right.
    if (this.setLevel && this.round.channels.includes('sound')) this.listenBtn.visible = false;
    if (this.tellLevel) this.makeTellCards();
    ctx.stage.addChild(this.glow);
  }

  private makeButton(node: Container, size: number, fn: () => void) {
    node.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    onTap(
      node,
      () => {
        if (this.finished) return;
        void this.squish(node);
        fn();
      },
      { cooldown: 250 },
    );
    this.ctx.stage.addChild(node);
  }

  private makeCard(id: ToyId): ToyCard {
    const node = new Container();
    const ring = new Graphics()
      .roundRect(-108, -118, 216, 236, 28)
      .stroke({ width: 8, color: swatch.yellow.fill });
    ring.visible = false;
    ring.eventMode = 'none';
    node.addChild(cardBack(200, 220), ring);
    const art = toyArt(id, 130);
    art.y = -22;
    art.eventMode = 'none';
    // An unscaled wrapper, so a pulse (which tweens to scale 1) never resizes the pre-scaled outline.
    const outline = outlineArt(TOYS[id].view, 50);
    outline.y = 0;
    const badge = new Container();
    badge.addChild(outline);
    badge.position.set(-62, 78);
    const plate = new Graphics()
      .circle(-62, 78, 30)
      .fill(swatch.white.light)
      .stroke({ width: 3, color: wood.light });
    plate.eventMode = 'none';
    badge.eventMode = 'none';
    node.addChild(art, plate, badge);
    node.hitArea = new Rectangle(-100, -110, 200, 220);
    onTap(
      node,
      () => {
        if (!this.finished) void this.pick(id);
      },
      { cooldown: 200 },
    );
    this.ctx.stage.addChild(node);
    return { id, node, ring, badge };
  }

  /** Level 5: the quilt on the parcel, the *Can't tell yet* card, and stage B's eye and ear cards (hidden until then). */
  private makeTellCards() {
    this.quilt.eventMode = 'none';
    this.parcel.addChild(this.quilt);
    this.cantTellRing.roundRect(-94, -94, 188, 188, 28).stroke({ width: 8, color: swatch.yellow.fill });
    this.cantTellRing.visible = false;
    this.cantTellRing.eventMode = 'none';
    this.cantTellCard.addChild(cantTellArt(170), this.cantTellRing);
    this.cantTellCard.hitArea = new Rectangle(-85, -85, 170, 170);
    onTap(
      this.cantTellCard,
      () => {
        if (!this.finished) void this.choose('cant-tell');
      },
      { cooldown: 200 },
    );
    this.ctx.stage.addChild(this.cantTellCard);
    for (const ch of ['view', 'sound'] as const) {
      const node = senseChoiceArt(ch);
      const ring = new Graphics()
        .roundRect(-108, -118, 216, 236, 28)
        .stroke({ width: 8, color: swatch.yellow.fill });
      ring.visible = false;
      ring.eventMode = 'none';
      node.addChild(ring);
      node.hitArea = new Rectangle(-100, -110, 200, 220);
      node.visible = false;
      node.eventMode = 'none';
      onTap(
        node,
        () => {
          if (!this.finished) void this.choose(ch);
        },
        { cooldown: 200 },
      );
      this.ctx.stage.addChild(node);
      this.choiceCards.push({ ch, node, ring });
    }
  }

  private async squish(n: Container) {
    await this.ctx.tw.to(n.scale, { x: 0.9, y: 0.9 }, { duration: 0.06 });
    if (this.alive && !n.destroyed)
      await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.12, ease: ease.outBack });
  }

  private async bob(n: Container) {
    for (const s of [1.12, 1, 1.12, 1]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n.scale, { x: s, y: s }, { duration: 0.1 });
    }
  }

  start() {
    this.layout();
    void this.begin();
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private exhibit() {
    // Level 5 has one button but two clues: the look, then the reveal's sound.
    return exhibitLayout(
      this.view,
      this.cards.length,
      this.round.channels.length,
      this.tellLevel,
      this.tellLevel ? 2 : this.round.channels.length,
    );
  }

  private layout() {
    const l = this.exhibit();
    const at = (n: Container, r: Rect) => n.position.set(r.x + r.w / 2, r.y + r.h / 2);
    at(this.parcel, l.parcel);
    at(this.lookBtn, l.look);
    if (l.listen) at(this.listenBtn, l.listen);
    at(this.checkBtn, l.check);
    this.cards.forEach((c, i) => at(c.node, l.shelf[i]));
    this.evidence.forEach((e, i) => at(e.node, l.strip[i]));
    if (l.cantTell) at(this.cantTellCard, l.cantTell);
    this.choiceCards.forEach((c, i) => at(c.node, l.shelf[i]));
    const s = l.shelf[0];
    const last = l.shelf[l.shelf.length - 1];
    this.shelfBoard
      .clear()
      .roundRect(s.x - 24, s.y - 14, last.x + last.w - s.x + 48, s.h + 28, 26)
      .fill({ color: wood.light, alpha: 0.85 })
      .stroke({ width: 5, color: wood.line });
  }

  /** The parcel on the counter. */
  get hidden(): ToyId {
    return this.round.parcels[this.parcelIndex];
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.glowOn || this.finished) return;
    if (this.tellLevel) {
      if (this.busy) return;
      const t =
        this.answer === tellTarget(this.round.shelf, this.record, this.stage)
          ? null
          : tellTarget(this.round.shelf, this.record, this.stage);
      const w = 7 + Math.sin(this.clock * 5);
      const node =
        t === null
          ? this.checkBtn
          : t === 'cant-tell'
            ? this.cantTellCard
            : t === 'view' || t === 'sound'
              ? this.choiceCards.find((c) => c.ch === t)!.node
              : this.cards.find((c) => c.id === t)!.node;
      if (node === this.checkBtn)
        this.glow.circle(node.x, node.y, 98).stroke({ width: w, color: swatch.yellow.fill });
      else if (node === this.cantTellCard)
        this.glow
          .roundRect(node.x - 98, node.y - 98, 196, 196, 30)
          .stroke({ width: w, color: swatch.yellow.fill });
      else
        this.glow
          .roundRect(node.x - 112, node.y - 122, 224, 244, 30)
          .stroke({ width: w, color: swatch.yellow.fill });
      return;
    }
    if (this.setLevel) {
      if (this.busy) return;
      const e = hintEdit(this.round.shelf, this.record, this.chosen);
      const w = 7 + Math.sin(this.clock * 5);
      if ('check' in e)
        this.glow
          .circle(this.checkBtn.x, this.checkBtn.y, 98)
          .stroke({ width: w, color: swatch.yellow.fill });
      else {
        const c = this.cards.find((x) => x.id === ('remove' in e ? e.remove : e.add))!;
        // Taking a toy out glows with a small shake; putting one in glows still.
        const dx = 'remove' in e ? Math.sin(this.clock * 18) * 4 : 0;
        this.glow
          .roundRect(c.node.x - 112 + dx, c.node.y - 122, 224, 244, 30)
          .stroke({ width: w, color: swatch.yellow.fill });
      }
      return;
    }
    const left = possible(this.round.shelf, this.record);
    if (left.length !== 1) return;
    const c = this.cards.find((x) => x.id === left[0]);
    if (c)
      this.glow
        .roundRect(c.node.x - 112, c.node.y - 122, 224, 244, 30)
        .stroke({ width: 7 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private async begin() {
    this.busy = true;
    await this.ctx.instruct(this.instructId);
    this.busy = false;
  }

  private evidenceCard(obs: Observation): Container {
    const n = new Container();
    n.addChild(cardBack(140, 140));
    if (obs.channel === 'view') n.addChild(outlineArt(obs.value as 'round' | 'handled', 90));
    else {
      const art = soundArt(obs.value as SoundValue, 96);
      art.y = -8;
      const spk = new Graphics().poly([-8, -5, 0, -5, 8, -12, 8, 12, 0, 5, -8, 5]).fill(swatch.blue.line);
      spk.position.set(40, 48);
      n.addChild(art, spk);
    }
    n.hitArea = new Rectangle(-70, -70, 140, 140);
    onTap(
      n,
      () => {
        if (obs.channel === 'sound') playSound(obs.value as SoundValue);
        else sfx.pop(2);
        void this.squish(n);
      },
      { cooldown: 250 },
    );
    return n;
  }

  /** Look or Listen: reveals the hidden toy's observation. Replays never cost anything. */
  private async investigate(channel: Channel) {
    if (this.busy || this.finished) return;
    // Level 4's ear is what the waiting `instruct-narrow` asks for, so it needs no instruction.
    if (channel === 'sound') this.dropAsk();
    const obs = observe(this.hidden, channel);
    if (channel === 'sound') {
      void this.shakeParcel();
      playSound(obs.value as SoundValue);
    } else {
      sfx.pop(3);
      const peep = new Graphics().circle(0, 0, 36).fill(0xffffff);
      peep.position.set(this.parcel.x, this.parcel.y - 30);
      peep.eventMode = 'none';
      this.ctx.stage.addChild(peep);
      void this.ctx.tw.to(peep, { alpha: 0 }, { duration: 0.5 }).then(() => peep.destroy());
    }
    const have = this.record.findIndex((o) => o.channel === channel);
    if (have >= 0) {
      void this.squish(this.evidence[have].node);
      return;
    }
    await this.addClue(obs);
  }

  /** Files a new observation and drops its card into the strip (also level 5's reveal, which runs while busy). */
  private async addClue(obs: Observation) {
    this.record.push(obs);
    const node = this.evidenceCard(obs);
    this.stripLayer.addChild(node);
    this.evidence.push({ obs, node });
    this.layout();
    const l = this.exhibit().strip[this.evidence.length - 1];
    node.scale.set(0.2);
    node.y = l.y - 120;
    await this.ctx.tw.to(node, { y: l.y + l.h / 2 }, { duration: 0.35, ease: ease.outBack });
    node.scale.set(1);
  }

  private async shakeParcel() {
    for (const r of [0.06, -0.06, 0.04, -0.04, 0])
      await this.ctx.tw.to(this.parcel, { rotation: r }, { duration: 0.07 });
  }

  /** Selecting is free: the card rings and the toy plays its own sound with its picture. */
  private async pick(id: ToyId) {
    if (this.busy || this.finished) return;
    if (this.setLevel) return this.toggle(id);
    if (this.tellLevel) {
      if (this.stage !== 'answer') return;
      this.answer = id;
      this.cantTellRing.visible = false;
    }
    this.selected = id;
    for (const c of this.cards) c.ring.visible = c.id === id;
    playSound(TOYS[id].sound);
    const card = this.cards.find((c) => c.id === id)!;
    void this.squish(card.node);
    const pic = soundArt(TOYS[id].sound, 60);
    pic.position.set(52, 78);
    pic.eventMode = 'none';
    card.node.addChild(pic);
    await this.ctx.tw.to(pic, { alpha: 0 }, { duration: 1.2 });
    if (!pic.destroyed) pic.destroy();
  }

  /** Levels 3-4: a tap adds a toy (it plays its sound with its picture); tapping it again puts it back, silently. */
  private async toggle(id: ToyId) {
    const card = this.cards.find((c) => c.id === id)!;
    void this.squish(card.node);
    if (this.chosen.includes(id)) {
      this.chosen = this.chosen.filter((t) => t !== id);
      card.ring.visible = false;
      return;
    }
    this.chosen.push(id);
    card.ring.visible = true;
    playSound(TOYS[id].sound);
    const pic = soundArt(TOYS[id].sound, 60);
    pic.position.set(52, 78);
    pic.eventMode = 'none';
    card.node.addChild(pic);
    await this.ctx.tw.to(pic, { alpha: 0 }, { duration: 1.2 });
    if (!pic.destroyed) pic.destroy();
  }

  /** Level 5: choosing *Can't tell yet* or a sense card is free; each says its name, so nothing needs reading. */
  private async choose(a: 'cant-tell' | Channel) {
    if (this.busy || this.finished) return;
    if ((a === 'cant-tell') !== (this.stage === 'answer')) return;
    this.answer = a;
    for (const c of this.cards) c.ring.visible = false;
    this.cantTellRing.visible = a === 'cant-tell';
    for (const c of this.choiceCards) c.ring.visible = c.ch === a;
    sfx.pop(3);
    void this.squish(a === 'cant-tell' ? this.cantTellCard : this.choiceCards.find((c) => c.ch === a)!.node);
    // A first choice before the question is heard says the question in place of the card's name.
    if (this.askNow()) return;
    await this.ctx.say(
      a === 'cant-tell' ? 'sense.card.cant-tell' : a === 'view' ? 'sense.card.look' : 'sense.card.listen',
    );
  }

  private clearAnswer() {
    this.answer = null;
    for (const c of this.cards) c.ring.visible = false;
    this.cantTellRing.visible = false;
    for (const c of this.choiceCards) c.ring.visible = false;
  }

  /** Level 5: stage B's cards replace the toy cards on the shelf, or the toy cards come back. */
  private showChoices(on: boolean) {
    for (const c of this.cards) {
      c.node.visible = !on;
      c.node.eventMode = on ? 'none' : 'static';
    }
    for (const c of this.choiceCards) {
      c.node.visible = on;
      c.node.eventMode = on ? 'static' : 'none';
    }
    this.cantTellCard.visible = !on;
    this.cantTellCard.eventMode = on ? 'none' : 'static';
  }

  /** Level 5: the green tick asks whether the look can tell (stage A), then which sense would (stage B). */
  private async pressTell() {
    if (this.stage === 'sense') return this.pressSense();
    const v = checkTell(this.round.shelf, this.record, this.answer as TellAnswer | null);
    if (v.kind === 'empty') {
      void this.ctx.instruct(this.instructId);
      return;
    }
    if (v.kind === 'right') return void this.parcelFound([v.toy]);
    this.busy = true;
    if (v.kind === 'look-first') {
      sfx.pop(2);
      void this.bob(this.lookBtn);
      await this.ctx.say('sense.say', { text: "Let's look first." });
    } else if (v.kind === 'both-fit') {
      // Free: the other fitting toy's badge pulses.
      sfx.pop(2);
      void this.bob(this.cards.find((c) => c.id === v.other)!.badge);
      await this.ctx.say('sense.both-fit', {
        name: TOY_NAMES[this.answer as ToyId],
        other: TOY_NAMES[v.other],
      });
    } else if (v.kind === 'cant-tell') {
      sfx.pop(4);
      // The line starts and stage B's cards open at once (U7 R4); its question waits for the line, the guide or her first tap.
      const said = this.ctx.say('sense.cant-tell-right');
      this.stage = 'sense';
      // Stage B starts unhelped; a hint earned in stage A has already counted.
      this.glowOn = false;
      this.clearAnswer();
      this.showChoices(true);
      for (const c of this.choiceCards) {
        c.node.scale.set(0.2);
        void this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      }
      this.instructId = 'sense.what-would';
      this.waitAsk(said, this.pair(v.left));
    } else {
      const glow = this.tally.miss(setKey(this.parcelIndex, 0, [this.answer as string], this.record));
      this.sync();
      sfx.boing();
      const ev = this.evidence.find((e) => e.obs.channel === v.obs.channel);
      if (ev) void this.bob(ev.node);
      const node = v.kind === 'miss' ? this.cards.find((c) => c.id === v.card)!.node : this.cantTellCard;
      this.clearAnswer();
      for (const r of [0.25, -0.15, 0]) await this.ctx.tw.to(node, { rotation: r }, { duration: 0.1 });
      if (!this.alive) return;
      const text = v.kind === 'miss' ? this.reason(v.card, v.obs) : null;
      if (text) await this.ctx.say('sense.say', { text });
      else if (v.kind === 'can-tell')
        await this.ctx.say('sense.can-tell', {
          seen: SEEN[v.obs.value as 'round' | 'handled'],
          name: TOY_NAMES[v.only],
        });
      if (glow) this.glowOn = true;
    }
    if (this.alive) this.busy = false;
  }

  /** Level 5, stage B: the ear is right and reveals the parcel; the eye is a miss. */
  private async pressSense() {
    const choice = this.answer as Channel | null;
    const v = checkSense(this.round.shelf, this.record, choice);
    if (v === 'empty') {
      void this.ctx.instruct(this.instructId, this.pair(possible(this.round.shelf, this.record)));
      return;
    }
    this.busy = true;
    if (v === 'miss') {
      const glow = this.tally.miss(setKey(this.parcelIndex, 1, [choice!], this.record));
      this.sync();
      sfx.boing();
      const node = this.choiceCards.find((c) => c.ch === choice)!.node;
      this.clearAnswer();
      for (const r of [0.25, -0.15, 0]) await this.ctx.tw.to(node, { rotation: r }, { duration: 0.1 });
      if (!this.alive) return;
      await this.ctx.say('sense.look-cant', this.pair(possible(this.round.shelf, this.record)));
      if (glow) this.glowOn = true;
      if (this.alive) this.busy = false;
      return;
    }
    // The reveal, not another task: the quilt slides off, the parcel plays its sound, and the toy that still fits glows.
    this.glowOn = false;
    sfx.pop(5);
    await this.ctx.say('sense.listen-would');
    if (!this.alive) return;
    await this.ctx.tw.to(this.quilt, { x: 320, alpha: 0 }, { duration: 0.45, ease: ease.inOutSine });
    if (!this.alive) return;
    const obs = observe(this.hidden, 'sound');
    void this.shakeParcel();
    playSound(obs.value as SoundValue);
    this.clearAnswer();
    this.showChoices(false);
    await this.addClue(obs);
    if (!this.alive) return;
    const left = possible(this.round.shelf, this.record);
    const card = this.cards.find((c) => c.id === left[0])!;
    card.ring.visible = true;
    await this.bob(card.node);
    if (!this.alive) return;
    void this.parcelFound(left);
  }

  /** The instruction waits behind `said`, said when it ends unless something said it or dropped it first. */
  private waitAsk(said: Promise<void>, vars?: Record<string, string>) {
    this.dropAsk();
    this.unasked = true;
    this.askVars = vars;
    const gen = this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** Says the waiting instruction, if there is one. */
  private askNow() {
    if (!this.unasked || this.finished || !this.alive) return false;
    const vars = this.askVars;
    this.dropAsk();
    void this.ctx.instruct(this.instructId, vars);
    return true;
  }

  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }

  /** The guide was tapped while the next instruction waits behind a right step's line: say it. */
  sayWaitingAsk() {
    return this.askNow();
  }

  private sync() {
    this.misses = this.tally.misses;
    this.hints = this.tally.hints;
  }

  /** Two names from the possible set, in shelf order. */
  private pair(left: readonly ToyId[]) {
    return { a: TOY_NAMES[left[0]], b: TOY_NAMES[left[1]] };
  }

  /** Levels 3-4: the green tick judges the whole selection against what the clues allow. */
  private async pressSet() {
    const narrowing = narrowingFor(this.round, this.record);
    const v = checkSet(this.round.shelf, this.record, this.chosen, narrowing);
    if (v.kind === 'right') return void this.parcelFound(v.left);
    if (v.kind === 'empty') {
      void this.ctx.instruct(this.instructId);
      return;
    }
    this.busy = true;
    if (v.kind === 'look-first') {
      sfx.pop(2);
      void this.bob(this.lookBtn);
      await this.ctx.say('sense.say', { text: "Let's look first." });
    } else if (v.kind === 'one-more') {
      sfx.pop(2);
      this.oneMores++;
      for (const e of this.evidence) void this.bob(e.node);
      // The second one more also pulses the badges that match the clue; it never names the missing toy.
      if (this.oneMores >= 2)
        for (const c of this.cards) if (possible([c.id], this.record).length) void this.bob(c.badge);
      await this.ctx.say('sense.one-more');
    } else if (v.kind === 'so-far' && this.listenOpen) {
      // Still right so far, but the ear has not been tapped yet.
      sfx.pop(2);
      void this.bob(this.listenBtn);
      await this.ctx.instruct(this.instructId);
    } else if (v.kind === 'so-far') {
      sfx.pop(4);
      this.listenOpen = true;
      this.listenBtn.visible = true;
      this.listenBtn.scale.set(0.2);
      void this.ctx.tw
        .to(this.listenBtn.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack })
        .then(() => this.bob(this.listenBtn));
      // The set plays over her next tap (U7 R4); `instruct-narrow` waits for the line, the guide or her first tap.
      this.instructId = 'sense.instruct-narrow';
      this.waitAsk(this.ctx.say('sense.so-far', this.pair(v.left)));
    } else {
      const glow = this.tally.miss(setKey(this.parcelIndex, narrowing ? 0 : 1, this.chosen, this.record));
      this.sync();
      sfx.boing();
      const ev = this.evidence.find((e) => e.obs.channel === v.obs.channel);
      if (ev) void this.bob(ev.node);
      const wrong = this.cards.filter((c) => v.ruledOut.includes(c.id));
      this.chosen = this.chosen.filter((t) => !v.ruledOut.includes(t));
      for (const c of wrong) c.ring.visible = false;
      await Promise.all(
        wrong.map(async (c) => {
          for (const r of [0.25, -0.15, 0]) await this.ctx.tw.to(c.node, { rotation: r }, { duration: 0.1 });
        }),
      );
      if (!this.alive) return;
      await this.ctx.say('sense.say', { text: this.reason(v.first, v.obs) });
      if (glow) this.glowOn = true;
    }
    if (this.alive) this.busy = false;
  }

  /** Levels 3-4: the set was right, so the parcel opens; the round finishes after the last parcel. */
  private async parcelFound(left: ToyId[]) {
    this.busy = true;
    this.glowOn = false;
    const id = this.hidden;
    const last = this.parcelIndex >= this.round.parcels.length - 1;
    if (last) this.finished = true;
    if (left.length > 1) await this.ctx.say('sense.could-be', this.pair(left));
    if (!this.alive) return;
    const card = this.cards.find((c) => c.id === id)!;
    sfx.pop(5);
    const home = { x: this.parcel.x, y: this.parcel.y };
    await this.ctx.tw.to(this.parcel, { alpha: 0, y: home.y + 30 }, { duration: 0.35 });
    if (!this.alive) return;
    const toy = toyArt(id, 150);
    toy.position.set(home.x, home.y);
    toy.scale.set(0.1);
    toy.eventMode = 'none';
    this.ctx.stage.addChild(toy);
    await this.ctx.tw.to(toy.scale, { x: 1.07, y: 1.07 }, { duration: 0.3, ease: ease.outBack });
    if (!this.alive) return;
    playSound(TOYS[id].sound);
    this.ctx.particles.burst(toy.x, toy.y, {
      colors: [swatch.yellow.fill, swatch.white.fill, swatch.pink.fill],
      count: 12,
      speed: [80, 180],
      gravity: 200,
      size: [0.2, 0.4],
    });
    await this.ctx.tw.to(
      toy,
      { x: card.node.x, y: card.node.y - 20 },
      { duration: 0.5, ease: ease.inOutSine },
    );
    if (!this.alive) return;
    sfx.tada();
    await this.ctx.say('sense.it-was', { name: TOY_NAMES[id] });
    if (!this.alive) return;
    if (last) {
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    // The next parcel: the clues and the selection clear, the shelf stays.
    await this.ctx.tw.to(toy, { alpha: 0 }, { duration: 0.3 });
    if (!this.alive) return;
    toy.destroy({ children: true });
    this.clearClues();
    this.parcelIndex++;
    this.tally.nextParcel();
    this.oneMores = 0;
    this.parcel.position.set(this.view.w + 200, home.y);
    this.parcel.alpha = 1;
    if (this.tellLevel) this.resetTell();
    sfx.pop(3);
    await this.ctx.tw.to(this.parcel, { x: home.x }, { duration: 0.5, ease: ease.outBack });
    if (!this.alive) return;
    await this.ctx.say('sense.next-parcel');
    if (!this.alive) return;
    this.instructId = this.tellLevel ? 'sense.instruct-tell' : 'sense.instruct-all';
    await this.ctx.instruct(this.instructId);
    if (this.alive) this.busy = false;
  }

  /** Level 5: a fresh parcel's quilt and stage A. */
  private resetTell() {
    this.stage = 'answer';
    this.clearAnswer();
    this.showChoices(false);
    this.quilt.position.set(0, 0);
    this.quilt.alpha = 1;
    this.instructId = 'sense.instruct-tell';
  }

  private clearClues() {
    this.record.length = 0;
    for (const e of this.evidence.splice(0)) e.node.destroy({ children: true });
    this.chosen = [];
    this.selected = null;
    this.glowOn = false;
    for (const c of this.cards) c.ring.visible = false;
  }

  private reason(card: ToyId, obs: Observation): string {
    const name = TOY_NAMES[card];
    if (obs.channel === 'view') {
      const has = TOYS[card].view === 'handled' ? 'has a handle' : 'has no handle';
      return `The peephole shows ${SEEN[obs.value as 'round' | 'handled']}. The ${name} ${has}.`;
    }
    return `We heard ${HEARD[obs.value as SoundValue]}. The ${name} ${ITS[TOYS[card].sound]}.`;
  }

  private async press() {
    if (this.busy || this.finished) return;
    // The tick before the instruction is heard says it and is not judged (never a miss).
    if (this.askNow()) return;
    if (this.setLevel) return this.pressSet();
    if (this.tellLevel) return this.pressTell();
    if (!this.selected) {
      void this.ctx.say('sense.say', { text: 'Tap a toy on the shelf, then press the green tick.' });
      return;
    }
    const card = this.selected;
    const verdict = check(this.round.shelf, this.record, card);
    if (verdict.kind === 'found') return void this.found();
    this.busy = true;
    const node = this.cards.find((c) => c.id === card)!.node;
    if (verdict.kind === 'notyet') {
      sfx.pop(2);
      this.notYets++;
      const text =
        this.record.length === 0
          ? "Let's look first."
          : `That one might be it, but so might the ${TOY_NAMES[verdict.other!]}. How else could we find out?`;
      const unused = this.round.channels.find((c) => !this.record.some((o) => o.channel === c)) ?? 'view';
      void this.bob(unused === 'view' ? this.lookBtn : this.listenBtn);
      await this.ctx.say('sense.say', { text });
      this.busy = false;
      return;
    }
    const key = `${card}|${this.record.length}`;
    if (countsAsMiss(this.lastKey, key)) this.misses++;
    this.lastKey = key;
    sfx.boing();
    const ev = this.evidence.find((e) => e.obs.channel === verdict.ruledOut.channel);
    if (ev) void this.bob(ev.node);
    for (const r of [0.1, -0.1, 0]) await this.ctx.tw.to(node, { rotation: r }, { duration: 0.08 });
    await this.ctx.say('sense.say', { text: this.reason(card, verdict.ruledOut) });
    if (!this.alive) return;
    if (this.misses >= GLOW_AFTER) this.addHint();
    this.busy = false;
  }

  private addHint() {
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    this.glowOn = true;
  }

  /** The pause sheet's Show a hint: run the deciding investigation first if it has not been made, then glow the possible card. */
  askForHint() {
    if (this.busy || this.finished) return;
    // A waiting instruction is said first; the hint's glow follows as before.
    this.askNow();
    if (this.tellLevel) {
      // Look first if she has not, then glow the answer this stage needs; once per parcel, then the instruction again.
      if (this.tally.hinted) {
        void this.ctx.instruct(
          this.instructId,
          this.stage === 'sense' ? this.pair(possible(this.round.shelf, this.record)) : undefined,
        );
        return;
      }
      this.tally.hint();
      this.sync();
      this.glowOn = true;
      if (!this.record.some((o) => o.channel === 'view')) void this.investigate('view');
      return;
    }
    if (this.setLevel) {
      // Run the investigation this stage needs, then glow the useful edit; once per parcel, then the instruction again.
      if (this.tally.hinted) {
        void this.ctx.instruct(this.instructId);
        return;
      }
      this.tally.hint();
      this.sync();
      this.glowOn = true;
      if (!this.record.some((o) => o.channel === 'view')) void this.investigate('view');
      else if (this.listenOpen && !this.record.some((o) => o.channel === 'sound'))
        void this.investigate('sound');
      return;
    }
    if (this.hinted) {
      void this.ctx.instruct(this.round.level === 1 ? 'sense.instruct-look' : 'sense.instruct-choose');
      return;
    }
    const ch = deciding(this.round, this.record);
    this.addHint();
    if (ch) void this.investigate(ch);
  }

  /** Start again: the same seeded round with the clues cleared; misses and hints keep counting. */
  restart() {
    if (this.finished) return;
    this.dropAsk();
    if (this.setLevel || this.tellLevel) {
      if (this.busy) return;
      this.clearClues();
      if (this.tellLevel) this.resetTell();
      this.parcelIndex = 0;
      this.tally.nextParcel();
      this.oneMores = 0;
      this.listenOpen = false;
      if (this.round.channels.includes('sound')) this.listenBtn.visible = false;
      if (this.setLevel)
        this.instructId = this.round.parcels.length > 1 ? 'sense.two-parcels' : 'sense.instruct-all';
      return;
    }
    this.record.length = 0;
    for (const e of this.evidence.splice(0)) e.node.destroy({ children: true });
    this.selected = null;
    this.lastKey = null;
    this.glowOn = false;
    this.notYets = 0;
    for (const c of this.cards) c.ring.visible = false;
  }

  private async found() {
    this.finished = true;
    this.busy = true;
    this.glowOn = false;
    const id = this.selected!;
    const card = this.cards.find((c) => c.id === id)!;
    sfx.pop(5);
    await this.ctx.tw.to(this.parcel, { alpha: 0, y: this.parcel.y + 30 }, { duration: 0.35 });
    if (!this.alive) return;
    const toy = toyArt(id, 150);
    toy.position.set(this.parcel.x, this.parcel.y);
    toy.scale.set(0.1);
    this.ctx.stage.addChild(toy);
    await this.ctx.tw.to(toy.scale, { x: 1.07, y: 1.07 }, { duration: 0.3, ease: ease.outBack });
    if (!this.alive) return;
    playSound(TOYS[id].sound);
    this.ctx.particles.burst(toy.x, toy.y, {
      colors: [swatch.yellow.fill, swatch.white.fill, swatch.pink.fill],
      count: 12,
      speed: [80, 180],
      gravity: 200,
      size: [0.2, 0.4],
    });
    await this.ctx.tw.to(
      toy,
      { x: card.node.x, y: card.node.y - 20 },
      { duration: 0.5, ease: ease.inOutSine },
    );
    if (!this.alive) return;
    sfx.tada();
    await this.ctx.say('sense.say', { text: `It's the ${TOY_NAMES[id]}!` });
    if (!this.alive) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The ghost finger: look first, listen when the look is not enough, taste the choices, then pick the possible toy and press the tick. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked) return null;
    if (this.tellLevel) {
      const m = tellTouch(this.round, this.record, this.stage, this.answer);
      if ('investigate' in m) return { tap: { on: this.lookBtn } };
      if ('check' in m) return { tap: { on: this.checkBtn } };
      const t = m.choose;
      const on =
        t === 'cant-tell'
          ? this.cantTellCard
          : t === 'view' || t === 'sound'
            ? this.choiceCards.find((c) => c.ch === t)!.node
            : this.cards.find((c) => c.id === t)!.node;
      return { tap: { on } };
    }
    if (this.setLevel) {
      const m = setTouch(this.round, this.record, this.chosen, this.listenOpen);
      if ('investigate' in m)
        return { tap: { on: m.investigate === 'view' ? this.lookBtn : this.listenBtn } };
      if ('toggle' in m) return { tap: { on: this.cards.find((c) => c.id === m.toggle)!.node } };
      return { tap: { on: this.checkBtn } };
    }
    const m = senseTouch(this.round, this.record, this.selected);
    if ('investigate' in m) return { tap: { on: m.investigate === 'view' ? this.lookBtn : this.listenBtn } };
    if ('select' in m) return { tap: { on: this.cards.find((c) => c.id === m.select)!.node } };
    return { tap: { on: this.checkBtn } };
  }
}

class SenseIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(parcelArt());
    const eye = lookButtonArt();
    eye.scale.set(0.5);
    eye.position.set(-70, 20);
    const ear = listenButtonArt();
    ear.scale.set(0.5);
    ear.position.set(70, 20);
    c.scale.set(0.8);
    c.addChild(eye, ear);
    super(c);
  }
}

/** A seeded toy on a museum label. */
function sticker(seed: number): Container {
  const id = new Rng(seed).shuffle([...TOY_IDS])[0];
  const c = new Container();
  const label2 = new Graphics()
    .roundRect(-90, 20, 180, 56, 14)
    .fill(cream)
    .stroke({ width: 4, color: wood.line });
  const toy = toyArt(id, 150);
  toy.y = -20;
  c.addChild(label2, toy);
  return c;
}

export const senseDetective: GameModule = {
  id: 'sense-detective',
  name: 'Sense Detective',
  titleLine: 'game.sense-detective',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['observation', 'evidence', 'senses', 'comparing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: silenced(STYLES.quiet),
  coplayHint:
    'Ask what could it be so far? before she presses the tick, or take the Look button while she takes Listen. With three toys, ask which toys could it still be, or hold up fingers for how many still fit.',
  offScreen: 'Put a toy in a bag and let her guess it by shaking, then by peeking.',
  hubIcon: () => new SenseIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SenseDetective(ctx),
};
