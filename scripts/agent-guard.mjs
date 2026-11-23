// PreToolUse hook for Bash / run_command across Claude Code (.claude/settings.json), Codex (.codex/hooks.json),
// and Antigravity (.agents/plugins/puddle-island/hooks.json): blocks commands AGENTS.md says never to run.
// Reads the hook's JSON on stdin and replies using the caller's contract:
//   - Claude Code / Codex (`tool_input.command`): exit 2 with the reason on stderr when blocked; exit 0 when allowed.
//   - Antigravity (`toolCall.args.CommandLine`): JSON decision on stdout (`deny` with reason, or `allow`), exit 0.
//
//   echo '{"tool_input":{"command":"npm run test:browser"}}' | node scripts/agent-guard.mjs   # exit 2
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Why `command` must not run, or null when it may. `platform` decides the macOS-only sed rule. */
export function blockReason(command, platform = process.platform) {
  if (typeof command !== 'string') return null;
  // Only a command that starts the harness: npm or node at a command position. Reading, grepping or listing its
  // files (`wc -c scripts/browser-check.mjs`, `grep "npm run test:browser" README.md`) is not a run.
  const runsHarness =
    /(^|[\s;&|(])npm\s+run\s+test:browser\b|(^|[\s;&|(])node\s+(?:-\S+\s+)*\S*browser-check\.mjs\b/.test(
      command,
    );
  if (runsHarness && !/\bBROWSER_SUITE=/.test(command)) {
    return 'Never start the browser harness without a filter (AGENTS.md, "Verification budget"): set BROWSER_SUITE (and its game filter) on the same command, e.g. GAME_URL=… BROWSER_SUITE=fingerdemo FINGER_ONLY=<id> npm run test:browser.';
  }
  // BSD sed reads the word after -i as a backup suffix, so `sed -i -e …` leaves a stray `<file>-e` copy (one was committed).
  if (
    platform === 'darwin' &&
    /(^|[\s;&|(])sed\s+(?:-[A-Za-z]+\s+)*-i(?:\s+-[A-Za-z]|[A-Za-z])/.test(command)
  ) {
    return "On macOS `sed -i -e` (or `-ie`) treats the next word as a backup suffix and leaves a stray <file>-e copy. Use `sed -i '' -e …`, or the Edit tool for doc changes.";
  }
  return null;
}

/** Evaluate a raw JSON stdin payload and return `{ exitCode, stdout?, stderr? }` for the caller's hook contract. */
export function evaluateHookPayload(input, platform = process.platform) {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    return { exitCode: 0 }; // Not our input: never block on a parse problem.
  }
  if (payload && typeof payload.toolCall === 'object' && payload.toolCall !== null) {
    const command = payload.toolCall.args?.CommandLine;
    const reason = blockReason(command, platform);
    if (reason) {
      return { exitCode: 0, stdout: `${JSON.stringify({ decision: 'deny', reason })}\n` };
    }
    return { exitCode: 0, stdout: `${JSON.stringify({ decision: 'allow' })}\n` };
  }
  const command = payload?.tool_input?.command;
  const reason = blockReason(command, platform);
  if (reason) {
    return { exitCode: 2, stderr: `${reason}\n` };
  }
  return { exitCode: 0 };
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    const result = evaluateHookPayload(input);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.exitCode);
  });
}
