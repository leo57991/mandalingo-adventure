// Logical coordinates shared by physical collision and the 3D hinged doors.
export const GATE = Object.freeze({centerX:800,hingeY:288,halfWidth:90,thickness:16,maxAngle:Math.PI*.48,postOffset:108,postWidth:25,postDepth:40,postY:270});
export const gateAngle = progress => Math.max(0,Math.min(1,progress))*GATE.maxAngle;
export function gateLeaves(progress) {
  const angle=gateAngle(progress);
  return [-1,1].map(side=>({x:GATE.centerX+side*GATE.halfWidth,y:GATE.hingeY,endX:GATE.centerX+side*GATE.halfWidth-side*GATE.halfWidth*Math.cos(angle),endY:GATE.hingeY+GATE.halfWidth*Math.sin(angle)}));
}
export function isGateWalkable(x,y,radius,progress) {
  for(const side of [-1,1]) {
    const px=GATE.centerX+side*GATE.postOffset;
    const dx=Math.max(0,Math.abs(x-px)-GATE.postWidth/2),dy=Math.max(0,Math.abs(y-GATE.postY)-GATE.postDepth/2);
    if(Math.hypot(dx,dy)<=radius)return false;
  }
  return gateLeaves(progress).every(leaf=>{
    const dx=leaf.endX-leaf.x,dy=leaf.endY-leaf.y;
    const t=Math.max(0,Math.min(1,((x-leaf.x)*dx+(y-leaf.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-leaf.x-t*dx,y-leaf.y-t*dy)>radius+GATE.thickness/2;
  });
}
