#!/usr/bin/env node
// Check relative Markdown links and #anchors in README, AGENTS and docs/ (GitHub heading slugs).
//   node scripts/check-links.mjs            # prints each broken link, exits 1 if any
//   node scripts/check-links.mjs --fix-moved <live.md> <archive.md>
//     rewrites links to anchors that left <live.md> and now live in <archive.md>
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const files = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (p.endsWith('.md')) files.push(p)
  }
}
walk(join(root, 'docs'))
for (const f of ['README.md', 'AGENTS.md']) if (existsSync(join(root, f))) files.push(join(root, f))

const slugCache = new Map()
const slugs = (file) => {
  if (slugCache.has(file)) return slugCache.get(file)
  const seen = new Map(), out = new Set()
  let fence = false
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (/^```/.test(line)) { fence = !fence; continue }
    const m = !fence && /^#{1,6}\s+(.*)$/.exec(line)
    if (!m) continue
    let t = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_~]/g, (c) => (c === '_' ? '_' : '')).trim().toLowerCase()
    t = t.replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-')
    const n = seen.get(t) ?? 0
    seen.set(t, n + 1)
    out.add(n ? `${t}-${n}` : t)
  }
  slugCache.set(file, out)
  return out
}

const fix = process.argv[2] === '--fix-moved'
const [live, arch] = fix ? [resolve(process.argv[3]), resolve(process.argv[4])] : []
let bad = 0
for (const file of files) {
  let text = readFileSync(file, 'utf8'), changed = false, fence = false
  const lines = text.split('\n').map((line) => {
    if (/^```/.test(line)) { fence = !fence; return line }
    if (fence) return line
    return line.replace(/\]\(([^)\s]+)\)/g, (all, href) => {
      if (/^[a-z]+:/i.test(href)) return all
      const [path, hash] = href.split('#')
      const target = path ? resolve(dirname(file), path) : file
      if (!existsSync(target)) { console.log(`${relative(root, file)}: missing file ${href}`); bad++; return all }
      if (hash && target.endsWith('.md') && !slugs(target).has(hash)) {
        if (fix && target === live && slugs(arch).has(hash)) {
          changed = true
          return `](${relative(dirname(file), arch)}#${hash})`
        }
        console.log(`${relative(root, file)}: missing anchor ${href}`); bad++
      }
      return all
    })
  })
  if (changed) writeFileSync(file, lines.join('\n'))
}
console.log(bad ? `${bad} broken` : 'links ok')
process.exit(bad ? 1 : 0)
