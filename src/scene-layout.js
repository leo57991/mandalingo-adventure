// World-space presentation coordinates. Gameplay colliders remain in lessons.js.
export const COURTYARD_ART = Object.freeze({
  backdrop: { x:80, y:-20, width:1440, height:900 },
  gate: { x:727, y:145, width:165, height:134, travel:84 },
  parapets: [[225,652,475,135], [922,652,455,135]],
});
export function courtyardCamera(width, height, focus) {
  const scale = Math.max(width/1600, height/900, width < 800 ? width/850 : 0);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  return {x:clamp(focus.x-width/scale/2,0,1600-width/scale),
    y:clamp(focus.y-100-height/scale/2,0,900-height/scale), scale};
}
