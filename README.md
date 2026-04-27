# GENERATE_NODE

Branch-name generator that turns ticket IDs and descriptors into clean,
copy-ready `git checkout -b` commands. Cyberpunk terminal in dark mode,
engineering-draft on warm vellum in light mode.

Live: <https://generate-node.vercel.app>

## What it does

- Pick a branch type (feature / bugfix / hotfix / release).
- Drop in a ticket ID and a short descriptor — or paste a Jira / Linear /
  GitHub URL and let smart-paste fill the fields.
- See the live `git checkout -b ...` preview, hit Execute, and the command
  lands on your clipboard.
- All naming rules come from per-team **presets** with token-based format
  strings (`{prefix}/{ticket-id}-{short-desc}`, `{prefix}/v{version}-{action}`,
  etc.).

## Features

- **Smart paste** — paste a Jira ticket URL, Linear issue URL, GitHub
  issue/PR URL, or an existing branch name and the generator extracts the
  ticket and descriptor.
- **Command palette (⌘K)** — fuzzy launcher that switches branch types,
  applies presets, reuses past entries, navigates routes, copies the last
  command, and toggles the theme.
- **Reuse from logs** — click any past entry on the Logs page; the Generator
  reopens with that exact input pre-filled.
- **Autocomplete from history** — recent ticket IDs and descriptors surface
  as suggestions as you type.
- **Preset import / export** — share `presets-YYYY-MM-DD.json` with
  teammates; conflict resolution is per-row Skip / Replace / Duplicate.
- **Operator profile** — click the avatar to rename the operator; new log
  entries pick up the new handle.
- **Light + dark themes** — toggle in the header, ⌘K, or follow system
  preference. Both ship as deliberate aesthetics, not inverted palettes.

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind 3 · Zustand 5 ·
React Router 6 · Framer Motion · Radix UI Dialog · Vitest. Deployed to
Vercel.

## Local development

```bash
npm install
npm run dev         # http://localhost:5173
npm run test        # vitest run
npm run typecheck   # tsc --noEmit
npm run build       # tsc -b && vite build → dist/
npm run preview     # serve dist/
```

## Persistence

Everything lives in `localStorage`:

- `branch-cmd-store` — operator, presets, logs, generator input, counters
  (Zustand `persist` v3).
- `branch-cmd-theme` — `'dark'` or `'light'`.

There is no backend. Multi-device "sync" is a JSON file you export and import.

## Deployment

`vercel.json` defines an SPA rewrite so `/registry` and `/logs` resolve on
hard navigation. Vite framework detection handles the build. To swap to a
custom domain, update `VITE_SITE_URL` in `.env.production`, then mirror the
new URL in `public/robots.txt` and `public/sitemap.xml`, and redeploy.

## For AI agents

Read [`AGENTS.md`](./AGENTS.md). It documents architecture, layering rules,
the theming system, footguns, and the canonical map of features → files.

## License

MIT
