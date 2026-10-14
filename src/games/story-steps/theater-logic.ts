/** Creative stories: every combination is valid. There are no answer/miss rules. */
export const THEATER_PLANS = [
  { level: 12, compare: false, name: 'Story Theater: choose a cast, weather and prop, then watch your picnic' },
  { level: 13, compare: true, name: 'Story Theater: change one event and compare two picnic endings' },
] as const;
export type Cast = 'bunny' | 'bear';
export type Weather = 'sun' | 'rain';
export type Prop = 'blanket' | 'umbrella';
export interface TheaterStory { cast: Cast; weather: Weather; prop: Prop }
export type TheaterDraft = { [K in keyof TheaterStory]: TheaterStory[K] | null };
export type TheaterField = keyof TheaterStory;
export type Ending = 'sun-blanket' | 'sun-umbrella' | 'rain-blanket' | 'rain-umbrella';
export const OPTIONS = { cast: ['bunny', 'bear'], weather: ['sun', 'rain'], prop: ['blanket', 'umbrella'] } as const;
export const completeStory = (draft: TheaterDraft): draft is TheaterStory => !!(draft.cast && draft.weather && draft.prop);
export const sameStory = (a: TheaterDraft, b: TheaterDraft): boolean => a.cast === b.cast && a.weather === b.weather && a.prop === b.prop;
export const endingFor = (story: TheaterStory): Ending => `${story.weather}-${story.prop}`;
export const causalChanges = (a: TheaterStory, b: TheaterStory): number => Number(a.weather !== b.weather) + Number(a.prop !== b.prop);
/** Once a comparison starts, keep the cast and change just one event against the first show. */
export function editStory<K extends TheaterField>(draft: TheaterDraft, field: K, value: TheaterStory[K], first?: TheaterStory): TheaterDraft {
  if (first) return field === 'cast' ? { ...draft } : { ...first, [field]: value };
  return { ...draft, [field]: value };
}
export function canFinish(compare: boolean, draft: TheaterDraft, shows: readonly TheaterStory[]): boolean {
  if (!completeStory(draft) || !shows.length || !sameStory(draft, shows[shows.length - 1])) return false;
  return !compare || (draft.cast === shows[0].cast && causalChanges(shows[0], draft) === 1);
}
export type TheaterAction = { kind: 'choose'; field: TheaterField; value: Cast | Weather | Prop } | { kind: 'show' | 'finish' };
/** A useful next action for optional help and the ghost finger, never a preferred creative answer. */
export function nextTheaterAction(compare: boolean, draft: TheaterDraft, shows: readonly TheaterStory[]): TheaterAction {
  for (const field of ['cast', 'weather', 'prop'] as const) if (!draft[field]) return { kind: 'choose', field, value: OPTIONS[field][0] };
  if (canFinish(compare, draft, shows)) return { kind: 'finish' };
  if (compare && shows.length && sameStory(draft, shows[0])) return { kind: 'choose', field: 'weather', value: shows[0].weather === 'sun' ? 'rain' : 'sun' };
  return { kind: 'show' };
}
