import { Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { swatch } from '../../art/palette';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { VoicePreset } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  backdropArt,
  bowArt,
  bubbleArt,
  cardArt,
  curtainArt,
  endArt,
  frontRowArt,
  iconArt,
  peekArt,
  placeArt,
  prosceniumArt,
  puppetArt,
  stickerArt,
  tasselArt,
  type CardArt,
  type PuppetArt,
} from './art';
import {
  answer,
  askLine,
  askedPuppet,
  BASE_VOICE,
  CURTAIN_W,
  describeLevel,
  freeMark,
  hintTarget,
  judge,
  layout,
  LEVELS,
  nearestParked,
  NOTE,
  placeAt,
  plan,
  PUPPET_H,
  PUPPETS,
  reactions,
  standAt,
  stickerPuppet,
  storyHint,
  storyMove,
  SURPRISED,
  WAY_LOOK,
  WAY_VOICE,
  WAYS,
  type Ask,
  type Layout,
  type Place,
  type Plan,
  type Puppet,
  type Way,
  type Where,
} from './logic';

interface Spoken {
  id: LineId;
  pitch: number;
  rate: number;
}

/**
 * Puppet Stage: a stick puppet rises where she touches the floor, says hello in its own voice and follows her finger (level 1);
 * the pet names a puppet, or the tiny or big voice, and she makes that one talk (level 2); one puppet holds a line and she
 * chooses the sleepy, tiny or big way to say it (level 3). At levels 4–6 she acts story cards: brings a puppet up from its
 * peek, walks it to the painted place on the card and bobs it there, in card order, for a front row that reacts only to
 * what she showed (level 6's The end judges an early stop). Puppet lines go through `ctx.sayIn` (device speech with a
 * preset); the pet's asks and card readings keep its own voice. Nothing is kept; the show is gone at the bow.
 */
class PuppetStage implements Game {
  readonly plan: Plan;
  private l: Layout;
  private clock = 0;
  pops = 0;
  misses = 0;
  hints = 0;
  askIndex = 0;
  private askMisses = 0;
  private hinted = false;
  glow: Puppet | Way | null = null;
  busy = false;
  finished = false;
  freeTried = false;
  /** Level 3: the free first try is playing and no ask has been said yet, so another bubble is another free try (U7 R4). */
  freeTrying = false;
  private freeTry = 0;
  /** Each puppet's latest line, so a line cut by that puppet's next one leaves its mouth to the new line. */
  private readonly speakSeq = new Map<Puppet, number>();
  private waySeq = 0;
  bowShown = false;
  curtainsClosed = false;
  night = false;
  /** Risen puppets, oldest first. */
  standing: Puppet[] = [];
  parked: Puppet[] = [];
  /** The last lines spoken in a puppet voice, for a scripted play to read (device speech is silent in checks). */
  spoken: Spoken[] = [];
  readonly puppetNodes = new Map<Puppet, Container>();
  readonly bubbleNodes = new Map<Way, Container>();
  readonly bowNode = bowArt();
  readonly tasselNode = tasselArt();
  readonly floorSurface = new Container();
  /** Each holds its drawn curtain; the container carries the tap and the closing scale. */
  readonly curtainNodes: [Container, Container];
  private readonly arts = new Map<Puppet, PuppetArt>();
  private readonly drags = new Map<Puppet, DragHandle>();
  private readonly talks = new Map<Puppet, number>();
  private readonly puppetLayer = new Container();
  private readonly puppetMask = new Graphics();
  private readonly glowRing = new Graphics();
  private readonly frontRow = frontRowArt();
  private day: Graphics;
  private nightBackdrop: Graphics;
  private proscenium: Graphics;
  /** The finger that raised a puppet and still holds it. */
  private following: { id: number; puppet: Puppet; pickX: number; x: number } | null = null;
  private dragged = false;
  private readonly reduce: boolean;
  private readonly onWindowUp = (e: PointerEvent) => this.release(e.pointerId);
  // ---- levels 4–6 ----
  /** Scenes acted, in card order. */
  done = 0;
  /** Where each standing cast puppet stands: a place and which of its two marks, or nowhere in particular. */
  private readonly at = new Map<Puppet, { place: 0 | 1; mark: 0 | 1 } | null>();
  storyGlow: { puppet: Puppet; place: Place } | null = null;
  private sceneFree = 0;
  private sceneEarly = 0;
  private sceneHinted = false;
  private roundHinted = false;
  earlyEnds = 0;
  ended = false;
  endShown = false;
  readonly peekNodes: Container[] = [];
  private readonly peekHeads: Critter[] = [];
  readonly cardNodes: CardArt[] = [];
  readonly endNode = endArt();
  private readonly placeNodes: Graphics[] = [];
  private readonly placeGlow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = plan(ctx.level, ctx.band, ctx.rng);
    this.reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.l = layout(this.plan.level, ctx.view);
    const { stage } = this.l;
    this.day = backdropArt(stage.right - stage.left, stage.floor - stage.top, false);
    this.nightBackdrop = backdropArt(stage.right - stage.left, stage.floor - stage.top, true);
    this.nightBackdrop.alpha = 0;
    this.proscenium = prosceniumArt(stage.left, stage.right, stage.top, stage.floor, stage.bottom);
    this.curtainNodes = [new Container(), new Container()];
    this.puppetLayer.mask = this.puppetMask;
    this.glowRing.eventMode = 'none';
    this.puppetMask.eventMode = 'none';
    for (const kind of PUPPETS) {
      const art = puppetArt(kind);
      this.arts.set(kind, art);
      this.puppetNodes.set(kind, art.node);
      this.talks.set(kind, 0);
      art.node.eventMode = 'none';
      ctx.track(art.critter);
      if (this.plan.level === 1) this.makeDraggable(kind, art.node);
      else if (this.story) this.makeStoryDraggable(kind, art.node);
      else onTap(art.node, () => this.tapPuppet(kind), { cooldown: 150 });
      this.puppetLayer.addChild(art.node);
    }
    this.parked = PUPPETS.slice();
    if (this.plan.level === 1) {
      onTap(this.floorSurface, (e) => this.touchFloor(e));
      this.floorSurface.on('globalpointermove', (e: FederatedPointerEvent) => this.follow(e));
      // The ghost finger lifts on the floor itself, never on the window; a real finger may lift on either (release is idempotent).
      const lift = (e: FederatedPointerEvent) => this.release(e.pointerId);
      this.floorSurface.on('pointerup', lift);
      this.floorSurface.on('pointerupoutside', lift);
      this.ctx.listen(window, 'pointerup', this.onWindowUp);
      this.ctx.listen(window, 'pointercancel', this.onWindowUp);
    } else this.floorSurface.eventMode = 'none';
    const story = this.plan.story;
    if (story) {
      story.cast.forEach((p, i) => {
        const peek = peekArt(p);
        onTap(peek.node, (e) => this.touchPeek(i as 0 | 1, e), { cooldown: 150 });
        peek.node.on('globalpointermove', (e: FederatedPointerEvent) => this.follow(e));
        const lift = (e: FederatedPointerEvent) => this.release(e.pointerId);
        peek.node.on('pointerup', lift);
        peek.node.on('pointerupoutside', lift);
        this.peekNodes.push(peek.node);
        this.peekHeads.push(peek.head);
        ctx.track(peek.head);
      });
      this.ctx.listen(window, 'pointerup', this.onWindowUp);
      this.ctx.listen(window, 'pointercancel', this.onWindowUp);
      this.plan.scenes.forEach((sc, i) => {
        const card = cardArt(sc, i);
        onTap(card.node, () => this.tapCard(i), { cooldown: 400 });
        this.cardNodes.push(card);
      });
      for (const place of story.places) this.placeNodes.push(placeArt(place));
      onTap(this.endNode, () => void this.theEnd(), { cooldown: 600 });
      this.placeGlow.eventMode = 'none';
    }
    this.endNode.visible = false;
    for (const c of this.curtainNodes) onTap(c, () => this.toggleCurtains(), { cooldown: 500 });
    onTap(this.tasselNode, () => this.pullTassel(), { cooldown: 500 });
    onTap(this.bowNode, () => this.bow(), { cooldown: 500 });
    this.bowNode.visible = false;
    if (this.plan.level === 3) {
      for (const way of WAYS) {
        const b = bubbleArt(way, this.plan.puppets[0]);
        onTap(b, () => this.tapBubble(way), { cooldown: 150 });
        this.bubbleNodes.set(way, b);
      }
    }
    ctx.stage.addChild(
      this.day,
      this.nightBackdrop,
      ...this.placeNodes,
      this.placeGlow,
      this.floorSurface,
      this.proscenium,
      ...this.peekNodes,
      this.puppetMask,
      this.puppetLayer,
      ...this.curtainNodes,
      this.tasselNode,
      ...this.cardNodes.map((c) => c.node),
      this.frontRow.node,
      ...this.bubbleNodes.values(),
      this.endNode,
      this.bowNode,
      this.glowRing,
    );
    this.resize(ctx.view);
  }

  get layoutNow(): Layout {
    return this.l;
  }

  private get story() {
    return this.plan.story;
  }

  get ask(): Ask | null {
    return this.askIndex < this.plan.asks.length ? this.plan.asks[this.askIndex] : null;
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      puppets: this.plan.puppets.slice(),
      standing: this.standing.slice(),
      parked: this.parked.slice(),
      pops: this.pops,
      bowShown: this.bowShown,
      askIndex: this.askIndex,
      ask: this.ask,
      asks: this.plan.asks.slice(),
      line: this.plan.line,
      misses: this.misses,
      hints: this.hints,
      glow: this.glow,
      busy: this.busy,
      finished: this.finished,
      freeTried: this.freeTried,
      freeTrying: this.freeTrying,
      curtainsClosed: this.curtainsClosed,
      night: this.night,
      spoken: this.spoken.slice(),
      story: this.story?.id ?? null,
      mirror: this.plan.mirror,
      scenes: this.plan.scenes.length,
      done: this.done,
      ticked: this.plan.scenes.map((_, i) => i < this.done),
      ended: this.ended,
      endShown: this.endShown,
      earlyEnds: this.earlyEnds,
      storyGlow: this.storyGlow,
      where: Object.fromEntries((this.story?.cast ?? []).map((p) => [p, this.where(p)])) as Record<
        string,
        Where
      >,
    };
  }

  start() {
    if (this.plan.level === 1) {
      void this.ctx.instruct('ps.instruct.1');
      return;
    }
    if (this.story) {
      void this.storyOpening();
      return;
    }
    void this.opening();
  }

  /** Levels 2–3: the cast rises and says hello, then the first instruction. */
  private async opening() {
    this.busy = true;
    const { spots } = this.l;
    for (const [i, p] of this.plan.puppets.entries()) {
      this.rise(p, spots[i]);
      await this.speakAs(p, `ps.hello.${p}`);
      if (this.finished) return;
    }
    if (this.plan.level === 2) {
      await this.ctx.instruct('ps.instruct.2');
      if (this.finished) return;
      void this.askNext(0);
      return;
    }
    await this.ctx.instruct('ps.instruct.3');
    if (this.finished) return;
    await this.speakAs(this.plan.puppets[0], this.plan.line!);
    if (this.finished) return;
    void this.ctx.say('ps.try');
    this.busy = false;
  }

  destroy() {
    this.finished = true;
    this.following = null;
    for (const d of this.drags.values()) d.destroy();
    this.drags.clear();
    for (const n of this.puppetNodes.values()) {
      this.ctx.tw.kill(n);
      this.ctx.tw.kill(n.scale);
    }
    for (const c of this.curtainNodes) this.ctx.tw.kill(c.scale);
    this.ctx.tw.kill(this.day);
    this.ctx.tw.kill(this.nightBackdrop);
    for (const b of this.bubbleNodes.values()) this.ctx.tw.kill(b.scale);
    for (const c of this.cardNodes) {
      this.ctx.tw.kill(c.lift);
      this.ctx.tw.kill(c.node.scale);
    }
    for (const f of this.frontRow.critters) this.ctx.tw.kill(f);
    this.ctx.tw.kill(this.frontRow.node);
    this.ctx.tw.kill(this.endNode.scale);
    this.ctx.tw.kill(this.bowNode.scale);
    this.ctx.tw.kill(this.tasselNode);
  }

  // ---- puppets ----

  private critterOf(p: Puppet): Critter {
    return this.arts.get(p)!.critter;
  }

  private makeDraggable(kind: Puppet, node: Container) {
    let pickX = 0;
    const handle = draggable(node, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        pickX = node.x;
        this.tilt(kind);
      },
      onMove: (x) => {
        node.x = standAt(x, this.othersX(kind), this.l.stand);
        node.y = this.l.stage.floor;
      },
      onDrop: (x) => {
        node.x = standAt(x, this.othersX(kind), this.l.stand);
        node.y = this.l.stage.floor;
        node.rotation = 0;
        if (Math.abs(node.x - pickX) < 14) this.tapPuppet(kind);
        else {
          this.dragged = true;
          this.bob(kind);
        }
        return true;
      },
    });
    handle.enabled = false;
    this.drags.set(kind, handle);
  }

  private othersX(kind: Puppet): number[] {
    return this.standing.filter((p) => p !== kind).map((p) => this.puppetNodes.get(p)!.x);
  }

  /** A puppet rises through the slot at `x`. */
  private rise(p: Puppet, x: number, hello = false) {
    const node = this.puppetNodes.get(p)!;
    const floor = this.l.stage.floor;
    this.parked = this.parked.filter((q) => q !== p);
    this.standing.push(p);
    this.peekHead(p, false);
    node.x = x;
    node.y = floor + PUPPET_H + 60;
    node.rotation = 0;
    node.eventMode = 'static';
    const drag = this.drags.get(p);
    if (drag) drag.enabled = true;
    this.ctx.tw.kill(node);
    sfx.pop(NOTE[p]);
    this.critterOf(p).setMood('happy');
    void this.ctx.tw.to(
      node,
      { y: floor },
      { duration: this.reduce ? 0.2 : 0.4, ease: this.reduce ? ease.outQuad : ease.outBack },
    );
    if (hello) void this.speakAs(p, `ps.hello.${p}`);
  }

  /** The longest-standing puppet goes back down the slot. */
  private lower(p: Puppet) {
    const node = this.puppetNodes.get(p)!;
    this.standing = this.standing.filter((q) => q !== p);
    node.eventMode = 'none';
    const drag = this.drags.get(p);
    if (drag) drag.enabled = false;
    if (this.following?.puppet === p) this.following = null;
    this.ctx.tw.kill(node);
    void this.ctx.tw
      .to(node, { y: this.l.stage.floor + PUPPET_H + 60 }, { duration: 0.3, ease: ease.inQuad })
      .then(() => {
        if (this.finished) return;
        if (!this.standing.includes(p) && !this.parked.includes(p)) {
          this.parked.push(p);
          this.peekHead(p, true);
        }
      });
  }

  private peekHead(p: Puppet, shown: boolean) {
    const i = this.story?.cast.indexOf(p) ?? -1;
    if (i >= 0) this.peekHeads[i].visible = shown;
  }

  /** A line in a puppet's voice; its mouth opens while it talks. */
  private speakAs(p: Puppet, id: LineId, preset: VoicePreset = BASE_VOICE[p]): Promise<void> {
    this.spoken.push({ id, pitch: preset.pitch, rate: preset.rate });
    if (this.spoken.length > 8) this.spoken.shift();
    const c = this.critterOf(p);
    c.setMood('sing');
    const seq = (this.speakSeq.get(p) ?? 0) + 1;
    this.speakSeq.set(p, seq);
    return this.ctx.sayIn(id, preset).then(() => {
      if (!this.finished && this.speakSeq.get(p) === seq && c.currentMood === 'sing') c.setMood('happy');
    });
  }

  private tilt(p: Puppet) {
    const node = this.puppetNodes.get(p)!;
    if (this.reduce) return;
    node.rotation = -0.08;
  }

  private bob(p: Puppet) {
    const node = this.puppetNodes.get(p)!;
    this.critterOf(p).poke();
    if (this.reduce) return;
    const floor = this.l.stage.floor;
    this.ctx.tw.kill(node);
    node.rotation = 0;
    void this.ctx.tw.to(node, { y: floor - 18 }, { duration: 0.12, ease: ease.outQuad }).then(() => {
      if (this.finished || !this.standing.includes(p)) return;
      return this.ctx.tw.to(node, { y: floor }, { duration: 0.3, ease: ease.outBack });
    });
  }

  // ---- level 1: the floor ----

  private touchFloor(e: FederatedPointerEvent) {
    if (this.finished || this.busy) return;
    const at = this.ctx.stage.toLocal(e.global);
    const p = nearestParked(at.x, this.parked, this.l.homes);
    if (!p) return;
    if (this.standing.length >= 2) this.lower(this.standing[0]);
    const x = standAt(at.x, this.othersX(p), this.l.stand);
    this.rise(p, x, true);
    this.pops++;
    this.following = { id: e.pointerId, puppet: p, pickX: x, x };
    if (this.pops >= this.plan.popsToBow) this.showBow();
    if (this.plan.autoBowAfter !== null && this.pops >= this.plan.autoBowAfter) void this.bow();
  }

  private follow(e: FederatedPointerEvent) {
    const f = this.following;
    if (!f || e.pointerId !== f.id || this.finished) return;
    const node = this.puppetNodes.get(f.puppet)!;
    const at = this.ctx.stage.toLocal(e.global);
    f.x = at.x;
    node.x = standAt(at.x, this.othersX(f.puppet), this.l.stand);
  }

  private release(id: number) {
    const f = this.following;
    if (!f || id !== f.id) return;
    this.following = null;
    if (this.finished || !this.standing.includes(f.puppet)) return;
    if (this.story) {
      this.standOn(f.puppet, f.x);
      return;
    }
    if (Math.abs(this.puppetNodes.get(f.puppet)!.x - f.pickX) >= 14) this.dragged = true;
    this.bob(f.puppet);
  }

  // ---- taps ----

  private tapPuppet(p: Puppet) {
    if (this.finished || !this.standing.includes(p)) return;
    if (this.plan.level === 1) {
      if (this.busy) return;
      const n = (this.talks.get(p) ?? 0) + 1;
      this.talks.set(p, n);
      this.bob(p);
      if (n % 2 === 1) void this.speakAs(p, `ps.again.${p}`);
      else {
        sfx.marimba(NOTE[p], 0.45);
        this.critterOf(p).setMood('sing', 0.7);
      }
      return;
    }
    if (this.busy) return;
    const ask = this.ask;
    if (this.plan.level === 3 || !ask) {
      // Free: the puppet talks the ordinary way, with input open (U7 R4): another tap cuts it and talks again.
      this.bob(p);
      void this.speakAs(p, this.plan.level === 3 ? this.plan.line! : `ps.talk.${p}`);
      return;
    }
    const verdict = answer(ask, p, this.plan.puppets);
    if (verdict.right) void this.right(p);
    else void this.wrong(p, verdict.said);
  }

  private tapBubble(way: Way) {
    if (this.finished || this.busy) return;
    const b = this.bubbleNodes.get(way)!;
    this.ctx.tw.kill(b.scale);
    b.scale.set(1.12);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (!this.freeTried || this.freeTrying) {
      // The free first try, with input open (U7 R4): another bubble is another free try and cuts it, and the first
      // ask follows the latest try's line, so no tap is judged against an ask she has not heard.
      this.freeTried = true;
      this.freeTrying = true;
      const n = ++this.freeTry;
      void this.playWay(way).then(() => {
        if (this.finished || n !== this.freeTry) return;
        this.freeTrying = false;
        void this.askNext(0);
      });
      return;
    }
    const ask = this.ask;
    if (!ask) return;
    const verdict = answer(ask, way, this.plan.puppets);
    if (verdict.right) void this.right(way);
    else void this.wrong(way, verdict.said);
  }

  /** The puppet says its line the asked way: the preset's voice, the way's face and size. */
  private async playWay(way: Way) {
    const p = this.plan.puppets[0];
    const node = this.puppetNodes.get(p)!;
    const look = WAY_LOOK[way];
    this.ctx.tw.kill(node.scale);
    void this.ctx.tw.to(node.scale, { x: look.scale, y: look.scale }, { duration: 0.25, ease: ease.outBack });
    if (way === 'sleepy') sfx.yawn();
    const seq = ++this.waySeq;
    await this.speakAs(p, this.plan.line!, WAY_VOICE[way]);
    if (this.finished || seq !== this.waySeq) return;
    this.critterOf(p).setMood(look.mood, 0.8);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private async askNext(i: number) {
    this.askIndex = i;
    this.askMisses = 0;
    this.hinted = false;
    this.glow = null;
    const ask = this.ask;
    if (!ask) {
      void this.bow();
      return;
    }
    this.busy = true;
    if (ask.kind === 'voice') {
      // The voices have just been heard: each puppet says a short hello, left then right.
      for (const p of this.plan.puppets) {
        this.bob(p);
        await this.speakAs(p, `ps.hello.${p}`);
        if (this.finished) return;
      }
    }
    void this.ctx.instruct(askLine(ask));
    this.busy = false;
  }

  private async right(target: Puppet | Way) {
    this.busy = true;
    this.glow = null;
    const index = this.askIndex;
    this.clap();
    const reply = (WAYS as readonly string[]).includes(target)
      ? this.playWay(target as Way)
      : (this.bob(target as Puppet), this.speakAs(target as Puppet, `ps.talk.${target as Puppet}`));
    // The reply never holds the next ask (U7 R4): it starts, and after the 0.3 s beat the next ask, which is only
    // spoken, cuts it; input stays closed until that ask so no tap is judged against one she has not heard. The last
    // ask's reply is heard out before the bow.
    if (index + 1 >= this.plan.asks.length) await reply;
    if (this.finished) return;
    await this.ctx.tw.wait(0.3);
    if (this.finished) return;
    void this.askNext(index + 1);
  }

  private async wrong(tapped: Puppet | Way, said: LineId) {
    this.busy = true;
    this.misses++;
    this.askMisses++;
    const index = this.askIndex;
    sfx.boing();
    if ((WAYS as readonly string[]).includes(tapped)) {
      await this.playWay(tapped as Way);
      if (this.finished) return;
      await this.ctx.say(said);
    } else {
      this.bob(tapped as Puppet);
      await this.speakAs(tapped as Puppet, said);
    }
    if (this.finished || index !== this.askIndex) return;
    if (this.askMisses >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
      this.glow = hintTarget(this.ask!, this.plan.puppets);
      void this.ctx.say('ps.this-one');
    }
    this.busy = false;
  }

  // ---- levels 4–6: story cards ----

  private where(p: Puppet): Where {
    if (!this.standing.includes(p)) return 'parked';
    const a = this.at.get(p);
    return a ? this.story!.places[a.place] : null;
  }

  private async storyOpening() {
    this.busy = true;
    if (this.plan.level === 6) this.frontRow.critters.forEach((c, i) => this.hop(c, i * 0.15));
    await this.ctx.instruct(`ps.instruct.${this.plan.level as 4 | 5 | 6}`);
    if (this.finished) return;
    this.liftCard(0);
    await this.ctx.say(this.plan.scenes[0].card);
    if (this.finished) return;
    this.busy = false;
  }

  /** A standing puppet: a short touch bobs it (acts), a drag walks it, a drag down into the apron sends it back to its peek. */
  private makeStoryDraggable(kind: Puppet, node: Container) {
    let pickX = 0,
      lastX = 0,
      lastY = 0;
    const handle = draggable(node, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        pickX = lastX = node.x;
        lastY = this.l.stage.floor;
        this.tilt(kind);
      },
      onMove: (x, y) => {
        lastX = x;
        lastY = y;
        node.x = standAt(x, this.othersX(kind), this.l.stand);
        node.y = this.l.stage.floor;
        // Cat tiptoes in the sneaky card; art only.
        if (this.story?.id === 'c' && kind === 'cat' && !this.reduce) node.rotation = 0.07 * Math.sin(x / 18);
      },
      onDrop: () => {
        node.y = this.l.stage.floor;
        node.rotation = 0;
        if (lastY > this.l.stage.floor + 40) {
          this.at.set(kind, null);
          this.lower(kind);
          return true;
        }
        if (Math.abs(lastX - pickX) < 14) {
          node.x = pickX;
          this.act(kind);
          return true;
        }
        this.standOn(kind, lastX);
        return true;
      },
    });
    handle.enabled = false;
    this.drags.set(kind, handle);
  }

  /** A touch-down on a peek raises that puppet through the slot; it follows the finger until the release stands it. */
  private touchPeek(i: 0 | 1, e: FederatedPointerEvent) {
    if (this.finished || this.following) return;
    const p = this.story!.cast[i];
    if (!this.parked.includes(p)) return;
    const x = this.l.peeks[i].x;
    this.rise(p, x);
    this.at.set(p, null);
    this.following = { id: e.pointerId, puppet: p, pickX: x, x };
  }

  /** A release at `x`: inside a place's snap zone the puppet takes that place's nearest free mark; anywhere else it just stands. */
  private standOn(p: Puppet, x: number) {
    const node = this.puppetNodes.get(p)!;
    const others = this.othersX(p);
    const place = placeAt(x, this.l);
    const mark = place === null ? null : freeMark(place, x, others, this.l);
    if (place !== null && mark !== null) {
      this.at.set(p, { place, mark });
      node.x = this.l.marks[place][mark];
    } else {
      this.at.set(p, null);
      node.x = standAt(x, others, this.l.stand);
    }
    this.bob(p);
  }

  /** A bob: judged against the cards. */
  private act(p: Puppet) {
    if (this.finished) return;
    this.bob(p);
    if (this.busy) return;
    const scenes = this.plan.scenes;
    const j = judge(scenes, this.done, { puppet: p, place: this.where(p) as Place | null });
    if (j.kind === 'scene') {
      void this.tick(j.index);
      return;
    }
    if (j.kind === 'again') {
      void this.speakLine(p, scenes[j.index].line, scenes[j.index].voice);
      return;
    }
    if (j.kind === 'early' && this.plan.level === 5) {
      void this.early();
      return;
    }
    // Free (and an early bob at level 6): the puppet just speaks.
    if (this.plan.level <= 5) this.sceneFree++;
    void this.speakLine(p, `ps.again.${p}`).then(() => {
      if (this.plan.level <= 5 && this.sceneFree >= 3) this.storyHint();
    });
  }

  private async speakLine(p: Puppet, id: LineId, voice?: Way) {
    this.busy = true;
    await this.speakAs(p, id, voice ? WAY_VOICE[voice] : BASE_VOICE[p]);
    if (!this.finished) this.busy = false;
  }

  /** Level 5: a later card acted first is one try; the current card lifts again. */
  private async early() {
    this.busy = true;
    this.misses++;
    this.sceneEarly++;
    sfx.boing();
    this.liftCard(this.done);
    await this.ctx.say('ps.order');
    if (this.finished) return;
    if (this.sceneEarly >= 2) this.storyHint();
    this.busy = false;
  }

  /** The glow on the next scene's puppet and place: at most one per scene (levels 4–5). */
  private storyHint() {
    if (this.sceneHinted || this.finished) return;
    this.sceneHinted = true;
    this.hints++;
    this.storyGlow = storyHint(this.plan.scenes, this.done);
    void this.ctx.say('ps.this-one');
  }

  private async tick(index: number) {
    this.busy = true;
    const scene = this.plan.scenes[index];
    this.done = index + 1;
    this.storyGlow = null;
    this.sceneFree = this.sceneEarly = 0;
    this.sceneHinted = false;
    const card = this.cardNodes[index];
    card.star.visible = true;
    this.ctx.tw.kill(card.lift);
    void this.ctx.tw.to(card.lift, { y: 0 }, { duration: 0.25, ease: ease.outQuad });
    this.clap();
    if (this.plan.level === 6) this.hop(this.frontRow.critters[index]);
    if (scene.card === 'ps.card.a1') sfx.knock();
    await this.speakAs(
      scene.puppet,
      scene.line,
      scene.voice ? WAY_VOICE[scene.voice] : BASE_VOICE[scene.puppet],
    );
    if (this.finished) return;
    if (scene.line === 'ps.sc.c3') {
      if (this.standing.includes('duck')) {
        this.bob('duck');
        this.critterOf('duck').setMood('surprised', 0.8);
        await this.speakAs('duck', SURPRISED);
        if (this.finished) return;
      }
    }
    if (this.plan.level === 6 && !this.endShown && this.done < this.plan.scenes.length) this.showEnd();
    if (this.done >= this.plan.scenes.length) {
      if (this.plan.level < 6) {
        void this.bow();
        return;
      }
      this.endNode.visible = false;
      this.endShown = false;
      sfx.tada();
      this.frontRow.critters.forEach((c, i) => {
        c.setMood('happy');
        this.hop(c, i * 0.1);
      });
      await this.ctx.say('ps.cheer');
      if (this.finished) return;
      this.showBow();
      this.busy = false;
      return;
    }
    this.liftCard(this.done);
    await this.ctx.say(this.plan.scenes[this.done].card);
    if (this.finished) return;
    this.busy = false;
  }

  /** Level 6: The end before every card is acted. The curtains close and open, the friends react to what was shown. */
  private async theEnd() {
    if (this.finished || this.busy || this.done >= this.plan.scenes.length) return;
    this.busy = true;
    this.misses++;
    this.earlyEnds++;
    this.ended = true;
    this.endNode.scale.set(0.92);
    void this.ctx.tw.to(this.endNode.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (!this.curtainsClosed) this.toggleCurtains();
    await this.ctx.tw.wait(this.reduce ? 0.3 : 0.7);
    if (this.finished) return;
    if (this.curtainsClosed) this.toggleCurtains();
    const r = reactions(this.plan.scenes, this.done);
    r.forEach((kind, i) => {
      const c = this.frontRow.critters[i];
      c.setMood(kind === 'clap' ? 'happy' : 'surprised');
      if (kind === 'clap') this.hop(c);
    });
    if (r.includes('clap')) sfx.clap();
    await this.ctx.say(this.plan.scenes[this.done].waited);
    if (this.finished) return;
    if (this.earlyEnds >= 2 && !this.roundHinted) {
      this.roundHinted = true;
      this.hints++;
      this.storyGlow = storyHint(this.plan.scenes, this.done);
      void this.ctx.say('ps.this-one');
    }
    this.showBow();
    this.busy = false;
  }

  private tapCard(i: number) {
    if (this.finished) return;
    const c = this.cardNodes[i];
    this.ctx.tw.kill(c.node.scale);
    c.node.scale.set(0.94);
    void this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    void this.ctx.say(this.plan.scenes[i].card);
  }

  /** The current card lifts a little above the others. */
  private liftCard(i: number) {
    this.cardNodes.forEach((c, k) => {
      this.ctx.tw.kill(c.lift);
      void this.ctx.tw.to(c.lift, { y: k === i ? 8 : 0 }, { duration: 0.3, ease: ease.outBack });
    });
  }

  private showEnd() {
    if (this.endShown || this.finished) return;
    this.endShown = true;
    this.endNode.visible = true;
    this.endNode.scale.set(0.3);
    void this.ctx.tw.to(this.endNode.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  private hop(c: Critter, delay = 0) {
    if (this.reduce) return;
    this.ctx.tw.kill(c);
    const y = 18;
    void this.ctx.tw.wait(delay).then(() => {
      if (this.finished) return;
      c.y = y;
      return this.ctx.tw.to(c, { y: y - 16 }, { duration: 0.15, ease: ease.outQuad }).then(() => {
        if (!this.finished) return this.ctx.tw.to(c, { y }, { duration: 0.25, ease: ease.outBack });
      });
    });
  }

  // ---- curtains, tassel, bow ----

  private toggleCurtains() {
    if (this.finished) return;
    this.curtainsClosed = !this.curtainsClosed;
    sfx.whoosh();
    const { left, right } = this.l.stage;
    const cover = (right - left) / 2 / CURTAIN_W;
    for (const c of this.curtainNodes) {
      this.ctx.tw.kill(c.scale);
      void this.ctx.tw.to(
        c.scale,
        { x: this.curtainsClosed ? cover : 1 },
        { duration: this.reduce ? 0.2 : 0.5, ease: ease.inOutSine },
      );
    }
  }

  private pullTassel() {
    if (this.finished) return;
    this.night = !this.night;
    sfx.bell(this.night ? 4 : 9, 0.25);
    this.ctx.tw.kill(this.tasselNode);
    this.tasselNode.rotation = 0.3;
    void this.ctx.tw.to(this.tasselNode, { rotation: 0 }, { duration: 0.6, ease: ease.outElastic });
    this.ctx.tw.kill(this.day);
    this.ctx.tw.kill(this.nightBackdrop);
    void this.ctx.tw.to(this.nightBackdrop, { alpha: this.night ? 1 : 0 }, { duration: 0.6 });
    void this.ctx.tw.to(this.day, { alpha: this.night ? 0 : 1 }, { duration: 0.6 });
  }

  private clap() {
    sfx.clap();
    for (const s of this.l.seats)
      this.ctx.particles.burst(s.x, s.y - 30, {
        kind: 'star',
        colors: [swatch.yellow.fill, swatch.pink.fill, 0xffffff],
        count: 6,
        speed: [60, 160],
        gravity: 240,
        life: [0.3, 0.6],
      });
    this.frontRow.node.y = this.frontRow.node.y - 10;
    void this.ctx.tw.to(
      this.frontRow.node,
      { y: this.frontRow.node.y + 10 },
      { duration: 0.3, ease: ease.outBack },
    );
  }

  private showBow() {
    if (this.bowShown || this.finished) return;
    this.bowShown = true;
    this.bowNode.visible = true;
    this.bowNode.scale.set(0.3);
    void this.ctx.tw.to(this.bowNode.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    sfx.sparkle();
  }

  /** The standing puppets bow, the front row claps, and the round ends with its one sticker. */
  private async bow() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.glow = null;
    this.following = null;
    this.bowNode.visible = false;
    this.endNode.visible = false;
    this.storyGlow = null;
    for (const d of this.drags.values()) d.enabled = false;
    sfx.tada();
    this.clap();
    for (const p of this.standing) {
      const node = this.puppetNodes.get(p)!;
      this.ctx.tw.kill(node);
      node.y = this.l.stage.floor;
      if (!this.reduce)
        void this.ctx.tw
          .to(node, { rotation: 0.45 }, { duration: 0.35, ease: ease.outQuad })
          .then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.5, ease: ease.outBack }));
      this.critterOf(p).setMood('happy');
    }
    await this.ctx.say('ps.bow');
    await this.ctx.tw.wait(0.6);
    await this.ctx.say('ps.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ---- shell hooks ----

  resize(view: View) {
    const l = (this.l = layout(this.plan.level, view));
    const { stage } = l;
    const w = stage.right - stage.left,
      h = stage.floor - stage.top;
    const dayAlpha = this.day.alpha,
      nightAlpha = this.nightBackdrop.alpha;
    const oldDay = this.day,
      oldNight = this.nightBackdrop,
      oldPros = this.proscenium;
    this.day = backdropArt(w, h, false);
    this.day.alpha = dayAlpha;
    this.nightBackdrop = backdropArt(w, h, true);
    this.nightBackdrop.alpha = nightAlpha;
    this.proscenium = prosceniumArt(stage.left, stage.right, stage.top, stage.floor, stage.bottom);
    for (const [old, fresh] of [
      [oldDay, this.day],
      [oldNight, this.nightBackdrop],
      [oldPros, this.proscenium],
    ] as const) {
      const i = this.ctx.stage.getChildIndex(old);
      this.ctx.stage.addChildAt(fresh, i);
      this.ctx.tw.kill(old);
      old.destroy();
    }
    this.day.position.set(stage.left, stage.top);
    this.nightBackdrop.position.set(stage.left, stage.top);
    this.puppetMask
      .clear()
      .rect(stage.left - 40, 0, w + 80, stage.floor)
      .fill(0xffffff);
    this.floorSurface.hitArea = new Rectangle(
      l.floorTouch.x - l.floorTouch.w / 2,
      l.floorTouch.y - l.floorTouch.h / 2,
      l.floorTouch.w,
      l.floorTouch.h,
    );
    const cover = (stage.right - stage.left) / 2 / CURTAIN_W;
    this.curtainNodes.forEach((c, i) => {
      const box = l.curtains[i];
      c.removeChildren().forEach((old) => old.destroy());
      const fresh = curtainArt(i === 0 ? -1 : 1, box.h);
      c.hitArea = fresh.hitArea;
      fresh.hitArea = null;
      fresh.eventMode = 'none';
      c.addChild(fresh);
      c.position.set(i === 0 ? stage.left : stage.right, box.y - box.h / 2);
      if (!this.ctx.tw.busy(c.scale)) c.scale.x = this.curtainsClosed ? cover : 1;
    });
    this.tasselNode.position.set(l.tassel.x, l.tassel.y);
    this.bowNode.position.set(l.bow.x, l.bow.y);
    this.frontRow.node.visible = l.seats.length > 0;
    if (l.seats.length) this.frontRow.node.position.set(l.seats[1].x, l.seats[1].y);
    WAYS.forEach((way, i) => {
      const b = this.bubbleNodes.get(way);
      const box = l.bubbles[i];
      if (b && box) b.position.set(box.x, box.y);
    });
    this.peekNodes.forEach((n, i) => n.position.set(l.peeks[i].x, l.peeks[i].y));
    this.cardNodes.forEach((c, i) => c.node.position.set(l.cards[i].x, l.cards[i].y));
    this.placeNodes.forEach((g, i) => g.position.set(l.places[i], stage.floor - 6));
    if (l.end) this.endNode.position.set(l.end.x, l.end.y);
    const cast = this.story?.cast;
    for (const p of PUPPETS) {
      const node = this.puppetNodes.get(p)!;
      const i = this.standing.indexOf(p);
      if (i < 0) {
        const peek = cast ? cast.indexOf(p) : -1;
        node.x = peek >= 0 ? l.peeks[peek].x : l.homes[PUPPETS.indexOf(p)];
        if (!this.ctx.tw.busy(node)) node.y = stage.floor + PUPPET_H + 60;
        continue;
      }
      if (this.story) {
        const a = this.at.get(p);
        node.x = a ? l.marks[a.place][a.mark] : standAt(node.x, this.othersX(p), l.stand);
      } else
        node.x =
          this.plan.level === 1
            ? standAt(node.x, this.othersX(p), l.stand)
            : l.spots[Math.min(i, l.spots.length - 1)];
      if (!this.ctx.tw.busy(node)) node.y = stage.floor;
    }
  }

  update(dt: number) {
    this.clock += dt;
    if (this.plan.level === 1 && !this.bowShown && this.clock >= this.plan.secondsToBow) this.showBow();
    this.glowRing.clear();
    this.placeGlow.clear();
    if (this.storyGlow && !this.finished && !this.busy) {
      const g = this.storyGlow;
      const pulse = 6 + 4 * Math.sin(this.clock * 5);
      const peek = this.story!.cast.indexOf(g.puppet);
      const b = this.standing.includes(g.puppet) ? this.puppetBox(g.puppet) : this.l.peeks[peek];
      this.glowRing
        .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 30)
        .stroke({ width: 7, color: swatch.yellow.fill });
      const x = this.l.places[this.story!.places.indexOf(g.place)];
      this.placeGlow
        .ellipse(x, this.l.stage.floor - 4, 110 + pulse, 22 + pulse / 2)
        .fill({ color: swatch.yellow.fill, alpha: 0.55 });
    }
    if (!this.glow || this.finished || this.busy) return;
    const target = this.glowTarget(this.glow);
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const b = target.hitArea as Rectangle;
    this.glowRing
      .roundRect(
        target.x + b.x * target.scale.x - pulse,
        target.y + b.y * target.scale.y - pulse,
        b.width * target.scale.x + 2 * pulse,
        b.height * target.scale.y + 2 * pulse,
        30,
      )
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  private puppetBox(p: Puppet) {
    const n = this.puppetNodes.get(p)!;
    return { x: n.x, y: this.l.stage.floor - PUPPET_H / 2, w: 140, h: PUPPET_H };
  }

  private glowTarget(g: Puppet | Way): Container {
    return this.bubbleNodes.get(g as Way) ?? this.puppetNodes.get(g as Puppet)!;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const l = this.l;
    if (this.plan.level === 1) {
      if (this.following) return null;
      if (this.pops < 3) {
        const x = l.stand.min + (0.2 + 0.3 * this.pops) * (l.stand.max - l.stand.min);
        return { tap: { on: this.floorSurface, x, y: l.floorTouch.y }, pause: 0.9 };
      }
      if (!this.dragged) {
        // A hand's width whichever way and whichever puppet really moves it: a puppet blocked by its neighbour or the
        // stand's edge would land back where it was, which counts as a tap and never as the drag.
        let node = this.puppetNodes.get(this.standing[0])!,
          to = node.x,
          moved = -1;
        for (const p of this.standing) {
          const n = this.puppetNodes.get(p)!;
          for (const d of [120, -120]) {
            const lands = standAt(n.x + d, this.othersX(p), l.stand);
            if (Math.abs(lands - n.x) > moved) {
              node = n;
              to = lands;
              moved = Math.abs(lands - n.x);
            }
          }
        }
        return {
          drag: { on: node, x: 0, y: -20 },
          to: { on: this.ctx.stage, x: to, y: l.stage.floor - 20 },
          lift: 0,
          pause: 0.8,
        };
      }
      return this.bowShown ? { tap: { on: this.bowNode }, pause: 0.6 } : null;
    }
    if (this.story) return this.storyTouch();
    const ask = this.ask;
    if (this.freeTrying) return null;
    if (this.plan.level === 3 && !this.freeTried)
      return { tap: { on: this.bubbleNodes.get('sleepy')! }, pause: 0.8 };
    if (!ask) return null;
    if (ask.kind === 'way') return { tap: { on: this.bubbleNodes.get(ask.way)! }, pause: 0.8 };
    return { tap: { on: this.puppetNodes.get(askedPuppet(ask, this.plan.puppets)!)! }, pause: 0.8 };
  }

  /** Levels 4–6: bring up or walk the next scene's puppet to its place's nearest free mark, bob it, and Bow after the cheer; never The end. */
  private storyTouch(): TouchIntent | null {
    if (this.following) return null;
    const l = this.l,
      story = this.story!;
    const move = storyMove(this.plan.scenes, this.done, (p) => this.where(p));
    if (move.kind === 'bow') return this.bowShown ? { tap: { on: this.bowNode }, pause: 0.6 } : null;
    if (move.kind === 'bob')
      return { tap: { on: this.puppetNodes.get(move.puppet)!, x: 0, y: -PUPPET_H / 2 }, pause: 0.8 };
    const place = story.places.indexOf(move.place) as 0 | 1;
    const mark = freeMark(place, l.places[place], this.othersX(move.puppet), l) ?? 0;
    const to = { on: this.ctx.stage, x: l.marks[place][mark], y: l.stage.floor - 60 };
    if (move.kind === 'raise')
      return { drag: { on: this.peekNodes[story.cast.indexOf(move.puppet)] }, to, lift: 0, pause: 0.6 };
    return { drag: { on: this.puppetNodes.get(move.puppet)!, x: 0, y: -60 }, to, lift: 0, pause: 0.6 };
  }
}

export const puppetStage: GameModule = {
  id: 'puppet-stage',
  name: 'Puppet Stage',
  titleLine: 'game.puppet-stage',
  region: 'music-mountain',
  challenge: 'words',
  skills: ['pretend-play', 'listening', 'character-voices', 'acting-a-story'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel,
  music: silenced(STYLES.hub),
  coplayHint: "Say hello back in a silly voice when a puppet pops up; {name}'s puppet will answer.",
  offScreen: {
    all: 'A spoon with a paper face is a puppet; give it a voice at dinner.',
    prek: 'Act a picture book with two spoons: you read the page, {name} gives the spoons their voices.',
    school: 'Act a picture book with two spoons: you read the page, {name} gives the spoons their voices.',
  },
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => stickerArt(stickerPuppet(seed)),
  create: (ctx) => new PuppetStage(ctx),
  touchDemo: true,
};
