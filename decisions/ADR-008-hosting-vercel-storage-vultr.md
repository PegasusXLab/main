# ADR-008: Host on Vercel, store galleries and images in Vultr Object Storage
Status: **accepted** (Quang, 2026-10-10). Replaces the earlier "Vercel + Vercel Blob" version of this ADR. Vercel Blob is not used.
## Context
F7 stores gallery JSON and images on the server. Vercel has no persistent disk, so a storage service is required. We want a preview URL per PR for reviews and checkpoints. The team wants to use Vultr (side challenge) and give it a real job in the product, without taking on running our own web server in 36 h.
## Decision
- **Hosting: Next.js on Vercel.** Every PR gets a preview deploy; `main` gets a stable preview URL. Production/demo deploys need Quang's approval.
- **Storage: Vultr Object Storage** (S3-compatible), accessed only from our API routes with the standard S3 client (`@aws-sdk/client-s3`), pointed at the Vultr endpoint:
  - Images (512 / 1024 / 2048 px WebP, ADR-009) are publicly readable objects; the document stores their URLs.
  - Gallery JSON is read and written only through `/api/galleries`. The edit-key hash is stored server-side and never returned to the browser.
- **Local first (Quang, 2026-10-10):** all API code goes through one small storage interface (put, get, public URL). When the `VULTR_S3_*` variables are unset (local dev, tests, CI), it uses a local-disk store under `.data/` (gitignored) and serves images from a local route. Builders, the reviewer and CI never need an account; Vultr is used only where the variables are set.
- **Value formats:**
  - `VULTR_S3_ENDPOINT` = `https://` + the Vultr Object Storage hostname (e.g. `https://ewr1.vultrobjects.com`).
  - `VULTR_S3_BUCKET` = the bucket name only.
  - All four are set for Vercel Production + Preview, with the two keys marked Sensitive.
  - Uploads go through `/api/upload` (server side), so the bucket needs no CORS. The code sets public-read on image objects.
- **Secrets:** `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY`, `VULTR_S3_SECRET_KEY` live only in Vercel environment variables (and in uncommitted local `.env` files). Never commit, print or message them.
- **Later (not P0):** a Vultr server/GPU for heavy graphics work done ahead of time: texture compression on upload (P1), lighting baking on publish (P2), and AI features (P2). Each is its own draft card and needs Quang's budget approval before it starts.
## Alternatives considered
- Vercel Blob for storage: simplest on Vercel, but Vultr would have no role. Using both would duplicate storage, keys and testing.
- Hosting the whole app on a Vultr server: the strongest Vultr story, but devops would have to run the server, HTTPS, deploys and rollback. Too much risk for P0.
## Consequences
- devops: T-006 (Vercel project + previews + Vultr bucket and keys) and T-002 (`.env.example` lists the four variable names).
- builder-1: the Sprint 2 API cards (`/api/galleries`, `/api/upload`) use the S3 client.
- Humans needed: the Vercel account owner (link the repo) and the Vultr account owner (bucket + access key). Flagged to Quang.
