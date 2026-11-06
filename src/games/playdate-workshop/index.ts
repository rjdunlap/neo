/**
 * Playdate Workshop: two critter friends each say what they would like; she gives the stamp pad, taps a page to stamp and
 * taps the pad to pass it (level 1), picks a way to make one banner and makes it (level 2), or picks a plan that meets both
 * friends' requests and makes it (level 3). The materials carry the rule: an out-of-turn tap is refused with the reason, for
 * free. Nothing counts as a miss; the lightbulb and the pet's help count as hints. Rules: ./logic.ts; definition:
 * docs/definitions/playdate-workshop.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import type { CompanionRig } from '../../creatures/companion';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  bubbleArt, bulbIcon, cardPicture, cardPlate, cellArt, chipArt, finishIcon, FRIEND_SWATCH, friendArt, iconArt, makeIcon, metTick, padArt, pageArt, pawIcon,
  requestPicture, rollerArt, stampArt, stickerArt, THEME, tryIcon, undoIcon, watchIcon,
} from './art';
import {
  accepts, acceptedPlans, blankTable, cardOrder, centre, check, complete, decisionNow, FRIENDS, give, hintFor, nextStep, pageOf, planFor, previewOf, replay,
  specFor, Tally, variationFor, whyNot, workshopLayout, type Action, type Friend, type LevelSpec, type Plan, type PlanId, type Rect, type Surface, type Table,
  type Tool, type Variation, type WorkshopLayout, type BannerTheme, type StampPicture,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 3 },
};

const REQUEST_LINE = { page: 'playdate.request.page', banner: 'playdate.request.banner', bannerOr: 'playdate.request.bannerOr', own: 'playdate.request.own' } as const;
const INSTRUCT: Record<number, LineId> = { 1: 'playdate.instruct.1', 2: 'playdate.instruct.2', 3: 'playdate.instruct.3' };
/** Seconds between the pet's steps, and between steps of Watch again. */
const PET_STEP = 0.7;
const WATCH_STEP = 0.45;

type Phase = 'plan' | 'make';
type BubbleState = 'none' | 'met' | 'unmet';

interface ToolNode { tool: Tool; node: Container; drag: DragHandle; both: Graphics }

class PlaydateWorkshop implements Game {
  readonly spec: LevelSpec;
  readonly variation: Variation;
  readonly tally = new Tally();
  readonly cards: PlanId[];
  phase: Phase;
  selected: PlanId | null = null;
  plan: Plan | null = null;
  trace: Action[] = [];
  /** A tray tool tapped and held up, waiting for a friend. */
  lifted: Tool | null = null;
  /** The last card Try it ran on, and what each request did. */
  previewed: PlanId | null = null;
  bubbleState: Record<Friend, BubbleState> = { A: 'none', B: 'none' };
  /** After two unmet previews: the request a plan keeps leaving out. */
  glowRequest: Friend | null = null;
  /** What the lightbulb lit: a card or the target of an action. */
  hintCard: PlanId | null = null;
  hintAction: Action | null = null;
  /** The pet picked in this Plan phase, so a second press makes it too. */
  private petPicked = false;
  done = false;
  finished = false;
  busy = false;
  /** The table shown while Watch again replays (null: the live trace). */
  private shown: Table | null = null;
  private alive = true;
  private started = false;
  private epoch = 0;
  private clock = 0;
  private view: View;
  layoutNow: WorkshopLayout | null = null;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private readonly companion: CompanionRig;
  friendNodes: Partial<Record<Friend, Container>> = {};
  private critters: Critter[] = [];
  bubbleNodes: Partial<Record<Friend, Container>> = {};
  cardNodes = new Map<PlanId, Container>();
  pageNodes: Partial<Record<Friend, Container>> = {};
  cellNodes: Container[] = [];
  toolNodes: ToolNode[] = [];
  private stripNode: Container | null = null;
  chosenNode: Container | null = null;
  tryButton: RoundButton | null = null;
  makeButton: RoundButton | null = null;
  bulbButton: RoundButton | null = null;
  petButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  finishButton: RoundButton | null = null;
  againButton: RoundButton | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const first = !!ctx.demo || ctx.rng.next() < 0.34;
    this.variation = variationFor(ctx.level, ctx.rng, first);
    this.spec = specFor(ctx.level, this.variation.own);
    this.cards = cardOrder(this.spec, ctx.rng, first);
    this.phase = this.spec.level === 1 ? 'make' : 'plan';
    if (this.phase === 'make') this.plan = planFor(this.spec.plans[0], this.spec.cells, this.own);
    this.backdrop = ctx.track(new Backdrop({ sky: [0xffe3c8, 0xfff6e0], hills: [0xc9e8b8, 0xb4dca0, 0xe8d3b0], horizon: 0.52, clouds: 2, sun: true, seed: 211 }, ctx.view));
    this.glow.eventMode = 'none';
    this.companion = ctx.track(ctx.companion());
    this.companion.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  private get level() { return this.spec.level; }
  private get own(): Friend { return this.variation.own; }
  /** The table on screen: the live trace's, or Watch again's frame. */
  get table(): Table { return this.shown ?? replay(this.trace); }

  start() {
    this.started = true;
    this.build();
    void this.ctx.instruct(INSTRUCT[this.level]);
  }

  destroy() {
    this.alive = false;
    for (const t of this.toolNodes) t.drag.destroy();
    for (const c of this.critters) this.ctx.untrack(c);
    this.ctx.untrack(this.companion);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (this.started && !this.busy) this.build();
  }

  // ——— Building the scene ———

  private layoutFor(): WorkshopLayout | null {
    if (this.phase === 'plan') return workshopLayout(this.view, { level: this.level, phase: 'plan', cards: this.cards.length });
    return workshopLayout(this.view, { level: this.level, phase: 'make', surfaces: this.plan!.surfaces, tools: this.plan!.tools.length });
  }

  private build() {
    this.epoch++;
    for (const t of this.toolNodes) t.drag.destroy();
    for (const c of this.critters) this.ctx.untrack(c);
    this.critters = [];
    this.toolNodes = [];
    this.friendNodes = {};
    this.bubbleNodes = {};
    this.pageNodes = {};
    this.cellNodes = [];
    this.cardNodes.clear();
    this.stripNode = this.chosenNode = null;
    this.tryButton = this.makeButton = this.bulbButton = this.petButton = this.undoButton = this.finishButton = this.againButton = null;
    this.companion.removeFromParent();
    this.glow.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    const l = this.layoutFor();
    this.layoutNow = l;
    if (!l) return;
    const v = this.variation;

    for (const f of FRIENDS) {
      // The friend, standing at the side.
      const fr = l.friends[f];
      const holder = new Container();
      const critter = friendArt(v.cast[f === 'A' ? 0 : 1], fr.h - 20);
      critter.position.set(0, fr.h / 2 - 6);
      if (f === 'B') critter.scale.x *= -1;
      holder.addChild(critter);
      this.critters.push(this.ctx.track(critter));
      holder.position.copyFrom(centre(fr));
      holder.hitArea = new Rectangle(-fr.w / 2, -fr.h / 2, fr.w, fr.h);
      if (this.phase === 'make') onTap(holder, () => this.tapFriend(f), { cooldown: 250 });
      else holder.eventMode = 'none';
      this.board.addChild(holder);
      this.friendNodes[f] = holder;
      // The request bubble.
      const br = l.bubbles[f];
      const bubble = new Container();
      bubble.position.copyFrom(centre(br));
      bubble.hitArea = new Rectangle(-br.w / 2, -br.h / 2, br.w, br.h);
      onTap(bubble, () => { critter.hop(0.6); void this.ctx.say(REQUEST_LINE[this.spec.requests[f]]); }, { cooldown: 400 });
      this.board.addChild(bubble);
      this.bubbleNodes[f] = bubble;
    }

    if (this.phase === 'plan') {
      this.cards.forEach((id, i) => {
        const r = l.cards[i];
        const card = new Container();
        card.position.copyFrom(centre(r));
        card.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
        onTap(card, () => this.select(id), { cooldown: 250 });
        this.board.addChild(card);
        this.cardNodes.set(id, card);
      });
      const [tr, mk, bu, pe] = l.buttons;
      this.tryButton = this.button(tryIcon(), swatch.blue, tr, () => this.tryIt());
      this.makeButton = this.button(makeIcon(), swatch.green, mk, () => this.makeIt());
      this.bulbButton = this.button(bulbIcon(), swatch.yellow, bu, () => this.askForHint());
      this.petButton = this.button(pawIcon(), swatch.pink, pe, () => this.petHelp());
    } else {
      if (l.chosen && this.plan) {
        const r = l.chosen;
        const card = new Container();
        card.position.copyFrom(centre(r));
        card.addChild(cardPlate(r.w, r.h, false));
        const pic = cardPicture(this.plan.id, v, this.own, 280, 180);
        pic.scale.set(Math.min(r.w / 280, r.h / 180));
        card.addChild(pic);
        card.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
        onTap(card, () => this.backToPlan(), { cooldown: 400 });
        this.board.addChild(card);
        this.chosenNode = card;
      }
      if (l.strip) {
        const s = new Container();
        s.eventMode = 'none';
        s.position.set(l.strip.x, l.strip.y);
        this.board.addChild(s);
        this.stripNode = s;
      }
      const surfaces = this.plan!.surfaces;
      for (const f of FRIENDS) {
        if (!surfaces.includes(pageOf(f)) || !l.pages) continue;
        const r = l.pages[f];
        const page = new Container();
        page.position.copyFrom(centre(r));
        page.addChild(pageArt(r.w, FRIEND_SWATCH[f]), new Container());
        page.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
        onTap(page, () => this.tapSurface(pageOf(f), page), { cooldown: 250 });
        this.board.addChild(page);
        this.pageNodes[f] = page;
      }
      l.banner.forEach((r) => {
        const cell = new Container();
        cell.position.copyFrom(centre(r));
        cell.addChild(cellArt(r.w, THEME[v.theme]), new Container());
        cell.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
        onTap(cell, () => this.tapSurface('banner', cell), { cooldown: 250 });
        this.board.addChild(cell);
        this.cellNodes.push(cell);
      });
      // The tray's slots, then the tools.
      const slots = new Graphics();
      slots.eventMode = 'none';
      for (const t of l.tray) slots.roundRect(t.x, t.y, t.w, t.h, 22).fill({ color: 0xffffff, alpha: 0.4 }).stroke({ width: 3, color: 0x9c6b3c, alpha: 0.4 });
      for (const f of FRIENDS) { const h = l.hands[f]; slots.roundRect(h.x, h.y, h.w, h.h, 60).fill({ color: FRIEND_SWATCH[f].light, alpha: 0.5 }); }
      this.board.addChild(slots);
      for (const tool of this.plan!.tools) {
        const node = new Container();
        node.addChild(tool === 'pad' ? padArt(110) : rollerArt(116));
        const both = new Graphics().circle(-52, -29, 11).fill(FRIEND_SWATCH.A.fill).circle(52, -29, 11).fill(FRIEND_SWATCH.B.fill);
        both.visible = false;
        node.addChild(both);
        node.hitArea = new Rectangle(-60, -60, 120, 120);
        this.board.addChild(node);
        const tn: ToolNode = { tool, node, both, drag: null as unknown as DragHandle };
        tn.drag = draggable(node, this.ctx.tw, {
          onPick: () => sfx.tick(),
          onMove: (x, y) => this.dragMove(tn, x, y),
          onDrop: (x, y) => this.dragDrop(tn, x, y),
        });
        // A tap (a touch that never travels) acts on the tool; the drag handle only takes a carry.
        onTap(node, () => this.tapTool(tool), { cooldown: 250 });
        this.toolNodes.push(tn);
      }
      const [un, bu, pe] = l.buttons;
      this.undoButton = this.button(undoIcon(), swatch.blue, un, () => this.undo());
      this.bulbButton = this.button(bulbIcon(), swatch.yellow, bu, () => this.askForHint());
      this.petButton = this.button(pawIcon(), swatch.pink, pe, () => this.petHelp());
      if (l.finish && l.again) {
        this.finishButton = this.button(finishIcon(), swatch.green, l.finish, () => void this.finishRound());
        this.againButton = this.button(watchIcon(), swatch.purple, l.again, () => void this.watchAgain());
      }
    }
    // The pet stands by its button, clear of the guide's corner.
    const pb = l.buttons[l.buttons.length - 1];
    const ch = this.companion.getLocalBounds().height || 300;
    this.companion.scale.set(120 / ch);
    this.companion.position.set(pb.x + pb.w + 60, pb.y + pb.h);
    if (this.companion.x + 60 > this.view.w) this.companion.position.set(pb.x - 70, pb.y + pb.h);
    this.board.addChild(this.companion, this.glow);
    this.refresh(false);
  }

  private button(icon: Container, sw: typeof swatch.blue, r: Rect, fn: () => void): RoundButton {
    const b = new RoundButton(icon, sw, Math.min(r.w, r.h) / 2, fn);
    b.position.copyFrom(centre(r));
    this.board.addChild(b);
    return b;
  }

  /** Redraw what changes: cards, bubbles, marks, tools, the strip and the finish controls. */
  private refresh(animate = true) {
    const l = this.layoutNow;
    if (!l) return;
    const v = this.variation;
    for (const [id, card] of this.cardNodes) {
      for (const c of card.removeChildren()) c.destroy({ children: true });
      const r = l.cards[this.cards.indexOf(id)];
      const lifted = this.selected === id;
      card.addChild(cardPlate(r.w, r.h, lifted), cardPicture(id, v, this.own, r.w, r.h));
      card.scale.set(lifted ? 1.04 : 1);
    }
    const table = this.table;
    for (const f of FRIENDS) {
      const bubble = this.bubbleNodes[f];
      if (!bubble) continue;
      for (const c of bubble.removeChildren()) c.destroy({ children: true });
      const r = l.bubbles[f];
      const state: BubbleState = this.phase === 'make' ? (check(table, this.spec.requests[f], f, this.spec.cells) ? 'met' : 'none') : this.bubbleState[f];
      bubble.addChild(bubbleArt(f, r.w, r.h, state), requestPicture(this.spec.requests[f], f, v, r.w, r.h));
      if (state === 'met') { const t = metTick(); t.position.set(r.w / 2 - 18, -r.h / 2 + 18); bubble.addChild(t); }
    }
    if (this.phase !== 'make' || !this.plan) return;
    // Marks.
    const markInto = (holder: Container, marks: readonly { by: Friend | 'both'; tool: Tool }[], size: number) => {
      const layer = holder.children[1] as Container;
      for (const c of layer.removeChildren()) c.destroy({ children: true });
      for (const m of marks.slice(0, 1)) {
        const color = m.by === 'both' ? swatch.purple.fill : FRIEND_SWATCH[m.by].fill;
        if (m.tool === 'roller') layer.addChild(new Graphics().roundRect(-size * 0.42, -size * 0.18, size * 0.84, size * 0.36, 12).fill({ color, alpha: 0.25 }));
        layer.addChild(stampArt(v.picture, size * 0.55, color));
      }
    };
    for (const f of FRIENDS) { const p = this.pageNodes[f]; if (p) markInto(p, table.marks[pageOf(f)], l.pages!.A.w); }
    this.cellNodes.forEach((c, i) => markInto(c, table.marks.banner.slice(i, i + 1), l.banner[i].w));
    // Tools.
    for (const t of this.toolNodes) {
      const at = this.toolSpot(t.tool, table);
      t.drag.home = at;
      t.both.visible = table.holder[t.tool] === 'both';
      t.node.scale.set(this.lifted === t.tool ? 1.15 : 1);
      t.drag.enabled = !this.busy && !this.done && (table.holder[t.tool] === 'tray' || table.holder[t.tool] === 'both');
      if (!t.drag.dragging) {
        if (animate) void this.ctx.tw.to(t.node, { x: at.x, y: at.y }, { duration: 0.3 });
        else t.node.position.set(at.x, at.y);
      }
    }
    // The strip.
    if (this.stripNode && l.strip) {
      for (const c of this.stripNode.removeChildren()) c.destroy({ children: true });
      let t = blankTable();
      const shownTrace = this.shown ? this.trace.slice(0, this.watchAt) : this.trace;
      shownTrace.forEach((a, i) => {
        const by = a.k === 'give' ? (a.to === 'both' ? 'both' : a.to) : a.k === 'pass' ? t.holder.pad === 'tray' ? null : (t.holder.pad as Friend) : a.k === 'stamp' ? (t.holder.pad === 'tray' ? null : t.holder.pad) : t.holder.roller === 'tray' ? null : t.holder.roller;
        const chip = chipArt(a.k, by, l.strip!.h);
        const step = l.strip!.h + 10;
        const n = shownTrace.length;
        chip.position.set(l.strip!.w / 2 - ((n - 1) * step) / 2 + i * step, l.strip!.h / 2);
        this.stripNode!.addChild(chip);
        t = replay(shownTrace.slice(0, i + 1));
      });
    }
    // Finish and Watch again, once every request on the plan is met.
    const ready = this.done && !this.shown;
    for (const b of [this.finishButton, this.againButton]) if (b) { b.visible = ready && !this.finished; b.eventMode = ready && !this.finished ? 'static' : 'none'; }
    for (const n of [...Object.values(this.pageNodes), ...this.cellNodes]) if (n) n.eventMode = this.done ? 'none' : 'static';
    for (const t of this.toolNodes) { t.node.visible = !this.done || !!this.shown; t.node.eventMode = this.done ? 'none' : 'static'; }
    if (this.undoButton) this.undoButton.alpha = this.level === 1 && this.trace.length === 0 ? 0.4 : 1;
  }

  private watchAt = 0;

  /** Where a tool sits: its tray slot, the holder's hand, or (held together) its tray slot with both friends' colours. */
  private toolSpot(tool: Tool, table: Table) {
    const l = this.layoutNow!;
    const h = table.holder[tool];
    if (h === 'A' || h === 'B') return centre(l.hands[h]);
    const slot = l.tray.length > 1 ? this.plan!.tools.indexOf(tool) : 0;
    return centre(l.tray[slot] ?? l.tray[0]);
  }

  // ——— The Plan phase ———

  private select(id: PlanId) {
    if (this.busy || this.finished) return;
    this.selected = id;
    sfx.tick();
    this.refresh();
  }

  /** Try it: the chosen card's first trace on a blank table; each request ticks or outlines. Free. */
  tryIt(): boolean | null {
    if (this.busy || this.finished || this.phase !== 'plan') return null;
    if (!this.selected) { this.nudgeCards(); return null; }
    const p = previewOf(planFor(this.selected, this.spec.cells, this.own), this.spec);
    this.previewed = this.selected;
    this.bubbleState = { A: p.met.A ? 'met' : 'unmet', B: p.met.B ? 'met' : 'unmet' };
    for (const f of FRIENDS) this.critters[f === 'A' ? 0 : 1]?.hop(p.met[f] ? 0.8 : 0.3);
    if (p.ok) { sfx.marimba(4, 0.35); void this.ctx.say('playdate.preview.ok'); }
    else {
      sfx.pluck(0, 0.2);
      void this.ctx.say('playdate.preview.own');
      if (this.tally.unmetPreview()) this.glowRequest = p.met.A ? 'B' : 'A';
    }
    this.refresh();
    return p.ok;
  }

  /** Make it: an accepted card starts the Make phase; a card that leaves a request out only previews. */
  makeIt() {
    if (this.busy || this.finished || this.phase !== 'plan') return;
    if (!this.selected) { this.nudgeCards(); return; }
    if (!previewOf(planFor(this.selected, this.spec.cells, this.own), this.spec).ok) { this.tryIt(); return; }
    this.enterMake(this.selected);
  }

  private enterMake(id: PlanId) {
    this.plan = planFor(id, this.spec.cells, this.own);
    this.phase = 'make';
    this.trace = [];
    this.lifted = null;
    this.hintCard = null;
    this.hintAction = null;
    this.done = false;
    sfx.whoosh();
    this.build();
  }

  /** Back to the cards with the chosen card still selected and the table blank. Free. */
  backToPlan() {
    if (this.busy || this.finished || this.level === 1) return;
    this.phase = 'plan';
    this.selected = this.plan?.id ?? this.selected;
    this.plan = null;
    this.trace = [];
    this.lifted = null;
    this.done = false;
    this.hintAction = null;
    this.petPicked = false;
    this.build();
  }

  private nudgeCards() {
    for (const c of this.cardNodes.values()) void this.ctx.tw.to(c, { rotation: 0.04 }, { duration: 0.1 }).then(() => this.alive ? this.ctx.tw.to(c, { rotation: 0 }, { duration: 0.15 }) : undefined);
    void this.ctx.say('playdate.hint.plan');
  }

  // ——— The Make phase ———

  private tapFriend(f: Friend) {
    if (this.busy || this.done || !this.plan) return;
    const table = this.table;
    const inTray = this.plan.tools.filter((t) => table.holder[t] === 'tray');
    const tool = this.lifted ?? (inTray.length === 1 ? inTray[0] : null);
    if (!tool) {
      this.critters[f === 'A' ? 0 : 1]?.poke();
      if (inTray.length > 1) for (const t of this.toolNodes) this.shake(t.node);
      return;
    }
    this.act(this.giveTo(tool, f), this.friendNodes[f]!);
  }

  /** A give to a friend, or to both at once when the plan rolls together. */
  private giveTo(tool: Tool, f: Friend): Action {
    const together = this.plan!.traces.some((t) => t.some((a) => a.k === 'give' && a.tool === tool && a.to === 'both'));
    return give(tool, together ? 'both' : f);
  }

  private tapTool(tool: Tool) {
    if (this.busy || this.done || !this.plan) return;
    const table = this.table;
    const h = table.holder[tool];
    const node = this.toolNodes.find((t) => t.tool === tool)!.node;
    if (h === 'tray') {
      this.lifted = this.lifted === tool ? null : tool;
      sfx.tick();
      this.refresh();
      if (this.lifted) void this.ctx.say('playdate.why.chooseFirst');
      return;
    }
    if (h === 'both') { this.act({ k: 'roll', surface: 'banner' }, node); return; }
    this.act({ k: 'pass', tool }, node);
  }

  private tapSurface(s: Surface, node: Container) {
    if (this.busy || this.done || !this.plan) return;
    this.act(this.markAction(s), node);
  }

  /** What a tap on a surface means: the owner's mark with what they hold; on the banner, the roller held together or the pad. */
  markAction(s: Surface): Action {
    const t = this.table;
    if (s === 'banner') {
      if (t.holder.roller === 'both') return { k: 'roll', surface: s };
      if (t.holder.pad !== 'tray') return { k: 'stamp', surface: s };
      if (t.holder.roller !== 'tray') return { k: 'roll', surface: s };
      return { k: this.plan?.tools.includes('pad') ? 'stamp' : 'roll', surface: s };
    }
    const owner: Friend = s === 'pageA' ? 'A' : 'B';
    if (t.holder.pad === owner) return { k: 'stamp', surface: s };
    if (t.holder.roller === owner) return { k: 'roll', surface: s };
    return { k: 'stamp', surface: s };
  }

  private dragMove(tn: ToolNode, x: number, y: number) {
    // Dragging the roller held together along the banner rolls the next cell it passes.
    if (this.busy || this.done || this.table.holder[tn.tool] !== 'both') return;
    const next = this.table.marks.banner.length;
    const r = this.layoutNow?.banner[next];
    if (r && x >= r.x && x <= r.x + r.w && y + 40 >= r.y && y - 40 <= r.y + r.h) this.act({ k: 'roll', surface: 'banner' }, this.cellNodes[next]);
  }

  private dragDrop(tn: ToolNode, x: number, y: number): boolean {
    if (this.busy || this.done || this.table.holder[tn.tool] !== 'tray') return false;
    const l = this.layoutNow!;
    for (const f of FRIENDS) {
      const near = [l.friends[f], l.hands[f]].some((r) => x >= r.x - 30 && x <= r.x + r.w + 30 && y >= r.y - 30 && y <= r.y + r.h + 30);
      if (near) { this.lifted = null; this.act(this.giveTo(tn.tool, f), this.friendNodes[f]!); return this.table.holder[tn.tool] !== 'tray'; }
    }
    return false;
  }

  /** An accepted action extends the trace; anything else is explained and changes nothing. Neither counts. */
  act(a: Action, node: Container | null): boolean {
    if (!this.plan || this.done) return false;
    if (!accepts(this.plan, this.trace, a)) {
      const why = whyNot(this.plan, this.trace, a, this.spec.cells);
      sfx.pluck(1, 0.18);
      if (node) this.shake(node);
      const speaker = this.speakerFor(a);
      if (speaker) this.critters[speaker === 'A' ? 0 : 1]?.hop(0.3);
      void this.ctx.say(`playdate.why.${why}` as LineId);
      return false;
    }
    const before = this.table;
    this.trace.push(a);
    this.lifted = null;
    this.hintAction = null;
    if (a.k === 'stamp' || a.k === 'roll') {
      const by = before.holder[a.k === 'stamp' ? 'pad' : 'roller'];
      if (a.k === 'stamp') sfx.marimba(by === 'B' ? 4 : 0, 0.45); else sfx.ratchet(2);
      if (by === 'A' || by === 'B') this.critters[by === 'A' ? 0 : 1]?.hop(0.7);
      else for (const c of this.critters) c.hop(0.6);
      if (node) { node.scale.set(0.92); void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 }); }
    } else sfx.whoosh();
    if (complete(this.plan, this.trace)) {
      this.done = true;
      sfx.tada();
      for (const c of this.critters) c.cheer();
      this.companion.hop(0.8);
    }
    this.refresh();
    return true;
  }

  /** The friend who explains a refusal: the page's owner, or the pad's holder. */
  private speakerFor(a: Action): Friend | null {
    if ((a.k === 'stamp' || a.k === 'roll') && a.surface !== 'banner') return a.surface === 'pageA' ? 'A' : 'B';
    const h = this.table.holder.pad;
    return h === 'A' || h === 'B' ? h : null;
  }

  private shake(node: Container) {
    const x = node.x;
    void this.ctx.tw.to(node, { x: x + 10 }, { duration: 0.06 })
      .then(() => this.alive ? this.ctx.tw.to(node, { x: x - 8 }, { duration: 0.08 }) : undefined)
      .then(() => this.alive ? this.ctx.tw.to(node, { x }, { duration: 0.08 }) : undefined);
  }

  /** Undo one accepted action; at an empty trace, back to the cards (disabled at level 1). Free. */
  undo() {
    if (this.busy || this.finished || this.phase !== 'make') return;
    if (this.trace.length === 0) { this.backToPlan(); return; }
    this.trace.pop();
    this.done = false;
    this.lifted = null;
    this.hintAction = null;
    sfx.whoosh();
    this.refresh();
  }

  // ——— Help ———

  hintLabel = 'Show a hint';

  /** The lightbulb: the next useful card or step glows and its line is spoken; one hint for the current decision, the first time. */
  askForHint() {
    if (this.busy || this.finished || this.done) return;
    this.tally.help(decisionNow(this.level, this.phase, this.trace));
    const h = hintFor(this.spec, this.own, this.phase, this.selected, this.plan, this.trace);
    if (!h) return;
    if ('card' in h) {
      this.hintCard = h.card;
      this.selected = h.card;
      this.refresh();
      void this.ctx.say('playdate.hint.plan');
    } else {
      this.hintAction = h.action;
      void this.ctx.say(`playdate.hint.${h.action.k}` as LineId);
    }
  }

  /**
   * The pet button. Plan phase: the pet picks an accepted card (one hint for *plan*); pressed again, it makes it too (Help me
   * make it). Make phase: at level 1's empty table it picks who gets the pad first (*plan*); otherwise it makes the rest (*make*).
   */
  petHelp() {
    if (this.busy || this.finished || this.done) return;
    this.companion.hop(0.8);
    if (this.phase === 'plan') {
      if (this.petPicked && this.selected) { this.enterMake(this.selected); void this.petMakes(); return; }
      this.tally.help('plan');
      const ok = acceptedPlans(this.spec, this.own);
      this.selected = ok[Math.floor(this.ctx.rng.next() * ok.length)];
      this.petPicked = true;
      this.refresh();
      void this.ctx.say('playdate.pet.pick');
      return;
    }
    if (this.level === 1 && this.trace.length === 0) {
      this.tally.help('plan');
      void this.ctx.say('playdate.pet.first');
      this.act(give('pad', this.ctx.rng.next() < 0.5 ? 'A' : 'B'), null);
      return;
    }
    void this.petMakes();
  }

  private async petMakes() {
    if (!this.plan) return;
    this.tally.help('make');
    this.busy = true;
    this.lifted = null;
    this.hintAction = null;
    this.refresh();
    const epoch = this.epoch;
    void this.ctx.say('playdate.pet.make');
    while (this.alive && epoch === this.epoch && !this.done) {
      await this.ctx.tw.wait(PET_STEP);
      if (!this.alive || epoch !== this.epoch) return;
      const a = nextStep(this.plan, this.trace);
      if (!a) break;
      this.companion.hop(0.4);
      this.busy = false;
      this.act(a, this.nodeFor(a));
      this.busy = true;
    }
    this.busy = false;
    this.refresh();
  }

  /** Start again: a blank table (the cards at levels 2–3), keeping the round's hints. */
  restart() {
    if (this.finished || this.busy) return;
    this.trace = [];
    this.done = false;
    this.lifted = null;
    this.hintAction = this.hintCard = null;
    this.bubbleState = { A: 'none', B: 'none' };
    this.petPicked = false;
    if (this.level > 1) { this.phase = 'plan'; this.plan = null; this.selected = null; }
    this.build();
  }

  // ——— Finishing ———

  private async finishRound() {
    if (this.finished || !this.done || this.busy) return;
    this.finished = true;
    this.busy = true;
    this.refresh();
    const epoch = this.epoch;
    sfx.bell(4, 0.3);
    for (const c of this.critters) c.cheer();
    this.companion.cheer();
    for (const n of [...Object.values(this.pageNodes), ...this.cellNodes]) if (n) void this.ctx.tw.to(n.scale, { x: 1.12, y: 1.12 }, { duration: 0.4 });
    await this.ctx.say('playdate.done');
    if (!this.alive || epoch !== this.epoch) return;
    await this.ctx.tw.wait(1.2);
    if (!this.alive) return;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  /** Watch again: the trace replayed from a blank table. Free. */
  private async watchAgain() {
    if (!this.done || this.busy || this.finished) return;
    this.busy = true;
    const epoch = this.epoch;
    for (let i = 0; i <= this.trace.length; i++) {
      this.watchAt = i;
      this.shown = replay(this.trace.slice(0, i));
      this.refresh();
      if (i > 0) { const a = this.trace[i - 1]; if (a.k === 'stamp') sfx.marimba(2, 0.35); else if (a.k === 'roll') sfx.ratchet(2); else sfx.whoosh(); }
      await this.ctx.tw.wait(WATCH_STEP);
      if (!this.alive || epoch !== this.epoch) return;
    }
    this.shown = null;
    this.busy = false;
    this.refresh();
  }

  // ——— Glow and ghost finger ———

  /** The object a finger touches to do an action. */
  nodeFor(a: Action): Container | null {
    const t = this.table;
    if (a.k === 'give') {
      const inTray = this.plan?.tools.filter((x) => t.holder[x] === 'tray') ?? [];
      if (inTray.length > 1 && this.lifted !== a.tool) return this.toolNodes.find((n) => n.tool === a.tool)?.node ?? null;
      return this.friendNodes[a.to === 'both' ? 'A' : a.to] ?? null;
    }
    if (a.k === 'pass') return this.toolNodes.find((n) => n.tool === a.tool)?.node ?? null;
    if (a.surface === 'banner') return this.cellNodes[t.marks.banner.length] ?? null;
    return this.pageNodes[a.surface === 'pageA' ? 'A' : 'B'] ?? null;
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.finished || !this.layoutNow) return;
    const pulse = 8 + 3 * Math.sin(this.clock * 5);
    const ring = (n: Container | null | undefined, w: number, h: number) => {
      if (!n) return;
      const p = n.getGlobalPosition();
      const q = this.board.toLocal(p);
      this.glow.roundRect(q.x - w / 2 - pulse, q.y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 26).stroke({ width: 7, color: swatch.yellow.fill });
    };
    if (this.glowRequest && this.phase === 'plan') { const r = this.layoutNow.bubbles[this.glowRequest]; ring(this.bubbleNodes[this.glowRequest], r.w, r.h); }
    if (this.phase === 'plan' && this.hintCard) { const r = this.layoutNow.cards[0]; ring(this.cardNodes.get(this.hintCard), r.w, r.h); }
    if (this.phase === 'make' && this.hintAction && !this.busy) {
      const n = this.nodeFor(this.hintAction);
      const b = n?.getLocalBounds();
      if (n && b) ring(n, Math.max(110, b.width), Math.max(110, b.height));
    }
  }

  /** The demonstration's own order (level 1 gives the pad to the right friend; level 3 lifts the roller onto the right friend). */
  private demoTrace(): readonly Action[] | null {
    if (!this.plan) return null;
    if (this.plan.id === 'stampPass') return this.plan.traces.find((t) => t[0].k === 'give' && t[0].to === 'B') ?? null;
    if (this.plan.id === 'side') return this.plan.traces.find((t) => t[0].k === 'give' && t[0].tool === 'roller' && t[0].to === 'B' && t[1].k === 'give' && t[2].k === 'stamp') ?? null;
    return null;
  }

  /** The ghost finger, per the definition: the demonstration order at each level, then Finish. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    if (this.phase === 'plan') {
      const want: PlanId = this.level === 2 ? 'turns' : this.previewed === 'justBanner' || this.previewed === 'side' ? 'side' : 'justBanner';
      if (this.selected !== want) { const c = this.cardNodes.get(want); return c ? { tap: { on: c } } : null; }
      if (this.level === 3 && want === 'justBanner') return this.tryButton ? { tap: { on: this.tryButton }, pause: 1.6 } : null;
      if (this.level === 2 && this.previewed !== 'turns') return this.tryButton ? { tap: { on: this.tryButton }, pause: 1.2 } : null;
      return this.makeButton ? { tap: { on: this.makeButton } } : null;
    }
    if (this.done) return this.finishButton ? { tap: { on: this.finishButton } } : null;
    const demo = this.demoTrace();
    const onDemo = demo && this.trace.every((a, i) => demo[i] && a.k === demo[i].k && JSON.stringify(a) === JSON.stringify(demo[i]));
    const a = onDemo ? demo![this.trace.length] : this.plan ? nextStep(this.plan, this.trace) : null;
    if (!a) return null;
    if (a.k === 'give') {
      const inTray = this.plan!.tools.filter((x) => this.table.holder[x] === 'tray');
      const tool = this.toolNodes.find((n) => n.tool === a.tool);
      const friend = this.friendNodes[a.to === 'both' ? 'A' : a.to];
      if (inTray.length > 1 && tool && friend) return { drag: { on: tool.node }, to: { on: friend } };
      return friend ? { tap: { on: friend } } : null;
    }
    const n = this.nodeFor(a);
    return n ? { tap: { on: n } } : null;
  }
}

class WorkshopIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: a banner with stamped pictures. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(['sun', 'sea', 'leaf'] as BannerTheme[]), rng.pick(['star', 'flower', 'fish'] as StampPicture[]));
}

export const playdateWorkshop: GameModule = {
  id: 'playdate-workshop',
  name: 'Playdate Workshop',
  titleLine: 'game.playdate-workshop',
  region: 'story-grove',
  challenge: 'logic',
  skills: ['taking turns', 'listening', 'planning', 'shared goals'],
  bands: ['preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => specFor(level).describe,
  music: STYLES.stickers,
  coplayHint: 'One of you is the planner and points to a card and says why; the other is the maker and gives, stamps and passes. Swap next round.',
  offScreen: 'With two toys and one crayon, act out taking turns to make two pictures with {name}. Either of you can say no thanks.',
  hubIcon: () => new WorkshopIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new PlaydateWorkshop(ctx),
};

