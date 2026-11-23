import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blockReason, evaluateHookPayload } from './agent-guard.mjs';
import { findAgentDrift } from './sync-agents.mjs';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');

describe('agent guard hook', () => {
  it('blocks an unfiltered browser run and allows a filtered one', () => {
    expect(blockReason('npm run test:browser')).toMatch(/BROWSER_SUITE/);
    expect(blockReason('GAME_URL=http://localhost:5173 npm run test:browser 2>&1 | tail -20')).toMatch(
      /BROWSER_SUITE/,
    );
    expect(blockReason('node scripts/browser-check.mjs')).toMatch(/BROWSER_SUITE/);
    expect(
      blockReason(
        'GAME_URL=http://localhost:5198 BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day npm run test:browser',
      ),
    ).toBeNull();
    expect(blockReason('export BROWSER_SUITE=world && npm run test:browser')).toBeNull();
    expect(blockReason('grep -n "test:browser" README.md')).toBeNull();
    // Reading the harness is not running it (these were blocked before 2026-11-07).
    expect(blockReason('wc -c scripts/browser-check.mjs scripts/browser/* | tail -3')).toBeNull();
    expect(blockReason('sed -n 1,40p scripts/browser-check.mjs')).toBeNull();
    expect(blockReason('grep -n "npm run test:browser" README.md AGENTS.md')).toBeNull();
    expect(blockReason('cd /tmp && node /repo/scripts/browser-check.mjs')).toMatch(/BROWSER_SUITE/);
    expect(blockReason('ls; npm run test:browser')).toMatch(/BROWSER_SUITE/);
  });

  it('blocks a backup-suffix sed -i on macOS only', () => {
    expect(blockReason("sed -i -e 's/a/b/' docs/VERIFICATION.md", 'darwin')).toMatch(/sed -i ''/);
    expect(blockReason("sed -ie 's/a/b/' x.md", 'darwin')).toMatch(/suffix/);
    expect(blockReason("cd docs && sed -n 1p a.md; sed -i -E 's/a/b/' x.md", 'darwin')).toMatch(/suffix/);
    expect(blockReason("sed -i '' -e 's/a/b/' x.md", 'darwin')).toBeNull();
    expect(blockReason("sed -i.bak 's/a/b/' x.md", 'darwin')).toBeNull();
    expect(blockReason('sed -n 40,60p AGENTS.md', 'darwin')).toBeNull();
    expect(blockReason("sed -i -e 's/a/b/' x.md", 'linux')).toBeNull();
  });

  it('lets anything else through', () => {
    expect(blockReason('git status --short')).toBeNull();
    expect(blockReason(undefined)).toBeNull();
  });

  it('speaks Claude Code / Codex and Antigravity PreToolUse payloads', () => {
    const blockedClaude = evaluateHookPayload(
      JSON.stringify({ tool_input: { command: 'npm run test:browser' } }),
      'darwin',
    );
    expect(blockedClaude.exitCode).toBe(2);
    expect(blockedClaude.stderr).toMatch(/BROWSER_SUITE/);

    const allowedClaude = evaluateHookPayload(
      JSON.stringify({ tool_input: { command: 'git status --short' } }),
      'darwin',
    );
    expect(allowedClaude).toEqual({ exitCode: 0 });

    const blockedAgy = evaluateHookPayload(
      JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine: 'npm run test:browser' } } }),
      'darwin',
    );
    expect(blockedAgy.exitCode).toBe(0);
    expect(JSON.parse(blockedAgy.stdout)).toMatchObject({ decision: 'deny' });
    expect(JSON.parse(blockedAgy.stdout).reason).toMatch(/BROWSER_SUITE/);

    const allowedAgy = evaluateHookPayload(
      JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine: 'git status --short' } } }),
      'darwin',
    );
    expect(allowedAgy.exitCode).toBe(0);
    expect(JSON.parse(allowedAgy.stdout)).toEqual({ decision: 'allow' });

    expect(evaluateHookPayload('not json', 'darwin')).toEqual({ exitCode: 0 });
  });
});

// Codex stops reading instruction files at project_doc_max_bytes (32 KiB by default), and Antigravity caps each
// rule file at 24,000 bytes. Past either limit an agent silently loses the end of AGENTS.md (Git, claims, merging).
describe('AGENTS.md size', () => {
  it('stays under the Codex instruction limit with room to spare', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length;
    expect(
      bytes,
      'AGENTS.md is near the 64 KiB Codex limit: move detail into DESIGN.md or a linked doc',
    ).toBeLessThan(60 * 1024);
  });
  // Every session and subagent re-reads it on every turn, and a Codex session on another machine reads only 32 KiB.
  it('fits the default 32 KiB Codex read', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length;
    expect(
      bytes,
      'AGENTS.md passed 32 KiB: move detail into docs/SESSION-GUIDE.md or its owning doc',
    ).toBeLessThanOrEqual(32 * 1024);
  });
  // Antigravity caps each rule file at 24,000 bytes (and on 2026-11-07 AGENTS.md became rules and pointers only,
  // about 18 KB). When this fails the fix is to move detail out, not to trim words: docs/SESSION-GUIDE.md.
  it('stays within its 24,000-byte budget of rules and pointers', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length;
    expect(
      bytes,
      'AGENTS.md passed its 24,000-byte budget (Antigravity rule cap): it holds rules and pointers only. Move detail, reasons and dates to docs/SESSION-GUIDE.md, DESIGN.md or the owning doc and link to it',
    ).toBeLessThanOrEqual(24_000);
  });
});

describe('multi-agent configs and synced subagents', () => {
  it('keeps Codex and Antigravity subagent definitions in sync with .claude/agents/', () => {
    expect(
      findAgentDrift(root),
      'Run `node scripts/sync-agents.mjs` to regenerate .codex/agents/ and .agents/plugins/puddle-island/agents/',
    ).toEqual([]);
  });

  it('wires scripts/agent-guard.mjs in Claude Code, Codex, and Antigravity hook configs', () => {
    const claude = JSON.parse(readFileSync(join(root, '.claude', 'settings.json'), 'utf8'));
    const codex = JSON.parse(readFileSync(join(root, '.codex', 'hooks.json'), 'utf8'));
    const agyHooks = JSON.parse(
      readFileSync(join(root, '.agents', 'plugins', 'puddle-island', 'hooks.json'), 'utf8'),
    );
    const agyPlugin = JSON.parse(
      readFileSync(join(root, '.agents', 'plugins', 'puddle-island', 'plugin.json'), 'utf8'),
    );
    expect(claude.hooks.PreToolUse[0].hooks[0].command).toMatch(/agent-guard\.mjs/);
    expect(codex.hooks.PreToolUse[0].hooks[0].command).toMatch(/agent-guard\.mjs/);
    expect(agyHooks['agent-guard'].PreToolUse[0].hooks[0].command).toMatch(/agent-guard\.mjs/);
    expect(agyPlugin.name).toBe('puddle-island');
  });
});
