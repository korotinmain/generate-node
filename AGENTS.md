# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in
this repository. Humans should read `README.md` first; this file complements it
with the conventions, invariants, and architectural reasoning that aren't
self-evident from the source.

---

## 1. Project at a glance

**`generate-node`** — a single-page web app that generates Git branch names and
the matching `git checkout -b` command, themed as a cyberpunk terminal. Users
pick a branch type, enter a ticket ID + descriptor, and get a sanitized,
copy-ready command. Per-project naming conventions are stored as **presets** with
configurable token-based format rules.

It is a **client-only app**. There is no backend, no API, no server-side
rendering. All state lives in the browser via `localStorage`.

### What it is *not*

- Not a Git client. It does not exec `git`, talk to a remote, or read a repo.
- Not a multi-user system. There is no auth — `Operator` is a cosmetic profile.
- Not a CLI. The package name is misleading; this is a Vite SPA.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | `react-jsx` runtime, no `React` import needed |
| Build | Vite 6 | `@` alias → `./src` (mirrored in `tsconfig.app.json` and `vite.config.ts`) |
| Styling | Tailwind 3 + custom theme | All design tokens live in `tailwind.config.js`; bespoke utilities in `src/index.css` (`@layer components`) |
| State | Zustand 5 + `persist` middleware | One store per concern; `localStorage` key `branch-cmd-store` |
| Routing | React Router 6 | Three routes: `/`, `/registry`, `/logs` |
| Animation | Framer Motion | Shared variants live in `src/lib/motion.ts` |
| Icons | `lucide-react` | Use the named imports, not the bundle |
| Testing | Vitest + Testing Library + jsdom | Globals enabled, setup at `src/test/setup.ts` |

Node 18+ is assumed (`@types/node` ^22 in devDeps, but no Node runtime code).

---

## 3. Commands

```bash
npm install
npm run dev         # Vite dev server, http://localhost:5173
npm run build       # tsc -b && vite build → dist/
npm run preview     # serve dist/
npm test            # vitest run (single pass, CI-friendly)
npm run test:watch  # vitest watch mode
npm run typecheck   # tsc --noEmit (no build artifacts)
```

Before reporting a task complete, agents should run **`npm run typecheck`** and
**`npm test`** at minimum. `npm run build` doubles as a stricter type-check
because it runs `tsc -b` against `tsconfig.app.json` and `tsconfig.node.json`.

`tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, and
`noUncheckedSideEffectImports` — leaving dead imports or args will fail the
build, not just lint.

---

## 4. Architecture

### 4.1 Directory layout

```
src/
├── App.tsx                    # Router shell + AnimatePresence
├── main.tsx                   # ReactDOM root
├── index.css                  # Tailwind layers + theme primitives (.panel-frame, .corner-frame, glows)
├── components/
│   ├── layout/                # AppShell, TopNav, OsHeader, Sidebar — chrome only, no domain logic
│   ├── ui/                    # Button, Input, Card, Badge, Modal, Avatar, ScanLine, Toast, PageTransition
│   ├── generator/             # BranchTypeSelector, BranchPreview
│   ├── registry/              # StatCard, PresetCard, NewPresetModal
│   └── logs/                  # LogsTable
├── pages/                     # GeneratorPage, RegistryPage, LogsPage — composition only
├── lib/                       # Pure functions: branch, clipboard, format, cn, motion (NO React)
├── hooks/                     # useCountUp
├── store/                     # useBranchStore, useToastStore
├── types/                     # Shared domain types (BranchType, LogEntry, Preset, Operator)
└── test/setup.ts              # Imports jest-dom matchers
```

### 4.2 Layering rules (enforce when touching code)

1. **`lib/` is pure.** No React, no DOM (clipboard.ts is the one exception, and
   it's intentionally framework-agnostic). Anything in `lib/` should be
   unit-testable without rendering.
2. **`store/` owns persisted state.** Components must not call `localStorage`
   directly. Only `useBranchStore` writes via the `persist` middleware.
3. **`components/ui/` is domain-agnostic.** A `Button` knows nothing about
   branches. If you find yourself importing types from `@/types` into `ui/`,
   stop and put the component under `components/<feature>/` instead.
4. **`pages/` compose, never define logic.** Business rules belong in `lib/` or
   `store/`. Pages wire selectors → effects → components.
5. **`types/` is the source of truth for domain shapes.** New domain concepts
   (statuses, branch types) get added here first.

### 4.3 Path aliases

`@/*` maps to `src/*`. **Always import via `@/...`**, never via long relative
paths like `../../lib/branch`. The alias is configured in **two places** —
`vite.config.ts` and `tsconfig.app.json`. If you add a new alias, update both.

### 4.4 Two layout shells

`AppShell` swaps layouts based on `pathname`:

- `/` → centered "terminal" stage with `TopNav` (the marquee generator view).
- everything else → `OsHeader` + `Sidebar` HUD shell.

Don't add chrome inside pages — extend `AppShell` if you need new layout
variants.

---

## 5. Domain model

### 5.1 Core types (`src/types/index.ts`)

```ts
type BranchType = 'feature' | 'bugfix' | 'hotfix' | 'release';
type LogStatus = 'committed' | 'copied' | 'terminated';

interface Preset {
  id: string;
  name: string;
  prefixes: string[];      // e.g. ['feature/', 'bugfix/']
  formatRule: string;      // e.g. '{prefix}/{ticket-id}-{short-desc}'
  accent: 'cyan' | 'magenta' | 'violet';
  // ...
}
```

### 5.2 The branch builder (`src/lib/branch.ts`)

This is the heart of the app. **Read it before changing anything that touches
branch names.** It is the only thing covered by unit tests today
(`src/lib/branch.test.ts`).

Format-rule tokens currently supported:

| Token | Resolves to |
|---|---|
| `{prefix}` | The `BranchType` (feature, bugfix, hotfix, release) |
| `{ticket-id}` | Sanitized ticket id (uppercase, ASCII + hyphens) |
| `{short-desc}` / `{descriptor}` | Sanitized descriptor (lowercase, hyphenated) |
| `{version}` | Digits + dots extracted from descriptor; falls back to `'x'` |
| `{action}` | Alias of sanitized descriptor |
| `{dataset}` | First hyphen-separated token of descriptor |
| `{operation}` | Remaining tokens joined by `-`, falling back to `{dataset}` |

**Invariants the sanitizers enforce — do not weaken:**

- Branch names are lowercase ASCII, separator is `-`, slashes only as path
  delimiters.
- No consecutive `-`, `.`, or `/`.
- No leading or trailing separators.
- Ticket IDs are uppercase, only `[A-Z0-9-]`, no consecutive hyphens.

These mirror the practical subset of `git check-ref-format`. If you add a new
token or relax a rule, **add a test in `branch.test.ts`** in the same PR.

### 5.3 Preset → type matching

`presetForType(presets, type)` returns the first preset whose `prefixes`
contains `${type}/`. The Generator page surfaces the active preset's format
rule above the preview. There is no explicit picker on the Generator — the
match is implicit. Keep that contract: Registry edits the rules, Generator
just reflects them.

---

## 6. State management

### 6.1 Stores

- **`useBranchStore`** — operator profile, generator input, presets, logs,
  counters. Persisted to `localStorage` under `branch-cmd-store` (version 1).
- **`useToastStore`** — ephemeral, **not** persisted. Toasts auto-dismiss via
  `setTimeout`.

### 6.2 Selector discipline

Prefer narrow selectors over destructuring the whole store. This prevents
unrelated re-renders.

```tsx
// Good
const setType = useBranchStore((s) => s.setType);

// Tolerable when you genuinely need both
const { input, presets } = useBranchStore();

// Bad — re-renders on every store change
const store = useBranchStore();
```

### 6.3 Persistence migrations

`persist` is configured with `version: 1`. **Bumping the schema requires a
`migrate` function**, otherwise existing users' saved state will silently
break (or be wiped depending on shape mismatch). When you add or rename a
field on `BranchStore.partialize`, increment the version and write a migration.

### 6.4 IDs

Use `crypto.randomUUID()` when available, fall back to a timestamp+random
string. The helper lives at the top of `useBranchStore.ts` — don't reinvent it
elsewhere.

---

## 7. Styling conventions

### 7.1 Use Tailwind first

The theme already encodes the design system: backgrounds (`bg-bg-panel`),
neon accents (`text-cyber-cyan`, `text-cyber-magenta`), glows
(`shadow-glow-cyan`), and motion keyframes (`animate-pulse-glow`,
`animate-blink`, `animate-scan`). Reach for these before writing custom CSS.

### 7.2 Custom utilities live in `index.css` `@layer components`

`.panel-frame`, `.corner-frame`, `.uppercase-wide`, `.focus-ring`,
`.text-glow-cyan/magenta`. Reuse them — don't reproduce the same
`text-shadow` or border-corner SVGs inline.

### 7.3 Class composition

Use `cn()` from `@/lib/cn` (a `clsx` wrapper). Never concatenate template
strings with conditional class names — `cn` deduplicates and handles
falsy values cleanly.

### 7.4 Accessibility floor

- Every focusable element must show a focus ring (use `.focus-ring` or
  `focus-visible:` Tailwind variants). The base CSS removes the default
  outline, so an unstyled element will be **invisibly focused** otherwise.
- Respect `@media (prefers-reduced-motion)` — the body animation already opts
  out. Do the same for any new looping/pulsing animation.
- Inputs always have a `<label>`; use the existing `Input` component instead
  of bare `<input>` so this stays consistent.

---

## 8. Component conventions

### 8.1 Patterns to follow

- **Named exports**, not defaults. The codebase uses named exports throughout.
- **`forwardRef` for any UI primitive** that wraps a native focusable element
  (see `Button`, `Input`).
- **Variant maps over conditionals.** See `Button` — `VARIANT_CLASS` and
  `SIZE_CLASS` are objects keyed by union types. Type-safe and additions are
  obvious in diffs.
- **`useId()` for label/input wiring** when an explicit `id` is not supplied.
- **No prop drilling beyond two levels** — reach for `useBranchStore` directly.

### 8.2 Animation

Use the shared variants in `src/lib/motion.ts` (`fadeInUp`, `stagger`,
`scaleIn`, `listRow`) and the `EASE_OUT_SOFT` / `EASE_OUT_SHARP` cubic-bezier
constants. Don't hand-roll easing curves per-component — it'll drift.

### 8.3 Keyboard shortcuts

`⌘/Ctrl + Enter` triggers branch generation from anywhere on the Generator
page (window-scoped listener in `GeneratorPage.tsx`). The descriptor input
ALSO listens for plain `Enter` and explicitly skips when the meta/ctrl modifier
is held to avoid double-firing. **Preserve this guard** if you touch the
input's `onKeyDown`.

---

## 9. Testing approach

### 9.1 What is currently tested

`src/lib/branch.test.ts` covers the sanitizers and `buildBranchName` happy
path + a few format-rule variants. **This is the only test file.** When you
fix a bug in `lib/branch.ts`, add a regression test before fixing it.

### 9.2 What to test going forward

Priority for new tests, in order:

1. Anything in `src/lib/` (pure, easy, high leverage).
2. Store actions (`recordLog`, `addPreset`, persistence migrations).
3. Page-level integration (Generator: input → preview → copy flow). Use
   Testing Library; jsdom is configured.
4. UI primitives (`Button`, `Input`) only if behavior is non-trivial — pure
   visual styling is not a useful test target.

### 9.3 Style

- Prefer `expect(...).toBe(...)` over snapshots for branch names — snapshots
  obscure intent.
- Mock the clipboard via `Object.defineProperty(navigator, 'clipboard', ...)`
  if you test the copy flow; do not stub `copyToClipboard` itself unless you're
  testing a caller, not the function.

---

## 10. Coding conventions agents should follow

- **TypeScript is strict.** Don't use `any`. Prefer `unknown` and narrow.
- **Sort imports**: external, then `@/` aliases, then `./` relatives. Type-only
  imports use `import type { ... }`.
- **Comments answer "why".** The codebase already follows this — see the
  comment on `SANITIZE_TRAILING` referencing `git check-ref-format`. Don't
  paraphrase the code.
- **No `console.log` in committed code.** No debug toasts.
- **Don't introduce new state libraries, CSS systems, or routing layers.**
  Zustand + Tailwind + RR6 are the choices; extending them is fine, replacing
  them isn't.
- **Don't add a backend.** If the user asks for one, surface it as a scope
  question — the persistence model and types assume client-only.
- **Don't add dependencies casually.** Each one is a maintenance tax. If a
  utility exists in `lib/`, use it. If 5 lines of code suffice, write 5 lines.

---

## 11. Things to be careful about

These are footguns that have a non-obvious blast radius:

1. **`partialize` in `useBranchStore`.** If you add a field to `BranchStore`
   that should persist, you MUST add it to `partialize`. Forgetting this
   means the field resets on every reload — silent data loss.
2. **`localStorage` key `branch-cmd-store`.** Renaming this orphans every
   user's saved presets/logs without a migration. Don't.
3. **Sanitizers are run at build time, not at typing time.** The Generator
   shows the *un*sanitized input in the editable fields and the *sanitized*
   result in the preview. Don't conflate them — do NOT call `setDescriptor`
   with the sanitized value, or the user can't type a space.
4. **The global `⌘+Enter` listener** is bound on the Generator page only.
   If you add another page that should respond to it, lift the binding into
   `App.tsx` or a hook — don't duplicate the listener.
5. **`framer-motion` + `AnimatePresence`** in `App.tsx` requires unique
   `key` on children. The current `PageTransition` keys by `pathname`. If you
   nest another `AnimatePresence`, give it a distinct key strategy.
6. **`tsconfig.app.json` and `vite.config.ts` both define the `@` alias.**
   They must stay in sync. Same goes for `vitest.config.ts`.
7. **Tailwind `content` glob is `./src/**/*.{ts,tsx}`.** Classes generated
   inside template strings using string concatenation may be purged. Use
   full literal class names or `cn()` with literal strings.

---

## 12. Workflow expectations for agents

- **Read before writing.** Skim `lib/branch.ts`, `store/useBranchStore.ts`,
  and `types/index.ts` before any non-trivial change — they encode most of
  the constraints.
- **Use the path alias.** `@/lib/branch`, not `../../lib/branch`.
- **Verify with the toolchain.** Run `npm run typecheck && npm test` before
  declaring done. For UI changes, also start `npm run dev` and exercise the
  feature in a browser; type-checks don't catch broken layouts.
- **Don't create `*.md` planning docs** unless explicitly asked. Use
  conversation context. The existing `README.md` is the user-facing doc; this
  file is the agent-facing doc; resist the temptation to add more.
- **Match scope.** A bug fix in `sanitizeSegment` does not warrant restructuring
  `lib/branch.ts`. A new feature in `RegistryPage` does not warrant rewriting
  the store.
- **Ask before destructive actions.** Wiping `localStorage`, deleting presets
  in bulk, force-changing the persisted schema — surface and confirm.

---

## 13. Quick reference for common tasks

| Task | Where to start |
|---|---|
| Add a new branch type | `src/types/index.ts` (`BranchType` union + `BRANCH_TYPES` array) → `BranchTypeSelector` → seed presets if needed |
| Add a new format rule token | `buildBranchName` ctx in `src/lib/branch.ts` + add test |
| Add a UI primitive | `src/components/ui/<Name>.tsx`, named export, `forwardRef` if it wraps a native input/button |
| Add a new page | `src/pages/<Name>Page.tsx` → register in `App.tsx` Routes → add nav item to `Sidebar` and/or `TopNav` |
| Add persisted state | Extend `BranchStore` interface → add to initial state → **add to `partialize`** → bump `version` and add migrate if shape changed |
| Style with the theme | `tailwind.config.js` for tokens, `src/index.css` for compound utilities |

---

## 14. Out-of-scope but worth flagging

If a user asks for any of these, treat it as a scope conversation, not a
silent build:

- Server-side persistence / multi-device sync (no backend exists).
- Auth / per-user accounts (`Operator` is cosmetic).
- Direct `git` integration (the app generates a *string*, by design).
- Plugin system for custom format-rule tokens (currently hard-coded in
  `buildBranchName`).
- Theming beyond the cyberpunk palette (Tailwind config is opinionated).
