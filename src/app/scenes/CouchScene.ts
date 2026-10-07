import { Container, Graphics } from 'pixi.js';
import { makePet, petSpec } from '../../art/pet';
import { audio } from '../../audio/engine';
import { music } from '../../audio/music';
import { voice, type LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { COUCH_INFO, couchLine, type CouchInfo } from '../../couch/catalog';
import { controllerArt, glyphs, type ControllerArt } from '../../couch/controller-art';
import { Demo } from '../../couch/demo';
import { completeRound, isNew, levelFor, markSeen, newParty, nextTier, offers, playerNow, repairCouch, reshuffle, roundToken, seedFor, starterOf, STOPS, tally, UNLOCK_TIERS, unlockedIds, type CouchId, type CouchRound, type Party, type TripMode } from '../../couch/party';
import { couchStore } from '../../couch/store';
import { CouchInput } from '../../engine/controller';
import { randomSeed, Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import type { Game, GameModule, RoundResult } from '../../games/types';
import type { App } from '../App';
import { Scene } from '../Scene';
import '../../couch/style.css';

/** How long the name card shows when a game has already been explained. */
const CARD_SECONDS = 1.6;
type Screen = 'menu' | 'mode' | 'intro' | 'howto' | 'card' | 'turn' | 'game' | 'pause' | 'setup' | 'backup';
const who = (player: number) => `Player ${player + 1}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = '') => {
  const el = document.createElement(tag); el.textContent = text; el.className = cls; return el;
};

/** Adult-only host: separate navigation, session goal and save; games retain their own rules. */
export class CouchScene extends Scene {
  countsTime = false;
  readonly couch = couchStore;
  private input!: CouchInput;
  private readonly overlay = node('section', '', 'couch');
  private readonly status = node('p', '', 'couch-status');
  private readonly warning = node('p', '', 'couch-warning');
  private readonly stage = new Container();
  private readonly pet = makePet();
  /** Sits above everything while a "how to play" screen is open: a paper backdrop and the demo. */
  private readonly introLayer = new Container();
  private readonly paper = new Graphics();
  private game: Game | null = null;
  private buttons: HTMLButtonElement[] = [];
  private focus = 0;
  private gone = false;
  private paused = false;
  private settled = false;
  private deferred: (() => void)[] = [];
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  private caption = node('p', '', 'couch-caption');
  private token = '';
  private unlocked = false;
  private age = 0;
  private leaving = false;
  private screen: Screen = 'menu';
  private modal: HTMLElement | null = null;
  // "How to play": the screen, its demo window, the diagram and the rows that light with it.
  private how: HTMLElement | null = null;
  private howId: CouchId | null = null;
  private demo: Demo | null = null;
  private demoWindow: HTMLElement | null = null;
  private pad: ControllerArt | null = null;
  private rows: HTMLElement[] = [];
  private narration = 0;
  private cardAge = 0;

  constructor(app: App, private readonly play = false) { super(app); }

  init() {
    this.overlay.setAttribute('aria-label', 'Couch play');
    document.body.append(this.overlay);
    this.introLayer.addChild(this.paper);
    this.introLayer.visible = false;
    this.ui.addChild(this.introLayer);
    this.input = new CouchInput(() => this.unlock(), () => this.pause('Window left — ready when you are.'));
    const selected = this.couch.data.party?.selected;
    if (this.play && selected) this.begin(selected);
    else this.menu();
  }

  private go(play = false) { this.leaving = true; this.app.go.couch(play); }
  private leave() { this.leaving = true; this.app.go.start(); }

  private unlock() {
    if (this.unlocked && audio.ctx?.state === 'running') return;
    this.unlocked = true; audio.unlock(); voice.unlock();
  }

  private button(parent: HTMLElement, title: string, action: () => void, cls = '') {
    const b = node('button', title, cls); b.type = 'button';
    b.onclick = () => { if (this.leaving || this.age < 0.35) return; this.unlock(); action(); };
    parent.append(b); return b;
  }

  private focusButtons(parent: HTMLElement = this.overlay) {
    this.buttons = [...parent.querySelectorAll('button')]; this.focus = 0;
    this.buttons.forEach((b, i) => b.addEventListener('focus', () => { this.focus = i; }));
    this.buttons[0]?.focus({ preventScroll: true });
  }

  private shell(title: string, intro: string) {
    this.overlay.className = 'couch'; this.overlay.replaceChildren();
    const sheet = node('div', '', 'couch-sheet');
    sheet.append(node('p', 'PUDDLE ISLAND · GROWN-UP PLAY', 'couch-eyebrow'), node('h1', title), node('p', intro, 'couch-intro'));
    this.overlay.append(sheet); return sheet;
  }

  private footer(sheet: HTMLElement) {
    sheet.append(this.status, this.warning, node('p', 'Menus: arrows / D-pad to choose · Enter / bottom face button to select · Esc / + to pause', 'couch-keys'));
    const actions = node('div', '', 'couch-actions'); sheet.append(actions);
    this.button(actions, 'Controller setup', () => this.setup());
    this.button(actions, 'Couch backup', () => this.backup());
    this.button(actions, 'Back to start', () => this.leave());
    this.focusButtons();
  }

  /** The game's picture, drawn once into a canvas for the DOM screens. */
  private iconCanvas(mod: GameModule, resolution = 2) {
    const icon = mod.hubIcon();
    const canvas = this.app.renderer.extract.canvas({ target: icon, resolution }) as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true'); icon.destroy({ children: true });
    return canvas;
  }

  private playLabel(info: CouchInfo) { return info.play === 'together' ? 'PLAY TOGETHER' : 'TAKE TURNS'; }

  /** The one line that says how the last stop went: a face-off stop names its winner and never a loser. */
  private resultLine(r: CouchRound, p: Party) {
    const name = gameById(r.id)!.name, kept = `one couch sticker kept${r.hints ? ' · completed with help' : ''}`;
    if (p.mode !== 'faceoff' || r.winner === undefined) return `${name} complete · ${kept}.`;
    if (r.winner === 'team') return `${name} complete · teamwork, you both score a point · ${kept}.`;
    const unit = COUCH_INFO[r.id].score?.unit ?? '', [a, b] = r.scores ?? [0, 0];
    const verdict = r.winner === 'tie' ? 'a tie, you both score a point' : `${who(r.winner)} wins this stop`;
    return `${name}: ${who(0)}: ${a}, ${who(1)}: ${b} ${unit} · ${verdict} · ${kept}.`;
  }

  /** How a finished face-off trip reads. Both players always light every lantern. */
  private finale(p: Party) {
    const [a, b] = tally(p);
    if (a === b) return `It ended ${a} to ${b}: you both win the evening!`;
    return `${who(a > b ? 0 : 1)} wins ${Math.max(a, b)} to ${Math.min(a, b)}, and you both lit all six lanterns!`;
  }

  private startTrip(mode: TripMode) {
    this.couch.data.party = newParty(mode, randomSeed());
    this.couch.save(); this.menu();
  }

  /** Together or face-off: the same six stops, with or without a winner at each. */
  private modeChoice() {
    this.screen = 'mode'; this.buttons = [];
    const sheet = this.shell('How shall we play tonight?', 'Both trips have six stops and three choices at each. Take turns choosing, and pass a controller if you only have one.');
    const grid = node('div', '', 'couch-cards couch-modes'); sheet.append(grid);
    const cards: [TripMode, string, string, string][] = [
      ['together', 'Together', 'Light the six lanterns as a team. Nobody wins or loses; finish a round, even with help, and the next lantern lights.', 'SHARED GOAL'],
      ['faceoff', 'Face-off', 'The same six stops, but each has a winner. Each of you plays your own fresh board. Ties and team games score for both.', 'A WINNER AT EACH STOP'],
    ];
    for (const [mode, title, text, tag] of cards) {
      const b = this.button(grid, '', () => this.startTrip(mode), `couch-card couch-mode couch-mode-${mode}`);
      b.dataset.mode = mode;
      b.append(node('strong', title), node('span', text), node('small', tag));
    }
    const next = nextTier(this.couch.data.trips);
    if (next) sheet.append(node('p', `Finish ${this.couch.data.trips ? 'another trip' : 'a trip'} to open ${plural(next.length, 'new game')}.`, 'couch-teaser'));
    this.footer(sheet);
  }

  private menu() {
    this.screen = 'menu'; this.buttons = [];
    const p = this.couch.data.party;
    if (!p) {
      const sheet = this.shell('An evening on the island', 'Six rounds. Three choices each time. Take turns choosing, pass a controller, or play the paddles together. Play together, or face off for a winner at each stop.');
      this.button(sheet, 'Start a couch trip', () => this.modeChoice(), 'couch-primary');
      sheet.append(node('p', 'Keyboard works now. Original Switch Pro Controllers can be paired with your Mac later. Couch stickers and trips have their own save.', 'couch-intro'));
      this.footer(sheet); return;
    }
    const faceoff = p.mode === 'faceoff';
    const done = p.rounds.length === STOPS;
    const last = p.rounds.at(-1);
    const [a, b] = tally(p);
    const sheet = this.shell(done ? 'Six lanterns lit!' : `Choose stop ${p.rounds.length + 1} of ${STOPS}`, done ? (faceoff ? this.finale(p) : 'You made a whole trip together. Stay here, stop for the evening, or set out again.') : `${who(starterOf(p))} chooses. Both of you can help. Finish a round to light the next lantern.`);
    const progress = node('div', '', 'couch-lanterns');
    progress.setAttribute('aria-label', `${p.rounds.length} of ${STOPS} lanterns lit`);
    for (let i = 0; i < STOPS; i++) progress.append(node('span', String(i + 1), i < p.rounds.length ? 'lit' : ''));
    sheet.append(progress);
    if (faceoff && p.rounds.length) sheet.append(node('p', `Face-off: ${who(0)}: ${a} · ${who(1)}: ${b}`, 'couch-tally'));
    if (last) sheet.append(node('p', this.resultLine(last, p), 'couch-result'));
    if (p.selected) this.button(sheet, `Resume ${gameById(p.selected)!.name}${p.turn ? ` · ${who(playerNow(p))}’s turn` : ''}`, () => this.go(true), 'couch-primary');
    if (done) {
      const trips = this.couch.data.trips;
      sheet.append(node('p', `${plural(trips, 'completed trip')} · ${Object.values(this.couch.data.stickers).reduce((n, s) => n + (s?.count ?? 0), 0)} couch stickers kept`, 'couch-intro'));
      // Finishing a trip opens the next tier: say which games, and how many more are still to come.
      const fresh = (UNLOCK_TIERS[trips] ?? []).filter(id => !this.couch.data.seen.includes(id));
      if (fresh.length) sheet.append(node('p', `New games are open: ${fresh.map(id => gameById(id)!.name).join(', ')}. Look for NEW on their cards.`, 'couch-unlocked'));
      const next = nextTier(trips);
      if (next) sheet.append(node('p', `Finish another trip to open ${plural(next.length, 'more game')}.`, 'couch-teaser'));
      this.button(sheet, 'Start another trip', () => { this.couch.data.party = null; this.modeChoice(); }, 'couch-primary');
    } else {
      const grid = node('div', '', 'couch-cards'); sheet.append(grid);
      for (const id of offers(p, this.couch.data.trips)) {
        const mod = gameById(id)!, info = COUCH_INFO[id];
        const bt = this.button(grid, '', () => { p.selected = id; this.couch.save(); this.go(true); }, `couch-card couch-card-${id}`);
        bt.dataset.game = id;
        bt.append(this.iconCanvas(mod), node('strong', mod.name), node('span', info.tagline), node('small', this.playLabel(info)));
        if (isNew(this.couch.data, id)) bt.append(node('em', 'NEW', 'couch-new'));
      }
      if (unlockedIds(this.couch.data.trips).length > 3) this.button(sheet, 'Shuffle the choices', () => { reshuffle(p); this.couch.save(); this.menu(); });
    }
    this.footer(sheet);
    if (last) void voice.say(done ? 'couch.done' : 'couch.next');
  }

  /** A chosen game: explain it the first time, then just introduce it by name. */
  private begin(id: CouchId) {
    if (this.couch.data.party?.turn) this.turnCard(id);
    else if (this.couch.data.seen.includes(id)) this.card(id);
    else this.intro(id, 'first');
  }

  /** A face-off stop's second turn: whose it is, and the score to beat. */
  private turnCard(id: CouchId) {
    const p = this.couch.data.party!, mod = gameById(id)!, info = COUCH_INFO[id];
    const me = playerNow(p), first = starterOf(p);
    this.screen = 'turn'; this.buttons = [];
    const sheet = this.shell(`${who(me)}, you’re up!`, `${mod.name}: ${who(first)} scored ${p.turn!.score} ${info.score?.unit ?? 'points'}. Your board is a fresh one, just as tricky. Beat it, or tie it.`);
    sheet.classList.add('couch-namecard');
    sheet.prepend(this.iconCanvas(mod, 3));
    this.button(sheet, 'Play', () => this.startGame(), 'couch-primary');
    this.focusButtons(sheet);
    void voice.say('couch.turn', { who: who(me) });
  }

  /** The short version for a game already explained: its name, spoken, then the round. */
  private card(id: CouchId) {
    const mod = gameById(id)!, info = COUCH_INFO[id];
    this.screen = 'card'; this.cardAge = 0; this.buttons = [];
    const sheet = this.shell(mod.name, this.playLabel(info));
    sheet.classList.add('couch-namecard');
    sheet.prepend(this.iconCanvas(mod, 3));
    sheet.append(node('p', 'Press the bottom button to start now · Esc / + for the menu', 'couch-keys'));
    void voice.say(mod.titleLine);
  }

  /** "How to play": the name, the goal, the controller, and a bot playing a real round in a window. */
  private intro(id: CouchId, from: 'first' | 'pause') {
    const mod = gameById(id)!, info = COUCH_INFO[id];
    this.closeIntro();
    this.modal?.remove(); this.modal = null;
    this.screen = from === 'pause' ? 'howto' : 'intro';
    this.howId = id;
    if (from === 'first') this.overlay.replaceChildren();
    this.overlay.className = 'couch couch-playing couch-howto-open';

    const screen = node('section', '', 'couch-how-screen');
    const text = node('div', '', 'couch-how-text');
    const head = node('div', '', 'couch-how-head');
    const title = node('div');
    title.append(node('p', 'HOW TO PLAY', 'couch-eyebrow'), node('h1', mod.name), node('span', this.playLabel(info), 'couch-chip'));
    head.append(this.iconCanvas(mod), title);
    this.pad = controllerArt();
    const list = node('ul', '', 'couch-rows');
    this.rows = info.controls.map(row => {
      const li = node('li');
      li.append(glyphs(row.parts), node('span', row.text), node('small', row.keys));
      list.append(li); return li;
    });
    const actions = node('div', '', 'couch-actions');
    text.append(head, node('p', voice.line(info.goal), 'couch-goal'), this.pad.el, list, actions);
    if (from === 'first') {
      this.button(actions, 'Play', () => this.playFromIntro(id), 'couch-primary');
      this.button(actions, 'Watch again', () => this.watchAgain());
      this.button(actions, 'Back', () => this.backFromIntro());
    } else {
      this.button(actions, 'Back to the pause menu', () => this.closeHowTo(), 'couch-primary');
      this.button(actions, 'Watch again', () => this.watchAgain());
    }
    const frame = node('div', '', 'couch-demo');
    frame.setAttribute('aria-label', `A demonstration of ${mod.name}`);
    this.demoWindow = frame;
    screen.append(text, frame);
    this.how = screen; this.overlay.append(screen);

    this.demo = new Demo(mod, { level: info.demoLevel, band: info.band, renderer: this.app.renderer });
    this.introLayer.addChild(this.demo.root);
    this.drawPaper(this.view);
    this.introLayer.visible = true;
    this.ui.addChild(this.introLayer); // above the corner pet and anything a paused round left on screen
    this.focusButtons(screen);
    this.narrate(mod, info);
  }

  /** The title, then the goal. Starting again (or leaving) cancels the one still being spoken. */
  private narrate(mod: GameModule, info: CouchInfo) {
    const token = ++this.narration;
    const here = () => token === this.narration && !this.gone && !this.leaving && (this.screen === 'intro' || this.screen === 'howto');
    void voice.say(mod.titleLine).then(() => { if (here()) void voice.say(info.goal); });
  }

  private watchAgain() {
    if (!this.howId) return;
    this.demo?.restart();
    this.narrate(gameById(this.howId)!, COUCH_INFO[this.howId]);
  }

  private playFromIntro(id: CouchId) {
    markSeen(this.couch.data, id); this.couch.save();
    this.closeIntro(); this.startGame();
  }

  /** Changed their mind: the game goes back to being unchosen. */
  private backFromIntro() {
    this.closeIntro(); this.narration++; voice.stop();
    this.couch.data.party!.selected = null; this.couch.save(); this.go();
  }

  private closeHowTo() {
    this.closeIntro(); this.narration++; voice.stop();
    this.pauseSheet('Take a breather. Your completed stops are saved.');
  }

  private closeIntro() {
    this.demo?.destroy(); this.demo = null;
    this.how?.remove(); this.how = null;
    this.demoWindow = null; this.pad = null; this.rows = []; this.howId = null;
    this.introLayer.visible = false;
    this.overlay.classList.remove('couch-howto-open');
  }

  private drawPaper(v: View) { this.paper.clear().rect(0, 0, v.w, v.h).fill(0xf3f6eb); }

  /** Run the demo, put it in its window, and light the controller with whatever its bot presses. */
  private tickDemo(dt: number) {
    const demo = this.demo, win = this.demoWindow, info = this.howId && COUCH_INFO[this.howId];
    if (!demo || !win || !info) return;
    demo.update(dt);
    const r = win.getBoundingClientRect(), s = this.view.scale;
    if (r.width > 10) demo.layout(r.left / s, r.top / s, r.width / s);
    // Without a bot, walk through the rows so the diagram still explains each control.
    const lit = demo.hasBot ? demo.lit : new Set(info.controls[Math.floor(this.age / 2) % info.controls.length].parts);
    this.pad?.light(lit);
    this.rows.forEach((li, i) => li.classList.toggle('on', info.controls[i].parts.some(p => lit.has(p))));
  }

  private startGame() {
    const party = this.couch.data.party!, id = party.selected!, mod = gameById(id)!, info = COUCH_INFO[id];
    this.token = roundToken(party); this.screen = 'game';
    this.overlay.replaceChildren();
    this.overlay.className = 'couch couch-playing';
    const hud = node('div', '', 'couch-hud');
    const turnOf = party.mode === 'faceoff' && info.faceoff === 'twin' ? ` · ${who(playerNow(party))}` : '';
    hud.append(node('strong', `${mod.name} · ${party.rounds.length + 1}/${STOPS}${turnOf}`), this.caption);
    this.button(hud, 'Pause / + / Esc', () => this.pause());
    const help = node('div', '', 'couch-game-help');
    for (const row of info.controls) {
      const item = node('span', '', 'couch-help-row');
      item.append(glyphs(row.parts), node('span', row.text));
      help.append(item);
    }
    this.overlay.append(hud, help);
    this.content.addChild(this.stage); this.ui.addChild(this.pet); this.pet.scale.set(0.42); this.track(this.pet);
    this.pet.position.set(74, this.view.h - 18);
    // The couch versions of lines that tell a touch player to tap or pull.
    const speak = (line: LineId) => couchLine(id, line);
    this.game = mod.create({ stage: this.stage, view: this.view, level: levelFor(id, party.rounds.length), band: info.band, couch: { versus: party.mode === 'faceoff' && info.faceoff === 'shared' }, rng: new Rng(seedFor(party, party.turn ? 1 : 0)), tw: this.tw, particles: this.particles, renderer: this.app.renderer, pet: this.pet, petSpec: petSpec(), childName: 'friend', track: o => this.track(o), untrack: o => this.untrack(o),
      instruct: (line, vars) => { const said = speak(line); this.instruction = { id: said, vars }; this.caption.textContent = voice.line(said, vars); return this.whileHere(voice.say(said, vars)); },
      say: (line, vars) => this.whileHere(voice.say(speak(line), vars)), finish: result => this.finish(result),
    });
    // The overlay owns couch controls; avoid competing touch steering and global drag releases.
    this.stage.eventMode = 'none';
    this.game.resize(this.view); music.play(mod.music); this.game.start();
  }

  resize(v: View) {
    this.game?.resize(v); this.pet.position.set(74, v.h - 18);
    this.drawPaper(v);
  }

  private whileHere(spoken: Promise<void>): Promise<void> {
    return new Promise(resolve => void spoken.then(() => {
      if (this.gone || this.leaving) return;
      if (this.paused) this.deferred.push(resolve); else resolve();
    }));
  }

  private finish(result: RoundResult) {
    if (this.gone || this.leaving || this.settled) return;
    if (this.paused) { this.deferred.push(() => this.finish(result)); return; }
    const settled = completeRound(this.couch.data, this.token, result);
    if (!settled) return;
    // The first player's turn on a face-off stop leads straight to the second player's.
    this.settled = true; this.couch.save(); this.go(settled === 'turn');
  }

  private pause(reason = 'Take a breather. Your completed stops are saved.') {
    if (!this.game || this.paused || this.gone || this.settled) return;
    this.paused = true; voice.stop(); music.stop();
    this.pauseSheet(reason);
  }

  private pauseSheet(reason: string) {
    this.screen = 'pause';
    const id = this.couch.data.party!.selected!;
    this.modal = node('div', '', 'couch-modal'); const sheet = node('div', '', 'couch-sheet'); this.modal.append(sheet);
    sheet.append(node('h1', 'Paused'), node('p', reason, 'couch-intro'), this.status, this.warning);
    this.button(sheet, 'Resume round', () => this.resume(), 'couch-primary');
    this.button(sheet, 'How to play', () => this.intro(id, 'pause'));
    this.button(sheet, 'Repeat instruction', () => { if (this.instruction) void voice.say(this.instruction.id, this.instruction.vars); });
    this.button(sheet, 'Choose a different game', () => { this.couch.data.party!.selected = null; this.couch.save(); this.go(); });
    this.button(sheet, 'Save and return to start', () => this.leave());
    sheet.append(node('p', 'Leaving or refreshing restarts this unfinished round from the same seed. Completed lanterns and stickers stay saved.', 'couch-keys'));
    this.overlay.append(this.modal); this.focusButtons(this.modal);
  }

  private resume() {
    this.paused = false; this.screen = 'game'; this.modal?.remove(); this.modal = null; this.buttons = [];
    music.play(gameById(this.couch.data.party!.selected!)!.music);
    const pending = this.deferred.splice(0); pending.forEach(resolve => resolve());
  }

  private setup() {
    this.screen = 'setup';
    const sheet = this.shell('Connect for couch play', 'On your Mac: System Settings → Bluetooth. Hold the controller’s SYNC button until its lights flash, then connect.');
    sheet.append(node('p', 'Pro Controller: SYNC is beside the USB-C port. Joy-Con: detach it and use SYNC on the inner rail; pair each half separately. Browser exposure varies. This prototype accepts the browser’s standard mapping; separate or unmapped Joy-Cons are not yet supported.', 'couch-intro'), this.status,
      node('p', 'Focus this browser tab and press a controller button. The first controller is Player 1 (blue paddle), the second is Player 2 (pink paddle). Printed Nintendo letters may differ: confirm is the bottom face button, undo is the left face button, pause is +. Release sticks between menu moves.', 'couch-intro'),
      node('p', 'Keyboard: arrows + Enter for Player 1; W/S joins Player 2 in Bounce Back. Backspace undoes a slide. Esc pauses. If sound is quiet, press a keyboard key or click once to enable browser audio. Connect the Mac to a TV and use full screen when ready.', 'couch-intro'));
    this.button(sheet, 'Back to couch play', () => this.menu(), 'couch-primary'); this.focusButtons();
  }

  private backup() {
    this.screen = 'backup'; const sheet = this.shell('Your couch save', 'Couch trips and sticker counts have a separate backup. The child’s backup, reset, levels and sticker book are independent.');
    this.button(sheet, 'Download couch backup', () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(this.couch.data, null, 2)], { type: 'application/json' }));
      const a = node('a'); a.href = url; a.download = 'puddle-island-couch.json'; a.click(); URL.revokeObjectURL(url);
    });
    const field = node('input'); field.type = 'file'; field.accept = '.json,application/json'; field.hidden = true; sheet.append(field);
    this.button(sheet, 'Restore couch backup', () => field.click());
    field.onchange = async () => {
      const file = field.files?.[0]; if (!file) return;
      try {
        if (file.size > 50000) throw new Error('too large');
        const raw = JSON.parse(await file.text());
        if (this.gone) return;
        if ((raw?.version !== 1 && raw?.version !== 2) || !('stickers' in raw) || !('party' in raw)) throw new Error('wrong backup');
        this.couch.data = repairCouch(raw); this.couch.save(); this.menu();
      } catch { if (!this.gone) this.warning.textContent = 'That was not a valid couch backup. Your current progress is unchanged.'; }
    };
    sheet.append(node('p', 'Restoring replaces only couch progress. To start a fresh trip, finish this one or choose another game; earned sticker counts are retained.', 'couch-keys'), this.warning);
    this.button(sheet, 'Back to couch play', () => this.menu(), 'couch-primary'); this.focusButtons();
  }

  update(dt: number) {
    const input = this.input.poll(); this.status.textContent = input.status;
    this.age += dt;
    if (this.leaving || this.age < 0.35) return;
    if (this.couch.warning) this.warning.textContent = this.couch.warning;
    if (input.disconnected) this.pause('Controller disconnected. Reconnect it, or resume using the keyboard.');
    if (this.screen === 'intro' || this.screen === 'howto') this.tickDemo(dt);
    if (this.screen === 'card') {
      this.cardAge += dt;
      const id = this.couch.data.party?.selected;
      if (id && (this.cardAge > CARD_SECONDS || input.players.some(p => p.action))) this.startGame();
      else if (input.players.some(p => p.pause || p.back)) this.menu();
      return;
    }
    if (input.players.some(p => p.pause || p.back)) {
      if (this.screen === 'game') this.pause();
      else if (this.screen === 'pause') this.resume();
      else if (this.screen === 'intro') this.backFromIntro();
      else if (this.screen === 'howto') this.closeHowTo();
      else if (this.screen !== 'menu') this.menu();
      return;
    }
    if (this.screen !== 'game') {
      const p = input.players.find(p => p.direction >= 0 || p.action);
      if (p?.direction !== undefined && p.direction >= 0 && this.buttons.length) {
        this.focus = (this.focus + ([0, 1].includes(p.direction) ? 1 : -1) + this.buttons.length) % this.buttons.length;
        this.buttons[this.focus]?.focus();
      }
      if (p?.action) this.buttons[this.focus]?.click();
      return;
    }
    if (this.settled) return;
    super.update(dt); this.game?.control?.(input, dt); this.game?.update(dt);
  }

  destroy() {
    this.gone = true; this.deferred = []; this.input.destroy(); this.demo?.destroy(); this.game?.destroy();
    this.overlay.remove(); voice.stop(); music.stop(); super.destroy();
  }
}
