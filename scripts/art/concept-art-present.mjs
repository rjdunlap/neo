// Art scripts read or add concept-art originals; a code session may have skipped them (scripts/concept-art.sh).
import { execFileSync } from 'node:child_process';

/** Exit with the restore command when this checkout left the concept-art PNGs out. */
export function requireConceptArt(root) {
  let out = '';
  try {
    out = execFileSync('git', ['ls-files', '-t', 'docs/rework/concepts'], { cwd: root, encoding: 'utf8' });
  } catch {
    return; // Not a git checkout: nothing was skipped.
  }
  if (out.split('\n').some((l) => l.startsWith('S '))) {
    console.error(
      'The concept-art PNGs are skipped in this checkout. Run scripts/concept-art.sh restore first.',
    );
    process.exit(1);
  }
}
