import { afterEach, describe, expect, it } from 'vitest';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { barrels } from './content-barrels.mjs';
import { parseArgs, scaffold } from './new-game.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const roots = [];
const options = { id: 'test-starter', name: 'Starter "with quotes"', land: 'puzzle-peaks', region: 'tinker-lab', band: 'preschool', challenge: 'logic' };
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'neo-scaffold-'));
  roots.push(root);
  for (const path of ['src/content/lands.ts', 'src/content/world.ts', 'src/content/voice-script.ts', 'src/content/howto.ts', 'src/progress/bands.ts', 'src/games/types.ts']) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(repo, path), join(root, path));
  }
  return root;
}
function tree(root) {
  return readdirSync(root, { recursive: true }).sort().map(path => {
    try { return [path, readFileSync(join(root, path), 'utf8')]; } catch { return [path]; }
  });
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('new-game scaffold', () => {
  it('previews without writes and creates colocated, safely quoted files with exactly one land placement and current barrels', () => {
    const root = fixture(), before = tree(root);
    const preview = scaffold(root, { ...options, dryRun: true });
    expect(tree(root)).toEqual(before);
    expect(scaffold(root, options)).toEqual(preview);
    const module = readFileSync(join(root, 'src/games/test-starter/index.ts'), 'utf8');
    expect(module).toContain(`name: ${JSON.stringify(options.name)}`);
    expect(module).toContain('region: "tinker-lab"');
    expect(module).toContain('Scaffold: implement test-starter');
    expect(readFileSync(join(root, 'src/games/test-starter/logic.ts'), 'utf8')).toContain('"preschool": { min: 1, max: 1 }');
    const lands = readFileSync(join(root, 'src/content/lands.ts'), 'utf8');
    expect(lands.match(/'test-starter'/g)).toHaveLength(1);
    expect(lands).toMatch(/id: 'puzzle-peaks',[\s\S]*?games: \[[^\]]*'test-starter'\]/);
    expect(barrels(root).every(b => !b.stale)).toBe(true);
    expect(readFileSync(join(root, 'src/content/voice-script.ts'), 'utf8')).toContain("import { VOICE as testStarterVoice } from '../games/test-starter/voice.ts'");
    const suite = join(root, 'scripts/browser/suites/test-starter-play.mjs');
    execFileSync(process.execPath, ['--check', suite]);
    expect(readFileSync(suite, 'utf8')).toContain('assert.fail(');
    expect(tree(root).filter(([path]) => path.endsWith('.ts') && path.includes('test-starter/'))).toHaveLength(5);
  });

  it.each([
    { id: '../escape' }, { id: 'MixedCase' }, { id: 'a'.repeat(65) }, { name: '' }, { name: 'two\nlines' },
    { land: 'unknown' }, { region: 'lantern-lake' }, { band: 'unknown' }, { challenge: 'unknown' },
  ])('rejects invalid input before any writes: %j', change => {
    const root = fixture(), before = tree(root);
    expect(() => scaffold(root, { ...options, ...change })).toThrow();
    expect(tree(root)).toEqual(before);
  });

  it.each(['src/games/test-starter/index.ts', 'docs/games/test-starter.md', 'scripts/browser/suites/test-starter-play.mjs'])('never overwrites %s or partially creates a game', path => {
    const root = fixture();
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), 'keep my work');
    const before = tree(root);
    expect(() => scaffold(root, options)).toThrow(/Already exists/);
    expect(tree(root)).toEqual(before);
  });

  it('rejects a repeated run without touching the generated work', () => {
    const root = fixture();
    scaffold(root, options);
    const before = tree(root);
    expect(() => scaffold(root, options)).toThrow(/Already exists/);
    expect(tree(root)).toEqual(before);
  });

  it('rejects symlinked and dangling output ancestors', () => {
    const root = fixture(), elsewhere = fixture();
    mkdirSync(join(root, 'docs'));
    symlinkSync(join(elsewhere, 'missing'), join(root, 'docs/games'));
    expect(() => scaffold(root, options)).toThrow(/symlink/);
    expect(existsSync(join(root, 'src/games/test-starter'))).toBe(false);
    expect(existsSync(join(elsewhere, 'missing'))).toBe(false);
  });

  it('preflights generated blocks before changing the land or making files', () => {
    const root = fixture();
    writeFileSync(join(root, 'src/content/howto.ts'), 'broken markers');
    const before = tree(root);
    expect(() => scaffold(root, options)).toThrow(/block/);
    expect(tree(root)).toEqual(before);
  });

  it('rejects an alias collision, including hyphenated digits', () => {
    const root = fixture();
    writeFileSync(join(root, 'src/content/voice-script.ts'), 'const test1Voice = {};');
    expect(() => scaffold(root, { ...options, id: 'test-1' })).toThrow(/alias/);
    expect(existsSync(join(root, 'src/games/test-1'))).toBe(false);
  });

  it('supports reformatted metadata and trailing commas in land arrays', () => {
    const root = fixture();
    for (const path of ['src/content/lands.ts', 'src/content/world.ts', 'src/progress/bands.ts', 'src/games/types.ts']) {
      const target = join(root, path);
      let text = readFileSync(target, 'utf8').replaceAll("'", '"');
      if (path.endsWith('lands.ts')) text = text.replace(/games: \[([^\]]+)\]/g, 'games: [\n$1,\n]');
      writeFileSync(target, text);
    }
    scaffold(root, options);
    expect(readFileSync(join(root, 'src/content/lands.ts'), 'utf8')).not.toContain(",, ");
    expect(barrels(root).every(b => !b.stale)).toBe(true);
  });

  it('runs the CLI relative to the target worktree, with a read-only preview and useful failure status', () => {
    const root = fixture(), before = tree(root);
    const cli = join(repo, 'scripts/new-game.mjs');
    const args = [cli, options.id, '--name', options.name, '--land', options.land, '--region', options.region, '--band', options.band, '--challenge', options.challenge];
    expect(execFileSync(process.execPath, [...args, '--dry-run'], { cwd: root, encoding: 'utf8' })).toContain('Would write:');
    expect(tree(root)).toEqual(before);
    execFileSync(process.execPath, args, { cwd: root });
    expect(() => execFileSync(process.execPath, args, { cwd: root, stdio: 'pipe' })).toThrow();
  });

  it('parses required values and rejects unknown/repeated/incomplete flags', () => {
    expect(parseArgs(['test-starter', '--name', 'A name', '--dry-run'])).toEqual({ id: 'test-starter', name: 'A name', dryRun: true });
    for (const args of [[], ['../x', '--force'], ['test', '--name'], ['test', '--name', 'A', '--name', 'B'], ['test', '--dry-run', '--dry-run']]) {
      expect(() => parseArgs(args)).toThrow();
    }
  });
});
