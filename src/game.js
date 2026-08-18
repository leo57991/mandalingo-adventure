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

  reset() { this.player = { x: 800, y: 770, vx: 0, vy: 0, facing: 1 }; this.nearby = null; this.location = LOCATIONS[0]; }
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
    this.player.x = clamp(this.player.x + this.player.vx * delta, 110, 1490);
    this.player.y = clamp(this.player.y + this.player.vy * delta, 120, 805);

    const nearest = ENTITIES.map(entity => ({ entity, distance: dist(this.player, entity) })).sort((a, b) => a.distance - b.distance)[0];
    const nextNearby = nearest?.distance < 92 ? nearest.entity : null;
    if (nextNearby?.id !== this.nearby?.id) { this.nearby = nextNearby; this.callbacks.onNearby?.(nextNearby); }

    const nextLocation = LOCATIONS.find(location => { const [left, top, right, bottom] = location.bounds; return this.player.x >= left && this.player.x <= right && this.player.y >= top && this.player.y <= bottom; }) ?? this.location;
    if (nextLocation.id !== this.location.id) { this.location = nextLocation; this.callbacks.onLocation?.(nextLocation); }
  }

  loop(now) { const delta = Math.min(.035, (now - this.lastTime) / 1000); this.lastTime = now; this.update(delta); this.draw(); requestAnimationFrame(time => this.loop(time)); }

  draw() {
    const ctx = this.ctx; ctx.clearRect(0, 0, WIDTH, HEIGHT); this.drawSky(ctx);
    if (this.state === "title") return;
    this.drawTown(ctx); this.drawEntities(ctx); this.drawPlayer(ctx);
  }

  drawSky(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT); sky.addColorStop(0, "#10172e"); sky.addColorStop(.55, "#334b59"); sky.addColorStop(1, "#172330"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.state === "title" && this.backgroundLoaded) { ctx.globalAlpha = .82; ctx.drawImage(this.background, 0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
    ctx.fillStyle = "rgba(10,22,34,.48)"; ctx.beginPath(); ctx.moveTo(0, 400); ctx.quadraticCurveTo(170, 170, 370, 400); ctx.quadraticCurveTo(580, 235, 770, 400); ctx.quadraticCurveTo(980, 150, 1190, 400); ctx.quadraticCurveTo(1380, 210, 1600, 400); ctx.lineTo(1600, 900); ctx.lineTo(0, 900); ctx.fill();
    for (const mote of this.motes) { ctx.globalAlpha = .12 + mote.depth * .3; ctx.fillStyle = mote.warm ? "#ffd798" : "#a7e3d4"; ctx.beginPath(); ctx.arc(mote.x, mote.y + Math.sin(this.time * mote.speed + mote.phase) * 15, mote.size, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }

  drawTown(ctx) {
    const road = ctx.createLinearGradient(0, 250, 0, 900); road.addColorStop(0, "#7d7767"); road.addColorStop(1, "#454a45"); ctx.fillStyle = road;
    ctx.beginPath(); ctx.moveTo(650, 200); ctx.lineTo(950, 200); ctx.lineTo(1330, 900); ctx.lineTo(270, 900); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(235,216,173,.12)"; ctx.lineWidth = 3;
    for (let y = 270; y < 900; y += 58) { const spread = (y - 180) * .62; ctx.beginPath(); ctx.moveTo(800 - spread, y); ctx.lineTo(800 + spread, y); ctx.stroke(); }
    for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(800 + i * 32, 210); ctx.lineTo(800 + i * 105, 900); ctx.stroke(); }
    drawBuilding(ctx, 245, 275, 370, 230, "藥", "#405d5b"); drawBuilding(ctx, 1170, 375, 390, 245, "茶", "#5c5845");
    drawBuilding(ctx, 1180, 155, 300, 185, "客", "#394e55"); drawBuilding(ctx, 210, 500, 300, 190, "雜", "#4a5548");
    drawGate(ctx, 800, 225, this.questResolved);
    drawTownGate(ctx, 800, 715);
    drawWell(ctx, 480, 485); drawTeaTable(ctx, 1105, 535);
    ctx.fillStyle = "rgba(201,226,212,.16)"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(120 + i * 285, 650 - (i % 2) * 80, 75, 22, 0, 0, TAU); ctx.fill(); }
  }

  drawEntities(ctx) {
    const entities = [...ENTITIES].sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      if (["well", "tea-pot", "gate-sign"].includes(entity.id)) { if (entity.id === "gate-sign") drawStone(ctx, entity.x, entity.y); continue; }
      if (entity.type === "npc") drawNpc(ctx, entity.x, entity.y, entity.id, this.time); else drawObject(ctx, entity.x, entity.y, entity.id, this.time);
      if (this.nearby?.id === entity.id) { ctx.strokeStyle = "rgba(255,215,142,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(entity.x, entity.y + 28, 45, 14, 0, 0, TAU); ctx.stroke(); }
    }
  }

  drawPlayer(ctx) {
    const p = this.player; const moving = Math.hypot(p.vx, p.vy) > 8; const bob = moving ? Math.sin(this.time * 11) * 3 : Math.sin(this.time * 2) * 1.5;
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(p.facing, 1);
    ctx.fillStyle = "rgba(5,10,18,.3)"; ctx.beginPath(); ctx.ellipse(0, 31, 28, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#b85f54"; ctx.beginPath(); ctx.moveTo(-20, -5); ctx.lineTo(21, -4); ctx.lineTo(16, 32); ctx.quadraticCurveTo(0, 39, -16, 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#3ba898"; ctx.beginPath(); ctx.moveTo(-18, -20); ctx.quadraticCurveTo(0, -31, 18, -20); ctx.lineTo(20, 8); ctx.quadraticCurveTo(0, 18, -20, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e7c295"; ctx.beginPath(); ctx.arc(0, -34, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = "#243443"; ctx.beginPath(); ctx.moveTo(-26, -39); ctx.quadraticCurveTo(0, -60, 27, -39); ctx.quadraticCurveTo(0, -27, -26, -39); ctx.fill();
    ctx.strokeStyle = "#d8b36c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(17, 3); ctx.lineTo(35, -33); ctx.stroke(); ctx.restore();
  }
}

function drawBuilding(ctx, x, y, width, height, sign, color) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(7,14,22,.25)"; ctx.fillRect(18, 28, width, height);
  ctx.fillStyle = color; ctx.fillRect(0, 30, width, height - 30); ctx.fillStyle = "#1d2d35";
  ctx.beginPath(); ctx.moveTo(-38, 45); ctx.quadraticCurveTo(width / 2, -42, width + 38, 45); ctx.lineTo(width + 15, 70); ctx.quadraticCurveTo(width / 2, 10, -15, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#dcae68"; ctx.globalAlpha = .62; for (let i = 0; i < 3; i++) ctx.fillRect(42 + i * (width - 84) / 2 - 16, height - 65, 32, 44); ctx.globalAlpha = 1;
  ctx.fillStyle = "#d8c18e"; ctx.fillRect(width / 2 - 18, 46, 36, 52); ctx.fillStyle = "#3b3130"; ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.fillText(sign, width / 2, 82); ctx.restore();
}
function drawGate(ctx, x, y, open) { ctx.save(); ctx.translate(x, y); ctx.strokeStyle = open ? "#8be4cd" : "#273a42"; ctx.shadowBlur = open ? 28 : 0; ctx.shadowColor = "#73dac2"; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(-105, 60); ctx.lineTo(-105, -28); ctx.lineTo(105, -28); ctx.lineTo(105, 60); ctx.stroke(); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-135, -25); ctx.lineTo(135, -25); ctx.stroke(); ctx.restore(); }
function drawTownGate(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#263841"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(-105, 58); ctx.lineTo(-105, -54); ctx.moveTo(105, 58); ctx.lineTo(105, -54); ctx.moveTo(-135, -48); ctx.lineTo(135, -48); ctx.stroke(); ctx.restore(); }
function drawWell(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#68736e"; ctx.beginPath(); ctx.ellipse(0, 15, 65, 28, 0, 0, TAU); ctx.fill(); ctx.fillRect(-65, -25, 130, 40); ctx.fillStyle = "#172932"; ctx.beginPath(); ctx.ellipse(0, -22, 50, 18, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "#9a7653"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-50, -15); ctx.lineTo(-50, -95); ctx.lineTo(50, -95); ctx.lineTo(50, -15); ctx.stroke(); ctx.restore(); }
function drawTeaTable(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#795f45"; ctx.fillRect(-52, -6, 104, 16); ctx.fillRect(-38, 10, 8, 35); ctx.fillRect(30, 10, 8, 35); ctx.fillStyle = "#c89962"; ctx.beginPath(); ctx.ellipse(0, -17, 20, 13, 0, 0, TAU); ctx.fill(); ctx.restore(); }
function drawStone(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#7b8077"; ctx.beginPath(); ctx.moveTo(-34, 32); ctx.lineTo(-27, -65); ctx.lineTo(28, -55); ctx.lineTo(38, 32); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#303c3b"; ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.fillText("霧隱鎮", 0, -12); ctx.restore(); }
function drawNpc(ctx, x, y, id, time) { const palette = id === "thirsty-disciple" ? ["#b5c8aa", "#55776d"] : id === "tea-keeper" ? ["#d59a71", "#754e50"] : ["#c5ad83", "#47666a"]; const bob = Math.sin(time * 1.8 + x) * 2; ctx.save(); ctx.translate(x, y + bob); ctx.fillStyle = "rgba(5,10,18,.28)"; ctx.beginPath(); ctx.ellipse(0, 28, 27, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = palette[1]; ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(20, -10); ctx.lineTo(27, 27); ctx.lineTo(-27, 27); ctx.closePath(); ctx.fill(); ctx.fillStyle = palette[0]; ctx.beginPath(); ctx.arc(0, -27, 15, 0, TAU); ctx.fill(); ctx.fillStyle = "#28343d"; ctx.beginPath(); ctx.arc(0, -34, 16, Math.PI, TAU); ctx.fill(); if (id === "thirsty-disciple") { ctx.strokeStyle = "#d7c5a6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(25, 5, 12, 5, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }
function drawObject(ctx, x, y, id, time) { ctx.save(); ctx.translate(x, y); if (id === "lantern") { ctx.fillStyle = "#ffd27d"; ctx.shadowBlur = 22; ctx.shadowColor = "#ffd27d"; ctx.fillRect(-10, -40, 20, 33); ctx.shadowBlur = 0; ctx.strokeStyle = "#4a342d"; ctx.strokeRect(-15, -45, 30, 43); } else if (id === "cat") { ctx.fillStyle = "#b9a58d"; ctx.beginPath(); ctx.ellipse(0, 4, 24, 13, 0, 0, TAU); ctx.arc(21, -7, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(17, -28); ctx.lineTo(23, -17); ctx.moveTo(25, -17); ctx.lineTo(31, -28); ctx.lineTo(32, -13); ctx.fill(); } ctx.restore(); }
function seededMotes() { let seed = 17; const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646; return Array.from({ length: 70 }, () => ({ x: random() * WIDTH, y: 80 + random() * 720, size: 1 + random() * 2.8, depth: random(), speed: .3 + random(), phase: random() * TAU, warm: random() > .55 })); }
