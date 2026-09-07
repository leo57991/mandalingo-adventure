// Presentation only: all navigation, affordances and story state remain in their existing owners.
const TAU = Math.PI * 2;
export function getCourtyardOcclusion(player) {
  return player.y > 600 && (player.x < 680 || player.x > 920) ? .32 : 1;
}
const polygon = (c, points, fill) => { c.fillStyle = fill; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); };
const ellipse = (c,x,y,rx,ry,fill) => { c.fillStyle=fill; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,TAU); c.fill(); };
const line = (c,x,y,x2,y2,color,width=1) => { c.strokeStyle=color; c.lineWidth=width; c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.stroke(); };
const noise = n => { const v=Math.sin(n*127.1+311.7)*43758.5453; return v-Math.floor(v); };
function stone(c,x,y,w,h) {
  c.fillStyle='#576362'; c.fillRect(x,y,w,h);
  for(let row=0;row<h/18;row++) for(let col=-1;col<w/49;col++) {
    const left=x+col*49+(row%2)*24;
    c.fillStyle=['#84908a','#92968a','#737f79','#9a9e8f'][Math.floor(noise(row*29+col)*4)];
    c.fillRect(Math.max(x,left)+1,y+row*18+1,Math.max(0,Math.min(left+47,x+w)-Math.max(x,left)),16);
  }
  c.fillStyle='#bbb8a1'; c.fillRect(x,y,w,3);
}
function roof(c,x,y,w,h=42) {
  // A curved eave, a lit ridge and regular tile courses establish one shared camera and material.
  polygon(c,[[x-19,y+h-6],[x+7,y+16],[x+22,y],[x+w-22,y],[x+w-7,y+16],[x+w+19,y+h-6],[x+w+10,y+h+6],[x-10,y+h+6]],'#172f32');
  polygon(c,[[x-17,y+h-6],[x+10,y+15],[x+23,y+3],[x+w-23,y+3],[x+w-10,y+15],[x+w+17,y+h-6]],'#3c5756');
  for(let i=0;i<4;i++) { const t=i/4; line(c,x+17-27*t,y+7+t*(h-7),x+w-17+27*t,y+7+t*(h-7),'#69807a',1.3); }
  for(let k=0;k<w;k+=13) { const t=k/w; line(c,x+22+t*(w-44),y+4,x-11+t*(w+22),y+h-3,'#233d40',2); }
  line(c,x-17,y+h-5,x+w+17,y+h-5,'#9aa58f',2);
  line(c,x+21,y,x+w-21,y,'#a1ac95',4);
  for(const px of [x-13,x+w+13]) { ellipse(c,px,y+h+1,4,3,'#afb09a'); }
}
function wall(c,x,y,w,h=112) {
  c.fillStyle='#343e37'; c.fillRect(x+9,y+12,w,h);
  const plaster=c.createLinearGradient(x,y,x,y+h); plaster.addColorStop(0,'#d7c8a5'); plaster.addColorStop(.7,'#b9b393'); plaster.addColorStop(1,'#91997f');
  c.fillStyle=plaster; c.fillRect(x,y,w,h);
  stone(c,x,y+h-28,w,28);
  for(let i=0;i<w/105;i++) { c.fillStyle='#8b7660'; c.fillRect(x+i*105,y,7,h-26); c.fillStyle='#dcceab'; c.fillRect(x+i*105+7,y,3,h-26); }
  c.fillStyle='rgba(24,44,38,.24)'; c.fillRect(x,y,w,18);
  roof(c,x-3,y-30,w+6,32);
}
function lantern(c,x,y) {
  const glow=c.createRadialGradient(x,y,2,x,y,60); glow.addColorStop(0,'rgba(255,188,84,.26)'); glow.addColorStop(1,'rgba(255,188,84,0)'); c.fillStyle=glow;c.fillRect(x-60,y-60,120,120);
  line(c,x,y-33,x,y-16,'#423b2d',2);
  ellipse(c,x,y,12,18,'#9b4b33'); ellipse(c,x-2,y-1,9,15,'#e6a358'); ellipse(c,x-3,y-2,4,13,'#ffcf7d');
  line(c,x-9,y-16,x+9,y-16,'#534631',3); line(c,x-8,y+16,x+8,y+16,'#534631',3); line(c,x,y+18,x,y+29,'#b76b3f',2);
}
function bamboo(c,x,y,scale=1) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  for(let j=0;j<6;j++) { const dx=(j-3)*12, top=-125-noise(j+x)*90; line(c,dx,0,dx+14,top,'#334f42',4);
    for(let a=-25;a>top;a-=24) { line(c,dx+2,a,dx+8,a,'#b0ad78',2); for(const sign of [-1,1]) { const end=dx+sign*(30+noise(a+j)*20); line(c,dx+5,a,end,a-20,'#395c46',1.5); ellipse(c,end,a-22,15,3,'#53744f'); ellipse(c,end-sign*14,a-16,12,3,'#71845a'); } }
  }
  c.restore();
}
function tree(c,x,y,scale,seed) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  line(c,0,0,12,-185,'#524b3a',15); line(c,9,-90,-80,-182,'#524b3a',8);line(c,11,-128,104,-225,'#524b3a',7);
  line(c,-35,-137,-119,-164,'#524b3a',4);line(c,49,-166,29,-246,'#524b3a',4);
  for(let n=0;n<110;n++) { const a=noise(n+seed)*TAU,r=Math.sqrt(noise(n+seed+80)); const px=Math.cos(a)*147*r,py=-204+Math.sin(a)*70*r;
    ellipse(c,px,py,12+noise(n+8)*19,8+noise(n+19)*12,['#715b37','#967039','#b58b47','#c1a45d','#71815a'][n%5]); }
  c.restore();
}
export function paintCourtyard(c) {
  const sky=c.createLinearGradient(0,0,0,900);sky.addColorStop(0,'#76938d');sky.addColorStop(.45,'#b0b8a0');sky.addColorStop(1,'#344e48');c.fillStyle=sky;c.fillRect(0,0,1600,900);
  for(let layer=0;layer<3;layer++) { const points=[[0,340]];for(let x=0;x<=1700;x+=85) points.push([x,100+layer*50-noise(x+layer*57)*105]);points.push([1600,430]);polygon(c,points,['#6b8880','#607e74','#506e63'][layer]); }
  // Exterior groves frame the playable stone terrace; no decorative obstacle is placed in the walkable area.
  for(const [x,y,s,seed] of [[150,460,1.3,8],[1460,390,1.45,99],[72,765,1.1,55],[1525,780,1.2,80]]) tree(c,x,y,s,seed);
  const shadow=c.createRadialGradient(800,550,250,800,550,740); shadow.addColorStop(0,'rgba(13,31,28,.65)');shadow.addColorStop(1,'rgba(13,31,28,0)');c.fillStyle=shadow;c.fillRect(0,180,1600,720);
  polygon(c,[[245,255],[1355,255],[1390,758],[1352,793],[248,793],[210,758]],'#3a4943');
  stone(c,248,755,1104,35);
  c.fillStyle='#a7a68e';c.fillRect(250,260,1100,490);
  for(let row=0;row<16;row++) for(let col=0;col<20;col++) {
    const x=251+col*55+(row%2)*-27,y=268+row*30;
    const n=noise(row*71+col);c.fillStyle=['#b4b19a','#bdb7a1','#a8aa93','#c1bca5','#afad96'][Math.floor(n*5)];
    c.fillRect(Math.max(251,x)+1,y,Math.min(53,1348-Math.max(251,x)),28);
    line(c,Math.max(253,x+2),y+1,Math.min(1348,x+52),y+1,'rgba(236,226,193,.3)');
  }
  // Central processional path, edged in darker stone, links the two gates.
  c.fillStyle='#777f71'; c.fillRect(691,280,218,468);
  c.fillStyle='#ddd0aa';c.fillRect(700,280,4,468);c.fillRect(896,280,4,468);
  for(let row=0;row<11;row++) for(let col=0;col<2;col++) { const x=708+col*92,y=289+row*41; c.fillStyle=['#c7c1a8','#d2cab0','#bebda5'][(row+col)%3];c.fillRect(x,y,88,38); line(c,x+2,y+2,x+86,y+2,'#e0d8bc'); }
  // Functional alcoves: a quiet waiting area and a dark, damp stone apron at the water jar.
  for(const [x,y,w,h] of [[333,413,249,152],[996,312,282,215]]) { c.strokeStyle='#7e8c78';c.lineWidth=4;c.strokeRect(x,y,w,h);c.strokeStyle='#d5c8a6';c.lineWidth=1;c.strokeRect(x+7,y+6,w-14,h-12); }
  ellipse(c,1220,510,73,29,'rgba(57,87,80,.18)');
  for(let x=1160;x<1275;x+=10)line(c,x,548,x+4,556,'#63796c',2);
  // Cast shadows share the same late-afternoon light direction.
  polygon(c,[[278,279],[1312,279],[1266,338],[305,338]],'rgba(29,55,48,.21)');
  polygon(c,[[288,285],[321,285],[375,720],[290,720]],'rgba(29,55,48,.2)');
  wall(c,270,161,410,124);wall(c,920,161,410,124);
  // Side walls have a narrow ground footprint and a visible top plane.
  for(const x of [250,1320]) { polygon(c,[[x,286],[x+30,286],[x+30,720],[x,720]],'#b4b294');polygon(c,[[x,286],[x+30,286],[x+18,257],[x-12,257]],'#71867a');c.fillStyle='#6f7968';c.fillRect(x+23,287,8,431);for(let y=290;y<715;y+=21)line(c,x-3,y,x+23,y,'#809184',2); }
  bamboo(c,302,290,.76);bamboo(c,1357,568,.8);bamboo(c,230,702,.8);
  // Gate surround is fixed; only the two timber leaves animate in paintCourtyardGate.
  stone(c,678,275,244,16);c.fillStyle='#3b4c42';c.fillRect(704,118,192,161);
  for(const x of [686,896]) { c.fillStyle='#6d4a36';c.fillRect(x,126,18,150);c.fillStyle='#b29262';c.fillRect(x+2,129,4,144);stone(c,x-5,266,28,18); }
  c.fillStyle='#745439';c.fillRect(687,126,226,17);line(c,691,129,909,129,'#bf9c62',3);
  roof(c,680,62,240,66); roof(c,704,41,192,33);
  for(const x of [662,938])lantern(c,x,205);
  // A restrained timber lattice behind the register identifies it as an inhabited workplace.
  c.fillStyle='#55634f';c.fillRect(1034,189,102,54);c.strokeStyle='#b4a47c';c.lineWidth=3;c.strokeRect(1034,189,102,54);
  for(let x=1045;x<1130;x+=15)line(c,x,191,x,241,'#a79570',2);line(c,1035,215,1134,215,'#a79570',2);
  // Patina remains deterministic and is rasterized once, not regenerated per animation frame.
  for(let i=0;i<180;i++) { const x=300+noise(i)*1000,y=295+noise(i+900)*415; if(x>687&&x<913)continue;ellipse(c,x,y,1+noise(i+80)*2,.7,'rgba(78,94,68,.22)'); }
  for(let i=0;i<38;i++){const x=310+noise(i+89)*290,y=310+noise(i+433)*315;ellipse(c,x,y,3,1.4,['#ad8749','#8c8b50','#c3a465'][i%3]);}
  const light=c.createLinearGradient(300,180,1350,850);light.addColorStop(0,'rgba(255,223,156,.13)');light.addColorStop(.65,'rgba(255,223,156,0)');light.addColorStop(1,'rgba(29,57,51,.1)');c.fillStyle=light;c.fillRect(250,140,1100,610);
}
export function paintCourtyardGate(c,progress) {
  c.save();c.beginPath();c.rect(706,145,188,132);c.clip();
  c.fillStyle='#273d34';c.fillRect(706,145,188,132);
  const g=c.createLinearGradient(0,145,0,277);g.addColorStop(0,'#93b19a');g.addColorStop(1,'#d9d3a8');c.fillStyle=g;c.fillRect(727,145,146,132);
  for(const side of [-1,1]) { const x=side<0?706-progress*94:800+progress*94;
    const wood=c.createLinearGradient(x,0,x+94,0);wood.addColorStop(0,'#4d3f2e');wood.addColorStop(.3,'#8c6944');wood.addColorStop(1,'#594631');c.fillStyle=wood;c.fillRect(x,145,94,132);
    for(let k=1;k<6;k++)line(c,x+k*15,146,x+k*15,277,'rgba(39,35,26,.5)',2);
    for(const y of [163,250]){c.fillStyle='#433e2c';c.fillRect(x+3,y,88,7);for(let k=0;k<5;k++)ellipse(c,x+10+k*17,y+3,2,2,'#bd9b5e');}
    c.strokeStyle='#d1ac68';c.lineWidth=3;c.beginPath();c.arc(x+(side<0?77:17),210,6,0,TAU);c.stroke();
  }
  c.restore();
}
export function paintCourtyardForeground(c,player) {
  c.save();c.globalAlpha=getCourtyardOcclusion(player);
  // Low parapets keep the playable area readable; the entrance stays open on the central axis.
  wall(c,270,657,410,63);wall(c,920,657,410,63);
  c.restore();
  for(const x of [687,900]) { stone(c,x,685,13,40);lantern(c,x+6,658); }
  polygon(c,[[704,746],[896,746],[925,766],[675,766]],'#b9b79d');
  line(c,676,767,924,767,'#64766c',3);
  line(c,681,778,919,778,'#c4c0a5',5);
}
