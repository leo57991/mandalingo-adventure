# Mandalingo — Windows 3D preview

Extract the entire folder, then open **Mandalingo.exe**. Keep the resources and runtime files beside the executable. No browser, development server, or internet connection is required to play.

- WASD / Arrow keys: move; Shift: run.
- E: inspect / talk / advance; N: notebook.
- Escape: close an overlay or pause exploration.
- F11: desktop fullscreen. Alt reveals the Game menu; Alt+F4 quits.
- Use the mouse for buttons and notebook entries.

Notes and progress save locally under the Mandalingo application profile. The desktop profile is separate from the browser preview. This is an unsigned Windows x64 test build, not a Steam store release. It contains the South Gate vertical slice; no controller integration or Steamworks achievements are claimed.

Development: `npm ci`, `npx install-electron`, then `npm run desktop`.
Build a new portable folder: `npm run desktop:build`.
The Electron and Chromium licenses are included beside the executable; Three.js's MIT license is in resources/app/src/vendor.
