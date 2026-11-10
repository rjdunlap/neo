/**
 * The grown-ups' page's words, for the app that opened it (U8a, docs/definitions/grownups-page.md). The root (the
 * creature world) has no island map, home spots or picnic blanket, so its page never mentions them; `classic/` keeps
 * its island wording. Pure, so the words can be tested without a page.
 */
import { BANDS, type Band } from '../progress/bands';
import { placeFor } from '../content/places';
import { HOME_NAMES } from '../content/button-names';

/** Which app opened the page: the root's creature world or the classic island. */
export type PanelApp = 'root' | 'classic';

const bandLabel = (band: Band) => BANDS.find((b) => b.id === band)?.label ?? band;

/** The note under the birth month and year. */
export function ageCopy(app: PanelApp): string {
  return app === 'root'
    ? `With a birth month and year, their age picks the band by itself and moves them up as they grow. Choose a band below to start somewhere else instead: it sets which games ${HOME_NAMES.daily} and ${HOME_NAMES.explore} offer first and the levels games start at. Every game stays open to every age. The birth month and year stay on this device, and are in the backup file.`
    : 'With a birth month and year, their age picks the band by itself and moves them up as they grow. Choose a band below to start somewhere else instead. It sets their home spot on the map and the levels games start at. Every land stays open: a land shows the games for their age and younger, each at the levels nearest their age, and its signpost leads to games for bigger kids at their easiest levels. The birth month and year stay on this device, and are in the backup file.';
}

/** The small line on a band's button: its ages, and on classic its home spot. */
export function bandSmall(app: PanelApp, band: Band): string {
  const ages = BANDS.find((b) => b.id === band)?.ages ?? '';
  return app === 'root' ? ages : `${ages} · ${placeFor(band).name}`;
}

/** Where the line on their age ends: the band on the root, its home spot on classic. */
export function bandWhere(app: PanelApp, band: Band): string {
  return app === 'root' ? bandLabel(band) : placeFor(band).name;
}

/** The heading over the friend's name and color. */
export function friendHeading(app: PanelApp): string {
  return app === 'root' ? 'Their friend' : 'Your island friend';
}

/** The Playing section's notes, in order: before the tips box, then after the how-to box. */
export function playingCopy(app: PanelApp): { before: string[]; after: string[] } {
  const six =
    app === 'root'
      ? `${HOME_NAMES.daily}, the day's page on Home, is a different mix of games each day`
      : "Today's six is a different mix of games each day";
  const phone =
    app === 'root'
      ? `On a phone the app is ${HOME_NAMES.daily} alone, held upright or sideways; Home and ${HOME_NAMES.explore} stay on a tablet or computer.`
      : "On a phone the app is Today's six alone, held upright or sideways; Home, Explore and the island games stay on a tablet or computer.";
  return {
    before: [
      "Puddle Island has no timer of its own. To limit how long she plays, use the device's tools: Screen Time app limits, or Guided Access, on an iPad.",
      `${six}, chosen by their age, each at a level picked for the day. Those rounds earn their usual sticker but do not move a game's level, a pinned level is used instead, and nothing is missed on a day they do not play.`,
      `${phone} A grown-up's profile also gets a pencil on the six page and after each of its rounds, for a quick reaction and a note on the game; the notes stay on this device, and Copy all notes puts them on the clipboard.`,
    ],
    after: [
      'A card with the goal and how to play, a demonstration for some games, and a big Play button. The ? in a game opens it again.',
      ...(app === 'classic'
        ? ["Hold the picnic blanket on a little one's home spot to choose its games."]
        : []),
    ],
  };
}

/** The Finding games section (the home spot's layout), on classic only. */
export function findingCopy(app: PanelApp): { label: string; note: string } | null {
  return app === 'root'
    ? null
    : {
        label: 'Home spot layout',
        note: 'The home spot on the map holds every game for their age in one place. Subject cards show four large choices at a time; the swiping path shows them all along one path.',
      };
}

/** This week's words: its opening note, the row for a bigger kids' game, and whether the Windy Picnic line shows. */
export function weekCopy(app: PanelApp): { intro: string; older: string; picnic: boolean } {
  return {
    intro:
      'Levels adjust on their own: two easy rounds step up, two hard ones step down. Pick a level to stay on it instead. First come the games she played this week and any game kept on a level; every game for her age and younger is folded below, with a search.',
    older: app === 'root' ? 'A game for older players' : 'A game for bigger kids, from a signpost',
    picnic: app === 'classic',
  };
}
