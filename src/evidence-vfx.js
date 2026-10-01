export function observationCue(entity, line) {
  if (!entity || ![...(entity.lines || []), ...(entity.resolvedLines || [])].includes(line)) return null;
  const key = `${entity.id}:${line.id}`;
  if (line.pose === 'point-self') return {kind:'reference',sourceId:entity.id,targetId:line.gestureTarget,key};
  if (line.pose === 'point-player') return {kind:'reference',sourceId:entity.id,targetId:'player',key};
  if (line.pose === 'hold-empty-bowl') return {kind:'empty-bowl',sourceId:entity.id,targetId:entity.id,key};
  if (entity.id === 'water-jar') return {kind:'water-surface',sourceId:entity.id,targetId:entity.id,key};
  if (line.pose === 'drink-water') return {kind:'drink',sourceId:entity.id,targetId:entity.id,key};
  return null;
}
export class EvidenceEffects {
  constructor() { this.time=0;this.active=[]; }
  play(cue) {
    if (!cue || !['reference','empty-bowl','water-surface','water-fill','drink','recovery','gate-release'].includes(cue.kind) || this.active.some(effect=>effect.key===cue.key)) return false;
    this.active.push({...cue,startedAt:this.time,duration:2.8});
    if (this.active.length>4) this.active.shift();
    return true;
  }
  advance(dt, paused=false) {
    if (paused) return;
    this.time+=Math.max(0,dt);
    this.active=this.active.filter(effect=>this.time-effect.startedAt<effect.duration);
  }
}
