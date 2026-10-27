import {expect,it} from 'vitest';
import {GAMES} from '../registry';
import {BANDS} from '../../progress/bands';
import {computeView} from '../../engine/view';
import {LANDS,visibleIn,olderIn,landPages,landLayout,layoutSpots,spotRect,overlaps,petCorner,landButtons} from '../../content/lands';
it('fits the actual 20-entry Tinker Lab, every band, side, page and safe view without shrinking',()=>{
 const land=LANDS.find(l=>l.id==='tinker-lab')!;
 const games=GAMES;expect(GAMES.find(g=>g.id==='example-express')?.bands).toEqual(['school']);
 expect(land.games.filter(id=>id==='example-express')).toHaveLength(1);expect(land.games).toHaveLength(20);
 for(const view of [computeView(1024,768),computeView(768,1024),computeView(1024,768,{top:20,bottom:20,left:30,right:30}),computeView(768,1024,{top:24,bottom:21,left:0,right:0})])for(const {id:band} of BANDS){
  const mine=visibleIn(land,band,games),older=olderIn(land,band,games);
  for(const side of [mine,older]){const pages=landPages(side,older.length>0);for(const [p,page] of pages.entries()){
   const l=landLayout(page.length,older.length>0,view,view.h*.4,{prev:p>0,next:p<pages.length-1});expect(l).not.toBeNull();
   const rects=layoutSpots(l!).map(s=>spotRect(s,l!.box));
   for(const [i,r] of rects.entries()){
    expect(r.w).toBeGreaterThanOrEqual(100);expect(r.h).toBeGreaterThanOrEqual(100);
    expect(r.x>=0&&r.y>=0&&r.x+r.w<=view.w&&r.y+r.h<=view.h).toBe(true);
    expect(overlaps(r,petCorner(view.h))).toBe(false);
    for(const b of landButtons(view.w))expect(overlaps(r,b)).toBe(false);
    for(const o of rects.slice(i+1))expect(overlaps(r,o)).toBe(false);
   }
  }}
 }
});
