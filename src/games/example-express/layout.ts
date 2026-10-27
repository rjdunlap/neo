import type {View} from '../../engine/view';
export interface Box {x:number;y:number;w:number;h:number}
/** Panels replace one another; hidden shelf targets never sit over live slots. */
export function layout(v:View){
 const dx=(v.w-1024)/2,tall=v.h>v.w,dy=tall?(v.h-768)*.5:0;
 const box=(x:number,y:number,w=128,h=112):Box=>({x:x+dx,y:y+dy,w,h});
 return {request:box(550,115),rule:box(550,220),replay:box(915,220,100,100),
 slots:[290,460,630,800].map(x=>box(x,365,136,128)),
 docks:[box(430,515,144,112),box(690,515,144,112)],
 shelf:[290,460,630,800].map(x=>box(x,365,136,128)),
 controls:[300,480,660,840].map(x=>box(x,670,140,100)),
 parcel:box(550,385,160,140),prev:box(270,385,100,100),next:box(830,385,100,100),
 tools:[box(320,370),box(550,370),box(780,370),box(550,530)],tall};
}
