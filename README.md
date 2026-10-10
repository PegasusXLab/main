# Pegasus

Pegasus lets creators with no coding or 3D experience build an immersive gallery for their art. They draw rooms on a simple 2D floor plan and hang artwork on the walls, and the app compiles that layout into a 3D gallery anyone can visit from a shared link. Built for Hacklanta 2026.

## Run it

Requires Node.js 24.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | Generates Next route types, then `tsc --noEmit` |
| `npm test`          | Unit tests (Vitest)                             |
| `npm run format`    | Prettier                                        |
| `npm run build`     | Production build                                |
