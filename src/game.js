import { EvidenceEffects } from "./evidence-vfx.js?v=courtyard-vfx-v1";
import { Courtyard3D } from "./courtyard-3d.js?v=courtyard-vfx-v1";
import { COLLIDERS, ENTITIES, NPCS, ROOM } from "./lessons.js?v=courtyard-vfx-v1";

const WIDTH = ROOM.width, HEIGHT = ROOM.height;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const FIXED_CAMERA = false;
export const RENDER_LAYERS = Object.freeze(["ground", "back-structure", "depth", "foreground", "effects", "ui"]);
export const PLAYER_SPEED = Object.freeze({ walkX: 120, walkY: 105, runX: 190, runY: 165 });
export const PLAYER_COLLISION_RADIUS = 18;

const inRect = (x, y, [left, top, width, height]) => x >= left && x <= left + width && y >= top && y <= top + height;
export const pointInEntityBody = (x, y, entity) => {
  const body = entity?.collider;
  return Boolean(body && x >= entity.x + body.x && x <= entity.x + body.x + body.width && y >= entity.y + body.y && y <= entity.y + body.y + body.height);
};
export const isWorldWalkable = (x, y) => inRect(x, y, ROOM.walkableBounds);
export const isPlayerWalkable = (x, y, radius = PLAYER_COLLISION_RADIUS, colliders = COLLIDERS) => {
  const samples = [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius], [radius * .7, radius * .7], [-radius * .7, radius * .7], [radius * .7, -radius * .7], [-radius * .7, -radius * .7]];
  return samples.every(([dx, dy]) => isWorldWalkable(x + dx, y + dy) && !colliders.some(entity => pointInEntityBody(x + dx, y + dy, entity)));
};
export const selectInteractionTarget = (player, entities = ENTITIES) => entities
  .map(entity => {
    const d = distance(player, entity), dx = entity.x - player.x, dy = entity.y - player.y;
    const lookLength = Math.hypot(player.lookX ?? player.facing ?? 1, player.lookY ?? 0) || 1;
    const facing = ((player.lookX ?? player.facing ?? 1) * dx + (player.lookY ?? 0) * dy) / (lookLength * (d || 1));
    return { entity, d, facing, score: d - facing * 20 };
  })
  .filter(item => item.d <= item.entity.interactionRadius && item.facing >= -.2)
  .sort((a, b) => a.score - b.score)[0]?.entity ?? null;

export class MandalingoGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas; this.callbacks = callbacks;
    this.keys = new Set(); this.mobileVector = { x: 0, y: 0 }; this.time = 0; this.lastTime = performance.now();
    this.started = false; this.inputEnabled = false; this.debugCollisions = false; this.nearby = null; this.questResolved = false; this.gateOpenProgress = 0; this.gateApproachTriggered = false;
    this.resolution = null; this.resolutionPhase = null; this.resolutionCompleted = false;
    this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 };
    this.actorPositions = Object.fromEntries(NPCS.map(npc => [npc.id, { x: npc.x, y: npc.y }]));
    this.actorCues = Object.fromEntries(NPCS.map(npc => [npc.id, { pose: "idle", expression: "neutral", gestureTarget: null, prop: npc.waterTarget && !this.questResolved ? "empty-bowl" : null, startedAt: 0 }]));
    this.stride = 0; this.moving = false; this.carryingWater = false;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.viewWidth = canvas.clientWidth || WIDTH; this.viewHeight = canvas.clientHeight || HEIGHT;
    this.view = new Courtyard3D(canvas);
    new ResizeObserver(([entry]) => {
      this.viewWidth = entry.contentRect.width; this.viewHeight = entry.contentRect.height;
    }).observe(canvas);
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }

  start({ resolved = false } = {}) { this.evidence = new EvidenceEffects(); this.stride = 0; this.moving = false; this.started = true; this.inputEnabled = true; this.gateApproachTriggered = false; this.questResolved = false; this.gateOpenProgress = 0; this.resolution = null; this.resolutionPhase = null; this.resolutionCompleted = false; this.actorPositions = Object.fromEntries(NPCS.map(npc => [npc.id, { x: npc.x, y: npc.y }])); this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 }; this.resetActorCues();
    if (resolved) {
      this.questResolved = true; this.gateOpenProgress = 1; this.gateApproachTriggered = true;
      this.actorPositions["thirsty-traveller"] = { x: 735, y: 405 };
      this.setActorCue("thirsty-traveller", {pose:"idle", expression:"relieved", prop:null});
    }
  }
  playEvidence(cue) { const played = this.evidence?.play(cue) || false; if (played) this.callbacks.onEvidence?.(cue.kind); return played; }
  setInputEnabled(enabled) { this.inputEnabled = enabled; if (!enabled) this.clearKeys(); }
  setKey(key, down) { if (down) this.keys.add(key); else this.keys.delete(key); }
  setMobileVector(x, y) { this.mobileVector = { x, y }; }
  clearKeys() { this.keys.clear(); this.mobileVector = { x: 0, y: 0 }; }
  setQuestResolved(resolved) { this.questResolved = resolved; if (!resolved) this.gateOpenProgress = 0; }
  setActorCue(actorId, cue = {}) { if (this.actorCues[actorId]) this.actorCues[actorId] = { ...this.actorCues[actorId], ...cue, startedAt: this.time }; }
  resetActorCues() { for (const npc of NPCS) this.actorCues[npc.id] = { pose: "idle", expression: "neutral", gestureTarget: null, prop: npc.waterTarget && !this.questResolved ? "empty-bowl" : null, startedAt: this.time }; }
  worldEntity(entity) { const position = this.actorPositions[entity?.id]; return position ? { ...entity, ...position } : entity; }
  beginWaterResolution() { this.setInputEnabled(false); this.nearby = null; this.callbacks.onNearby?.(null); this.resolution = { elapsed: 0 }; this.resolutionPhase = null; this.resolutionCompleted = false; this.setResolutionPhase("drink"); }
  setResolutionPhase(phase) {
    if (this.resolutionPhase === phase) return; this.resolutionPhase = phase; this.resetActorCues();
    const kind = {drink:"drink",walk:"recovery",open:"gate-release"}[phase];
    if (kind) this.playEvidence({kind,sourceId:"thirsty-traveller",targetId:phase === "open" ? "gate" : "thirsty-traveller",key:`resolution:${phase}`});
    if (phase === "drink") this.setActorCue("thirsty-traveller", { pose: "drink-water", expression: "relieved", gestureTarget: "thirsty-traveller", prop: "water" });
    else if (phase === "walk") this.setActorCue("thirsty-traveller", { pose: "idle", expression: "recovering", gestureTarget: null, prop: null });
    else if (phase === "plead") { this.setActorCue("thirsty-traveller", { pose: "point-third", expression: "earnest", gestureTarget: "gatekeeper", prop: null }); this.setActorCue("gatekeeper", { pose: "question", expression: "listening", gestureTarget: "room-people", prop: null }); }
    else if (phase === "open") { this.questResolved = true; this.setActorCue("thirsty-traveller", { pose: "nod", expression: "grateful", gestureTarget: "player", prop: null }); this.setActorCue("gatekeeper", { pose: "nod", expression: "approving", gestureTarget: "gate", prop: null }); }
  }
  updateResolution(dt) {
    this.resolution.elapsed += dt; const elapsed = this.resolution.elapsed, traveller = this.actorPositions["thirsty-traveller"], origin = NPCS.find(npc => npc.id === "thirsty-traveller"), destination = { x: 735, y: 405 };
    if (elapsed < 1.8) this.setResolutionPhase("drink");
    else if (elapsed < 5.4) { this.setResolutionPhase("walk"); const progress = clamp((elapsed - 1.8) / 3.6, 0, 1); traveller.x = origin.x + (destination.x - origin.x) * progress; traveller.y = origin.y + (destination.y - origin.y) * progress; }
    else if (elapsed < 7.8) { traveller.x = destination.x; traveller.y = destination.y; this.setResolutionPhase("plead"); }
    else this.setResolutionPhase("open");
    if (!this.resolutionCompleted && elapsed >= 9.4 && this.gateOpenProgress >= .9) { this.resolutionCompleted = true; this.callbacks.onResolutionComplete?.(); }
  }
  toggleCollisionDebug() { this.debugCollisions = !this.debugCollisions; return this.debugCollisions; }
  interact() { if (this.inputEnabled && this.nearby) this.callbacks.onInteract?.(this.nearby); }

  loop(now) { const dt = Math.min((now - this.lastTime) / 1000, .04); this.lastTime = now; if (!this.presentationPaused) this.time += dt; if (this.started) this.update(dt); this.draw(); requestAnimationFrame(this.loop); }
  update(dt) {
    this.evidence?.advance(dt, this.presentationPaused);
    if (this.presentationPaused) return;
    if (this.resolution) this.updateResolution(dt);
    if (this.questResolved) this.gateOpenProgress = Math.min(1, this.gateOpenProgress + dt * 1.25);
    let x = this.mobileVector.x, y = this.mobileVector.y;
    if (this.inputEnabled) { x += Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft")); y += Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup")); }
    const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
    if (!this.inputEnabled) x = y = 0;
    const oldX = this.player.x, oldY = this.player.y;
    if (x || y) {
      this.player.lookX = x; this.player.lookY = y; if (Math.abs(x) > .1) this.player.facing = Math.sign(x);
      const running = this.keys.has("shift"), speedX = running ? PLAYER_SPEED.runX : PLAYER_SPEED.walkX, speedY = running ? PLAYER_SPEED.runY : PLAYER_SPEED.walkY;
      const nextX = this.player.x + x * speedX * dt, nextY = this.player.y + y * speedY * dt;
      const activeColliders = (this.questResolved ? COLLIDERS.filter(entity => entity.id !== "gate") : COLLIDERS).map(entity => this.worldEntity(entity));
      if (isPlayerWalkable(nextX, this.player.y, PLAYER_COLLISION_RADIUS, activeColliders)) this.player.x = nextX;
      if (isPlayerWalkable(this.player.x, nextY, PLAYER_COLLISION_RADIUS, activeColliders)) this.player.y = nextY;
    }
    const travelled = Math.hypot(this.player.x - oldX, this.player.y - oldY);
    this.moving = travelled > .01; this.stride += travelled / 13;
    if (!this.gateApproachTriggered && !this.questResolved && this.player.y < 480) { this.gateApproachTriggered = true; this.callbacks.onGateApproach?.(NPCS.find(npc => npc.id === "gatekeeper")); }
    const interactionEntities = (this.questResolved ? ENTITIES.filter(entity => entity.id !== "gate") : ENTITIES).map(entity => this.worldEntity(entity));
    const nextNearby = selectInteractionTarget(this.player, interactionEntities);
    if (nextNearby !== this.nearby) { this.nearby = nextNearby; this.callbacks.onNearby?.(nextNearby); }
  }

  draw() { this.view.render(this); }
}
