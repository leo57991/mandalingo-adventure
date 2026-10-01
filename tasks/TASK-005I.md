# TASK-005I — 3D evidence VFX

User requests magic/VFX that adds evidence for player hypotheses, building on the published Windows-oriented 3D courtyard. Add transient, replayable visual evidence to existing authored observations and physical consequences: water surface/bowl flow, speaker-relative gesture traces, drinking/recovery and gate release. Preserve language rules and private guesses; VFX has no authority to interpret Mandarin, grant inventory, certify a translation or unlock a gate. No new vocabulary/constructions, runtime LLM, curriculum expansion, Godot changes or mobile interface.

The published build currently uses the preserved physical collection/offer loop, while the root language-action pipeline is a separate pending branch. This task decorates that existing loop; it does not introduce a new spell parser or silently merge the pending curriculum. Existing authored gestures supply all clue targets.

Validation: behavioral cue/clock/isolation tests, npm run check, browser observation/replay/collection/consequence/pause QA and desktop build smoke. Publish through the repository release workflow.

Implemented: authored observation mapping, bounded 2.8-second effect clock, fixed 4-slot 3D pool, water ripples and collection stream, empty-bowl rim, speaker/target contact and light trace, drinking/recovery/gate release, replay button, muted-aware procedural sound, paused presentation and reduced motion. Replays call only the presentation owner, never displayed-line evidence recording. Notice-board text is left unchanged; no new semantic cue is invented for it.

Validation (2026-10-01): npm run check: 53 passing tests; git diff --check clean. Local browser at 1440x900: jar -> collect -> traveller offer -> drink/recovery/open -> chapter, gate=1 and quest=resolved; no console errors/warnings. Clerk self cue observed and replayed, evidenceCount remains 3, inventory and quest unchanged; reduced-motion retains contact ring and hides particles. Renderer tests verify empty bowl has no droplets, cues follow moving actors, reduced motion and expiry. Windows build refreshed; packaged executable smoke exit 0, rendered=true, errors=[], WebGL enabled. Human learning effectiveness still needs playtests.

Godot export validation intentionally omitted under AGENTS.md frozen-reference rule; Godot paths unchanged. Windows artifact is local dist/Mandalingo-3D-Windows.zip, not a Steam store upload.
