import { Container, Graphics } from 'pixi.js';
import { makePet, petSpec } from '../../art/pet';
import { audio } from '../../audio/engine';
import { music } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice, type LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { COUCH_INFO, couchLine, type CouchInfo } from '../../couch/catalog';
import { controllerArt, glyphs, type ControllerArt } from '../../couch/controller-art';
import { Demo } from '../../couch/demo';
import { finaleOf, namerOf, stopLabel, type Finale } from '../../couch/finale';
import { FinaleStage } from '../../couch/finale-stage';
import { completeCourse, courseDefaults, courseOf, noteProgress, startRun, BADGES, courseSpec, type CourseSpec, type Outcome, type PlayerRecord } from '../../couch/course';
import { COURSE_IDS, countOf, courseInfo, unitsOf, type CourseId, type CourseInfo } from '../../couch/courses';
import { cleanName, completeRound, isNew, levelFor, markSeen, NAME_MAX, newParty, nextTier, offers, playerNow, repairCouch, reshuffle, roundToken, seedFor, starterOf, STOPS, tally, unlockedIds, type CouchId, type CouchRound, type Party, type TripMode } from '../../couch/party';
import { couchStore } from '../../couch/store';
import { CouchInput } from '../../engine/controller';
import { randomSeed, Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import type { CourseProgress, Game, GameModule, RoundResult } from '../../games/types';
import type { App } from '../App';
import { Scene } from '../Scene';
import '../../couch/style.css';

/** How long the name card shows when a game has already been explained. */
const CARD_SECONDS = 1.6;
type Screen = 'menu' | 'mode' | 'courses' | 'course' | 'intro' | 'howto' | 'card' | 'turn' | 'game' | 'pause' | 'setup' | 'backup' | 'guide';
/** Where a "how to play" screen was opened from, and so where its Back button goes. */
type IntroFrom = 'first' | 'pause' | 'guide' | 'turn';
/** The trip whose finale has already played in this page, so coming back to its page doesn't replay the fanfare. */
let celebrated: number | null = null;
/** A course run's result, handed to the page that follows it (a finished run ends by opening a fresh scene). */
let handoff: { id: CourseId; outcome: Outcome } | null = null;
const who = (player: number) => namerOf(couchStore.data.names)(player);
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
  private finaleStage: FinaleStage | null = null;
  /** Set once someone moves around the name card, so it waits for them instead of starting the round. */
  private cardHeld = false;
  private introFrom: IntroFrom = 'first';

  /** The challenge course being played, while a run is on screen. */
  private course: { spec: CourseSpec; info: CourseInfo; token: number; player: 0 | 1 } | null = null;
  private readonly stats = node('small', '', 'couch-hud-stats');

  constructor(app: App, private readonly play: boolean | CourseId = false) { super(app); }

  /** Any key or click wakes the browser's audio; a controller button may not. */
  private readonly wake = () => this.unlock();

  init() {
    window.addEventListener('pointerdown', this.wake);
    window.addEventListener('keydown', this.wake);
    this.overlay.setAttribute('aria-label', 'Couch play');
    document.body.append(this.overlay);
    this.introLayer.addChild(this.paper);
    this.introLayer.visible = false;
    this.ui.addChild(this.introLayer);
    this.input = new CouchInput(() => this.unlock(), () => this.pause('Window left — ready when you are.'));
    const selected = this.couch.data.party?.selected;
    if (typeof this.play === 'string') { const result = handoff?.id === this.play ? handoff.outcome : null; handoff = null; this.courseHome(this.play, result); }
    else if (this.play && selected) this.begin(selected);
    else this.menu();
  }

  private go(play: boolean | CourseId = false) { this.leaving = true; this.app.go.couch(play); }
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

  /** Down or right goes to the next button, up or left to the one before; it wraps round. */
  private moveFocus(direction: number) {
    if (!this.buttons.length) return;
    this.focus = (this.focus + ([0, 1].includes(direction) ? 1 : -1) + this.buttons.length) % this.buttons.length;
    this.buttons[this.focus]?.focus();
  }

  private shell(title: string, intro: string) {
    this.closeFinale();
    this.overlay.className = 'couch'; this.overlay.replaceChildren();
    const sheet = node('div', '', 'couch-sheet');
    sheet.append(node('p', 'PUDDLE ISLAND · GROWN-UP PLAY', 'couch-eyebrow'), node('h1', title), node('p', intro, 'couch-intro'));
    this.overlay.append(sheet); return sheet;
  }

  /** One compact row: the three grown-up buttons, and what the controllers are doing. It keeps a page short enough for a TV. */
  private footer(sheet: HTMLElement, extra?: (actions: HTMLElement) => void, notes = true) {
    const foot = node('div', '', 'couch-foot');
    const actions = node('div', '', 'couch-actions');
    foot.append(actions); sheet.append(foot);
    if (notes) {
      const note = node('div', '', 'couch-notes');
      note.append(this.status, this.warning, node('p', 'Menus: arrows / D-pad to choose · Enter / bottom face button to select · Esc / + to pause', 'couch-keys'));
      foot.append(note);
    }
    extra?.(actions);
    this.button(actions, 'Controller setup', () => this.setup());
    this.button(actions, 'Couch backup', () => this.backup());
    this.button(actions, 'Back to start', () => this.leave());
    this.button(actions, 'How to play', () => this.guide());
    this.focusButtons();
  }

  /** Every open game's controls and demo, any time: no round starts and the trip stays as it is. */
  private guide() {
    this.screen = 'guide'; this.buttons = [];
    const sheet = this.shell('How to play', 'Pick a game to see its controls and watch it played. No round starts, and your trip stays just as it is.');
    const grid = node('div', '', 'couch-cards couch-guide'); sheet.append(grid);
    for (const id of unlockedIds(this.couch.data.trips)) {
      const mod = gameById(id)!, info = COUCH_INFO[id];
      const bt = this.button(grid, '', () => this.explain(id), `couch-card couch-card-${id}`);
      bt.dataset.game = id;
      bt.append(this.iconCanvas(mod), node('strong', mod.name), node('span', info.tagline), node('small', this.playLabel(info)));
      if (isNew(this.couch.data, id)) bt.append(node('em', 'NEW', 'couch-new'));
    }
    const actions = node('div', '', 'couch-actions'); sheet.append(actions);
    this.button(actions, 'Back', () => this.menu(), 'couch-primary');
    this.focusButtons();
  }

  /** The full how-to from the guide. Seeing it counts as having it explained, so a NEW mark goes. */
  private explain(id: CouchId) {
    markSeen(this.couch.data, id); this.couch.save();
    this.intro(id, 'guide');
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

  private startTrip(mode: TripMode) {
    this.couch.data.party = newParty(mode, randomSeed());
    this.couch.save(); this.menu();
  }

  /** Together or face-off: the same six stops, with or without a winner at each. */
  private modeChoice() {
    this.screen = 'mode'; this.buttons = [];
    const sheet = this.shell('How shall we play tonight?', 'Both trips have six stops and three choices at each. Take turns choosing, and pass a controller if you only have one. Or take on a challenge.');
    const grid = node('div', '', 'couch-cards couch-modes'); sheet.append(grid);
    const cards: [TripMode | 'course', string, string, string][] = [
      ['together', 'Together', 'Light the six lanterns as a team. Nobody wins or loses; finish a round, even with help, and the next lantern lights.', 'SHARED GOAL'],
      ['faceoff', 'Face-off', 'The same six stops, but each has a winner. Each of you plays your own fresh board. Ties and team games score for both.', 'A WINNER AT EACH STOP'],
      ['course', 'Challenges', 'A fixed run in one game, scored by how few tries it takes. Beat your own best, and each other\'s.', 'A SCORE TO BEAT'],
    ];
    for (const [mode, title, text, tag] of cards) {
      const b = this.button(grid, '', () => mode === 'course' ? this.courseMenu() : this.startTrip(mode), `couch-card couch-mode couch-mode-${mode}`);
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
      this.button(sheet, 'Challenges', () => this.courseMenu());
      sheet.append(node('p', 'Keyboard works now. Original Switch Pro Controllers can be paired with your Mac later. Couch stickers and trips have their own save.', 'couch-intro'));
      const kept = this.couch.data.keepsake;
      if (kept) sheet.append(this.keepsakeCard(kept.at));
      this.footer(sheet); return;
    }
    if (p.rounds.length === STOPS) return this.finale(p);
    const faceoff = p.mode === 'faceoff';
    const last = p.rounds.at(-1);
    const [a, b] = tally(p);
    const sheet = this.shell(`Choose stop ${p.rounds.length + 1} of ${STOPS}`, `${who(starterOf(p))} chooses. Both of you can help. Finish a round to light the next lantern.`);
    const progress = node('div', '', 'couch-lanterns');
    progress.setAttribute('aria-label', `${p.rounds.length} of ${STOPS} lanterns lit`);
    for (let i = 0; i < STOPS; i++) progress.append(node('span', String(i + 1), i < p.rounds.length ? 'lit' : ''));
    // The lanterns sit beside the title, which keeps the chooser short enough for a 1080p TV.
    const heading = sheet.querySelector('h1')!, row = node('div', '', 'couch-title-row');
    heading.replaceWith(row); row.append(heading, progress);
    if (faceoff && p.rounds.length) sheet.append(node('p', `Face-off: ${who(0)}: ${a} · ${who(1)}: ${b}`, 'couch-tally'));
    if (last) sheet.append(node('p', this.resultLine(last, p), 'couch-result'));
    if (p.selected) this.button(sheet, `Resume ${gameById(p.selected)!.name}${p.turn ? ` · ${who(playerNow(p))}’s turn` : ''}`, () => this.go(true), 'couch-primary');
    const grid = node('div', '', 'couch-cards'); sheet.append(grid);
    for (const id of offers(p, this.couch.data.trips)) {
      const mod = gameById(id)!, info = COUCH_INFO[id];
      const bt = this.button(grid, '', () => { p.selected = id; this.couch.save(); this.go(true); }, `couch-card couch-card-${id}`);
      bt.dataset.game = id;
      bt.append(this.iconCanvas(mod), node('strong', mod.name), node('span', info.tagline), node('small', this.playLabel(info)));
      if (isNew(this.couch.data, id)) bt.append(node('em', 'NEW', 'couch-new'));
    }
    const shuffle = unlockedIds(this.couch.data.trips).length > 3;
    this.footer(sheet, actions => {
      if (shuffle) this.button(actions, 'Shuffle the choices', () => { reshuffle(p); this.couch.save(); this.menu(); });
      this.button(actions, 'Challenges', () => this.courseMenu());
    });
    if (last) void voice.say('couch.next');
  }

  /** The pet, drawn once into a canvas for the DOM screens. */
  private petCanvas(resolution = 1.5) {
    const pet = makePet();
    const canvas = this.app.renderer.extract.canvas({ target: pet, resolution }) as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true'); pet.destroy({ children: true });
    return canvas;
  }

  /** "Lantern Night", kept from the first finished trip: six lanterns over the night sky, with the pet who came along. */
  private keepsakeCard(at: number, fresh = false) {
    const card = node('figure', '', `couch-keepsake${fresh ? ' fresh' : ''}`);
    const sky = node('div', '', 'couch-keepsake-sky');
    const row = node('div', '', 'couch-mini-lanterns');
    for (let i = 0; i < STOPS; i++) row.append(node('i'));
    sky.append(row, this.petCanvas());
    const when = at ? new Date(at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const caption = node('figcaption');
    caption.append(node('small', fresh ? 'NEW KEEPSAKE' : 'KEEPSAKE'), node('strong', 'Lantern Night'), node('span', when ? `Our first trip · ${when}` : 'Our first trip'));
    card.append(sky, caption);
    return card;
  }

  private closeFinale() {
    this.finaleStage?.destroy();
    this.finaleStage = null;
  }

  /** The end of a trip: a night sky, six lanterns lit in the color of whoever took each stop, and what the trip opened. */
  private finale(p: Party) {
    const f: Finale = finaleOf(this.couch.data)!;
    const save = this.couch.data;
    const first = celebrated !== p.seed;
    celebrated = p.seed;
    const sheet = this.shell('Six lanterns lit!', f.verdict);
    this.overlay.classList.add('couch-finale-open');
    sheet.classList.add('couch-finale');
    // The title sits on glass so lanterns floating behind it never hide a word.
    const head = node('div', '', 'couch-head couch-glass');
    head.append(...Array.from(sheet.children)); sheet.append(head);
    const stage = new FinaleStage(this.view, f.stops.map(stop => stop.owner));
    this.content.addChild(stage);
    this.finaleStage = stage;
    if (first) stage.celebrate(); else stage.settle();

    // The first time, the lanterns have the sky to themselves for a moment before the page fades in.
    const grid = node('div', '', `couch-finale-grid${first ? ' couch-reveal' : ''}`); sheet.append(grid);
    const main = node('div', '', 'couch-glass'), aside = node('div', '', 'couch-glass couch-aside');
    grid.append(main, aside);

    if (f.faceoff) {
      const score = node('div', '', 'couch-score');
      score.setAttribute('aria-label', `Face-off: ${who(0)} ${f.score[0]}, ${who(1)} ${f.score[1]}`);
      for (const side of [0, 1] as const) {
        const box = node('div', '', `couch-score-side side-${side}${f.lead === side ? ' lead' : ''}`);
        box.append(node('small', f.lead === side ? `${who(side)} · ahead` : who(side)), node('b', String(f.score[side])));
        score.append(box);
        if (side === 0) score.append(node('span', '–'));
      }
      main.append(score);
    }
    const recap = node('ol', '', 'couch-recap');
    f.stops.forEach((stop, i) => {
      const mod = gameById(stop.id)!;
      const li = node('li', '', `couch-stop owner-${stop.owner}`);
      const label = node('span');
      label.append(node('strong', mod.name), node('small', `${stopLabel(stop, f.faceoff, who)}${stop.helped ? ' · with help' : ''}`));
      li.append(node('b', String(i + 1)), this.iconCanvas(mod, 1), label);
      recap.append(li);
    });
    main.append(recap);
    const last = p.rounds.at(-1);
    if (last) main.append(node('p', this.resultLine(last, p), 'couch-result'));

    // A keepsake the first time a trip is finished, and the games it opened.
    if (save.keepsake && save.trips === 1) aside.append(this.keepsakeCard(save.keepsake.at, true));
    aside.append(node('p', `${plural(save.trips, 'completed trip')} · ${Object.values(save.stickers).reduce((n, v) => n + (v?.count ?? 0), 0)} couch stickers kept`, 'couch-totals'));
    const fresh = f.opened.filter(id => !save.seen.includes(id));
    if (fresh.length) {
      aside.append(node('p', `New games are open: ${fresh.map(id => gameById(id)!.name).join(', ')}. Look for NEW on their cards.`, 'couch-unlocked'));
      const icons = node('div', '', 'couch-opened');
      for (const id of fresh) { const chip = node('div'); chip.title = gameById(id)!.name; chip.append(this.iconCanvas(gameById(id)!, 1)); icons.append(chip); }
      aside.append(icons);
    }
    if (f.next) aside.append(node('p', `Finish another trip to open ${plural(f.next, 'more game')}.`, 'couch-teaser'));

    const again = this.button(sheet, 'Start another trip', () => { this.couch.data.party = null; this.modeChoice(); }, 'couch-primary');
    if (first) again.classList.add('couch-reveal');
    this.footer(sheet, actions => { this.button(actions, 'Challenges', () => this.courseMenu()); }, false);
    if (first) sheet.querySelector('.couch-foot')?.classList.add('couch-reveal');
    if (first) {
      void voice.say('couch.done').then(() => { if (!this.gone && !this.leaving && save.keepsake && save.trips === 1) void voice.say('couch.keepsake'); });
    }
  }

  /** One player's marks on the course: their bests in each support category, runs, and which badges they hold. */
  private playerCard(info: CourseInfo, player: 0 | 1, rec: PlayerRecord, outcome: Outcome | null) {
    const card = node('section', '', `couch-player side-${player}${outcome?.player === player ? ' played' : ''}`);
    card.append(node('h2', who(player)));
    const list = node('dl');
    const row = (name: string, value: string) => { list.append(node('dt', name), node('dd', value)); };
    row('Best, no help', rec.clean === null ? 'not yet' : countOf(info, rec.clean));
    row('Best, with help', rec.assisted === null ? 'not yet' : countOf(info, rec.assisted));
    row('Runs finished', String(rec.runs));
    card.append(list);
    const badges = node('ul', '', 'couch-badges');
    for (const badge of BADGES) {
      const text = info.badges[badge], earned = rec.badges.includes(badge);
      const li = node('li', '', earned ? 'earned' : '');
      li.append(node('strong', text.title), node('small', earned ? 'earned' : text.how));
      badges.append(li);
    }
    card.append(badges);
    return card;
  }

  /** What the run just finished came to: the total against the minimum, the best, new badges, and the tries on each part. */
  private outcomePanel(info: CourseInfo, o: Outcome) {
    const panel = node('div', '', 'couch-outcome');
    const mine = who(o.player), kind = o.assisted ? 'with help' : 'no help';
    const big = node('p', '', 'couch-big');
    big.append(node('b', String(o.total)), document.createTextNode(` ${o.total === 1 ? info.unit : unitsOf(info)}`));
    const line = o.total <= o.minimum ? `The fewest ${unitsOf(info)} possible: perfect!`
      : o.previous === null ? `Your first finish (${kind}). That is your mark to beat.`
      : o.improved ? `A new best (${kind})! It was ${o.previous}.`
      : `Your best (${kind}) is still ${o.previous}.`;
    panel.append(big, node('p', `${mine} · course minimum ${o.minimum}. ${line}`, 'couch-outcome-line'));
    const earned = o.earned.map(b => info.badges[b].title);
    if (earned.length) { const tag = node('p', '', 'couch-new-badges'); tag.append(node('em', 'NEW BADGE'), document.createTextNode(` ${earned.join(' and ')}`)); panel.append(tag); }
    const parts = node('ol', '', 'couch-pond-scores');
    const cap = info.part[0].toUpperCase() + info.part.slice(1);
    o.boards.forEach((n, i) => parts.append(node('li', `${cap} ${i + 1}: ${countOf(info, n)}${info.par ? ` · ${info.par} ${info.best[i]}` : ''}`, n <= info.best[i] ? 'perfect' : '')));
    panel.append(parts);
    return panel;
  }

  /** The challenges on offer, each with both players' marks. */
  private courseMenu() {
    this.screen = 'courses'; this.buttons = [];
    const sheet = this.shell('Challenges', 'A fixed run in one game, scored by how few tries it takes. Every player keeps their own best, and a hint is always allowed: it just goes in its own column.');
    const grid = node('div', '', 'couch-cards couch-courses'); sheet.append(grid);
    for (const id of COURSE_IDS) {
      const info = courseInfo(id), mod = gameById(info.game)!, saved = this.couch.data.courses[id];
      const b = this.button(grid, '', () => this.courseHome(id), `couch-card couch-course-card couch-course-${id}`);
      b.dataset.course = id;
      const marks = [0, 1].map(p => { const best = saved?.players[p].clean ?? saved?.players[p].assisted ?? null; return `${who(p)}: ${best === null ? 'no finish yet' : `${best}${saved?.players[p].clean === null ? ' with help' : ''}`}`; }).join(' · ');
      b.append(this.iconCanvas(mod), node('strong', info.name), node('span', info.card), node('small', marks));
      if (saved?.run) b.append(node('em', 'IN PROGRESS', 'couch-new'));
    }
    this.button(sheet, 'Back to couch play', () => this.menu());
    this.focusButtons();
  }

  /** The course page: both players' records, the rules of the score, and a way in (or back into a run left halfway). */
  private courseHome(id: CourseId, outcome: Outcome | null = null) {
    this.screen = 'course'; this.buttons = [];
    const info = courseInfo(id), spec = courseSpec(id);
    const saved = this.couch.data.courses[id] ?? courseDefaults(spec);
    const run = saved.run;
    const sheet = this.shell(info.name, outcome ? info.rule : `${info.blurb} The fewest ${unitsOf(info)} the whole course can take is ${spec.minimum}.`);
    sheet.classList.add('couch-course');
    const progress = node('div', '', 'couch-lanterns');
    const finished = outcome ? spec.boards : run?.slides.length ?? 0;
    progress.setAttribute('aria-label', `${finished} of ${spec.boards} ${info.part}s finished`);
    for (let i = 0; i < spec.boards; i++) progress.append(node('span', String(i + 1), i < finished ? 'lit' : ''));
    const heading = sheet.querySelector('h1')!, row = node('div', '', 'couch-title-row');
    heading.replaceWith(row); row.append(heading, progress);
    if (outcome) sheet.append(this.outcomePanel(info, outcome));
    const players = node('div', '', 'couch-players'); sheet.append(players);
    for (const player of [0, 1] as const) players.append(this.playerCard(info, player, saved.players[player], outcome));
    if (!outcome) sheet.append(node('p', info.note, 'couch-keys'));
    const actions = node('div', '', 'couch-actions'); sheet.append(actions);
    if (run) {
      this.button(actions, `Resume · ${who(run.player)} · ${info.part} ${Math.min(run.slides.length + 1, spec.boards)} of ${spec.boards}`, () => this.launchCourse(id, run.player, true), 'couch-primary');
      this.button(actions, 'Start a fresh run', () => this.launchCourse(id, run.player));
    } else {
      const next = outcome ? outcome.player : 0;
      this.button(actions, `${who(next)} plays`, () => this.launchCourse(id, next), 'couch-primary');
      this.button(actions, `${who(next === 0 ? 1 : 0)} plays`, () => this.launchCourse(id, next === 0 ? 1 : 0));
    }
    this.button(actions, 'All challenges', () => this.courseMenu());
    this.focusButtons();
    if (outcome) {
      sfx.tada();
      void voice.say(outcome.improved ? 'couch.course.best' : info.done);
    }
  }

  /** Start (or resume) a run for a player. The first time the course's game is chosen, its how-to comes first. */
  private launchCourse(id: CourseId, player: 0 | 1, resume = false) {
    const spec = courseSpec(id), info = courseInfo(id);
    const course = courseOf(this.couch.data, spec);
    if (!resume || !course.run) startRun(course, player, randomSeed());
    this.couch.save();
    this.course = { spec, info, token: course.run!.token, player: course.run!.player };
    if (this.couch.data.seen.includes(spec.game)) this.startGame();
    else this.intro(spec.game, 'first');
  }

  /** Keep a run's numbers as the game reports them, and show them on the HUD. */
  private courseProgress(p: CourseProgress) {
    const run = this.course;
    if (!run || this.gone) return;
    noteProgress(courseOf(this.couch.data, run.spec), run.spec, run.token, { slides: p.done, attempts: p.attempts, assisted: p.assisted });
    this.couch.save();
    const total = p.done.reduce((n, s) => n + s, 0) + p.attempts, info = run.info, cap = info.part[0].toUpperCase() + info.part.slice(1);
    this.stats.textContent = `${cap} ${Math.min(p.board + 1, p.boards)} of ${p.boards} · ${countOf(info, total)} so far${info.par ? ` · this ${info.part}'s ${info.par} ${p.par}` : ''} · course minimum ${p.minimum}${p.assisted ? ' · helped' : ''}`;
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
    const actions = node('div', '', 'couch-actions'); sheet.append(actions);
    this.button(actions, 'Play', () => this.startGame(), 'couch-primary');
    this.button(actions, 'How to play', () => this.intro(id, 'turn'));
    this.focusButtons(sheet);
    void voice.say('couch.turn', { who: who(me) });
  }

  /** The short version for a game already explained: its name, spoken, then the round, unless someone asks for How to play. */
  private card(id: CouchId) {
    const mod = gameById(id)!, info = COUCH_INFO[id];
    this.screen = 'card'; this.cardAge = 0; this.cardHeld = false; this.buttons = [];
    const sheet = this.shell(mod.name, this.playLabel(info));
    sheet.classList.add('couch-namecard');
    sheet.prepend(this.iconCanvas(mod, 3));
    const actions = node('div', '', 'couch-actions'); sheet.append(actions);
    this.button(actions, 'Play', () => this.startGame(), 'couch-primary');
    this.button(actions, 'How to play', () => this.intro(id, 'first'));
    sheet.append(node('p', 'Press the bottom button to start now · Right or down for How to play · Esc / + for the menu', 'couch-keys'));
    this.focusButtons(sheet);
    void voice.say(mod.titleLine);
  }

  /** "How to play": the name, the goal, the controller, and a bot playing a real round in a window. */
  private intro(id: CouchId, from: IntroFrom) {
    const mod = gameById(id)!, info = COUCH_INFO[id];
    this.closeIntro();
    this.modal?.remove(); this.modal = null;
    this.screen = from === 'pause' ? 'howto' : 'intro';
    this.howId = id; this.introFrom = from;
    if (from !== 'pause') this.overlay.replaceChildren();
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
    } else if (from === 'pause') {
      this.button(actions, 'Back to the pause menu', () => this.closeHowTo(), 'couch-primary');
      this.button(actions, 'Watch again', () => this.watchAgain());
    } else {
      // From the guide or a face-off turn card: look, then go back to where it was opened.
      this.button(actions, 'Back', () => this.backFromIntro(), 'couch-primary');
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

  /** Back from a how-to: to the guide or turn card it was opened from, or, on a first look, the game goes back to being unchosen. */
  private backFromIntro() {
    const from = this.introFrom, id = this.howId;
    this.closeIntro(); this.narration++; voice.stop();
    if (this.course) { const course = this.course.spec.id; this.course = null; this.go(course); return; }
    if (from === 'guide') return this.guide();
    if (from === 'turn' && id) return this.turnCard(id);
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
    const course = this.course, party = this.couch.data.party;
    const id: CouchId = course ? course.spec.game : party!.selected!, mod = gameById(id)!, info = COUCH_INFO[id];
    this.token = course ? '' : roundToken(party!); this.screen = 'game';
    this.overlay.replaceChildren();
    this.overlay.className = 'couch couch-playing';
    const hud = node('div', '', 'couch-hud');
    const turnOf = party && party.mode === 'faceoff' && info.faceoff === 'twin' ? ` · ${who(playerNow(party))}` : '';
    const title = node('div');
    title.append(node('strong', course ? `${course.info.name} · ${who(course.player)}` : `${mod.name} · ${party!.rounds.length + 1}/${STOPS}${turnOf}`));
    if (course) { this.stats.textContent = ''; title.append(this.stats); }
    hud.append(title, this.caption);
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
    const run = course && courseOf(this.couch.data, course.spec).run;
    const resume = { board: run?.slides.length ?? 0, done: run?.slides.slice() ?? [], attempts: run?.attempts ?? 0, assisted: run?.assisted ?? false };
    const couch = course ? { versus: false, course: { id: course.spec.id, resume, progress: (p: CourseProgress) => this.courseProgress(p) } } : { versus: party!.mode === 'faceoff' && info.faceoff === 'shared' };
    this.game = mod.create({ stage: this.stage, view: this.view, level: course ? course.info.level : levelFor(id, party!.rounds.length), band: info.band, couch, rng: new Rng(course ? course.token : seedFor(party!, party!.turn ? 1 : 0)), tw: this.tw, particles: this.particles, renderer: this.app.renderer, pet: this.pet, petSpec: petSpec(), childName: 'friend', track: o => this.track(o), untrack: o => this.untrack(o),
      instruct: (line, vars) => { const said = speak(line); this.instruction = { id: said, vars }; this.caption.textContent = voice.line(said, vars); return this.whileHere(voice.say(said, vars)); },
      say: (line, vars) => this.whileHere(voice.say(speak(line), vars)), finish: result => this.finish(result),
    });
    // The overlay owns couch controls; avoid competing touch steering and global drag releases.
    this.stage.eventMode = 'none';
    this.game.resize(this.view); music.play(mod.music); this.game.start();
  }

  resize(v: View) {
    this.game?.resize(v); this.pet.position.set(74, v.h - 18);
    this.drawPaper(v); this.finaleStage?.resize(v);
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
    if (this.course) {
      // A finished run is one round: one sticker, the records, and then its result on the course page.
      const outcome = completeCourse(this.couch.data, this.course.spec, this.course.token);
      if (!outcome) return;
      this.settled = true; this.couch.save(); handoff = { id: this.course.spec.id, outcome }; this.go(this.course.spec.id);
      return;
    }
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
    const id: CouchId = this.course ? this.course.spec.game : this.couch.data.party!.selected!;
    this.modal = node('div', '', 'couch-modal'); const sheet = node('div', '', 'couch-sheet'); this.modal.append(sheet);
    sheet.append(node('h1', 'Paused'), node('p', reason, 'couch-intro'), this.status, this.warning);
    this.button(sheet, 'Resume round', () => this.resume(), 'couch-primary');
    this.button(sheet, 'How to play', () => this.intro(id, 'pause'));
    this.button(sheet, 'Repeat instruction', () => { if (this.instruction) void voice.say(this.instruction.id, this.instruction.vars); });
    if (this.course) { const id = this.course.spec.id; this.button(sheet, 'Back to the course page', () => this.go(id)); }
    else this.button(sheet, 'Choose a different game', () => { this.couch.data.party!.selected = null; this.couch.save(); this.go(); });
    this.button(sheet, 'Save and return to start', () => this.leave());
    sheet.append(node('p', this.course ? this.course.info.leaving : 'Leaving or refreshing restarts this unfinished round from the same seed. Completed lanterns and stickers stay saved.', 'couch-keys'));
    this.overlay.append(this.modal); this.focusButtons(this.modal);
  }

  private resume() {
    this.paused = false; this.screen = 'game'; this.modal?.remove(); this.modal = null; this.buttons = [];
    music.play(gameById(this.course ? this.course.spec.game : this.couch.data.party!.selected!)!.music);
    const pending = this.deferred.splice(0); pending.forEach(resolve => resolve());
  }

  private setup() {
    this.screen = 'setup';
    const sheet = this.shell('Connect for couch play', 'On your Mac: System Settings → Bluetooth. Hold the controller’s SYNC button until its lights flash, then connect.');
    sheet.append(node('p', 'Pro Controller: SYNC is beside the USB-C port. Joy-Con: detach it and use SYNC on the inner rail; pair each half separately. Browser exposure varies. This prototype accepts the browser’s standard mapping; separate or unmapped Joy-Cons are not yet supported.', 'couch-intro'), this.status,
      node('p', 'Focus this browser tab and press a controller button. The first controller is Player 1 (blue paddle), the second is Player 2 (pink paddle). Printed Nintendo letters may differ: confirm is the bottom face button, undo is the left face button, pause is +. Release sticks between menu moves.', 'couch-intro'),
      node('p', 'Keyboard: arrows + Enter for Player 1; W/S joins Player 2 in Bounce Back. Backspace undoes a slide. Esc pauses. If sound is quiet, press a keyboard key or click once to enable browser audio. Connect the Mac to a TV and use full screen when ready.', 'couch-intro'));
    // Names are typed on a keyboard, once; the couch itself never needs one.
    const names = node('div', '', 'couch-names');
    names.append(node('p', 'Names (optional): who is playing? They replace Player 1 and Player 2 on every screen.', 'couch-intro'));
    for (const player of [0, 1] as const) {
      const row = node('label');
      const input = node('input');
      input.type = 'text'; input.maxLength = NAME_MAX; input.placeholder = `Player ${player + 1}`; input.autocomplete = 'off'; input.spellcheck = false;
      input.value = this.couch.data.names[player]; input.dataset.player = String(player);
      input.setAttribute('aria-label', `Player ${player + 1}’s name`);
      input.oninput = () => { this.couch.data.names[player] = cleanName(input.value); this.couch.save(); };
      row.append(node('span', `Player ${player + 1}`), input);
      names.append(row);
    }
    sheet.append(names);
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
        if (![1, 2, 3].includes(raw?.version) || !('stickers' in raw) || !('party' in raw)) throw new Error('wrong backup');
        this.couch.data = repairCouch(raw); this.couch.save(); this.menu();
      } catch { if (!this.gone) this.warning.textContent = 'That was not a valid couch backup. Your current progress is unchanged.'; }
    };
    sheet.append(node('p', 'Restoring replaces only couch progress. To start a fresh trip, finish this one or choose another game; earned sticker counts are retained.', 'couch-keys'), this.warning);
    this.button(sheet, 'Back to couch play', () => this.menu(), 'couch-primary'); this.focusButtons();
  }

  update(dt: number) {
    const input = this.input.poll();
    const quiet = !audio.ctx || audio.ctx.state !== 'running';
    this.status.textContent = input.status + (quiet ? ' · Sound is off: press any key or click once' : '');
    this.age += dt;
    if (this.leaving || this.age < 0.35) return;
    if (this.couch.warning) this.warning.textContent = this.couch.warning;
    if (input.disconnected) this.pause('Controller disconnected. Reconnect it, or resume using the keyboard.');
    if (this.screen === 'intro' || this.screen === 'howto') this.tickDemo(dt);
    this.finaleStage?.update(dt);
    if (this.screen === 'card') {
      this.cardAge += dt;
      const id = this.couch.data.party?.selected;
      // Moving the highlight means someone wants a look at How to play, so the card stops counting down.
      const moved = input.players.find(p => p.direction >= 0);
      if (moved) { this.cardHeld = true; this.moveFocus(moved.direction); }
      if (input.players.some(p => p.action)) this.buttons[this.focus]?.click();
      else if (id && !this.cardHeld && this.cardAge > CARD_SECONDS) this.startGame();
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
      if (p && p.direction >= 0) this.moveFocus(p.direction);
      if (p?.action) this.buttons[this.focus]?.click();
      return;
    }
    if (this.settled) return;
    super.update(dt); this.game?.control?.(input, dt); this.game?.update(dt);
  }

  destroy() {
    window.removeEventListener('pointerdown', this.wake); window.removeEventListener('keydown', this.wake);
    this.gone = true; this.deferred = []; this.input.destroy(); this.demo?.destroy(); this.game?.destroy(); this.closeFinale();
    this.overlay.remove(); voice.stop(); music.stop(); super.destroy();
  }
}
