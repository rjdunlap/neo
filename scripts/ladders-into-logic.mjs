#!/usr/bin/env node
// Moves a game's `const LEVELS: BandLevels` table, with the comments right above it, from src/games/<id>/index.ts into
// that game's logic.ts as `export const LEVELS`, so the ladder is testable without Pixi (codebase review item 5).
// A table moves only when every name it uses is already imported from './logic'; otherwise the game is skipped and
// the reason printed. Inline `levels:` ternaries are never converted: a ternary's last branch covers every band it
// does not name, where `rangeFor` gives a missing band { min: 1, max: 1 }, so a conversion is a hand job.
//
//   node scripts/ladders-into-logic.mjs <id>…   # move these games' tables
//   node scripts/ladders-into-logic.mjs --all   # every game whose index.ts still holds one
// Then: npm run typecheck, npm test, and shrink the allowlist in src/games/ladders.test.ts.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'rolldown/parseAst';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'src/games');

/** Start of the comment lines (a JSDoc block or `//` lines) directly above `start`, or `start` itself. */
function commentStart(src, start) {
  let at = src.lastIndexOf('\n', start - 1) + 1;
  for (;;) {
    if (at === 0) return at;
    const prevStart = src.lastIndexOf('\n', at - 2) + 1;
    const line = src.slice(prevStart, at - 1).trim();
    if (line.startsWith('//')) { at = prevStart; continue; }
    if (line.endsWith('*/')) {
      const open = src.lastIndexOf('/**', at - 1);
      if (open < 0) return at;
      at = src.lastIndexOf('\n', open - 1) + 1;
      continue;
    }
    return at;
  }
}

/** Every identifier the expression reads (not property keys, not `.member` names). */
function namesIn(node, out = new Set()) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const n of node) namesIn(n, out); return out; }
  if (node.type === 'Identifier') { out.add(node.name); return out; }
  if (node.type === 'Property') { if (node.computed) namesIn(node.key, out); namesIn(node.value, out); return out; }
  if (node.type === 'MemberExpression') { namesIn(node.object, out); if (node.computed) namesIn(node.property, out); return out; }
  for (const [k, v] of Object.entries(node)) if (k !== 'typeAnnotation' && v && typeof v === 'object') namesIn(v, out);
  return out;
}

/** The name a top-level statement declares first, if any. */
const declaredName = (stmt) => {
  const d = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
  if (d?.type === 'VariableDeclaration') return d.declarations[0].id.name;
  return d?.id?.name;
};

const declares = (stmt, name) => {
  const d = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
  if (!d) return false;
  if (d.type === 'VariableDeclaration') return d.declarations.some((v) => v.id.type === 'Identifier' && v.id.name === name);
  return (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') && d.id?.name === name;
};

/** Splice edits ({ at, end, text }) into src, last first. */
const apply = (src, edits) => edits.sort((a, b) => b.at - a.at).reduce((s, e) => s.slice(0, e.at) + e.text + s.slice(e.end), src);

/** Moves one game's table; returns null on success or the reason it was skipped. */
export function moveLadder(id, { write = true } = {}) {
  const indexPath = join(gamesDir, id, 'index.ts');
  const logicPath = join(gamesDir, id, 'logic.ts');
  if (!existsSync(indexPath) || !existsSync(logicPath)) return 'no index.ts or logic.ts';
  const index = readFileSync(indexPath, 'utf8');
  const logic = readFileSync(logicPath, 'utf8');
  const iAst = parseAst(index, { lang: 'ts' });
  const lAst = parseAst(logic, { lang: 'ts' });

  const stmt = iAst.body.find((s) => declares(s, 'LEVELS'));
  if (!stmt) return 'no LEVELS in index.ts';
  if (lAst.body.some((s) => declares(s, 'LEVELS'))) return 'logic.ts already declares LEVELS';
  const decl = (stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt).declarations[0];

  const fromLogic = iAst.body.find((s) => s.type === 'ImportDeclaration' && s.source.value === './logic' && s.importKind !== 'type');
  const logicNames = new Set(fromLogic?.specifiers.filter((s) => s.importKind !== 'type').map((s) => s.local.name) ?? []);
  const foreign = [...namesIn(decl.init)].filter((n) => !logicNames.has(n));
  if (foreign.length) return `uses ${foreign.join(', ')}, not imported from ./logic`;

  // The table and its comments, as logic.ts will hold it.
  const cut = commentStart(index, stmt.start);
  let end = stmt.end;
  while (index[end] === '\n') end++;
  const comments = index.slice(cut, stmt.start);
  const table = `${comments}export ${index.slice(decl === stmt.declarations?.[0] ? stmt.start : stmt.declaration.start, stmt.end)}\n`;

  // index.ts: drop the table, import LEVELS from ./logic, and drop BandLevels if nothing else uses it.
  const iEdits = [{ at: cut, end, text: '' }];
  if (fromLogic) {
    const brace = index.indexOf('{', fromLogic.start) + 1;
    const pad = index[brace] === ' ' ? ' ' : '';
    iEdits.push({ at: brace, end: brace + pad.length, text: index[brace] === '\n' ? '\n  LEVELS,' : `${pad}LEVELS, ` });
  } else {
    const last = iAst.body.filter((s) => s.type === 'ImportDeclaration').at(-1);
    iEdits.push({ at: last.end, end: last.end, text: `\nimport { LEVELS } from './logic';` });
  }
  let nextIndex = apply(index, iEdits);
  if (!/\bBandLevels\b/.test(nextIndex.replace(/import[^;]*from '\.\.\/\.\.\/progress\/difficulty';/g, ''))) {
    nextIndex = nextIndex
      .replace(/^import type \{ BandLevels \} from '\.\.\/\.\.\/progress\/difficulty';\n/m, '')
      .replace(/(import \{[^}]*?),\s*type BandLevels(\s*\} from '\.\.\/\.\.\/progress\/difficulty')/, '$1$2')
      .replace(/(import \{\s*)type BandLevels,\s*([^}]*\} from '\.\.\/\.\.\/progress\/difficulty')/, '$1$2')
      .replace(/import type \{([^}]*?),\s*BandLevels(\s*\} from '\.\.\/\.\.\/progress\/difficulty')/, 'import type {$1$2')
      .replace(/import type \{\s*BandLevels,\s*([^}]*\} from '\.\.\/\.\.\/progress\/difficulty')/, 'import type { $1');
  }

  // logic.ts: the table goes after the last statement declaring a name it uses (so it never reads one before it
  // exists), else after the level plans (PLANS, planFor, LEVEL_COUNT or a describe…), else at the end; BandLevels
  // joins an existing difficulty import or gets its own.
  const used = namesIn(decl.init);
  const imports = lAst.body.filter((s) => s.type === 'ImportDeclaration');
  const plans = (s) => ['PLANS', 'planFor', 'LEVEL_COUNT'].some((n) => declares(s, n)) || /^describe/.test(declaredName(s) ?? '');
  const anchor = lAst.body.filter((s) => [...used].some((n) => declares(s, n))).at(-1) ?? lAst.body.find(plans) ?? lAst.body.at(-1);
  const lEdits = [{ at: anchor.end, end: anchor.end, text: `\n\n${table.replace(/\n$/, '')}` }];
  const difficulty = imports.find((s) => s.source.value === '../../progress/difficulty');
  const hasType = difficulty?.specifiers.some((s) => s.local.name === 'BandLevels');
  if (!hasType) {
    if (difficulty) {
      const close = logic.lastIndexOf('}', difficulty.end);
      const before = logic.slice(difficulty.start, close).trimEnd();
      const typeOnly = difficulty.importKind === 'type';
      const at = difficulty.start + before.length;
      lEdits.push({ at, end: at, text: typeOnly ? ', BandLevels' : ', type BandLevels' });
    } else {
      const line = `import type { BandLevels } from '../../progress/difficulty';`;
      const last = imports.at(-1);
      lEdits.push(last ? { at: last.end, end: last.end, text: `\n${line}` } : { at: 0, end: 0, text: `${line}\n` });
    }
  }
  const nextLogic = apply(logic, lEdits);

  if (write) {
    writeFileSync(indexPath, nextIndex);
    writeFileSync(logicPath, nextLogic);
  }
  return null;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const ids = args.includes('--all')
    ? readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'index.ts')) && /\bconst LEVELS\b/.test(readFileSync(join(gamesDir, id, 'index.ts'), 'utf8')))
    : args;
  if (!ids.length) { console.error('usage: ladders-into-logic.mjs <id>… | --all'); process.exit(2); }
  let moved = 0;
  for (const id of ids) {
    const why = moveLadder(id);
    if (why) console.log(`skip ${id}: ${why}`);
    else { moved++; console.log(`moved ${id}`); }
  }
  console.log(`${moved} moved, ${ids.length - moved} skipped`);
}
