import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./engine', () => ({
  audio: { ctx: null, duck: vi.fn(), getVolume: () => 0.8, voiceOut: {} },
}));

class FakeUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
const spoken: FakeUtterance[] = [];
let voices: { name: string; lang: string; localService: boolean; voiceURI: string }[] = [];
const synth = {
  speak: vi.fn((u: FakeUtterance) => void spoken.push(u)),
  cancel: vi.fn(),
  getVoices: () => voices,
  addEventListener: vi.fn(),
};
const PT = { name: 'Joana', lang: 'pt-PT', localService: true, voiceURI: 'joana' };

/** The tail's behaviour on device speech: these lines have no clip (no audio context), so `end` is in the test's hands. */
describe('voice second-language word (WL2)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    spoken.length = 0;
    voices = [{ name: 'Samantha', lang: 'en-US', localService: true, voiceURI: 's' }, PT];
    vi.stubGlobal(
      'window',
      Object.assign(new EventTarget(), {
        setTimeout: (...a: Parameters<typeof setTimeout>) => setTimeout(...a),
        clearTimeout: (...a: Parameters<typeof clearTimeout>) => clearTimeout(...a),
        speechSynthesis: synth,
      }),
    );
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const setup = async () => {
    const { voice } = await import('./voice');
    const run = vi.fn(() => void voice.speakWord('a vaca', 'pt-PT'));
    return { voice, run };
  };

  it('says the word after the line ends on its own, in the exact voice and language, at the pet rate and pitch', async () => {
    const { voice, run } = await setup();
    void voice.speak('Peekaboo! A cow!');
    expect(voice.afterLine(run)).toBe(true);
    expect(run).not.toHaveBeenCalled();
    spoken[0].onend!();
    expect(run).toHaveBeenCalledTimes(1);
    expect(spoken).toHaveLength(2);
    expect(spoken[1].text).toBe('a vaca');
    expect(spoken[1].voice).toBe(PT);
    expect(spoken[1].lang).toBe('pt-PT');
    expect(spoken[1].rate).toBe(0.95);
    expect(spoken[1].pitch).toBe(1.15);
    // A late second `end` from the engine starts nothing more.
    spoken[0].onend!();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('never runs after the line is cut by a newer line, stopped, fails or times out', async () => {
    const { voice, run } = await setup();
    void voice.speak('First line');
    voice.afterLine(run);
    void voice.speak('Newer line');
    spoken[0].onend!(); // Safari can end a cancelled utterance
    spoken[1].onend!();
    expect(run).not.toHaveBeenCalled();

    void voice.speak('Stopped line');
    voice.afterLine(run);
    voice.stop();
    spoken[2].onend!();

    void voice.speak('Failed line');
    voice.afterLine(run);
    spoken[3].onerror!();
    spoken[3].onend?.();

    void voice.speak('Silent engine');
    voice.afterLine(run);
    await vi.advanceTimersByTimeAsync(10_000);
    spoken[4].onend!(); // its watchdog already ended it

    void voice.speak('Dropped');
    voice.afterLine(run);
    voice.dropTail();
    spoken[5].onend!();
    expect(run).not.toHaveBeenCalled();
  });

  it('keeps one waiting word at most: a second replaces the first', async () => {
    const { voice } = await setup();
    const a = vi.fn();
    const b = vi.fn();
    void voice.speak('Line');
    voice.afterLine(a);
    voice.afterLine(b);
    spoken[0].onend!();
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('a newer English line cuts the word itself', async () => {
    const { voice, run } = await setup();
    void voice.speak('Line');
    voice.afterLine(run);
    spoken[0].onend!();
    const cancels = synth.cancel.mock.calls.length;
    void voice.speak('Next question');
    expect(synth.cancel.mock.calls.length).toBeGreaterThan(cancels);
    expect(spoken.at(-1)!.text).toBe('Next question');
  });

  it('says nothing without an exact local pt-PT voice, rechecked when the word is due', async () => {
    const { voice } = await setup();
    voices = [
      { ...PT, lang: 'pt-BR' },
      { ...PT, lang: 'pt' },
      { ...PT, localService: false },
    ];
    expect(voice.speakWord('a vaca', 'pt-PT')).toBeNull();
    expect(voice.wordVoice('pt-PT')).toBeNull();
    expect(spoken).toHaveLength(0);
    voices = [PT];
    expect(voice.wordVoice('pt-PT')).toBe('Joana');
  });

  it('keeps nothing while speech is off', async () => {
    const { voice, run } = await setup();
    voice.enabled = false;
    void voice.speak('Quiet line');
    expect(voice.afterLine(run)).toBe(false);
    expect(voice.speakWord('a vaca', 'pt-PT')).toBeNull();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(0);
  });
});
