---
spec: object-pipeline
brief: briefs/objects-and-look.md (part A)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1 (or builder-3)
depends_on: [objects-schema]
needs_quang: ["@gltf-transform/core + @gltf-transform/functions + meshoptimizer (server only)", "AI provider account + FAL_KEY in Vercel env + monthly budget"]
files_in_scope:
  - src/app/api/objects/upload-url/route.ts (new: presigned PUT)
  - src/app/api/objects/optimize/route.ts (new)
  - src/app/api/objects/generate/route.ts (new: start job)
  - src/app/api/objects/generate/[jobId]/route.ts (new: poll)
  - src/lib/objects/optimize.ts (new, pure-ish: gltf-transform pipeline) + test with a fixture .glb
  - src/lib/objects/provider.ts (new: provider adapter interface + fal implementation + a fake for tests)
  - src/lib/storage/* (add presign + put-from-server helpers; reuse the existing adapter, ADR-008)
---
## What and why
This is the server side of "any medium". It makes every 3D file, uploaded or AI-generated, **small, upright and safe** before a visitor ever downloads it, and it scales without routing large files through Vercel functions.

This spec has no visual surface. It's here so the UX promises in `object-add-flow` (instant cut-out, honest progress, plain errors) are backed by the API.

## Flows
### A. Upload a `.glb`
1. `POST /api/objects/upload-url` `{ galleryId, editKey | session, filename, size }` → `{ uploadUrl, key }`. This is a presigned PUT to Vultr S3 (10 min expiry, `content-type: model/gltf-binary`, size ≤ 30 MB checked).
   - **Local dev fallback (ADR-008):** returns a local `/api/objects/raw/<key>` PUT handler that writes to `.data/`.
2. The browser PUTs the file directly (`uploadModel.ts` reports progress).
3. `POST /api/objects/optimize` `{ key }` → runs `optimize.ts` and returns `{ modelUrl, posterUrl?, stats: { trisBefore, trisAfter, bytesBefore, bytesAfter } }`.
4. The editor sets `source = { kind: "model", origin: "upload", modelUrl }`.

### B. Photo → 3D
1. The client has already uploaded the photo through the existing image upload (it becomes the fallback cut-out).
2. `POST /api/objects/generate` `{ imageUrl, galleryId, auth }` → checks the rate limit and budget, calls `provider.start(imageUrl)`, and returns `{ jobId, etaSeconds }`.
3. The client polls `GET /api/objects/generate/:jobId` every 3 s (backoff to 10 s after 60 s) → `{ status, progress?, etaSeconds? }`.
   - On `ready`, the **server** downloads the provider's GLB, runs `optimize.ts`, stores the result, and returns `{ status: "ready", modelUrl }`.
   - The client then updates `job.status` and `modelUrl` (the render spec cross-fades).
4. Timeout: 5 min → `failed`. The cut-out stays (UX in `object-add-flow`).

## optimize.ts (gltf-transform)
- `read` (reject anything that isn't glTF 2.0 or has no meshes) → `dedup` → `prune` → `weld` → `simplify` (meshoptimizer, target ≤ 100k tris, error 0.001).
- Then `textureCompress` (WebP, max 2048 on the long side, 1024 if more than 2 textures) → `meshopt` (EXT_meshopt_compression) → `write`.
- Strip cameras, lights and animations. Keep materials (PBR).
- **Normalize orientation** only if the file declares Z-up (rare). Scale and pivot normalization happens in the renderer.
- Optional poster: skip in v1, since the 2D marker doesn't need one.
- Hard limits: input ≤ 30 MB, output target ≤ 5 MB (warn above 8 MB), and a ~20 s budget. The route sets `maxDuration` to the plan's maximum, and runs on a Vultr worker later if needed.

## Provider adapter (`provider.ts`)
```ts
interface ImageTo3DProvider {
  start(imageUrl: string): Promise<{ jobId: string; etaSeconds?: number }>;
  status(jobId: string): Promise<{ status: "queued" | "running" | "ready" | "failed"; progress?: number; glbUrl?: string; error?: string }>;
}
```
- **Default:** fal.ai (Hunyuan3D-class model, ~$0.08/gen), key `FAL_KEY` in Vercel env only, never in the client or docs.
- Swappable to Meshy or Tripo, or later a self-hosted TRELLIS.2/Hunyuan3D on the Vultr GPU (T-090/T-091 line), without client changes.
- A `FakeProvider` for tests and e2e: it returns a fixture GLB after 2 s.

## Abuse, cost and limits
- **Auth:** generate needs a logged-in user (ADR-014) **or** a valid edit key. Upload-url needs an edit key or session.
- **Rate limit:** 10 generations per user per day, 3 concurrent. A global monthly budget cap (env `OBJECTS_MONTHLY_BUDGET_USD`, counted in storage) → `429` with "3D generation is paused for today" (the client shows it and keeps the cut-out).
- Only our own image URLs (the `/api/files` host) are accepted as generation input (SSRF guard).
- Logs never include keys or signed URLs.

## Acceptance criteria (reviewer checks these)
- [ ] A 25 MB Polycam GLB uploads straight to storage (not through the function) and optimizes to ≤ 5 MB, with stats returned.
- [ ] A non-GLB, a GLB with no meshes, and a file > 30 MB each fail with a clear error code and message.
- [ ] Generate with `FakeProvider`: start, then poll running → ready, with the optimized `modelUrl` stored. The e2e path works with no external key.
- [ ] Rate limit and budget cap return 429 with a message. A non-own image URL is rejected.
- [ ] Without `VULTR_S3_*`, everything works on local disk (`.data/`).
- [ ] No secret in client bundles, logs or docs.

## Build kit (the senior copies this into the card)
- **Libraries (need Quang):** `@gltf-transform/core`, `@gltf-transform/functions`, `meshoptimizer` (server), and the fal client or plain `fetch`, which is preferable (no SDK dependency).
- **Skills to load:** `pegasus-ui` (error copy tone only).
- **References:** ADR-008 (storage), ADR-014 (accounts), `src/app/api/upload/` (existing upload route), Next 16 route docs in `node_modules/next/dist/docs/` (gotcha: don't rely on memory).
