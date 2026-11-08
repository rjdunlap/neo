#!/usr/bin/env node
// Read big files in small pieces (docs/SESSION-GUIDE.md, "Read big files by section"). Every printed line is cut to a width,
// because the one-line-paragraph docs hold lines of 1–28 KB and a plain grep or cat returns them whole.
//
//   node scripts/peek.mjs outline docs/definitions/rain-garden.md     headings (Markdown) or top-level declarations, tables
//                                                                    and class methods (.ts/.mjs), with line numbers
//   node scripts/peek.mjs section docs/ROADMAP.md "Next up"          one Markdown section (heading text, case-insensitive
//                                                                    substring; the first match), up to the next heading
//                                                                    of the same or a higher level
//   node scripts/peek.mjs grep docs/GAMES.md "bolt-boards" [more…]   matching lines with line numbers, each shown as a
//                                                                    window around the first match; several files allowed
//
// Options: --width=N (default 220 for grep/outline, 600 for section; 0 = no cut), --max=N (most lines printed, default
// 60 for grep, 400 for section), -i is always on for grep. A cut line ends with "…[+N]" (N characters hidden).
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opts = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [cmd, ...rest] = args.filter((a) => !a.startsWith('--'));
const usage = () => {
  console.error('usage: peek.mjs outline <file> | section <file> <heading> | grep <file>… <pattern>');
  process.exit(2);
};
if (!cmd || rest.length === 0) usage();

const cut = (s, width) => (width > 0 && s.length > width ? `${s.slice(0, width)}…[+${s.length - width}]` : s);
const lines = (file) => readFileSync(file, 'utf8').split('\n');
const num = (n) => String(n).padStart(5);

if (cmd === 'outline') {
  const width = Number(opts.width ?? 160);
  for (const file of rest) {
    const md = /\.mdx?$/.test(file);
    let fence = false;
    lines(file).forEach((line, i) => {
      if (md) {
        if (/^\s*```/.test(line)) fence = !fence;
        if (!fence && /^#{1,6} /.test(line)) console.log(`${num(i + 1)}  ${cut(line, width)}`);
      } else if (
        /^(export\s+)?(default\s+)?(async\s+)?(function\*?|class|interface|type|enum)\s/.test(line) ||
        // Constants only when exported or when they open a body (tables, arrow functions), not one-line scalars.
        /^export\s+(const|let)\s/.test(line) ||
        /^(const|let)\s.*(=>|[{[(])\s*$/.test(line) ||
        (/^ {2}(private |protected |public |static |readonly |async |get |set )*[A-Za-z_$][\w$]*\s*(<[^>]*>)?\(.*\)\s*(:\s*[^=]+)?\{\s*$/.test(
          line,
        ) &&
          !/^ {2}(if|for|while|switch|catch|with|return|else)\b/.test(line))
      ) {
        console.log(`${num(i + 1)}  ${cut(line, width)}`);
      }
    });
  }
} else if (cmd === 'section') {
  const [file, ...words] = rest;
  const want = words.join(' ').toLowerCase();
  if (!want) usage();
  const width = Number(opts.width ?? 600);
  const max = Number(opts.max ?? 400);
  const all = lines(file);
  let start = -1;
  let level = 0;
  let fence = false;
  for (let i = 0; i < all.length; i++) {
    if (/^\s*```/.test(all[i])) fence = !fence;
    const m = !fence && /^(#{1,6}) (.*)/.exec(all[i]);
    if (!m) continue;
    if (start < 0 && m[2].toLowerCase().includes(want)) {
      start = i;
      level = m[1].length;
    } else if (start >= 0 && m[1].length <= level) {
      all.length = i;
      break;
    }
  }
  if (start < 0) {
    console.error(`no heading containing "${want}" in ${file}; try: node scripts/peek.mjs outline ${file}`);
    process.exit(1);
  }
  const body = all.slice(start);
  body.slice(0, max).forEach((line, k) => console.log(`${num(start + k + 1)}  ${cut(line, width)}`));
  if (body.length > max)
    console.log(`… ${body.length - max} more lines (--max=N, or read from line ${start + max + 1})`);
} else if (cmd === 'grep') {
  const pattern = rest.at(-1);
  const files = rest.slice(0, -1);
  if (files.length === 0) usage();
  const re = new RegExp(pattern, 'i');
  const width = Number(opts.width ?? 220);
  const max = Number(opts.max ?? 60);
  let shown = 0;
  let total = 0;
  for (const file of files) {
    lines(file).forEach((line, i) => {
      const m = re.exec(line);
      if (!m) return;
      total++;
      if (shown >= max) return;
      shown++;
      // Show a window around the match rather than the start of a long paragraph.
      const from =
        width > 0 && line.length > width
          ? Math.max(0, Math.min(m.index - (width >> 2), line.length - width))
          : 0;
      const text = (from > 0 ? '…' : '') + cut(line.slice(from), width);
      console.log(`${files.length > 1 ? `${file}:` : ''}${i + 1}: ${text}`);
    });
  }
  if (total > shown) console.log(`… ${total - shown} more matches (--max=N, or narrow the pattern)`);
  if (total === 0) process.exit(1);
} else {
  usage();
}
