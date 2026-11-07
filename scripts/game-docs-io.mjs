// File access for src/content/game-docs.test.ts, which generates the game inventory docs (the app's tsconfig has no
// Node types, so the test reaches the disk through this plain script). Paths are relative to the repository root.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** `npm run game-docs` sets GAME_DOCS=write so the test rewrites the files instead of checking them. */
export const writeMode = process.env.GAME_DOCS === 'write';
export const exists = (rel) => existsSync(join(root, rel));
export const readText = (rel) => readFileSync(join(root, rel), 'utf8');
export const listDir = (rel) => (existsSync(join(root, rel)) ? readdirSync(join(root, rel)) : []);
export function writeText(rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}
