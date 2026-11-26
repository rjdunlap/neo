import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { Rng } from '../../engine/random';
import { storySteps } from './index';
import {
  canFinish,
  canFinishViewpoints,
  canWatchViewpoints,
  evaluateViewpoints,
  nextViewpointsAction,
  viewpointsRound,
  VIEWPOINTS_ENDINGS,
  watchConsequence,
  type ViewpointsEnding,
  causalChanges,
  completeStory,
  editStory,
  endingFor,
  nextTheaterAction,
  OPTIONS,
  sameStory,
  type TheaterDraft,
  type TheaterStory,
} from './theater-logic';

const all: TheaterStory[] = OPTIONS.cast.flatMap((cast) =>
  OPTIONS.weather.flatMap((weather) => OPTIONS.prop.map((prop) => ({ cast, weather, prop }))),
);

describe('Story Theater', () => {
  it('accepts every cast/weather/prop combination and narrates four distinct consequences', () => {
    expect(all).toHaveLength(8);
    const endings = new Set<string>();
    for (const story of all) {
      const ending = endingFor(story);
      endings.add(ending);
      for (const id of [
        `theater.scene.${story.cast}`,
        `theater.scene.${story.weather}`,
        `theater.scene.${story.prop}`,
        `theater.end.${ending}`,
      ]) {
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
      for (const other of all.filter((other) => !sameStory(story, other)))
        expect(canFinish(false, other, [story])).toBe(false);
    }
  });
  it('compares exactly one causal change, keeping the cast and the unedited event', () => {
    for (const first of all) {
      expect(canFinish(true, first, [first])).toBe(false);
      expect(canFinish(true, { ...first, cast: first.cast === 'bear' ? 'bunny' : 'bear' }, [first])).toBe(
        false,
      );
      for (const field of ['weather', 'prop'] as const) {
        for (const value of OPTIONS[field]) {
          const draft = editStory(first, field, value, first);
          expect(draft.cast).toBe(first.cast);
          expect(draft[field === 'weather' ? 'prop' : 'weather']).toBe(
            first[field === 'weather' ? 'prop' : 'weather'],
          );
          if (!completeStory(draft)) throw new Error('Revision lost a choice');
          const changed = value !== first[field];
          expect(causalChanges(first, draft)).toBe(Number(changed));
          expect(canFinish(true, draft, [first, draft])).toBe(changed);
          if (changed) expect(endingFor(draft)).not.toBe(endingFor(first));
          const castChange = editStory(draft, 'cast', first.cast === 'bunny' ? 'bear' : 'bunny', first);
          expect(castChange).toEqual(draft);
        }
      }
      const twoChanges: TheaterStory = {
        ...first,
        weather: first.weather === 'sun' ? 'rain' : 'sun',
        prop: first.prop === 'blanket' ? 'umbrella' : 'blanket',
      };
      expect(canFinish(true, twoChanges, [first, twoChanges])).toBe(false);
    }
  });
  it('switching the revision from weather to prop restores the original weather', () => {
    const first = all[0],
      before = { ...first };
    const rain = editStory(first, 'weather', 'rain', first);
    const umbrella = editStory(rain, 'prop', 'umbrella', first);
    expect(umbrella).toEqual({ ...first, prop: 'umbrella' });
    expect(first).toEqual(before);
  });
  it('help and the bot can complete from every possible chosen opening without rewriting a creative choice', () => {
    for (const compare of [false, true])
      for (const first of all) {
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
            expect(canFinish(compare, draft, shows)).toBe(true);
            done = true;
            break;
          }
        }
        expect(done).toBe(true);
        expect(shows[0]).toEqual(first);
        expect(shows).toHaveLength(compare ? 2 : 1);
      }
  });
  it('appends creative levels only to school and scopes the how-to to its actual actions', () => {
    expect(storySteps.levels('school')).toEqual({ min: 6, max: 14 });
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

describe('Story Theater level 14: Two Viewpoints', () => {
  const none = { music: false, quiet: false };
  const both = { music: true, quiet: true };
  it('has four endings, exactly two of which keep both wishes', () => {
    expect(new Set(VIEWPOINTS_ENDINGS).size).toBe(4);
    expect(VIEWPOINTS_ENDINGS.filter((e) => evaluateViewpoints(e) === 'ok').sort()).toEqual([
      'soft-spot',
      'two-spots',
    ]);
    expect(evaluateViewpoints('stay-loud')).toBe('unmet-quiet');
    expect(evaluateViewpoints('turn-off')).toBe('unmet-music');
  });
  it('seeds both role assignments with two distinct friends and keeps every ending', () => {
    const music = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const r = viewpointsRound(new Rng(seed));
      music.add(r.musicFriend);
      expect(r.musicFriend).not.toBe(r.quietFriend);
      expect([...r.order].sort()).toEqual([...VIEWPOINTS_ENDINGS].sort());
    }
    expect([...music].sort()).toEqual(['bear', 'bunny']);
  });
  it('needs both accounts, a choice and a watched working ending to bow', () => {
    expect(canWatchViewpoints(none, 'two-spots')).toBe(false);
    expect(canWatchViewpoints({ music: true, quiet: false }, 'two-spots')).toBe(false);
    expect(canWatchViewpoints(both, null)).toBe(false);
    expect(canWatchViewpoints(both, 'stay-loud')).toBe(true);
    expect(canFinishViewpoints(both, 'two-spots', [])).toBe(false);
    expect(canFinishViewpoints(both, 'stay-loud', ['stay-loud'])).toBe(false);
    expect(canFinishViewpoints(none, 'two-spots', ['two-spots'])).toBe(false);
    expect(canFinishViewpoints(both, 'soft-spot', ['stay-loud', 'soft-spot'])).toBe(true);
    expect(canFinishViewpoints(both, 'two-spots', ['soft-spot'])).toBe(false);
  });
  it('makes a first one-sided look free and a repeated one a miss', () => {
    for (const e of ['stay-loud', 'turn-off'] as const) {
      expect(watchConsequence(e, [])).toMatchObject({ accepted: false, miss: false });
      expect(watchConsequence(e, [e])).toMatchObject({ accepted: false, miss: true });
      expect(watchConsequence(e, ['two-spots']).miss).toBe(false);
    }
    for (const e of ['two-spots', 'soft-spot'] as const)
      expect(watchConsequence(e, [e])).toEqual({ verdict: 'ok', accepted: true, miss: false });
  });
  it('helps in order, never overwrites a working choice, and finishes within five steps', () => {
    expect(nextViewpointsAction(none, null, [])).toEqual({ kind: 'hear', role: 'music' });
    expect(nextViewpointsAction({ music: true, quiet: false }, null, [])).toEqual({
      kind: 'hear',
      role: 'quiet',
    });
    expect(nextViewpointsAction(both, null, [])).toEqual({ kind: 'choose', ending: 'two-spots' });
    expect(nextViewpointsAction(both, 'turn-off', [])).toEqual({ kind: 'choose', ending: 'two-spots' });
    expect(nextViewpointsAction(both, 'soft-spot', [])).toEqual({ kind: 'show' });
    expect(nextViewpointsAction(both, 'soft-spot', ['soft-spot'])).toEqual({ kind: 'finish' });
    let heard = { ...none };
    let draft: ViewpointsEnding | null = null;
    const watched: ViewpointsEnding[] = [];
    let steps = 0;
    for (; steps < 8; steps++) {
      const a = nextViewpointsAction(heard, draft, watched);
      if (a.kind === 'finish') break;
      if (a.kind === 'hear') heard = { ...heard, [a.role]: true };
      else if (a.kind === 'choose') draft = a.ending;
      else watched.push(draft!);
    }
    expect(steps).toBeLessThanOrEqual(5);
    expect(canFinishViewpoints(heard, draft, watched)).toBe(true);
  });
  it('adds level 14 to school only, with its own how-to card and every spoken line', () => {
    expect(storySteps.levels('school')).toEqual({ min: 6, max: 14 });
    expect(storySteps.levels('toddler')).toEqual({ min: 1, max: 2 });
    expect(storySteps.levels('preschool')).toEqual({ min: 2, max: 5 });
    expect(storySteps.levels('prek')).toEqual({ min: 4, max: 8 });
    expect(storySteps.describeLevel(14)).toContain('Two Viewpoints');
    const card = howToFor(storySteps, 14)!;
    expect(card.steps.join(' ')).toContain('hear what each one says');
    expect(card.steps.join(' ')).not.toMatch(/drag|weather/i);
    expect(card.finish).toContain('bow');
    expect(howToFor(storySteps, 13)!.steps.join(' ')).not.toContain('hear what each');
    for (const id of [
      'viewpoints.start',
      'viewpoints.account.music',
      'viewpoints.account.quiet',
      'viewpoints.hearfirst',
      'viewpoints.pickfirst',
      ...VIEWPOINTS_ENDINGS.flatMap((e) => [`viewpoints.pick.${e}`, `viewpoints.end.${e}`]),
      'viewpoints.scene.mishap',
      'viewpoints.scene.both',
      'viewpoints.miss',
      'viewpoints.ready',
      'viewpoints.help.hear',
      'viewpoints.help.choose',
      'viewpoints.help.show',
      'viewpoints.help.bow',
      'viewpoints.bowfirst',
      'viewpoints.undo',
      'viewpoints.done',
    ])
      expect(SCRIPT[id as keyof typeof SCRIPT]?.length, id).toBeGreaterThan(0);
  });
});
