import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { ALL_SUITES, createChecks, runSuite, SUITES } from './registry.mjs';
import { fingerPlays, selectNames, selectValue } from './selection.mjs';

const games = [{ id: 'ordered', ranges: [{ band: 'lap', levels: [9, 1, 11] }, { band: 'school', levels: [4, 7, 6] }] }];
describe('browser check selections', () => {
  it('rejects empty, unknown and partially unknown selections, and deduplicates valid requests', () => {
    for (const value of ['', ',', 'missing', 'home,missing']) expect(() => selectNames(value, SUITES, 'BROWSER_SUITE')).toThrow(/BROWSER_SUITE/);
    expect(selectNames('home,home,world', SUITES, 'BROWSER_SUITE')).toEqual(['home', 'world']);
    expect(selectNames(undefined, ['a', 'b'], 'ONLY')).toEqual(['a', 'b']);
    expect(() => selectNames(undefined, [], 'ONLY')).toThrow(/at least one/);
  });
  it('rejects lists and whitespace for single-value subfilters', () => {
    for (const value of ['6,8', '6 ', '', '7']) expect(() => selectValue(value, ['6', '8'], 'CLAP_LEVELS')).toThrow(/CLAP_LEVELS/);
    expect(selectValue('6', ['6', '8'], 'CLAP_LEVELS')).toBe('6');
  });
  it('uses the actual ordered ladder endpoints for default finger demos', () => {
    expect(fingerPlays(games)[0].plays).toEqual([{ band: 'lap', level: 9 }, { band: 'school', level: 6 }]);
  });
  it('rejects invalid or reserved finger levels instead of silently skipping them', () => {
    for (const levels of ['', '0', '-1', 'NaN', '1.5', '5', '9,5']) expect(() => fingerPlays(games, levels)).toThrow(/FINGER_LEVELS/);
    expect(fingerPlays(games, '7,9,7')[0].plays).toEqual([{ band: 'school', level: 7 }, { band: 'lap', level: 9 }]);
  });
  it('requires every selected game to support the requested level', () => {
    expect(() => fingerPlays([...games, { id: 'other', ranges: [{ band: 'lap', levels: [1] }] }], '9')).toThrow(/other has no level 9/);
  });
  it('rejects an unknown dispatcher name before touching a fixture', async () => {
    await expect(runSuite('unknown', {})).rejects.toThrow(/BROWSER_SUITE/);
  });
  it('keeps a single endpoint when the only band has a single level', () => {
    expect(fingerPlays([{ id: 'one', ranges: [{ band: 'lap', levels: [3] }] }])[0].plays).toEqual([{ band: 'lap', level: 3 }]);
  });
  it('imports all suite modules without opening a browser and exposes callable checks', () => {
    const checks = createChecks({});
    expect(Object.keys(checks).length).toBeGreaterThan(100);
    expect(Object.values(checks).every(f => typeof f === 'function')).toBe(true);
    expect(new Set(SUITES).size).toBe(SUITES.length);
    expect(ALL_SUITES.every(s => SUITES.includes(s))).toBe(true);
  });
  it.each([['browser', 'BROWSER_SUITE'], ['offline', 'OFFLINE_SUITE']])('rejects a typo at the %s CLI before launching Chromium', (script, label) => {
    const result = spawnSync(process.execPath, [`scripts/${script}-check.mjs`], { encoding: 'utf8', env: { ...process.env, [label]: 'does-not-exist', BROWSER_EXECUTABLE: '/does-not-exist' } });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(`${label}: unknown selection does-not-exist`);
    expect(result.stderr).not.toContain('browserType.launch');
  });
});
