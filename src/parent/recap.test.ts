import { describe, expect, it } from 'vitest';
import { defaults, type SaveData } from '../progress/save';
import type { StepEvidence } from '../content/welcome';
import { projectRecap, REWARD_NOTE } from './recap';

const save = (
  band: SaveData['profile']['band'],
  welcome: Partial<SaveData['projects']['welcome']> = {},
): SaveData => {
  const s = defaults();
  s.profile.band = band;
  s.projects.welcome = { ...s.projects.welcome, ...welcome };
  return s;
};
const row = (html: string, step: string) =>
  html.match(new RegExp(`<tr data-recap="${step}">(.*?)</tr>`, 's'))?.[1] ?? '';
const done = (over: Partial<StepEvidence> = {}): StepEvidence => ({
  finished: true,
  misses: 0,
  hints: 0,
  level: 0,
  rounds: 1,
  at: 1,
  ...over,
});

describe('the welcome recap (RW09)', () => {
  it('reads independent, supported, creative, encountered and not tried from the record', () => {
    const picture = {
      kind: 'picture' as const,
      stamps: [
        { kind: 'star' as const, color: 'pink' as const, x: 0.1, y: 0.1, size: 1, turns: 0 },
        { kind: 'star' as const, color: 'blue' as const, x: 0.2, y: 0.2, size: 1, turns: 0 },
        { kind: 'fish' as const, color: 'pink' as const, x: 0.3, y: 0.3, size: 1, turns: 0 },
      ],
    };
    const html = projectRecap(
      save('preschool', {
        band: 'preschool',
        steps: ['pretty', 'yummy'],
        results: { pretty: picture },
        evidence: {
          pretty: done({ level: 3 }),
          yummy: done({ level: 2, misses: 3, hints: 1, rounds: 2 }),
          song: { ...done({ level: 2 }), finished: false },
        },
      }),
      'Mia',
    );
    expect(row(html, 'yummy')).toContain(
      'Mia made four equal plates with help the last time: 3 wrong tries and the glowing hint. (finished 2 times)',
    );
    expect(row(html, 'yummy')).toContain('it does not yet show Mia can do it alone');
    expect(row(html, 'yummy')).toContain('<td>Number</td>');
    expect(row(html, 'pretty')).toContain(
      'Mia made a picture with 3 stamps in 2 colours. Free making has no right answer',
    );
    expect(row(html, 'song')).toContain('Opened, not finished yet.');
    expect(html).toContain(REWARD_NOTE);
    expect(html).toContain('Project: 2 of 3 steps done.');
    const fresh = projectRecap(save('preschool'), 'Mia');
    for (const step of ['pretty', 'yummy', 'song']) expect(row(fresh, step)).toContain('Not tried yet.');
  });

  it('says independent only for no misses and no hints, with the pre-K intention', () => {
    const html = projectRecap(
      save('prek', { band: 'prek', steps: ['yummy'], evidence: { yummy: done({ level: 5 }) } }),
      'Sam',
    );
    expect(row(html, 'yummy')).toContain(
      'Sam made the recipe twice over without help the last time: no wrong tries, no hints.',
    );
    expect(row(html, 'yummy')).toContain('Doubles each part of a pictured recipe.');
    expect(html).toContain('pre-K level');
  });

  it('describes the tune, a song with no tune kept, and a step finished before records existed', () => {
    const tune = {
      kind: 'tune' as const,
      cols: 6,
      rows: 4,
      notes: [
        { col: 0, row: 0 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
      ],
    };
    const html = projectRecap(
      save('preschool', {
        band: 'preschool',
        steps: ['pretty', 'song'],
        results: { song: tune },
        evidence: { song: done({ level: 2 }) },
      }),
      'Mia',
    );
    expect(row(html, 'song')).toContain(
      'Mia lit 3 notes on 2 pitches. Whether Mia meant a tune isn’t known.'.replace('’', "'"),
    );
    expect(row(html, 'pretty')).toContain(
      'Finished before this recap existed; nothing was recorded about how.',
    );
    const hum = projectRecap(
      save('preschool', { band: 'preschool', steps: ['song'], evidence: { song: done({ level: 2 }) } }),
      'Mia',
    );
    expect(row(hum, 'song')).toContain('fewer than two notes stayed lit, so no tune was kept');
  });

  it('gives a toddler or school profile that never began it one line, never an empty table', () => {
    for (const band of ['lap', 'toddler', 'school'] as const) {
      const html = projectRecap(save(band), 'Mia');
      expect(html).toContain(
        'Welcome a New Friend is the first project for preschool and pre-K players. Nothing has been recorded for Mia.',
      );
      expect(html).not.toContain('<table');
    }
    // One who began it keeps the table after a birthday.
    expect(projectRecap(save('school', { band: 'prek' }), 'Mia')).toContain('<table');
  });

  it('escapes names, and claims no mastery, score or pronoun', () => {
    const html = projectRecap(
      save('preschool', { band: 'preschool', steps: ['yummy'], evidence: { yummy: done({ level: 2 }) } }),
      '<b>Mia</b>',
    );
    expect(html).not.toContain('<b>Mia');
    for (const s of [html, projectRecap(save('toddler'), 'Mia')]) {
      const text = s.replace(/<[^>]+>/g, ' ');
      expect(text).not.toMatch(/master|can now|brain|ready for school|ADHD|attention|behaviou?r|score:|%/i);
      expect(text).not.toMatch(/\b(she|her|hers|he|him|his)\b/i);
    }
    expect(projectRecap(save('preschool', { band: 'preschool' }), '  ')).toContain('your little one');
  });

  it('names the friend once the project ends', () => {
    const s = save('preschool', { band: 'preschool', steps: ['pretty', 'yummy', 'song'], ended: true });
    s.creatures.owned.push({
      ...s.creatures.owned[0]!,
      species: 'river',
      name: 'Ripple',
      metAt: 'project:welcome',
    } as never);
    expect(projectRecap(s, 'Mia')).toContain('Project finished: Ripple joined.');
  });
});
