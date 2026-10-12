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
