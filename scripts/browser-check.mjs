import { chromium } from 'playwright';
import { runBrowserSuites } from './browser/runner.mjs';
import { ALL_SUITES, SUITES } from './browser/registry.mjs';
import { selectNames } from './browser/selection.mjs';

const requested = process.env.BROWSER_SUITE;
if (!requested) throw new Error('Set BROWSER_SUITE to an explicit suite (see README browser checks).');
const suites = requested === 'all' ? ALL_SUITES : selectNames(requested, SUITES, 'BROWSER_SUITE');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  await runBrowserSuites(browser, suites);
} finally { await browser.close(); }
