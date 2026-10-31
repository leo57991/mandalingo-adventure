import * as T from './vendor/three.module.js';

export const JAR_WATER_LEVEL=.642;

// Ambient presentation only. No inventory, language or quest authority.
export function createJarWater(parent) {
  const root=new T.Group();root.position.y=JAR_WATER_LEVEL;parent.add(root);
  const surface=new T.Mesh(new T.CylinderGeometry(.32,.32,.012,48),new T.MeshStandardMaterial({color:0x3e9eaa,roughness:.19,metalness:.15}));
  surface.receiveShadow=true;root.add(surface);
  const ripples=Array.from({length:2},()=>{
    const ring=new T.Mesh(new T.TorusGeometry(1,.012,4,48),new T.MeshBasicMaterial({color:0xa1e0df,transparent:true,opacity:.3,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.009;root.add(ring);return ring;
  });
  const glints=[.21,.13].map((radius,i)=>{
    const arc=new T.Mesh(new T.TorusGeometry(radius,.008,4,32,i?1.05:1.65),new T.MeshBasicMaterial({color:0xe6fff3,transparent:true,opacity:.7,depthWrite:false}));
    arc.rotation.set(-Math.PI/2,0,i?3.45:.15);arc.position.set(-.025,.013,-.015);root.add(arc);return arc;
  });
  const drop=new T.Mesh(new T.SphereGeometry(.014,8,6),new T.MeshBasicMaterial({color:0xa8e7e9}));
  drop.scale.set(.7,1.4,.7);root.add(drop);
  const water={root,surface,ripples,glints,drop};updateJarWater(water,0);return water;
}
export function updateJarWater(water,time,reducedMotion=false) {
  const t=reducedMotion?0:time;
  water.ripples.forEach((ring,i)=>{
    const phase=(t*.32+i*.5)%1;
    ring.scale.setScalar(.055+phase*.25);ring.material.opacity=reducedMotion?.24:(1-phase)*.36;
  });
  water.glints.forEach((arc,i)=>{
    arc.rotation.z=(i?3.45:.15)+(reducedMotion?0:Math.sin(t*.65+i)*.055);
    arc.material.opacity=reducedMotion?.7:.64+Math.sin(t*.8+i)*.1;
  });
  const fall=((time%2.7)+2.7)%2.7/.55;
  water.drop.visible=!reducedMotion&&fall<1;
  // A bead drips from the inner edge of the resting ladle into the jar.
  water.drop.position.set(.27,.14*(1-Math.min(1,fall)),.05);
}
