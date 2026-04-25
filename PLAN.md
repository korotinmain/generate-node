# Comfort Features — Implementation Plan

Plan for the five comfort features that reduce friction at the input step of
the branch-name workflow. Each feature has a Goal, Scope, Files, Subtasks,
and a Definition of Done checklist that can be ticked off in PRs.

> Read `AGENTS.md` first. The conventions there (layering rules, persistence
> migrations, selector discipline, alias usage) apply throughout this plan and
> are not repeated below.

---

## Suggested implementation order

1. **#1 Smart paste / URL import** — small, high-visibility, builds the
   `parse-source.ts` module reused by #3.
2. **#5 Preset import/export** — independent, small scope, useful immediately.
3. **#3 Reuse from logs** — depends on the parser from #1; introduces the
   `inputSnapshot` field on `LogEntry` and the persist-version bump.
4. **#4 Autocomplete from history** — quality improves once `inputSnapshot`
   is populated by #3.
5. **#2 Command palette** — biggest UI surface; last so it can link directly
   to logs (#3) and recent inputs (#4) without rework.

---

## Shared infrastructure (touched by multiple features)

These are landed once and reused. Don't duplicate them per feature.

### S1. `src/lib/parse-source.ts`

Pure module that takes a free-form string and returns a partial
`GeneratorInput`. Used by #1 (smart paste) and as fallback in #3 (reuse from
logs for entries without a snapshot).

```ts
type ParseResult = {
  ticketId?: string;
  descriptor?: string;
  type?: BranchType;
  source: 'jira' | 'linear' | 'github' | 'branch-name' | 'raw' | 'unknown';
};

parseSource(input: string): ParseResult | null;
```

Recognized patterns:

| Pattern | Example | Extracts |
|---|---|---|
| Jira URL | `https://acme.atlassian.net/browse/PROJ-123` | ticketId |
| Linear URL | `https://linear.app/acme/issue/TEAM-123/login-modal` | ticketId, descriptor |
| GitHub issue/PR URL | `https://github.com/org/repo/issues/42` | ticketId (`#42`) |
| Branch name (reverse) | `feature/PROJ-123-update-login-modal` | type, ticketId, descriptor |
| Bracketed | `[PROJ-123] Update login modal` | ticketId, descriptor |
| Plain | `PROJ-123 Update login modal` | ticketId, descriptor |

Returns `null` only when nothing parseable is found. Empty string → `null`.

### S2. `LogEntry.inputSnapshot` + persist version bump

Add optional `inputSnapshot?: GeneratorInput` to `LogEntry` so reuse (#3) and
autocomplete (#4) can replay exact inputs without lossy reverse-parsing.

- Bump `persist` version `1 → 2` in `useBranchStore`.
- Migration is a no-op (`inputSnapshot` is optional; legacy entries stay valid).
- Update `recordLog` signature to accept the snapshot.
- Update `GeneratorPage.handleExecute` to pass it.

### S3. Global `useGlobalShortcuts` hook (lifts ⌘+Enter and adds ⌘+K)

The existing `⌘+Enter` listener lives inside `GeneratorPage`. The command
palette (#2) needs `⌘+K` *anywhere*. Lift both into a single
`src/hooks/useGlobalShortcuts.ts` mounted in `App.tsx`. Keep `⌘+Enter`
no-op outside `/`. **Do this only when shipping #2** — until then, the
existing local listener is fine.

---

## #1 — Smart paste / URL import

**Goal.** User pastes a Jira/Linear/GitHub URL or raw `TICKET-123 desc`
text into either input and the Generator auto-splits it across the right
fields.

### Scope (in)

- Paste-event interception on the Ticket ID and Descriptor inputs.
- Visible "Smart Paste" hint button below the inputs that opens a small
  textarea (for users who want to paste without picking a field).
- Inline toast when an import succeeds, naming the source
  (`Imported from Jira`).
- "Don't silently overwrite": if both fields already have content, ask
  before replacing — current implementation is a `confirm`-style inline
  banner with `Replace` / `Keep current` buttons.

### Scope (out)

- Fetching ticket titles from Jira/Linear/GitHub (would require auth + CORS).
  Title text comes only from what the user pasted (Linear URL slugs are the
  exception — they include the title).
- OAuth integration with any service.

### Files

- **NEW** `src/lib/parse-source.ts` (see S1)
- **NEW** `src/lib/parse-source.test.ts`
- **NEW** `src/components/generator/SmartPasteHint.tsx` (the textarea affordance)
- **MODIFY** `src/components/generator/` — wire paste-event handler
- **MODIFY** `src/pages/GeneratorPage.tsx` — accept parsed result, conflict prompt

### Subtasks

1. Implement `parseSource` and tests for every pattern in S1.
2. Add `onPaste` handler on Ticket and Descriptor `Input`s — if pasted text
   parses to *more* than one field, prevent default and apply across both.
3. Build `SmartPasteHint` component (collapsible textarea + "Parse" button).
4. Conflict UX: show inline banner when filled fields would be overwritten,
   only fill empties unless user clicks `Replace`.
5. Toast on successful import, naming the source.

### Definition of Done

- [ ] `parseSource` covers all six pattern rows in S1's table.
- [ ] `parse-source.test.ts` has at least one positive case per source plus a
      negative case (`null` for unparseable input, `null` for empty string).
- [ ] Pasting `PROJ-123 Update login modal` into the Ticket input fills *both*
      Ticket and Descriptor (does not put the whole string into Ticket).
- [ ] Pasting a Jira URL fills only Ticket.
- [ ] Pasting a Linear URL fills Ticket and Descriptor (descriptor sourced
      from URL slug, hyphens preserved).
- [ ] Pasting a full branch name (e.g. `bugfix/PROJ-9-x`) updates Type, Ticket,
      and Descriptor.
- [ ] If both target fields are non-empty before paste, user sees a confirm
      banner and nothing is overwritten until they click `Replace`.
- [ ] Successful import shows a toast naming the source.
- [ ] `SmartPasteHint` is keyboard-reachable (Tab order, Enter parses).
- [ ] `npm run typecheck && npm test` passes.
- [ ] Manual smoke test in `npm run dev` with all six paste sources.

---

## #2 — Command palette (⌘+K)

**Goal.** Press `⌘+K` (or `Ctrl+K`) anywhere to open a single search-driven
launcher: switch branch type, jump to a preset, navigate pages, reuse a past
log entry, run quick actions.

### Scope (in)

- Modal overlay (uses existing `Modal` primitive) bound to global `⌘+K`.
- Categories: **Branch type**, **Preset**, **Recent**, **Navigate**, **Action**.
- Fuzzy match across category + label + keywords; results scored and grouped.
- Keyboard: ArrowUp/Down, Enter, Esc, `Cmd+1..9` to jump-execute.
- Empty state with available shortcuts.
- Recent commands ranked first when query is empty.

### Scope (out)

- User-defined commands or extensions.
- Multi-step flows (e.g. "create preset" wizard inside the palette) — those
  stay on Registry.

### Files

- **NEW** `src/components/ui/CommandPalette.tsx`
- **NEW** `src/lib/fuzzy.ts` — tiny ranker (≤ 50 lines, no dependency)
- **NEW** `src/lib/fuzzy.test.ts`
- **NEW** `src/hooks/useGlobalShortcuts.ts` (S3)
- **MODIFY** `src/App.tsx` — mount the palette and the global-shortcuts hook
- **MODIFY** `src/pages/GeneratorPage.tsx` — drop the local `⌘+Enter` listener,
  consume the global one
- **MODIFY** `src/store/useBranchStore.ts` — selector for "recent palette
  commands" if we track them; optional, can defer

### Subtasks

1. `fuzzy.ts`: `score(query, target): number` returning 0 for non-match. Word-
   boundary boost. Tie-break by length.
2. Static command registry: a `getCommands(state, navigate)` function in
   `CommandPalette.tsx` that returns commands derived from the current store
   snapshot (branch types, presets, recent log entries from #3).
3. `CommandPalette` component with keyboard nav, group rendering, focus trap.
4. `useGlobalShortcuts` hook: `⌘+K` opens palette, `⌘+Enter` triggers Generator
   action when on `/`.
5. Mount in `App.tsx`. Remove the local listener from `GeneratorPage`.

### Definition of Done

- [ ] `⌘+K` and `Ctrl+K` open the palette from `/`, `/registry`, and `/logs`.
- [ ] Esc closes; Enter executes the highlighted command; arrows navigate.
- [ ] Typing filters results; empty query shows recents + top-level commands.
- [ ] All four branch types appear as commands ("Switch to feature", etc.).
- [ ] All presets appear as commands; selecting one applies it as active rule.
- [ ] Recent log entries (top 5) appear under "Recent"; selecting one navigates
      to `/` and pre-fills inputs (depends on #3 being landed).
- [ ] Navigation commands cover all routes (Generator, Registry, Logs).
- [ ] Action commands include: Clear inputs, Copy last command.
- [ ] Focus traps inside the modal; closing returns focus to trigger.
- [ ] `aria-role="combobox"` on input, `role="listbox"` on results,
      `aria-selected` on highlighted item.
- [ ] `prefers-reduced-motion` respected — no entrance animation under the
      media query.
- [ ] `fuzzy.test.ts` covers prefix > word-start > substring ranking.
- [ ] Existing `⌘+Enter` still works on Generator (regression check).
- [ ] `npm run typecheck && npm test` passes.

---

## #3 — Reuse from logs

**Goal.** Click a past log row → Generator opens pre-filled with that entry's
type, ticket, and descriptor, ready to tweak and re-run.

### Scope (in)

- "Reuse" action on each log row (icon button + entire-row click target on
  desktop; tap-target on mobile).
- New logs persist `inputSnapshot` (S2).
- Old logs (without snapshot) fall back to `parseSource` (S1) on the
  branch name. The fallback is "best effort" — never throws, partial fills
  are fine.
- Toast "Loaded log into Generator" on success.
- Persistence version bump 1 → 2 with no-op migration.

### Scope (out)

- Editing a log entry in place.
- Replaying with a custom format rule different from the one in use today.

### Files

- **MODIFY** `src/types/index.ts` — add `inputSnapshot?: GeneratorInput` to
  `LogEntry`.
- **MODIFY** `src/store/useBranchStore.ts` — `recordLog` accepts snapshot;
  add `reuseLog(id)` selector that fills inputs and returns a boolean
  success flag; bump persist version.
- **MODIFY** `src/pages/GeneratorPage.tsx` — pass snapshot when calling
  `recordLog`.
- **MODIFY** `src/components/logs/LogsTable.tsx` — add Reuse action.
- **MODIFY** `src/pages/LogsPage.tsx` — handle reuse → navigate to `/`.

### Subtasks

1. Extend `LogEntry` type with `inputSnapshot?: GeneratorInput`.
2. Update `recordLog` to accept and store the snapshot.
3. Update `GeneratorPage.handleExecute` to pass `{ ...input }` when calling
   `recordLog`.
4. Add `reuseLog(id)` to the store: if entry has `inputSnapshot`, set inputs
   directly; else parse from `branchName` via `parseSource` and fill what's
   recoverable.
5. Bump persist version `1 → 2`. Add a `migrate(state, fromVersion)` that
   returns the state unchanged for `fromVersion === 1`.
6. Add Reuse icon button + row click handler in `LogsTable`.
7. On reuse: `navigate('/')` then `reuseLog(id)`, then push toast.

### Definition of Done

- [ ] `LogEntry` type has optional `inputSnapshot`; existing seed logs unchanged.
- [ ] `recordLog` writes the snapshot for newly-generated entries.
- [ ] Each log row has a visible Reuse action with `aria-label` and tooltip.
- [ ] Clicking Reuse navigates to `/`, fills Type + Ticket + Descriptor, and
      shows a toast.
- [ ] For an entry *without* a snapshot, Reuse still fills as much as
      `parseSource` recovers and never throws.
- [ ] `persist.version` bumped to `2` with a `migrate` function that handles
      v1 → v2 (no-op).
- [ ] Manual test: refresh app, ensure pre-existing logs still load and that
      Reuse on them works via parser fallback.
- [ ] Manual test: generate a new branch, refresh, click Reuse on it, fields
      match exactly (snapshot path).
- [ ] Unit tests: `parseSource` fallback path; store action sets fields.
- [ ] `npm run typecheck && npm test` passes.

---

## #4 — Autocomplete from history

**Goal.** As the user types in Ticket ID or Descriptor, suggest recent values
from history. Arrow keys navigate, Enter commits, Esc dismisses.

### Scope (in)

- Inline floating dropdown anchored under the input.
- Source: distinct ticket IDs and distinct descriptors derived from
  `logs[*].inputSnapshot` (preferred) with `parseSource(branchName)` fallback.
- Sort by recency, dedupe case-insensitively, cap at 5 suggestions.
- On focus with empty input → show top 3 recents; on typing → prefix match.
- Keyboard: ArrowDown opens, Up/Down navigate, Enter commits and prevents
  form-default, Tab commits and moves focus, Esc closes.
- Mouse: click commits.

### Scope (out)

- Cross-field correlation ("when ticket is X, descriptor was Y").
- Server-backed suggestions.

### Files

- **NEW** `src/components/ui/Autocomplete.tsx` — wraps existing `Input`,
  receives `suggestions: string[]`, owns open/close + keyboard nav.
- **MODIFY** `src/store/useBranchStore.ts` — add memoizable selector
  helpers `selectRecentTicketIds` and `selectRecentDescriptors`.
- **NEW** `src/lib/history.ts` — pure derivation functions (testable without
  the store).
- **NEW** `src/lib/history.test.ts`
- **MODIFY** `src/pages/GeneratorPage.tsx` — swap two `Input`s for
  `Autocomplete`.

### Subtasks

1. `history.ts`: `recentValues(logs, field, currentInput): string[]` that
   reads `inputSnapshot` first, falls back to `parseSource(branchName)`,
   dedupes case-insensitively, sorts by recency, caps at 5.
2. `Autocomplete` component: anchored absolute positioning, no library, focus
   ring matches the rest of the design.
3. Wire `aria-controls`, `aria-expanded`, `aria-activedescendant` on the
   underlying input; `role="listbox"` on the dropdown.
4. Replace Ticket ID and Descriptor inputs in `GeneratorPage` with
   `Autocomplete`.

### Definition of Done

- [ ] Focusing an empty Ticket input (with at least one prior log) shows up to
      3 recent suggestions.
- [ ] Typing filters to prefix matches (case-insensitive).
- [ ] Up/Down navigates; Enter commits and prevents form submission;
      Tab commits and advances focus; Esc closes.
- [ ] Click on a suggestion commits it.
- [ ] Selection does not duplicate the user's exact current value.
- [ ] Same behavior on the Descriptor input.
- [ ] No layout shift — dropdown is absolutely positioned.
- [ ] `aria-*` attributes correct on input and listbox; verified with screen
      reader (VoiceOver Cmd+F5 walk-through).
- [ ] `prefers-reduced-motion` respected for the open animation.
- [ ] `history.test.ts` covers: snapshot path, parser fallback, dedupe,
      recency sort, cap of 5, exclusion of current input.
- [ ] `npm run typecheck && npm test` passes.

---

## #5 — Preset import/export (JSON)

**Goal.** Teams share a `.json` file with their naming conventions. One click
to export the current presets; one click + file picker to import, with
explicit conflict resolution.

### Scope (in)

- `Export presets` button in Registry header → downloads
  `presets-YYYY-MM-DD.json` with a versioned schema.
- `Import presets` button → modal accepts file drop or paste.
- Schema validation with clear human-readable errors.
- Conflict resolution: per-conflict choice of `Skip`, `Replace`, or
  `Duplicate` (auto-renames `name` with `-imported`).
- Pre-commit summary: "Will import N new, replace M, skip K".

### Scope (out)

- Cloud-hosted preset registry / sharing links.
- Importing logs or operator profile in the same file.

### Files

- **NEW** `src/lib/presets-io.ts` — `exportPresets(presets): Blob`,
  `parseImport(json: string): ParseResult`,
  `mergePresets(existing, incoming, choices): MergeResult`.
- **NEW** `src/lib/presets-io.test.ts`
- **NEW** `src/components/registry/ImportPresetsModal.tsx`
- **MODIFY** `src/pages/RegistryPage.tsx` — add Export and Import buttons.

### JSON schema

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-04-25T12:00:00.000Z",
  "presets": [
    {
      "id": "preset-web",
      "name": "Web App",
      "description": "...",
      "prefixes": ["feature/", "bugfix/"],
      "formatRule": "{prefix}/{ticket-id}-{short-desc}",
      "accent": "cyan",
      "createdAt": "2025-09-12T09:00:00.000Z"
    }
  ]
}
```

Validation (without adding `zod`): hand-rolled type guard with all required
fields and enum checks for `accent`. Reject unknown `schemaVersion`.

### Subtasks

1. `exportPresets`: builds the JSON object, returns a `Blob`. Trigger download
   via a temporary `<a download>`.
2. `parseImport`: parse JSON, validate, return either
   `{ ok: true, presets }` or `{ ok: false, error }`.
3. `mergePresets`: takes existing list + incoming + per-conflict choice map
   keyed by incoming preset `id`; returns the new presets array and a summary.
4. `ImportPresetsModal`: file input + textarea fallback → preview table with
   per-row choice → Apply.
5. Wire Export and Import to Registry header.

### Definition of Done

- [ ] Export downloads a valid JSON file named `presets-YYYY-MM-DD.json`.
- [ ] The JSON validates with `parseImport` (round-trip).
- [ ] Import rejects malformed JSON with a clear inline error and does not
      mutate state.
- [ ] Import rejects mismatched `schemaVersion` (e.g. `2`) with a clear error.
- [ ] Conflicts (matching `id`) shown one per row with `Skip` / `Replace` /
      `Duplicate` controls.
- [ ] Preview summary shows counts before commit.
- [ ] `Duplicate` strategy auto-renames `name` to `<name>-imported` and
      generates a new `id`.
- [ ] After Apply, presets appear in Registry and are persisted via the
      existing store.
- [ ] Toast confirms result with counts.
- [ ] Round-trip equivalence: export → import (with `Replace` on all) yields
      a state where `JSON.stringify(presets)` matches the pre-export value
      modulo ordering.
- [ ] Tests for: export shape, import validation (4 negative cases:
      not-JSON / wrong shape / wrong version / missing required field), and
      each merge strategy.
- [ ] `npm run typecheck && npm test` passes.

---

## Cross-cutting acceptance gates

These apply to **every** feature above and are not repeated in the per-feature
DoDs:

- [ ] No new dependencies unless explicitly justified in the PR description.
- [ ] All new logic in `src/lib/` is pure and unit-tested.
- [ ] All new component files use named exports and `@/` aliases.
- [ ] No use of `any` or non-null assertions (`!`) in new code.
- [ ] `noUnusedLocals` / `noUnusedParameters` clean (build will fail otherwise).
- [ ] Persisted-state changes follow the migration rules in `AGENTS.md` §11.1.
- [ ] Manual UI verification in `npm run dev` at viewport 360px and 1440px
      before declaring done.
- [ ] No regressions in `branch.test.ts` or other existing tests.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Reverse-parsing branch names is lossy for custom format rules | Snapshot-first strategy in #3; parser is fallback only. Document the limitation in the Reuse toast (`Best-effort load — review before executing`). |
| Persist migration v1 → v2 corrupts users with manual edits | Migration is a no-op (only adds an optional field). Add a try/catch around `JSON.parse` in `createJSONStorage`'s implicit deserialize? Already handled by Zustand. |
| Command palette slows initial render | Lazy-import `CommandPalette` via `React.lazy`; mount only when first opened. |
| Autocomplete dropdown z-index conflicts with Modal | Use the same z-index tier as `Modal` (define a token in `tailwind.config.js` if missing) and never render Autocomplete from inside a Modal. |
| Smart paste hijacks legitimate paste into a single field | Intercept whenever `parseSource` returns non-null. URLs and branch names need transformation, and plain `TICKET-1` matches still land in the right slot — only unparseable text (`null`) falls through to native paste. |
