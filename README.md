# BRANCH_CMD // GENERATE_NODE

Cyberpunk-themed Git branch name generator. Pick a branch type, drop in a ticket
ID and descriptor, and get a sanitized, copy-ready `git checkout -b` command —
all enforced against per-project naming presets.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS 3 (custom neon cyan / magenta theme)
- Zustand (state + `localStorage` persistence)
- Framer Motion (transitions)
- React Router 6
- Lucide icons
- Vitest + Testing Library

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run typecheck  # strict TS
npm run build      # production bundle -> dist/
npm run preview    # serve dist/
```

## Project structure

```
src/
├── App.tsx                    # Router + shell
├── main.tsx                   # React entry
├── index.css                  # Tailwind + theme primitives
├── components/
│   ├── layout/                # TopNav, OsHeader, Sidebar, AppShell
│   ├── ui/                    # Button, Input, Card, Badge, Modal, Avatar, Toast
│   ├── generator/             # BranchTypeSelector, BranchPreview
│   ├── registry/              # StatCard, PresetCard, NewPresetModal
│   └── logs/                  # LogsTable
├── pages/                     # Generator, Registry, Logs
├── lib/                       # branch generator, clipboard, format, cn
├── store/                     # Zustand stores (branch, toast)
└── types/                     # shared domain types
```

## Features

- **Generator** — four branch-type nodes (`feature` / `bugfix` / `hotfix` /
  `release`), live syntax-highlighted preview, `⌘ + Enter` to execute, clipboard
  copy, history autosaved, input sanitization enforces git-safe branch names.
- **Registry** — manage per-module naming presets (Web App, Mobile API, Data
  Engine out of the box). Each preset owns prefix list + format rule. Supported
  tokens: `{prefix}`, `{ticket-id}`, `{short-desc}`, `{version}`, `{action}`,
  `{dataset}`, `{operation}`. Stat cards surface active presets, total branches
  generated, rule violations.
- **Logs** — historical record of every compilation with status (`committed` /
  `copied` / `terminated`), searchable filter, clear-all.

## State & persistence

All user data (operator profile, presets, logs, generator input, counters) is
held in a Zustand store with a `localStorage`-backed persistence middleware,
keyed `branch-cmd-store`. Clear the key to reset the app.

## Testing

Unit tests cover the core sanitizers and `buildBranchName` happy-path plus
validation rules (`src/lib/branch.test.ts`). Run with `npm test`.

## Design deltas vs. mocks

These improvements were folded in during implementation:

1. **Validation feedback** — ticket/descriptor state surfaces inline errors
   (`DESCRIPTOR required`, `TICKET_ID required`) instead of silently disabling
   the button.
2. **Execute button state** — disabled + muted when the command is invalid so
   users can't copy a broken string.
3. **Blinking caret + keyboard shortcut** — `⌘ + Enter` works anywhere on the
   Generator page; hint is shown under the preview.
4. **Status icon in logs** — each row's branch name is prefixed with an icon
   matching its status (committed/copied/terminated) for faster scanning.
5. **Empty states** — Logs and Registry have first-class empty states instead
   of a blank canvas.
6. **Preset format hint** — when a preset matches the current branch type, the
   active format rule is surfaced right above the preview.
7. **Responsive layout** — works down to ~360px; the 4-node selector collapses
   gracefully, the logs table is horizontally scrollable.

## License

MIT
