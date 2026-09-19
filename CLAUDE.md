# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page to-do list app: plain HTML/CSS/JS, no build tools, no dependencies, no backend. All data lives in the browser's `localStorage`.

## Running it

Open `index.html` directly in a browser. There is no package manager, build step, linter, or test suite in this project.

## Architecture

- `index.html` — DOM structure only: task form (text input + priority `<select>`), `#priority-summary` counts, `#task-list` (`<ul>`), `#empty-state` message, and the footer row (`#task-counter`, `#clear-completed`).
- `style.css` — all theming is done via CSS custom properties on `:root`, overridden under `:root[data-theme="dark"]`. Priority colors (`.priority-low/medium/high`) are separate custom properties (`--priority-color`) consumed by `#task-list li`'s left border and the summary dots.
- `script.js` — all app state and logic, no modules/bundler:
  - `tasks` is the in-memory array of `{ id, text, priority, done }`, persisted to `localStorage` under `todo-tasks` via `saveTasks()`/`loadTasks()`. `loadTasks()` validates/filters malformed entries on load.
  - Each task has a stable `id` (generated in `addTask`), not an array index — always look up/mutate tasks by `id`, not position, since `render()` re-sorts by priority before displaying.
  - `render()` is the single source of truth for DOM output: it fully rebuilds `#task-list` from `tasks`, then updates the priority summary, empty-state visibility, and remaining-count footer. Any state change should mutate `tasks`, call `saveTasks()`, then call `render()` — don't patch the DOM directly outside of `render()`/`startEditing()`.
  - Inline editing (`startEditing`/`editTask`) swaps a task's `<span>` for a temporary `<input>` and guards against concurrent edits via the module-level `editingId`.
  - Theme state persists separately under `todo-theme`; last-used priority persists under `todo-last-priority` so the priority `<select>` defaults to it on reload.

`test.html` is a static visual mockup (hardcoded sample tasks, no shared logic with `script.js`) used for manually eyeballing styling — it is not an automated test and won't reflect changes made only in `script.js`.
