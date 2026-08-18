const WIDTH = 1600;
const HEIGHT = 900;
const TAU = Math.PI * 2;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function lerp(a, b, t) { return a + (b - a) * t; }

export class MandalingoGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.keys = new Set();
    this.mobileVector = { x: 0, y: 0 };
    this.background = new Image();
    this.background.src = "assets/mandalingo-key-art.png";
    this.backgroundLoaded = false;
    this.background.onload = () => { this.backgroundLoaded = true; };
    this.lastTime = performance.now();
    this.time = 0;
    this.state = "title";
    this.particles = [];
    this.decorations = this.createDecorations();
    this.attachInput();
    this.reset();
    requestAnimationFrame(time => this.loop(time));
  }

  attachInput() {
    window.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (key === " " && this.state === "playing") this.dash();
    });
    window.addEventListener("keyup", event => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("blur", () => this.keys.clear());
  }

  createDecorations() {
    const random = seededRandom(42);
    return Array.from({ length: 85 }, () => ({
      x: random() * WIDTH,
      y: 80 + random() * 720,
      size: 1 + random() * 3,
      depth: random(),
      phase: random() * TAU
    }));
  }

  reset() {
    this.player = { x: 800, y: 720, vx: 0, vy: 0, radius: 25, dash: 0, dashCooldown: 0, invulnerable: 0, facing: 1 };
    const positions = [
      [470, 640], [1110, 660], [360, 390], [1210, 350], [790, 320]
    ];
    this.spirits = positions.map(([x, y], index) => ({ x, y, index, collected: false, cooldown: 0, phase: index * 1.1 }));
    this.enemies = [
      { x: 660, y: 500, homeX: 660, homeY: 500, phase: 0 },
      { x: 1000, y: 465, homeX: 1000, homeY: 465, phase: 2 },
      { x: 830, y: 590, homeX: 830, homeY: 590, phase: 4 }
    ];
    this.gate = { x: 800, y: 145, active: false };
    this.hearts = 3;
    this.collected = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.attempts = 0;
    this.correctAnswers = 0;
    this.activeSpirit = null;
    this.particles.length = 0;
    this.callbacks.onStats?.(this.getStats());
  }

  start() {
    this.reset();
    this.state = "playing";
    this.callbacks.onObjective?.("尋回散落的字靈");
  }

  setPaused(paused) {
    if (paused && this.state === "playing") this.state = "quiz";
    if (!paused && this.state === "quiz") this.state = "playing";
  }

  setMobileVector(x, y) { this.mobileVector.x = x; this.mobileVector.y = y; }

  dash() {
    if (this.player.dashCooldown > 0 || this.state !== "playing") return false;
    this.player.dash = 0.19;
    this.player.dashCooldown = 1.1;
    this.callbacks.onDash?.();
    this.burst(this.player.x, this.player.y + 10, "#77ead4", 9, 170);
    return true;
  }

  answer(correct) {
    if (!this.activeSpirit) return;
    const spirit = this.activeSpirit;
    this.attempts += 1;
    if (correct) {
      spirit.collected = true;
      this.collected += 1;
      this.correctAnswers += 1;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.score += 100 + (this.streak - 1) * 30;
      this.burst(spirit.x, spirit.y, spiritColor(spirit.index), 34, 260);
      if (this.collected === this.spirits.length) {
        this.gate.active = true;
        this.callbacks.onObjective?.("前往月門，喚醒字境");
      }
    } else {
      this.streak = 0;
      this.hearts -= 1;
      spirit.cooldown = 2;
      this.player.invulnerable = 1.5;
      const angle = Math.atan2(this.player.y - spirit.y, this.player.x - spirit.x);
      this.player.x += Math.cos(angle) * 95;
      this.player.y += Math.sin(angle) * 95;
    }
    this.activeSpirit = null;
    this.callbacks.onStats?.(this.getStats());
    if (this.hearts <= 0) this.lose();
  }

  getStats() {
    return {
      hearts: this.hearts,
      collected: this.collected,
      total: this.spirits.length,
      score: this.score,
      streak: this.streak,
      bestStreak: this.bestStreak,
      attempts: this.attempts,
      correctAnswers: this.correctAnswers
    };
  }

  lose() {
    this.state = "lost";
    this.callbacks.onEnd?.(false, this.getStats());
  }

  win() {
    if (this.state !== "playing") return;
    this.state = "won";
    this.score += this.hearts * 250;
    this.callbacks.onStats?.(this.getStats());
    this.callbacks.onEnd?.(true, this.getStats());
  }

  update(delta) {
    this.time += delta;
    this.updateParticles(delta);
    for (const spirit of this.spirits) spirit.cooldown = Math.max(0, spirit.cooldown - delta);
    if (this.state !== "playing") return;

    const player = this.player;
    player.dash -= delta;
    player.dashCooldown = Math.max(0, player.dashCooldown - delta);
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    let x = this.mobileVector.x + (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
    let y = this.mobileVector.y + (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 0.05) {
      x /= Math.max(1, magnitude);
      y /= Math.max(1, magnitude);
      player.facing = x === 0 ? player.facing : Math.sign(x);
    }
    const speed = player.dash > 0 ? 750 : 275;
    player.vx = lerp(player.vx, x * speed, 1 - Math.pow(0.001, delta));
    player.vy = lerp(player.vy, y * speed, 1 - Math.pow(0.001, delta));
    player.x = clamp(player.x + player.vx * delta, 210, 1390);
    player.y = clamp(player.y + player.vy * delta, 120, 790);

    for (const enemy of this.enemies) this.updateEnemy(enemy, delta);

    for (const spirit of this.spirits) {
      if (!spirit.collected && spirit.cooldown <= 0 && distance(player, spirit) < 70) {
        this.activeSpirit = spirit;
        this.state = "quiz";
        this.callbacks.onQuiz?.(spirit.index);
        break;
      }
    }

    if (this.gate.active && distance(player, this.gate) < 92) this.win();
    if (Math.random() < delta * 6) this.particles.push({ x: player.x - player.facing * 14, y: player.y + 28, vx: -player.vx * .1, vy: -25, life: .5, maxLife: .5, color: "#6ee8d0", size: 3 });
  }

  updateEnemy(enemy, delta) {
    const player = this.player;
    const d = distance(enemy, player);
    if (d < 300) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angle) * 72 * delta;
      enemy.y += Math.sin(angle) * 72 * delta;
    } else {
      enemy.x = lerp(enemy.x, enemy.homeX + Math.cos(this.time + enemy.phase) * 65, delta * .55);
      enemy.y = lerp(enemy.y, enemy.homeY + Math.sin(this.time * .8 + enemy.phase) * 45, delta * .55);
    }
    if (d < 48 && player.invulnerable <= 0 && player.dash <= 0) {
      this.hearts -= 1;
      this.streak = 0;
      player.invulnerable = 1.7;
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      player.x = clamp(player.x + Math.cos(angle) * 80, 210, 1390);
      player.y = clamp(player.y + Math.sin(angle) * 80, 120, 790);
      this.burst(player.x, player.y, "#ff806f", 18, 180);
      this.callbacks.onHit?.();
      this.callbacks.onStats?.(this.getStats());
      if (this.hearts <= 0) this.lose();
    }
  }

  burst(x, y, color, amount, speed) {
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * TAU;
      const velocity = speed * (.25 + Math.random() * .75);
      this.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: .6 + Math.random() * .8, maxLife: 1.4, color, size: 2 + Math.random() * 5 });
    }
  }

  updateParticles(delta) {
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= .98;
      particle.vy = particle.vy * .98 + 22 * delta;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  loop(now) {
    const delta = Math.min(.035, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(delta);
    this.draw();
    requestAnimationFrame(time => this.loop(time));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.drawBackdrop(ctx);
    if (this.state !== "title") this.drawWorld(ctx);
    else this.drawTitleAtmosphere(ctx);
  }

  drawBackdrop(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#121b3f");
    gradient.addColorStop(.5, "#203452");
    gradient.addColorStop(1, "#10172f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.backgroundLoaded) {
      const imageRatio = this.background.width / this.background.height;
      const canvasRatio = WIDTH / HEIGHT;
      let w, h, x, y;
      if (imageRatio > canvasRatio) { h = HEIGHT; w = h * imageRatio; x = (WIDTH - w) / 2; y = 0; }
      else { w = WIDTH; h = w / imageRatio; x = 0; y = (HEIGHT - h) / 2; }
      ctx.globalAlpha = this.state === "title" ? .9 : .28;
      ctx.drawImage(this.background, x, y, w, h);
      ctx.globalAlpha = 1;
    }
    const haze = ctx.createLinearGradient(0, 400, 0, 900);
    haze.addColorStop(0, "rgba(20,34,63,0)");
    haze.addColorStop(1, "rgba(7,12,33,.92)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 360, WIDTH, 540);
  }

  drawTitleAtmosphere(ctx) {
    for (const star of this.decorations) {
      const pulse = .35 + Math.sin(this.time * (.4 + star.depth) + star.phase) * .22;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = star.depth > .55 ? "#ffd995" : "#72dfcf";
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size * .55, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawWorld(ctx) {
    this.drawDistantMountains(ctx);
    for (const star of this.decorations) {
      const y = star.y + Math.sin(this.time * (.4 + star.depth) + star.phase) * 13;
      ctx.globalAlpha = .13 + star.depth * .24;
      ctx.fillStyle = star.depth > .6 ? "#ffdb93" : "#6ae4cf";
      ctx.beginPath(); ctx.arc(star.x, y, star.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.drawPaths(ctx);
    this.drawGate(ctx, this.gate);
    for (const spirit of this.spirits) if (!spirit.collected) this.drawSpirit(ctx, spirit);
    for (const enemy of this.enemies) this.drawEnemy(ctx, enemy);
    this.drawPlayer(ctx, this.player);
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawDistantMountains(ctx) {
    ctx.fillStyle = "rgba(8,20,40,.42)";
    ctx.beginPath(); ctx.moveTo(0, 420); ctx.quadraticCurveTo(180, 185, 360, 420); ctx.quadraticCurveTo(510, 240, 700, 420); ctx.quadraticCurveTo(910, 160, 1100, 420); ctx.quadraticCurveTo(1320, 210, 1600, 420); ctx.lineTo(1600, 900); ctx.lineTo(0, 900); ctx.fill();
  }

  drawPaths(ctx) {
    const islands = [
      [800, 705, 570, 132], [800, 530, 455, 100], [800, 350, 530, 93], [800, 180, 260, 66],
      [380, 450, 210, 72], [1210, 450, 210, 72]
    ];
    for (const [x, y, rx, ry] of islands) {
      ctx.fillStyle = "rgba(23,45,61,.75)";
      ctx.beginPath(); ctx.ellipse(x, y + 18, rx, ry, 0, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
      g.addColorStop(0, "rgba(108,155,125,.74)"); g.addColorStop(.16, "rgba(55,94,86,.9)"); g.addColorStop(1, "rgba(24,49,58,.94)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(166,221,174,.16)"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,225,169,.12)"; ctx.lineWidth = 20; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(800, 690); ctx.bezierCurveTo(650, 610, 980, 550, 800, 505); ctx.bezierCurveTo(610, 450, 1010, 390, 800, 330); ctx.lineTo(800, 205); ctx.stroke();
    for (let i = 0; i < 11; i += 1) {
      const x = 245 + i * 112 + Math.sin(i * 3.2) * 12;
      const y = 750 - (i % 3) * 12;
      ctx.fillStyle = i % 2 ? "rgba(255,209,140,.13)" : "rgba(99,230,207,.1)";
      ctx.beginPath(); ctx.ellipse(x, y, 42, 13, -.18, 0, TAU); ctx.fill();
    }
  }

  drawSpirit(ctx, spirit) {
    const y = spirit.y + Math.sin(this.time * 2.2 + spirit.phase) * 10;
    const color = spiritColor(spirit.index);
    ctx.save(); ctx.translate(spirit.x, y);
    ctx.shadowBlur = 34; ctx.shadowColor = color; ctx.fillStyle = color;
    ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(0, 0, 43 + Math.sin(this.time * 2) * 5, 0, TAU); ctx.fill();
    ctx.globalAlpha = .95; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(0, -29); ctx.quadraticCurveTo(28, -13, 18, 19); ctx.quadraticCurveTo(0, 37, -18, 19); ctx.quadraticCurveTo(-28, -13, 0, -29); ctx.fill();
    ctx.fillStyle = "#15233b"; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(-7, -4, 3, 0, TAU); ctx.arc(7, -4, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 4, 8, .25, Math.PI - .25); ctx.stroke();
    ctx.restore();
  }

  drawEnemy(ctx, enemy) {
    const bob = Math.sin(this.time * 2 + enemy.phase) * 7;
    ctx.save(); ctx.translate(enemy.x, enemy.y + bob);
    ctx.fillStyle = "rgba(4,7,17,.78)"; ctx.shadowBlur = 20; ctx.shadowColor = "rgba(5,5,15,.7)";
    ctx.beginPath();
    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * TAU;
      const radius = 27 + Math.sin(angle * 5 + this.time * 3 + enemy.phase) * 5;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffb086"; ctx.shadowBlur = 8; ctx.shadowColor = "#ff806f";
    ctx.beginPath(); ctx.ellipse(-8, -3, 3, 6, -.2, 0, TAU); ctx.ellipse(8, -3, 3, 6, .2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawPlayer(ctx, player) {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;
    const moving = Math.hypot(player.vx, player.vy) > 15;
    const bob = moving ? Math.sin(this.time * 12) * 4 : Math.sin(this.time * 2) * 2;
    ctx.save(); ctx.translate(player.x, player.y + bob); ctx.scale(player.facing, 1);
    ctx.fillStyle = "rgba(3,8,20,.28)"; ctx.beginPath(); ctx.ellipse(0, 31, 30, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#ffd27d"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(14, 5); ctx.lineTo(37, -31); ctx.stroke();
    ctx.fillStyle = "#fff1cd"; ctx.beginPath(); ctx.arc(39, -34, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ef725f"; ctx.beginPath(); ctx.moveTo(-22, 5); ctx.quadraticCurveTo(0, -13, 22, 5); ctx.lineTo(18, 31); ctx.quadraticCurveTo(0, 42, -18, 31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#3ccab4"; ctx.beginPath(); ctx.moveTo(-18, -9); ctx.quadraticCurveTo(0, -24, 18, -9); ctx.lineTo(21, 10); ctx.quadraticCurveTo(0, 21, -21, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f3cfa2"; ctx.beginPath(); ctx.arc(0, -28, 18, 0, TAU); ctx.fill();
    ctx.fillStyle = "#16213b"; ctx.beginPath(); ctx.arc(-6, -30, 2.2, 0, TAU); ctx.arc(6, -30, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = "#263b59"; ctx.beginPath(); ctx.moveTo(-29, -34); ctx.quadraticCurveTo(0, -58, 30, -34); ctx.quadraticCurveTo(0, -21, -29, -34); ctx.fill();
    ctx.fillStyle = "#ffd27d"; ctx.fillRect(-1.5, -56, 3, 18);
    ctx.restore();
  }

  drawGate(ctx, gate) {
    const active = gate.active;
    ctx.save(); ctx.translate(gate.x, gate.y);
    const glow = .55 + Math.sin(this.time * 2) * .15;
    ctx.shadowBlur = active ? 55 : 12; ctx.shadowColor = active ? "#73ead3" : "rgba(255,255,255,.15)";
    ctx.strokeStyle = active ? `rgba(115,234,211,${glow})` : "rgba(184,198,188,.25)"; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(0, 34, 66, Math.PI, 0); ctx.lineTo(66, 78); ctx.moveTo(-66, 78); ctx.lineTo(-66, 34); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = active ? "#ffd27d" : "rgba(255,255,255,.18)";
    ctx.beginPath(); ctx.arc(0, 34, 48, Math.PI, 0); ctx.lineTo(48, 78); ctx.moveTo(-48, 78); ctx.lineTo(-48, 34); ctx.stroke();
    if (active) {
      const portal = ctx.createRadialGradient(0, 36, 1, 0, 36, 48); portal.addColorStop(0, "rgba(255,245,196,.78)"); portal.addColorStop(.45, "rgba(89,224,200,.35)"); portal.addColorStop(1, "rgba(89,224,200,0)"); ctx.fillStyle = portal; ctx.beginPath(); ctx.arc(0, 36, 49, Math.PI, 0); ctx.lineTo(49, 79); ctx.lineTo(-49, 79); ctx.fill();
    }
    ctx.restore();
  }
}

function spiritColor(index) { return ["#ffd27d", "#6ee7cc", "#79bdf5", "#ff806f", "#c7b4ff"][index % 5]; }

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
}
