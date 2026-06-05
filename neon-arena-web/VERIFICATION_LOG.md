# Verification Log

Environment date: 2026-06-05.

Commands executed inside the build container:

```text
npm install
npm run test
npm run lint
npm run build
npm run qa:mobile
npx wrangler deploy --dry-run
```

Results:

```text
npm install: passed, 0 vulnerabilities
npm run test: passed, 4 test files, 18 tests
npm run lint: passed, app and worker typecheck
npm run build: passed, Vite production build generated dist/
npm run qa:mobile: static fallback passed; Chromium blocked localhost with net::ERR_BLOCKED_BY_ADMINISTRATOR in this environment
npx wrangler deploy --dry-run: passed, assets and Durable Object bindings detected
```

Mobile visual note:

The runtime screenshot path was blocked by the container Chromium policy. The QA script therefore wrote `docs/mobile-844x390-smoke.png` from the generated 844x390 gameplay mockup and wrote `docs/mobile-visual-check.json` with mode `static-fallback`. On a normal local machine, the same script attempts a runtime Chromium screenshot first.
