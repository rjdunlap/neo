import { launchTestBrowser } from './test-browser.mjs';
import { selectNames } from './browser/selection.mjs';
import { rootOffline } from './offline/root.mjs';

const requested = process.env.OFFLINE_SUITE ?? 'all';
const suites = requested === 'all' ? ['root'] : selectNames(requested, ['root'], 'OFFLINE_SUITE');
const browser = await launchTestBrowser();
try {
  for (const suite of suites) {
    await { root: rootOffline }[suite](browser);
    if (process.exitCode) break;
  }
} finally {
  await browser.close();
}
