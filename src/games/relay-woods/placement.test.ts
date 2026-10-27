import { expect, it } from 'vitest';
import { GAMES } from '../registry';
import { computeView } from '../../engine/view';
import { BANDS } from '../../progress/bands';
import { LANDS, visibleIn, olderIn, landPages, landLayout, layoutSpots, spotRect, overlaps, petCorner, landButtons, LAND_SPOTS } from '../../content/lands';
it('fits current Cozy Village plus Relay at full size, every band, side and page',()=>{
 const base=LANDS.find(l=>l.id==='cozy-village')!;
 const land={...base,games:base.games.includes('relay-woods')?base.games:[...base.games,'relay-woods']};
 const mods=GAMES;
 for(const view of [computeView(1024,768),computeView(768,1024),computeView(844,390),computeView(844,390,{top:0,right:47,bottom:21,left:47})])for(const {id:band} of BANDS){
  const mine=visibleIn(land,band,mods),older=olderIn(land,band,mods);
  for(const side of [mine,older]){const pages=landPages(side,!!older.length);expect(pages.flat()).toEqual(side);
   pages.forEach((p,i)=>{const l=landLayout(p.length,!!older.length,view,view.h*.4,{prev:i>0,next:i<pages.length-1});expect(l).not.toBeNull();const rects=layoutSpots(l!).map(s=>spotRect(s,l!.box));expect(rects.length).toBeLessThanOrEqual(LAND_SPOTS);rects.forEach((r,j)=>{expect(r.w).toBeGreaterThanOrEqual(100);expect(r.h).toBeGreaterThanOrEqual(100);expect(r.x>=0&&r.y>=0&&r.x+r.w<=view.w&&r.y+r.h<=view.h).toBe(true);for(const other of [...rects.slice(j+1),petCorner(view.h),...landButtons(view.w)])expect(overlaps(r,other)).toBe(false);});});
  }
 }
});
