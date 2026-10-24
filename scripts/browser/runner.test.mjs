import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./registry.mjs', () => ({ runSuite: vi.fn() }));
import { runSuite } from './registry.mjs';
import { runBrowserSuites } from './runner.mjs';

function browser() {
  const contexts = [];
  const host = { newContext: vi.fn(async () => {
    const page = { on: vi.fn(), goto: vi.fn(async () => {}), waitForFunction: vi.fn(async () => {}), evaluate: vi.fn(async () => ({})), screenshot: vi.fn(async () => {}) };
    const context = { newPage: async () => page, close: vi.fn(async () => {}), page };
    contexts.push(context);
    return context;
  }) };
  return { host, contexts };
}
afterEach(() => { vi.restoreAllMocks(); vi.mocked(runSuite).mockReset(); });

describe('browser suite ownership', () => {
  it('uses a fresh page and error list per suite and closes the previous context before the next suite', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { host, contexts } = browser();
    const seen = [];
    vi.mocked(runSuite).mockImplementation(async (suite, fixture) => {
      if (seen.length) expect(contexts[0].close).toHaveBeenCalledOnce();
      seen.push({ suite, page: fixture.page, errors: fixture.errors, output: fixture.output });
      return [suite];
    });
    await runBrowserSuites(host, ['home', 'fingerdemo']);
    expect(seen.map(s => s.suite)).toEqual(['home', 'fingerdemo']);
    expect(seen[0].page).not.toBe(seen[1].page);
    expect(seen[0].errors).not.toBe(seen[1].errors);
    expect(seen.map(s => s.output)).toEqual(['test-results/browser/home', 'test-results/browser/fingerdemo']);
    expect(contexts.every(c => c.close.mock.calls.length === 1)).toBe(true);
  });
  it('closes a context if opening its initial page fails', async () => {
    const failure = new Error('page startup failed');
    const context = { newPage: vi.fn(async () => { throw failure; }), close: vi.fn(async () => {}) };
    const host = { newContext: vi.fn(async () => context) };
    await expect(runBrowserSuites(host, ['home'])).rejects.toBe(failure);
    expect(context.close).toHaveBeenCalledOnce();
  });
  it('closes the failed suite and preserves the original error if taking its screenshot fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { host, contexts } = browser();
    const failure = new Error('game failed');
    vi.mocked(runSuite).mockImplementation(async (_suite, fixture) => {
      vi.mocked(fixture.page.screenshot).mockRejectedValue(new Error('page closed'));
      throw failure;
    });
    await expect(runBrowserSuites(host, ['home', 'fingerdemo'])).rejects.toBe(failure);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].close).toHaveBeenCalledOnce();
  });
});
