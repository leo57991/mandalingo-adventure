# TASK-005H — Real-time 3D courtyard

User explicitly requests a 3D game; third-person view is acceptable. Replace the published courtyard presentation with real WebGL geometry, an elevated third-person camera, articulated characters, dimensional architecture and props, shadows, and a hinged gate. Preserve deterministic gameplay, authored Mandarin, notebook, inventory, collision and persistence. No new curriculum decisions or changes to the frozen Godot projects. The pending language-action branch remains separate.

Validate scene geometry and animation independently of WebGL, run npm run check, play the collection/consequence/save flow in a real browser, inspect desktop and portrait layouts, then publish through the existing repository release workflow.

## User steering — desktop target

The user explicitly rejects mobile settings and wants a Steam-style desktop game. Windows x64 is the current platform target. Remove the touch interface, prioritize keyboard/mouse and fullscreen, add a pause/resume menu, and package an offline Windows preview. Browser Pages remains a convenient preview of the same game. Steam store submission and Steamworks integration are not part of this preview. Earlier portrait inspection is superseded by desktop acceptance at 960×640 and larger.

## Implemented and verified

- Real WebGL 2 courtyard, tiled roofs, dimensional gate leaves, stone paving, trees, furniture, open jar, separate 3D actors, contact shadows and world-anchored speech. Articulated walking/carrying/drinking/pointing cues, reduced-motion support and material-batched scenery. Three.js 0.186.1 is vendored with its MIT license.
- Gameplay uses the existing authored x/y collision data mapped onto the 3D x/z plane. Dialogue, notes, inventory and saved consequences remain intact. Removed the 2D runtime renderer; retained reference art helpers and their tests.
- Desktop keyboard/mouse layout; removed mobile controls and mobile-specific styles. Escape pauses/resumes, focus loss pauses exploration, menu provides fullscreen and return to title. Fixed empty-bowl reset after the traveller has recovered.
- Portable offline Windows x64 build via Electron 44.4.5. Sandboxed renderer, isolated context, local assets and separate desktop save profile. Minimal preload only acknowledges first successful 3D frame for startup verification.
- `npm run check`: 49 passing. Regression tests cover real scene structure, feet mapping, walking and gestures, gate hinges, framing, pause routing, and completed-save cue restoration. Original red failures were observed for scene mapping/actors, pause routing and post-recovery bowl reset.
- Real browser journey: inspect jar (no automatic grant), fill bowl, carry, offer to traveller, drink/walk/plead/open, chapter completion and reload. Keyboard E/N/Escape and desktop 960×640 dialogue/pause layouts checked. Console showed no errors or warnings in standalone preview.
- Packaged executable startup smoke: exit 0, `rendered:true`, no renderer errors, GPU compositing and WebGL enabled. The restricted execution environment could not launch the GPU child; the same official Electron runtime passed under the normal user context without weakening the renderer sandbox.
- This remains the South Gate playable slice. Windows startup and the shared gameplay core are verified; Steamworks, store submission, controller support and full manual native-window QA are not claimed.
