import { COLLIDERS, ENTITIES, FURNITURE, NPCS, RENDER_OBJECTS, ROOM } from "./lessons.js?v=gatehouse-v2";

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
    this.started = false; this.inputEnabled = false; this.debugCollisions = false; this.nearby = null; this.questResolved = false;
    this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 };
    this.actorCues = Object.fromEntries(NPCS.map(npc => [npc.id, { pose: "idle", expression: "neutral", gestureTarget: null, prop: null }]));
    this.images = new Map();
    for (const source of new Set([...ROOM.groundTiles, ROOM.playerSprite, ...RENDER_OBJECTS.map(item => item.sprite).filter(Boolean), "assets/gate-room/props/empty-bowl.png"])) this.loadImage(source);
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }

  loadImage(source) { const image = new Image(); image.src = source; this.images.set(source, image); return image; }
  imageReady(source) { const image = this.images.get(source); return image?.complete && image.naturalWidth > 0 ? image : null; }
  start() { this.started = true; this.inputEnabled = true; this.player = { x: ROOM.playerStart.x, y: ROOM.playerStart.y, facing: ROOM.playerStart.facing, lookX: 0, lookY: -1 }; }
  setInputEnabled(enabled) { this.inputEnabled = enabled; if (!enabled) this.clearKeys(); }
  setKey(key, down) { if (down) this.keys.add(key); else this.keys.delete(key); }
  setMobileVector(x, y) { this.mobileVector = { x, y }; }
  clearKeys() { this.keys.clear(); this.mobileVector = { x: 0, y: 0 }; }
  setQuestResolved(resolved) { this.questResolved = resolved; }
  setActorCue(actorId, cue = {}) { if (this.actorCues[actorId]) this.actorCues[actorId] = { ...this.actorCues[actorId], ...cue }; }
  resetActorCues() { for (const npc of NPCS) this.actorCues[npc.id] = { pose: "idle", expression: "neutral", gestureTarget: null, prop: null }; }
  toggleCollisionDebug() { this.debugCollisions = !this.debugCollisions; return this.debugCollisions; }
  interact() { if (this.inputEnabled && this.nearby) this.callbacks.onInteract?.(this.nearby); }

  loop(now) { const dt = Math.min((now - this.lastTime) / 1000, .04); this.lastTime = now; this.time += dt; if (this.started) this.update(dt); this.draw(); requestAnimationFrame(this.loop); }
  update(dt) {
    let x = this.mobileVector.x, y = this.mobileVector.y;
    if (this.inputEnabled) { x += Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft")); y += Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup")); }
    const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
    if (!this.inputEnabled) x = y = 0;
    if (x || y) {
      this.player.lookX = x; this.player.lookY = y; if (Math.abs(x) > .1) this.player.facing = Math.sign(x);
      const running = this.keys.has("shift"), speedX = running ? PLAYER_SPEED.runX : PLAYER_SPEED.walkX, speedY = running ? PLAYER_SPEED.runY : PLAYER_SPEED.walkY;
      const nextX = this.player.x + x * speedX * dt, nextY = this.player.y + y * speedY * dt;
      if (isPlayerWalkable(nextX, this.player.y)) this.player.x = nextX;
      if (isPlayerWalkable(this.player.x, nextY)) this.player.y = nextY;
    }
    const nextNearby = selectInteractionTarget(this.player);
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
    this.drawAtmosphere(ctx); if (this.debugCollisions) this.drawCollisionDebug(ctx);
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
    if (item.id === "gate" && this.questResolved) return;
    const image = this.imageReady(item.sprite); if (!image) return;
    const left = item.x - item.width * (item.anchorX ?? .5), top = item.y - item.height * (item.anchorY ?? 1);
    ctx.drawImage(image, left, top, item.width, item.height);
    if (this.nearby?.id === item.id) { ctx.save(); ctx.strokeStyle = "#e3c879"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(item.x, item.y - 4, Math.max(24, item.width * .24), 12, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }

  drawNpc(ctx, npc) {
    const cue = this.actorCues[npc.id] ?? {}, bob = Math.sin(this.time * 2 + npc.x) * 1.2;
    ctx.save(); ctx.translate(0, bob); this.drawObject(ctx, npc); ctx.restore();
    if (this.debugCollisions) this.drawActorGesture(ctx, npc, cue);
    if (cue.prop === "empty-bowl" || cue.prop === "water") { const bowl = this.imageReady("assets/gate-room/props/empty-bowl.png"); if (bowl) { ctx.save(); ctx.globalAlpha = cue.prop === "water" ? 1 : .88; ctx.drawImage(bowl, npc.x + 20, npc.y - 65, 42, 42); ctx.restore(); } }
  }

  drawActorGesture(ctx, npc, cue) {
    if (!["point-self", "point-player", "point-third", "question", "confused", "nod"].includes(cue.pose)) return;
    let target = cue.gestureTarget === "player" ? this.player : RENDER_OBJECTS.find(item => item.id === cue.gestureTarget);
    if (cue.pose === "point-self") target = npc;
    const start = { x: npc.x, y: npc.y - npc.height * .55 }, end = target ? { x: target.x, y: target.y - (target.height ?? 40) * .45 } : { x: npc.x + 30, y: npc.y - npc.height * .7 };
    ctx.save(); ctx.strokeStyle = "rgba(239,206,124,.92)"; ctx.fillStyle = "rgba(239,206,124,.95)"; ctx.lineWidth = 4; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(end.x, end.y, 6, 0, TAU); ctx.fill();
    if (["question", "confused"].includes(cue.pose)) { ctx.font = "bold 25px serif"; ctx.fillText("?", npc.x + 30, npc.y - npc.height + 15); }
    ctx.restore();
  }

  drawPlayer(ctx) {
    const image = this.imageReady(ROOM.playerSprite), moving = this.keys.size > 0 || Math.hypot(this.mobileVector.x, this.mobileVector.y) > .1, bob = moving ? Math.sin(this.time * 11) * 2 : Math.sin(this.time * 2) * .7;
    ctx.save(); ctx.translate(this.player.x, this.player.y + bob); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 5, 24, 8, 0, 0, TAU); ctx.fill();
    if (image) { const visual = ROOM.playerVisual; ctx.scale(this.player.facing || 1, 1); ctx.drawImage(image, -visual.width * visual.anchorX, -visual.height * visual.anchorY, visual.width, visual.height); }
    else { ctx.fillStyle = "#31535f"; ctx.fillRect(-18, -65, 36, 68); }
    ctx.restore();
  }

  drawEffect(ctx, item) { ctx.save(); ctx.globalAlpha = item.id === "mist" ? .22 + Math.sin(this.time * .7) * .06 : .72; ctx.translate(Math.sin(this.time * .5 + item.x) * 4, 0); this.drawObject(ctx, item); ctx.restore(); }
  drawAtmosphere(ctx) { const mist = ctx.createLinearGradient(0, 0, WIDTH, 0); mist.addColorStop(0, "rgba(21,42,51,.48)"); mist.addColorStop(.18, "rgba(21,42,51,0)"); mist.addColorStop(.82, "rgba(21,42,51,0)"); mist.addColorStop(1, "rgba(21,42,51,.48)"); ctx.fillStyle = mist; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  drawCollisionDebug(ctx) { ctx.save(); ctx.strokeStyle = "#58e6d0"; ctx.lineWidth = 2; ctx.strokeRect(...ROOM.walkableBounds); ctx.fillStyle = "rgba(255,80,80,.22)"; ctx.strokeStyle = "#ff6565"; for (const entity of COLLIDERS) { const body = entity.collider; ctx.fillRect(entity.x + body.x, entity.y + body.y, body.width, body.height); ctx.strokeRect(entity.x + body.x, entity.y + body.y, body.width, body.height); } ctx.strokeStyle = "#ffda75"; ctx.beginPath(); ctx.arc(this.player.x, this.player.y, PLAYER_COLLISION_RADIUS, 0, TAU); ctx.stroke(); ctx.restore(); }
}
