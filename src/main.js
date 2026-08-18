import { MandalingoGame } from "./game.js";
import { Soundscape } from "./audio.js";
import { QUIZ_KINDS, buildQuiz, getAccuracy } from "./lessons.js";

const $ = selector => document.querySelector(selector);
const elements = {
  title: $("#title-screen"), how: $("#how-screen"), hud: $("#hud"), quiz: $("#quiz-panel"), end: $("#end-screen"),
  mobile: $("#mobile-controls"), hearts: $("#hearts"), shardCount: $("#shard-count"), objective: $("#objective-text"),
  streak: $("#streak"), toast: $("#toast"), quizType: $("#quiz-type"), quizProgress: $("#quiz-progress"),
  quizHanzi: $("#quiz-hanzi"), quizHint: $("#quiz-hint"), quizPrompt: $("#quiz-prompt"), answers: $("#answers"),
  endSeal: $("#end-seal"), endKicker: $("#end-kicker"), endTitle: $("#end-title"), endCopy: $("#end-copy"),
  finalScore: $("#final-score"), finalStreak: $("#final-streak"), finalAccuracy: $("#final-accuracy"), sound: $("#sound-btn")
};

const sound = new Soundscape();
let currentQuiz = null;
let quizLocked = false;
let toastTimer = null;

const game = new MandalingoGame($("#game"), {
  onQuiz: showQuiz,
  onStats: updateStats,
  onObjective: text => { elements.objective.textContent = text; },
  onDash: () => sound.dash(),
  onHit: () => { sound.wrong(); showToast("墨影碰到了你！用靈步閃避"); },
  onEnd: showEnd
});

function startGame() {
  sound.start();
  elements.title.classList.remove("is-visible");
  elements.end.classList.remove("is-visible");
  elements.end.setAttribute("aria-hidden", "true");
  elements.hud.classList.add("is-visible");
  elements.hud.setAttribute("aria-hidden", "false");
  elements.mobile.classList.add("is-visible");
  elements.mobile.setAttribute("aria-hidden", "false");
  game.start();
  showToast("靠近發光的字靈，接受試煉");
}

function showQuiz(index) {
  currentQuiz = buildQuiz(index, QUIZ_KINDS[index]);
  quizLocked = false;
  elements.quizType.textContent = currentQuiz.label;
  elements.quizProgress.textContent = `${String(game.collected + 1).padStart(2, "0")} / 05`;
  elements.quizHanzi.textContent = currentQuiz.word.hanzi;
  elements.quizHanzi.style.color = currentQuiz.word.color;
  elements.quizHint.textContent = currentQuiz.kind === "tone" ? currentQuiz.word.pinyin : `${currentQuiz.word.pinyin} · ${currentQuiz.word.tone}`;
  elements.quizPrompt.textContent = currentQuiz.prompt;
  elements.answers.replaceChildren(...currentQuiz.answers.map((answer, answerIndex) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.innerHTML = `<i>${answerIndex + 1}</i><span>${answer}</span>`;
    button.addEventListener("click", () => submitAnswer(button, answer));
    return button;
  }));
  elements.quiz.classList.add("is-visible");
  elements.quiz.setAttribute("aria-hidden", "false");
  elements.mobile.classList.remove("is-visible");
  setTimeout(() => elements.answers.querySelector("button")?.focus(), 350);
}

function submitAnswer(button, answer) {
  if (!currentQuiz || quizLocked) return;
  quizLocked = true;
  const correct = answer === currentQuiz.correct;
  for (const answerButton of elements.answers.children) {
    answerButton.disabled = true;
    const value = answerButton.querySelector("span").textContent;
    if (value === currentQuiz.correct) answerButton.classList.add("correct");
  }
  if (!correct) button.classList.add("wrong");
  if (correct) sound.collect(); else sound.wrong();
  setTimeout(() => {
    elements.quiz.classList.remove("is-visible");
    elements.quiz.setAttribute("aria-hidden", "true");
    game.answer(correct);
    if (game.state !== "lost") {
      game.setPaused(false);
      elements.mobile.classList.add("is-visible");
      if (correct) showToast(game.collected === 5 ? "五枚字靈齊聚！前往北方月門" : `「${currentQuiz.word.hanzi}」已回歸字境`);
      else showToast(`正解是「${currentQuiz.correct}」，再靠近一次試試看`);
    }
    currentQuiz = null;
  }, correct ? 650 : 1050);
}

function speakCurrentWord() {
  if (!currentQuiz || !("speechSynthesis" in window)) {
    showToast("此瀏覽器不支援語音播放");
    return;
  }
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(currentQuiz.word.hanzi);
  speech.lang = "zh-TW";
  speech.rate = .72;
  window.speechSynthesis.speak(speech);
}

function updateStats(stats) {
  elements.hearts.replaceChildren(...Array.from({ length: 3 }, (_, index) => {
    const heart = document.createElement("span");
    heart.className = `heart${index >= stats.hearts ? " lost" : ""}`;
    return heart;
  }));
  elements.shardCount.textContent = stats.collected;
  if (stats.streak >= 2) {
    elements.streak.classList.add("is-visible");
    elements.streak.querySelector("b").textContent = `×${stats.streak}`;
  } else elements.streak.classList.remove("is-visible");
}

function showEnd(won, stats) {
  elements.quiz.classList.remove("is-visible");
  elements.hud.classList.remove("is-visible");
  elements.mobile.classList.remove("is-visible");
  elements.streak.classList.remove("is-visible");
  elements.endSeal.textContent = won ? "醒" : "歸";
  elements.endKicker.textContent = won ? "月門已甦醒" : "墨霧暫時籠罩字境";
  elements.endTitle.textContent = won ? "字境重獲聲音" : "行者，別忘記呼吸";
  elements.endCopy.textContent = won ? "你的聲音穿過群山，讓每個漢字再次發光。" : "每次嘗試都會留下筆跡。整裝後，再走一次。";
  elements.finalScore.textContent = stats.score.toLocaleString("zh-TW");
  elements.finalStreak.textContent = stats.bestStreak;
  elements.finalAccuracy.textContent = `${getAccuracy(stats.correctAnswers, stats.attempts)}%`;
  elements.end.classList.add("is-visible");
  elements.end.setAttribute("aria-hidden", "false");
  if (won) sound.win();
  const best = Math.max(Number(localStorage.getItem("mandalingo-best") || 0), stats.score);
  localStorage.setItem("mandalingo-best", String(best));
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

$("#start-btn").addEventListener("click", startGame);
$("#restart-btn").addEventListener("click", startGame);
$("#how-btn").addEventListener("click", () => { elements.how.classList.add("is-visible"); elements.how.setAttribute("aria-hidden", "false"); });
$("[data-close='how-screen']").addEventListener("click", () => { elements.how.classList.remove("is-visible"); elements.how.setAttribute("aria-hidden", "true"); });
$("#speak-btn").addEventListener("click", speakCurrentWord);
$("#sound-btn").addEventListener("click", () => {
  const muted = sound.toggle();
  elements.sound.textContent = muted ? "×" : "♫";
  elements.sound.setAttribute("aria-label", muted ? "開啟聲音" : "關閉聲音");
});

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (key === "enter" && game.state === "title") startGame();
  if (key === "r" && ["won", "lost"].includes(game.state)) startGame();
  if (game.state === "quiz" && /^[1-4]$/.test(key)) elements.answers.children[Number(key) - 1]?.click();
  if (key === "escape" && elements.how.classList.contains("is-visible")) $("[data-close='how-screen']").click();
});

setupJoystick();
function setupJoystick() {
  const base = $("#joystick");
  const knob = $("#joystick-knob");
  let pointerId = null;
  const update = event => {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let x = event.clientX - centerX, y = event.clientY - centerY;
    const max = rect.width * .29;
    const length = Math.hypot(x, y);
    if (length > max) { x = x / length * max; y = y / length * max; }
    knob.style.transform = `translate(${x}px, ${y}px)`;
    game.setMobileVector(x / max, y / max);
  };
  base.addEventListener("pointerdown", event => { pointerId = event.pointerId; base.setPointerCapture(pointerId); update(event); });
  base.addEventListener("pointermove", event => { if (event.pointerId === pointerId) update(event); });
  const release = event => { if (event.pointerId !== pointerId) return; pointerId = null; knob.style.transform = "translate(0,0)"; game.setMobileVector(0, 0); };
  base.addEventListener("pointerup", release); base.addEventListener("pointercancel", release);
  $("#dash-btn").addEventListener("pointerdown", event => { event.preventDefault(); game.dash(); });
}

window.__mandalingo = game;
