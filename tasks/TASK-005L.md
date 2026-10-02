# TASK-005L — Remove current-goal instructions

User requests not writing what the player should do now. Remove quest/next-step HUD and automatic start/review instructions. Keep location, controls, interactable action names, inventory/replay/save status, authored gestures, VFX and all runtime/progression systems. Remove instructive title/help/footer notebook copy without expanding scope or changing Mandarin.

Low-impact copy/layout edit: use existing checks plus visual browser validation rather than new implementation-mirroring tests. Frozen Godot references untouched. Refresh desktop and complete authorized publication.

Implemented: quest objective HUD and state-to-instruction text removed; enter/review toasts and extra title/help/notebook instructions removed. HUD retains location, inventory/replay status and controls with controls aligned right. Offer button remains an action choice without the instructional tooltip. Underlying quest, save, language and consequence systems untouched.

Validation 2026-10-02: npm run check 60 passing; git diff --check clean; local standalone opening replay screenshot shows no goal/current-step block or startup instruction; guard dialogue, evidence recording and close work; console errors/warnings empty. Windows build smoke exit0, rendered=true, errors=[], WebGL enabled, ZIP refreshed. Godot export omitted per AGENTS.md frozen reference boundary.
