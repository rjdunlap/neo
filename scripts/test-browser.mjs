import { chromium } from 'playwright';

/** Keep the real speech engine and its callbacks, but prevent the OS voice from speaking aloud. */
export function silenceSpeech() {
  if (!('speechSynthesis' in window)) return;
  const speech = window.speechSynthesis;
  const speak = speech.speak.bind(speech);
  speech.speak = utterance => {
    utterance.volume = 0;
    return speak(utterance);
  };
}

/** Test-only audio policy: mute media/Web Audio and native speech without changing app settings or clocks. */
export function launchTestBrowser() {
  return chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
    ...(process.env.TEST_AUDIO === 'on' ? { ignoreDefaultArgs: ['--mute-audio'] } : { args: ['--mute-audio'] }),
  });
}

export async function createTestContext(browser, options) {
  const context = await browser.newContext(options);
  try {
    // Context init scripts also run for new pages and reloads, before the app can unlock or speak.
    if (process.env.TEST_AUDIO !== 'on') await context.addInitScript(silenceSpeech);
    return context;
  } catch (error) {
    await context.close();
    throw error;
  }
}
