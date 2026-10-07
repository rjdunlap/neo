import { Container } from 'pixi.js';
import { makePet, petSpec } from '../../art/pet';
import { audio } from '../../audio/engine';
import { music } from '../../audio/music';
import { voice, type LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { completeRound, levelFor, offers, repairCouch, roundToken, seedFor, STOPS, type CouchId } from '../../couch/party';
import { couchStore } from '../../couch/store';
import { CouchInput } from '../../engine/controller';
import { randomSeed, Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import type { Game, RoundResult } from '../../games/types';
import type { App } from '../App';
import { Scene } from '../Scene';
import '../../couch/style.css';

const HELP: Record<CouchId, string> = {
  'penguin-slide': 'Stick / D-pad / arrows: slide · left face button / Backspace: undo',
  'bouncy-launch': 'Left / right: adjust spring power · bottom face button / Enter: launch',
  'bounce-back': 'Player 1: blue paddle, stick / ↑ ↓ · Player 2: pink paddle, second controller / W S. Pet fills in until Player 2 joins.',
};
const GOALS: Record<CouchId, string> = {
  'penguin-slide': 'Plan your slides. Collect both fish on each of two ice puzzles.',
  'bouncy-launch': 'Aim the spring. Land on three star clouds.',
  'bounce-back': 'Keep the ball going together. Reach a rally of eight.',
};
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
  private screen = 'menu';
  private modal: HTMLElement | null = null;

  constructor(app: App, private readonly play = false) { super(app); }

  init() {
    this.overlay.setAttribute('aria-label', 'Couch play');
    document.body.append(this.overlay);
    this.input = new CouchInput(() => this.unlock(), () => this.pause('Window left — ready when you are.'));
    if (this.play && this.couch.data.party?.selected) this.startGame();
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

  private menu() {
    this.screen = 'menu';
    const p = this.couch.data.party;
    if (!p) {
      const sheet = this.shell('An evening on the island', 'Six rounds. Three choices each time. One shared goal. Take turns choosing, pass a controller, or play the paddles together.');
      this.button(sheet, 'Start a couch trip', () => {
        this.couch.data.party = { seed: randomSeed(), rounds: [], selected: null };
        this.couch.save(); this.menu();
      }, 'couch-primary');
      sheet.append(node('p', 'Keyboard works now. Original Switch Pro Controllers can be paired with your Mac later. Couch stickers and trips have their own save.', 'couch-intro'));
      this.footer(sheet); return;
    }
    const done = p.rounds.length === STOPS;
    const last = p.rounds.at(-1);
    const sheet = this.shell(done ? 'Six lanterns lit!' : `Choose stop ${p.rounds.length + 1} of ${STOPS}`, done ? 'You made a whole trip together. Stay here, stop for the evening, or set out again.' : `Player ${p.rounds.length % 2 + 1} chooses. Both of you can help. Finish a round to light the next lantern.`);
    const progress = node('div', '', 'couch-lanterns');
    progress.setAttribute('aria-label', `${p.rounds.length} of ${STOPS} lanterns lit`);
    for (let i = 0; i < STOPS; i++) progress.append(node('span', String(i + 1), i < p.rounds.length ? 'lit' : ''));
    sheet.append(progress);
    if (last) sheet.append(node('p', `${gameById(last.id)!.name} complete · one couch sticker kept${last.hints ? ' · completed with help' : ''}.`, 'couch-result'));
    if (p.selected) this.button(sheet, `Resume ${gameById(p.selected)!.name}`, () => this.go(true), 'couch-primary');
    if (done) {
      sheet.append(node('p', `${this.couch.data.trips} completed trip${this.couch.data.trips === 1 ? '' : 's'} · ${Object.values(this.couch.data.stickers).reduce((n, s) => n + (s?.count ?? 0), 0)} couch stickers kept`, 'couch-intro'));
      this.button(sheet, 'Start another trip', () => { this.couch.data.party = { seed: randomSeed(), rounds: [], selected: null }; this.couch.save(); this.menu(); }, 'couch-primary');
    } else {
      const grid = node('div', '', 'couch-cards'); sheet.append(grid);
      for (const id of offers(p)) {
        const mod = gameById(id)!;
        const b = this.button(grid, '', () => { p.selected = id; this.couch.save(); this.go(true); }, `couch-card couch-card-${id}`);
        b.dataset.game = id;
        const icon = mod.hubIcon();
        const canvas = this.app.renderer.extract.canvas({ target: icon }) as HTMLCanvasElement;
        canvas.setAttribute('aria-hidden', 'true'); b.append(canvas); icon.destroy({ children: true });
        b.append(node('strong', mod.name), node('span', GOALS[id]), node('small', id === 'bounce-back' ? 'PLAY TOGETHER' : 'TAKE TURNS'));
      }
    }
    this.footer(sheet);
    if (last) void voice.say(done ? 'couch.done' : 'couch.next');
  }

  private startGame() {
    const party = this.couch.data.party!, id = party.selected!, mod = gameById(id)!;
    this.token = roundToken(party); this.screen = 'game';
    this.overlay.className = 'couch couch-playing';
    const hud = node('div', '', 'couch-hud');
    hud.append(node('strong', `${mod.name} · ${party.rounds.length + 1}/${STOPS}`), this.caption);
    this.button(hud, 'Pause / + / Esc', () => this.pause());
    this.overlay.append(hud, node('p', HELP[id], 'couch-game-help'));
    this.content.addChild(this.stage); this.ui.addChild(this.pet); this.pet.scale.set(0.42); this.track(this.pet);
    this.game = mod.create({ stage: this.stage, view: this.view, level: levelFor(id, party.rounds.length), band: id === 'penguin-slide' ? 'school' : 'prek', rng: new Rng(seedFor(party)), tw: this.tw, particles: this.particles, renderer: this.app.renderer, pet: this.pet, petSpec: petSpec(), childName: 'friend', track: o => this.track(o), untrack: o => this.untrack(o),
      instruct: (line, vars) => { this.instruction = { id: line, vars }; this.caption.textContent = voice.line(line, vars); return this.whileHere(voice.say(line, vars)); },
      say: (line, vars) => this.whileHere(voice.say(line, vars)), finish: result => this.finish(result),
    });
    // The overlay owns couch controls; avoid competing touch steering and global drag releases.
    this.stage.eventMode = 'none';
    this.game.resize(this.view); music.play(mod.music); this.game.start();
  }

  resize(v: View) { this.game?.resize(v); this.pet.position.set(74, v.h - 18); }

  private whileHere(spoken: Promise<void>): Promise<void> {
    return new Promise(resolve => void spoken.then(() => {
      if (this.gone || this.leaving) return;
      if (this.paused) this.deferred.push(resolve); else resolve();
    }));
  }

  private finish(result: RoundResult) {
    if (this.gone || this.leaving || this.settled) return;
    if (this.paused) { this.deferred.push(() => this.finish(result)); return; }
    if (!completeRound(this.couch.data, this.token, result)) return;
    this.settled = true; this.couch.save(); this.go();
  }

  private pause(reason = 'Take a breather. Your completed stops are saved.') {
    if (!this.game || this.paused || this.gone || this.settled) return;
    this.paused = true; voice.stop(); music.stop(); this.screen = 'pause';
    this.modal = node('div', '', 'couch-modal'); const sheet = node('div', '', 'couch-sheet'); this.modal.append(sheet);
    sheet.append(node('h1', 'Paused'), node('p', reason, 'couch-intro'), this.status, this.warning);
    this.button(sheet, 'Resume round', () => this.resume(), 'couch-primary');
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
        if (raw?.version !== 1 || !('stickers' in raw) || !('party' in raw)) throw new Error('wrong backup');
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
    if (input.players.some(p => p.pause || p.back)) {
      if (this.screen === 'game') this.pause();
      else if (this.screen === 'pause') this.resume();
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
    this.gone = true; this.deferred = []; this.input.destroy(); this.game?.destroy();
    this.overlay.remove(); voice.stop(); music.stop(); super.destroy();
  }
}
