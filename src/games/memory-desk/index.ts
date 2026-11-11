/**
 * Memory Desk: a toy desk with a tray, a drawer and a window. Level 1, *Keep one*: tap a picture onto the tray, Keep
 * copies it into the drawer, change the tray, and Show copies the drawer into the window: the kept one, not the new one.
 * A free try-out round; nothing is ever wrong. Rules: ./logic.ts; definition: docs/definitions/memory-desk.md.
 */
import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { hinted, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { finish, RoundButton, spring, squash } from '../../ui/buttons';
import { checkIcon, undoIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { actionIcon, iconArt, panelArt, slotArt, stickerArt, tokenArt, type PanelKind } from './art';
import {
  ACTION,
  apply,
  briefFor,
  BUTTON_R,
  CARD,
  centre,
  contrastSeen,
  deskLayout,
  describeLevel,
  LEVELS,
  nextMove,
  PANEL,
  stateAfter,
  TOKENS,
  type Action,
  type Brief,
  type DeskLayout,
  type Event,
  type Move,
  type Rect,
  type State,
  type Token,
} from './logic';

const FLY = 0.45;
const POINT = 1.8;
/** Where a token sits in its panel, below the picture label. */
const SLOT_DY = 12;
const SLOTS: readonly PanelKind[] = ['tray', 'drawer', 'window'];
const KEY: Record<PanelKind, keyof State> = { tray: 'input', drawer: 'stored', window: 'output' };
const TOKEN_LINE: Record<Token, LineId> = {
  shell: 'md.token.shell',
  leaf: 'md.token.leaf',
  star: 'md.token.star',
  acorn: 'md.token.acorn',
  feather: 'md.token.feather',
  pebble: 'md.token.pebble',
};
type Step = 'card' | 'keep' | 'other' | 'show';
/** What a dim Done says (try) and what Help says (help) for the next control toward the contrast. */
const NUDGE: Record<'try' | 'help', Record<Step, LineId>> = {
  try: { card: 'md.try-card', keep: 'md.try-keep', other: 'md.try-other', show: 'md.try-show' },
  help: { card: 'md.help.card', keep: 'md.help.keep', other: 'md.help.other', show: 'md.help.show' },
};

class MemoryDesk implements Game {
  readonly brief: Brief;
  /** Every press that changed the desk, oldest first; Undo takes the last one back. */
  history: Event[] = [];
  readonly tally = newTally();
  finished = false;
  busy = false;
  hintLabel = 'Help me';

  private readonly root = new Container();
  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private layout: DeskLayout;
  private clock = 0;

  cardNodes: Container[] = [];
  keepButton: Container | null = null;
  showButton: Container | null = null;
  doneButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  private holders: Partial<Record<PanelKind, Container>> = {};
  /** A copy on its way from one panel to the next. */
  fly: { node: Container; from: { x: number; y: number }; to: { x: number; y: number }; t: number } | null = null;
  /** The control Help or a dim Done is pointing at, and for how much longer. */
  pointing: { node: Container; rect: Rect; left: number; y: number } | null = null;
  private said = { kept: false, shown: false, still: false };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.layout = deskLayout(ctx.level, ctx.view);
    this.backdrop = new Backdrop(
      { sky: [0xd9ecff, 0xfff6e0], hills: [0xc5e7a8, 0xa9e0d6], horizon: 0.62, clouds: 2, sun: false, seed: 412 },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.root.addChild(this.backdrop, this.board, this.glow);
    ctx.stage.addChild(this.root);
  }

  get state(): State {
    return stateAfter(this.history);
  }

  /** Whether the window has shown the kept token beside a different tray. */
  get contrast(): boolean {
    return contrastSeen(this.history);
  }

  start() {
    this.build();
    void this.ctx.instruct('md.instruct.1');
  }

  resize(v: View) {
    if (this.root.destroyed) return;
    this.view = v;
    this.backdrop.resize(v);
    if (this.cardNodes.length) this.build();
  }

  destroy() {
    this.root.destroy({ children: true });
  }

  // ——— Drawing ———

  private build() {
    this.fly = null;
    this.pointing = null;
    for (const h of Object.values(this.holders)) this.ctx.tw.kill(h.scale);
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    const l = (this.layout = deskLayout(this.ctx.level, this.view));
    this.holders = {};
    for (const kind of SLOTS) {
      const at = centre(l[kind]);
      const panel = panelArt(kind, PANEL);
      const holder = new Container();
      holder.eventMode = 'none';
      holder.y = SLOT_DY;
      this.holders[kind] = holder;
      this.place(at, panel, holder);
    }
    this.cardNodes = this.brief.tokens.map((token, i) => {
      const at = centre(l.cards[i]);
      const card = new Container();
      card.addChild(finish({ w: CARD, h: CARD, corner: 22 }, swatch.white, cream), tokenArt(token, 34));
      onTap(card, () => {
        squash(card);
        spring(card, 90);
        this.act({ kind: 'set', token });
      });
      this.place(at, card);
      return card;
    });
    const action = (kind: 'keep' | 'show', r: Rect) => {
      const at = centre(r);
      const b = new Container();
      b.addChild(
        finish({ w: ACTION.w, h: ACTION.h, corner: 26 }, kind === 'keep' ? swatch.yellow : swatch.teal),
        actionIcon(kind),
      );
      onTap(
        b,
        () => {
          squash(b);
          spring(b, 90);
          this.act({ kind });
        },
        { cooldown: 200 },
      );
      this.place(at, b);
      return b;
    };
    this.keepButton = action('keep', l.keep);
    this.showButton = action('show', l.show);
    this.undoButton = new RoundButton(undoIcon(), swatch.yellow, BUTTON_R, () => this.undo());
    this.place(centre(l.undo), this.undoButton);
    this.doneButton = new RoundButton(checkIcon(), swatch.green, BUTTON_R, () => this.done());
    this.place(centre(l.done), this.doneButton);
    this.settle();
  }

  /**
   * Puts parts on the board at `at`, at the layout's scale. The scale is on a wrapper, because a pressed button's squash
   * and spring set its own scale outright.
   */
  private place(at: { x: number; y: number }, ...parts: Container[]) {
    const wrap = new Container();
    wrap.position.set(at.x, at.y);
    wrap.scale.set(this.layout.scale);
    wrap.addChild(...parts);
    this.board.addChild(wrap);
  }

  /** Where a panel's token sits, on the board. */
  private slotAt(kind: PanelKind) {
    const at = centre(this.layout[kind]);
    return { x: at.x, y: at.y + SLOT_DY * this.layout.scale };
  }

  /** A slot a copy is still sliding into shows what it had until the copy lands. The settled picture: nothing in flight, every panel showing the desk's state, Done lit or dim. */
  private settle() {
    if (this.fly) {
      this.fly.node.destroy({ children: true });
      this.fly = null;
    }
    this.draw(this.state);
    if (this.doneButton) this.doneButton.alpha = this.contrast ? 1 : 0.45;
    if (this.undoButton) this.undoButton.alpha = this.history.length ? 1 : 0.45;
  }

  private draw(s: State) {
    for (const kind of SLOTS) {
      const holder = this.holders[kind];
      if (!holder) continue;
      for (const c of holder.removeChildren()) c.destroy({ children: true });
      holder.addChild(slotArt(s[KEY[kind]], 38));
      holder.scale.set(1);
    }
  }

  private nodeFor(m: Move): { node: Container; rect: Rect } | null {
    const l = this.layout;
    if (m === 'keep') return this.keepButton && { node: this.keepButton, rect: l.keep };
    if (m === 'show') return this.showButton && { node: this.showButton, rect: l.show };
    if (m === 'done') return this.doneButton && { node: this.doneButton, rect: l.done };
    return this.cardNodes[m.card] ? { node: this.cardNodes[m.card], rect: l.cards[m.card] } : null;
  }

  /** The named control hops under a glowing ring for a moment. */
  private point(m: Move) {
    this.unpoint();
    const at = this.nodeFor(m);
    if (at) this.pointing = { ...at, left: POINT, y: at.node.y };
  }

  private unpoint() {
    if (this.pointing && !this.pointing.node.destroyed) this.pointing.node.y = this.pointing.y;
    this.pointing = null;
  }

  // ——— Presses ———

  /** One press on the desk. Nothing here is ever a miss. */
  private act(a: Action) {
    if (this.finished || this.busy) return;
    this.settle();
    this.unpoint();
    const before = this.state;
    if (a.kind === 'keep' && before.input === null) {
      sfx.pluck(0);
      void this.ctx.say('md.tray-first');
      this.point({ card: 0 });
      return;
    }
    const had = this.contrast;
    const after = apply(before, a);
    this.history.push({ action: a, before, after });
    if (this.undoButton) this.undoButton.alpha = 1;
    if (a.kind === 'set') {
      sfx.pop(2 + TOKENS.indexOf(a.token));
      this.draw(after);
      this.popIn('tray');
      void this.ctx.say(TOKEN_LINE[a.token]);
      return;
    }
    if (a.kind === 'show' && after.output === null) {
      sfx.pluck(0);
      this.draw(after);
      void this.ctx.say('md.nothing-kept');
      return;
    }
    // A copy slides across; the place it came from keeps its own.
    const [from, to]: [PanelKind, PanelKind] = a.kind === 'keep' ? ['tray', 'drawer'] : ['drawer', 'window'];
    sfx.pluck(a.kind === 'keep' ? 4 : 7);
    const copy = slotArt(after[KEY[to]], 38);
    const p = this.slotAt(from);
    const q = this.slotAt(to);
    copy.position.copyFrom(p);
    copy.scale.set(this.layout.scale);
    copy.eventMode = 'none';
    this.board.addChild(copy);
    this.fly = { node: copy, from: p, to: q, t: 0 };
    void this.ctx.say(this.lineAfter(a.kind, had));
    if (this.contrast && this.doneButton) this.doneButton.alpha = 1;
  }

  private lineAfter(kind: 'keep' | 'show', had: boolean): LineId {
    if (!had && this.contrast && !this.said.still) {
      this.said.still = true;
      return 'md.still-there';
    }
    return kind === 'keep' ? 'md.kept' : 'md.shown';
  }

  private popIn(kind: PanelKind) {
    const holder = this.holders[kind];
    if (!holder) return;
    holder.scale.set(0.6);
    void this.ctx.tw.to(holder.scale, { x: 1, y: 1 }, { duration: 0.22, ease: ease.outBack });
  }

  /** Take back the last press. Never counted. */
  undo() {
    if (this.finished || this.busy || !this.history.length) return;
    this.unpoint();
    this.history.pop();
    this.settle();
  }

  /** The pause sheet's Start again: an empty desk. Never counted. */
  restart() {
    if (this.finished || this.busy) return;
    this.unpoint();
    this.history = [];
    this.settle();
  }

  /** The tick. Dim until the contrast has been seen: then it says the next thing to try, and that is not a miss. */
  done() {
    if (this.finished || this.busy) return;
    this.settle();
    if (!this.contrast) {
      const m = nextMove(this.brief, this.history);
      this.point(m);
      void this.ctx.say(this.tryLine(m, 'try'));
      return;
    }
    void this.celebrate();
  }

  private tryLine(m: Move, kind: 'try' | 'help'): LineId {
    if (m === 'done') return 'md.help.done';
    const step = m === 'keep' || m === 'show' ? m : this.state.stored === null ? 'card' : 'other';
    return NUDGE[kind][step];
  }

  private async celebrate() {
    this.busy = true;
    this.unpoint();
    sfx.tada();
    this.ctx.pet.cheer();
    for (const kind of SLOTS) {
      const at = this.slotAt(kind);
      this.ctx.particles.burst(at.x, at.y - 30, {
        colors: [swatch.yellow.fill, swatch.teal.fill, 0xffffff],
        count: 8,
      });
    }
    await this.ctx.say('md.done');
    if (!this.ctx.alive) return;
    this.finished = true;
    this.ctx.finish(tally(this.tally));
  }

  /** The pet's Help: one hint a press. The next control toward the contrast hops. */
  askForHint() {
    if (this.finished || this.busy) return;
    this.settle();
    const m = nextMove(this.brief, this.history);
    // Once the contrast has been seen there is nothing left to hint at: pointing at the tick is free.
    if (m !== 'done') hinted(this.tally);
    this.point(m);
    void this.ctx.say(this.tryLine(m, 'help'));
  }

  update(dt: number) {
    if (this.root.destroyed) return;
    this.clock += dt;
    if (this.fly) {
      const f = this.fly;
      f.t = Math.min(1, f.t + dt / FLY);
      const k = ease.outQuad(f.t);
      f.node.position.set(f.from.x + (f.to.x - f.from.x) * k, f.from.y + (f.to.y - f.from.y) * k - Math.sin(k * Math.PI) * 26 * this.layout.scale);
      if (f.t >= 1) this.settle();
    }
    this.glow.clear();
    const p = this.pointing;
    if (!p) return;
    p.left -= dt;
    if (p.left <= 0 || p.node.destroyed) return this.unpoint();
    p.node.y = p.y - Math.abs(Math.sin((POINT - p.left) * 7)) * 12 * Math.min(1, p.left);
    const m = 8 + 3 * Math.sin(this.clock * 6);
    this.glow
      .roundRect(p.rect.x - m, p.rect.y - m, p.rect.w + 2 * m, p.rect.h + 2 * m, 34 * this.layout.scale)
      .stroke({ width: 8, color: swatch.yellow.fill });
  }

  /** The ghost finger: a picture, Keep, the other picture, Show, then the tick. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.fly || !this.cardNodes.length) return null;
    const at = this.nodeFor(nextMove(this.brief, this.history));
    return at ? { tap: { on: at.node } } : null;
  }
}

/** A seeded token in the drawer. */
function sticker(seed: number): Container {
  return stickerArt(new Rng(seed).pick(TOKENS));
}

export const game: GameModule = {
  id: 'memory-desk',
  upright: true,
  name: 'Memory Desk',
  titleLine: 'game.memory-desk',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: ['systems', 'logic', 'testing'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.lullaby,
  coplayHint: 'One of you changes the tray; the other says what the window will show before pressing Show.',
  offScreen:
    'Put a toy in a box and close the lid, hold up a different toy, and ask "what is in the box?" before opening it.',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker,
  create: (ctx) => new MemoryDesk(ctx),
};
