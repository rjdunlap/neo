import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CouchInput } from './controller';

// A window and document of plain event targets: enough for CouchInput's listeners outside a browser.
const g = globalThis as Record<string, unknown>;
const saved = { window: g.window, document: g.document, HTMLElement: g.HTMLElement, navigator: g.navigator };
let win: EventTarget;
const key = (type: 'keydown' | 'keyup', k: string, code: string, extra: Partial<{ repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {}) => {
  const e = Object.assign(new Event(type, { cancelable: true }), { key: k, code, repeat: false, ctrlKey: false, metaKey: false, altKey: false, ...extra });
  win.dispatchEvent(e);
  return e;
};

describe('the typed-letter channel', () => {
  beforeEach(() => {
    win = new EventTarget();
    g.window = win;
    g.document = Object.assign(new EventTarget(), { hidden: false });
    g.HTMLElement = class {};
    Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [] }, configurable: true });
  });
  afterEach(() => {
    g.window = saved.window; g.document = saved.document; g.HTMLElement = saved.HTMLElement;
    Object.defineProperty(globalThis, 'navigator', { value: saved.navigator, configurable: true });
  });

  it('stays empty for every game that does not type, and leaves W and S to the second player', () => {
    const input = new CouchInput(() => {}, () => {});
    input.poll(); // a new screen sees keys released before it takes a press
    key('keydown', 'a', 'KeyA');
    key('keydown', 'w', 'KeyW');
    const out = input.poll();
    expect(out.typed).toEqual([]);
    expect(out.players[1].direction).toBe(3);
    input.destroy();
  });

  it('hands a typing game the characters pressed, in order, read from the key, once each', () => {
    const input = new CouchInput(() => {}, () => {});
    input.typing = () => true;
    input.poll();
    const a = key('keydown', 'a', 'KeyQ'); // AZERTY: the key says what she meant
    key('keydown', 'W', 'KeyW');
    key('keydown', 'w', 'KeyW', { repeat: true });
    key('keydown', ' ', 'Space');
    key('keydown', 'c', 'KeyC', { ctrlKey: true });
    key('keydown', 'v', 'KeyV', { metaKey: true });
    key('keydown', 'Shift', 'ShiftLeft');
    expect(a.defaultPrevented).toBe(true);
    const out = input.poll();
    expect(out.typed).toEqual(['a', 'W', ' ', 'Shift']);
    // W is a letter now, not a paddle; Space still presses as it always did.
    expect(out.players[1].direction).toBe(-1);
    expect(out.players[0].action).toBe(true);
    expect(input.poll().typed).toEqual([]);
    input.destroy();
  });

  it('delivers editor keys once in event order only to typing; chords and repeats stay out', () => {
    const input = new CouchInput(() => {}, () => {});
    input.typing = () => true; input.poll();
    for (const [k, code] of [['Shift','ShiftLeft'], ['a','KeyA'], ['ArrowLeft','ArrowLeft'], ['Backspace','Backspace'], ['.','Period']]) {
      key('keydown', k, code); key('keydown', k, code, { repeat: true }); key('keyup', k, code);
    }
    key('keydown', 'ArrowLeft', 'ArrowLeft', { metaKey: true });
    key('keydown', 'Backspace', 'Backspace', { altKey: true });
    expect(input.poll().typed).toEqual(['Shift','a','ArrowLeft','Backspace','.']);
    key('keydown', 'Shift', 'ShiftRight'); win.dispatchEvent(new Event('blur'));
    expect(input.poll().typed).toEqual([]);
    input.destroy();
  });

  it('drops letters pressed while the round is not on screen', () => {
    const input = new CouchInput(() => {}, () => {});
    let on = false;
    input.typing = () => on;
    key('keydown', 'b', 'KeyB');
    on = true;
    expect(input.poll().typed).toEqual([]);
    input.destroy();
  });
});
