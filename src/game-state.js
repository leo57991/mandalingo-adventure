export const GAME_STATE = Object.freeze({
  TITLE: "TITLE",
  HELP: "HELP",
  EXPLORING: "EXPLORING",
  DIALOGUE: "DIALOGUE",
  NOTEBOOK: "NOTEBOOK",
  CUTSCENE: "CUTSCENE",
  CHAPTER: "CHAPTER"
});

export class GameStateController {
  constructor(initialState = GAME_STATE.TITLE, onChange = () => {}) {
    this.stack = [initialState];
    this.onChange = onChange;
  }

  get current() { return this.stack.at(-1); }
  get canMove() { return this.current === GAME_STATE.EXPLORING; }

  push(nextState) {
    if (!nextState || nextState === this.current) return this.current;
    const previous = this.current;
    this.stack.push(nextState);
    this.onChange({ previous, current: this.current, stack: [...this.stack], action: "push" });
    return this.current;
  }

  replace(nextState) {
    if (!nextState || nextState === this.current) return this.current;
    const previous = this.current;
    this.stack[this.stack.length - 1] = nextState;
    this.onChange({ previous, current: this.current, stack: [...this.stack], action: "replace" });
    return this.current;
  }

  pop() {
    if (this.stack.length === 1) return this.current;
    const previous = this.current;
    this.stack.pop();
    this.onChange({ previous, current: this.current, stack: [...this.stack], action: "pop" });
    return this.current;
  }

  reset(nextState) {
    const previous = this.current;
    this.stack = [nextState];
    this.onChange({ previous, current: this.current, stack: [...this.stack], action: "reset" });
    return this.current;
  }
}
