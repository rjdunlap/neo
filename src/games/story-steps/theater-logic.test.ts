import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { storySteps } from './index';
import { canFinish, causalChanges, completeStory, editStory, endingFor, nextTheaterAction, OPTIONS, sameStory, type TheaterDraft, type TheaterStory } from './theater-logic';

const all: TheaterStory[] = OPTIONS.cast.flatMap(cast => OPTIONS.weather.flatMap(weather => OPTIONS.prop.map(prop => ({ cast, weather, prop }))));

describe('Story Theater', () => {
  it('accepts every cast/weather/prop combination and narrates four distinct consequences', () => {
    expect(all).toHaveLength(8);
    const endings = new Set<string>();
    for (const story of all) {
      const ending = endingFor(story); endings.add(ending);
      for (const id of [`theater.scene.${story.cast}`, `theater.scene.${story.weather}`, `theater.scene.${story.prop}`, `theater.end.${ending}`]) {
        expect(SCRIPT[id as keyof typeof SCRIPT]?.length, id).toBeGreaterThan(0);
      }
      expect(canFinish(false, story, [story])).toBe(true);
      expect(canFinish(false, story, [])).toBe(false);
    }
    expect(endings.size).toBe(4);
    expect(SCRIPT['theater.end.rain-blanket'][0]).toContain('inside');
    expect(SCRIPT['theater.end.rain-umbrella'][0]).toContain('outside');
  });
  it('requires a watched version of the actual current choices before finishing', () => {
    for (const story of all) {
      for (const field of ['cast', 'weather', 'prop'] as const) {
        const incomplete = { ...story, [field]: null };
        expect(completeStory(incomplete)).toBe(false);
        expect(canFinish(false, incomplete, [story])).toBe(false);
        const help = nextTheaterAction(false, incomplete, [story]);
        expect(help.kind).toBe('choose');
        if (help.kind === 'choose') expect(help.field).toBe(field);
      }
      for (const other of all.filter(other => !sameStory(story, other))) expect(canFinish(false, other, [story])).toBe(false);
    }
  });
  it('compares exactly one causal change, keeping the cast and the unedited event', () => {
    for (const first of all) {
      expect(canFinish(true, first, [first])).toBe(false);
      expect(canFinish(true, { ...first, cast: first.cast === 'bear' ? 'bunny' : 'bear' }, [first])).toBe(false);
      for (const field of ['weather', 'prop'] as const) {
        for (const value of OPTIONS[field]) {
          const draft = editStory(first, field, value, first);
          expect(draft.cast).toBe(first.cast);
          expect(draft[field === 'weather' ? 'prop' : 'weather']).toBe(first[field === 'weather' ? 'prop' : 'weather']);
          if (!completeStory(draft)) throw new Error('Revision lost a choice');
          const changed = value !== first[field];
          expect(causalChanges(first, draft)).toBe(Number(changed));
          expect(canFinish(true, draft, [first, draft])).toBe(changed);
          if (changed) expect(endingFor(draft)).not.toBe(endingFor(first));
          const castChange = editStory(draft, 'cast', first.cast === 'bunny' ? 'bear' : 'bunny', first);
          expect(castChange).toEqual(draft);
        }
      }
      const twoChanges: TheaterStory = { ...first, weather: first.weather === 'sun' ? 'rain' : 'sun', prop: first.prop === 'blanket' ? 'umbrella' : 'blanket' };
      expect(canFinish(true, twoChanges, [first, twoChanges])).toBe(false);
    }
  });
  it('switching the revision from weather to prop restores the original weather', () => {
    const first = all[0], before = { ...first };
    const rain = editStory(first, 'weather', 'rain', first);
    const umbrella = editStory(rain, 'prop', 'umbrella', first);
    expect(umbrella).toEqual({ ...first, prop: 'umbrella' });
    expect(first).toEqual(before);
  });
  it('help and the bot can complete from every possible chosen opening without rewriting a creative choice', () => {
    for (const compare of [false, true]) for (const first of all) {
      let draft: TheaterDraft = { cast: null, weather: null, prop: null };
      const shows: TheaterStory[] = [];
      let done = false;
      for (let i = 0; i < 10; i++) {
        const action = nextTheaterAction(compare, draft, shows);
        if (action.kind === 'choose') {
          const value = shows.length ? action.value : first[action.field];
          draft = editStory(draft, action.field, value, compare ? shows[0] : undefined);
        } else if (action.kind === 'show') {
          expect(completeStory(draft)).toBe(true);
          shows.push({ ...draft } as TheaterStory);
        } else {
          expect(canFinish(compare, draft, shows)).toBe(true); done = true; break;
        }
      }
      expect(done).toBe(true);
      expect(shows[0]).toEqual(first);
      expect(shows).toHaveLength(compare ? 2 : 1);
    }
  });
  it('appends creative levels only to school and scopes the how-to to its actual actions', () => {
    expect(storySteps.levels('school')).toEqual({ min: 6, max: 13 });
    for (const level of [12, 13]) {
      expect(storySteps.describeLevel(level)).toContain('Story Theater');
      const card = howToFor(storySteps, level)!;
      expect(card.steps).toHaveLength(level === 13 ? 3 : 2);
      expect(card.steps.join(' ')).not.toMatch(/drag/i);
      expect(card.finish).toContain('bow');
    }
    expect(howToFor(storySteps, 11)!.steps.join(' ')).not.toContain('picnic');
  });
});
