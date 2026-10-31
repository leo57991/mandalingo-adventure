export const TOWN=Object.freeze({bounds:[180,300,2840,2640],spawn:{x:1700,y:2700},bridge:[1150,1780,520,180],riverWidth:180});
export const SHOPS=Object.freeze([
 {id:'weapons',name:'Weapon shop',x:760,y:1450,width:500,depth:380,roof:0x503f38,awning:0x895744},
 {id:'grocer',name:'General store',x:740,y:2300,width:520,depth:380,roof:0x405b50,awning:0xb89857},
 {id:'lingxi-books',name:'靈犀古卷齋',x:2380,y:1440,width:600,depth:460,roof:0x315459,awning:0x637b69}
]);
export const HOUSES=Object.freeze([
 {id:'west-house',x:720,y:740,width:430,depth:300,roof:0x4b5c57},
 {id:'west-cottage',x:440,y:1040,width:300,depth:260,roof:0x465a52},
 {id:'east-house',x:2630,y:2350,width:420,depth:360,roof:0x4d6661},
 {id:'east-cottage',x:2560,y:860,width:350,depth:280,roof:0x435d59},
 {id:'north-pavilion',x:1840,y:550,width:700,depth:400,roof:0x314e52}
]);
export const TOWN_TREES=Object.freeze([[300,420],[460,500],[1000,420],[1120,1100],[350,1770],[400,2100],[360,2650],[1020,2770],[1300,2800],[2060,2680],[2770,2750],[2900,2450],[2870,1900],[2600,1870],[2170,1880],[2940,1200],[2860,670],[2410,420],[2130,390],[1120,2480],[2070,1120]].map(([x,y],i)=>({x,y,color:[0xb77b39,0xc89947,0x537658,0x71864f][i%4],size:.85+(i%3)*.16})));
export const TOWN_RESIDENTS=Object.freeze([
 {id:'weapons-vendor',x:760,y:1420,shop:'weapons',color:0x79604b},
 {id:'grocer-vendor',x:740,y:2270,shop:'grocer',color:0x7d7656},
 {id:'books-vendor',x:2380,y:1410,shop:'lingxi-books',color:0x5f7471},
 {id:'market-walker',x:1080,y:1950,color:0x85705e,path:[[1080,1950],[1080,2580],[1160,2580],[1160,1950]]},
 {id:'town-walker',x:1900,y:2000,color:0x6b805c,path:[[1900,2000],[1900,2500],[2100,2500],[2100,2000]]}
]);
const walls=s=>{const x=s.x-s.width/2,y=s.y-s.depth/2,w=s.width,d=s.depth;return [[x,y,w,32],[x,y,28,d],[x+w-28,y,28,d]];};
export const TOWN_LAMPS=Object.freeze([[1580,2540],[1990,2540],[1100,1760],[1690,1790],[2060,1110],[2380,1730]]);
export const TOWN_COLLIDERS=Object.freeze([
 [1150,1779,520,14],[1150,1947,520,14],
 ...SHOPS.flatMap(s=>[...walls(s),[s.x-s.width/2+70,s.y+40,s.width-140,65],...[-1,1].map(side=>[s.x+side*s.width*.39-4,s.y+s.depth/2+81,8,8])]),
 ...HOUSES.flatMap(s=>s.id==='north-pavilion'?walls(s):[[s.x-s.width/2,s.y-s.depth/2,s.width,s.depth]]),
 ...TOWN_TREES.map(t=>[t.x-17,t.y-17,34,34]),
 ...TOWN_RESIDENTS.filter(a=>!a.path).map(a=>[a.x-18,a.y-15,36,30]),
 [490,1660,115,50],[488,2518,44,44],[566,2491,48,48],[916,2416,38,38],[527,2217,46,46],[902,1287,76,76],
 ...TOWN_LAMPS.map(([x,y])=>[x-4,y-4,8,8]),
 [670,2906,900,28],[1830,2906,900,28],[1569,2899,32,42],[1799,2899,32,42],
 [2102,1755,16,250],[2642,1755,16,250],[2105,2002,190,16],[2465,2002,190,16],[2299,2002,31,16],[2430,2002,31,16],
 [2428,1838,84,84],[2404,1864,32,32],[2504,1864,32,32],[2454,1929,32,32],
 [2020,2275,130,75], [1725,2205,110,110], [2130,1550,75,75], [2660,1520,75,75]
]);
const river=[[300,1300],[1200,1250],[1900,1450],[2600,1300],[2940,1240]];
export function riverX(y){let i=0;while(i<river.length-2&&y>river[i+1][0])i++;const [a,x]=river[i],[b,z]=river[i+1];return x+(z-x)*Math.max(0,Math.min(1,(y-a)/(b-a)));}
const inside=(x,y,[a,b,w,h])=>x>=a&&y>=b&&x<=a+w&&y<=b+h;
export function townElevation(x,y){
 if(inside(x,y,TOWN.bridge)){const t=(x-TOWN.bridge[0])/TOWN.bridge[2];return .04+Math.sin(Math.PI*t)*.27;}
 if(x>=1400&&x<=2320&&y<1010)return .38*Math.max(0,Math.min(1,(1010-y)/160));
 return 0;
}
export function isTownWalkable(x,y,radius=18){
 const samples=[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.7,radius*.7],[-radius*.7,radius*.7],[radius*.7,-radius*.7],[-radius*.7,-radius*.7]];
 return samples.every(([dx,dy])=>{const px=x+dx,py=y+dy;
  return inside(px,py,TOWN.bounds)&&(!((Math.abs(px-riverX(py))<TOWN.riverWidth/2))||inside(px,py,TOWN.bridge))&&!TOWN_COLLIDERS.some(r=>inside(px,py,r));
 });
}
