---
name: Browser regression setup
description: Environment constraint for running the web artifact's Playwright browser checks locally.
---

The web artifact's Playwright browser checks require the Chromium runtime libraries listed in `.replit` under the Nix packages. Without them, the browser binary can download successfully but fail at launch because shared libraries are unavailable.

**Why:** Replit's base workspace does not include all graphical/runtime libraries needed by headless Chromium.

**How to apply:** Keep the e2e dependencies and the Chromium runtime packages available when adding or running browser-level regression coverage for this artifact.