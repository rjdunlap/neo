import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { gameById } from '../games/registry';
import { fair, planFor, recipe } from '../games/pet-kitchen/logic';
import { songPlan } from '../games/song-maker/logic';
import { defaults, migrate } from '../progress/save';
import type { StampPictureCreation, TuneCreation } from './creations';
import { SCRIPT as VOICE } from './voice-script';
import { beginWelcome, builtSteps, cleanWelcome, completeWelcome, emptyWelcome, newcomerFor, nextWelcomeStep, showsContinue, WELCOME_BANDS, WELCOME_PLAN, WELCOME_STEPS, welcomeBand, welcomeDoneLine } from './welcome';

const picture: StampPictureCreation = { kind: 'picture', stamps: [{ kind: 'star', color: 'pink', x: 0.5, y: 0.5, size: 1, turns: 0 }] };
const tune: TuneCreation = { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 0, row: 0 }, { col: 2, row: 3 }] };
const other: StampPictureCreation = { kind: 'picture', stamps: [{ kind: 'fish', color: 'blue', x: 0.2, y: 0.3, size: 1, turns: 1 }] };

describe('the welcome plan', () => {
  it('plays every step at a level inside the game’s range for both bands, except the one free-making song level, with spoken asks and done lines', () => {
    expect(builtSteps()).toEqual([...WELCOME_STEPS]);
    expect(builtSteps().filter((s) => WELCOME_PLAN[s]!.freeBelowRange)).toEqual(['song']);
    for (const step of builtSteps()) {
      const plan = WELCOME_PLAN[step]!;
      const mod = gameById(plan.game)!;
      expect(mod, plan.game).toBeTruthy();
      for (const band of WELCOME_BANDS) {
        expect(mod.bands).toContain(band);
        const { min, max } = mod.levels(band);
        if (plan.freeBelowRange) {
          // The stated exception: Song Maker's free loop, below the band's range, with no right answers to miss.
          expect(plan.game).toBe('song-maker');
          expect(plan.level[band], `${step} at ${band}`).toBeLessThan(min);
          expect(songPlan(plan.level[band]).mode).toBe('free');
        } else {
          expect(plan.level[band], `${step} at ${band}`).toBeGreaterThanOrEqual(min);
          expect(plan.level[band], `${step} at ${band}`).toBeLessThanOrEqual(max);
        }
        expect(VOICE[plan.ask[band]]?.length).toBeGreaterThan(0);
        expect(VOICE[plan.done[band]]?.length).toBeGreaterThan(0);
      }
    }
  });

  it('pictures only what Pet Kitchen guarantees: four quarter plates at preschool, one berry and one apple doubled at pre-K', () => {
    const yummy = WELCOME_PLAN.yummy!;
    expect(planFor(yummy.level.preschool)).toMatchObject({ mode: 'share', wholes: 1, friends: 4 });
    // Halves cannot reach four friends, so finishing means a quarter on each plate.
    expect(fair([1, 1, 0, 0], 2)).toBe(false);
    expect(fair([1, 1, 1, 1], 4)).toBe(true);
    expect(planFor(yummy.level.prek).mode).toBe('recipe');
    for (let seed = 1; seed < 40; seed++) expect(recipe(yummy.level.prek, new Rng(seed))).toEqual([1, 1]);
  });
});

describe('the welcome record', () => {
  it('starts empty in a new save and survives a backup and restore', () => {
    expect(defaults().projects.welcome).toEqual(emptyWelcome());
    const save = defaults();
    save.projects.welcome = { band: 'prek', steps: ['pretty', 'yummy'], results: { pretty: picture }, newcomer: 'glider', ended: false };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('repairs unknown and repeated steps, a result without its step, a bad band, species or ending', () => {
    expect(cleanWelcome({ band: 'school', steps: ['yummy', 'cake', 'pretty', 'yummy'], results: { pretty: picture }, newcomer: 'dragon', ended: true })).toEqual({
      band: null,
      steps: ['pretty', 'yummy'],
      results: { pretty: picture },
      newcomer: null,
      ended: false,
    });
    expect(cleanWelcome({ steps: ['yummy'], results: { pretty: picture, song: { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] } } }).results).toEqual({});
    expect(cleanWelcome({ steps: ['pretty'], results: { pretty: { kind: 'picture', stamps: [] } } }).results).toEqual({});
    expect(cleanWelcome({ steps: ['pretty'], results: { pretty: { kind: 'picture', size: 4, pixels: [{ x: 0, y: 0, color: 'pink' }] } } }).results).toEqual({});
    for (const junk of [null, 'x', 3, [], { steps: 'pretty' }]) expect(cleanWelcome(junk)).toEqual(emptyWelcome());
    expect(migrate({ projects: 'x' }).projects.welcome).toEqual(emptyWelcome());
    expect(cleanWelcome({ steps: ['pretty', 'yummy', 'song'], ended: true }).ended).toBe(true);
  });

  it('fixes the band and newcomer at the first launch only', () => {
    const p = emptyWelcome();
    expect(beginWelcome(p, 'preschool', [{ species: 'sprout' }])).toBe(true);
    expect(p).toMatchObject({ band: 'preschool', newcomer: 'river' });
    expect(beginWelcome(p, 'prek', [])).toBe(false);
    expect(p).toMatchObject({ band: 'preschool', newcomer: 'river' });
    expect(newcomerFor([{ species: 'river' }])).toBe('glider');
    expect(newcomerFor([{ species: 'glider' }, { species: 'river' }])).toBe('river');
  });

  it('completes a step once, replaces a result on a finished replay, and keeps the old one when the new picture is empty', () => {
    const p = emptyWelcome();
    expect(completeWelcome(p, 'yummy', null)).toBe(true);
    expect(completeWelcome(p, 'pretty', picture)).toBe(true);
    expect(completeWelcome(p, 'yummy', null)).toBe(true);
    expect(p.steps).toEqual(['pretty', 'yummy']);
    expect(p.results.pretty).toEqual(picture);
    completeWelcome(p, 'pretty', other);
    expect(p.results.pretty).toEqual(other);
    completeWelcome(p, 'pretty', { kind: 'picture', stamps: [] } as StampPictureCreation);
    completeWelcome(p, 'pretty', { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] });
    expect(p.results.pretty).toEqual(other);
    expect(completeWelcome(p, 'cake' as 'pretty', picture)).toBe(false);
  });

  it('keeps her tune for the song step, replaces it on a finished replay, and keeps nothing for a one-note song', () => {
    const p = emptyWelcome();
    expect(completeWelcome(p, 'song', { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 1, row: 1 }] })).toBe(true);
    expect(p.steps).toEqual(['song']);
    expect(p.results.song).toBeUndefined();
    expect(welcomeDoneLine(p, 'song', 'preschool')).toBe('welcome.done.song-hum');
    completeWelcome(p, 'song', tune);
    expect(p.results.song).toEqual(tune);
    expect(welcomeDoneLine(p, 'song', 'prek')).toBe('welcome.done.song');
    const again: TuneCreation = { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 3, row: 0 }, { col: 4, row: 1 }, { col: 5, row: 2 }] };
    completeWelcome(p, 'song', again);
    expect(p.results.song).toEqual(again);
    // A one-note or empty replay, or a picture, keeps the tune she already made.
    completeWelcome(p, 'song', { kind: 'tune', cols: 6, rows: 4, notes: [] });
    completeWelcome(p, 'song', picture);
    completeWelcome(p, 'song', null);
    expect(p.results.song).toEqual(again);
    expect(p.results.pretty).toBeUndefined();
    expect(welcomeDoneLine(p, 'yummy', 'prek')).toBe('welcome.done.yummy-prek');
    // The tune survives a save round trip.
    const save = defaults();
    save.projects.welcome = p;
    expect(migrate(JSON.parse(JSON.stringify(save))).projects.welcome.results.song).toEqual(again);
  });

  it('shows Continue to preschool and pre-K, to anyone who began it, and to nobody once it ended', () => {
    const p = emptyWelcome();
    expect(showsContinue(p, 'preschool')).toBe(true);
    expect(showsContinue(p, 'prek')).toBe(true);
    for (const band of ['lap', 'toddler', 'school', 'grownup'] as const) expect(showsContinue(p, band)).toBe(false);
    p.band = 'prek';
    expect(showsContinue(p, 'school')).toBe(true);
    expect(welcomeBand(p, 'preschool')).toBe('prek');
    p.ended = true;
    expect(showsContinue(p, 'prek')).toBe(false);
  });

  it('names the first unfinished built step, then none', () => {
    const p = emptyWelcome();
    expect(nextWelcomeStep(p)).toBe('pretty');
    completeWelcome(p, 'pretty', picture);
    expect(nextWelcomeStep(p)).toBe('yummy');
    completeWelcome(p, 'yummy', null);
    expect(nextWelcomeStep(p)).toBe('song');
    completeWelcome(p, 'song', null);
    expect(nextWelcomeStep(p)).toBeNull();
  });
});
