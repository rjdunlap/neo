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

/** The same tail on a rendered clip, which is how most English lines play on a phone. */
describe('voice second-language word after a clip (WL2)', () => {
  class FakeSource {
    buffer: unknown = null;
    onended: (() => void) | null = null;
    connect = vi.fn();
    start = vi.fn();
    stop = vi.fn(() => this.onended?.());
  }
  let sources: FakeSource[] = [];

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    spoken.length = 0;
    sources = [];
    voices = [PT];
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
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const setup = async () => {
    const { voice } = await import('./voice');
    const { audio } = await import('./engine');
    const { SCRIPT } = await import('../content/voice-script');
    (audio as unknown as { ctx: unknown }).ctx = {
      state: 'running',
      decodeAudioData: async () => ({ duration: 1 }),
      createBufferSource: () => {
        const s = new FakeSource();
        sources.push(s);
        return s;
      },
    };
    const run = vi.fn(() => void voice.speakWord('o pato', 'pt-PT'));
    const line = (i = 0) => voice.speak(SCRIPT['nav.home'][i % SCRIPT['nav.home'].length]);
    return { voice, run, line };
  };

  it('says the word when the clip plays out', async () => {
    const { voice, run, line } = await setup();
    void line();
    voice.afterLine(run);
    await vi.advanceTimersByTimeAsync(0);
    expect(sources).toHaveLength(1);
    sources[0].onended!();
    expect(run).toHaveBeenCalledTimes(1);
    expect(spoken.at(-1)?.text).toBe('o pato');
    expect(spoken.at(-1)?.lang).toBe('pt-PT');
  });

  it('says nothing when a newer line cuts the clip, or its watchdog ends it first', async () => {
    const { voice, run, line } = await setup();
    void line();
    voice.afterLine(run);
    await vi.advanceTimersByTimeAsync(0);
    void line(1); // stops the first clip, which fires its `onended`
    expect(sources[0].stop).toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();

    voice.stop();
    void line();
    voice.afterLine(run);
    await vi.advanceTimersByTimeAsync(0);
    const last = sources.at(-1)!;
    await vi.advanceTimersByTimeAsync(5_000); // the suspended-context watchdog
    last.onended!(); // a late end
    expect(run).not.toHaveBeenCalled();
  });
});
