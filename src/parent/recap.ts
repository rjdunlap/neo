import { NO_NAME, offScreenFor } from '../content/offscreen';
import {
  WELCOME_PLAN,
  WELCOME_STEPS,
  welcomeBand,
  welcomeFriend,
  type WelcomeBand,
  type WelcomeProject,
  type WelcomeStep,
} from '../content/welcome';
import { gameById } from '../games/registry';
import { classify, type EvidenceClass } from '../learning/evidence';
import { WELCOME_INTENTIONS, type LearningSubject } from '../learning/intentions';
import type { SaveData } from '../progress/save';

/**
 * The grown-ups' recap of Welcome a New Friend (RW09, docs/rework/LEARNING-RECAP.md#the-recap): what each step asks,
 * what happened the last time in words, and an off-screen idea. Pure, so tests read the string without the DOM. It
 * names what a step asks and never scores, totals or claims more than one round shows. The child sees none of it.
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const SUBJECT: Record<LearningSubject, string> = { art: 'Art', number: 'Number', music: 'Music' };

/** The one line under the table: rewards are rewards, not evidence. */
export const REWARD_NOTE =
  "The new friend and the stickers are rewards for finishing, with or without help. They aren't evidence of learning. One round is one observation; doing it in other places and on other days is what would show more.";

/** What happened, in words, for one step. `who` is her name (already escaped). */
export function stepLine(p: WelcomeProject, step: WelcomeStep, band: WelcomeBand, who: string): string {
  const row = WELCOME_INTENTIONS[step][band];
  const rec = p.evidence[step];
  const done = p.steps.includes(step);
  // A step finished before records existed (an older development save) has no record, or only an opened one.
  if (done && !rec?.finished) return 'Finished before this recap existed; nothing was recorded about how.';
  const cls: EvidenceClass = classify(rec, row.kind, WELCOME_PLAN[step]!.level[band]);
  const times = rec && rec.rounds > 1 ? ` (finished ${rec.rounds} times)` : '';
  switch (cls) {
    case 'independent':
      return `${cap(who)} ${row.did} without help the last time: no wrong tries, no hints.${times}`;
    case 'supported': {
      const tries = rec!.misses === 0 ? 'no wrong tries' : plural(rec!.misses, 'wrong try', 'wrong tries');
      const hints =
        rec!.hints === 0
          ? 'no hints'
          : rec!.hints === 1
            ? 'the glowing hint'
            : `the glowing hint ${rec!.hints} times`;
      return `${cap(who)} ${row.did} with help the last time: ${tries} and ${hints}.${times} Finishing with help is how this is practised; it does not yet show ${who} can do it alone.`;
    }
    case 'creative':
      return creativeLine(p, step, who) + times;
    case 'encountered':
      return 'Opened, not finished yet. Nothing to say about it yet.';
    case 'none':
      return 'Not tried yet.';
  }
}

function creativeLine(p: WelcomeProject, step: WelcomeStep, who: string): string {
  if (step === 'pretty') {
    const picture = p.results.pretty;
    const free = 'Free making has no right answer, so this shows taking part, not a score.';
    if (!picture) return `${cap(who)} made a picture; it wasn't kept. ${free}`;
    const colours = new Set(picture.stamps.map((s) => s.color)).size;
    return `${cap(who)} made a picture with ${plural(picture.stamps.length, 'stamp', 'stamps')} in ${plural(colours, 'colour', 'colours')}. ${free}`;
  }
  const tune = p.results.song;
  if (!tune) return `${cap(who)} played the song step; fewer than two notes stayed lit, so no tune was kept.`;
  const pitches = new Set(tune.notes.map((n) => n.row)).size;
  return `${cap(who)} lit ${plural(tune.notes.length, 'note', 'notes')} on ${plural(pitches, 'pitch', 'pitches')}. Whether ${who} meant a tune isn't known.`;
}

/** The project's status line. */
function statusLine(save: Pick<SaveData, 'projects' | 'creatures'>, who: string): string {
  const p = save.projects.welcome;
  if (!p.ended) return `Project: ${p.steps.length} of ${WELCOME_STEPS.length} steps done.`;
  const friend = welcomeFriend(save.creatures.owned);
  return friend
    ? `Project finished: ${esc(friend.name)} joined.`
    : `Project finished: every friend's place was full, so no new friend joined; ${who} keeps the friends already there.`;
}

/** The off-screen idea for the most recently played step's game at the project's band, if that game has a line there. */
function idea(p: WelcomeProject, band: WelcomeBand, name: string): string | null {
  const order = [...WELCOME_STEPS].sort((a, b) => (p.evidence[b]?.at ?? -1) - (p.evidence[a]?.at ?? -1));
  for (const step of order) {
    const mod = gameById(WELCOME_PLAN[step]!.game);
    const line = mod ? offScreenFor(mod, band, name) : null;
    if (line) return line;
  }
  return null;
}

/** The recap's HTML: a table for a preschool or pre-K profile or one that began the project, one line for anyone else. */
export function projectRecap(
  save: Pick<SaveData, 'projects' | 'profile' | 'creatures'>,
  name: string,
): string {
  const p = save.projects.welcome;
  const who = esc(name.trim() || NO_NAME);
  const band = welcomeBand(p, save.profile.band);
  const title = '<strong>Welcome a New Friend</strong> (a project at Home):';
  if (!band)
    return `<p>${title} Welcome a New Friend is the first project for preschool and pre-K players. Nothing has been recorded for ${who}.</p>`;
  const rows = WELCOME_STEPS.map((step) => {
    const row = WELCOME_INTENTIONS[step][band];
    return `<tr data-recap="${step}"><td>${esc(row.intention)}</td><td>${stepLine(p, step, band, who)}</td><td>${SUBJECT[row.subject]}</td></tr>`;
  });
  const off = idea(p, band, name);
  const level = band === 'prek' ? 'pre-K' : 'preschool';
  return `
    <p>${title} three steps at the ${level} level. Each row says what happened the last time ${who} played that step.</p>
    <table data-recap-table>
      <tr><th>What it asks</th><th>What happened</th><th>Subject</th></tr>
      ${rows.join('')}
    </table>
    <p>${statusLine(save, who)}</p>
    <p class="muted">${REWARD_NOTE}</p>
    ${off ? `<p><strong>Off-screen idea for the project:</strong> ${esc(off)}</p>` : ''}`;
}
