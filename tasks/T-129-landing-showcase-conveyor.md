---
id: T-129
title: Landing showcase strip drifts like a conveyor belt (seamless left-to-right loop)
status: approved
lane: design
assignee: designer-2
reviewer: reviewer-3
branch:
pr: 74
sprint: 4
depends_on: [T-119]
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's reference); behaviour spec from Quang below
updated_by: reviewer-3
updated_at: 2026-10-10T20:45:47Z
---
## Goal
The hanging-wall strip on the start page drifts left to right at a constant slow speed, looping forever with no visible seam, start or end (Quang, 15:48 EDT).
## Acceptance criteria
- [ ] The artwork list renders twice, back to back, in one track element (the second copy `aria-hidden`). Only the track animates, via `transform: translate3d(x,0,0)`; never the individual frames.
- [ ] Left-to-right drift: the track goes from `translateX(-50%)` to `translateX(0)`, then wraps to -50%; the wrap is invisible because the halves are identical.
- [ ] Each copy ends with the same gap that sits between frames, so the copy 1 / copy 2 join is spaced exactly like every other pair.
- [ ] Constant speed: linear, no easing, no pauses, no alternate/reverse. Speed is set in **px/s (~35 px/s)**, not a fixed duration: requestAnimationFrame with elapsed time, OR a CSS duration computed as (measured width of one copy ÷ speed), recomputed on resize.
- [ ] The centerline rule and the "145 cm" label stay fixed; only the frames move along the line.
- [ ] Hover slows to ~30% speed, with the speed change eased over ~400 ms (no stopping).
- [ ] The arrow buttons nudge the track one frame-width in that direction with a short eased glide (~500 ms), then resume the constant drift from the new position, with no jump.
- [ ] `prefers-reduced-motion`: no drift; the strip becomes horizontally scrollable and the arrows step through it.
- [ ] Performance: `will-change: transform` on the track only; pause when off-screen (IntersectionObserver); no layout reads inside the animation loop.
- [ ] Existing ids/testids/accessible names unchanged; 0 console errors; works at 1440 and 390 px; lint, unit tests, auth e2e and predemo pass.
## Files / modules in scope
- src/components/landing/Showcase.tsx (+ test)
## Out of scope
- The rest of the landing page, auth, tokens/primitives, new dependencies (no `motion`; plain rAF/CSS).
## Build kit
- **Libraries:** none. **Skills:** `pegasus-ui`, `emil-design-eng`, `improve-animations`, `web-design-guidelines`.
## Notes
- Assigned directly by Quang. Reviewer: reviewer (Vic); designer-2 is Quang's.
- Deploy safety rules apply. Ideally merged before the 17:45 demo-build run.
## History
- 2026-10-10T19:47:47Z senior: carded from Quang's instructions; approved by Quang
- 2026-10-10T19:47:48Z senior: status -> ready
- 2026-10-10T19:54:34Z designer-2: status -> in-progress
- 2026-10-10T20:01:01Z designer-2: status -> in-review
- 2026-10-10T20:45:47Z reviewer-3: status -> approved
