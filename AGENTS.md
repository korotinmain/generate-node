# AGENTS.md

Canonical guide for AI coding agents (Claude Code, Cursor, Copilot, etc.) working
in this repository. **Start here.** Read this file end-to-end before making
non-trivial changes — it encodes invariants, conventions, and design decisions
that aren't self-evident from the source.

`README.md` is the human-facing intro and stays short. `PLAN.md` is the original
implementation plan and is now historical — every feature in it shipped in
`b0caa1d` and the surrounding commits.

---

## 1. Project at a glance

**`generate-node`** (deployed as **GENERATE_NODE** at
`https://generate-node.vercel.app`) — a single-page web app that generates Git
branch names and the matching `git checkout -b` command, themed as a cyberpunk
terminal in dark mode and an engineering-draft on warm vellum in light mode.
Users pick a branch type, enter a ticket ID + descriptor, and get a sanitized,
copy-ready command. Per-team naming conventions are stored as **presets** with
configurable token-based format rules.

It is a **client-only app**. No backend, no API, no SSR. All state lives in the
browser via `localStorage` under two keys:

- `branch-cmd-store` (Zustand `persist`, version 3) — operator, presets, logs,
  generator input, counters
- `branch-cmd-theme` — the active theme (`'dark' | 'light'`)

### What it is *not*

- Not a Git client. It does not exec `git`, talk to a remote, or read a repo.
- Not a multi-user system. There is no auth — `Operator` is a cosmetic profile
  the user can rename.
- Not a CLI. The package name is misleading; this is a Vite SPA.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | `react-jsx` runtime, no `React` import |
| Build | Vite 6 | `@` alias → `./src` (mirrored in `tsconfig.app.json` + `vite.config.ts` + `vitest.config.ts`) |
| Styling | Tailwind 3 + CSS variables | All colour tokens go through `rgb(var(--name) / <alpha-value>)` so the same utility classes theme automatically |
| State | Zustand 5 + `persist` middleware | Three stores; only `useBranchStore` is persisted via the middleware |
| Routing | React Router 6 | Three routes: `/`, `/registry`, `/logs` |
| Animation | Framer Motion | Shared variants in `src/lib/motion.ts` |
| Modal / Dialog | `@radix-ui/react-dialog` | Wrapped by `src/components/ui/Modal.tsx` — gives focus trap, scroll lock, portal escape from stacking contexts |
| Icons | `lucide-react` | Named imports only |
| Testing | Vitest + Testing Library + jsdom | Globals enabled, setup at `src/test/setup.ts` |
| Deploy | Vercel | `vercel.json` defines an SPA rewrite; Vite preset auto-detected |

Node 18+ is assumed. There is no Node runtime code — `@types/node` is a
build-time dependency only.

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
because it runs `tsc -b` against `tsconfig.app.json` + `tsconfig.node.json`.

`tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, and
`noUncheckedSideEffectImports` — leaving dead imports or args fails the build,
not just lint.

---

## 4. Architecture

### 4.1 Directory layout

```
src/
├── App.tsx                            # Router + AppShell + global shortcuts wiring
├── main.tsx                           # ReactDOM root
├── index.css                          # Tailwind layers + theme primitives + CSS variables
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx               # Layout switcher (TopNav vs OsHeader+Sidebar)
│   │   ├── TopNav.tsx                 # Generator-page header
│   │   ├── OsHeader.tsx               # Registry/Logs header
│   │   ├── Sidebar.tsx                # Registry/Logs left rail
│   │   └── OperatorMenu.tsx           # Avatar → rename modal
│   ├── ui/
│   │   ├── Avatar.tsx                 # Initials badge (non-interactive)
│   │   ├── Autocomplete.tsx           # Combobox wrapping <Input> with suggestion dropdown
│   │   ├── Badge.tsx                  # Status pill
│   │   ├── Button.tsx                 # Variant-mapped button, forwardRef
│   │   ├── Card.tsx                   # Generic panel
│   │   ├── CommandPalette.tsx         # ⌘K palette (Radix-style listbox)
│   │   ├── Input.tsx                  # Labeled input, forwardRef
│   │   ├── Modal.tsx                  # Radix Dialog wrapper with our cyberpunk styling
│   │   ├── PageTransition.tsx         # Framer page wipe between routes
│   │   ├── ScanLine.tsx               # Animated vertical scan inside .panel-frame
│   │   ├── ThemeToggle.tsx            # Sun/Moon button → useThemeStore
│   │   └── ToastViewport.tsx          # Toast renderer
│   ├── generator/
│   │   ├── BranchTypeSelector.tsx     # 4-node radio (feature/bugfix/hotfix/release)
│   │   ├── BranchPreview.tsx          # Live `git checkout -b` preview + Execute button
│   │   ├── PresetPicker.tsx           # Auto/Web App/... chip row
│   │   └── SmartPasteHint.tsx         # Paste-from-clipboard hint button
│   ├── registry/
│   │   ├── StatCard.tsx               # Stat tile on Registry page
│   │   ├── PresetCard.tsx             # Preset display card
│   │   ├── NewPresetModal.tsx         # Create-preset form
│   │   └── ImportPresetsModal.tsx     # JSON file → conflict resolution → merge
│   └── logs/
│       └── LogsTable.tsx              # Logs list with Reuse action
├── pages/
│   ├── GeneratorPage.tsx              # / — composition of generator components
│   ├── RegistryPage.tsx               # /registry — preset CRUD + import/export
│   └── LogsPage.tsx                   # /logs — table + filter + reuse handler
├── lib/
│   ├── branch.ts                      # buildBranchName + sanitizers + presetForType
│   ├── branch.test.ts
│   ├── clipboard.ts                   # navigator.clipboard with execCommand fallback
│   ├── cn.ts                          # clsx wrapper
│   ├── format.ts                      # timestamp formatting
│   ├── fuzzy.ts                       # palette ranker (prefix > word-start > substring > fuzzy)
│   ├── fuzzy.test.ts
│   ├── history.ts                     # recentValues for autocomplete suggestions
│   ├── history.test.ts
│   ├── motion.ts                      # Framer variants and easing constants
│   ├── parse-source.ts                # Smart paste — Jira/Linear/GitHub/branch-name parser
│   ├── parse-source.test.ts
│   ├── presets-io.ts                  # Export/parse/merge presets JSON
│   └── presets-io.test.ts
├── hooks/
│   ├── useCountUp.ts                  # Animated number transitions
│   ├── useDocumentTitle.ts            # Per-route <title> updates
│   └── useGlobalShortcuts.ts          # ⌘K + ⌘+Enter at the App level
├── store/
│   ├── useBranchStore.ts              # Persisted: operator, input, presets, logs, counters
│   ├── useBranchStore.test.ts
│   ├── useThemeStore.ts               # Persisted: 'dark' | 'light' under separate key
│   └── useToastStore.ts               # Ephemeral toasts
├── types/
│   └── index.ts                       # BranchType, LogEntry, Preset, Operator, GeneratorInput
└── test/setup.ts                      # @testing-library/jest-dom matchers
```

### 4.2 Layering rules (enforce when touching code)

1. **`lib/` is pure.** No React, no DOM (clipboard.ts is the one exception, and
   it's intentionally framework-agnostic). Everything in `lib/` should be
   unit-testable without rendering.
2. **`store/` owns persisted state.** Components must not call `localStorage`
   directly. `useBranchStore` writes via Zustand `persist`; `useThemeStore`
   writes a single key by hand to coordinate with the FOUC boot script in
   `index.html`.
3. **`components/ui/` is domain-agnostic.** A `Button` knows nothing about
   branches. If you import from `@/types` into `ui/`, stop and put the
   component under `components/<feature>/` instead.
4. **`pages/` compose, never define logic.** Business rules belong in `lib/` or
   `store/`. Pages wire selectors → effects → components.
5. **`types/` is the source of truth for domain shapes.** New domain concepts
   (statuses, branch types) get added there first.
6. **`hooks/` is the only place for cross-cutting React concerns** (global key
   bindings, document title, count-up animation). Don't sprinkle window
   listeners across pages.

### 4.3 Path aliases

`@/*` → `src/*`. **Always import via `@/...`.** The alias is configured in
**three places** that must stay in sync:

- `tsconfig.app.json` (TypeScript)
- `vite.config.ts` (Vite dev/build)
- `vitest.config.ts` (test runner)

Adding a new alias means updating all three.

### 4.4 Two layout shells

`AppShell` swaps layouts based on `pathname`:

- `/` → centered "terminal" stage with `TopNav` (the marquee Generator view).
- everything else (`/registry`, `/logs`) → `OsHeader` + `Sidebar` HUD shell.

Don't add chrome inside pages — extend `AppShell` if you need new layout
variants. Both shells receive `onOpenPalette` and pass it to their headers so
the ⌘K toggle is reachable from any page.

---

## 5. Routing

| Path | Page | Shell | Document title |
|---|---|---|---|
| `/` | `GeneratorPage` | `TopNav` | `GENERATE_NODE — Git Branch Name Generator` (set in `index.html`) |
| `/registry` | `RegistryPage` | `OsHeader + Sidebar` | `Registry — GENERATE_NODE` (via `useDocumentTitle`) |
| `/logs` | `LogsPage` | `OsHeader + Sidebar` | `Logs — GENERATE_NODE` |
| `*` | `<Navigate to="/" replace />` | — | — |

Page transitions are wrapped in a single `<AnimatePresence mode="wait">` keyed
by pathname so each route gets a clean wipe. If you nest another
`AnimatePresence`, give it a distinct key strategy.

---

## 6. Domain model

### 6.1 Core types (`src/types/index.ts`)

```ts
type BranchType = 'feature' | 'bugfix' | 'hotfix' | 'release';
type LogStatus = 'committed' | 'copied' | 'terminated';

interface GeneratorInput {
  type: BranchType;
  ticketId: string;
  descriptor: string;
  presetId: string | null; // null → auto-resolve via presetForType
}

interface LogEntry {
  id: string;
  timestamp: string; // ISO
  branchName: string;
  author: string;
  authorTag: string;     // 2-char initials
  status: LogStatus;
  type: BranchType;
  inputSnapshot?: GeneratorInput; // captured on recordLog; missing for legacy entries
}

interface Preset {
  id: string;
  name: string;
  description: string;
  prefixes: string[];      // e.g. ['feature/', 'bugfix/']
  formatRule: string;      // e.g. '{prefix}/{ticket-id}-{short-desc}'
  accent: 'cyan' | 'magenta' | 'violet';
  createdAt: string;
}

interface Operator {
  handle: string;
  authLevel: string;
}
```

### 6.2 The branch builder (`src/lib/branch.ts`)

This is the heart of the app. **Read it before changing anything that touches
branch names.** Covered by `src/lib/branch.test.ts`.

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

### 6.3 Preset selection

Two paths:

1. **Explicit pick.** `GeneratorInput.presetId` holds a preset id when the user
   selects one via the `PresetPicker` chips on the Generator page or via the
   command palette ("Apply preset: …" actions).
2. **Auto-match by type.** When `presetId` is `null`, `presetForType(presets,
   type)` returns the first preset whose `prefixes` array contains
   `${type}/`. This is the default ("Auto" chip).

`GeneratorPage.activePreset = explicitPreset ?? autoPreset`. The active
preset's `formatRule` is fed into `buildBranchName`. **Components must not
reach for a preset without going through this resolution.**

---

## 7. Feature inventory

This list maps every shipped feature to its primary files. Use it as a
"where do I look?" reference.

| Feature | Files |
|---|---|
| **Generator core** — type, ticket, descriptor → `git checkout -b ...` | `pages/GeneratorPage.tsx`, `lib/branch.ts`, `components/generator/*` |
| **Smart Paste** — paste a Jira/Linear/GitHub URL or branch name to auto-fill fields | `lib/parse-source.ts`, `components/generator/SmartPasteHint.tsx`, paste handlers in `GeneratorPage` |
| **Command palette (⌘K)** — fuzzy launcher: switch type, apply preset, reuse log, navigate, run actions, toggle theme | `components/ui/CommandPalette.tsx`, `lib/fuzzy.ts`, `hooks/useGlobalShortcuts.ts` |
| **Reuse from logs** — click a row → Generator pre-fills with that entry's input | `LogEntry.inputSnapshot`, `useBranchStore.reuseLog`, `components/logs/LogsTable.tsx`, `pages/LogsPage.tsx`. Falls back to `parseSource(branchName)` when an entry has no snapshot. |
| **Autocomplete from history** — recent ticket IDs / descriptors as suggestions under inputs | `components/ui/Autocomplete.tsx`, `lib/history.ts` |
| **Preset import/export** — share `presets-YYYY-MM-DD.json` files between teams; per-conflict Skip/Replace/Duplicate | `lib/presets-io.ts`, `components/registry/ImportPresetsModal.tsx`, Export button in `RegistryPage` |
| **Preset picker** — chip row on Generator: Auto + one chip per preset | `components/generator/PresetPicker.tsx` |
| **Operator rename** — clickable avatar opens a modal to set `operator.handle` | `components/layout/OperatorMenu.tsx`, `useBranchStore.setOperator` |
| **Theme system** — light + dark with FOUC-safe boot, ⌘K command, header toggle | `useThemeStore`, `components/ui/ThemeToggle.tsx`, `<script>` in `index.html`, CSS vars in `src/index.css` |
| **SEO surface** — title, OG, Twitter, JSON-LD, sitemap, robots, manifest, OG image | `index.html` `<head>`, `public/sitemap.xml`, `public/robots.txt`, `public/manifest.webmanifest`, `public/og-image.svg`, `public/apple-touch-icon.svg`, `.env.production` |
| **Vercel SPA routing** | `vercel.json` |

---

## 8. State management

### 8.1 Stores

| Store | Persistence | Contents |
|---|---|---|
| `useBranchStore` | Zustand `persist` → `localStorage['branch-cmd-store']` v3 | `operator`, `input`, `presets`, `logs`, `ruleViolations`, `generationCount` |
| `useThemeStore` | Hand-managed → `localStorage['branch-cmd-theme']` | `theme: 'dark' \| 'light'` |
| `useToastStore` | Ephemeral, **not** persisted | toast queue with auto-dismiss |

### 8.2 Selector discipline

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

### 8.3 Persistence: `useBranchStore`

- `version: 3`. **There is currently no `migrate` function** because the
  one-shot v2 → v3 cleanup (drop seed logs, deflate generationCount) has shipped.
- Persisted shape is whatever `partialize` returns: `operator`, `input`,
  `presets`, `logs`, `ruleViolations`, `generationCount`.
- **If you add a field that should persist, add it to `partialize`.** Forgetting
  this means the field resets on every reload — silent data loss.
- **If you change a persisted shape**, bump `version` AND write a `migrate`
  function. Without one, persisted state at a different version is discarded.

### 8.4 Persistence: `useThemeStore`

The theme is intentionally outside `useBranchStore` because of FOUC. The store
calls `localStorage.setItem('branch-cmd-theme', ...)` and writes
`document.documentElement.dataset.theme` directly. The inline `<script>` in
`index.html` runs before the stylesheet and reads the same key, so the right
`data-theme` is set before paint.

Don't migrate or rename the `branch-cmd-theme` key without also updating the
inline script.

### 8.5 IDs

Use the `generateId()` helper at the top of `useBranchStore.ts`:
`crypto.randomUUID()` when available, falling back to a timestamp+random
string. Don't reinvent it elsewhere.

---

## 9. Theming system

This is the most non-obvious part of the codebase. Read it before touching
colour, shadow, or panel styling.

### 9.1 Two palettes, one set of utilities

Every Tailwind colour token resolves through a CSS variable:

```js
// tailwind.config.js
'cyber-cyan': 'rgb(var(--cyber-cyan) / <alpha-value>)'
```

Both palettes live in `src/index.css` under selectors:

```css
:root, [data-theme='dark'] { /* neon */ }
[data-theme='light']        { /* drafting paper */ }
```

So `text-cyber-cyan` resolves to `#3BF5FF` in dark and `#09566E` in light
without any per-theme branching at the call site.

### 9.2 Composed glow variables

Glow shadows are not Tailwind utilities directly — they're composed
multi-value CSS variables that completely change shape between themes:

| Variable | Dark behaviour | Light behaviour |
|---|---|---|
| `--glow-text-cyan` / `--glow-text-magenta` | Multi-stop neon bloom | Single 1px letterpress depth |
| `--glow-line-connector` | 8px cyan halo on the type-selector connector | `none` |
| `--glow-node-pulse` | 24px cyan halo around active type | Tight ink ring + soft drop |
| `--glow-active-label` | Multi-stop cyan text shadow | 1px paper-tone highlight |
| `--panel-bg`, `--panel-border`, `--panel-shadow`, `--corner-color` | Translucent panel + faint borders | Cream gradient + hairline ink + soft drop + crisp corner brackets |

Components reference these via `style={{ boxShadow: 'var(--glow-...)' }}` or
through the helper classes `.text-glow-cyan`, `.text-glow-magenta`,
`.panel-frame`, `.corner-frame`. **Don't hard-code rgba shadows in
components** — they won't theme.

### 9.3 Light theme aesthetic — drafting paper

Light mode is **not** "dark mode with inverted colours". It commits to a
different idiom: **engineering drafts on warm vellum**.

- Background: warm vellum (`#F8F4E8`), not cool grey.
- Panels: cream paper with hairline ink border + 1px white inset highlight + a
  soft drop shadow — gives card-stock feel.
- Inks: deep printer teal (`#09566E`), rose ink (`#A8265C`), warm graphite
  text (`#1C1812`).
- Body atmosphere: SVG noise grain (multiplied at 5%) + amber/rose washes
  (sun-on-paper feel) + graphite dot grid.
- Glows are replaced with letterpress depth — **never** add bloom shadows in
  light mode.

When you add a new visual element, picture it on cream paper as much as on
black glass. If something only works in one theme, it's the wrong shape.

### 9.4 FOUC prevention

`index.html` has an inline `<script>` in `<head>` that runs synchronously,
reads `localStorage['branch-cmd-theme']`, falls back to
`prefers-color-scheme`, and writes `document.documentElement.dataset.theme`
before the stylesheet evaluates. Without it, every reload would flash the
dark-mode default.

If you add new CSS variable tokens, ensure they exist in BOTH `[data-theme]`
blocks. Missing a value in one will fall back to `:root`'s value (which
matches dark) and leak the wrong colour into light mode.

---

## 10. Styling conventions

### 10.1 Use Tailwind first

The theme already encodes the design system: backgrounds (`bg-bg-panel`,
`bg-bg-preview`), accents (`text-cyber-cyan`, `text-cyber-magenta`), glows
(`shadow-glow-cyan`), and motion keyframes (`animate-pulse-glow`,
`animate-blink`, `animate-scan`). Reach for these before writing custom CSS.

### 10.2 Custom utilities live in `index.css` `@layer components`

`.panel-frame`, `.corner-frame`, `.uppercase-wide`, `.focus-ring`,
`.text-glow-cyan/magenta`. Reuse them — don't reproduce the same `text-shadow`
or border-corner SVGs inline.

### 10.3 Class composition

Use `cn()` from `@/lib/cn` (a `clsx` wrapper). Never concatenate template
strings with conditional class names — `cn` deduplicates and handles falsy
values cleanly.

### 10.4 Accessibility floor

- Every focusable element must show a focus ring (use `.focus-ring` or
  `focus-visible:` Tailwind variants). The base CSS removes the default
  outline, so an unstyled element is **invisibly focused** otherwise.
- Respect `@media (prefers-reduced-motion)` — the body animation already opts
  out. Do the same for any new looping/pulsing animation.
- Inputs always have a `<label>`; use the existing `Input` or `Autocomplete`
  components instead of bare `<input>`.

---

## 11. Component conventions

### 11.1 Patterns to follow

- **Named exports**, not defaults.
- **`forwardRef` for any UI primitive** that wraps a native focusable element
  (see `Button`, `Input`, `Autocomplete`).
- **Variant maps over conditionals.** See `Button`'s `VARIANT_CLASS` and
  `SIZE_CLASS` — type-safe and additions are obvious in diffs.
- **`useId()` for label/input wiring** when an explicit `id` is not supplied.
- **No prop drilling beyond two levels** — reach for `useBranchStore` /
  `useThemeStore` directly.

### 11.2 Modal / Dialog

`src/components/ui/Modal.tsx` wraps `@radix-ui/react-dialog`. Use this for
every overlay — it portals to `document.body` (escapes stacking contexts from
`backdrop-blur` parents like the TopNav), provides focus trap + scroll lock +
Esc + click-outside, and keeps Framer's enter/exit animations alive via
`forceMount` + `AnimatePresence`. **Do not** roll your own fixed-positioned
modal.

### 11.3 Animation

Use the shared variants in `src/lib/motion.ts` (`fadeInUp`, `stagger`,
`scaleIn`, `listRow`) and the `EASE_OUT_SOFT` / `EASE_OUT_SHARP` cubic-bezier
constants. Don't hand-roll easing curves per-component — it'll drift.

### 11.4 Toasts

`useToastStore.push({ message, variant: 'success' | 'error' | 'info' })`.
Auto-dismiss after `durationMs` (default 2800). The viewport mounts in
`App.tsx` — pages just push.

---

## 12. Keyboard shortcuts

| Keys | Where | Effect |
|---|---|---|
| `⌘/Ctrl + K` | Anywhere | Toggles command palette (open ↔ close) |
| `⌘/Ctrl + Enter` | Anywhere on `/` | Generates and copies the branch name. Skipped while palette is open. |
| `Enter` | Descriptor input on `/` | Same as ⌘+Enter — convenience for the form-flow |
| `↑ / ↓` | Inside palette, autocomplete | Navigate suggestions |
| `Enter` | Inside palette | Run highlighted command |
| `Tab` | Inside palette | Trapped — focus stays in palette |
| `Tab` | On autocomplete with active suggestion | Commit suggestion + advance focus |
| `Esc` | Modals / palette / autocomplete | Close |

**`⌘+Enter` lives in `useGlobalShortcuts`** which dispatches a
`generator:execute` `CustomEvent`. `GeneratorPage` listens for it and calls
`handleExecute`. **Don't add another window-level `keydown` listener for the
same chord** — extend the hook instead.

---

## 13. Testing approach

### 13.1 Coverage today

6 test files, 72 tests total:

- `src/lib/branch.test.ts` — sanitizers + `buildBranchName`
- `src/lib/parse-source.test.ts` — Jira/Linear/GitHub/branch-name parsing
- `src/lib/fuzzy.test.ts` — score ranking, `rank` filtering
- `src/lib/history.test.ts` — recent-values derivation, dedup, recency, cap
- `src/lib/presets-io.test.ts` — export shape, parse negatives, merge strategies
- `src/store/useBranchStore.test.ts` — `recordLog`, `reuseLog` snapshot + parser fallback

### 13.2 What to test going forward

Priority for new tests, in order:

1. Anything in `src/lib/` (pure, easy, high leverage).
2. Store actions (`addPreset`, `setPresets`, `setOperator`, `setTheme`,
   persistence migrations).
3. Page-level integration (Generator: input → preview → copy flow). Use
   Testing Library; jsdom is configured.
4. UI primitives only if behaviour is non-trivial (`Autocomplete`'s keyboard
   nav is a good candidate). Pure visual styling is not a useful test target.

### 13.3 Style

- Prefer `expect(...).toBe(...)` over snapshots — snapshots obscure intent.
- Mock the clipboard via `Object.defineProperty(navigator, 'clipboard', ...)`
  if you test the copy flow; do not stub `copyToClipboard` itself unless
  you're testing a caller.

---

## 14. Deployment

### 14.1 Vercel configuration

`vercel.json` defines a single SPA rewrite:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

Without this, direct visits to `/registry` and `/logs` 404 because Vercel
serves the static `dist/` tree literally. The rewrite hands every unknown
path to `index.html` so React Router takes over client-side. Vite framework
detection handles `npm run build` and `dist/` automatically — don't override
in the Vercel UI unless something genuinely changes.

### 14.2 SEO and social previews

All meta tags are in `index.html` so social bots (Slack, Facebook, Twitter,
LinkedIn) see them in the initial HTML — they don't render React. Open Graph,
Twitter Card, canonical, and JSON-LD `SoftwareApplication` schema all
reference `%VITE_SITE_URL%` which Vite substitutes at build time.

To change the canonical URL (e.g., custom domain swap):

1. Update `VITE_SITE_URL` in `.env.production` (or override in Vercel project
   settings).
2. Update `Sitemap:` line in `public/robots.txt`.
3. Update `<loc>` entries in `public/sitemap.xml`.
4. Redeploy.

### 14.3 Static assets in `public/`

| File | Purpose |
|---|---|
| `favicon.svg` | Browser tab icon |
| `apple-touch-icon.svg` | iOS home-screen icon |
| `og-image.svg` | 1200×630 social share card |
| `manifest.webmanifest` | PWA-style identity |
| `robots.txt` | Allow all + sitemap pointer |
| `sitemap.xml` | Three SPA routes with priority weighting |

If you add a route, add it to `sitemap.xml`. If you change the brand colour,
update `theme-color` meta tags in `index.html` for both light and dark
`prefers-color-scheme` queries.

---

## 15. Coding conventions

- **TypeScript is strict.** Don't use `any`. Prefer `unknown` and narrow.
- **Sort imports**: external, then `@/` aliases, then `./` relatives.
  Type-only imports use `import type { ... }`.
- **Comments answer "why".** Don't paraphrase the code. The existing
  `branch.ts` comments referencing `git check-ref-format` are the right shape.
- **No `console.log` in committed code.** No debug toasts.
- **Don't introduce new state libraries, CSS systems, or routing layers.**
  Zustand + Tailwind + RR6 are the choices; extending them is fine, replacing
  them isn't.
- **Don't add a backend.** If the user asks for one, surface it as a scope
  question — the persistence model and types assume client-only.
- **Don't add dependencies casually.** Each one is a maintenance tax. Recent
  additions (`@radix-ui/react-dialog`) earned their place by solving a real
  problem (stacking-context portal); don't repeat that pattern lightly.

---

## 16. Footguns

These are non-obvious pitfalls with high blast radius:

1. **`partialize` in `useBranchStore`.** If you add a field to `BranchStore`
   that should persist, you MUST add it to `partialize`. Forgetting this
   means the field resets on every reload — silent data loss.
2. **`localStorage` keys `branch-cmd-store` and `branch-cmd-theme`.** Renaming
   either orphans every user's saved state without a migration. Don't.
3. **The theme key is read by an inline script** in `index.html`. If you
   change the storage key in `useThemeStore`, change it in the inline script
   too — they must match.
4. **Sanitizers run at build time, not at typing time.** The Generator shows
   *un*sanitized input in the editable fields and the *sanitized* result in
   the preview. Don't conflate them — do NOT call `setDescriptor` with the
   sanitized value, or the user can't type a space.
5. **`⌘+Enter` is global, dispatched as a custom event.** `useGlobalShortcuts`
   fires `generator:execute`; `GeneratorPage` listens. Don't add a second
   window listener — extend the hook.
6. **Hardcoded `rgba(...)` shadows don't theme.** If you write
   `style={{ boxShadow: 'rgba(59, 245, 255, 0.5)' }}` it stays neon cyan in
   light mode. Use `var(--glow-...)` or theme-aware Tailwind tokens.
7. **`framer-motion` + `AnimatePresence` need unique keys.** The current
   `PageTransition` keys by `pathname`. If you nest another `AnimatePresence`,
   give it a distinct key strategy.
8. **`@` alias is defined in three configs.** `tsconfig.app.json`,
   `vite.config.ts`, `vitest.config.ts`. They must stay in sync.
9. **Tailwind `content` glob is `./src/**/*.{ts,tsx}`.** Classes generated
   by string concatenation may be purged. Use full literal class names or
   `cn()` with literal strings.
10. **Modal portals to body.** This is intentional — TopNav's
    `backdrop-blur-md` creates a stacking context that traps fixed children.
    Don't "fix" the Modal by removing the portal.
11. **CSS variables must exist in both `[data-theme]` blocks.** Missing one
    leaks the other theme's value silently.

---

## 17. Quick reference for common tasks

| Task | Where to start |
|---|---|
| Add a new branch type | `src/types/index.ts` (`BranchType` union + `BRANCH_TYPES` array) → `BranchTypeSelector` → seed presets if needed |
| Add a new format-rule token | `buildBranchName` ctx in `src/lib/branch.ts` + add test |
| Add a UI primitive | `src/components/ui/<Name>.tsx`, named export, `forwardRef` if it wraps a native input/button |
| Add a new page | `src/pages/<Name>Page.tsx` → register in `App.tsx` Routes → add nav item to `Sidebar` and/or `TopNav` → add to `public/sitemap.xml` → add `useDocumentTitle` |
| Add persisted state | Extend `BranchStore` interface → add to initial state → **add to `partialize`** → bump `version` and write a `migrate` if shape changed |
| Add a palette command | `getCommands` in `CommandPalette.tsx` — push a new `PaletteCommand` with `group`, `label`, `keywords`, `run` |
| Add a global shortcut | Extend `useGlobalShortcuts` — don't add a second window listener |
| Add a colour token | `src/index.css` (both `[data-theme='dark']` and `[data-theme='light']` blocks) → `tailwind.config.js` `colors` section using `rgb(var(--name) / <alpha-value>)` |
| Add a new modal | Wrap with `<Modal open onClose title>` from `@/components/ui/Modal` — never re-implement the overlay |
| Add a Smart Paste source | New regex + branch in `parseSource` (`src/lib/parse-source.ts`) + add `SOURCE_LABEL` entry + add test |
| Add a recent-values selector | `src/lib/history.ts` exports `recentValues(logs, field, query, limit)` — extend with new field types if needed |
| Style with the theme | `tailwind.config.js` for tokens, `src/index.css` for compound utilities and CSS variables |

---

## 18. Workflow expectations for agents

- **Read before writing.** Skim `lib/branch.ts`, `store/useBranchStore.ts`,
  `types/index.ts`, and Section 9 (Theming) before any non-trivial change.
- **Use the path alias.** `@/lib/branch`, not `../../lib/branch`.
- **Verify with the toolchain.** Run `npm run typecheck && npm test` before
  declaring done. For UI changes, also start `npm run dev` and exercise the
  feature in a browser; type-checks don't catch broken layouts. **For
  light-theme changes, test BOTH themes** — toggle ⌘K → "Switch to … theme".
- **Don't create planning `*.md` files** unless explicitly asked. Use
  conversation context.
- **Match scope.** A bug fix in `sanitizeSegment` does not warrant
  restructuring `lib/branch.ts`. A new feature in `RegistryPage` does not
  warrant rewriting the store.
- **Ask before destructive actions.** Wiping `localStorage`, deleting presets
  in bulk, force-changing the persisted schema — surface and confirm.

---

## 19. Out of scope

If a user asks for any of these, treat it as a scope conversation, not a
silent build:

- **Server-side persistence / multi-device sync.** No backend exists. The
  whole architecture (localStorage, FOUC boot script, file-based preset
  sharing) is built around local-first.
- **Auth / per-user accounts.** `Operator` is cosmetic.
- **Direct `git` integration.** The app generates a *string*, by design.
- **Plugin system for custom format-rule tokens.** Currently hard-coded in
  `buildBranchName`.
- **Theming beyond the two ships.** Dark cyberpunk and light drafting-paper
  are coherent design decisions; adding more themes dilutes the identity.

`PLAN.md` listed five flagship features (Smart Paste, Command Palette, Reuse
from logs, Autocomplete, Preset I/O) that have all shipped. New feature
requests should propose a similarly tight scope or expect pushback.
