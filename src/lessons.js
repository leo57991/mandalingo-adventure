export const WORDS = [
  { hanzi: "月", pinyin: "yuè", tone: "第四聲", meaning: "月亮", color: "#ffd27d" },
  { hanzi: "山", pinyin: "shān", tone: "第一聲", meaning: "山", color: "#73dfc5" },
  { hanzi: "水", pinyin: "shuǐ", tone: "第三聲", meaning: "水", color: "#78bdf7" },
  { hanzi: "火", pinyin: "huǒ", tone: "第三聲", meaning: "火", color: "#ff806f" },
  { hanzi: "風", pinyin: "fēng", tone: "第一聲", meaning: "風", color: "#b2e9dc" },
  { hanzi: "人", pinyin: "rén", tone: "第二聲", meaning: "人", color: "#ffe5a6" },
  { hanzi: "雨", pinyin: "yǔ", tone: "第三聲", meaning: "雨", color: "#a4baf5" },
  { hanzi: "星", pinyin: "xīng", tone: "第一聲", meaning: "星星", color: "#f9cf82" },
  { hanzi: "花", pinyin: "huā", tone: "第一聲", meaning: "花", color: "#ff9ab2" },
  { hanzi: "雲", pinyin: "yún", tone: "第二聲", meaning: "雲", color: "#8fe5c9" },
  { hanzi: "夢", pinyin: "mèng", tone: "第四聲", meaning: "夢", color: "#cbb3ff" },
  { hanzi: "心", pinyin: "xīn", tone: "第一聲", meaning: "心", color: "#ff9388" }
];

export const QUIZ_KINDS = ["meaning", "pinyin", "tone", "meaning", "pinyin"];

export function shuffle(values, random = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuiz(wordIndex, kind, random = Math.random) {
  const word = WORDS[wordIndex % WORDS.length];
  const fields = {
    meaning: { key: "meaning", label: "字義試煉", prompt: `「${word.hanzi}」是什麼意思？` },
    pinyin: { key: "pinyin", label: "拼音試煉", prompt: `「${word.hanzi}」的拼音是哪一個？` },
    tone: { key: "tone", label: "聲調試煉", prompt: `「${word.hanzi}」使用哪一個聲調？` }
  };
  const config = fields[kind] ?? fields.meaning;
  const correct = word[config.key];
  const distractors = shuffle(
    [...new Set(WORDS.map(item => item[config.key]).filter(value => value !== correct))],
    random
  ).slice(0, 3);

  return {
    word,
    kind,
    label: config.label,
    prompt: config.prompt,
    correct,
    answers: shuffle([correct, ...distractors], random)
  };
}

export function getAccuracy(correct, attempts) {
  return attempts === 0 ? 0 : Math.round((correct / attempts) * 100);
}
