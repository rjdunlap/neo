import {describe,it,expect} from 'vitest';
import {computeView} from '../../engine/view';
import {BANDS} from '../../progress/bands';
import {GAMES} from '../registry';
import {LANDS,visibleIn,olderIn,landPages,landLayout,layoutSpots,spotRect,overlaps,petCorner,landButtons} from '../../content/lands';
import {layout} from './layout';
const views=[computeView(1024,768),computeView(768,1024),computeView(844,390,{top:0,right:47,bottom:21,left:47})];
describe('Movie Night layout and approved destination',()=>{
 it('fits Movie Night in the current Painted Canyon catalog across bands, sides and arrows',()=>{
  const land=LANDS.find(l=>l.id==='treehouse')!;
  const games=GAMES;
  expect(land.games.filter(id=>id==='movie-night')).toHaveLength(1);
  for(const b of BANDS){const mine=visibleIn(land,b.id,games),older=olderIn(land,b.id,games);
   for(const side of older.length?[mine,older]:[mine]){const pages=landPages(side,older.length>0);
    for(const v of views)pages.forEach((p,i)=>{
     const l=landLayout(p.length,older.length>0,v,v.h*.4,{prev:i>0,next:i<pages.length-1});expect(l).not.toBeNull();
     const all=layoutSpots(l!).map(s=>spotRect(s,l!.box));
     all.forEach((r,j)=>{expect(r.w).toBeGreaterThanOrEqual(100);expect(r.h).toBeGreaterThanOrEqual(100);expect(overlaps(r,petCorner(v.h))).toBe(false);for(const next of all.slice(j+1))expect(overlaps(r,next)).toBe(false);});
    });
   }
  }
 });
 it('keeps every input at least 100 units, separated, inside the safe view and clear of shell/pet',()=>{
  for(const v of views)for(const count of [3,4]){
   const l=layout(v,count);const boxes=[...l.slots,...l.tray,...l.controls];
   const rect=(b:typeof boxes[number])=>({x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h});
   boxes.forEach((b,i)=>{const r=rect(b);expect(b.w).toBeGreaterThanOrEqual(100);expect(b.h).toBeGreaterThanOrEqual(100);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(140);expect(r.x+r.w).toBeLessThanOrEqual(v.w);expect(r.y+r.h).toBeLessThanOrEqual(v.h);expect(overlaps(r,petCorner(v.h))).toBe(false);for(const button of landButtons(v.w))expect(overlaps(r,button)).toBe(false);for(const next of boxes.slice(i+1)){const q=rect(next);expect(Math.abs(b.x-next.x)>=(b.w+next.w)/2+16||Math.abs(b.y-next.y)>=(b.h+next.h)/2+16).toBe(true);expect(overlaps(r,q)).toBe(false);}});
  }
 });
});
