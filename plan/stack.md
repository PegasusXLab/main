# Stack

Status: **approved by Quang** (Q3, 2026-10-10). Mirrored in `AGENTS.md`. Further stack changes need Quang's approval first.

Source: plan.md §8. Exact versions are pinned by T-001 (scaffold) to the current stable release of each package and recorded in `package.json`. Agents read the installed package docs rather than relying on memory (reference note R13).

## Runtime

| Package | Use | Feature |
|---|---|---|
| Next.js (App Router) + React | pages, API routes | all |
| TypeScript (strict) | everything | all |
| Tailwind CSS | default styling only until P0 works (plan.md §2.1) | all UI |
| `three` | 3D engine | F5 |
| `@react-three/fiber` | React renderer for three | F5, F6, F8 |
| `@react-three/drei` | helpers (orbit controls, textures) | F5, F6 |
| `zustand` | the gallery store (architecture.md §4) | F1, F2, F5 |
| `@use-gesture/react` | drag, resize and pan in the 2D editor | F1 |
| `zod` | `lib/schema/validate.ts` | F4, F7 |
| `nanoid` | room, artwork and gallery ids; edit keys | F1, F7 |
| Node `crypto` (built in) | hash the edit key (`scrypt`), no extra dependency | F7 |
| `howler` | room audio (**P1**, add in Sprint 3) | F9 |
| `@aws-sdk/client-s3` | talks to Vultr Object Storage (S3-compatible) for gallery JSON + images (ADR-008); add in Sprint 2 with the API cards | F3, F7 |

## Dev only (never shipped to the viewer bundle)

| Package | Use |
|---|---|
| `leva` | tune atmosphere presets (F11) |
| `r3f-perf` | performance overlay (plan.md §7) |
| `vitest` | unit tests (compile, schema, store) |
| ESLint + Prettier | lint and format, run in CI |
| `@playwright/test` | reviewer UAT and a smoke e2e |

## Hosting
**Vercel** for hosting (project connected by Quang: https://galleriverse.vercel.app/) with a preview deploy per PR, and **Vultr Object Storage** for gallery JSON and images (ADR-008). Vercel Blob is not used. devops cards T-002 and T-006. Later, optional: a Vultr server/GPU for texture compression (P1), lighting baking and AI features (P2), each needing budget approval.

## Not using (and why)
- Physics engines: out of scope (plan.md §4).
- Custom shaders / custom render pipeline: rejected for P0 (reference notes R8, R9).
- A database or auth provider: no accounts (plan.md §2.8). JSON documents + hashed edit key are enough.

## As built (T-001, merged 2026-10-10, main 07f3698)
The design check matched the card. Pinned in `package.json`; the file on `main` is the source of truth.
- **Runtime:** Node.js 24 · Next.js 16.4.0 (App Router, Turbopack, **Cache Components on**, `agentRules: false`) · React 19.3 · TypeScript 5.9 (strict) · Tailwind CSS 4.3 through the Turbopack CSS loader (no `tailwind.config`).
- **3D and state:** three 0.186.1 · @react-three/fiber 9.8.1 · drei 10.7.9 · zustand 5.0.15 · @use-gesture/react 10.3.1 · zod 4.6.5 · nanoid 6.0.2.
- **Dev:** vitest 5.0.3 · @playwright/test 1.64.0 · ESLint 9 + eslint-config-next · Prettier 3.9 · leva 0.10.1 · r3f-perf 7.2.3.
- **Scripts:** `dev`, `build`, `lint`, `typecheck` (`next typegen && tsc --noEmit`), `test`, `format`, `format:check`.
- **Added in Sprint 2:** `@aws-sdk/client-s3` (T-030; exact pin follows in T-032). **Not yet added:** `howler` (Sprint 3).
- **Note:** Cache Components changes how pages and API routes handle dynamic data. Builders must read `node_modules/next/dist/docs/` before writing pages or routes (AGENTS.md Gotchas).
