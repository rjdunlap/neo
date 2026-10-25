import type { View } from '../../engine/view';
export interface Box {x:number;y:number;w:number;h:number}
export function layout(v:View,count:number){
  const dx=(v.w-1024)/2,tall=v.h>v.w;
  const box=(x:number,y:number,w:number,h:number):Box=>({x:x+dx,y,w,h});
  return {
    slots:Array.from({length:count},(_,i)=>tall?box(i%2?700:360,i<2?340:530,240,140):box((1024-(count-1)*200)/2+i*200,300,160,120)),
    tray:Array.from({length:4},(_,i)=>box(250+i*200,tall?800:490,120,110)),
    controls:Array.from({length:4},(_,i)=>box(300+i*180,tall?1100:680,120,100)),
    request:box(540,tall?210:185,740,80),
    screen:box(560,tall?480:420,tall?700:600,tall?400:340),tall,
  };
}
