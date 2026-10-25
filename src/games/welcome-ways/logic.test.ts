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
