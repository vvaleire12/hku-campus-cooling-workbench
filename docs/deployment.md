# GitHub Pages deployment — 17 November 2026

- Website: https://vvaleire12.github.io/hku-campus-cooling-workbench/#/overview
- Repository: https://github.com/vvaleire12/hku-campus-cooling-workbench
- Source commit containing the application and HTML build: `379565e89e0bea1779ffe257b0e4fe1727a0d86d`.
- Published branch: `gh-pages`, root directory.
- Published commit: `58323361ca747eb4dce0636d81a8fdd637dd2c33`.
- GitHub Pages workflow: https://github.com/vvaleire12/hku-campus-cooling-workbench/actions/runs/44046237505
- GitHub reports **Success** for the build, report-build-status and deploy jobs. The run took 30 seconds and supplied `https://vvaleire12.github.io/hku-campus-cooling-workbench/` as its deployment URL.
- Published HTML is 2,655,733 bytes and has SHA-256 `b4b17adc55757ee3a9ae9199dc4bcd03668de25883b36e05b3f9bb2e5fcb9616`. Fetching the HTML from the remote `gh-pages` branch confirmed it matches the locally tested artifact byte for byte.

The standalone file embeds scripts, styles, the crest and the campus map. It uses hash routes and needs no backend, runtime CDN or external asset service. The GitHub-project-subpath browser test passed, including deep-link reload and saved approvals; the original 10 unit tests and 12 browser scenarios passed.

Direct HTTP access to the public `github.io` hostname remains blocked by this managed cloud environment's current network policy. Publication success is established by GitHub's completed deployment record, not by a claimed direct HTTP/browser check from this environment. Local `file://` navigation is also blocked by its managed browser policy and is reported as skipped.

An additive environment draft for `api.github.com` and `vvaleire12.github.io` was saved to support future remote management and public-site checks. It does not apply to the running machine until reviewed, saved and published in environment settings; it is not a prerequisite for users opening the already deployed site.

To update the website after future application changes, run `npm run publish:pages` from the checkout. It builds and pushes a new deployment commit without force-pushing. GitHub's branch-based Pages deployment then publishes that commit.
