import { describe, it, expect } from 'vitest';
import { ESLint } from '../tooling/lint/node_modules/eslint/lib/api.js';

const eslint = new ESLint({ overrideConfigFile: 'tooling/lint/eslint.config.mjs' });
// An existing included file gives the parser a real project without writing a fixture.
const filePath = 'src/games/fill-dump/index.ts';
async function messages(code) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages;
}

describe('minimal ESLint gates', () => {
  it('rejects any assertions, discarded promises and unmanaged game listeners', async () => {
    const findings = await messages(`
      const value = {} as any;
      Promise.resolve();
      window.addEventListener('resize', () => {});
      window['addEventListener']('resize', () => {});
    `);
    expect(findings.filter((m) => m.ruleId === 'no-restricted-syntax')).toHaveLength(3);
    expect(findings.filter((m) => m.ruleId === '@typescript-eslint/no-floating-promises')).toHaveLength(1);
    expect(findings.some((m) => m.fatal)).toBe(false);
  });

  it('accepts narrowed values, explicit fire-and-forget and scene-owned listeners', async () => {
    expect(
      await messages(`
      const value: unknown = {};
      if (typeof value === 'string') console.log(value);
      void Promise.resolve();
      Promise.resolve().catch(console.error);
      declare const ctx: { listen(target: Window, type: string, fn: () => void): void };
      ctx.listen(window, 'resize', () => {});
    `),
    ).toEqual([]);
  });
});
