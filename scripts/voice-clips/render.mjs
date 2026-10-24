// Renders the spoken clips for src/content/voice-script.ts with Kokoro, on this machine.
//   cd scripts/voice-clips && npm ci && node render.mjs [--limit=20]
// Needs macOS (afconvert encodes AAC) and, the first time, the network to fetch the model into node_modules.
// Writes src/audio/clips/<key>.m4a and src/content/voice-clips.json, renders only clips that are missing,
// and deletes clips no current line uses. Never hand-edit either; rerun this after changing a chosen line.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KokoroTTS } from 'kokoro-js';
import { SCRIPT } from '../../src/content/voice-script.ts';
import { SETTINGS, chosenTexts, clipKey } from './clips.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outDir = join(root, 'src/audio/clips');
const manifestPath = join(root, 'src/content/voice-clips.json');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

mkdirSync(outDir, { recursive: true });
const texts = chosenTexts(SCRIPT).slice(0, limit);
const wanted = new Map(texts.map((t) => [clipKey(t), t]));
const missing = [...wanted].filter(([key]) => !existsSync(join(outDir, `${key}.m4a`)));
console.log(`${wanted.size} clips wanted, ${missing.length} to render`);

if (missing.length) {
  const tts = await KokoroTTS.from_pretrained(SETTINGS.model, { dtype: SETTINGS.dtype, device: 'cpu' });
  const wav = join(tmpdir(), `neo-voice-${process.pid}.wav`);
  let n = 0;
  for (const [key, text] of missing) {
    const audio = await tts.generate(text, { voice: SETTINGS.voice, speed: SETTINGS.speed });
    await audio.save(wav);
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', wav, join(outDir, `${key}.m4a`)]);
    if (++n % 25 === 0 || n === missing.length) console.log(`${n}/${missing.length}`);
  }
  rmSync(wav, { force: true });
}

for (const file of readdirSync(outDir)) {
  if (file.endsWith('.m4a') && !wanted.has(file.slice(0, -4))) rmSync(join(outDir, file));
}
const clips = Object.fromEntries([...wanted].map(([key, text]) => [text, key]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(manifestPath, `${JSON.stringify({ settings: SETTINGS, clips }, null, 1)}\n`);
console.log(`wrote ${Object.keys(clips).length} entries to src/content/voice-clips.json`);
