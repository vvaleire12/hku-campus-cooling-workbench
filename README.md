# HKU Campus cooling Workbench

A desktop-first, frontend-only classroom cooling operations prototype. Its four connected modules use one shared illustrative dataset: Overview Dashboard, Buildings & Rooms, Approval Center, and Rules & Settings.

**Live website:** https://vvaleire12.github.io/hku-campus-cooling-workbench/#/overview

**Standalone HTML:** [View or download the published HTML](https://github.com/vvaleire12/hku-campus-cooling-workbench/blob/gh-pages/index.html). Use GitHub's download button to save the file rather than viewing its source.

Initial Pages deployment completed successfully. See [deployment evidence](docs/deployment.md).

## HTML version and GitHub Pages

Build a single HTML file with all JavaScript, CSS and images embedded:

```sh
npm run build:html
npm run test:html
```

The output is `dist-html/index.html` (approximately 2.7 MB). It needs no CDN, API, external font or asset server. Production uses hash navigation (`#/overview`) so GitHub Pages project subpaths and deep-link refreshes work without SPA server rewrites. The standard multi-file production build also uses relative asset paths.

To publish the compiled HTML to this repository's `gh-pages` branch:

```sh
npm run publish:pages
```

The script uses the existing `origin` Git authentication, preserves deployment history, and never force-pushes or changes the current checkout. It refuses to overwrite an unrelated existing `gh-pages` branch. The repository owner must enable **Settings → Pages → Deploy from a branch → gh-pages → / (root)** if Pages has not already been enabled. Pushing the branch alone does not establish that the site is live.

Expected site address after Pages is enabled: https://vvaleire12.github.io/hku-campus-cooling-workbench/#/overview

GitHub's file viewer displays HTML source; the Pages address renders the application. Browser state stays local to the site's origin. Some managed browsers prohibit opening local `file://` documents; the HTML check reports that restriction as a skip rather than a passing offline-open test. Use Pages or `npm run preview:html` in that case.

## Run locally

Requires Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

The development server binds to all interfaces on port 5173. Use the environment's port forwarding to view it. For a production build, run `npm run build`; `npm run preview` serves the generated files.

If the system npm cache is not writable, use `npm ci --cache /workspace/.npm-cache`.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

The browser tests use `/usr/bin/chromium`, two workers, and a local Vite server. Adjust `executablePath` in `playwright.config.ts` if Chromium lives elsewhere. They exercise navigation, keyboard map selection, filtering, calendar ranges, approvals, rejection, persistence, draft validation, rule activation, and mobile overflow.

## Demonstration workflow

1. Explore the campus map or open Buildings & Rooms. Filter the five fictional classrooms and open a room's weekly timetable.
2. Review one of five pending requests in Approval Center. Inspect the evidence, add an optional comment, then reject with a reason or review the proposed facility configuration.
3. Apply the simulated settings. The request moves to History with a preserved evidence/configuration snapshot and timeline. Future schedules are saved as plans; they do not overwrite the fixed sensor snapshot.
4. Open Rules & Settings to inspect two system references or create a local rule. Save an incomplete named draft or submit a validated active rule. User-created active rules can be disabled and enabled.
5. Decisions and rules persist in browser local storage. To restore the seed dataset, open the administrator profile and choose **Reset demo data**, then confirm.

No real authentication, backend, live AI, IoT, booking integration, rule engine or HVAC control is present. Every operational record is illustrative. The sensor reference time is **17 November 2026, 13:15 HKT**; calendar date selection does not change sensor readings. The current real date in the workspace header is separate.

## Project organization

- `src/data.ts`, `src/types.ts`: shared mock data, map geometry and typed records.
- `src/logic.ts`: schedule, filter, time, validation and conflict calculations.
- `src/store.tsx`: atomic local persistence and workflow transitions.
- `src/components/`: accessible dialogs, campus map, approval review and reusable UI.
- `src/pages/`: the four modules and room/history detail pages.
- `src/styles.css`: responsive HKU-inspired white/green visual system.
- `docs/product-decisions.md`: explicit prototype decisions resolving PRD ambiguities.
- `docs/assets.md`: source/provenance notes for the map and crest.

Each cloud task is already isolated. Use the existing checkout; a separate Git worktree is not needed unless explicitly requested.
