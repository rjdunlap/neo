/**
 * How many sound effects have started (every `sfx` call counts one). The round's shell reads it to tell whether a tap
 * made a sound, so a tap while a line holds the game gets a soft tick only when nothing else answered it (U7 R5,
 * docs/definitions/never-swallow-a-tap.md). Kept apart from `sfx` so a test that mocks `sfx` still has it.
 */
export const soundCount = { n: 0 };
