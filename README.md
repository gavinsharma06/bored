# Bored

A late night game show wheel that picks one small, specific thing to do when
I'm bored. Vanilla HTML, CSS, and JS with no build step.

## Running it

Double click `index.html`. Everything works offline from disk, except two
files the browser refuses to fetch from `file://`: `ideas.json` (extra tasks
and rewrites) and the published `history.json`. To get those
locally, serve the folder:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. On GitHub Pages it all just works.

## Files

| File | What it holds | Who writes it |
| --- | --- | --- |
| `tasks.js` | Categories, the built in tasks, the penalty, jackpot treats | Me, by hand |
| `history.json` | Every Done, Skip, and Unbench as `{ taskId, result, date }` | The app only |
| `ideas.json` | `{ added: [tasks], rewrites: { taskId: task } }` | Never the app |
| `app.js` | The wheel, results, drawer, learning, and benching | |
| `history.js` | The local log, skip streaks, and GitHub sync | |
| `ideas.js` | Loads `ideas.json` and merges it into the task list | |
| `storage.js`, `sounds.js`, `confetti.js` | localStorage, Web Audio, and confetti | |

The app never writes `ideas.json`, so whatever writes it can never collide with history.

## How the wheel learns

- Every Done raises a task's weight by 0.15, every Skip lowers it, held between 0.35 and 2.
- 10 Skips in a row benches a task. It leaves the wheel and shows up under
  Benched in the drawer, where Unbench brings it back. One Done resets the streak.
- New tasks, and smaller rewrites of benched tasks, arrive through `ideas.json`.

## Syncing history (optional)

Without a token the app keeps history in the browser and makes no GitHub
calls. To sync, create a fine grained GitHub token limited to this repository
with **Contents: Read and write**, then paste it into the drawer's Sync section.
The token lives only in that browser's localStorage. Failed syncs retry on the
next load.

## The forge report

`node scripts/forge-report.mjs` loads the app's own `tasks.js`, `ideas.js`, and
`history.js` and prints which tasks are benched, how each category is doing, and
any entries in `ideas.json` the wheel would reject.
