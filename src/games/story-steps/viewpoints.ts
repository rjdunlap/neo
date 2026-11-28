import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { viewpointsLayout } from './layout';
import { theaterSymbol } from './theater-art';
import {
  canFinishViewpoints,
  canWatchViewpoints,
  nextViewpointsAction,
  viewpointsRound,
  watchConsequence,
  type Heard,
  type ViewpointsAction,
  type ViewpointsEnding,
  type ViewpointsRole,
  type ViewpointsRound,
} from './theater-logic';
import { viewpointsScene, viewpointsSymbol } from './viewpoints-art';

const NAMES = { bunny: 'Bunny', bear: 'Bear' } as const;
const ENDING_TEXT: Record<ViewpointsEnding, string> = {
  'stay-loud': 'Stay by the horn',
  'turn-off': 'Turn it off',
  'two-spots': 'Two spots',
  'soft-spot': 'Shady hill',
};

/** Story Theater level 14: hear two friends' own words about one event, then watch an ending that keeps both wishes. */
export class ViewpointsGame implements Game {
  readonly round: ViewpointsRound;
  heard: Heard = { music: false, quiet: false };
  draft: ViewpointsEnding | null = null;
  readonly watched: ViewpointsEnding[] = [];
  readonly friends: { role: ViewpointsRole; node: Container; tick: Container }[] = [];
  readonly endings: { ending: ViewpointsEnding; node: Container }[] = [];
  readonly showButton = new Container();
  readonly undoButton = new Container();
  readonly helpButton = new Container();
  readonly finishButton = new Container();
  private readonly background = new Graphics();
  private readonly stage = new Container();
  private readonly selection = new Graphics();
  private readonly helpGlow = new Graphics();
  private readonly title = label('Story Theater', 30, ink);
  private readonly caption = label('Tap both friends to hear them', 23, ink);
  private previous: ViewpointsEnding | null = null;
  private helped: Container | null = null;
  private pulsed: Container | null = null;
  private autoGlow = false;
  private shown: ViewpointsEnding | null = null;
  private cue = 0;
  private clock = 0;
  private alive = true;
  playing = false;
  finished = false;
  misses = 0;
  hints = 0;

  constructor(private readonly ctx: GameContext) {
    this.round = viewpointsRound(ctx.rng);
    for (const who of ['bunny', 'bear'] as const) {
      const role: ViewpointsRole = who === this.round.musicFriend ? 'music' : 'quiet';
      const node = new Container();
      node.hitArea = new Rectangle(-90, -53, 180, 106);
      const portrait = theaterSymbol(who);
      portrait.scale.set(0.7);
      portrait.position.set(-38, -2);
      const bubble = viewpointsSymbol('speak');
      bubble.scale.set(0.55);
      bubble.position.set(40, -16);
      const name = label(NAMES[who], 18, ink);
      name.position.set(40, 26);
      const tick = viewpointsSymbol('heard');
      tick.scale.set(0.45);
      tick.position.set(72, -34);
      tick.visible = false;
      node.addChild(tile(180, 106, 'blue'), portrait, bubble, name, tick);
      onTap(node, () => this.hear(role));
      this.friends.push({ role, node, tick });
    }
    for (const ending of this.round.order) {
      const node = new Container();
      node.hitArea = new Rectangle(-78, -53, 156, 106);
      const art = viewpointsSymbol(ending);
      art.scale.set(0.72);
      art.y = -12;
      const text = label(ENDING_TEXT[ending], 16, ink);
      text.y = 34;
      node.addChild(tile(156, 106, 'purple'), art, text);
      onTap(node, () => this.choose(ending));
      this.endings.push({ ending, node });
    }
    for (const [node, symbol, text, action] of [
      [this.showButton, 'show', 'Watch', () => void this.watch()],
      [this.undoButton, 'undo', 'Undo', () => this.undo()],
      [this.helpButton, 'help', 'Help', () => this.askForHint()],
      [this.finishButton, 'finish', 'Take a bow', () => this.finish()],
    ] as const) {
      const art = theaterSymbol(symbol);
      art.scale.set(0.7);
      art.y = -12;
      const textNode = label(text, 19, ink);
      textNode.y = 34;
      node.addChild(tile(148, 106, symbol === 'finish' ? 'teal' : 'yellow'), art, textNode);
      node.hitArea = new Rectangle(-74, -53, 148, 106);
      onTap(node, action);
    }
    for (const node of [this.background, this.selection, this.helpGlow, this.title, this.caption, this.stage])
      node.eventMode = 'none';
    ctx.stage.addChild(
      this.background,
      this.title,
      this.stage,
      this.caption,
      ...this.friends.map((f) => f.node),
      ...this.endings.map((e) => e.node),
      this.showButton,
      this.undoButton,
      this.helpButton,
      this.finishButton,
      this.selection,
      this.helpGlow,
    );
    this.resize(ctx.view);
  }
  start() {
    void this.ctx.instruct('viewpoints.start');
  }
  private friendFor(role: ViewpointsRole) {
    return this.friends.find((f) => f.role === role)!.node;
  }
  private vars() {
    const { musicFriend, quietFriend } = this.round;
    return { musicFriend: NAMES[musicFriend], quietFriend: NAMES[quietFriend] };
  }
  hear(role: ViewpointsRole) {
    if (!this.alive || this.playing || this.finished) return;
    this.heard = { ...this.heard, [role]: true };
    if (this.pulsed === this.friendFor(role)) this.pulsed = null;
    sfx.tick();
    this.draw();
    const who = role === 'music' ? this.round.musicFriend : this.round.quietFriend;
    void this.ctx.say(`viewpoints.account.${role}`, { friend: NAMES[who] });
  }
  choose(ending: ViewpointsEnding) {
    if (!this.alive || this.playing || this.finished) return;
    if (ending !== this.draft) {
      this.previous = this.draft;
      this.draft = ending;
      this.shown = null;
      this.helped = null;
      sfx.tick();
      this.draw();
    }
    void this.ctx.say(`viewpoints.pick.${ending}`);
  }
  private undo() {
    if (!this.alive || this.playing || this.finished || this.previous === null) return;
    this.draft = this.previous;
    this.previous = null;
    this.shown = null;
    this.helped = null;
    sfx.tick();
    this.draw();
    void this.ctx.say('viewpoints.undo');
  }
  private async watch() {
    if (!this.alive || this.playing || this.finished) return;
    if (!this.heard.music || !this.heard.quiet) {
      this.pulsed = this.friendFor(this.heard.music ? 'quiet' : 'music');
      void this.ctx.say('viewpoints.hearfirst');
      return;
    }
    if (!canWatchViewpoints(this.heard, this.draft)) {
      void this.ctx.say('viewpoints.pickfirst');
      return;
    }
    const ending = this.draft!;
    const result = watchConsequence(ending, this.watched);
    this.playing = true;
    this.helped = null;
    this.shown = ending;
    sfx.tick();
    const script: LineId[] = ['viewpoints.scene.mishap', 'viewpoints.scene.both', `viewpoints.end.${ending}`];
    for (let i = 0; i < script.length; i++) {
      if (!this.alive) return;
      this.cue = i;
      this.draw();
      await this.ctx.say(script[i], this.vars());
      if (!this.alive) return;
      await this.ctx.tw.wait(0.4);
    }
    if (!this.alive) return;
    if (!this.watched.includes(ending)) this.watched.push(ending);
    this.playing = false;
    if (result.accepted) {
      this.autoGlow = false;
      this.draw();
      void this.ctx.instruct('viewpoints.ready');
      return;
    }
    // The friend whose wish was missed is named, and their card pulses so she can hear it again.
    const unmet: ViewpointsRole = result.verdict === 'unmet-quiet' ? 'quiet' : 'music';
    this.pulsed = this.friendFor(unmet);
    if (result.miss) {
      this.misses++;
      sfx.boing();
      if (this.misses === 2) {
        this.hints++;
        this.autoGlow = true;
      }
      const who = unmet === 'quiet' ? this.round.quietFriend : this.round.musicFriend;
      void this.ctx.say('viewpoints.miss', { unmetFriend: NAMES[who] });
    }
    this.draw();
  }
  askForHint() {
    if (!this.alive || this.playing || this.finished) return;
    this.hints++;
    const action = nextViewpointsAction(this.heard, this.draft, this.watched);
    this.helped = this.targetFor(action);
    this.drawGlow();
    const line: LineId =
      action.kind === 'hear'
        ? 'viewpoints.help.hear'
        : action.kind === 'choose'
          ? 'viewpoints.help.choose'
          : action.kind === 'show'
            ? 'viewpoints.help.show'
            : 'viewpoints.help.bow';
    void this.ctx.say(line);
  }
  private finish() {
    if (!this.alive || this.playing || this.finished) return;
    if (!canFinishViewpoints(this.heard, this.draft, this.watched)) {
      void this.ctx.say('viewpoints.bowfirst');
      return;
    }
    this.finished = true;
    this.drawGlow();
    sfx.bell(8, 0.3);
    void this.ctx.say('viewpoints.done').then(() => {
      if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
    });
  }
  private targetFor(action: ViewpointsAction): Container {
    return action.kind === 'hear'
      ? this.friendFor(action.role)
      : action.kind === 'choose'
        ? this.endings.find((e) => e.ending === action.ending)!.node
        : action.kind === 'show'
          ? this.showButton
          : this.finishButton;
  }
  private drawStage() {
    this.stage.removeChildren().forEach((c) => c.destroy({ children: true }));
    const ending = this.playing || this.shown ? this.shown : null;
    const cue = this.playing ? this.cue : ending ? 2 : 0;
    this.stage.addChild(viewpointsScene({ ...this.round, ending, cue }));
    this.caption.text = this.playing
      ? ['Once upon a picnic…', 'Two friends, two wishes…', 'And here is what happened!'][this.cue]
      : canFinishViewpoints(this.heard, this.draft, this.watched)
        ? 'Both wishes kept! Take a bow, or try the other ending.'
        : !this.heard.music || !this.heard.quiet
          ? 'Tap both friends to hear what each one says.'
          : 'Choose an ending, then watch it.';
  }
  private draw() {
    this.drawStage();
    this.drawGlow();
    for (const f of this.friends) f.tick.visible = this.heard[f.role];
    this.showButton.alpha = canWatchViewpoints(this.heard, this.draft) && !this.playing ? 1 : 0.55;
    this.undoButton.alpha = this.previous !== null && !this.playing ? 1 : 0.55;
    this.finishButton.alpha =
      canFinishViewpoints(this.heard, this.draft, this.watched) && !this.playing ? 1 : 0.55;
  }
  private drawGlow() {
    this.selection.clear();
    this.helpGlow.clear();
    if (this.finished) return;
    for (const e of this.endings)
      if (this.draft === e.ending)
        this.selection
          .roundRect(e.node.x - 81, e.node.y - 56, 162, 112, 20)
          .stroke({ width: 5, color: swatch.teal.line });
    const glow = (node: Container) => {
      const h = node.hitArea as Rectangle;
      this.helpGlow
        .roundRect(node.x + h.x - 5, node.y + h.y - 5, h.width + 10, h.height + 10, 20)
        .stroke({ width: 6, color: swatch.yellow.line });
    };
    if (this.helped) glow(this.helped);
    if (this.pulsed) glow(this.pulsed);
    if (this.autoGlow && !this.helped) glow(this.endings.find((e) => e.ending === 'two-spots')!.node);
  }
  resize(v: View) {
    const L = viewpointsLayout(v);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.light);
    this.title.position.set(L.title.x, L.title.y);
    this.stage.position.set(L.stage.x, L.stage.y);
    this.stage.scale.set(L.stageScale);
    this.caption.position.set(L.caption.x, L.caption.y);
    this.friends.forEach((f, i) => {
      f.node.position.set(L.friends[i].x, L.friends[i].y);
      f.node.hitArea = new Rectangle(
        -L.friends[i].w / 2,
        -L.friends[i].h / 2,
        L.friends[i].w,
        L.friends[i].h,
      );
    });
    this.endings.forEach((e, i) => {
      e.node.position.set(L.endings[i].x, L.endings[i].y);
      e.node.hitArea = new Rectangle(
        -L.endings[i].w / 2,
        -L.endings[i].h / 2,
        L.endings[i].w,
        L.endings[i].h,
      );
    });
    [this.showButton, this.undoButton, this.helpButton, this.finishButton].forEach((node, i) => {
      node.position.set(L.buttons[i].x, L.buttons[i].y);
      node.hitArea = new Rectangle(-L.buttons[i].w / 2, -L.buttons[i].h / 2, L.buttons[i].w, L.buttons[i].h);
    });
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.playing || this.finished) return null;
    return {
      tap: { on: this.targetFor(nextViewpointsAction(this.heard, this.draft, this.watched)) },
      pause: 0.45,
    };
  }
  update(dt: number) {
    this.clock += dt;
    this.helpGlow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3);
  }
  destroy() {
    this.alive = false;
  }
}
