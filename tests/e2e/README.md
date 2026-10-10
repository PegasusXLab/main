# End-to-end tests (Playwright)

Browser tests for the checkpoint flows. They run locally with no accounts: when the
`VULTR_S3_*` variables are unset, the server stores everything under `.data/`.

## First run

```sh
npm ci
npx playwright install chromium
```

## Run

```sh
npm run test:e2e
```

Playwright starts `npm run dev` on http://localhost:3000 (or reuses a dev server that
is already running) and runs the specs in Chromium.

- One spec: `npm run test:e2e -- editor.spec.ts`
- Watch it run: `npm run test:e2e -- --headed`
- Debug step by step: `npm run test:e2e -- --debug`
- Last HTML report: `npx playwright show-report`

## Against a deployed URL

```sh
E2E_BASE_URL=https://<preview-url> npm run test:e2e
```

No local server is started in this mode.

## Specs

| Spec                   | Flow                                                                                                                                                 | State   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `editor.spec.ts`       | Sprint 1 checkpoint: trim the sample to 1 room, add 2 with the "+" buttons, change a wall colour, toggle to 3D, the WebGL canvas draws a scene       | enabled |
| `publish-view.spec.ts` | Sprint 2 checkpoint: build 3 rooms, hang 2 fixture artworks, publish, tour Previous/Next + plaque in a new context, edit with key, wrong key refused | enabled |

Tests marked `test.fixme` are reported as skipped. Remove the `.fixme` once the feature
they cover is on `main`.
