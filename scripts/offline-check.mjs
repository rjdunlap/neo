import { launchTestBrowser } from './test-browser.mjs';
import { selectNames } from './browser/selection.mjs';
import { classicOffline } from './offline/classic.mjs';
import { rootOffline } from './offline/root.mjs';

const requested = process.env.OFFLINE_SUITE ?? 'all';
const suites = requested === 'all' ? ['root', 'classic'] : selectNames(requested, ['root', 'classic'], 'OFFLINE_SUITE');
const browser = await launchTestBrowser();
try {
  for (const suite of suites) {
    await ({ root: rootOffline, classic: classicOffline })[suite](browser);
    if (process.exitCode) break;
  }
} finally { await browser.close(); }
