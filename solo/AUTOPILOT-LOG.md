# Autopilot log

One section per unattended `/ship auto` run, newest at the bottom. Autopilot never merges: each item stops at a green PR labelled `ready-for-vic`. Try each one with its **Try it** steps, then tell `/ship` "merge #n" or "merge all ready". Format:

```
## <YYYY-MM-DD HH:MM> run (max N)
- Ready to try: <title> (PR #n, <preview link>)
  Try it: 1. <click> → <what you should see> 2. ... · Edge cases: ... · Not changed: ...
- Parked: <title>: <reason> (link), ...
- Assumptions to check: <feature file>: <assumption>, ...
- Ended because: queue done | max N reached | 2 parked in a row
```

## 2026-10-12 16:45 run (max 3, + Vic's viewer-logo request mid-run)
- Ready to try: Harden media URLs + guestbook storage errors, post-merge review of #124/#127 (PR #128, https://main-git-fix-post-merge-hardening-kaiser1xs-projects.vercel.app)
  Try it: 1. /edit/local → Add → Guestbook → Publish → open view link 2. Click the guestbook → sign → your entry tops the list 3. Sign again within 15 s → "Give it a few seconds" · Edge cases: a track URL `/\evil.example/a.mp3` is now refused; `/api/files/...` still OK · Not changed: all UI.
- Ready to try: e2e editor-ux.spec + deterministic load-race spec (PR #129, https://main-git-test-editor-ux-spec-kaiser1xs-projects.vercel.app). Test-only. Editor UX and camera re-land were already shipped (#102, #104…#118).
  Try it: /edit/local → "Rooms (n)" → open a room → "Gallery overview" → Escape → "+ Add Room" adds + selects a room · Not changed: app code.
- Ready to try: Viewer logo links home (PR #130, https://main-git-feat-viewer-home-logo-kaiser1xs-projects.vercel.app/g/8bN54tekNuYiwZlGoMMRf)
  Try it: 1. Open the gallery → logo left of the title 2. Hover → "Galleriverse home" 3. Click → home page 4. Tab → first focus stop · Edge cases: 390 wide; editor 3D POV shows no logo · Not changed: title pill, creator chip, audio, map, tour nav.
- Parked: none.
- Assumptions to check: viewer-home-logo: mark only (no wordmark), hidden in editor POV · editor-ux-e2e: stale branches left in place for you to delete · post-merge-review: guestbook spam/race left as backlog items.
- Ended because: queue done.

## 2026-10-14 21:40 run (PR #143)
- Ready to try: First-walk hitch residue eliminated (PR #143, https://main-git-fix-viewer-first-walk-hitch-kaiser1xs-projects.vercel.app/g/5U0QPGU5L-5d_8hvhIE5j)
  Try it: 1. Open Vic's Space (/g/5U0QPGU5L-5d_8hvhIE5j) 2. Wait 2 s for warm-up, then click "Next room" or press W to walk through the doorway into the East Hall 3. Note the smooth frame rate with zero hitch or long-task shader stalls · Edge cases: 390px mobile view; editor 3D POV · Not changed: all lighting presets, music, and tour nav behaviors.
- Parked: none.
- Assumptions to check: PointsMaterial in Dust.tsx updated via R3F JSX properties to prevent recompilation; ModelMesh prewarms GLTF textures + shaders on load.

