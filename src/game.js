import { COLLIDERS, ENTITIES, FURNITURE, NPCS, RENDER_OBJECTS, ROOM } from "./lessons.js?v=gatehouse-v3";

const WIDTH = ROOM.width, HEIGHT = ROOM.height, TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const FIXED_CAMERA = true;
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
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.callbacks = callbacks;
    this.keys = new Set(); this.mobileVector = { x: 0, y: 0 }; this.time = 0; this.lastTime = performance.now();
    this.started = false; this.inputEnabled = false; this.debugCollisions = false; this.nearby = null; this.questResolved = false; this.gateOpenProgress = 0; this.gateApproachTriggered = false;
    this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 };
    this.actorCues = Object.fromEntries(NPCS.map(npc => [npc.id, { pose: "idle", expression: "neutral", gestureTarget: null, prop: npc.waterTarget ? "empty-bowl" : null }]));
    this.images = new Map();
    for (const source of new Set([...ROOM.groundTiles, ROOM.playerSprite, ...RENDER_OBJECTS.map(item => item.sprite).filter(Boolean), "assets/gate-room/props/empty-bowl.png"])) this.loadImage(source);
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }

  loadImage(source) { const image = new Image(); image.src = source; this.images.set(source, image); return image; }
  imageReady(source) { const image = this.images.get(source); return image?.complete && image.naturalWidth > 0 ? image : null; }
  start() { this.started = true; this.inputEnabled = true; this.gateApproachTriggered = false; this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 }; }
  setInputEnabled(enabled) { this.inputEnabled = enabled; if (!enabled) this.clearKeys(); }
  setKey(key, down) { if (down) this.keys.add(key); else this.keys.delete(key); }
  setMobileVector(x, y) { this.mobileVector = { x, y }; }
  clearKeys() { this.keys.clear(); this.mobileVector = { x: 0, y: 0 }; }
  setQuestResolved(resolved) { this.questResolved = resolved; if (!resolved) this.gateOpenProgress = 0; }
  setActorCue(actorId, cue = {}) { if (this.actorCues[actorId]) this.actorCues[actorId] = { ...this.actorCues[actorId], ...cue }; }
  resetActorCues() { for (const npc of NPCS) this.actorCues[npc.id] = { pose: "idle", expression: "neutral", gestureTarget: null, prop: npc.waterTarget ? "empty-bowl" : null }; }
  toggleCollisionDebug() { this.debugCollisions = !this.debugCollisions; return this.debugCollisions; }
  interact() { if (this.inputEnabled && this.nearby) this.callbacks.onInteract?.(this.nearby); }

  loop(now) { const dt = Math.min((now - this.lastTime) / 1000, .04); this.lastTime = now; this.time += dt; if (this.started) this.update(dt); this.draw(); requestAnimationFrame(this.loop); }
  update(dt) {
    if (this.questResolved) this.gateOpenProgress = Math.min(1, this.gateOpenProgress + dt * 1.25);
    let x = this.mobileVector.x, y = this.mobileVector.y;
    if (this.inputEnabled) { x += Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft")); y += Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup")); }
    const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
    if (!this.inputEnabled) x = y = 0;
    if (x || y) {
      this.player.lookX = x; this.player.lookY = y; if (Math.abs(x) > .1) this.player.facing = Math.sign(x);
      const running = this.keys.has("shift"), speedX = running ? PLAYER_SPEED.runX : PLAYER_SPEED.walkX, speedY = running ? PLAYER_SPEED.runY : PLAYER_SPEED.walkY;
      const nextX = this.player.x + x * speedX * dt, nextY = this.player.y + y * speedY * dt;
      const activeColliders = this.questResolved ? COLLIDERS.filter(entity => entity.id !== "gate") : COLLIDERS;
      if (isPlayerWalkable(nextX, this.player.y, PLAYER_COLLISION_RADIUS, activeColliders)) this.player.x = nextX;
      if (isPlayerWalkable(this.player.x, nextY, PLAYER_COLLISION_RADIUS, activeColliders)) this.player.y = nextY;
    }
    if (!this.gateApproachTriggered && !this.questResolved && this.player.y < 480) { this.gateApproachTriggered = true; this.callbacks.onGateApproach?.(NPCS.find(npc => npc.id === "gatekeeper")); }
    const interactionEntities = this.questResolved ? ENTITIES.filter(entity => entity.id !== "gate") : ENTITIES;
    const nextNearby = selectInteractionTarget(this.player, interactionEntities);
    if (nextNearby !== this.nearby) { this.nearby = nextNearby; this.callbacks.onNearby?.(nextNearby); }
  }

  draw() {
    const ctx = this.ctx; ctx.clearRect(0, 0, WIDTH, HEIGHT); this.drawGround(ctx);
    for (const item of RENDER_OBJECTS.filter(object => object.layer === "back-structure")) this.drawObject(ctx, item);
    const depth = [
      ...RENDER_OBJECTS.filter(object => object.layer === "depth" && object.type !== "npc").map(actor => ({ kind: "object", y: actor.y, actor })),
      ...NPCS.map(actor => ({ kind: "npc", y: actor.y, actor })),
      { kind: "player", y: this.player.y, actor: this.player }
    ].sort((a, b) => a.y - b.y);
    for (const item of depth) item.kind === "player" ? this.drawPlayer(ctx) : item.kind === "npc" ? this.drawNpc(ctx, item.actor) : this.drawObject(ctx, item.actor);
    for (const item of RENDER_OBJECTS.filter(object => object.layer === "foreground")) this.drawObject(ctx, item);
    for (const item of RENDER_OBJECTS.filter(object => object.layer === "effects")) this.drawEffect(ctx, item);
    this.drawAtmosphere(ctx); if (this.questResolved) this.drawGateLight(ctx); if (this.debugCollisions) this.drawCollisionDebug(ctx);
  }

  drawGround(ctx) {
    ctx.fillStyle = "#26343a"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save(); ctx.beginPath(); ctx.rect(205, 105, 1190, 670); ctx.clip();
    const [base, damp, worn] = ROOM.groundTiles.map(source => this.imageReady(source));
    const fillTexture = (image, alpha, operation, scale, offsetX = 0, offsetY = 0) => {
      if (!image) return; const pattern = ctx.createPattern(image, "repeat"); if (!pattern) return;
      if (pattern.setTransform && typeof DOMMatrix !== "undefined") pattern.setTransform(new DOMMatrix().translate(offsetX, offsetY).scale(scale));
      ctx.globalAlpha = alpha; ctx.globalCompositeOperation = operation; ctx.fillStyle = pattern; ctx.fillRect(205, 105, 1190, 670);
    };
    fillTexture(base, .75, "source-over", .5); fillTexture(damp, .09, "multiply", .54, 117, 63); fillTexture(worn, .07, "soft-light", .47, 241, 129);
    ctx.restore();
    const shade = ctx.createRadialGradient(800, 430, 180, 800, 430, 780); shade.addColorStop(0, "rgba(213,201,166,.08)"); shade.addColorStop(1, "rgba(4,12,19,.72)"); ctx.fillStyle = shade; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawObject(ctx, item) {
    if (item.id === "gate") { this.drawGate(ctx, item); return; }
    const image = this.imageReady(item.sprite); if (!image) return;
    const left = item.x - item.width * (item.anchorX ?? .5), top = item.y - item.height * (item.anchorY ?? 1);
    ctx.drawImage(image, left, top, item.width, item.height);
    if (item.id === "notice-board") this.drawRegisterMarks(ctx, item);
    if (this.nearby?.id === item.id) { ctx.save(); ctx.strokeStyle = "#e3c879"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(item.x, item.y - 4, Math.max(24, item.width * .24), 12, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }

  drawGate(ctx, item) {
    const image = this.imageReady(item.sprite); if (!image || this.gateOpenProgress >= 1) return;
    const left = item.x - item.width * item.anchorX, top = item.y - item.height * item.anchorY, half = item.width / 2, slide = half * this.gateOpenProgress;
    ctx.save(); ctx.globalAlpha = 1 - this.gateOpenProgress * .3;
    ctx.drawImage(image, 0, 0, image.naturalWidth / 2, image.naturalHeight, left - slide, top, half, item.height);
    ctx.drawImage(image, image.naturalWidth / 2, 0, image.naturalWidth / 2, image.naturalHeight, left + half + slide, top, half, item.height);
    ctx.restore();
  }

  drawRegisterMarks(ctx, item) {
    const top = item.y - item.height, pulse = .62 + Math.sin(this.time * 2.4) * .06;
    ctx.save(); ctx.translate(item.x, top + 112); ctx.strokeStyle = `rgba(67,46,25,${pulse + .2})`; ctx.fillStyle = "rgba(220,193,130,.58)"; ctx.lineWidth = 2;
    for (let index = -1; index <= 1; index += 1) { const x = index * 25; ctx.beginPath(); ctx.arc(x, 0, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 10, 12, 20, 17); ctx.strokeRect(x - 10, 12, 20, 17); ctx.strokeRect(x - 12, 36, 24, 4); }
    ctx.restore();
  }

  drawNpc(ctx, npc) {
    const cue = this.actorCues[npc.id] ?? {};
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,.23)"; ctx.beginPath(); ctx.ellipse(npc.x, npc.y + 4, 23, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
    this.drawObject(ctx, npc); this.drawActorGesture(ctx, npc, cue);
    if (cue.prop === "empty-bowl" || cue.prop === "water") { const bowl = this.imageReady("assets/gate-room/props/empty-bowl.png"); if (bowl) { ctx.save(); ctx.globalAlpha = cue.prop === "water" ? 1 : .88; ctx.drawImage(bowl, npc.x + 20, npc.y - 65, 42, 42); ctx.restore(); } }
    if (cue.prop === "empty-bowl" && cue.gestureTarget === "water-jar") this.drawWaterThought(ctx, npc);
  }

  drawActorGesture(ctx, npc, cue) {
    if (!["point-self", "point-player", "point-third", "question", "confused", "nod", "hold-empty-bowl", "drink-water"].includes(cue.pose)) return;
    if (cue.pose === "nod") { const glow = 12 + Math.sin(this.time * 6) * 4; ctx.save(); ctx.strokeStyle = "rgba(247,215,122,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(npc.x, npc.y - npc.height * .72, glow, 0, TAU); ctx.stroke(); ctx.restore(); return; }
    let target = cue.gestureTarget === "player" ? this.player : RENDER_OBJECTS.find(item => item.id === cue.gestureTarget);
    if (cue.pose === "point-self") target = npc;
    if (cue.gestureTarget === "room-people" || cue.pose === "question" || cue.pose === "confused") { this.drawQuestionCue(ctx, npc); return; }
    const start = { x: npc.x + 8, y: npc.y - npc.height * .57 }, end = target ? { x: target.x, y: target === npc ? npc.y - npc.height * .58 : target.y - (target.height ?? 40) * .42 } : { x: npc.x + 30, y: npc.y - npc.height * .7 }, glow = .55 + Math.sin(this.time * 7) * .25;
    ctx.save(); ctx.strokeStyle = `rgba(239,206,124,${.72 + glow * .2})`; ctx.fillStyle = "rgba(255,224,133,.95)"; ctx.shadowColor = "rgba(255,215,112,.9)"; ctx.shadowBlur = 10; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(end.x, end.y, target === npc ? 9 + glow * 3 : 20 + glow * 5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(end.x, end.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawWaterThought(ctx, npc) {
    const x = npc.x + 55, y = npc.y - npc.height - 10;
    ctx.save(); ctx.fillStyle = "rgba(15,27,31,.94)"; ctx.strokeStyle = "rgba(121,195,205,.95)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 45, 34, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(npc.x + 22, npc.y - npc.height + 12, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8ed6df"; ctx.font = "bold 31px serif"; ctx.fillText("◆", x - 13, y + 11); ctx.restore();
  }

  drawQuestionCue(ctx, npc) {
    const bubbleX = npc.x + 48, bubbleY = npc.y - npc.height - 16, scan = Math.floor(this.time * 1.8) % 4;
    ctx.save(); ctx.fillStyle = "rgba(15,27,31,.94)"; ctx.strokeStyle = "rgba(239,206,124,.94)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bubbleX, bubbleY, 66, 38, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(npc.x + 21, npc.y - npc.height + 12, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.font = "bold 28px Georgia"; ctx.fillStyle = "#f4d788"; ctx.fillText("?", bubbleX - 8, bubbleY + 10);
    for (let index = -1; index <= 1; index += 1) { const x = bubbleX + index * 27; ctx.globalAlpha = .38; ctx.beginPath(); ctx.arc(x, bubbleY + 17, 5, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1; const people = [this.player, ...NPCS]; const active = people[scan]; if (active) { ctx.strokeStyle = "rgba(247,215,122,.72)"; ctx.beginPath(); ctx.ellipse(active.x, active.y + 1, 27, 12, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  drawPlayer(ctx) {
    const image = this.imageReady(ROOM.playerSprite), moving = this.keys.size > 0 || Math.hypot(this.mobileVector.x, this.mobileVector.y) > .1, sway = moving ? Math.sin(this.time * 10) * .012 : Math.sin(this.time * 2) * .004;
    ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 5, 24, 8, 0, 0, TAU); ctx.fill();
    if (image) { const visual = ROOM.playerVisual; ctx.scale(this.player.facing || 1, 1); ctx.transform(1, 0, sway, 1, 0, 0); ctx.drawImage(image, -visual.width * visual.anchorX, -visual.height * visual.anchorY, visual.width, visual.height); }
    else { ctx.fillStyle = "#31535f"; ctx.fillRect(-18, -65, 36, 68); }
    ctx.restore();
  }

  drawEffect(ctx, item) { ctx.save(); ctx.globalAlpha = item.id === "mist" ? .22 + Math.sin(this.time * .7) * .06 : .72; ctx.translate(Math.sin(this.time * .5 + item.x) * 4, 0); this.drawObject(ctx, item); ctx.restore(); }
  drawAtmosphere(ctx) { const mist = ctx.createLinearGradient(0, 0, WIDTH, 0); mist.addColorStop(0, "rgba(21,42,51,.48)"); mist.addColorStop(.18, "rgba(21,42,51,0)"); mist.addColorStop(.82, "rgba(21,42,51,0)"); mist.addColorStop(1, "rgba(21,42,51,.48)"); ctx.fillStyle = mist; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  drawGateLight(ctx) { const alpha = .12 + Math.sin(this.time * 4) * .04, glow = ctx.createRadialGradient(800, 300, 10, 800, 300, 150); glow.addColorStop(0, `rgba(255,221,139,${alpha + .2})`); glow.addColorStop(1, "rgba(255,221,139,0)"); ctx.fillStyle = glow; ctx.fillRect(640, 160, 320, 280); }
  drawCollisionDebug(ctx) { ctx.save(); ctx.strokeStyle = "#58e6d0"; ctx.lineWidth = 2; ctx.strokeRect(...ROOM.walkableBounds); ctx.fillStyle = "rgba(255,80,80,.22)"; ctx.strokeStyle = "#ff6565"; for (const entity of COLLIDERS) { const body = entity.collider; ctx.fillRect(entity.x + body.x, entity.y + body.y, body.width, body.height); ctx.strokeRect(entity.x + body.x, entity.y + body.y, body.width, body.height); } ctx.strokeStyle = "#ffda75"; ctx.beginPath(); ctx.arc(this.player.x, this.player.y, PLAYER_COLLISION_RADIUS, 0, TAU); ctx.stroke(); ctx.restore(); }
}
