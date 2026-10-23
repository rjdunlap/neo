// Claude Code PreToolUse hook for Bash (.claude/settings.json): blocks commands AGENTS.md says never to run.
// Reads the hook's JSON on stdin; exit 2 with a reason on stderr blocks the call and tells the agent why.
//
//   echo '{"tool_input":{"command":"npm run test:browser"}}' | node scripts/agent-guard.mjs   # exit 2

/** Why `command` must not run, or null when it may. `platform` decides the macOS-only sed rule. */
export function blockReason(command, platform = process.platform) {
  if (typeof command !== 'string') return null
  if (/\bnpm run test:browser\b|\bscripts\/browser-check\.mjs\b/.test(command) && !/\bBROWSER_SUITE=/.test(command)) {
    return 'Never start the browser harness without a filter (AGENTS.md, "Verification budget"): set BROWSER_SUITE (and its game filter) on the same command, e.g. GAME_URL=… BROWSER_SUITE=fingerdemo FINGER_ONLY=<id> npm run test:browser.'
  }
  // BSD sed reads the word after -i as a backup suffix, so `sed -i -e …` leaves a stray `<file>-e` copy (one was committed).
  if (platform === 'darwin' && /(^|[\s;&|(])sed\s+(?:-[A-Za-z]+\s+)*-i(?:\s+-[A-Za-z]|[A-Za-z])/.test(command)) {
    return "On macOS `sed -i -e` (or `-ie`) treats the next word as a backup suffix and leaves a stray <file>-e copy. Use `sed -i '' -e …`, or the Edit tool for doc changes."
  }
  return null
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  let input = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (chunk) => (input += chunk))
  process.stdin.on('end', () => {
    let command
    try {
      command = JSON.parse(input)?.tool_input?.command
    } catch {
      process.exit(0) // Not our input: never block on a parse problem.
    }
    const reason = blockReason(command)
    if (reason) {
      process.stderr.write(reason + '\n')
      process.exit(2)
    }
    process.exit(0)
  })
}
