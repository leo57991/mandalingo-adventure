import { ENTITIES, LOCATIONS, WORLD } from "./lessons.js?v=20260820-5";

const WIDTH = 1600, HEIGHT = 900, TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;
const CAMERA_ANCHOR_Y = HEIGHT * .54;
const FIXED_ZOOM = 1.5;
export const SOUTH_GATE_DETAIL = Object.freeze({ x: 645, y: 1000, width: 1115, height: 627 });
export const PLAYER_SPEED = Object.freeze({ x: 165, y: 150 });
const PLAYER_COLLISION_RADIUS = 22;
export const WORLD_GEOMETRY = Object.freeze({
  paths: Object.freeze([
    [880, 220, 640, 1330],
    [190, 540, 840, 630],
    [1380, 500, 850, 710],
    [760, 80, 860, 570],
    [980, 1000, 440, 180],
    [1085, 1140, 230, 170],
    [900, 1260, 600, 295],
    [1070, 1500, 260, 100]
  ]),
  solids: Object.freeze([
    [645, 1000, 335, 180],
    [1420, 1000, 340, 180],
    [645, 1180, 435, 125],
    [1320, 1180, 440, 125],
    [355, 600, 250, 160],
    [1810, 540, 270, 170],
    [730, 335, 190, 145],
    [1505, 315, 220, 155]
  ])
});
const isInArea = (x, y, [left, top, width, height]) => x >= left && x <= left + width && y >= top && y <= top + height;
export const isWorldWalkable = (x, y) => {
  const onPath = WORLD_GEOMETRY.paths.some(area => isInArea(x, y, area));
  return onPath && !WORLD_GEOMETRY.solids.some(area => isInArea(x, y, area));
};
export const pointInEntityBody = (x, y, entity) => {
  const body = entity.bodyCollider;
  return body ? x >= entity.x + body.x && x <= entity.x + body.x + body.width && y >= entity.y + body.y && y <= entity.y + body.y + body.height : false;
};
export const isPlayerWalkable = (x, y, radius = PLAYER_COLLISION_RADIUS, entities = ENTITIES) => [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius], [radius * .7, radius * .7], [-radius * .7, radius * .7], [radius * .7, -radius * .7], [-radius * .7, -radius * .7]].every(([offsetX, offsetY]) => {
  const px = x + offsetX, py = y + offsetY;
  return isWorldWalkable(px, py) && !entities.some(entity => pointInEntityBody(px, py, entity));
});
const segmentIntersectsRect = (a, b, rect) => {
  const steps = Math.max(2, Math.ceil(dist(a, b) / 20));
  for (let i = 1; i < steps; i += 1) if (isInArea(lerp(a.x, b.x, i / steps), lerp(a.y, b.y, i / steps), rect)) return true;
  return false;
};
export const selectInteractionTarget = (player, entities = ENTITIES, solids = WORLD_GEOMETRY.solids) => entities
  .map(entity => {
    const distance = dist(player, entity);
    const dx = entity.x - player.x, dy = entity.y - player.y;
    const lookLength = Math.hypot(player.lookX ?? player.facing ?? 1, player.lookY ?? 0) || 1;
    const targetLength = Math.hypot(dx, dy) || 1;
    const facingScore = ((player.lookX ?? player.facing ?? 1) * dx + (player.lookY ?? 0) * dy) / (lookLength * targetLength);
    const occluded = solids.some(rect => segmentIntersectsRect(player, entity, rect));
    return { entity, distance, facingScore, score: distance - facingScore * 24, occluded };
  })
  .filter(candidate => !candidate.occluded && candidate.facingScore >= (candidate.entity.minimumFacingDot ?? -.1) && candidate.distance <= (candidate.entity.interactionRadius ?? 105) && candidate.score < (candidate.entity.interactionRadius ?? 105))
  .sort((a, b) => a.score - b.score)[0]?.entity ?? null;
export const projectWorldPoint = (x, y, camera) => {
  return {
    x: WIDTH / 2 + (x - camera.focusX) * camera.zoom,
    y: CAMERA_ANCHOR_Y + (y - camera.focusY) * camera.zoom,
    scale: camera.zoom
  };
};

export class MandalingoGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.callbacks = callbacks;
    this.keys = new Set(); this.mobileVector = { x: 0, y: 0 }; this.time = 0; this.lastTime = performance.now();
    this.started = false; this.inputEnabled = false; this.debugCollisions = false; this.nearby = null; this.location = LOCATIONS[0]; this.questResolved = false;
    this.background = new Image(); this.background.src = "assets/mandalingo-key-art.png"; this.backgroundLoaded = false; this.background.onload = () => { this.backgroundLoaded = true; };
    this.townBackground = new Image(); this.townBackground.src = "assets/wuyin-town-map-v2.png"; this.townBackgroundLoaded = false; this.townBackground.onload = () => { this.townBackgroundLoaded = true; };
    this.southGateDetail = new Image(); this.southGateDetail.src = "assets/south-gate-detail-v1.png"; this.southGateDetailLoaded = false; this.southGateDetailLayer = null;
    this.southGateDetail.onload = () => { this.southGateDetailLoaded = true; this.southGateDetailLayer = createFeatheredLayer(this.southGateDetail); };
    this.playerSprite = new Image(); this.playerSprite.src = "assets/wuxia-traveller.png"; this.playerSpriteLoaded = false; this.playerSprite.onload = () => { this.playerSpriteLoaded = true; };
    this.motes = seededMotes(); this.reset(); this.resizeBackingStore();
    window.addEventListener("resize", () => this.resizeBackingStore());
    requestAnimationFrame(time => this.loop(time));
  }

  resizeBackingStore() {
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;
    const portraitExploration = availableWidth / availableHeight < .75;
    const cssScale = portraitExploration ? availableHeight / HEIGHT : Math.min(availableWidth / WIDTH, availableHeight / HEIGHT);
    this.canvas.style.width = `${Math.round(WIDTH * cssScale)}px`;
    this.canvas.style.height = `${Math.round(HEIGHT * cssScale)}px`;
    this.canvas.width = Math.round(WIDTH * dpr);
    this.canvas.height = Math.round(HEIGHT * dpr);
    this.dpr = dpr;
  }

  reset() {
    this.player = { x: 1245, y: 1515, vx: 0, vy: 0, facing: 1, lookX: 0, lookY: -1 };
    this.camera = { focusX: this.player.x, focusY: WORLD.height - (HEIGHT - CAMERA_ANCHOR_Y) / FIXED_ZOOM, zoom: FIXED_ZOOM };
    this.cinematicTarget = null;
    this.nearby = null; this.location = LOCATIONS[0];
  }
  start() { this.reset(); this.started = true; this.callbacks.onLocation?.(this.location); this.callbacks.onNearby?.(null); }
  setInputEnabled(enabled) { this.inputEnabled = Boolean(enabled); if (!this.inputEnabled) this.clearInput(); else this.cinematicTarget = null; }
  setKey(key, down) { if (!this.inputEnabled) return; if (down) this.keys.add(key); else this.keys.delete(key); }
  clearInput() { this.keys.clear(); this.mobileVector = { x: 0, y: 0 }; this.player.vx = 0; this.player.vy = 0; }
  setMobileVector(x, y) { this.mobileVector = this.inputEnabled ? { x, y } : { x: 0, y: 0 }; }
  setQuestResolved(value) { this.questResolved = value; }
  toggleCollisionDebug() { this.debugCollisions = !this.debugCollisions; }
  interact() { if (this.inputEnabled && this.nearby) { this.cinematicTarget = this.nearby; this.callbacks.onInteract?.(this.nearby); } }

  update(delta) {
    this.time += delta;
    if (this.started && this.inputEnabled) {
      let x = this.mobileVector.x + (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
      let y = this.mobileVector.y + (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0);
      const magnitude = Math.hypot(x, y); if (magnitude > 1) { x /= magnitude; y /= magnitude; }
      const speedMultiplier = this.keys.has("shift") ? 1.48 : 1;
      if (Math.hypot(x, y) > .12) { this.player.lookX = x; this.player.lookY = y; }
      if (Math.abs(x) > .05) this.player.facing = Math.sign(x);
      this.player.vx = lerp(this.player.vx, x * PLAYER_SPEED.x * speedMultiplier, 1 - Math.pow(.001, delta));
      this.player.vy = lerp(this.player.vy, y * PLAYER_SPEED.y * speedMultiplier, 1 - Math.pow(.001, delta));
      const nextX = clamp(this.player.x + this.player.vx * delta, 70, WORLD.width - 70), nextY = clamp(this.player.y + this.player.vy * delta, 90, WORLD.height - 70);
      if (isPlayerWalkable(nextX, this.player.y)) this.player.x = nextX; else this.player.vx *= .18;
      if (isPlayerWalkable(this.player.x, nextY)) this.player.y = nextY; else this.player.vy *= .18;

      const nextNearby = selectInteractionTarget(this.player);
      if (nextNearby?.id !== this.nearby?.id) { this.nearby = nextNearby; this.callbacks.onNearby?.(nextNearby); }

      const nextLocation = LOCATIONS.find(location => { const [left, top, right, bottom] = location.bounds; return this.player.x >= left && this.player.x <= right && this.player.y >= top && this.player.y <= bottom; }) ?? this.location;
      if (nextLocation.id !== this.location.id) { this.location = nextLocation; this.callbacks.onLocation?.(nextLocation); }
    }

    const focus = this.cinematicTarget
      ? { x: (this.player.x + this.cinematicTarget.x) / 2, y: (this.player.y + this.cinematicTarget.y) / 2 - 85 }
      : { x: this.player.x + this.player.vx * .22, y: this.player.y + this.player.vy * .1 - 85 };
    const minX = WIDTH / 2 / FIXED_ZOOM, maxX = WORLD.width - minX;
    const minY = CAMERA_ANCHOR_Y / FIXED_ZOOM, maxY = WORLD.height - (HEIGHT - CAMERA_ANCHOR_Y) / FIXED_ZOOM;
    const follow = 1 - Math.pow(.00055, delta);
    this.camera.focusX = lerp(this.camera.focusX, clamp(focus.x, minX, maxX), follow);
    this.camera.focusY = lerp(this.camera.focusY, clamp(focus.y, minY, maxY), follow);
    this.camera.zoom = FIXED_ZOOM;
  }

  loop(now) { const delta = Math.min(.035, (now - this.lastTime) / 1000); this.lastTime = now; this.update(delta); this.draw(); requestAnimationFrame(time => this.loop(time)); }

  draw() {
    const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (!this.started) { this.drawTitle(ctx); return; }
    this.drawTown(ctx); this.drawDepthQueue(ctx); this.drawForegroundOcclusion(ctx); this.drawForegroundMist(ctx);
    if (this.debugCollisions) this.drawCollisionDebug(ctx);
  }

  drawTitle(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#10172e"); sky.addColorStop(.55, "#334b59"); sky.addColorStop(1, "#172330"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.backgroundLoaded) { ctx.globalAlpha = .88; ctx.drawImage(this.background, 0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
    const veil = ctx.createLinearGradient(0, 0, 0, HEIGHT); veil.addColorStop(0, "rgba(3,8,22,.1)"); veil.addColorStop(.62, "rgba(5,12,25,.18)"); veil.addColorStop(1, "rgba(4,9,20,.72)"); ctx.fillStyle = veil; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (const mote of this.motes) { ctx.globalAlpha = .12 + mote.depth * .3; ctx.fillStyle = mote.warm ? "#ffd798" : "#a7e3d4"; ctx.beginPath(); ctx.arc(mote.x, mote.y + Math.sin(this.time * mote.speed + mote.phase) * 15, mote.size, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }

  drawTown(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#0b1822"); sky.addColorStop(.52, "#233b41"); sky.addColorStop(1, "#53635b"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.townBackgroundLoaded) drawStableMap(ctx, this.townBackground, this.camera);
    else drawFallbackLandscape(ctx);
    if (this.southGateDetailLoaded && this.southGateDetailLayer) drawLocalDetail(ctx, this.southGateDetailLayer, SOUTH_GATE_DETAIL, this.camera);

    drawDepthWash(ctx);

    for (const [x, y, text] of [[615, 700, "藥"], [1930, 650, "茶"], [2090, 845, "客"], [310, 1010, "雜"]]) {
      const point = projectWorldPoint(x, y, this.camera); if (!isOnScreen(point, 100)) continue;
      ctx.save(); ctx.translate(point.x, point.y); ctx.scale(point.scale, point.scale); drawHangingSign(ctx, 0, 0, text); ctx.restore();
    }

    if (this.questResolved) {
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.strokeStyle = "rgba(126,224,196,.42)"; ctx.shadowColor = "#7ce0c4"; ctx.shadowBlur = 20; ctx.lineWidth = 5;
      const a = projectWorldPoint(1210, 930, this.camera), b = projectWorldPoint(1360, 790, this.camera), c = projectWorldPoint(1120, 650, this.camera), d = projectWorldPoint(1200, 420, this.camera);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y); ctx.stroke(); ctx.restore();
    }

    drawMistBand(ctx, -380 + (this.time * 17 % 2300), 250, 410, 25, .055);
    drawMistBand(ctx, 1900 - (this.time * 11 % 2300), 665, 510, 38, .085);
    for (const mote of this.motes.slice(0, 42)) { const point = projectWorldPoint(mote.x, mote.y, this.camera); if (!isOnScreen(point, 20)) continue; ctx.globalAlpha = .08 + mote.depth * .2; ctx.fillStyle = mote.warm ? "#ffd798" : "#dcece4"; ctx.beginPath(); ctx.arc(point.x, point.y + Math.sin(this.time * mote.speed + mote.phase) * 10, mote.size * point.scale, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }

  drawDepthQueue(ctx) {
    const queue = [
      ...ENTITIES.map(entity => ({ feetY: entity.y, draw: () => this.drawEntity(ctx, entity) })),
      { feetY: this.player.y, draw: () => this.drawPlayer(ctx) }
    ].sort((a, b) => a.feetY - b.feetY);
    for (const item of queue) item.draw();
  }

  drawEntity(ctx, entity) {
    const point = projectWorldPoint(entity.x, entity.y, this.camera); if (!isOnScreen(point, 120)) return;
    ctx.save(); ctx.translate(point.x, point.y); ctx.scale(point.scale * .82, point.scale * .82);
    if (entity.id !== "gate-sign") {
      if (entity.type === "npc") { drawNpc(ctx, 0, 0, entity.id, this.time); drawSemanticProp(ctx, entity.id, this.time); }
      else drawObject(ctx, 0, 0, entity.id, this.time);
    }
    if (this.nearby?.id === entity.id) drawFocusMarker(ctx, 0, 0, this.time);
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player; const moving = Math.hypot(p.vx, p.vy) > 8; const bob = moving ? Math.sin(this.time * 11) * 3 : Math.sin(this.time * 2) * 1.5;
    const point = projectWorldPoint(p.x, p.y, this.camera), scale = .46;
    ctx.save(); ctx.translate(point.x, point.y + bob * point.scale); ctx.scale(p.facing * point.scale, point.scale);
    ctx.fillStyle = "rgba(2,7,12,.42)"; ctx.filter = "blur(2px)"; ctx.beginPath(); ctx.ellipse(0, 7, 34 * scale, 10 * scale, 0, 0, TAU); ctx.fill(); ctx.filter = "none";
    if (this.playerSpriteLoaded) {
      const height = 132 * scale, width = height * (this.playerSprite.width / this.playerSprite.height);
      ctx.drawImage(this.playerSprite, -width / 2, -height + 11, width, height);
    } else drawFallbackPlayer(ctx, scale);
    ctx.restore();
  }

  drawForegroundMist(ctx) {
    ctx.save(); const mist = ctx.createLinearGradient(0, HEIGHT * .7, 0, HEIGHT); mist.addColorStop(0, "rgba(199,216,215,0)"); mist.addColorStop(1, "rgba(174,194,197,.13)"); ctx.fillStyle = mist; ctx.fillRect(0, HEIGHT * .7, WIDTH, HEIGHT * .3);
    drawMistBand(ctx, -600 + (this.time * 22 % 3000), HEIGHT - 25, 620, 42, .07);
    ctx.restore();
  }

  drawForegroundOcclusion(ctx) {
    if (!this.southGateDetailLoaded || !this.southGateDetailLayer || this.player.y < 1040 || this.player.y > 1390) return;
    const topLeft = projectWorldPoint(SOUTH_GATE_DETAIL.x, SOUTH_GATE_DETAIL.y, this.camera);
    const scale = this.camera.zoom;
    const sourceScaleX = this.southGateDetailLayer.width / SOUTH_GATE_DETAIL.width;
    const sourceScaleY = this.southGateDetailLayer.height / SOUTH_GATE_DETAIL.height;
    const pieces = [
      [0, 110, 425, 330],
      [775, 110, 340, 330],
      [410, 0, 365, 225]
    ];
    for (const [sx, sy, sw, sh] of pieces) {
      const dx = topLeft.x + sx * scale, dy = topLeft.y + sy * scale;
      const dw = sw * scale, dh = sh * scale;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
      ctx.drawImage(
        this.southGateDetailLayer,
        sx * sourceScaleX, sy * sourceScaleY, sw * sourceScaleX, sh * sourceScaleY,
        dx, dy, dw, dh
      );
      drawDepthWash(ctx);
      ctx.restore();
    }
  }

  drawCollisionDebug(ctx) {
    const drawRect = (rect, fill, stroke) => {
      const [x, y, width, height] = rect, point = projectWorldPoint(x, y, this.camera);
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.fillRect(point.x, point.y, width * this.camera.zoom, height * this.camera.zoom);
      ctx.strokeRect(point.x, point.y, width * this.camera.zoom, height * this.camera.zoom);
    };
    ctx.save();
    WORLD_GEOMETRY.paths.forEach(rect => drawRect(rect, "rgba(65,210,150,.06)", "rgba(65,210,150,.35)"));
    WORLD_GEOMETRY.solids.forEach(rect => drawRect(rect, "rgba(235,70,80,.16)", "rgba(255,85,95,.8)"));
    for (const entity of ENTITIES) {
      if (entity.bodyCollider) drawRect([entity.x + entity.bodyCollider.x, entity.y + entity.bodyCollider.y, entity.bodyCollider.width, entity.bodyCollider.height], "rgba(255,140,50,.22)", "#ff9838");
      const point = projectWorldPoint(entity.x, entity.y, this.camera);
      ctx.strokeStyle = "rgba(105,170,255,.65)"; ctx.beginPath(); ctx.arc(point.x, point.y, (entity.interactionRadius ?? 105) * this.camera.zoom, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  drawMiniMap(ctx) {
    const width = 230, height = width * WORLD.height / WORLD.width, left = WIDTH - width - 25, top = 88;
    ctx.save(); ctx.fillStyle = "rgba(5,12,17,.82)"; ctx.fillRect(left - 5, top - 5, width + 10, height + 10);
    if (this.townBackgroundLoaded) { ctx.globalAlpha = .78; ctx.drawImage(this.townBackground, left, top, width, height); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = "#263b3e"; ctx.fillRect(left, top, width, height); }
    const scaleX = width / WORLD.width, scaleY = height / WORLD.height;
    const viewWidth = WIDTH / this.camera.zoom, viewHeight = HEIGHT / this.camera.zoom;
    const viewTop = this.camera.focusY - CAMERA_ANCHOR_Y / this.camera.zoom;
    ctx.strokeStyle = "rgba(235,204,145,.78)"; ctx.lineWidth = 2; ctx.strokeRect(left + (this.camera.focusX - viewWidth / 2) * scaleX, top + viewTop * scaleY, viewWidth * scaleX, viewHeight * scaleY);
    ctx.fillStyle = "#e9c279"; ctx.shadowColor = "#e9c279"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(left + this.player.x * scaleX, top + this.player.y * scaleY, 4, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(216,173,103,.5)"; ctx.strokeRect(left, top, width, height); ctx.fillStyle = "rgba(239,229,207,.78)"; ctx.font = "10px 'Noto Sans TC',sans-serif"; ctx.textAlign = "right"; ctx.fillText(this.location.name, left + width - 8, top + height - 8); ctx.restore();
  }
}

function drawStableMap(ctx, image, camera) {
  const topLeft = projectWorldPoint(0, 0, camera);
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, topLeft.x, topLeft.y, WORLD.width * camera.zoom, WORLD.height * camera.zoom);
  ctx.restore();
}

function drawDepthWash(ctx) {
  const depthWash = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  depthWash.addColorStop(0, "rgba(4,12,22,.38)");
  depthWash.addColorStop(.46, "rgba(9,19,27,.02)");
  depthWash.addColorStop(1, "rgba(4,9,15,.28)");
  ctx.fillStyle = depthWash;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawLocalDetail(ctx, image, area, camera) {
  const topLeft = projectWorldPoint(area.x, area.y, camera);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, topLeft.x, topLeft.y, area.width * camera.zoom, area.height * camera.zoom);
  ctx.restore();
}

function createFeatheredLayer(image) {
  const layer = document.createElement("canvas"); layer.width = image.naturalWidth; layer.height = image.naturalHeight;
  const ctx = layer.getContext("2d"); ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  const horizontal = ctx.createLinearGradient(0, 0, layer.width, 0);
  horizontal.addColorStop(0, "rgba(255,255,255,0)"); horizontal.addColorStop(.055, "rgba(255,255,255,1)"); horizontal.addColorStop(.945, "rgba(255,255,255,1)"); horizontal.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = horizontal; ctx.fillRect(0, 0, layer.width, layer.height);
  const vertical = ctx.createLinearGradient(0, 0, 0, layer.height);
  vertical.addColorStop(0, "rgba(255,255,255,0)"); vertical.addColorStop(.05, "rgba(255,255,255,1)"); vertical.addColorStop(.93, "rgba(255,255,255,1)"); vertical.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = vertical; ctx.fillRect(0, 0, layer.width, layer.height); ctx.globalCompositeOperation = "source-over";
  return layer;
}

function isOnScreen(point, margin = 0) { return point.x > -margin && point.x < WIDTH + margin && point.y > -margin && point.y < HEIGHT + margin; }

function drawFallbackLandscape(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#152b35"); sky.addColorStop(1, "#52645d"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(18,38,38,.68)"; for (let x = -80; x < WIDTH + 120; x += 180) { ctx.beginPath(); ctx.arc(x, HEIGHT * .25 + Math.sin(x) * 45, 150, 0, TAU); ctx.fill(); }
}
function drawHangingSign(ctx, x, y, text) { ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 8; ctx.fillStyle = "rgba(35,29,24,.9)"; ctx.fillRect(-19, -34, 38, 54); ctx.strokeStyle = "rgba(213,166,91,.72)"; ctx.lineWidth = 2; ctx.strokeRect(-16, -31, 32, 48); ctx.fillStyle = "#e2c890"; ctx.font = "25px 'Noto Sans TC',serif"; ctx.textAlign = "center"; ctx.fillText(text, 0, 2); ctx.restore(); }
function drawStone(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12; ctx.fillStyle = "#69716b"; ctx.beginPath(); ctx.moveTo(-36, 34); ctx.lineTo(-30, -66); ctx.quadraticCurveTo(0, -84, 31, -61); ctx.lineTo(39, 34); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(218,222,205,.28)"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#252f2d"; ctx.font = "22px 'Noto Sans TC',serif"; ctx.textAlign = "center"; ctx.fillText("霧隱鎮", 0, -14); ctx.restore(); }
function drawNpc(ctx, x, y, id, time) { const palette = id === "thirsty-disciple" ? ["#c4c9ae", "#536b63", "#8f5748"] : id === "tea-keeper" ? ["#c99a76", "#714849", "#b18154"] : id === "herbalist" ? ["#b7ac82", "#405b53", "#82704e"] : ["#c4aa82", "#435e62", "#8a5d45"]; const bob = Math.sin(time * 1.8 + x) * 1.5; const scale = .74; ctx.save(); ctx.translate(x, y + bob); ctx.scale(scale, scale); ctx.fillStyle = "rgba(2,7,12,.38)"; ctx.beginPath(); ctx.ellipse(0, 18, 28, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = palette[1]; ctx.beginPath(); ctx.moveTo(-18, -27); ctx.quadraticCurveTo(0, -38, 18, -27); ctx.lineTo(29, 17); ctx.quadraticCurveTo(0, 28, -29, 17); ctx.closePath(); ctx.fill(); ctx.fillStyle = palette[2]; ctx.fillRect(-21, -4, 42, 6); ctx.strokeStyle = "rgba(225,217,187,.42)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(-27, 1); ctx.moveTo(15, -20); ctx.lineTo(29, 0); ctx.stroke(); ctx.fillStyle = palette[0]; ctx.beginPath(); ctx.arc(0, -47, 13, 0, TAU); ctx.fill(); ctx.fillStyle = "#202b2d"; ctx.beginPath(); ctx.arc(0, -53, 14, Math.PI, TAU); ctx.fill(); ctx.fillRect(-4, -64, 8, 11); if (id === "thirsty-disciple") { ctx.strokeStyle = "#d5c19a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(30, -5, 13, 5, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }
function drawSemanticProp(ctx, id, time) {
  ctx.save();
  const gesture = Math.sin(time * 2.2) * 3;
  if (id === "tea-keeper") {
    ctx.strokeStyle = "#dbc79f"; ctx.fillStyle = "rgba(88,58,42,.92)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(28, -9 + gesture, 12, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  } else if (id === "water-carrier") {
    ctx.strokeStyle = "#a88d65"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-42, -22); ctx.lineTo(42, -22); ctx.stroke(); ctx.fillStyle = "rgba(75,108,112,.9)"; ctx.fillRect(-47, -13, 24, 22); ctx.fillRect(23, -13, 24, 22); ctx.fillStyle = "rgba(133,198,203,.65)"; ctx.fillRect(-44, -10, 18, 5); ctx.fillRect(26, -10, 18, 5);
  } else if (id === "thirsty-disciple") {
    ctx.strokeStyle = "#d8c397"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(32, -6 + gesture * .4, 16, 7, 0, 0, TAU); ctx.stroke();
  } else if (id === "herbalist") {
    ctx.fillStyle = "#78916c"; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.ellipse(23 + i * 5, -7 - (i % 2) * 4, 7, 3, -.5, 0, TAU); ctx.fill(); }
  } else if (id === "gatekeeper") {
    ctx.strokeStyle = "rgba(225,210,175,.7)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(19, -23); ctx.lineTo(42 + gesture, -5); ctx.stroke();
  }
  ctx.restore();
}
function drawObject(ctx, x, y, id, time) {
  ctx.save(); ctx.translate(x, y);
  if (id === "lantern") {
    ctx.fillStyle = "#ffd27d"; ctx.shadowBlur = 22; ctx.shadowColor = "#ffd27d"; ctx.fillRect(-10, -40, 20, 33); ctx.shadowBlur = 0; ctx.strokeStyle = "#4a342d"; ctx.strokeRect(-15, -45, 30, 43);
  } else if (id === "tea-pot") {
    ctx.strokeStyle = "rgba(225,235,220,.55)"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) { const drift = (time * 14 + i * 11) % 32; ctx.globalAlpha = 1 - drift / 38; ctx.beginPath(); ctx.moveTo(-8 + i * 7, -20 - drift); ctx.bezierCurveTo(-16 + i * 6, -29 - drift, 4 + i * 6, -37 - drift, -2 + i * 7, -46 - drift); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#5b4438"; ctx.beginPath(); ctx.ellipse(0, -5, 20, 13, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "#9a795a"; ctx.beginPath(); ctx.arc(18, -5, 12, -1.2, 1.2); ctx.stroke();
  } else if (id === "well") {
    const lift = Math.sin(time * 1.2) * 3; ctx.strokeStyle = "rgba(202,183,146,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(0, -25 + lift); ctx.stroke(); ctx.fillStyle = "#6e756c"; ctx.fillRect(-13, -25 + lift, 26, 20); ctx.fillStyle = "rgba(95,168,174,.65)"; ctx.fillRect(-10, -21 + lift, 20, 5);
  } else if (id === "cat") {
    ctx.fillStyle = "#b9a58d"; ctx.beginPath(); ctx.ellipse(0, 4, 24, 13, 0, 0, TAU); ctx.arc(21, -7, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(17, -28); ctx.lineTo(23, -17); ctx.moveTo(25, -17); ctx.lineTo(31, -28); ctx.lineTo(32, -13); ctx.fill();
  }
  ctx.restore();
}
function drawFallbackPlayer(ctx, scale) { ctx.scale(scale, scale); ctx.fillStyle = "#27373b"; ctx.beginPath(); ctx.moveTo(-21, -72); ctx.lineTo(20, -72); ctx.lineTo(28, 5); ctx.lineTo(-28, 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#4b8b81"; ctx.fillRect(-20, -57, 40, 34); ctx.fillStyle = "#b75c4f"; ctx.fillRect(-22, -25, 44, 6); ctx.fillStyle = "#d2b184"; ctx.beginPath(); ctx.arc(0, -86, 13, 0, TAU); ctx.fill(); ctx.fillStyle = "#202a31"; ctx.beginPath(); ctx.arc(0, -92, 14, Math.PI, TAU); ctx.fill(); }
function drawFocusMarker(ctx, x, y, time) { const pulse = 1 + Math.sin(time * 4) * .08; ctx.save(); ctx.translate(x, y + 22); ctx.scale(pulse, pulse); ctx.strokeStyle = "rgba(238,194,117,.88)"; ctx.shadowColor = "#efbc68"; ctx.shadowBlur = 12; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 39, 12, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(0, 0, 50, 16, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
function drawMistBand(ctx, x, y, width, height, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = "#d7e2df"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + i * width * .32, y + Math.sin(i * 1.7) * 9, width, height * (1 + i * .08), 0, 0, TAU); ctx.fill(); } ctx.restore(); }
function seededMotes() { let seed = 17; const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646; return Array.from({ length: 90 }, () => ({ x: random() * WORLD.width, y: 80 + random() * (WORLD.height - 160), size: 1 + random() * 2.8, depth: random(), speed: .3 + random(), phase: random() * TAU, warm: random() > .55 })); }
