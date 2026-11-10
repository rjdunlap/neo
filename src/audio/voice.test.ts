import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./engine', () => ({
  audio: { ctx: null as null | { state: string }, duck: vi.fn(), getVolume: () => 0.8, voiceOut: {} },
}));

class FakeUtterance {
  voice: unknown = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
const spoken: FakeUtterance[] = [];
const synth = {
  speak: vi.fn((u: FakeUtterance) => {
    spoken.push(u);
    setTimeout(() => u.onend?.(), 1);
  }),
  cancel: vi.fn(),
  getVoices: () => [],
  addEventListener: vi.fn(),
};

describe('voice.sayIn', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    spoken.length = 0;
    synth.speak.mockClear();
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
      vi.fn(() => new Promise<Response>(() => {})),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('always speaks with the device in the preset, even for a line that has a rendered clip', async () => {
    const { voice } = await import('./voice');
    const { audio } = await import('./engine');
    const { clipUrl } = await import('./voice-clips');
    const { SCRIPT } = await import('../content/voice-script');
    expect(clipUrl(SCRIPT['nav.home'][0])).toMatch(/\.m4a$/);
    (audio as { ctx: { state: string } | null }).ctx = { state: 'running' };
    const said = voice.sayIn('nav.home', { pitch: 0.8, rate: 0.65, volume: 0.8 });
    await vi.runAllTimersAsync();
    await said;
    expect(fetch).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(1);
    expect(spoken[0].pitch).toBe(0.8);
    expect(spoken[0].rate).toBe(0.65);
    expect(spoken[0].volume).toBeCloseTo(0.8 * 1.1 * 0.8, 5);
    expect(audio.duck).toHaveBeenCalledWith(true);
    expect(audio.duck).toHaveBeenLastCalledWith(false);
  });

  it("leaves the pet's say on its clip, and its device voice at the pet preset", async () => {
    const { voice, PET_VOICE } = await import('./voice');
    const { audio } = await import('./engine');
    (audio as { ctx: { state: string } | null }).ctx = { state: 'running' };
    void voice.say('nav.home');
    expect(fetch).toHaveBeenCalledTimes(1);
    voice.stop();
    (audio as { ctx: { state: string } | null }).ctx = null;
    const said = voice.say('nav.home');
    await vi.runAllTimersAsync();
    await said;
    const last = spoken[spoken.length - 1];
    expect(last.pitch).toBe(PET_VOICE.pitch);
    expect(last.rate).toBe(PET_VOICE.rate);
  });

  it("keeps a spoken line's pacing without speaking when the voice is off", async () => {
    const { voice } = await import('./voice');
    voice.enabled = false;
    let done = false;
    const said = voice.sayIn('nav.home', { pitch: 2, rate: 1.3 }).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(done).toBe(false);
    await vi.runAllTimersAsync();
    await said;
    expect(synth.speak).not.toHaveBeenCalled();
  });

  describe('a cut line never holds a game (U7 R4)', () => {
    /** A promise's state, read without waiting for it. */
    const watch = (p: Promise<void>) => {
      const seen = { done: false };
      void p.then(() => (seen.done = true));
      return seen;
    };

    it('stop() ends a silenced line at once, and every other line pending', async () => {
      const { voice } = await import('./voice');
      voice.enabled = false;
      const one = watch(voice.say('nav.home'));
      const two = watch(voice.sayIn('nav.home', { pitch: 2, rate: 1.3 }));
      await vi.advanceTimersByTimeAsync(10);
      expect(one.done).toBe(true); // the second line cut it
      expect(two.done).toBe(false);
      voice.stop();
      await vi.advanceTimersByTimeAsync(0);
      expect(two.done).toBe(true);
    });

    it('a new line ends the silenced one it cuts when it starts', async () => {
      const { voice } = await import('./voice');
      voice.enabled = false;
      const first = watch(voice.say('nav.back'));
      await vi.advanceTimersByTimeAsync(100);
      expect(first.done).toBe(false);
      const second = watch(voice.say('nav.home'));
      await vi.advanceTimersByTimeAsync(0);
      expect(first.done).toBe(true);
      expect(second.done).toBe(false);
    });

    it('stop() ends a device line whose engine never fires end, and a clip still loading', async () => {
      const { voice } = await import('./voice');
      const { audio } = await import('./engine');
      synth.speak.mockImplementationOnce((u: FakeUtterance) => void spoken.push(u)); // no end, ever
      (audio as { ctx: { state: string } | null }).ctx = null;
      const device = watch(voice.say('nav.back'));
      await vi.advanceTimersByTimeAsync(10);
      expect(device.done).toBe(false);
      voice.stop();
      await vi.advanceTimersByTimeAsync(0);
      expect(device.done).toBe(true);

      (audio as { ctx: { state: string } | null }).ctx = { state: 'running' };
      const clip = watch(voice.say('nav.home')); // fetch never answers
      await vi.advanceTimersByTimeAsync(10);
      expect(clip.done).toBe(false);
      voice.stop();
      await vi.advanceTimersByTimeAsync(0);
      expect(clip.done).toBe(true);
      expect(audio.duck).toHaveBeenLastCalledWith(false);
    });
  });
});
