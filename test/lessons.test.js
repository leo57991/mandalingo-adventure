import test from "node:test";
import assert from "node:assert/strict";
import { WORDS, buildQuiz, getAccuracy, shuffle } from "../src/lessons.js";

test("every lesson has the required learning fields", () => {
  assert.ok(WORDS.length >= 10);
  for (const word of WORDS) {
    assert.ok(word.hanzi && word.pinyin && word.tone && word.meaning);
  }
});

test("quiz contains exactly one correct answer and four unique choices", () => {
  for (const kind of ["meaning", "pinyin", "tone"]) {
    const quiz = buildQuiz(2, kind, () => .37);
    assert.equal(quiz.answers.length, 4);
    assert.equal(new Set(quiz.answers).size, 4);
    assert.equal(quiz.answers.filter(answer => answer === quiz.correct).length, 1);
  }
});

test("shuffle does not mutate its source", () => {
  const source = [1, 2, 3, 4];
  const result = shuffle(source, () => 0);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.notEqual(result, source);
});

test("accuracy handles empty and partial attempts", () => {
  assert.equal(getAccuracy(0, 0), 0);
  assert.equal(getAccuracy(4, 5), 80);
  assert.equal(getAccuracy(2, 3), 67);
});
