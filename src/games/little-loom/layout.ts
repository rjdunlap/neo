import type {View} from '../../engine/view';
export function layout(v:Pick<View,'w'|'h'>){
  const tall=v.h>v.w,dx=(v.w-1024)/2;
  return {tall,loom:{x:dx+300,y:tall?240:160,cell:tall?58:38},
    shuttle:{x:dx+850,y:tall?v.h-405:390,w:180,h:120},
    pots:[430,620,810].map(x=>({x:dx+x,y:v.h-148,w:120,h:120})),
    pedals:[510,750].map(x=>({x:dx+x,y:v.h-148,w:140,h:120})),
    free:{x:260,y:140,w:v.w-280,h:v.h-165},
    companion:{x:dx+650,y:tall?940:510},
  };
}
