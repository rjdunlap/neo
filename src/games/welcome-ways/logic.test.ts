import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { compatible, designs, distance, evaluate, FOOTPRINT, initial, parts, planFor, presentation, repair, Round, solutions } from './logic';
import { computeView } from '../../engine/view';
import { layout } from './layout';
import { LANDS, landLayout, landPages, visibleIn, olderIn } from '../../content/lands';
import { GAMES } from '../registry';
import { BANDS } from '../../progress/bands';
const views = [[1024,768], [768,1024], [844,390], [844,390]];
describe('Welcome Ways authored toy entrances', () => {
  it('enumerates exactly the defined designs, visitors, first stops and accepted sets', () => {
    for (const level of [1,2,3,4]) {
      const p = planFor(level);
      expect(designs(p)).toHaveLength([2,3,3,27][level-1]);
      expect(solutions(p)).toEqual([{ rises: Array(p.rises).fill('gentle'), door: level === 4 ? 'wide' : 'narrow' }]);
      for (const d of designs(p)) { const r = evaluate(p,d); if (r.stop) expect(p.visitors).toContain(r.stop.visitor); }
      expect(presentation(p,new Rng(42)).sort()).toEqual([...p.choices].sort());
      expect(presentation(p,new Rng(42))).toEqual(presentation(p,new Rng(42)));
    }
    expect(FOOTPRINT).toEqual({ gentle:2,step:2,narrow:1,wide:1 });
    expect(evaluate(planFor(3), { rises:['step'],door:'narrow' }).stop).toEqual({ visitor:'roly',socket:0,reason:'needsRamp',arrived:['bunny'] });
    expect(evaluate(planFor(4), { rises:['gentle','gentle'],door:'narrow' }).stop).toEqual({ visitor:'bear',socket:2,reason:'needsWide',arrived:['roly'] });
    expect(evaluate(planFor(4), { rises:[null,'step'],door:null }).stop?.reason).toBe('gap');
    expect(evaluate(planFor(4), { rises:['step','gentle'],door:null }).stop?.reason).toBe('needsRamp');
    expect(evaluate(planFor(4), { rises:['gentle','gentle'],door:null }).stop?.reason).toBe('needsDoor');
  });
  it('repairs every board, replacing wrong parts; the first repair addresses the first stop', () => {
    for (const level of [1,2,3,4]) { const p = planFor(level); for (const d of designs(p)) {
      const r = repair(p,d); const stop = evaluate(p,d).stop;
      if (!stop) { expect(r).toBeNull(); continue; }
      expect(r!.socket).toBe(stop.socket);
      expect(compatible(p,r!.socket,r!.part)).toBe(true);
      const round = new Round(p); round.design = { rises:[...d.rises],door:d.door };
      const before = Math.min(...solutions(p).map(s=>distance(s,d)));
      round.edit(r!.socket,r!.part);
      expect(Math.min(...solutions(p).map(s=>distance(s,round.design)))).toBe(before-1);
      for (let n=0;n<3;n++) { const next=repair(p,round.design); if (next) round.edit(next.socket,next.part); }
      expect(evaluate(p,round.design).stop).toBeNull();
    } }
  });
  it('keeps observations free, caps each repair, resets repeats on edits and preserves help across undo', () => {
    const r=new Round(planFor(4)); const stop=()=>evaluate(r.plan,r.design);
    expect(r.complete(stop()).suggestion).toBeNull();
    expect(r.complete(stop()).suggestion).toEqual({socket:0,part:'gentle'});
    r.help(); expect(r.hints).toBe(1);
    r.edit(0,'step'); expect(r.complete(stop()).suggestion).toBeNull();
    r.undo(); r.help(); expect(r.hints).toBe(1);
    r.edit(0,'gentle'); r.help(); expect(r.hints).toBe(2);
    r.edit(1,'gentle'); r.help(); expect(r.hints).toBe(3);
    r.edit(2,'wide'); expect(r.help()).toBeNull();
    expect(r.complete(stop()).finish).toBe(true); expect(r.complete(stop()).finish).toBe(false);
    expect(r.misses).toBe(0);
    expect(r.edit(0,null)).toBe(false);
  });
  it('retains unlimited tray parts, atomic replacements and full visitor retesting', () => {
    const r = new Round(planFor(4));
    expect(r.edit(0,'wide')).toBe(false); expect(r.design).toEqual(initial(r.plan));
    r.edit(0,'gentle'); r.edit(1,'gentle'); expect(parts(r.design)).toEqual(['gentle','gentle','narrow']);
    expect(evaluate(r.plan,r.design).arrived).toEqual(['roly']);
    r.edit(0,'step'); expect(evaluate(r.plan,r.design).arrived).toEqual([]);
    r.edit(0,null); expect(r.design.rises[0]).toBeNull();
  });
  it('fits all targets, navigation and pet across standard views and safe insets without scaling', () => {
    for (const [index,[w,h]] of views.entries()) for (const inset of [0,20]) for (const level of [1,2,3,4]) {
      const v=computeView(w,h,index===3?{top:0,left:47,right:47,bottom:21}:{top:inset,left:inset,bottom:inset,right:inset}); const p=planFor(level);
      const l=layout(v,p.rises,p.choices.length,p.visitors.length);
      const boxes=[...l.sockets,...l.tray,...l.visitors,l.try,l.undo,l.remove,l.help];
      for (const b of boxes) { expect(b.w).toBeGreaterThanOrEqual(100); expect(b.h).toBeGreaterThanOrEqual(100); expect(b.x-b.w/2).toBeGreaterThanOrEqual(0); expect(b.x+b.w/2).toBeLessThanOrEqual(v.w); expect(b.y-b.h/2).toBeGreaterThanOrEqual(140); expect(b.y+b.h/2).toBeLessThanOrEqual(v.h); expect(b.x-b.w/2>=240 || b.y+b.h/2<=v.h-205).toBe(true); expect(b.x-b.w/2>=130 || b.y-b.h/2>=220).toBe(true); }
      for (let i=0;i<boxes.length;i++) for (const b of boxes.slice(i+1)) { const a=boxes[i]; expect(Math.abs(a.x-b.x)>=(a.w+b.w)/2 || Math.abs(a.y-b.y)>=(a.h+b.h)/2).toBe(true); }
    }
  });
  it('fits the corner and side-strip boards of levels 5 to 7 across standard views and safe insets without scaling', () => {
    for (const [index,[w,h]] of views.entries()) for (const inset of [0,20]) for (const level of [5,6,7]) {
      const v=computeView(w,h,index===3?{top:0,left:47,right:47,bottom:21}:{top:inset,left:inset,bottom:inset,right:inset}); const p=planFor(level);
      const l=layout(v,p.rises,p.choices.length,p.visitors.length,level);
      expect(l.sockets).toHaveLength(p.sockets.length);
      const boxes=[...l.sockets,...l.tray,...l.visitors,l.try,l.undo,l.remove,l.help];
      for (const b of boxes) { expect(b.w).toBeGreaterThanOrEqual(100); expect(b.h).toBeGreaterThanOrEqual(100); expect(b.x-b.w/2).toBeGreaterThanOrEqual(0); expect(b.x+b.w/2).toBeLessThanOrEqual(v.w); expect(b.y-b.h/2).toBeGreaterThanOrEqual(140); expect(b.y+b.h/2).toBeLessThanOrEqual(v.h); expect(b.x-b.w/2>=240 || b.y+b.h/2<=v.h-205).toBe(true); expect(b.x-b.w/2>=130 || b.y-b.h/2>=220).toBe(true); }
      for (let i=0;i<boxes.length;i++) for (const b of boxes.slice(i+1)) { const a=boxes[i]; expect(Math.abs(a.x-b.x)>=(a.w+b.w)/2 || Math.abs(a.y-b.y)>=(a.h+b.h)/2).toBe(true); }
    }
  });
  it('admits Welcome Ways to Tinker Lab across all bands, both sides and every paged layout', () => {
    const land=LANDS.find(l=>l.id==='tinker-lab')!;
    const candidate={...land,games:[...land.games.filter(id=>id!=='welcome-ways'),'welcome-ways']};
    for(const {id:band} of BANDS) for(const [index,[w,h]] of views.entries()) {
      const v=computeView(w,h,index===3?{top:0,left:47,right:47,bottom:21}:undefined); const catalog=[...GAMES.filter(g=>g.id!=='welcome-ways'), {id:'welcome-ways',bands:['toddler','preschool','prek','school']} as typeof GAMES[number]]; const own=visibleIn(candidate,band,catalog), older=olderIn(candidate,band,catalog);
      for(const [games,sign] of [[own,!!older.length],[older,false]] as const) {
        const pages=landPages(games,sign); pages.forEach((page,i)=>expect(landLayout(page.length,sign,v,v.h*.4,{prev:i>0,next:i<pages.length-1})).not.toBeNull());
      }
    }
  });
});
describe('Welcome Ways levels 5-7 (turn, conflict, repair)', () => {
  const copyOf = (d: ReturnType<typeof initial>) => JSON.parse(JSON.stringify(d)) as typeof d;
  const at = (level: number, d: ReturnType<typeof initial>) => evaluate(planFor(level), d);
  const six = (rises: any[], sides: any[], door: any = 'narrow') => ({ rises, door, sides });
  const five = (rises: any[], turn: any) => ({ rises, door: 'wide' as const, turn });

  it('enumerates 27 / 81 / 81 designs with exactly the defined accepted sets', () => {
    expect(designs(planFor(5))).toHaveLength(27);
    expect(solutions(planFor(5))).toEqual([five(['gentle', 'gentle'], 'big')]);
    expect(parts(solutions(planFor(5))[0])).toEqual(['gentle', 'big', 'gentle', 'wide']);
    for (const level of [6, 7]) {
      const p = planFor(level);
      expect(designs(p)).toHaveLength(81);
      const sol = solutions(p);
      expect(sol).toHaveLength(2);
      expect(sol.map(d => d.sides)).toEqual(expect.arrayContaining([['rail', 'perch'], ['perch', 'rail']]));
      for (const d of sol) { expect(d.rises).toEqual(['gentle', 'gentle']); expect(d.door).toBe('narrow'); }
      for (const d of designs(p)) { const r = evaluate(p, d); if (r.stop) expect(p.visitors).toContain(r.stop.visitor); }
      expect(presentation(p, new Rng(7)).sort()).toEqual([...p.choices].sort());
    }
  });

  it('every tray part is in an accepted design or is a distractor that stops a named visitor', () => {
    for (const level of [5, 6, 7]) {
      const p = planFor(level);
      const used = new Set(solutions(p).flatMap(d => parts(d)).filter(Boolean));
      const distractors = p.choices.filter(c => !used.has(c));
      if (level === 5) {
        expect([...used].sort()).toEqual(['big', 'gentle', 'wide']);
        expect(distractors.sort()).toEqual(['small', 'step']);
        expect(at(5, five(['step', 'gentle'], 'big')).stop).toMatchObject({ visitor: 'roly', socket: 0, reason: 'needsRamp' });
        expect(at(5, five(['gentle', 'gentle'], 'small')).stop).toMatchObject({ visitor: 'bear', socket: 1, reason: 'needsBig' });
      } else {
        expect([...used].sort()).toEqual(['gentle', 'narrow', 'perch', 'rail']);
        expect(distractors).toEqual(['step']);
        expect(at(level, six(['step', 'gentle'], ['rail', 'perch'])).stop?.visitor).toBe('roly');
        // rail used on both sides stops Duck; perch on both sides stops Teeter
        expect(at(level, six(['gentle', 'gentle'], ['rail', 'rail'])).stop).toMatchObject({ visitor: 'duck', reason: 'needsPerch' });
        expect(at(level, six(['gentle', 'gentle'], ['perch', 'perch'])).stop).toMatchObject({ visitor: 'teeter', reason: 'needsRail' });
      }
    }
  });

  it('walker cases at level 5', () => {
    expect(at(5, five(['gentle', 'gentle'], 'small')).stop).toEqual({ visitor: 'bear', socket: 1, reason: 'needsBig', arrived: ['roly'] });
    expect(at(5, five(['gentle', 'gentle'], null)).stop).toEqual({ visitor: 'roly', socket: 1, reason: 'gap', arrived: [] });
    expect(at(5, five(['gentle', 'gentle'], 'big'))).toEqual({ arrived: ['roly', 'bear'], stop: null });
    expect(at(5, five([null, null], 'small')).stop).toMatchObject({ visitor: 'roly', socket: 0, reason: 'gap' });
    expect(at(5, five(['gentle', 'gentle'], 'big')).arrived).toContain('bear');
    expect(parts(initial(planFor(5)))).toEqual([null, 'small', null, 'wide']);
  });

  it('walker cases at levels 6 and 7', () => {
    for (const level of [6, 7]) {
      const g2 = ['gentle', 'gentle'];
      const stopOf = (r: any[], s: any[]) => at(level, six(r, s)).stop!;
      expect(stopOf(g2, [null, null])).toMatchObject({ visitor: 'teeter', socket: 3, reason: 'needsRail' });
      expect(stopOf(g2, ['rail', null])).toMatchObject({ visitor: 'duck', socket: 4, reason: 'needsPerch' });
      expect(stopOf(g2, ['rail', 'rail'])).toMatchObject({ visitor: 'duck', socket: 4, reason: 'needsPerch' });
      expect(stopOf(g2, [null, 'rail'])).toMatchObject({ visitor: 'duck', socket: 3, reason: 'needsPerch' });
      expect(stopOf(g2, ['perch', null])).toMatchObject({ visitor: 'teeter', socket: 4, reason: 'needsRail' });
      const mixed = at(level, six(['gentle', 'step'], ['perch', null]));
      expect(mixed.stop).toMatchObject({ visitor: 'roly', socket: 1, reason: 'needsRamp' });
      expect(mixed.stop!.visitor === 'roly').toBe(true);
      // Teeter passes one ramp (gentle, step) and a step, so only Roly and Duck-side rules stop
      expect(evaluate({ ...planFor(level), visitors: ['teeter'] }, six(['gentle', 'step'], [null, null])).stop).toBeNull();
      expect(at(level, six(['gentle', 'gentle'], ['rail', 'perch']))).toMatchObject({ stop: null });
      expect(at(level, six(['gentle', 'gentle'], ['rail', 'perch'])).arrived).toHaveLength(3);
    }
    expect(at(6, six(['gentle', 'step'], [null, 'perch'])).stop).toMatchObject({ visitor: 'roly' });
    const start = initial(planFor(7));
    expect(start).toEqual(six(['step', 'step'], ['perch', null]));
    expect(at(7, start).stop).toEqual({ visitor: 'roly', socket: 0, reason: 'needsRamp', arrived: ['teeter', 'duck'] });
  });

  it('a turn breaks a run: Teeter has no rail rule at level 5', () => {
    const p = { ...planFor(5), visitors: ['teeter' as const] };
    expect(evaluate(p, five(['gentle', 'gentle'], 'big')).stop).toBeNull();
  });

  it('hints at levels 1-7: legal, one step closer, at the stop socket, converging from every design', () => {
    const need: Record<string, string> = { needsRail: 'rail', needsPerch: 'perch', needsBig: 'big' };
    for (const level of [1, 2, 3, 4, 5, 6, 7]) {
      const p = planFor(level), sol = solutions(p);
      const dist = (d: ReturnType<typeof initial>) => Math.min(...sol.map(s => distance(s, d)));
      for (const d of designs(p)) {
        const stop = evaluate(p, d).stop;
        if (!stop) { expect(repair(p, d)).toBeNull(); continue; }
        const r = repair(p, d)!;
        expect(r).not.toBeNull();
        expect(compatible(p, r.socket, r.part)).toBe(true);
        expect(r.socket).toBe(stop.socket);
        if (need[stop.reason]) expect(r.part).toBe(need[stop.reason]);
        const round = new Round(p); round.design = copyOf(d);
        const before = dist(d);
        expect(round.edit(r.socket, r.part)).toBe(true);
        expect(dist(round.design)).toBe(before - 1);
        for (let n = 0; n < 12 && evaluate(p, round.design).stop; n++) { const next = repair(p, round.design)!; round.edit(next.socket, next.part); }
        expect(evaluate(p, round.design).stop).toBeNull();
      }
    }
  });

  it('level 7: both sides empty after [step, step] stops Duck at near, hint is perch there', () => {
    const p = planFor(7), d = six(['step', 'step'], [null, null]);
    expect(evaluate(p, d).stop).toMatchObject({ visitor: 'duck', socket: 3, reason: 'needsPerch' });
    expect(repair(p, d)).toEqual({ socket: 3, part: 'perch' });
    const d2 = six(['gentle', 'gentle'], [null, null]);
    expect(repair(p, d2)).toEqual({ socket: 3, part: 'rail' });
  });

  it('level 7 start: nearest accepted keeps the perch (distance 3); no recorded hint or undo', () => {
    const p = planFor(7), start = initial(p);
    const dists = solutions(p).map(s => distance(s, start));
    expect(Math.min(...dists)).toBe(3);
    const nearest = solutions(p).find(s => distance(s, start) === 3)!;
    expect(nearest.sides).toEqual(['perch', 'rail']);
    const r = new Round(p);
    expect(r.design).toEqual(start);
    expect(r.previous).toBeNull();
    expect(r.hints).toBe(0);
    expect(r.misses).toBe(0);
    expect(r.help()).toEqual({ socket: 0, part: 'gentle' });
    expect(r.hints).toBe(1);
    r.help(); expect(r.hints).toBe(1);
    r.undo(); expect(r.design).toEqual(start);
  });

  it('accounting at 5-7: edits keep misses 0, distinct hints count once, a rail may replace a perch', () => {
    for (const level of [5, 6, 7]) {
      const r = new Round(planFor(level));
      for (let n = 0; n < 12 && !r.finished; n++) {
        const h = r.help();
        if (!h) break;
        r.help();
        r.edit(h.socket, h.part);
        const res = evaluate(r.plan, r.design);
        r.complete(res);
        expect(r.misses).toBe(0);
      }
      expect(r.finished).toBe(true);
      expect(r.misses).toBe(0);
      expect(r.hints).toBeGreaterThan(0);
    }
    const r = new Round(planFor(7));
    expect(r.edit(3, 'rail')).toBe(true);
    expect(parts(r.design)[3]).toBe('rail');
    expect(r.edit(3, 'rail')).toBe(false);
    expect(r.edit(2, 'wide')).toBe(false);
    expect(r.edit(3, 'gentle')).toBe(false);
    r.undo(); expect(parts(r.design)[3]).toBe('perch');
  });

  it('repeated identical stops trigger one suggestion at level 6', () => {
    const r = new Round(planFor(6));
    r.edit(0, 'gentle'); r.edit(1, 'gentle');
    const res = evaluate(r.plan, r.design);
    expect(r.complete(res).suggestion).toBeNull();
    expect(r.complete(res).suggestion).toEqual({ socket: 3, part: 'rail' });
    expect(r.hints).toBe(1);
  });
});
