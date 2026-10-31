import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";
import * as T from './vendor/three.module.js';
import {TOWN,SHOPS,HOUSES,TOWN_TREES,TOWN_LAMPS,TOWN_COLLIDERS,TOWN_RESIDENTS,riverX,townElevation} from './town-layout.js?v=wuyin-town-v1';
export const townPoint=(x,y)=>[(x-1600)/100,0,(y-1600)/100];
const P={stone:0xaaa993,plaster:0xd7cdb2,wood:0x644634,dark:0x2c413c,ivory:0xf2dfb8,water:0x439da6};
const materials=new Map();
function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.85,...extra}));return materials.get(key);}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function mesh(p,geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);
const cylinder=(p,r,rb,h,c,x=0,y=0,z=0,n=10)=>mesh(p,new T.CylinderGeometry(r,rb,h,n),c,x,y,z);
function beam(p,a,b,r,c){const start=new T.Vector3(...a),end=new T.Vector3(...b),m=mesh(p,new T.CylinderGeometry(r,r,start.distanceTo(end),8),c);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;}
function lantern(p,x,y,z){const g=group(p,x,y,z);cylinder(g,.11,.14,.25,0xffc973,0,-.12,0);for(const h of [0,-.25])box(g,.3,.035,.28,P.dark,0,h);beam(g,[0,.15,0],[0,0,0],.012,P.dark);}
function roof(p,w,d,h,color){const g=group(p);for(const side of [-1,1])for(let i=0;i<7;i++){const step=(d+.8)/14,m=box(g,w+.65+i*.035,.09,step+.04,color,0,h+.63-i*.078,side*(i+.5)*step);}
 box(g,w+.9,.10,.13,P.dark,0,h+.67);for(const side of [-1,1])beam(g,[side*(w/2+.25),h+.65,0],[side*(w/2+.55),h+.84,0],.055,P.dark);const batches=new Map();
 for(const m of [...g.children]){m.updateMatrix();const geometry=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geometry.applyMatrix4(m.matrix);if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(geometry);g.remove(m);m.geometry.dispose();}
 for(const [source,geometries] of batches){const m=new T.Mesh(mergeGeometries(geometries),source.clone());m.material.transparent=true;m.castShadow=m.receiveShadow=true;g.add(m);geometries.forEach(geo=>geo.dispose());}return g;}
function sign(p,w,d,type){const g=group(p,-w/2+.55,1.55,d/2+.18);box(g,.69,.81,.10,P.wood);box(g,.54,.65,.12,P.ivory);beam(p,[-w/2+.55,2.6,d/2],[-w/2+.55,1.95,d/2+.18],.025,P.wood);
 if(type==='weapons'){for(const side of [-1,1]){const s=group(g,0,0,.09);s.rotation.z=side*.48;box(s,.065,.49,.045,0x748b89,0,.04);box(s,.23,.04,.06,P.wood,0,-.13);box(s,.06,.17,.05,P.wood,0,-.2);}}
 else if(type==='grocer'){cylinder(g,.2,.15,.18,0xa47743,0,-.08,.15);for(const [x,c] of [[-.1,0xc96e40],[.08,0x7d9b4c]])mesh(g,new T.SphereGeometry(.10,8,6),c,x,.05,.15);}
 else{for(const side of [-1,1]){const page=box(g,.23,.37,.08,P.ivory,side*.12,0,.12);page.rotation.z=side*.1;}box(g,.018,.39,.11,P.wood,0,0,.18);}
}
function sword(p,x,y,z,tilt=0){const g=group(p,x,y,z);g.rotation.z=tilt;box(g,.07,.65,.045,0xa9b6af,0,.32);box(g,.27,.045,.09,0xba995c,0,-.02);cylinder(g,.037,.035,.19,P.wood,0,-.13);return g;}
function barrel(p,x,z,size=1){const g=group(p,x,0,z);cylinder(g,.22*size,.19*size,.45*size,0x997448,0,.23*size);for(const y of [.1,.36])mesh(g,new T.TorusGeometry(.22*size,.018,4,12),P.dark,0,y*size).rotation.x=Math.PI/2;return g;}
function basket(p,x,z,color){const g=group(p,x,.08,z);cylinder(g,.24,.16,.18,0xa17c4a,0,.1);for(let i=0;i<8;i++)mesh(g,new T.DodecahedronGeometry(.075,0),color,Math.sin(i*2.4)*.14,.23+(i%2)*.05,Math.cos(i*2.4)*.14);}
function building(scene,s,roofs,isShop){const [x,,z]=townPoint(s.x,s.y),g=group(scene,x,townElevation(s.x,s.y),z),w=s.width/100,d=s.depth/100,h=s.id==='north-pavilion'?2.8:2.35;
 box(g,w+.2,.10,d+.2,P.stone,0,-.055);box(g,w,.075,d,0x9e8a68,0,-.008);
 box(g,w,h,.22,P.plaster,0,h/2,-d/2+.11);for(const side of [-1,1]){box(g,.22,h,d,P.plaster,side*(w/2-.11),h/2);for(const zz of [-d/2+.15,d/2-.12])box(g,.14,h+.10,.15,P.wood,side*(w/2-.16),h/2,zz);}
 box(g,w,.18,.18,P.wood,0,h-.03,d/2-.08);for(const side of [-1,1]){box(g,w*.32,.63,.045,P.dark,side*w*.25,1.3,-d/2+.24);for(let i=0;i<4;i++)box(g,.035,.60,.055,0xb7a77e,side*w*.25-w*.13+i*w*.085,1.3,-d/2+.27);}
 const r=roof(g,w,d,h,s.roof);roofs.push({root:r,site:s});
 if(isShop){const canopy=box(r,w*.8,.045,1.05,s.awning,0,2.06,d/2+.40);canopy.rotation.x=.1;for(const side of [-1,1]){box(g,.065,2.1,.07,P.wood,side*(w*.39),1.05,d/2+.85);lantern(g,side*(w/2-.30),1.95,d/2+.2);}
  box(g,w-1.4,.83,.65,P.wood,0,.415,.725);box(g,w-1.3,.065,.73,0x9a774c,0,.86,.725);sign(g,w,d,s.id);
  if(s.id==='weapons'){
   box(g,2.9,.1,.2,P.wood,0,1.4,-d/2+.43);for(let i=0;i<5;i++)sword(g,-1.08+i*.54,.68,-d/2+.6,(i%2-.5)*.12);
   for(const side of [-1,1]){const shield=mesh(g,new T.CylinderGeometry(.24,.24,.08,8),0x5f7471,side*1.75,1.15,-d/2+.5);shield.rotation.x=Math.PI/2;}
   const anvil=group(g,-2.3,0,2.35);box(anvil,.65,.43,.48,0x79604a,0,.215);box(anvil,.78,.16,.42,0x65736e,0,.52);mesh(anvil,new T.ConeGeometry(.2,.42,4),0x65736e,.52,.52).rotation.z=-Math.PI/2;
   cylinder(g,.32,.38,.5,0x4d5146,1.8,.25,-1.25);mesh(g,new T.SphereGeometry(.21,8,6),0xe5a04a,1.8,.48,-1.25).material=mat(0xe5a04a,{emissive:0xcd5b20,emissiveIntensity:.65});
   sword(g,-.65,.91,.72,Math.PI/2);box(g,.6,.08,.32,0x727f79,.8,.95,.72);
  }else if(s.id==='grocer'){
   for(const x of [-1.55,-.5,.55,1.55]){box(g,.8,1.5,.065,P.wood,x,.75,-d/2+.16);for(const side of [-1,1])box(g,.06,1.5,.48,P.wood,x+side*.4,.75,-d/2+.38);for(const y of [.35,.8,1.2]){box(g,.85,.055,.43,0xa07e4e,x,y,-d/2+.43);for(let i=0;i<3;i++)cylinder(g,.09,.10,.22,[0xb18c56,0x7a9272,0xc7a46b][i],x+(i-1)*.23,y+.13,-d/2+.4);}}
   for(const [x,c] of [[-1.1,0xb96d3f],[-.3,0x96a951],[.6,0xd4b56c]]){const tray=group(g,x,.88,.73);box(tray,.7,.07,.48,0x9b7944);for(let i=0;i<6;i++)mesh(tray,new T.DodecahedronGeometry(.07),c,(i%3-1)*.17,.10,Math.floor(i/3)*.17-.08);}
   barrel(g,-2.3,2.4);barrel(g,1.95,1.35,.85);basket(g,-1.5,2.15,0xb69551);
   mesh(g,new T.SphereGeometry(.23,8,6),0xc1b38a,-1.9,.23,-.6).scale.set(1,1.4,1);
  }else{
   for(const x of [-1.9,-.65,.65,1.9]){box(g,1.02,1.9,.065,P.wood,x,.95,-d/2+.10);for(const side of [-1,1])box(g,.055,1.9,.48,P.wood,x+side*.5,.95,-d/2+.32);box(g,1.05,.055,.48,P.wood,x,1.9,-d/2+.32);for(const y of [.4,.9,1.4]){box(g,1.05,.055,.43,0xa0825c,x,y,-d/2+.35);for(let i=0;i<5;i++){const scroll=cylinder(g,.065,.065,.28,P.ivory,x+(i-2)*.16,y+.12,-d/2+.3);scroll.rotation.x=Math.PI/2;}}}
   for(let i=0;i<4;i++)box(g,.4,.065,.32,[0x8b634a,0x4e6a64,0xa18b56,0x6f727d][i],-.8+i*.5,.92,.72);
   const book=group(g,.3,.95,.7);for(const side of [-1,1]){const page=box(book,.3,.025,.37,P.ivory,side*.15,0);page.rotation.z=side*.12;}
   cylinder(g,.055,.055,.19,P.dark,1.4,1.01,.65);beam(g,[1.4,1.12,.65],[1.5,1.42,.65],.012,P.wood);
  }
 }else if(s.id!=='north-pavilion'){box(g,w-.5,h-.15,.12,0x6b5140,0,(h-.15)/2,d/2-.10);for(const side of [-1,1])box(g,.75,.85,.14,P.dark,side*w*.28,1.1,d/2-.01);}
 else{for(const side of [-1,1])lantern(g,side*(w/2-.4),2,d/2+.12);box(g,2.5,.17,.8,P.wood,0,.7,0);}
 return g;
}
export function createTownWorld(makeActor,bake) {
 const scene=new T.Scene();scene.background=new T.Color(0xb4c4bf);scene.fog=new T.Fog(0xb4c4bf,27,54);scene.add(new T.HemisphereLight(0xe7f1e5,0x65765c,2.4));
 const sun=new T.DirectionalLight(0xffe1ac,3.2);sun.position.set(-9,18,8);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.1,far:65});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
 box(scene,150,.3,150,0x83967b,0,-.3);const landVertices=[],landIndices=[];
 for(let i=0;i<=32;i++){const y=300+i*2640/32,c=riverX(y);for(const x of [180,c-TOWN.riverWidth/2,c+TOWN.riverWidth/2,3020]){const [xx,,zz]=townPoint(x,y);landVertices.push(xx,-.025,zz);}if(i<32){const n=i*4;landIndices.push(n,n+4,n+1,n+1,n+4,n+5,n+2,n+6,n+3,n+3,n+6,n+7);}}
 const landGeo=new T.BufferGeometry();landGeo.setAttribute('position',new T.Float32BufferAttribute(landVertices,3));landGeo.setIndex(landIndices);landGeo.computeVertexNormals();scene.add(new T.Mesh(landGeo,mat(0xadb198)));
 const roadPositions=new Map();function road(x0,y0,w,d){for(let y=y0;y<y0+d;y+=38)for(let x=x0;x<x0+w;x+=43){const xx=Math.round(x/43)*43,yy=Math.round(y/38)*38;if(Math.abs(xx-riverX(yy))>TOWN.riverWidth/2+5||yy>1780&&yy<1960)roadPositions.set(xx+':'+yy,[xx,yy]);}}
 road(1570,960,440,1930);road(420,1800,2240,180);road(1060,1240,140,1450);road(1580,1760,1100,180);road(2020,1730,700,260);road(1390,1020,930,240);
 const stones=new T.InstancedMesh(new T.BoxGeometry(.405,.035,.345),mat(0xb5b39b),roadPositions.size),dummy=new T.Object3D();let index=0;for(const [x,y] of roadPositions.values()){dummy.position.set(...townPoint(x,y));dummy.position.y=-.016;dummy.rotation.y=Math.sin(index*27)*.035;dummy.updateMatrix();stones.setMatrixAt(index++,dummy.matrix);}stones.receiveShadow=true;scene.add(stones);
 const riverVertices=[],riverIndices=[];for(let i=0;i<=32;i++){const y=300+i*2640/32,c=riverX(y);for(const side of [-1,1]){const [x,,z]=townPoint(c+side*TOWN.riverWidth/2,y);riverVertices.push(x,-.075,z);}if(i<32){const n=i*2;riverIndices.push(n,n+2,n+1,n+1,n+2,n+3);}}
 const riverGeometry=new T.BufferGeometry();riverGeometry.setAttribute('position',new T.Float32BufferAttribute(riverVertices,3));riverGeometry.setIndex(riverIndices);riverGeometry.computeVertexNormals();const riverMesh=new T.Mesh(riverGeometry,mat(P.water,{roughness:.22,metalness:.1,side:T.DoubleSide}));riverMesh.receiveShadow=true;scene.add(riverMesh);
 for(let y=340;y<2920;y+=115)for(const side of [-1,1]){const [x,,z]=townPoint(riverX(y)+side*95,y);const rock=mesh(scene,new T.DodecahedronGeometry(.19,0),0x83938b,x,-.025,z);rock.scale.set(1.15,.65,1.4);}
 for(let y=380;y<2850;y+=140)for(const side of [-1,1]){const [x,,z]=townPoint(riverX(y)+side*112,y);for(let i=0;i<3;i++){const reed=box(scene,.027,.25+(i%2)*.12,.04,0x6c875d,x+i*.045,.13,z+i*.035);reed.rotation.z=(i-1)*.17;}}
 const bridge=group(scene,...townPoint(1410,1870));for(let i=0;i<14;i++){const x=1150+(i+.5)*520/14,h=townElevation(x,1870);box(bridge,520/1400+.02,.14,1.80,P.stone,(x-1410)/100,h-.07,0);for(const side of [-1,1]){box(bridge,.35,.27,.14,0x8b968a,(x-1410)/100,h+.15,side*.84);}}
 for(const side of [-1,1]){const arch=mesh(bridge,new T.TorusGeometry(2.5,.11,6,40,Math.PI),0x788b83,0,-.16,side*.70);arch.scale.y=.14;}
 box(scene,9.2,.38,5.6,0xa8aa96,2.6,.19,-10.3);for(let i=0;i<7;i++)box(scene,7.8,.055*(i+1),.23,P.stone,2.6,.055*(i+1)/2,-5.9-i*.23);
 const roofs=[];const shops=new Map();for(const s of SHOPS)shops.set(s.id,building(scene,s,roofs,true));for(const h of HOUSES)building(scene,h,roofs,false);
 // South gate: an open visual continuation of the saved courtyard entrance.
 const entrance=group(scene,...townPoint(1700,2920));for(const side of [-1,1]){box(entrance,.32,2.5,.42,P.wood,side*1.15,1.25);box(entrance,.52,.18,.6,P.stone,side*1.15,.09);lantern(entrance,side*1.55,1.6,.15);box(entrance,9,.95,.27,0x8e9a8c,side*5.8,.45);}
 roof(entrance,3.0,1.3,2.4,0x315459);
 const well=group(scene,...townPoint(1780,2260));mesh(well,new T.LatheGeometry([new T.Vector2(.43,0),new T.Vector2(.5,.5),new T.Vector2(.40,.5),new T.Vector2(.38,.15)],20),0x929b8e);mesh(well,new T.TorusGeometry(.45,.075,6,24),P.stone,0,.50).rotation.x=Math.PI/2;cylinder(well,.38,.38,.01,P.water,0,.36);for(const side of [-1,1])box(well,.07,1.6,.08,P.wood,side*.65,.8);beam(well,[-.7,1.6,0],[.7,1.6,0],.045,P.wood);barrel(well,.9,.25,.65);
 // The bookshop court has low walls, a moon gate, stone seats and flowering planters.
 const court=group(scene,...townPoint(2380,1880));box(court,5.4,.06,2.45,0xb5b6a0,0,-.015);for(const side of [-1,1])box(court,.16,.65,2.5,0xb7b9a3,side*2.7,.30);for(const side of [-1,1])box(court,1.9,.65,.16,0xb7b9a3,side*1.8,.30,1.3);
 mesh(court,new T.TorusGeometry(.68,.13,6,36),P.plaster,0,.72,1.3);cylinder(court,.42,.40,.12,P.stone,.9,.65);cylinder(court,.16,.19,.59,P.stone,.9,.29);for(const [x,z] of [[.4,0],[1.4,0],[.9,.65]])cylinder(court,.16,.15,.3,0x929c8a,x,.15,z);
 for(const [x,y] of [[2167,1587],[2697,1557]]){const g=group(scene,...townPoint(x,y));box(g,.75,.42,.75,0x8c927b,0,.21);for(let i=0;i<8;i++)mesh(g,new T.IcosahedronGeometry(.14,0),i%2?0xc5a278:0x81945a,Math.sin(i)*.22,.55,Math.cos(i)*.22);}
 for(const t of TOWN_TREES){const [x,,z]=townPoint(t.x,t.y),g=group(scene,x,townElevation(t.x,t.y),z);cylinder(g,.11,.17,1.85,0x6d543a,0,.92);for(let i=0;i<3;i++){const leaf=mesh(g,new T.DodecahedronGeometry(.68*t.size,0),t.color,(i-1)*.4,1.85+(i%2)*.45,Math.sin(i*2)*.23);leaf.scale.set(1,1.08,.85);}}
 for(let i=0;i<18;i++){const angle=i*Math.PI*2/18;if(Math.sin(angle)>.32)continue;const radius=21+(i%3),g=mesh(scene,new T.DodecahedronGeometry(2.4+(i%3),0),[0x718c86,0x7e928b,0x8b9f94][i%3],Math.cos(angle)*radius,1.7,Math.sin(angle)*radius);g.scale.set(1,1.8+(i%2)*.7,1);}
 for(const [x,y] of TOWN_LAMPS){const [xx,,zz]=townPoint(x,y),g=group(scene,xx,0,zz);box(g,.06,1.8,.07,P.wood,0,.9);beam(g,[0,1.8,0],[.28,1.8,0],.025,P.wood);lantern(g,.28,1.65,0);}
 const cart=group(scene,...townPoint(2080,2310));box(cart,1.0,.10,.65,P.wood,0,.42);for(const side of [-1,1]){const wheel=mesh(cart,new T.TorusGeometry(.20,.035,5,12),P.dark,side*.55,.22);wheel.rotation.y=Math.PI/2;}for(const z of [-.30,.30])box(cart,1.0,.20,.045,0x96764c,0,.56,z);barrel(cart,-.2,0,.75);box(cart,.36,.3,.34,0xb6a17c,.27,.62);beam(cart,[.48,.43,.22],[1.15,.6,.22],.025,P.wood);
 const excluded=[...roofs.map(r=>r.root),riverMesh];bake(scene,excluded);
 const actors=new Map();const player=makeActor(0x427e81,'player');actors.set('player',player);scene.add(player.root);
 for(const resident of TOWN_RESIDENTS){const a=makeActor(resident.color,'clerk');actors.set(resident.id,a);scene.add(a.root);a.root.position.set(...townPoint(resident.x,resident.y));}
 const waterGlints=new T.InstancedMesh(new T.TorusGeometry(.3,.008,4,20,1.4),mat(0xb3e1d7),22),glintDummy=new T.Object3D();waterGlints.castShadow=false;scene.add(waterGlints);
 const glintPositions=Array.from({length:22},(_,i)=>{const y=360+i*115;return townPoint(riverX(y),y);});

 const debug=new T.Group();scene.add(debug);for(const r of TOWN_COLLIDERS){const [x,y,w,d]=r,m=new T.Mesh(new T.BoxGeometry(w/100,.06,d/100),new T.MeshBasicMaterial({color:0xffbc58,wireframe:true}));m.position.set(...townPoint(x+w/2,y+d/2));m.position.y=townElevation(x+w/2,y+d/2)+.05;debug.add(m);}debug.visible=false;
 return {scene,shops,roofs,actors,river:riverMesh,waterGlints,glintPositions,glintDummy,debug};
}
export function frameTownCamera(camera,width,height,focus){const span=Math.max(10.3,16/(width/height));camera.left=-span*width/height/2;camera.right=-camera.left;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();const x=Math.max(850,Math.min(2380,focus.x)),y=Math.max(850,Math.min(2500,focus.y)),target=new T.Vector3(...townPoint(x,y));target.y=.3;camera.position.copy(target).add(new T.Vector3(0,11,12));camera.lookAt(target);camera.updateMatrixWorld();}
export function updateTownWorld(world,game,poseActor){
 for(const [id,a] of world.actors){const data=TOWN_RESIDENTS.find(r=>r.id===id);let position=id==='player'?game.player:data,moving=id==='player'?game.moving:false,angle=id==='player'?Math.atan2(game.player.lookX,game.player.lookY):0;
  if(data?.path&&!game.reducedMotion){const p=(game.time*.035)%data.path.length,i=Math.floor(p),t=p-i,from=data.path[i],to=data.path[(i+1)%data.path.length];position={x:from[0]+(to[0]-from[0])*t,y:from[1]+(to[1]-from[1])*t};angle=Math.atan2(to[0]-from[0],to[1]-from[1]);moving=true;}
  a.root.position.set(...townPoint(position.x,position.y));a.root.position.y=townElevation(position.x,position.y);a.root.rotation.y=angle;
  poseActor(a,{moving,stride:id==='player'?game.stride:game.time*4.5,time:game.time,reducedMotion:game.reducedMotion});
  if(data?.shop==='weapons'&&!game.reducedMotion)a.rightArm.rotation.x=-.7+Math.sin(game.time*2.3)*.25;
 }
 for(const {root,site} of world.roofs){const near=Math.abs(game.player.x-site.x)<site.width/2+90&&Math.abs(game.player.y-site.y)<site.depth/2+110;root.traverse(m=>{if(m.isMesh){m.material.transparent=true;m.material.opacity=near?.20:1;m.material.depthWrite=!near;}});}
 world.glintPositions.forEach((position,i)=>{const m=world.glintDummy;m.position.set(...position);m.position.y=-.061;m.rotation.set(-Math.PI/2,0,i);m.scale.setScalar((.24+(i%3)*.10)/.3*(game.reducedMotion?1:1+Math.sin(game.time*.7+i)*.08));m.updateMatrix();world.waterGlints.setMatrixAt(i,m.matrix);});world.waterGlints.instanceMatrix.needsUpdate=true;world.debug.visible=game.debugCollisions;
}
