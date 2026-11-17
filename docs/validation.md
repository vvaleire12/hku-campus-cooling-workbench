# Validation record — 17 November 2026

- `npm run build`: passed TypeScript checks and Vite production compilation. React, chart and application assets are split into separate chunks; no large-chunk warning remains.
- `npm test`: 10 tests passed. Checks cover shared IDs, room/schedule consistency, booking versus occupancy, normalized search, combined filters, date/week boundaries, population-bounded chart counts, configuration validation, incomplete drafts, time-window overlap and transitively overlapping calendar blocks.
- `npm run test:e2e`: 12 Chromium browser tests passed at desktop and mobile sizes. They exercise map keyboard selection and pointer selection, unmonitored empty state, directory return context, calendar event details/ranges/empty weeks, approval state transitions, rejection, OFF configuration, immutable history, local persistence, rule drafts/activation/edit IDs/toggle, unsaved changes, and mobile overflow.
- Storage failure was injected: an approval remained Pending and did not show success when browser storage rejected writes. Reloading an unsubmitted configuration also returned to Pending Review.
- A separate production-preview browser check loaded the compiled application, navigated routes, completed a simulated approval and verified four requests remained in Inbox. No runtime page errors were observed in that check.
- Desktop screenshots of all module types and mobile Overview were inspected. Adjustments corrected form accessible names, icon-only navigation labels, the post-approval close race, map SVG hit regions and compact impact-label wrapping.
- `git diff --check`: passed.

These checks validate the frontend demonstration workflow, not live HVAC operation, field observations, FAQ accuracy, official branding permission, or real energy/comfort outcomes.

## Standalone HTML and Pages preparation

- `npm run build:html` produces one self-contained `dist-html/index.html`, with no external stylesheet or script references and with both image assets embedded.
- `npm run test:html` verifies the built HTML served at `/hku-campus-cooling-workbench/`, correct hash routes, room filtering, deep-link reload, a simulated approval, and persisted pending counts. No external asset requests or JavaScript runtime errors occurred.
- Direct `file://` opening was attempted but blocked by the managed Chromium policy (`ERR_BLOCKED_BY_ADMINISTRATOR`); that check is explicitly skipped, not reported as passed. No policy bypass was attempted.
- The GitHub Pages management API and the expected public site host initially require network grants not applied to this running environment. Remote publication status must be established separately from the passing local checks.
