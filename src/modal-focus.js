const FOCUSABLE = "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

export class ModalFocusManager {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.current = null;
    this.restoreTarget = null;
    this.trap = this.trap.bind(this);
    this.document.addEventListener("keydown", this.trap);
  }

  sync(container) {
    if (container === this.current) return;
    clearTimeout(this.focusTimer);
    if (!this.current && container) this.restoreTarget = this.document.activeElement;
    this.current = container;
    if (container) {
      this.focusTimer = setTimeout(() => { if (this.current === container) this.focusables()[0]?.focus(); }, 80);
    } else if (this.restoreTarget?.isConnected) {
      const restoreTarget = this.restoreTarget;
      this.focusTimer = setTimeout(() => restoreTarget.focus(), 80);
      this.restoreTarget = null;
    }
  }

  focusables() {
    if (!this.current) return [];
    return [...this.current.querySelectorAll(FOCUSABLE)].filter(node => !node.hidden && node.getAttribute("aria-hidden") !== "true");
  }

  trap(event) {
    if (event.key !== "Tab" || !this.current) return;
    const nodes = this.focusables();
    if (!nodes.length) { event.preventDefault(); return; }
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  destroy() { clearTimeout(this.focusTimer); this.document.removeEventListener("keydown", this.trap); }
}
