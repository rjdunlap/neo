/** Semantic controls for the small couch-play catalog. Button names describe positions,
 * since Nintendo's printed letters differ from the browser's standard layout. */
export interface PlayerControls {
  x: number;
  y: number;
  direction: number;
  action: boolean;
  undo: boolean;
  pause: boolean;
  back: boolean;
  active: boolean;
}
export interface CouchControls { players: [PlayerControls, PlayerControls]; disconnected: boolean; status: string }
export const neutral = (): PlayerControls => ({ x: 0, y: 0, direction: -1, action: false, undo: false, pause: false, back: false, active: false });
/** Nobody pressing anything: the starting point for a bot's frame of input. */
export const idle = (): CouchControls => ({ players: [neutral(), neutral()], disconnected: false, status: '' });
type Pad = Pick<Gamepad, 'index' | 'id' | 'mapping' | 'connected' | 'axes' | 'buttons'>;
const deadzone = (v = 0) => Math.abs(v) < 0.22 ? 0 : Math.sign(v) * (Math.abs(v) - 0.22) / 0.78;
const direction = (x: number, y: number) => Math.max(Math.abs(x), Math.abs(y)) < 0.5 ? -1 : Math.abs(x) > Math.abs(y) ? x > 0 ? 0 : 2 : y > 0 ? 1 : 3;

/** Pure sampler, also exercised with synthetic devices. Slot identities survive disconnects. */
export class ControllerSampler {
  private slots: (number | undefined)[] = [undefined, undefined];
  private previous = new Map<string, PlayerControls>();
  private connected = new Set<number>();
  private keyboardTwo = false;

  sample(pads: readonly (Pad | null)[], keys: ReadonlySet<string>): CouchControls {
    const standard = pads.filter((p): p is Pad => !!p?.connected && p.mapping === 'standard');
    for (const p of standard) if (!this.slots.includes(p.index)) {
      const slot = this.slots.findIndex((index) => index === undefined);
      if (slot >= 0) this.slots[slot] = p.index;
    }
    const connected = new Set(standard.map(p => p.index));
    const disconnected = [...this.connected].some(index => !connected.has(index));
    this.connected = connected;
    if (keys.has('KeyW') || keys.has('KeyS')) this.keyboardTwo = true;
    const players = [0, 1].map((slot) => {
      const p = standard.find(p => p.index === this.slots[slot]);
      const held = (index: number) => !!p?.buttons[index]?.pressed;
      const k = (code: string) => Number(keys.has(code));
      const keyboardX = slot === 0 ? k('ArrowRight') - k('ArrowLeft') : 0;
      const keyboardY = slot === 0 ? k('ArrowDown') - k('ArrowUp') : k('KeyS') - k('KeyW');
      const x = keyboardX || Number(held(15)) - Number(held(14)) || deadzone(p?.axes[0]);
      const y = keyboardY || Number(held(13)) - Number(held(12)) || deadzone(p?.axes[1]);
      const raw: PlayerControls = {
        x, y, direction: direction(x, y),
        action: held(0) || (slot === 0 && (keys.has('Enter') || keys.has('Space'))),
        undo: held(2) || (slot === 0 && keys.has('Backspace')),
        pause: held(9) || (slot === 0 && keys.has('Escape')),
        back: held(1), active: !!p || slot === 0 || this.keyboardTwo,
      };
      const key = String(slot);
      // A newly mounted screen must see buttons/sticks released before accepting their edges.
      const prev = this.previous.get(key) ?? raw;
      this.previous.set(key, raw);
      return { ...raw, direction: raw.direction !== prev.direction ? raw.direction : -1,
        action: raw.action && !prev.action, undo: raw.undo && !prev.undo,
        pause: raw.pause && !prev.pause, back: raw.back && !prev.back };
    }) as [PlayerControls, PlayerControls];
    const unknown = pads.some(p => p?.connected && p.mapping !== 'standard');
    const status = standard.length ? `${Math.min(standard.length, 2)} controller${standard.length === 1 ? '' : 's'} ready · first connected = Player 1` : 'Keyboard ready · press a controller button to connect';
    return { players, disconnected, status: status + (unknown ? ' · Unmapped controller: use a Pro Controller or keyboard for now' : '') };
  }
}

/** Scene-owned listeners: no keys are intercepted in the child's game or other pages. */
export class CouchInput {
  private keys = new Set<string>();
  private sampler = new ControllerSampler();
  private readonly codes = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space', 'Backspace', 'Escape', 'KeyW', 'KeyS']);
  private readonly down = (e: KeyboardEvent) => {
    if (!this.codes.has(e.code) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    this.keys.add(e.code);
    this.unlock();
  };
  private readonly up = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private readonly blur = () => { this.keys.clear(); this.onBlur(); };
  private readonly hidden = () => { if (document.hidden) this.blur(); };
  constructor(private readonly unlock: () => void, private readonly onBlur: () => void) {
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.hidden);
  }
  poll() {
    let pads: (Gamepad | null)[] = [];
    try { pads = [...(navigator.getGamepads?.() ?? [])]; } catch { /* restricted embedding: keyboard remains usable */ }
    return this.sampler.sample(pads, this.keys);
  }
  destroy() {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.hidden);
  }
}
