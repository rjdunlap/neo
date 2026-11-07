import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blockReason } from './agent-guard.mjs'

describe('agent guard hook', () => {
  it('blocks an unfiltered browser run and allows a filtered one', () => {
    expect(blockReason('npm run test:browser')).toMatch(/BROWSER_SUITE/)
    expect(blockReason('GAME_URL=http://localhost:5173 npm run test:browser 2>&1 | tail -20')).toMatch(/BROWSER_SUITE/)
    expect(blockReason('node scripts/browser-check.mjs')).toMatch(/BROWSER_SUITE/)
    expect(blockReason('GAME_URL=http://localhost:5198 BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day npm run test:browser')).toBeNull()
    expect(blockReason('export BROWSER_SUITE=world && npm run test:browser')).toBeNull()
    expect(blockReason('grep -n "test:browser" README.md')).toBeNull()
    // Reading the harness is not running it (these were blocked before 2026-11-07).
    expect(blockReason('wc -c scripts/browser-check.mjs scripts/browser/* | tail -3')).toBeNull()
    expect(blockReason('sed -n 1,40p scripts/browser-check.mjs')).toBeNull()
    expect(blockReason('grep -n "npm run test:browser" README.md AGENTS.md')).toBeNull()
    expect(blockReason('cd /tmp && node /repo/scripts/browser-check.mjs')).toMatch(/BROWSER_SUITE/)
    expect(blockReason('ls; npm run test:browser')).toMatch(/BROWSER_SUITE/)
  })

  it('blocks a backup-suffix sed -i on macOS only', () => {
    expect(blockReason("sed -i -e 's/a/b/' docs/VERIFICATION.md", 'darwin')).toMatch(/sed -i ''/)
    expect(blockReason("sed -ie 's/a/b/' x.md", 'darwin')).toMatch(/suffix/)
    expect(blockReason("cd docs && sed -n 1p a.md; sed -i -E 's/a/b/' x.md", 'darwin')).toMatch(/suffix/)
    expect(blockReason("sed -i '' -e 's/a/b/' x.md", 'darwin')).toBeNull()
    expect(blockReason("sed -i.bak 's/a/b/' x.md", 'darwin')).toBeNull()
    expect(blockReason('sed -n 40,60p AGENTS.md', 'darwin')).toBeNull()
    expect(blockReason("sed -i -e 's/a/b/' x.md", 'linux')).toBeNull()
  })

  it('lets anything else through', () => {
    expect(blockReason('git status --short')).toBeNull()
    expect(blockReason(undefined)).toBeNull()
  })
})

// Codex stops reading instruction files at project_doc_max_bytes: 32 KiB by default, raised to 64 KiB on the
// developer's machine (2026-10-23). Past the limit Codex silently loses the end of AGENTS.md (Git, claims, merging).
describe('AGENTS.md size', () => {
  it('stays under the Codex instruction limit with room to spare', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length
    expect(bytes, 'AGENTS.md is near the 64 KiB Codex limit: move detail into DESIGN.md or a linked doc').toBeLessThan(60 * 1024)
  })
  // Every session and subagent re-reads it on every turn, and a Codex session on another machine reads only 32 KiB.
  it('fits the default 32 KiB Codex read', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length
    expect(bytes, 'AGENTS.md passed 32 KiB: move detail into docs/SESSION-GUIDE.md or its owning doc').toBeLessThanOrEqual(32 * 1024)
  })
  // It was trimmed under 32 KiB twice (2026-10-23, 2026-11-06) and crept back each time, so sessions kept shaving a few
  // bytes. On 2026-11-07 it became rules and pointers only (about 16 KB). This budget leaves 8 KB to grow before it fails,
  // and when it does fail the fix is to move detail out, not to trim words: see docs/SESSION-GUIDE.md#keeping-agentsmd-small.
  it('stays within its 24 KiB budget of rules and pointers', () => {
    const bytes = readFileSync(new URL('../AGENTS.md', import.meta.url)).length
    expect(
      bytes,
      'AGENTS.md passed its 24 KiB budget: it holds rules and pointers only. Move detail, reasons and dates to docs/SESSION-GUIDE.md, DESIGN.md or the owning doc and link to it',
    ).toBeLessThanOrEqual(24 * 1024)
  })
})
