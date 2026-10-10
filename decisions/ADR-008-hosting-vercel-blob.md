# ADR-008: Host on Vercel, store galleries and images in Vercel Blob
Status: **accepted for now** (Quang, Q4, 2026-10-10). Revisit if a side challenge (Vultr, GoDaddy domain) needs a different host.
## Context
F7 stores gallery JSON and images on the server. Vercel has no persistent disk, so a storage service is required. We want a preview URL per PR for reviews and checkpoints.
## Decision
- Next.js on Vercel. Every PR gets a preview deploy; `main` gets a stable preview URL. Production/demo deploys need Quang's approval.
- Gallery JSON and image files (512 / 1024 / 2048 px WebP) are stored in Vercel Blob. The edit key is stored only as a hash.
- The Blob token lives only in Vercel environment variables (`BLOB_READ_WRITE_TOKEN`). Never commit, print or message it.
## Alternatives considered
- A Vultr VM with local disk: possibly a side-challenge point, but more ops work in 36 h.
- A hosted database: unneeded without accounts.
## Consequences
- devops cards T-006 (project, previews, Blob store) and T-002 (`.env.example` lists the variable name).
- The Sprint 2 API cards (builder-1) use the Blob SDK.
- A human with Vercel account access must link the project (flagged to Quang).
