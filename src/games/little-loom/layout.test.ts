import {it,expect} from 'vitest';
import {computeView} from '../../engine/view';
import {layout} from './layout';
import {ink,swatch} from '../../art/palette';
import {CLOTH_COLORS} from '../../content/creations';
const lum=(n:number)=>[16,8,0].map(s=>((n>>s)&255)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
const contrast=(a:number,b:number)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
it('finite demonstration yarns and all mark edges have at least 3:1 contrast',()=>{for(const color of CLOTH_COLORS.slice(0,3)){expect(contrast(color,swatch.white.fill)).toBeGreaterThanOrEqual(3);expect(Math.max(contrast(color,ink),contrast(color,0xffffff))).toBeGreaterThanOrEqual(3);}expect(contrast(ink,swatch.white.fill)).toBeGreaterThan(3);});
it('all controls fit and clear shell/guide with separated pedal targets',()=>{
  for(const [w,h] of [[1024,768],[768,1024],[1180,820],[820,1180]]){const v=computeView(w,h),l=layout(v);for(const row of [l.pots,l.pedals])for(const b of [...row,l.shuttle]){
    expect(b.w).toBeGreaterThanOrEqual(100);expect(b.h).toBeGreaterThanOrEqual(100);expect(b.x-b.w/2).toBeGreaterThan(260);expect(b.x+b.w/2).toBeLessThan(v.w);expect(b.y-b.h/2).toBeGreaterThan(130);expect(b.y+b.h/2).toBeLessThan(v.h-70);
  }expect(l.pedals[1].x-l.pedals[0].x-140).toBeGreaterThanOrEqual(100);}
});

import {GAMES} from '../registry';
import {landFor,visibleIn,olderIn,landPages,landLayout} from '../../content/lands';
it('Painted Canyon capacity retains all bands, both sides/pages in every supported view',()=>{
 const land=landFor('treehouse');expect(land.games.length).toBe(10);
 for(const band of ['lap','toddler','preschool','prek','school','grownup'] as const){const younger=visibleIn(land,band,GAMES),older=olderIn(land,band,GAMES);for(const list of [younger,older])for(const v of [{w:1024,h:768},{w:1024,h:1365},{w:1105,h:768},{w:1024,h:1474}]){const pages=landPages(list,true);pages.forEach((page,i)=>expect(landLayout(page.length,true,v,v.h*land.backdrop.horizon,{prev:i>0,next:i<pages.length-1})).not.toBeNull());}}
});
