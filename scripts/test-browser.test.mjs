import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('playwright', () => ({ chromium: { launch: vi.fn() } }));
import { chromium } from 'playwright';
import { createTestContext, launchTestBrowser, silenceSpeech } from './test-browser.mjs';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('quiet test browsers', () => {
  it('mutes Chromium audio by default and preserves an explicit browser executable', () => {
    vi.stubEnv('TEST_AUDIO', ''); vi.stubEnv('BROWSER_EXECUTABLE', '/test/chromium');
    launchTestBrowser();
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true, args: ['--mute-audio'], executablePath: '/test/chromium' });
  });

  it('silences a native utterance while preserving its text, voice, receiver and completion timing', () => {
    vi.useFakeTimers();
    const end = vi.fn();
    const voice = {};
    const utterance = { text: 'Count the cookies.', voice, volume: 1, onend: end };
    const original = vi.fn(function (u) {
      expect(this).toBe(speech);
      setTimeout(() => u.onend(), 700);
    });
    const speech = { speak: original };
    vi.stubGlobal('window', { speechSynthesis: speech });
    silenceSpeech();
    speech.speak(utterance);
    expect(original).toHaveBeenCalledExactlyOnceWith(utterance);
    expect(utterance).toMatchObject({ text: 'Count the cookies.', volume: 0 });
    expect(utterance.voice).toBe(voice);
    vi.advanceTimersByTime(699); expect(end).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(end).toHaveBeenCalledOnce();
  });

  it('installs speech muting in every new context before returning it to the harness', async () => {
    vi.stubEnv('TEST_AUDIO', '');
    const contexts = [];
    const browser = { newContext: vi.fn(async options => {
      const context = { options, addInitScript: vi.fn(async () => {}), close: vi.fn() };
      contexts.push(context); return context;
    }) };
    for (const options of [{ hasTouch: true }, { viewport: { width: 1024, height: 768 } }]) {
      const context = await createTestContext(browser, options);
      expect(context.options).toBe(options);
      expect(context.addInitScript).toHaveBeenCalledExactlyOnceWith(silenceSpeech);
    }
    expect(contexts).toHaveLength(2);
  });

  it('closes a context if installing its mute fails', async () => {
    vi.stubEnv('TEST_AUDIO', '');
    const error = new Error('context closed');
    const context = { addInitScript: vi.fn(async () => { throw error; }), close: vi.fn(async () => {}) };
    await expect(createTestContext({ newContext: async () => context }, {})).rejects.toBe(error);
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('supports an explicit audible test run without overriding the app speech engine', async () => {
    vi.stubEnv('TEST_AUDIO', 'on'); vi.stubEnv('BROWSER_EXECUTABLE', '');
    launchTestBrowser();
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true, ignoreDefaultArgs: ['--mute-audio'] });
    const context = { addInitScript: vi.fn() };
    expect(await createTestContext({ newContext: async () => context }, {})).toBe(context);
    expect(context.addInitScript).not.toHaveBeenCalled();
  });

  it('works when speech synthesis is unavailable', () => {
    vi.stubGlobal('window', {});
    expect(silenceSpeech).not.toThrow();
  });
});
