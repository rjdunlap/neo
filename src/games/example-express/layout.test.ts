import {it,expect} from 'vitest';
import {computeView} from '../../engine/view';
import {overlaps,petCorner,landButtons} from '../../content/lands';
import {layout,type Box} from './layout';
it('keeps every active D2 panel target full size, apart and clear of pet and shell in both safe orientations',()=>{
 for(const view of [computeView(1024,768),computeView(768,1024),computeView(1024,768,{top:20,bottom:20,left:30,right:30}),computeView(768,1024,{top:24,bottom:21,left:0,right:0})]){
  const l=layout(view);
  // Main L1 docks/L2 Examples use the same reserved area. Panels replace slots/shelf/tray.
  for(const boxes of [[...l.slots,...l.docks,...l.controls,l.replay],[...l.shelf,l.controls[2],l.replay],[...l.tools,l.replay],[...l.docks,l.prev,l.next,l.controls[1],l.controls[2],l.replay]]){
   const rect=(b:Box)=>({x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h});
   for(const [i,b] of boxes.entries()){
    expect(b.w).toBeGreaterThanOrEqual(100);expect(b.h).toBeGreaterThanOrEqual(100);
    const r=rect(b);expect(r.x>=0&&r.y>=0&&r.x+r.w<=view.w&&r.y+r.h<=view.h).toBe(true);
    expect(overlaps(r,petCorner(view.h))).toBe(false);
    for(const corner of landButtons(view.w))expect(overlaps(r,corner)).toBe(false);
    for(const other of boxes.slice(i+1))expect(overlaps(r,rect(other))).toBe(false);
   }
  }
 }
});
