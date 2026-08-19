import { ENTITIES, LOCATIONS } from "./lessons.js";

const WIDTH = 1600, HEIGHT = 900, TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;

export class MandalingoGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.callbacks = callbacks;
    this.keys = new Set(); this.mobileVector = { x: 0, y: 0 }; this.time = 0; this.lastTime = performance.now();
    this.state = "title"; this.nearby = null; this.location = LOCATIONS[0]; this.questResolved = false;
    this.background = new Image(); this.background.src = "assets/mandalingo-key-art.png"; this.backgroundLoaded = false; this.background.onload = () => { this.backgroundLoaded = true; };
    this.townBackground = new Image(); this.townBackground.src = "assets/wuyin-town-wuxia-background.png"; this.townBackgroundLoaded = false; this.townBackground.onload = () => { this.townBackgroundLoaded = true; };
    this.playerSprite = new Image(); this.playerSprite.src = "assets/wuxia-traveller.png"; this.playerSpriteLoaded = false; this.playerSprite.onload = () => { this.playerSpriteLoaded = true; };
    this.motes = seededMotes(); this.attachInput(); this.reset(); requestAnimationFrame(time => this.loop(time));
  }

  attachInput() {
    window.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "e", "n"].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (key === "e" && !event.repeat && this.state === "playing") setTimeout(() => this.interact(), 0);
      if (key === "n" && !event.repeat) this.callbacks.onNotebook?.();
    });
    window.addEventListener("keyup", event => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("blur", () => this.keys.clear());
  }

  reset() { this.player = { x: 800, y: 810, vx: 0, vy: 0, facing: 1 }; this.nearby = null; this.location = LOCATIONS[0]; }
  start() { this.reset(); this.state = "playing"; this.callbacks.onLocation?.(this.location); this.callbacks.onNearby?.(null); }
  setPaused(paused) { if (paused && this.state === "playing") this.state = "modal"; else if (!paused && this.state === "modal") this.state = "playing"; }
  setMobileVector(x, y) { this.mobileVector = { x, y }; }
  setQuestResolved(value) { this.questResolved = value; }
  interact() { if (this.nearby) this.callbacks.onInteract?.(this.nearby); }

  update(delta) {
    this.time += delta; if (this.state !== "playing") return;
    let x = this.mobileVector.x + (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
    let y = this.mobileVector.y + (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0);
    const magnitude = Math.hypot(x, y); if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    if (Math.abs(x) > .05) this.player.facing = Math.sign(x);
    this.player.vx = lerp(this.player.vx, x * 245, 1 - Math.pow(.001, delta));
    this.player.vy = lerp(this.player.vy, y * 205, 1 - Math.pow(.001, delta));
    this.player.x = clamp(this.player.x + this.player.vx * delta, 90, 1510);
    this.player.y = clamp(this.player.y + this.player.vy * delta, 185, 825);

    const nearest = ENTITIES.map(entity => ({ entity, distance: dist(this.player, entity) })).sort((a, b) => a.distance - b.distance)[0];
    const nextNearby = nearest?.distance < 92 ? nearest.entity : null;
    if (nextNearby?.id !== this.nearby?.id) { this.nearby = nextNearby; this.callbacks.onNearby?.(nextNearby); }

    const nextLocation = LOCATIONS.find(location => { const [left, top, right, bottom] = location.bounds; return this.player.x >= left && this.player.x <= right && this.player.y >= top && this.player.y <= bottom; }) ?? this.location;
    if (nextLocation.id !== this.location.id) { this.location = nextLocation; this.callbacks.onLocation?.(nextLocation); }
  }

  loop(now) { const delta = Math.min(.035, (now - this.lastTime) / 1000); this.lastTime = now; this.update(delta); this.draw(); requestAnimationFrame(time => this.loop(time)); }

  draw() {
    const ctx = this.ctx; ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (this.state === "title") { this.drawTitle(ctx); return; }
    this.drawTown(ctx); this.drawEntities(ctx); this.drawPlayer(ctx); this.drawForegroundMist(ctx);
  }

  drawTitle(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#10172e"); sky.addColorStop(.55, "#334b59"); sky.addColorStop(1, "#172330"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.backgroundLoaded) { ctx.globalAlpha = .88; ctx.drawImage(this.background, 0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
    const veil = ctx.createLinearGradient(0, 0, 0, HEIGHT); veil.addColorStop(0, "rgba(3,8,22,.1)"); veil.addColorStop(.62, "rgba(5,12,25,.18)"); veil.addColorStop(1, "rgba(4,9,20,.72)"); ctx.fillStyle = veil; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (const mote of this.motes) { ctx.globalAlpha = .12 + mote.depth * .3; ctx.fillStyle = mote.warm ? "#ffd798" : "#a7e3d4"; ctx.beginPath(); ctx.arc(mote.x, mote.y + Math.sin(this.time * mote.speed + mote.phase) * 15, mote.size, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }

  drawTown(ctx) {
    if (this.townBackgroundLoaded) ctx.drawImage(this.townBackground, 0, 0, WIDTH, HEIGHT);
    else drawFallbackLandscape(ctx);

    const depthWash = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    depthWash.addColorStop(0, "rgba(4,12,22,.16)"); depthWash.addColorStop(.48, "rgba(9,19,27,.02)"); depthWash.addColorStop(1, "rgba(4,9,15,.22)");
    ctx.fillStyle = depthWash; ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawHangingSign(ctx, 448, 432, "藥"); drawHangingSign(ctx, 1198, 476, "茶");
    drawHangingSign(ctx, 1265, 267, "客"); drawHangingSign(ctx, 238, 610, "雜");
    drawStone(ctx, 800, 758);

    if (this.questResolved) {
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.strokeStyle = "rgba(126,224,196,.42)"; ctx.shadowColor = "#7ce0c4"; ctx.shadowBlur = 20; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(800, 735); ctx.bezierCurveTo(765, 625, 840, 520, 800, 385); ctx.stroke(); ctx.restore();
    }

    drawMistBand(ctx, -170 + (this.time * 13 % 1900), 315, 360, 22, .07);
    drawMistBand(ctx, 1580 - (this.time * 9 % 1900), 575, 470, 30, .08);
    for (const mote of this.motes.slice(0, 34)) { ctx.globalAlpha = .08 + mote.depth * .18; ctx.fillStyle = mote.warm ? "#ffd798" : "#dcece4"; ctx.beginPath(); ctx.arc(mote.x, mote.y + Math.sin(this.time * mote.speed + mote.phase) * 10, mote.size * .75, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }

  drawEntities(ctx) {
    const entities = [...ENTITIES].sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      if (["well", "tea-pot", "gate-sign"].includes(entity.id)) { if (this.nearby?.id === entity.id) drawFocusMarker(ctx, entity.x, entity.y, this.time); continue; }
      if (entity.type === "npc") drawNpc(ctx, entity.x, entity.y, entity.id, this.time); else drawObject(ctx, entity.x, entity.y, entity.id, this.time);
      if (this.nearby?.id === entity.id) drawFocusMarker(ctx, entity.x, entity.y, this.time);
    }
  }

  drawPlayer(ctx) {
    const p = this.player; const moving = Math.hypot(p.vx, p.vy) > 8; const bob = moving ? Math.sin(this.time * 11) * 3 : Math.sin(this.time * 2) * 1.5;
    const scale = .62 + p.y / 1500;
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(p.facing, 1);
    ctx.fillStyle = "rgba(2,7,12,.42)"; ctx.filter = "blur(2px)"; ctx.beginPath(); ctx.ellipse(0, 7, 34 * scale, 10 * scale, 0, 0, TAU); ctx.fill(); ctx.filter = "none";
    if (this.playerSpriteLoaded) {
      const height = 132 * scale, width = height * (this.playerSprite.width / this.playerSprite.height);
      ctx.drawImage(this.playerSprite, -width / 2, -height + 11, width, height);
    } else drawFallbackPlayer(ctx, scale);
    ctx.restore();
  }

  drawForegroundMist(ctx) {
    ctx.save(); const mist = ctx.createLinearGradient(0, 710, 0, HEIGHT); mist.addColorStop(0, "rgba(199,216,215,0)"); mist.addColorStop(1, "rgba(174,194,197,.11)"); ctx.fillStyle = mist; ctx.fillRect(0, 660, WIDTH, 240);
    drawMistBand(ctx, -100 + (this.time * 18 % 1800), 820, 520, 38, .085); ctx.restore();
  }
}

function drawFallbackLandscape(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#17273a"); sky.addColorStop(.55, "#36505a"); sky.addColorStop(1, "#18252a"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(7,18,25,.72)"; ctx.beginPath(); ctx.moveTo(0, 440); ctx.quadraticCurveTo(180, 160, 380, 440); ctx.quadraticCurveTo(620, 210, 820, 440); ctx.quadraticCurveTo(1060, 130, 1260, 440); ctx.quadraticCurveTo(1440, 230, 1600, 440); ctx.lineTo(1600, HEIGHT); ctx.lineTo(0, HEIGHT); ctx.fill();
  const road = ctx.createLinearGradient(0, 300, 0, HEIGHT); road.addColorStop(0, "#626d69"); road.addColorStop(1, "#303c3c"); ctx.fillStyle = road; ctx.beginPath(); ctx.moveTo(715, 350); ctx.lineTo(885, 350); ctx.lineTo(1260, 900); ctx.lineTo(300, 900); ctx.closePath(); ctx.fill();
}
function drawHangingSign(ctx, x, y, text) { ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 8; ctx.fillStyle = "rgba(35,29,24,.9)"; ctx.fillRect(-19, -34, 38, 54); ctx.strokeStyle = "rgba(213,166,91,.72)"; ctx.lineWidth = 2; ctx.strokeRect(-16, -31, 32, 48); ctx.fillStyle = "#e2c890"; ctx.font = "25px 'Noto Sans TC',serif"; ctx.textAlign = "center"; ctx.fillText(text, 0, 2); ctx.restore(); }
function drawStone(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12; ctx.fillStyle = "#69716b"; ctx.beginPath(); ctx.moveTo(-36, 34); ctx.lineTo(-30, -66); ctx.quadraticCurveTo(0, -84, 31, -61); ctx.lineTo(39, 34); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(218,222,205,.28)"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#252f2d"; ctx.font = "22px 'Noto Sans TC',serif"; ctx.textAlign = "center"; ctx.fillText("霧隱鎮", 0, -14); ctx.restore(); }
function drawNpc(ctx, x, y, id, time) { const palette = id === "thirsty-disciple" ? ["#c4c9ae", "#536b63", "#8f5748"] : id === "tea-keeper" ? ["#c99a76", "#714849", "#b18154"] : id === "herbalist" ? ["#b7ac82", "#405b53", "#82704e"] : ["#c4aa82", "#435e62", "#8a5d45"]; const bob = Math.sin(time * 1.8 + x) * 1.5; const scale = .58 + y / 1500; ctx.save(); ctx.translate(x, y + bob); ctx.scale(scale, scale); ctx.fillStyle = "rgba(2,7,12,.38)"; ctx.beginPath(); ctx.ellipse(0, 18, 28, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = palette[1]; ctx.beginPath(); ctx.moveTo(-18, -27); ctx.quadraticCurveTo(0, -38, 18, -27); ctx.lineTo(29, 17); ctx.quadraticCurveTo(0, 28, -29, 17); ctx.closePath(); ctx.fill(); ctx.fillStyle = palette[2]; ctx.fillRect(-21, -4, 42, 6); ctx.strokeStyle = "rgba(225,217,187,.42)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(-27, 1); ctx.moveTo(15, -20); ctx.lineTo(29, 0); ctx.stroke(); ctx.fillStyle = palette[0]; ctx.beginPath(); ctx.arc(0, -47, 13, 0, TAU); ctx.fill(); ctx.fillStyle = "#202b2d"; ctx.beginPath(); ctx.arc(0, -53, 14, Math.PI, TAU); ctx.fill(); ctx.fillRect(-4, -64, 8, 11); if (id === "thirsty-disciple") { ctx.strokeStyle = "#d5c19a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(30, -5, 13, 5, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }
function drawObject(ctx, x, y, id, time) { ctx.save(); ctx.translate(x, y); if (id === "lantern") { ctx.fillStyle = "#ffd27d"; ctx.shadowBlur = 22; ctx.shadowColor = "#ffd27d"; ctx.fillRect(-10, -40, 20, 33); ctx.shadowBlur = 0; ctx.strokeStyle = "#4a342d"; ctx.strokeRect(-15, -45, 30, 43); } else if (id === "cat") { ctx.fillStyle = "#b9a58d"; ctx.beginPath(); ctx.ellipse(0, 4, 24, 13, 0, 0, TAU); ctx.arc(21, -7, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(17, -28); ctx.lineTo(23, -17); ctx.moveTo(25, -17); ctx.lineTo(31, -28); ctx.lineTo(32, -13); ctx.fill(); } ctx.restore(); }
function drawFallbackPlayer(ctx, scale) { ctx.scale(scale, scale); ctx.fillStyle = "#27373b"; ctx.beginPath(); ctx.moveTo(-21, -72); ctx.lineTo(20, -72); ctx.lineTo(28, 5); ctx.lineTo(-28, 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#4b8b81"; ctx.fillRect(-20, -57, 40, 34); ctx.fillStyle = "#b75c4f"; ctx.fillRect(-22, -25, 44, 6); ctx.fillStyle = "#d2b184"; ctx.beginPath(); ctx.arc(0, -86, 13, 0, TAU); ctx.fill(); ctx.fillStyle = "#202a31"; ctx.beginPath(); ctx.arc(0, -92, 14, Math.PI, TAU); ctx.fill(); }
function drawFocusMarker(ctx, x, y, time) { const pulse = 1 + Math.sin(time * 4) * .08; ctx.save(); ctx.translate(x, y + 22); ctx.scale(pulse, pulse); ctx.strokeStyle = "rgba(238,194,117,.88)"; ctx.shadowColor = "#efbc68"; ctx.shadowBlur = 12; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 39, 12, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(0, 0, 50, 16, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
function drawMistBand(ctx, x, y, width, height, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = "#d7e2df"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + i * width * .32, y + Math.sin(i * 1.7) * 9, width, height * (1 + i * .08), 0, 0, TAU); ctx.fill(); } ctx.restore(); }
function seededMotes() { let seed = 17; const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646; return Array.from({ length: 70 }, () => ({ x: random() * WIDTH, y: 80 + random() * 720, size: 1 + random() * 2.8, depth: random(), speed: .3 + random(), phase: random() * TAU, warm: random() > .55 })); }
