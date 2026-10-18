#!/usr/bin/env node
// Rotate dated entries out of docs/VERIFICATION.md into docs/archive/VERIFICATION-<entry date>.md.
//   node scripts/archive-verification.mjs                 # moves every entry older than the newest date present
//   node scripts/archive-verification.mjs --before=2026-10-17   # moves entries dated before that day
//   node scripts/archive-verification.mjs --keep=15       # also moves whatever lies beyond the newest 15 entries
//   node scripts/archive-verification.mjs --dry-run       # prints what would move and changes nothing
// An entry is a "## YYYY-MM-DD — title" section above "## Coverage summary". Moved entries are appended to
// their date's archive file (created with a one-line header if missing), oldest first. Afterwards
// scripts/check-links.mjs --fix-moved repoints links to the moved anchors and a plain link check runs.
// The coverage summary and everything below it stay where they are. Exits 2 on a parse problem,
// 1 if links are still broken afterwards.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const live = join(root, 'docs', 'VERIFICATION.md')
const archiveDir = join(root, 'docs', 'archive')
const checkLinks = join(root, 'scripts', 'check-links.mjs')

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a)
  if (!m) fail(`unknown argument ${a}`)
  return [m[1], m[2] ?? true]
}))
for (const k of Object.keys(args)) if (!['before', 'keep', 'dry-run'].includes(k)) fail(`unknown option --${k}`)
const dryRun = args['dry-run'] === true
const before = args.before
if (before !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(before))) fail('--before needs YYYY-MM-DD')
const keep = args.keep === undefined ? undefined : Number(args.keep)
if (keep !== undefined && !(Number.isInteger(keep) && keep >= 0)) fail('--keep needs a whole number')

function fail(msg) {
  console.error(`archive-verification: ${msg}`)
  process.exit(2)
}

// Parse the live file into preamble, dated entries and the tail from "## Coverage summary" on.
const text = readFileSync(live, 'utf8')
const lines = text.split('\n')
const summaryAt = lines.findIndex((l) => /^## Coverage summary\s*$/.test(l))
if (summaryAt < 0) fail('no "## Coverage summary" heading in docs/VERIFICATION.md')
const entries = []
let preambleEnd = -1
let fence = false
for (let i = 0; i < summaryAt; i++) {
  const line = lines[i]
  if (/^```/.test(line)) fence = !fence
  if (fence || !/^## /.test(line)) continue
  const m = /^## (\d{4}-\d{2}-\d{2})\s+[—–-]\s+(.+?)\s*$/.exec(line)
  if (!m) fail(`line ${i + 1} is a "##" heading above the coverage summary but not a dated entry: ${line}`)
  if (preambleEnd < 0) preambleEnd = i
  entries.push({ date: m[1], title: m[2], heading: line, start: i, end: summaryAt })
  if (entries.length > 1) entries[entries.length - 2].end = i
}
if (!entries.length) fail('no dated "## YYYY-MM-DD — title" entries above the coverage summary')
if (!/^# /.test(lines[0])) fail('docs/VERIFICATION.md should start with a "# " title line')
// Re-base an entry's relative links from docs/ to docs/archive/; a bare #anchor points back at the live file
// (check-links --fix-moved repoints it again if that anchor moved too).
const rebase = (body) => {
  let fence = false
  return body.split('\n').map((line) => {
    if (/^```/.test(line)) fence = !fence
    if (fence) return line
    return line.replace(/\]\(([^)\s]+)\)/g, (all, href) => {
      if (/^[a-z]+:/i.test(href)) return all
      if (href.startsWith('#')) return `](../VERIFICATION.md${href})`
      const [path, hash] = href.split('#')
      const target = resolve(dirname(live), path)
      return `](${relative(archiveDir, target)}${hash ? `#${hash}` : ''})`
    })
  }).join('\n')
}
for (const e of entries) e.body = lines.slice(e.start, e.end).join('\n').replace(/\s+$/, '')

// Choose what moves: older than the cutoff (newest date present unless --before), plus anything past --keep.
const newest = entries.map((e) => e.date).sort().at(-1)
const cutoff = before !== undefined ? String(before) : keep !== undefined ? null : newest
const moving = new Set()
entries.forEach((e, i) => {
  if (cutoff && e.date < cutoff) moving.add(i)
  if (keep !== undefined && i >= keep) moving.add(i)
})
if (!moving.size) {
  console.log(`nothing to move: ${entries.length} entries live, newest ${newest}${cutoff ? `, cutoff ${cutoff}` : ''}${keep !== undefined ? `, keep ${keep}` : ''}`)
  process.exit(0)
}

// Group by date; within a date the file is newest-first, so append in reverse order to keep oldest first.
const byDate = new Map()
for (const i of [...moving].sort((a, b) => b - a)) {
  const e = entries[i]
  if (!byDate.has(e.date)) byDate.set(e.date, [])
  byDate.get(e.date).push(e)
}
const slug = (heading) => heading.replace(/^#+\s+/, '').replace(/[`*_~]/g, '').trim().toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-')

const touched = []
for (const [date, list] of [...byDate].sort()) {
  const file = join(archiveDir, `VERIFICATION-${date}.md`)
  const rel = relative(root, file)
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : null
  if (existing !== null) {
    const have = new Set(existing.split('\n').filter((l) => /^#{1,6}\s/.test(l)).map(slug))
    for (const e of list) if (have.has(slug(e.heading))) console.warn(`warning: ${rel} already has a heading "${e.heading}"; its anchor will shift`)
  }
  for (const e of list) console.log(`${dryRun ? 'would move' : 'move'} "${e.heading}" -> ${rel}`)
  if (dryRun) continue
  const head = existing === null ? `# Verification ${date} (archived entries)\n` : existing.replace(/\s+$/, '') + '\n'
  writeFileSync(file, head + '\n' + list.map((e) => rebase(e.body)).join('\n\n') + '\n')
  touched.push(file)
}

const kept = entries.filter((_, i) => !moving.has(i))
console.log(`${moving.size} ${moving.size === 1 ? 'entry' : 'entries'} ${dryRun ? 'would move' : 'moved'}; ${kept.length} stay live`)
if (dryRun) process.exit(0)

const preamble = lines.slice(0, preambleEnd).join('\n').replace(/\s+$/, '')
const tail = lines.slice(summaryAt).join('\n')
writeFileSync(live, [preamble, ...kept.map((e) => e.body), tail].join('\n\n'))

// Repoint links to the moved anchors, then check every Markdown link once.
for (const file of touched) {
  const r = spawnSync(process.execPath, [checkLinks, '--fix-moved', live, file], { cwd: root, encoding: 'utf8' })
  if (r.error) fail(`could not run check-links: ${r.error.message}`)
}
const check = spawnSync(process.execPath, [checkLinks], { cwd: root, encoding: 'utf8' })
process.stdout.write(check.stdout)
process.stderr.write(check.stderr)
process.exit(check.status === 0 ? 0 : 1)
